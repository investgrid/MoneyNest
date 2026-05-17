/**
 * MoneyNest — js/supabase-auth.js  v2.0
 * Production-ready Supabase Auth: email/password, Google, Apple,
 * session management, profile sync, rate limiting, duplicate prevention.
 */
;(function () {
  'use strict';

  const SUPABASE_URL      = 'https://jwddciqqhmfkbqhdrfre.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3ZGRjaXFxaG1ma2JxaGRyZnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NjkyMjcsImV4cCI6MjA5NDM0NTIyN30.Gqz39AWpW1BkWXhfhnR_vOUYUy93bgdSNvBfXYQ3VGk';

  const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken:     true,
      persistSession:       true,
      detectSessionInUrl:   true,
      storageKey:           'mn_supabase_session',
    },
  });

  // ─── Internal state ──────────────────────────────────────────────
  let _session      = null;
  let _profile      = null;
  let _initialized  = false;
  let _onAuthChange = null;

  // ─── Client-side rate limiting ───────────────────────────────────
  // Prevents brute force and spam from the browser.
  const _rl = {
    attempts: {},
    check(key, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
      const now   = Date.now();
      const entry = this.attempts[key] || { count: 0, firstAt: now };
      if (now - entry.firstAt > windowMs) {
        this.attempts[key] = { count: 1, firstAt: now };
        return true;
      }
      if (entry.count >= maxAttempts) return false;
      entry.count++;
      this.attempts[key] = entry;
      return true;
    },
    reset(key) { delete this.attempts[key]; },
  };


  // ════════════════════════════════════════════════════════════════
  //  INIT
  // ════════════════════════════════════════════════════════════════

  async function init() {
    if (_initialized) return;
    _initialized = true;

    // Restore existing session
    const { data: { session } } = await sb.auth.getSession();
    _session = session;
    if (_session) await _syncProfileToLocal(_session.user);

    // Handle OAuth callback (Google/Apple return URL)
    await _handleOAuthCallback();

    // Listen for all auth events
    sb.auth.onAuthStateChange(async (event, session) => {
      _session = session;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session) await _syncProfileToLocal(session.user);
      }

      if (event === 'SIGNED_OUT') {
        _profile = null;
        // Clear local auth state but preserve financial data
        if (window.MNAuth) {
          window.MNAuth.patchUser({ email: null, supabaseId: null });
        }
      }

      if (event === 'PASSWORD_RECOVERY') {
        // User clicked reset link — show password update UI
        _triggerPasswordRecoveryUI();
      }

      if (_onAuthChange) _onAuthChange(event, session);
    });
  }


  // ════════════════════════════════════════════════════════════════
  //  EMAIL / PASSWORD
  // ════════════════════════════════════════════════════════════════

  async function signUp(email, password, displayName) {
    if (!_rl.check(`signup:${email}`, 3, 10 * 60 * 1000)) {
      throw Object.assign(new Error('Demasiados intentos. Espera unos minutos.'), { code: 'rate_limited' });
    }

    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}${location.pathname}?action=confirm-email`,
        data: { display_name: displayName || null },
      },
    });

    if (error) {
      if (error.message?.includes('already registered') || error.status === 422) {
        throw Object.assign(new Error('Este email ya está registrado.'), { code: 'email_exists' });
      }
      throw error;
    }

    if (data.user) {
      await _ensureProfile(data.user.id, email, displayName);
      if (data.session) await _syncProfileToLocal(data.user);
    }

    _rl.reset(`signup:${email}`);
    return data;
  }

  // ── OTP: verify email with 6-digit code ─────────────────────────
  async function verifyEmailOtp(email, token) {
    if (!_rl.check(`otp:${email}`, 5, 15 * 60 * 1000)) {
      throw Object.assign(new Error('Demasiados intentos. Espera unos minutos.'), { code: 'rate_limited' });
    }
    const { data, error } = await sb.auth.verifyOtp({ email, token, type: 'email' });
    if (error) throw error;
    if (data.user) await _syncProfileToLocal(data.user);
    return data;
  }

  // ── OTP: resend verification email ──────────────────────────────
  async function resendVerificationEmail(email) {
    if (!_rl.check(`resend:${email}`, 3, 5 * 60 * 1000)) {
      throw Object.assign(new Error('Espera unos minutos antes de reenviar.'), { code: 'rate_limited' });
    }
    const { error } = await sb.auth.resend({ type: 'signup', email });
    if (error) throw error;
  }

  async function signIn(email, password) {
    if (!_rl.check(`signin:${email}`, 5, 15 * 60 * 1000)) {
      throw Object.assign(new Error('Demasiados intentos fallidos. Espera 15 minutos.'), { code: 'rate_limited' });
    }

    const { data, error } = await sb.auth.signInWithPassword({ email, password });

    if (error) {
      const msg = error.message || '';
      if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
        throw Object.assign(new Error('Email o contraseña incorrectos.'), { code: 'invalid_credentials' });
      }
      if (msg.includes('Email not confirmed')) {
        throw Object.assign(new Error('Confirma tu email antes de entrar. Revisa tu bandeja de entrada.'), { code: 'email_not_confirmed' });
      }
      throw error;
    }

    _rl.reset(`signin:${email}`);
    if (data.user) await _syncProfileToLocal(data.user);
    return data;
  }

  async function signOut() {
    await sb.auth.signOut();
    _session = null;
    _profile = null;
  }

  async function resetPassword(email) {
    if (!_rl.check(`reset:${email}`, 3, 60 * 60 * 1000)) {
      throw Object.assign(new Error('Demasiadas solicitudes. Espera 1 hora.'), { code: 'rate_limited' });
    }

    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}${location.pathname}?action=reset-password`,
    });
    if (error) throw error;
  }

  async function updatePassword(newPassword) {
    const { data, error } = await sb.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return data;
  }


  // ════════════════════════════════════════════════════════════════
  //  OAUTH — GOOGLE & APPLE
  // ════════════════════════════════════════════════════════════════

  async function signInWithGoogle() {
    const { data, error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo:   `${location.origin}${location.pathname}?action=oauth-callback`,
        queryParams:  { access_type: 'offline', prompt: 'consent' },
        scopes:       'openid email profile',
      },
    });
    if (error) throw error;
    return data;
  }

  async function signInWithApple() {
    const { data, error } = await sb.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${location.origin}${location.pathname}?action=oauth-callback`,
        scopes:     'name email',
      },
    });
    if (error) throw error;
    return data;
  }

  async function _handleOAuthCallback() {
    const params = new URLSearchParams(location.search);
    const action = params.get('action');

    if (action === 'oauth-callback') {
      // Supabase SDK already handles the token exchange via detectSessionInUrl.
      // We just clean the URL.
      history.replaceState({}, '', location.pathname);
      return;
    }

    if (action === 'reset-password') {
      // Session is set by Supabase from the URL hash automatically.
      // Trigger the password update modal.
      history.replaceState({}, '', location.pathname);
      // Give SDK time to process the session from URL
      setTimeout(() => _triggerPasswordRecoveryUI(), 400);
      return;
    }

    if (action === 'confirm-email') {
      history.replaceState({}, '', location.pathname);
      if (window.toast) toast('✅ Email confirmado. Ya puedes iniciar sesión.', 'success');
      return;
    }
  }

  function _triggerPasswordRecoveryUI() {
    // Open auth modal in a special 'update-password' mode
    if (window.MNAuthUI) {
      window.MNAuthUI.showAuthModal('update-password');
    }
  }


  // ════════════════════════════════════════════════════════════════
  //  PROFILE MANAGEMENT
  // ════════════════════════════════════════════════════════════════

  async function _ensureProfile(userId, email, displayName) {
    // Try to fetch existing profile first
    const { data: existing, error: fetchErr } = await sb
      .from('profiles')
      .select('id, plan, trial_ends_at, pro_trial_ends_at, pro_trial_used, stripe_customer_id, display_name, avatar_url, provider')
      .eq('id', userId)
      .maybeSingle();

    if (fetchErr && fetchErr.code !== 'PGRST116') {
      console.warn('[MNSupabaseAuth] Profile fetch error:', fetchErr.message);
    }

    if (existing) {
      _profile = existing;
      return existing;
    }

    // Create new profile — trigger should have done this, but fallback
    const trialEndsAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { data: created, error: insertErr } = await sb
      .from('profiles')
      .insert({
        id:            userId,
        email:         email,
        plan:          'trial',
        trial_ends_at: trialEndsAt,
        display_name:  displayName || null,
      })
      .select()
      .single();

    if (insertErr) {
      // Might be a race condition — try fetching again
      const { data: retry } = await sb.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (retry) { _profile = retry; return retry; }
      console.warn('[MNSupabaseAuth] Profile create error:', insertErr.message);
      // Return minimal profile to prevent crash
      const minimal = { id: userId, email, plan: 'trial', trial_ends_at: trialEndsAt };
      _profile = minimal;
      return minimal;
    }

    _profile = created;
    return created;
  }

  async function getProfile(forceRefresh = false) {
    if (!_session) return null;
    if (_profile && !forceRefresh) return _profile;

    const { data, error } = await sb
      .from('profiles')
      .select('*')
      .eq('id', _session.user.id)
      .single();

    if (error) return _profile;
    _profile = data;
    return _profile;
  }

  async function updateProfile(fields) {
    if (!_session) throw new Error('No session');
    const { data, error } = await sb
      .from('profiles')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', _session.user.id)
      .select()
      .single();
    if (error) throw error;
    _profile = data;
    // Also update Supabase user metadata if display_name changed
    if (fields.display_name) {
      await sb.auth.updateUser({ data: { display_name: fields.display_name } });
    }
    return data;
  }


  // ════════════════════════════════════════════════════════════════
  //  SYNC: Supabase → MNAuth (localStorage)
  //  Server is always the source of truth for plan/trial.
  // ════════════════════════════════════════════════════════════════

  async function _syncProfileToLocal(sbUser) {
    if (!sbUser || !window.MNAuth) return;

    const profile = await _ensureProfile(
      sbUser.id,
      sbUser.email,
      sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || null,
    );

    const localUser = window.MNAuth.getUser();

    // Server plan overrides local — server is authoritative
    const serverPlan = profile.plan || 'trial';
    const trialEndsAt = profile.trial_ends_at
      ? new Date(profile.trial_ends_at).getTime()
      : (localUser.trialEndsAt || Date.now() + 24 * 60 * 60 * 1000);

    const proTrialEndsAt = profile.pro_trial_ends_at
      ? new Date(profile.pro_trial_ends_at).getTime()
      : localUser.proTrialEndsAt || null;

    window.MNAuth.patchUser({
      email:                 sbUser.email,
      supabaseId:            sbUser.id,
      displayName:           profile.display_name || sbUser.user_metadata?.full_name || localUser.displayName,
      avatarUrl:             profile.avatar_url   || sbUser.user_metadata?.avatar_url || null,
      plan:                  serverPlan,
      trialEndsAt:           trialEndsAt,
      proTrialEndsAt:        proTrialEndsAt,
      proTrialUsed:          profile.pro_trial_used || false,
      cloudEnabled:          serverPlan === 'pro',
      stripeCustomerId:      profile.stripe_customer_id || null,
    });
  }


  // ════════════════════════════════════════════════════════════════
  //  GETTERS
  // ════════════════════════════════════════════════════════════════

  function getSession()  { return _session; }
  function isLoggedIn()  { return !!_session; }
  function getEmail()    { return _session?.user?.email || null; }
  function getUserId()   { return _session?.user?.id   || null; }
  function getProvider() { return _session?.user?.app_metadata?.provider || null; }

  function getDisplayName() {
    return (
      _profile?.display_name ||
      _session?.user?.user_metadata?.full_name ||
      _session?.user?.user_metadata?.name ||
      window.MNAuth?.getUser()?.displayName ||
      null
    );
  }

  function getAvatarUrl() {
    return (
      _profile?.avatar_url ||
      _session?.user?.user_metadata?.avatar_url ||
      null
    );
  }

  function onAuthChange(cb) { _onAuthChange = cb; }


  // ════════════════════════════════════════════════════════════════
  //  EXPORT GLOBAL
  // ════════════════════════════════════════════════════════════════

  window.MNSupabaseAuth = {
    // Core
    init,
    signUp,
    signIn,
    signOut,
    // OAuth
    signInWithGoogle,
    signInWithApple,
    // Password
    resetPassword,
    updatePassword,
    // OTP
    verifyEmailOtp,
    resendVerificationEmail,
    // Profile
    getProfile,
    updateProfile,
    // Getters
    getSession,
    isLoggedIn,
    getEmail,
    getUserId,
    getProvider,
    getDisplayName,
    getAvatarUrl,
    onAuthChange,
    // Low-level client (for edge cases)
    _sb: sb,
  };

  // Auto-init on load
  init().catch(err => console.warn('[MNSupabaseAuth] init error:', err));
})();
