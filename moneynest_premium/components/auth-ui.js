/**
 * MoneyNest — components/auth-ui.js  v3.0
 * Modal de autenticación real: registro, login, resetear contraseña,
 * y gestión de plan (Local / Pro).
 *
 * Dependencias:
 *   • js/auth.js         → window.MNAuth  (estado local)
 *   • js/supabase-auth.js→ window.MNSupabaseAuth (Supabase Auth)
 */
'use strict';

const _auth = (() => {
  if (typeof window !== 'undefined' && window.MNAuth) return window.MNAuth;
  return new Proxy({}, { get(_, k) { throw new Error(`[MNAuthUI] MNAuth.${k} no disponible`); } });
})();

const C = {
  accent:     '#00D4AA',
  accentDark: '#00A882',
  indigo:     '#6366F1',
  indigoDark: '#4F46E5',
  red:        '#F43F5E',
};

// ─── Modo interno del modal ──────────────────────────────────────
// 'plan' | 'login' | 'register' | 'forgot'
let _modalMode = 'plan';


// ════════════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════════════

function initAuthUI() {
  if (!document.getElementById('authModal')) _injectModalShell();
  _injectGlobalStyles();

  document.addEventListener('mn:buyLocal',      () => showAuthModal());
  document.addEventListener('mn:restoreAccess', () => showAuthModal('login'));
}

function showAuthModal(mode) {
  const modal = document.getElementById('authModal');
  const card  = document.getElementById('authModalCard');
  if (!modal || !card) return;

  const user = _auth.getUser();
  const isLoggedIn = window.MNSupabaseAuth?.isLoggedIn() ?? false;

  // Si ya está autenticado con Supabase, mostrar vista de plan
  if (mode === 'login' && isLoggedIn) mode = 'plan';
  _modalMode = mode || (isLoggedIn ? 'plan' : 'login');

  card.innerHTML = _buildContent(user);
  modal.style.display = 'flex';
  modal.onclick = (e) => { if (e.target === modal) closeAuthModal(); };
  _attachListeners(user);
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) modal.style.display = 'none';
}

function renderAuthBadge(containerId = 'authPlanBadge') {
  const el = document.getElementById(containerId);
  if (!el) return;
  const user = _auth.getUser();
  const cfg  = _planBadgeConfig(user);
  el.innerHTML = `
    <div style="display:inline-flex;align-items:center;gap:6px;
      background:${cfg.bg};border:1px solid ${cfg.border};
      color:${cfg.color};font-size:.7rem;font-weight:700;
      text-transform:uppercase;letter-spacing:.08em;
      padding:4px 10px;border-radius:99px;cursor:pointer;transition:all .18s;"
      onclick="MNAuthUI.showAuthModal()" title="Ver mi plan">
      ${cfg.icon} ${cfg.label}
    </div>`;
}

function renderTrialPill(containerId = 'trialPillContainer') {
  const el = document.getElementById(containerId);
  if (!el) return;
  const user = _auth.getUser();
  if (user.plan !== 'trial') { el.innerHTML = ''; return; }
  const label = _auth.trialTimeLeftLabel ? _auth.trialTimeLeftLabel() : '—';
  el.innerHTML = `
    <div style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;
      background:rgba(99,102,241,.12);border:1px solid rgba(99,102,241,.25);
      color:${C.indigo};font-size:.72rem;font-weight:700;
      padding:5px 12px;border-radius:99px;transition:all .18s;"
      onclick="MNAuthUI.showAuthModal()" title="Tiempo de prueba restante">
      ⏳ Trial: ${label}
    </div>`;
  if (!el._mnTimerId) {
    el._mnTimerId = setInterval(() => renderTrialPill(containerId), 60_000);
  }
}


// ════════════════════════════════════════════════════════════════
//  ROUTING DE CONTENIDO
// ════════════════════════════════════════════════════════════════

function _buildContent(user) {
  const isLoggedIn = window.MNSupabaseAuth?.isLoggedIn() ?? false;

  if (_modalMode === 'login')    return _buildLoginContent();
  if (_modalMode === 'register') return _buildRegisterContent();
  if (_modalMode === 'forgot')   return _buildForgotContent();

  // Plan view — muestra diferente según plan y si tiene sesión
  if (!isLoggedIn) return _buildNotLoggedPlanContent(user);

  switch (user.plan) {
    case 'trial':        return _buildTrialContent(user);
    case 'locked_local': return _buildLockedContent(user);
    case 'local':        return _buildLocalContent(user);
    case 'pro':          return _buildProContent(user);
    default:             return _buildTrialContent(user);
  }
}


// ════════════════════════════════════════════════════════════════
//  VISTAS DE AUTH (login / registro / forgot)
// ════════════════════════════════════════════════════════════════

