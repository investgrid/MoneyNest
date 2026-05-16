/**
 * ════════════════════════════════════════════════════════════════
 *  MoneyNest — components/auth-ui.js  v2.0
 *
 *  Este componente:
 *  1. Inyecta el modal #authModal en el DOM al llamar initAuthUI().
 *  2. Renderiza su contenido dinámicamente según el plan del usuario:
 *       trial       → contador de tiempo + formulario de registro + botón Local
 *       locked_local→ bloqueo visual + botón "Comprar Plan Local (5€)"
 *       local       → estado OK + botón "Activar Nube Pro (7 días gratis)"
 *       pro         → estado Pro + opción de cancelar
 *  3. Expone window.MNAuthUI para acceso global sin bundler.
 *  4. Despacha eventos personalizados que app.js puede escuchar:
 *       mn:buyLocal     → el usuario quiere comprar el plan local
 *       mn:activatePro  → el usuario quiere activar Pro
 *       mn:restoreAccess→ el usuario quiere restaurar una licencia
 *       mn:registered   → nuevo registro con email ({ detail: { email } })
 *
 *  Dependencias:
 *    • js/auth.js  (window.MNAuth o importado como módulo)
 *
 *  Integración en index.html:
 *    <script src="js/auth.js"></script>
 *    <script src="components/auth-ui.js"></script>
 *    <script>
 *      MNAuth.initUser();
 *      MNAuthUI.initAuthUI();
 *      MNAuth.checkAccess(); // después del init de UI
 *    </script>
 *    <!-- Para abrir el modal desde cualquier sitio: -->
 *    <button onclick="MNAuthUI.showAuthModal()">Mi Plan</button>
 * ════════════════════════════════════════════════════════════════
 */

'use strict';

// ─── Resolvemos dependencia de auth.js ───────────────────────────
// Funciona tanto con ES modules como con la versión global window.MNAuth.
const _auth = (() => {
  if (typeof window !== 'undefined' && window.MNAuth) return window.MNAuth;
  // Si se usa como módulo ES, auth.js debe importarse antes en el bundler.
  // Aquí devolvemos un proxy que lanza un error descriptivo.
  return new Proxy({}, {
    get(_, key) {
      throw new Error(`[MNAuthUI] MNAuth.${key} no disponible. ¿Importaste js/auth.js antes que auth-ui.js?`);
    },
  });
})();

// ─── Colores / tokens base ───────────────────────────────────────
const C = {
  accent:     '#00D4AA',
  accentDark: '#00A882',
  indigo:     '#6366F1',
  indigoDark: '#4F46E5',
  red:        '#F43F5E',
  gold:       '#F59E0B',
};


// ════════════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════════════

/**
 * initAuthUI() — crea el #authModal en el DOM si no existe.
 * Llama una sola vez al arrancar la app.
 */
function initAuthUI() {
  if (!document.getElementById('authModal')) {
    _injectModalShell();
  }
  _injectGlobalStyles();

  // Escucha eventos desde el paywall (bloquearApp) para abrir el modal
  document.addEventListener('mn:buyLocal',     () => showAuthModal());
  document.addEventListener('mn:restoreAccess',() => showAuthModal());
}

/**
 * showAuthModal() — abre el modal y renderiza el contenido
 * adecuado para el plan actual del usuario.
 */
function showAuthModal() {
  const modal = document.getElementById('authModal');
  const card  = document.getElementById('authModalCard');
  if (!modal || !card) {
    console.warn('[MNAuthUI] #authModal no encontrado. ¿Llamaste a initAuthUI()?');
    return;
  }

  const user = _auth.getUser();
  card.innerHTML = _buildModalContent(user);

  modal.style.display = 'flex';
  modal.onclick = (e) => { if (e.target === modal) closeAuthModal(); };

  _attachModalListeners(user);
}

/**
 * closeAuthModal() — cierra el modal.
 */
function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) modal.style.display = 'none';
}

/**
 * renderAuthBadge(containerId) — actualiza el badge de plan en la topbar.
 * @param {string} [containerId='authPlanBadge']
 */
