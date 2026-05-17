/**
 * MoneyNest — js/supabase-auth.js
 * Gestiona el registro, login y sesión con Supabase Auth.
 * Se sincroniza con MNAuth (localStorage) para que el resto de la app
 * no tenga que saber si el usuario está online o offline.
 */
;(function () {
  'use strict';

  const SUPABASE_URL = 'https://jwddciqqhmfkbqhdrfre.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3ZGRjaXFxaG1ma2JxaGRyZnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NjkyMjcsImV4cCI6MjA5NDM0NTIyN30.Gqz39AWpW1BkWXhfhnR_vOUYUy93bgdSNvBfXYQ3VGk';

  const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // ─── Estado interno ─────────────────────────────────────────────
  let _session = null;
  let _profile = null;
  let _onAuthChange = null; // callback externo

  // ─── Inicialización ─────────────────────────────────────────────

  async function init() {
    const { data } = await sb.auth.getSession();
    _session = data.session;
    if (_session) await _syncProfileToLocal(_session.user);

    sb.auth.onAuthStateChange(async (event, session) => {
      _session = session;
      if (session) {
        await _syncProfileToLocal(session.user);
      } else {
        _profile = null;
      }
      if (_onAuthChange) _onAuthChange(event, session);
    });
  }

  // ─── Registro ────────────────────────────────────────────────────

  async function signUp(email, password) {
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: location.origin + location.pathname,
      },
    });
    if (error) throw error;

    // Registrar en tabla profiles con trial_ends_at
    if (data.user) {
      await _ensureProfile(data.user.id, email);
      _syncProfileToLocal(data.user);
    }

    return data;
  }

  // ─── Login ───────────────────────────────────────────────────────

  async function signIn(email, password) {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) await _syncProfileToLocal(data.user);
    return data;
  }

  // ─── Logout ──────────────────────────────────────────────────────

  async function signOut() {
    await sb.auth.signOut();
    _session = null;
    _profile = null;
  }

  // ─── Reset password ──────────────────────────────────────────────

  async function resetPassword(email) {
    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: location.origin + location.pathname + '?action=reset-password',
    });
    if (error) throw error;
  }

  // ─── Profile ─────────────────────────────────────────────────────

  async function _ensureProfile(userId, email) {
    const trialEndsAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await sb
      .from('profiles')
      .select('id, plan, trial_ends_at')
      .eq('id', userId)
      .single();

    if (!existing) {
      await sb.from('profiles').insert({
        id: userId,
        email,
        plan: 'trial',
        trial_ends_at: trialEndsAt,
      });
      _profile = { id: userId, email, plan: 'trial', trial_ends_at: trialEndsAt };
    } else {
      _profile = existing;
    }
    return _profile;
  }

  async function getProfile() {
    if (!_session) return null;
    const { data } = await sb
      .from('profiles')
      .select('*')
      .eq('id', _session.user.id)
      .single();
    _profile = data;
    return _profile;
  }

  // ─── Sync: Supabase → MNAuth (localStorage) ──────────────────────

  async function _syncProfileToLocal(sbUser) {
    if (!sbUser) return;
    const profile = await _ensureProfile(sbUser.id, sbUser.email);

    // Actualiza MNAuth con los datos del servidor
    if (window.MNAuth) {
      const localUser = window.MNAuth.getUser();

      // Determinar trial_ends_at: usar el del servidor como fuente de verdad
      let trialEndsAt = localUser.trialEndsAt;
      if (profile.trial_ends_at) {
        trialEndsAt = new Date(profile.trial_ends_at).getTime();
      }

      // Sincronizar plan: el servidor manda
      const plan = profile.plan || localUser.plan;

      window.MNAuth.patchUser({
        email: sbUser.email,
        supabaseId: sbUser.id,
        plan,
        trialEndsAt,
        cloudEnabled: plan === 'pro',
      });
    }
  }

  // ─── Getters ─────────────────────────────────────────────────────

  function getSession() { return _session; }
  function isLoggedIn()  { return !!_session; }
  function getEmail()    { return _session?.user?.email || null; }

  function onAuthChange(cb) { _onAuthChange = cb; }

  // ─── Export global ───────────────────────────────────────────────
  window.MNSupabaseAuth = {
    init,
    signUp,
    signIn,
    signOut,
    resetPassword,
    getProfile,
    getSession,
    isLoggedIn,
    getEmail,
    onAuthChange,
    _sb: sb,
  };

  // Auto-init al cargar
  init().catch(err => console.warn('[MNSupabaseAuth] init error:', err));
})();