function _buildLoginContent() {
  return /* html */`
    <div class="mn-auth-modal-header">
      <div style="font-size:.68rem;font-weight:700;color:var(--text3,#94A3B8);text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px">Cuenta MoneyNest</div>
      <div style="font-size:1.25rem;font-weight:800;color:${C.accent};letter-spacing:-.03em">Iniciar sesión</div>
    </div>

    <div class="mn-auth-section">
      <div class="mn-auth-form-col" id="mn-login-form">
        <div class="mn-auth-field-wrap">
          <label class="mn-auth-field-label">Correo electrónico</label>
          <input class="mn-auth-input" type="email" id="mn-login-email" placeholder="tu@email.com" autocomplete="email">
        </div>
        <div class="mn-auth-field-wrap">
          <label class="mn-auth-field-label">Contraseña</label>
          <div style="position:relative">
            <input class="mn-auth-input" type="password" id="mn-login-password" placeholder="Tu contraseña" autocomplete="current-password" style="padding-right:40px">
            <button class="mn-pw-toggle-btn" onclick="_mnTogglePw('mn-login-password',this)" tabindex="-1">👁</button>
          </div>
        </div>
        <div class="mn-auth-msg" id="mn-login-msg" style="display:none"></div>
        <button class="mn-btn-primary mn-btn-full" id="mn-login-submit-btn" style="margin-top:4px">
          Entrar
        </button>
      </div>
      <div style="text-align:center;margin-top:10px">
        <button class="mn-link-btn" id="mn-forgot-link">¿Olvidaste tu contraseña?</button>
      </div>
    </div>

    <div class="mn-auth-divider"></div>

    <div style="text-align:center">
      <span style="font-size:.8rem;color:var(--text2,#94A3B8)">¿Nuevo en MoneyNest? </span>
      <button class="mn-link-btn mn-link-btn--accent" id="mn-go-register">Crear cuenta →</button>
    </div>
  `;
}

function _buildRegisterContent() {
  return /* html */`
    <div class="mn-auth-modal-header">
      <div style="font-size:.68rem;font-weight:700;color:var(--text3,#94A3B8);text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px">Cuenta MoneyNest</div>
      <div style="font-size:1.25rem;font-weight:800;color:${C.accent};letter-spacing:-.03em">Crear cuenta</div>
    </div>

    <div class="mn-auth-trial-note">
      <span style="font-weight:700;color:${C.accent}">⏳ 24h gratis</span>
      &nbsp;— Registrarte activa tu prueba gratuita. Sin tarjeta requerida.
    </div>

    <div class="mn-auth-section">
      <div class="mn-auth-form-col" id="mn-register-form">
        <div class="mn-auth-field-wrap">
          <label class="mn-auth-field-label">Correo electrónico</label>
          <input class="mn-auth-input" type="email" id="mn-reg-email" placeholder="tu@email.com" autocomplete="email">
        </div>
        <div class="mn-auth-field-wrap">
          <label class="mn-auth-field-label">Contraseña</label>
          <div style="position:relative">
            <input class="mn-auth-input" type="password" id="mn-reg-password" placeholder="Mínimo 8 caracteres" autocomplete="new-password" style="padding-right:40px"
              oninput="_mnCheckPwStrength(this.value)">
            <button class="mn-pw-toggle-btn" onclick="_mnTogglePw('mn-reg-password',this)" tabindex="-1">👁</button>
          </div>
          <div class="mn-pw-strength-bar" id="mn-reg-pw-strength" style="display:none">
            <div class="mn-pw-bar-track"><div class="mn-pw-bar-fill" id="mn-reg-pw-fill"></div></div>
            <span class="mn-pw-bar-label" id="mn-reg-pw-label"></span>
          </div>
        </div>
        <div class="mn-auth-field-wrap">
          <label class="mn-auth-field-label">Confirmar contraseña</label>
          <div style="position:relative">
            <input class="mn-auth-input" type="password" id="mn-reg-password2" placeholder="Repite la contraseña" autocomplete="new-password" style="padding-right:40px">
            <button class="mn-pw-toggle-btn" onclick="_mnTogglePw('mn-reg-password2',this)" tabindex="-1">👁</button>
          </div>
        </div>
        <div class="mn-auth-msg" id="mn-reg-msg" style="display:none"></div>
        <button class="mn-btn-primary mn-btn-full" id="mn-reg-submit-btn" style="margin-top:4px">
          Crear cuenta y empezar →
        </button>
      </div>
    </div>

    <div class="mn-auth-divider"></div>

    <div style="text-align:center">
      <span style="font-size:.8rem;color:var(--text2,#94A3B8)">¿Ya tienes cuenta? </span>
      <button class="mn-link-btn mn-link-btn--accent" id="mn-go-login">Iniciar sesión</button>
    </div>
  `;
}

function _buildForgotContent() {
  return /* html */`
    <div class="mn-auth-modal-header">
      <div style="font-size:.68rem;font-weight:700;color:var(--text3,#94A3B8);text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px">Recuperar acceso</div>
      <div style="font-size:1.25rem;font-weight:800;color:${C.indigo};letter-spacing:-.03em">Resetear contraseña</div>
    </div>

    <p style="font-size:.82rem;color:var(--text2,#94A3B8);line-height:1.65;margin-bottom:16px">
      Te enviaremos un enlace para restablecer tu contraseña al correo que indicaste al registrarte.
    </p>

    <div class="mn-auth-form-col">
      <div class="mn-auth-field-wrap">
        <label class="mn-auth-field-label">Correo electrónico</label>
        <input class="mn-auth-input" type="email" id="mn-forgot-email" placeholder="tu@email.com" autocomplete="email">
      </div>
      <div class="mn-auth-msg" id="mn-forgot-msg" style="display:none"></div>
      <button class="mn-btn-primary mn-btn-full" id="mn-forgot-submit-btn" style="margin-top:4px">
        Enviar enlace de reseteo
      </button>
    </div>

    <div class="mn-auth-divider"></div>

    <div style="text-align:center">
      <button class="mn-link-btn" id="mn-back-to-login">← Volver al login</button>
    </div>
  `;
}