function renderAuthBadge(containerId = 'authPlanBadge') {
  const el = document.getElementById(containerId);
  if (!el) return;

  const user = _auth.getUser();
  const cfg  = _planBadgeConfig(user);

  el.innerHTML = `
    <div style="
      display:inline-flex; align-items:center; gap:6px;
      background:${cfg.bg}; border:1px solid ${cfg.border};
      color:${cfg.color}; font-size:.7rem; font-weight:700;
      text-transform:uppercase; letter-spacing:.08em;
      padding:4px 10px; border-radius:99px; cursor:pointer;
      transition: all .18s;
    " onclick="MNAuthUI.showAuthModal()" title="Ver mi plan">
      ${cfg.icon} ${cfg.label}
    </div>
  `;
}

/**
 * renderTrialPill(containerId) — renderiza la píldora de cuenta regresiva
 * del trial (solo visible si el usuario está en plan trial).
 * @param {string} [containerId='trialPillContainer']
 */
function renderTrialPill(containerId = 'trialPillContainer') {
  const el = document.getElementById(containerId);
  if (!el) return;

  const user = _auth.getUser();
  if (user.plan !== 'trial') { el.innerHTML = ''; return; }

  const label = _auth.trialTimeLeftLabel ? _auth.trialTimeLeftLabel() : '—';
  el.innerHTML = `
    <div style="
      display:inline-flex; align-items:center; gap:6px; cursor:pointer;
      background:rgba(99,102,241,.12); border:1px solid rgba(99,102,241,.25);
      color:${C.indigo}; font-size:.72rem; font-weight:700;
      padding:5px 12px; border-radius:99px; transition:all .18s;
    " onclick="MNAuthUI.showAuthModal()" title="Tiempo de prueba restante">
      ⏳ Trial: ${label}
    </div>
  `;

  // Refresca el contador cada minuto
  if (!el._mnTimerId) {
    el._mnTimerId = setInterval(() => renderTrialPill(containerId), 60_000);
  }
}


// ════════════════════════════════════════════════════════════════
//  CONSTRUCCIÓN DEL CONTENIDO DEL MODAL
// ════════════════════════════════════════════════════════════════

function _buildModalContent(user) {
  switch (user.plan) {
    case 'trial':        return _buildTrialContent(user);
    case 'locked_local': return _buildLockedContent(user);
    case 'local':        return _buildLocalContent(user);
    case 'pro':          return _buildProContent(user);
    default:             return _buildTrialContent(user);
  }
}

// ── 1. Trial activo ──────────────────────────────────────────────
function _buildTrialContent(user) {
  const hoursLeft = _auth.trialHoursLeft ? _auth.trialHoursLeft() : 0;
  const timeLabel = _auth.trialTimeLeftLabel ? _auth.trialTimeLeftLabel() : '—';
  const pct       = Math.min(100, Math.round((hoursLeft / 24) * 100));

  return /* html */`
    ${_modalHeader('⏳ Plan de prueba', C.indigo)}

    <!-- Contador -->
    <div class="mn-auth-trial-box">
      <div class="mn-auth-trial-time">${timeLabel}</div>
      <div class="mn-auth-trial-label">tiempo de prueba restante</div>
      <div class="mn-auth-progress-track">
        <div class="mn-auth-progress-bar" style="width:${pct}%;background:${pct > 25 ? C.indigo : C.red}"></div>
      </div>
    </div>

    <!-- Formulario de registro con email (opcional) -->
    <div class="mn-auth-section">
      <div class="mn-auth-section-label">💌 Guarda tu cuenta</div>
      <div class="mn-auth-section-desc">Registra tu email para recuperar el acceso desde cualquier dispositivo.</div>
      <div class="mn-auth-form" id="mn-register-form">
        <input class="mn-auth-input" type="email" id="mn-email-input"
          placeholder="tucorreo@ejemplo.com"
          value="${user.email || ''}"
        />
        <button class="mn-btn-secondary" id="mn-save-email-btn">Guardar email</button>
      </div>
      <div class="mn-auth-msg" id="mn-form-msg" style="display:none"></div>
    </div>

    <div class="mn-auth-divider"></div>

    <!-- CTA Principal: Comprar Local -->
    <div class="mn-auth-cta-box">
      <div class="mn-auth-cta-label">🔒 ¿Qué pasa cuando expire el trial?</div>
      <div class="mn-auth-cta-desc">La app se bloqueará. Con el Plan Local (5€ único) se desbloquea para siempre.</div>
      <button class="mn-btn-primary" id="mn-buy-local-btn">
        🔓 Comprar Plan Local — 5€ pago único
      </button>
    </div>

    ${_modalFooter(user)}
  `;
}