// ── Vista cuando no hay sesión activa ────────────────────────────
function _buildNotLoggedPlanContent(user) {
  const timeLabel = _auth.trialTimeLeftLabel ? _auth.trialTimeLeftLabel() : '—';
  const hoursLeft = _auth.trialHoursLeft ? _auth.trialHoursLeft() : 0;
  const pct       = Math.min(100, Math.round((hoursLeft / 24) * 100));

  return /* html */`
    ${_modalHeader('⏳ Plan de prueba', C.indigo)}

    <div class="mn-auth-trial-box">
      <div class="mn-auth-trial-time">${timeLabel}</div>
      <div class="mn-auth-trial-label">tiempo de prueba restante</div>
      <div class="mn-auth-progress-track">
        <div class="mn-auth-progress-bar" style="width:${pct}%;background:${pct > 25 ? C.indigo : C.red}"></div>
      </div>
    </div>

    <p style="font-size:.82rem;color:var(--text2,#94A3B8);line-height:1.65;margin-bottom:16px">
      Regístrate para guardar tu cuenta y que el trial de 24h esté asociado a tu email. O inicia sesión si ya tienes cuenta.
    </p>

    <button class="mn-btn-primary mn-btn-full" id="mn-go-register-cta">
      Crear cuenta gratuita →
    </button>
    <div style="text-align:center;margin-top:10px">
      <button class="mn-link-btn" id="mn-go-login-link">Ya tengo cuenta — Iniciar sesión</button>
    </div>

    <div class="mn-auth-divider"></div>

    <div class="mn-auth-cta-box">
      <div class="mn-auth-cta-label">🔓 Desbloquear ahora</div>
      <div class="mn-auth-cta-desc">Con el Plan Local (5€ único) nunca expira.</div>
      <button class="mn-btn-secondary mn-btn-full" id="mn-buy-local-btn" style="margin-top:12px">
        💾 Comprar Plan Local — 5€ →
      </button>
    </div>

    ${_modalFooter(user)}
  `;
}


// ════════════════════════════════════════════════════════════════
//  VISTAS DE PLAN (usuario autenticado)
// ════════════════════════════════════════════════════════════════

function _buildTrialContent(user) {
  const hoursLeft = _auth.trialHoursLeft ? _auth.trialHoursLeft() : 0;
  const timeLabel = _auth.trialTimeLeftLabel ? _auth.trialTimeLeftLabel() : '—';
  const pct       = Math.min(100, Math.round((hoursLeft / 24) * 100));
  const email     = window.MNSupabaseAuth?.getEmail() || user.email || '';

  return /* html */`
    ${_modalHeader('⏳ Plan de prueba', C.indigo)}

    <div class="mn-auth-trial-box">
      <div class="mn-auth-trial-time">${timeLabel}</div>
      <div class="mn-auth-trial-label">tiempo de prueba restante</div>
      <div class="mn-auth-progress-track">
        <div class="mn-auth-progress-bar" style="width:${pct}%;background:${pct > 25 ? C.indigo : C.red}"></div>
      </div>
    </div>

    ${email ? `<div style="text-align:center;font-size:.78rem;color:var(--text2,#94A3B8);margin-bottom:12px">✅ Sesión activa: <strong style="color:var(--text,#E8EFF7)">${email}</strong></div>` : ''}

    <div class="mn-auth-cta-box">
      <div class="mn-auth-cta-label">🔒 ¿Qué pasa cuando expire el trial?</div>
      <div class="mn-auth-cta-desc">La app se bloqueará. Con el Plan Local (5€ único) se desbloquea para siempre.</div>
      <button class="mn-btn-primary mn-btn-full" id="mn-buy-local-btn" style="margin-top:12px">
        🔓 Comprar Plan Local — 5€ pago único
      </button>
    </div>

    <div class="mn-auth-divider"></div>
    <button class="mn-btn-ghost mn-btn-full" id="mn-logout-btn">Cerrar sesión</button>
    ${_modalFooter(user)}
  `;
}

function _buildLockedContent(user) {
  return /* html */`
    ${_modalHeader('🔒 Acceso bloqueado', C.red)}

    <div class="mn-auth-alert-box">
      <div class="mn-auth-alert-icon">⏰</div>
      <div class="mn-auth-alert-text">
        Tu prueba de 24 horas ha expirado.<br>
        Tus datos están a salvo — solo necesitas desbloquear la app.
      </div>
    </div>

    <div class="mn-auth-price-card">
      <div class="mn-auth-price-label">Plan Local</div>
      <div class="mn-auth-price-amount">5€ <span>pago único</span></div>
      <div class="mn-auth-price-features">
        <div class="mn-auth-pf">✅ Acceso inmediato sin fecha de expiración</div>
        <div class="mn-auth-pf">✅ Todos tus datos conservados</div>
        <div class="mn-auth-pf">✅ Ilimitado: movimientos, categorías, cuentas</div>
        <div class="mn-auth-pf">✅ Exportación PDF y Excel</div>
      </div>
    </div>

    <button class="mn-btn-primary mn-btn-full mn-btn-large" id="mn-buy-local-btn">
      🔓 Comprar Plan Local — 5€ →
    </button>
    <div style="margin-top:10px">
      <button class="mn-btn-ghost mn-btn-full" id="mn-restore-btn">¿Ya compraste? Restaurar acceso</button>
    </div>
    ${_modalFooter(user)}
  `;
}

function _buildLocalContent(user) {
  const proTrialUsed = user.proTrialUsed;
  const email = window.MNSupabaseAuth?.getEmail() || user.email || '';
  return /* html */`
    ${_modalHeader('💾 Plan Local activo', C.accent)}

    <div class="mn-auth-status-box mn-status-ok">
      <span class="mn-status-icon">✅</span>
      <div>
        <div class="mn-status-title">Acceso desbloqueado</div>
        <div class="mn-status-desc">${email ? `Cuenta: ${email}` : 'Tus datos se guardan en este dispositivo.'}</div>
      </div>
    </div>

    <div class="mn-auth-divider"></div>

    <div class="mn-auth-upgrade-box">
      <div class="mn-auth-upgrade-header">
        <span>☁️</span>
        <div>
          <div class="mn-auth-upgrade-title">Activa la sincronización en la nube</div>
          <div class="mn-auth-upgrade-subtitle">Plan Pro — 5€/año</div>
        </div>
      </div>
      <div class="mn-auth-upgrade-features">
        <div class="mn-auth-uf">☁️ Sincronización multi-dispositivo</div>
        <div class="mn-auth-uf">🔄 Backup automático</div>
        <div class="mn-auth-uf">⚡ Soporte prioritario</div>
        <div class="mn-auth-uf">🚀 Funciones beta primero</div>
      </div>
      ${!proTrialUsed
        ? `<button class="mn-btn-pro mn-btn-full" id="mn-activate-pro-btn">☁️ Activar Pro — 7 días gratis →</button>
           <div class="mn-auth-pro-note">Luego 5€/año · Sin compromisos · Cancela cuando quieras</div>`
        : `<button class="mn-btn-pro mn-btn-full" id="mn-activate-pro-btn">☁️ Activar Pro — 5€/año →</button>
           <div class="mn-auth-pro-note">Prueba gratuita ya usada. Sin compromisos.</div>`}
    </div>

    <div class="mn-auth-divider"></div>
    <button class="mn-btn-ghost mn-btn-full" id="mn-logout-btn">Cerrar sesión</button>
    ${_modalFooter(user)}
  `;
}

function _buildProContent(user) {
  const inProTrial  = user.proTrialEndsAt && Date.now() < user.proTrialEndsAt;
  const proExpLabel = user.proTrialEndsAt
    ? `hasta el ${new Date(user.proTrialEndsAt).toLocaleDateString('es-ES', { day:'numeric', month:'long' })}`
    : 'suscripción activa';
  const email = window.MNSupabaseAuth?.getEmail() || user.email || '';

  return /* html */`
    ${_modalHeader('⚡ Plan Pro activo', C.accent)}

    <div class="mn-auth-status-box mn-status-pro">
      <span class="mn-status-icon">⚡</span>
      <div>
        <div class="mn-status-title">¡Gracias por ser Pro!</div>
        <div class="mn-status-desc">${inProTrial ? `Prueba gratuita activa ${proExpLabel}` : proExpLabel}</div>
      </div>
    </div>

    ${email ? `<div style="text-align:center;font-size:.78rem;color:var(--text2,#94A3B8);margin-bottom:12px">Cuenta: <strong style="color:var(--text,#E8EFF7)">${email}</strong></div>` : ''}

    <div class="mn-auth-features-grid">
      <div class="mn-auth-fg">☁️ Sincronización cloud</div>
      <div class="mn-auth-fg">🔄 Backups automáticos</div>
      <div class="mn-auth-fg">⚡ Soporte prioritario</div>
      <div class="mn-auth-fg">🚀 Funciones beta primero</div>
    </div>

    ${inProTrial ? `
    <div class="mn-auth-trial-reminder">
      💳 Para mantener el Pro, vincula un método de pago antes de que expire la prueba.
      <button class="mn-btn-secondary mn-btn-sm" id="mn-link-payment-btn" style="margin-top:10px">Vincular método de pago</button>
    </div>` : ''}

    <div class="mn-auth-divider"></div>

    <button class="mn-btn-ghost mn-btn-full mn-btn-danger" id="mn-cancel-pro-btn">Cancelar suscripción Pro</button>
    <div class="mn-auth-cancel-note">Si cancelas, tu plan vuelve a Local. Nunca perderás el acceso.</div>
    <div style="margin-top:8px">
      <button class="mn-btn-ghost mn-btn-full" id="mn-logout-btn">Cerrar sesión</button>
    </div>
    ${_modalFooter(user)}
  `;
}

function _modalHeader(title, color) {
  return `<div class="mn-auth-modal-header">
    <div style="font-size:.68rem;font-weight:700;color:var(--text3,#94A3B8);text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px">Tu plan actual</div>
    <div style="font-size:1.25rem;font-weight:800;color:${color};letter-spacing:-.03em">${title}</div>
  </div>`;
}

function _modalFooter(user) {
  const id = (user.id || '').slice(0, 18);
  return `<div class="mn-auth-footer">ID: <code>${id}…</code>${user.email ? ` · ${user.email}` : ''}</div>`;
}


// ════════════════════════════════════════════════════════════════
//  EVENT LISTENERS
// ════════════════════════════════════════════════════════════════