// ── 2. Bloqueado (trial expirado) ────────────────────────────────
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

    <button class="mn-btn-primary mn-btn-large" id="mn-buy-local-btn">
      🔓 Comprar Plan Local — 5€ →
    </button>

    <div style="margin-top:10px">
      <button class="mn-btn-ghost" id="mn-restore-btn">
        ¿Ya compraste? Restaurar acceso
      </button>
    </div>

    ${_modalFooter(user)}
  `;
}

// ── 3. Plan Local activo ─────────────────────────────────────────
function _buildLocalContent(user) {
  const proTrialUsed = user.proTrialUsed;

  return /* html */`
    ${_modalHeader('💾 Plan Local activo', C.accent)}

    <div class="mn-auth-status-box mn-status-ok">
      <span class="mn-status-icon">✅</span>
      <div>
        <div class="mn-status-title">Acceso desbloqueado</div>
        <div class="mn-status-desc">Tus datos se guardan en este dispositivo. Sin expiración.</div>
      </div>
    </div>

    <div class="mn-auth-divider"></div>

    <!-- Upgrade a Pro -->
    <div class="mn-auth-upgrade-box">
      <div class="mn-auth-upgrade-header">
        <span>☁️</span>
        <div>
          <div class="mn-auth-upgrade-title">Activa la sincronización en la nube</div>
          <div class="mn-auth-upgrade-subtitle">Plan Pro — 5€/año</div>
        </div>
      </div>
      <div class="mn-auth-upgrade-features">
        <div class="mn-auth-uf">☁️ Sincronización en la nube (multi-dispositivo)</div>
        <div class="mn-auth-uf">🔄 Copia de seguridad automática</div>
        <div class="mn-auth-uf">⚡ Soporte prioritario</div>
        <div class="mn-auth-uf">🚀 Acceso a funciones futuras antes que nadie</div>
      </div>
      ${!proTrialUsed ? `
      <button class="mn-btn-pro" id="mn-activate-pro-btn">
        ☁️ Activar Nube Pro — 7 días gratis →
      </button>
      <div class="mn-auth-pro-note">Luego 5€/año · Sin compromisos · Cancela cuando quieras</div>
      ` : `
      <button class="mn-btn-pro" id="mn-activate-pro-btn">
        ☁️ Activar Nube Pro — 5€/año →
      </button>
      <div class="mn-auth-pro-note">Tu prueba gratuita ya fue usada. Sin compromisos, cancela cuando quieras.</div>
      `}
    </div>

    ${_modalFooter(user)}
  `;
}

// ── 4. Plan Pro activo ───────────────────────────────────────────
function _buildProContent(user) {
  const inProTrial   = user.proTrialEndsAt && Date.now() < user.proTrialEndsAt;
  const proExpLabel  = user.proTrialEndsAt
    ? `hasta el ${new Date(user.proTrialEndsAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}`
    : 'suscripción activa';

  return /* html */`
    ${_modalHeader('⚡ Plan Pro activo', C.accent)}

    <div class="mn-auth-status-box mn-status-pro">
      <span class="mn-status-icon">⚡</span>
      <div>
        <div class="mn-status-title">¡Gracias por ser Pro!</div>
        <div class="mn-status-desc">
          ${inProTrial ? `Prueba gratuita activa ${proExpLabel}` : proExpLabel}
        </div>
      </div>
    </div>

    <div class="mn-auth-features-grid">
      <div class="mn-auth-fg">☁️ Sincronización en la nube</div>
      <div class="mn-auth-fg">🔄 Backups automáticos</div>
      <div class="mn-auth-fg">⚡ Soporte prioritario</div>
      <div class="mn-auth-fg">🚀 Funciones beta primero</div>
    </div>

    ${inProTrial ? `
    <div class="mn-auth-trial-reminder">
      💳 Para mantener el Pro, vincula un método de pago antes de que expire la prueba.
      <button class="mn-btn-secondary mn-btn-sm" id="mn-link-payment-btn" style="margin-top:10px">
        Vincular método de pago
      </button>
    </div>
    ` : ''}

    <div class="mn-auth-divider"></div>

    <button class="mn-btn-ghost mn-btn-danger" id="mn-cancel-pro-btn">
      Cancelar suscripción Pro
    </button>
    <div class="mn-auth-cancel-note">
      Si cancelas, tu plan vuelve a Local. Nunca perderás el acceso.
    </div>

    ${_modalFooter(user)}
  `;
}

// ── Partes comunes ───────────────────────────────────────────────
function _modalHeader(title, color) {
  return /* html */`
    <div class="mn-auth-modal-header">
      <div style="font-size:.68rem;font-weight:700;color:var(--text3,#94A3B8);text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px">Tu plan actual</div>
      <div style="font-size:1.25rem;font-weight:800;color:${color};letter-spacing:-.03em">${title}</div>
    </div>
  `;
}

function _modalFooter(user) {
  const id = (user.id || '').slice(0, 18);
  return /* html */`
    <div class="mn-auth-footer">
      ID: <code>${id}…</code>
      ${user.email ? ` · ${user.email}` : ''}
    </div>
  `;
}


// ════════════════════════════════════════════════════════════════
//  EVENT LISTENERS DEL MODAL
// ════════════════════════════════════════════════════════════════

function _attachModalListeners(user) {
  // ── Comprar Plan Local ──────────────────────────────────────
  const buyLocalBtn = document.getElementById('mn-buy-local-btn');
  if (buyLocalBtn) {
    buyLocalBtn.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('mn:buyLocal', {
        detail: { source: 'modal', user }
      }));
      // ─ Simulación de pago para desarrollo ─────────────────
      // En producción elimina este bloque y usa tu pasarela (Stripe, etc.)
      if (window.__MN_DEV_MODE__) {
        _auth.buyLocal(user.email);
        closeAuthModal();
        renderAuthBadge();
        renderTrialPill();
        showAuthModal(); // reabrir para mostrar nuevo estado
        _toast('🔓 Plan Local activado. ¡Bienvenido!');
      }
    });
  }

  // ── Activar Pro ─────────────────────────────────────────────
  const activateProBtn = document.getElementById('mn-activate-pro-btn');
  if (activateProBtn) {
    activateProBtn.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('mn:activatePro', {
        detail: { source: 'modal', user, skipTrial: user.proTrialUsed }
      }));
      if (window.__MN_DEV_MODE__) {
        _auth.activatePro(user.email);
        closeAuthModal();
        renderAuthBadge();
        if (typeof window.updateSidebarLogo === 'function') window.updateSidebarLogo();
        showAuthModal();
        _toast('☁️ Plan Pro activado. ¡7 días gratis!');
      }
    });
  }

  // ── Cancelar Pro ────────────────────────────────────────────
  const cancelProBtn = document.getElementById('mn-cancel-pro-btn');
  if (cancelProBtn) {
    cancelProBtn.addEventListener('click', () => {
      if (!confirm('¿Seguro que quieres cancelar el Plan Pro? Tu plan volverá a Local sin bloqueos.')) return;
      document.dispatchEvent(new CustomEvent('mn:cancelPro', { detail: { source: 'modal' } }));
      _auth.cancelPro();
      closeAuthModal();
      renderAuthBadge();
      renderTrialPill();
      showAuthModal();
      _toast('Plan Pro cancelado. Sigues con Plan Local sin bloqueos.');
    });
  }

  // ── Vincular pago Pro ────────────────────────────────────────
  const linkPayBtn = document.getElementById('mn-link-payment-btn');
  if (linkPayBtn) {
    linkPayBtn.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('mn:linkPayment', { detail: { source: 'modal' } }));
    });
  }

  // ── Guardar email ────────────────────────────────────────────
  const saveEmailBtn = document.getElementById('mn-save-email-btn');
  if (saveEmailBtn) {
    saveEmailBtn.addEventListener('click', () => _handleSaveEmail());
  }
  const emailInput = document.getElementById('mn-email-input');
  if (emailInput) {
    emailInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') _handleSaveEmail();
    });
  }

  // ── Restaurar licencia ───────────────────────────────────────
  const restoreBtn = document.getElementById('mn-restore-btn');
  if (restoreBtn) {
    restoreBtn.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('mn:restoreAccess', { detail: { source: 'modal' } }));
    });
  }
}

function _handleSaveEmail() {
  const input = document.getElementById('mn-email-input');
  const msg   = document.getElementById('mn-form-msg');
  if (!input || !msg) return;

  const email = input.value.trim();
  if (!_isValidEmail(email)) {
    _showFormMsg(msg, '⚠ Introduce un email válido.', 'error');
    return;
  }

  _auth.patchUser({ email });
  _showFormMsg(msg, '✅ Email guardado correctamente.', 'ok');
  document.dispatchEvent(new CustomEvent('mn:registered', { detail: { email } }));
}

function _showFormMsg(el, text, type) {
  el.textContent = text;
  el.style.display = 'block';
  el.style.color = type === 'error' ? C.red : C.accent;
  setTimeout(() => { el.style.display = 'none'; }, 3500);
}

function _isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


// ════════════════════════════════════════════════════════════════
//  INYECCIÓN DE HTML Y CSS
// ════════════════════════════════════════════════════════════════

function _injectModalShell() {
  const overlay = document.createElement('div');
  overlay.id = 'authModal';
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:9900',
    'display:none', 'align-items:center', 'justify-content:center',
    'background:rgba(0,0,0,.6)', 'backdrop-filter:blur(10px)',
    '-webkit-backdrop-filter:blur(10px)',
  ].join(';');

  overlay.innerHTML = /* html */`
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
      position:relative;
    ">
      <!-- Contenido inyectado dinámicamente por showAuthModal() -->
    </div>
  `;

  document.body.appendChild(overlay);
}

function _injectGlobalStyles() {
  if (document.getElementById('mn-auth-ui-styles')) return;

  const style = document.createElement('style');
  style.id = 'mn-auth-ui-styles';
  style.textContent = /* css */`
    @keyframes mnCardIn {
      from { opacity:0; transform:scale(.96) translateY(12px); }
      to   { opacity:1; transform:none; }
    }

    /* ── Layout ── */
    .mn-auth-modal-header { margin-bottom:20px; }
    .mn-auth-section      { margin-bottom:16px; }
    .mn-auth-divider      { border:none; border-top:1px solid var(--border2,rgba(255,255,255,.08)); margin:18px 0; }

    /* ── Trial box ── */
    .mn-auth-trial-box {
      background:rgba(99,102,241,.08);
      border:1px solid rgba(99,102,241,.2);
      border-radius:16px; padding:20px; text-align:center; margin-bottom:18px;
    }
    .mn-auth-trial-time  { font-size:2.2rem; font-weight:800; color:#6366F1; letter-spacing:-.05em; line-height:1; }
    .mn-auth-trial-label { font-size:.78rem; color:var(--text2,#94A3B8); margin:4px 0 12px; }
    .mn-auth-progress-track {
      height:6px; background:rgba(255,255,255,.08); border-radius:99px; overflow:hidden;
    }
    .mn-auth-progress-bar { height:100%; border-radius:99px; transition:width .6s; }

    /* ── Section ── */
    .mn-auth-section-label { font-size:.75rem; font-weight:700; color:var(--text,#E8EFF7); margin-bottom:4px; }
    .mn-auth-section-desc  { font-size:.78rem; color:var(--text2,#94A3B8); line-height:1.5; margin-bottom:10px; }

    /* ── Form ── */
    .mn-auth-form { display:flex; gap:8px; }
    .mn-auth-input {
      flex:1; padding:10px 14px; border-radius:10px;
      border:1.5px solid var(--border2,rgba(255,255,255,.1));
      background:var(--input-bg,rgba(255,255,255,.05));
      color:var(--text,#E8EFF7); font-family:inherit; font-size:.85rem;
      outline:none; transition:border-color .18s;
    }
    .mn-auth-input:focus { border-color:${C.accent}; }
    .mn-auth-msg { font-size:.78rem; margin-top:6px; }

    /* ── CTA box ── */
    .mn-auth-cta-box {
      background:rgba(0,212,170,.06);
      border:1px solid rgba(0,212,170,.15);
      border-radius:16px; padding:18px; margin-bottom:4px;
    }
    .mn-auth-cta-label { font-size:.75rem; font-weight:700; color:${C.accent}; margin-bottom:6px; }
    .mn-auth-cta-desc  { font-size:.78rem; color:var(--text2,#94A3B8); line-height:1.5; margin-bottom:14px; }

    /* ── Alert box (locked) ── */
    .mn-auth-alert-box {
      display:flex; align-items:center; gap:14px;
      background:rgba(244,63,94,.08); border:1px solid rgba(244,63,94,.2);
      border-radius:14px; padding:16px; margin-bottom:18px;
    }
    .mn-auth-alert-icon { font-size:2rem; flex-shrink:0; }
    .mn-auth-alert-text { font-size:.82rem; color:var(--text,#E8EFF7); line-height:1.6; }

    /* ── Price card ── */
    .mn-auth-price-card {
      background:linear-gradient(135deg,rgba(0,212,170,.1),rgba(0,212,170,.04));
      border:1px solid rgba(0,212,170,.25);
      border-radius:16px; padding:20px; margin-bottom:18px;
    }
    .mn-auth-price-label  { font-size:.68rem; font-weight:700; color:${C.accent}; text-transform:uppercase; letter-spacing:.1em; margin-bottom:8px; }
    .mn-auth-price-amount { font-size:2rem; font-weight:800; color:var(--text,#E8EFF7); letter-spacing:-.05em; line-height:1; margin-bottom:10px; }
    .mn-auth-price-amount span { font-size:.95rem; font-weight:600; color:var(--text2,#94A3B8); }
    .mn-auth-price-features { display:flex; flex-direction:column; gap:6px; }
    .mn-auth-pf { font-size:.78rem; color:var(--text2,#94A3B8); }

    /* ── Status box ── */
    .mn-auth-status-box {
      display:flex; align-items:center; gap:14px;
      border-radius:14px; padding:16px; margin-bottom:18px;
    }
    .mn-status-ok  { background:rgba(0,212,170,.08); border:1px solid rgba(0,212,170,.2); }
    .mn-status-pro { background:rgba(0,212,170,.1); border:1px solid rgba(0,212,170,.3); }
    .mn-status-icon  { font-size:1.8rem; flex-shrink:0; }
    .mn-status-title { font-size:.95rem; font-weight:700; color:var(--text,#E8EFF7); }
    .mn-status-desc  { font-size:.78rem; color:var(--text2,#94A3B8); margin-top:2px; }

    /* ── Upgrade box (local → pro) ── */
    .mn-auth-upgrade-box {
      background:linear-gradient(135deg,rgba(99,102,241,.08),rgba(99,102,241,.03));
      border:1px solid rgba(99,102,241,.2);
      border-radius:16px; padding:20px;
    }
    .mn-auth-upgrade-header  { display:flex; align-items:center; gap:12px; margin-bottom:14px; font-size:1.5rem; }
    .mn-auth-upgrade-title   { font-size:.9rem; font-weight:700; color:var(--text,#E8EFF7); }
    .mn-auth-upgrade-subtitle{ font-size:.75rem; color:${C.indigo}; font-weight:600; }
    .mn-auth-upgrade-features{ display:flex; flex-direction:column; gap:6px; margin-bottom:16px; }
    .mn-auth-uf { font-size:.78rem; color:var(--text2,#94A3B8); }
    .mn-auth-pro-note { font-size:.7rem; color:var(--text2,#94A3B8); text-align:center; margin-top:8px; }

    /* ── Pro features grid ── */
    .mn-auth-features-grid {
      display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:18px;
    }
    .mn-auth-fg {
      background:rgba(0,212,170,.06); border:1px solid rgba(0,212,170,.12);
      border-radius:10px; padding:10px 12px;
      font-size:.78rem; color:var(--text,#E8EFF7); font-weight:600;
    }

    /* ── Pro trial reminder ── */
    .mn-auth-trial-reminder {
      background:rgba(245,158,11,.08); border:1px solid rgba(245,158,11,.2);
      border-radius:12px; padding:14px;
      font-size:.78rem; color:var(--text2,#94A3B8); line-height:1.5;
      margin-bottom:16px; text-align:center;
    }

    /* ── Cancel Pro ── */
    .mn-btn-danger  { color:${C.red} !important; border-color:rgba(244,63,94,.25) !important; }
    .mn-btn-danger:hover { border-color:${C.red} !important; background:rgba(244,63,94,.08) !important; }
    .mn-auth-cancel-note { font-size:.7rem; color:var(--text2,#94A3B8); text-align:center; margin-top:6px; }

    /* ── Footer ── */
    .mn-auth-footer {
      font-size:.68rem; color:var(--text3,#64748B); text-align:center;
      margin-top:18px; line-height:1.5;
    }
    .mn-auth-footer code { font-size:.65rem; opacity:.6; }

    /* ── Buttons ── */
    .mn-btn-primary, .mn-btn-pro, .mn-btn-secondary, .mn-btn-ghost {
      width:100%; padding:14px; border-radius:13px; border:none;
      font-size:.9rem; font-weight:800; cursor:pointer;
      font-family:inherit; letter-spacing:-.01em; transition:transform .18s, box-shadow .18s;
    }
    .mn-btn-large { padding:16px; font-size:1rem; }
    .mn-btn-sm    { padding:9px 14px !important; font-size:.8rem !important; width:auto !important; }

    .mn-btn-primary {
      background:linear-gradient(135deg,${C.accent},${C.accentDark});
      color:#0A0E17; box-shadow:0 6px 20px rgba(0,212,170,.3);
      margin-bottom:0;
    }
    .mn-btn-primary:hover { transform:translateY(-2px); box-shadow:0 10px 30px rgba(0,212,170,.4); }

    .mn-btn-pro {
      background:linear-gradient(135deg,${C.indigo},${C.indigoDark});
      color:#fff; box-shadow:0 6px 20px rgba(99,102,241,.3);
    }
    .mn-btn-pro:hover { transform:translateY(-2px); box-shadow:0 10px 30px rgba(99,102,241,.4); }

    .mn-btn-secondary {
      background:rgba(255,255,255,.06);
      border:1.5px solid var(--border2,rgba(255,255,255,.1)) !important;
      color:var(--text,#E8EFF7); white-space:nowrap; flex-shrink:0;
    }
    .mn-btn-secondary:hover { border-color:${C.accent} !important; color:${C.accent}; }

    .mn-btn-ghost {
      background:transparent;
      border:1.5px solid var(--border2,rgba(255,255,255,.1)) !important;
      color:var(--text2,#94A3B8);
    }
    .mn-btn-ghost:hover { border-color:${C.accent} !important; color:${C.accent}; }
  `;

  document.head.appendChild(style);
}


// ════════════════════════════════════════════════════════════════
//  HELPERS INTERNOS
// ════════════════════════════════════════════════════════════════

function _planBadgeConfig(user) {
  const hoursLeft = _auth.trialHoursLeft ? _auth.trialHoursLeft() : 0;
  const configs = {
    trial:        { icon:'⏳', label:`Trial · ${Math.ceil(hoursLeft)}h`, color:'#6366F1', bg:'rgba(99,102,241,.1)',  border:'rgba(99,102,241,.25)' },
    locked_local: { icon:'🔒', label:'Bloqueado',                        color:C.red,     bg:'rgba(244,63,94,.1)',   border:'rgba(244,63,94,.25)'  },
    local:        { icon:'💾', label:'Local',                            color:C.accent,  bg:'rgba(0,212,170,.1)',   border:'rgba(0,212,170,.25)'  },
    pro:          { icon:'⚡', label:'Pro',                              color:C.accent,  bg:'rgba(0,212,170,.12)',  border:'rgba(0,212,170,.3)'   },
  };
  return configs[user.plan] || configs.trial;
}

function _toast(msg) {
  // Usa el sistema de toast de app.js si existe, si no crea uno temporal.
  if (typeof window.toast === 'function') {
    window.toast(msg);
    return;
  }
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#111827;color:#E8EFF7;padding:12px 20px;border-radius:12px;font-size:.85rem;font-weight:600;z-index:99999;box-shadow:0 8px 32px rgba(0,0,0,.4);animation:mnCardIn .3s ease';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}


// ════════════════════════════════════════════════════════════════
//  EXPORT GLOBAL
// ════════════════════════════════════════════════════════════════
if (typeof window !== 'undefined') {
  window.MNAuthUI = {
    initAuthUI,
    showAuthModal,
    closeAuthModal,
    renderAuthBadge,
    renderTrialPill,
  };
}

// ── También redefine _showAuthModal() para compatibilidad con app.js ──
if (typeof window !== 'undefined') {
  window._showAuthModal = showAuthModal;
}