function _attachListeners(user) {
  // ── Navegación entre vistas ──────────────────────────────────
  _on('mn-go-register',     () => { _modalMode = 'register'; _refreshModal(); });
  _on('mn-go-register-cta', () => { _modalMode = 'register'; _refreshModal(); });
  _on('mn-go-login',        () => { _modalMode = 'login';    _refreshModal(); });
  _on('mn-go-login-link',   () => { _modalMode = 'login';    _refreshModal(); });
  _on('mn-forgot-link',     () => { _modalMode = 'forgot';   _refreshModal(); });
  _on('mn-back-to-login',   () => { _modalMode = 'login';    _refreshModal(); });

  // ── Login ────────────────────────────────────────────────────
  _on('mn-login-submit-btn', () => _handleLogin());
  _onKey('mn-login-password', 'Enter', () => _handleLogin());

  // ── Registro ─────────────────────────────────────────────────
  _on('mn-reg-submit-btn', () => _handleRegister());
  _onKey('mn-reg-password2', 'Enter', () => _handleRegister());

  // ── Forgot password ──────────────────────────────────────────
  _on('mn-forgot-submit-btn', () => _handleForgot());
  _onKey('mn-forgot-email', 'Enter', () => _handleForgot());

  // ── Logout ───────────────────────────────────────────────────
  _on('mn-logout-btn', () => _handleLogout());

  // ── Comprar Local ────────────────────────────────────────────
  _on('mn-buy-local-btn', () => {
    const email = window.MNSupabaseAuth?.getEmail() || user.email || '';
    document.dispatchEvent(new CustomEvent('mn:buyLocal', { detail: { source: 'modal', user } }));
    closeAuthModal();
    if (window.MNStripe) MNStripe.openPayment(MNStripeConfig.prices.local, email);
  });

  // ── Activar Pro ──────────────────────────────────────────────
  _on('mn-activate-pro-btn', () => {
    const email = window.MNSupabaseAuth?.getEmail() || user.email || '';
    document.dispatchEvent(new CustomEvent('mn:activatePro', { detail: { source: 'modal', user } }));
    closeAuthModal();
    if (window.MNStripe) MNStripe.openPayment(MNStripeConfig.prices.pro, email);
  });

  // ── Cancelar Pro ─────────────────────────────────────────────
  _on('mn-cancel-pro-btn', () => {
    if (!confirm('¿Seguro que quieres cancelar el Plan Pro? Tu plan volverá a Local sin bloqueos.')) return;
    document.dispatchEvent(new CustomEvent('mn:cancelPro', { detail: { source: 'modal' } }));
    _auth.cancelPro();
    closeAuthModal();
    renderAuthBadge();
    renderTrialPill();
    if (typeof window.updateSidebarLogo === 'function') window.updateSidebarLogo();
    _toast('Plan Pro cancelado. Sigues con Plan Local.');
  });

  // ── Restaurar licencia ───────────────────────────────────────
  _on('mn-restore-btn', () => {
    document.dispatchEvent(new CustomEvent('mn:restoreAccess', { detail: { source: 'modal' } }));
  });

  // ── Vincular pago Pro ────────────────────────────────────────
  _on('mn-link-payment-btn', () => {
    document.dispatchEvent(new CustomEvent('mn:linkPayment', { detail: { source: 'modal' } }));
  });
}


// ════════════════════════════════════════════════════════════════
//  HANDLERS DE AUTENTICACIÓN
// ════════════════════════════════════════════════════════════════

async function _handleLogin() {
  const email = _val('mn-login-email');
  const pass  = _val('mn-login-password');
  const msg   = document.getElementById('mn-login-msg');
  const btn   = document.getElementById('mn-login-submit-btn');

  if (!email || !pass) { _showMsg(msg, '⚠ Rellena todos los campos.', 'error'); return; }
  if (!_validEmail(email)) { _showMsg(msg, '⚠ Email no válido.', 'error'); return; }

  _setBtnLoading(btn, true, 'Entrando…');
  try {
    await window.MNSupabaseAuth.signIn(email, pass);
    _toast('✅ Sesión iniciada correctamente.');
    closeAuthModal();
    renderAuthBadge();
    renderTrialPill();
  } catch (err) {
    const code = err?.message || '';
    const text = code.includes('Invalid login')
      ? '⚠ Email o contraseña incorrectos.'
      : code.includes('Email not confirmed')
      ? '⚠ Confirma tu email antes de entrar. Revisa tu bandeja de entrada.'
      : `⚠ ${code}`;
    _showMsg(msg, text, 'error');
  } finally {
    _setBtnLoading(btn, false, 'Entrar');
  }
}

async function _handleRegister() {
  const email = _val('mn-reg-email');
  const pass  = _val('mn-reg-password');
  const pass2 = _val('mn-reg-password2');
  const msg   = document.getElementById('mn-reg-msg');
  const btn   = document.getElementById('mn-reg-submit-btn');

  if (!email || !pass || !pass2) { _showMsg(msg, '⚠ Rellena todos los campos.', 'error'); return; }
  if (!_validEmail(email)) { _showMsg(msg, '⚠ Email no válido.', 'error'); return; }
  if (pass.length < 8) { _showMsg(msg, '⚠ La contraseña debe tener al menos 8 caracteres.', 'error'); return; }
  if (pass !== pass2) { _showMsg(msg, '⚠ Las contraseñas no coinciden.', 'error'); return; }

  _setBtnLoading(btn, true, 'Creando cuenta…');
  try {
    const data = await window.MNSupabaseAuth.signUp(email, pass);
    // Si requiere confirmación de email
    if (data.user && !data.session) {
      // Activar trial local mientras se confirma
      _auth.upgradeTrial(email);
      _showMsg(msg, '✅ ¡Cuenta creada! Revisa tu email para confirmar y entrar.', 'ok');
      _setBtnLoading(btn, false, 'Crear cuenta y empezar →');
      setTimeout(() => {
        closeAuthModal();
        renderAuthBadge();
        renderTrialPill();
      }, 2500);
    } else if (data.session) {
      // Login automático (sin confirmación de email requerida)
      _auth.upgradeTrial(email);
      _toast('✅ ¡Cuenta creada y sesión iniciada!');
      closeAuthModal();
      renderAuthBadge();
      renderTrialPill();
    }
    document.dispatchEvent(new CustomEvent('mn:registered', { detail: { email } }));
  } catch (err) {
    const code = err?.message || '';
    const text = code.includes('already registered')
      ? '⚠ Este email ya está registrado. <a href="#" id="mn-switch-login" style="color:#00D4AA">Inicia sesión →</a>'
      : `⚠ ${code}`;
    _showMsgHtml(msg, text, 'error');
    // Wire inline link
    setTimeout(() => {
      const link = document.getElementById('mn-switch-login');
      if (link) link.addEventListener('click', (e) => { e.preventDefault(); _modalMode='login'; _refreshModal(); });
    }, 50);
  } finally {
    _setBtnLoading(btn, false, 'Crear cuenta y empezar →');
  }
}

async function _handleForgot() {
  const email = _val('mn-forgot-email');
  const msg   = document.getElementById('mn-forgot-msg');
  const btn   = document.getElementById('mn-forgot-submit-btn');

  if (!_validEmail(email)) { _showMsg(msg, '⚠ Introduce un email válido.', 'error'); return; }

  _setBtnLoading(btn, true, 'Enviando…');
  try {
    await window.MNSupabaseAuth.resetPassword(email);
    _showMsg(msg, '✅ Enlace enviado. Revisa tu email.', 'ok');
    _setBtnLoading(btn, false, 'Enviar enlace de reseteo');
  } catch (err) {
    _showMsg(msg, `⚠ ${err?.message || 'Error al enviar'}`, 'error');
    _setBtnLoading(btn, false, 'Enviar enlace de reseteo');
  }
}

async function _handleLogout() {
  if (window.MNSupabaseAuth) await window.MNSupabaseAuth.signOut();
  closeAuthModal();
  renderAuthBadge();
  renderTrialPill();
  _toast('Sesión cerrada.');
}


// ════════════════════════════════════════════════════════════════
//  HELPERS UI
// ════════════════════════════════════════════════════════════════

function _refreshModal() {
  const card = document.getElementById('authModalCard');
  if (!card) return;
  card.innerHTML = _buildContent(_auth.getUser());
  _attachListeners(_auth.getUser());
}

function _on(id, fn) {
  const el = document.getElementById(id);
  if (el) el.addEventListener('click', fn);
}

function _onKey(id, key, fn) {
  const el = document.getElementById(id);
  if (el) el.addEventListener('keydown', (e) => { if (e.key === key) fn(); });
}

function _val(id) {
  return (document.getElementById(id)?.value || '').trim();
}

function _validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

function _showMsg(el, text, type) {
  if (!el) return;
  el.textContent = text;
  el.style.display = 'block';
  el.style.color = type === 'error' ? C.red : C.accent;
}

function _showMsgHtml(el, html, type) {
  if (!el) return;
  el.innerHTML = html;
  el.style.display = 'block';
  el.style.color = type === 'error' ? C.red : C.accent;
}

function _setBtnLoading(btn, loading, text) {
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = text;
  btn.style.opacity = loading ? '0.7' : '1';
}

function _toast(msg) {
  if (typeof window.toast === 'function') { window.toast(msg); return; }
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#111827;color:#E8EFF7;padding:12px 20px;border-radius:12px;font-size:.85rem;font-weight:600;z-index:99999;box-shadow:0 8px 32px rgba(0,0,0,.4)';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}


// ════════════════════════════════════════════════════════════════
//  INYECCIÓN DE HTML Y CSS
// ════════════════════════════════════════════════════════════════

function _injectModalShell() {
  const overlay = document.createElement('div');
  overlay.id = 'authModal';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9900;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.6);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)';
  overlay.innerHTML = `
    <div id="authModalCard" style="
      background:var(--card,#111827);
      border:1px solid var(--border2,rgba(255,255,255,.08));
      border-radius:24px;
      width:min(440px,calc(100vw - 32px));
      max-height:calc(100dvh - 48px);
      overflow-y:auto;
      padding:32px 28px 24px;
      box-shadow:0 40px 100px rgba(0,0,0,.6);
      animation:mnCardIn .4s cubic-bezier(0.22,1,0.36,1) forwards;
      position:relative;">
    </div>`;
  document.body.appendChild(overlay);
}

function _injectGlobalStyles() {
  if (document.getElementById('mn-auth-ui-styles')) return;
  const style = document.createElement('style');
  style.id = 'mn-auth-ui-styles';
  style.textContent = `
    @keyframes mnCardIn { from{opacity:0;transform:scale(.96) translateY(12px)} to{opacity:1;transform:none} }

    .mn-auth-modal-header { margin-bottom:20px; }
    .mn-auth-section      { margin-bottom:16px; }
    .mn-auth-divider      { border:none;border-top:1px solid var(--border2,rgba(255,255,255,.08));margin:18px 0; }
    .mn-auth-form-col     { display:flex;flex-direction:column;gap:12px; }
    .mn-auth-field-wrap   { display:flex;flex-direction:column;gap:5px; }
    .mn-auth-field-label  { font-size:.72rem;font-weight:700;color:var(--text2,#94A3B8);text-transform:uppercase;letter-spacing:.06em; }

    .mn-auth-trial-note {
      background:rgba(99,102,241,.07);border:1px solid rgba(99,102,241,.18);
      border-radius:12px;padding:12px 14px;font-size:.8rem;
      color:var(--text2,#94A3B8);line-height:1.6;margin-bottom:16px;
    }

    .mn-auth-trial-box {
      background:rgba(99,102,241,.08);border:1px solid rgba(99,102,241,.2);
      border-radius:16px;padding:20px;text-align:center;margin-bottom:18px;
    }
    .mn-auth-trial-time  { font-size:2.2rem;font-weight:800;color:#6366F1;letter-spacing:-.05em;line-height:1; }
    .mn-auth-trial-label { font-size:.78rem;color:var(--text2,#94A3B8);margin:4px 0 12px; }
    .mn-auth-progress-track { height:6px;background:rgba(255,255,255,.08);border-radius:99px;overflow:hidden; }
    .mn-auth-progress-bar   { height:100%;border-radius:99px;transition:width .6s; }

    .mn-auth-cta-box {
      background:rgba(0,212,170,.06);border:1px solid rgba(0,212,170,.15);
      border-radius:16px;padding:18px;margin-bottom:4px;
    }
    .mn-auth-cta-label { font-size:.75rem;font-weight:700;color:${C.accent};margin-bottom:6px; }
    .mn-auth-cta-desc  { font-size:.78rem;color:var(--text2,#94A3B8);line-height:1.5; }

    .mn-auth-alert-box {
      display:flex;align-items:center;gap:14px;
      background:rgba(244,63,94,.08);border:1px solid rgba(244,63,94,.2);
      border-radius:14px;padding:16px;margin-bottom:18px;
    }
    .mn-auth-alert-icon { font-size:2rem;flex-shrink:0; }
    .mn-auth-alert-text { font-size:.82rem;color:var(--text,#E8EFF7);line-height:1.6; }

    .mn-auth-price-card {
      background:linear-gradient(135deg,rgba(0,212,170,.1),rgba(0,212,170,.04));
      border:1px solid rgba(0,212,170,.25);border-radius:16px;padding:20px;margin-bottom:18px;
    }
    .mn-auth-price-label  { font-size:.68rem;font-weight:700;color:${C.accent};text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px; }
    .mn-auth-price-amount { font-size:2rem;font-weight:800;color:var(--text,#E8EFF7);letter-spacing:-.05em;line-height:1;margin-bottom:10px; }
    .mn-auth-price-amount span { font-size:.95rem;font-weight:600;color:var(--text2,#94A3B8); }
    .mn-auth-price-features { display:flex;flex-direction:column;gap:6px; }
    .mn-auth-pf { font-size:.78rem;color:var(--text2,#94A3B8); }

    .mn-auth-status-box { display:flex;align-items:center;gap:14px;border-radius:14px;padding:16px;margin-bottom:18px; }
    .mn-status-ok  { background:rgba(0,212,170,.08);border:1px solid rgba(0,212,170,.2); }
    .mn-status-pro { background:rgba(0,212,170,.1);border:1px solid rgba(0,212,170,.3); }
    .mn-status-icon  { font-size:1.8rem;flex-shrink:0; }
    .mn-status-title { font-size:.95rem;font-weight:700;color:var(--text,#E8EFF7); }
    .mn-status-desc  { font-size:.78rem;color:var(--text2,#94A3B8);margin-top:2px; }

    .mn-auth-upgrade-box {
      background:linear-gradient(135deg,rgba(99,102,241,.08),rgba(99,102,241,.03));
      border:1px solid rgba(99,102,241,.2);border-radius:16px;padding:20px;
    }
    .mn-auth-upgrade-header  { display:flex;align-items:center;gap:12px;margin-bottom:14px;font-size:1.5rem; }
    .mn-auth-upgrade-title   { font-size:.9rem;font-weight:700;color:var(--text,#E8EFF7); }
    .mn-auth-upgrade-subtitle{ font-size:.75rem;color:${C.indigo};font-weight:600; }
    .mn-auth-upgrade-features{ display:flex;flex-direction:column;gap:6px;margin-bottom:16px; }
    .mn-auth-uf { font-size:.78rem;color:var(--text2,#94A3B8); }
    .mn-auth-pro-note { font-size:.7rem;color:var(--text2,#94A3B8);text-align:center;margin-top:8px; }

    .mn-auth-features-grid { display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:18px; }
    .mn-auth-fg {
      background:rgba(0,212,170,.06);border:1px solid rgba(0,212,170,.12);
      border-radius:10px;padding:10px 12px;font-size:.78rem;color:var(--text,#E8EFF7);font-weight:600;
    }
    .mn-auth-trial-reminder {
      background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.2);
      border-radius:12px;padding:14px;font-size:.78rem;color:var(--text2,#94A3B8);
      line-height:1.5;margin-bottom:16px;text-align:center;
    }
    .mn-btn-danger { color:${C.red}!important;border-color:rgba(244,63,94,.25)!important; }
    .mn-btn-danger:hover { border-color:${C.red}!important;background:rgba(244,63,94,.08)!important; }
    .mn-auth-cancel-note { font-size:.7rem;color:var(--text2,#94A3B8);text-align:center;margin-top:6px; }
    .mn-auth-footer { font-size:.68rem;color:var(--text3,#64748B);text-align:center;margin-top:18px;line-height:1.5; }
    .mn-auth-footer code { font-size:.65rem;opacity:.6; }

    /* Input */
    .mn-auth-input {
      width:100%;padding:11px 14px;border-radius:10px;
      border:1.5px solid var(--border2,rgba(255,255,255,.1));
      background:var(--input-bg,rgba(255,255,255,.05));
      color:var(--text,#E8EFF7);font-family:inherit;font-size:.88rem;
      outline:none;transition:border-color .18s;box-sizing:border-box;
    }
    .mn-auth-input:focus { border-color:${C.accent}; }

    .mn-auth-msg { font-size:.78rem;margin-top:4px;line-height:1.5; }

    /* Password toggle */
    .mn-pw-toggle-btn {
      position:absolute;right:10px;top:50%;transform:translateY(-50%);
      background:none;border:none;cursor:pointer;font-size:.9rem;
      color:var(--text2,#94A3B8);padding:2px;
    }

    /* Password strength */
    .mn-pw-strength-bar { display:flex;align-items:center;gap:8px;margin-top:4px; }
    .mn-pw-bar-track { flex:1;height:4px;background:rgba(255,255,255,.08);border-radius:99px;overflow:hidden; }
    .mn-pw-bar-fill  { height:100%;border-radius:99px;transition:width .3s,background .3s; }
    .mn-pw-bar-label { font-size:.68rem;font-weight:700;min-width:60px;text-align:right; }

    /* Link buttons */
    .mn-link-btn { background:none;border:none;cursor:pointer;font-size:.8rem;color:var(--text2,#94A3B8);font-family:inherit;padding:2px;transition:color .15s; }
    .mn-link-btn:hover { color:var(--text,#E8EFF7); }
    .mn-link-btn--accent { color:${C.accent}; }
    .mn-link-btn--accent:hover { color:${C.accentDark}; }

    /* Buttons */
    .mn-btn-primary, .mn-btn-pro, .mn-btn-secondary, .mn-btn-ghost {
      padding:13px 20px;border-radius:13px;border:none;
      font-size:.88rem;font-weight:800;cursor:pointer;
      font-family:inherit;letter-spacing:-.01em;transition:transform .18s,box-shadow .18s,opacity .18s;
    }
    .mn-btn-full  { width:100%;display:block; }
    .mn-btn-large { padding:16px;font-size:1rem; }
    .mn-btn-sm    { padding:9px 14px!important;font-size:.8rem!important;width:auto!important; }

    .mn-btn-primary {
      background:linear-gradient(135deg,${C.accent},${C.accentDark});
      color:#0A0E17;box-shadow:0 6px 20px rgba(0,212,170,.3);
    }
    .mn-btn-primary:hover:not(:disabled) { transform:translateY(-2px);box-shadow:0 10px 30px rgba(0,212,170,.4); }
    .mn-btn-primary:disabled { opacity:.6;cursor:default; }

    .mn-btn-pro {
      background:linear-gradient(135deg,${C.indigo},${C.indigoDark});
      color:#fff;box-shadow:0 6px 20px rgba(99,102,241,.3);
    }
    .mn-btn-pro:hover { transform:translateY(-2px);box-shadow:0 10px 30px rgba(99,102,241,.4); }

    .mn-btn-secondary {
      background:rgba(255,255,255,.06);
      border:1.5px solid var(--border2,rgba(255,255,255,.1))!important;
      color:var(--text,#E8EFF7);
    }
    .mn-btn-secondary:hover { border-color:${C.accent}!important;color:${C.accent}; }

    .mn-btn-ghost {
      background:transparent;
      border:1.5px solid var(--border2,rgba(255,255,255,.1))!important;
      color:var(--text2,#94A3B8);
    }
    .mn-btn-ghost:hover { border-color:${C.accent}!important;color:${C.accent}; }
  `;
  document.head.appendChild(style);
}


// ════════════════════════════════════════════════════════════════
//  HELPERS GLOBALES (expuestos en window para inline HTML)
// ════════════════════════════════════════════════════════════════

window._mnTogglePw = function(id, btn) {
  const inp = document.getElementById(id);
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
  if (btn) btn.textContent = inp.type === 'password' ? '👁' : '🙈';
};

window._mnCheckPwStrength = function(pw) {
  const wrap  = document.getElementById('mn-reg-pw-strength');
  const fill  = document.getElementById('mn-reg-pw-fill');
  const label = document.getElementById('mn-reg-pw-label');
  if (!wrap || !fill || !label) return;
  if (!pw) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'flex';
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { pct:'25%', color:'#F43F5E', text:'Muy débil' },
    { pct:'50%', color:'#F59E0B', text:'Débil' },
    { pct:'75%', color:'#6366F1', text:'Buena' },
    { pct:'100%',color:'#00D4AA', text:'Fuerte ✓' },
  ];
  const lv = levels[Math.max(0, score - 1)];
  fill.style.width = lv.pct;
  fill.style.background = lv.color;
  label.textContent = lv.text;
  label.style.color = lv.color;
};


// ════════════════════════════════════════════════════════════════
//  BADGE CONFIG
// ════════════════════════════════════════════════════════════════

function _planBadgeConfig(user) {
  const hoursLeft = _auth.trialHoursLeft ? _auth.trialHoursLeft() : 0;
  const isLoggedIn = window.MNSupabaseAuth?.isLoggedIn() ?? false;
  const loggedSuffix = isLoggedIn ? '' : ' ·  Sin sesión';
  const configs = {
    trial:        { icon:'⏳', label:`Trial · ${Math.ceil(hoursLeft)}h${loggedSuffix}`, color:'#6366F1', bg:'rgba(99,102,241,.1)',  border:'rgba(99,102,241,.25)' },
    locked_local: { icon:'🔒', label:'Bloqueado',                                        color:C.red,     bg:'rgba(244,63,94,.1)',   border:'rgba(244,63,94,.25)'  },
    local:        { icon:'💾', label:'Local',                                            color:C.accent,  bg:'rgba(0,212,170,.1)',   border:'rgba(0,212,170,.25)'  },
    pro:          { icon:'⚡', label:'Pro',                                              color:C.accent,  bg:'rgba(0,212,170,.12)',  border:'rgba(0,212,170,.3)'   },
  };
  return configs[user.plan] || configs.trial;
}


// ════════════════════════════════════════════════════════════════
//  EXPORT GLOBAL
// ════════════════════════════════════════════════════════════════

window.MNAuthUI = {
  initAuthUI,
  showAuthModal,
  closeAuthModal,
  renderAuthBadge,
  renderTrialPill,
};

window._showAuthModal = showAuthModal;
