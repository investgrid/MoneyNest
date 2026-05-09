/**
 * ════════════════════════════════════════════════════════════════
 *  MoneyNest — js/billing-ui.js  v3.0
 *  Dynamic Billing Center UI — 3 Scenarios + Hard Paywall
 *
 *  Escenario A: Free Trial (24h activas)
 *  Escenario B: Local Lifetime — upsell a Pro
 *  Escenario C: Pro Active — dashboard de suscripción limpio
 *  Paywall:     Trial expirado → bloqueo total, embudo Local-First
 * ════════════════════════════════════════════════════════════════
 */

'use strict';

// ────────────────────────────────────────────────────────────────
//  GLOBAL STATE BUS
//  Reactivo: cualquier cambio en MNBilling dispara _onStateChange()
//  que re-renderiza INMEDIATAMENTE sin reload.
// ────────────────────────────────────────────────────────────────

let _lastScenario = null;   // para evitar re-renders innecesarios

function _b() { return window.MNBilling; }

/**
 * Derive the current scenario from MNBilling state.
 * Returns: 'TRIAL' | 'LOCAL' | 'PRO' | 'EXPIRED'
 */
function _getScenario() {
  const b = _b();
  if (!b) return 'TRIAL';
  const { sub, state } = b.getSubStatus();

  const has_local = sub.plan === 'local_lifetime';
  const is_pro    = sub.plan === 'pro_annual' &&
                    (state === 'pro_active' || state === 'pro_trialing');

  const fecha_reg      = sub.startedAt || sub.createdAt || Date.now();
  const trial_24h_gone = (Date.now() - fecha_reg) > 24 * 60 * 60 * 1000;
  const is_expired     = state === 'expired_trial' ||
                         (trial_24h_gone && !has_local && !is_pro);

  if (is_expired) return 'EXPIRED';
  if (is_pro)     return 'PRO';
  if (has_local)  return 'LOCAL';
  return 'TRIAL';
}

/**
 * Central handler — called on every billing state change.
 * Manages paywall + billing page reactively.
 */
function _onStateChange() {
  const scenario = _getScenario();

  // 1. Paywall management (global, regardless of current page)
  _manageLockOverlay(scenario);

  // 2. Export button gating (global)
  _applyExportGating(scenario);

  // 3. Dynamic background — only applied when inside the billing view
  if (_isBillingPageActive()) {
    initDynamicBg();
  }

  // 4. Global UI badges
  _refreshBadges();

  // 5. If billing page is visible — re-render it reactively
  if (_isBillingPageActive()) {
    renderBillingPage();
  }

  _lastScenario = scenario;
}

function _isBillingPageActive() {
  // Support both: app.js local `currentPage` and window.currentPage alias
  const cp = (typeof currentPage !== 'undefined' ? currentPage : null) ||
             window.currentPage;
  return cp === 'billing';
}

// ────────────────────────────────────────────────────────────────
//  PAYWALL MANAGER — Hard block, no read-only
// ────────────────────────────────────────────────────────────────

let _lockActive = false;

function _manageLockOverlay(scenario) {
  if (scenario === 'EXPIRED') {
    if (!_lockActive) _activateLock();
  } else {
    if (_lockActive) _deactivateLock();
  }
}

function _activateLock() {
  _lockActive = true;

  // Prevent ALL interaction with the app behind the overlay
  document.body.style.overflow = 'hidden';

  let overlay = document.getElementById('billingLockOverlay');
  if (overlay) return; // already showing

  overlay = document.createElement('div');
  overlay.id = 'billingLockOverlay';

  // Intercept ALL pointer events globally
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:99000;
    display:flex;align-items:center;justify-content:center;
    padding:24px;
    background:rgba(7,10,18,0.82);
    backdrop-filter:blur(20px) saturate(0.6);
    -webkit-backdrop-filter:blur(20px) saturate(0.6);
    animation:lockOverlayIn 0.5s cubic-bezier(0.22,1,0.36,1) forwards;
  `;

  overlay.innerHTML = `
  <div class="lock-wrap">
    <div class="lock-card" style="position:relative;max-width:440px;width:100%">
      <div class="lock-card-top-bar"></div>
      <div class="lock-card-glow"></div>

      <div class="lock-header">
        <div class="lock-expired-badge">
          <span class="lock-expired-dot"></span>
          Tu prueba ha expirado
        </div>

        <div class="lock-icon-wrap">
          <span class="lock-icon">🔒</span>
        </div>

        <div class="lock-title">Acceso bloqueado</div>
        <div class="lock-sub">
          Tu periodo de prueba gratuita de 24h ha concluido.<br>
          Desbloquea MoneyNest para siempre por un pago único de <strong>€5</strong>.
        </div>
      </div>

      <div class="lock-body">
        <div class="lock-features">
          <div class="lock-feat">✅ Todos tus datos están seguros</div>
          <div class="lock-feat">✅ Acceso ilimitado sin suscripción</div>
          <div class="lock-feat">✅ Exportación PDF y Excel</div>
          <div class="lock-feat">✅ Sin publicidad, sin rastreo</div>
        </div>

        <div class="lock-ctas">
          <!-- ÚNICO CTA principal: Local (embudo Local-First) -->
          <button class="lock-cta-primary" id="lockBuyLocalBtn"
            onclick="MNBillingUI.startBuyLocal()">
            🔓 Desbloquear para siempre — €5 único
          </button>
          <div class="lock-cta-sub-note">
            Después podrás añadir sincronización en la nube (Plan Pro, €5/año)
          </div>
        </div>

        <p class="lock-note">
          ¿Ya tienes licencia?
          <a href="#" onclick="event.preventDefault();MNBillingUI._restoreAccess()">
            Restaurar acceso
          </a>
        </p>
      </div>
    </div>
  </div>`;

  document.body.appendChild(overlay);
}

function _deactivateLock() {
  _lockActive = false;
  document.body.style.overflow = '';

  const overlay = document.getElementById('billingLockOverlay');
  if (!overlay) return;
  overlay.style.animation = 'lockOverlayOut 0.3s ease forwards';
  setTimeout(() => overlay.remove(), 320);
}

function showLockOverlay() {
  _activateLock();
}

function hideLockOverlay() {
  _deactivateLock();
}

// Alias para el link "Restaurar acceso" — en producción haría lookup de licencia
function _restoreAccess() {
  // Por ahora abre el flow de compra
  startBuyLocal();
}

// ════════════════════════════════════════════════════════════════
//  BILLING PAGE — RENDER DISPATCHER
// ════════════════════════════════════════════════════════════════

function renderBillingPage() {
  const content = document.getElementById('content');
  if (!content) return;

  const scenario = _getScenario();

  // Empty the container first (clean slate)
  content.innerHTML = '';

  switch (scenario) {
    case 'EXPIRED': _renderExpired(content);  break;
    case 'PRO':     _renderPro(content);      break;
    case 'LOCAL':   _renderLocal(content);    break;
    default:        _renderTrial(content);    break;
  }
}

// ════════════════════════════════════════════════════════════════
//  ESCENARIO A — Free Trial
// ════════════════════════════════════════════════════════════════

function _renderTrial(content) {
  const b = _b();
  const { sub } = b.getSubStatus();
  const trialUsed = sub?.proTrialUsed;
  const tl = b.getTrialTimeLeft();

  const totalMs  = 24 * 60 * 60 * 1000;
  const pct      = Math.max(0, Math.min(1, tl.ms / totalMs));
  const r = 28, circ = 2 * Math.PI * r;
  const offset   = (circ * (1 - pct)).toFixed(2);
  const isEnding = tl.ms > 0 && tl.ms < 4 * 60 * 60 * 1000;

  content.innerHTML = `
  <div class="billing-page">
    <div class="section-header">
      <div>
        <div class="page-h1">💳 Plan & Facturación</div>
        <div class="page-sub">Gestiona tu suscripción y acceso a MoneyNest</div>
      </div>
      <span class="plan-status-badge badge--trial">
        <span class="badge-dot"></span> Trial Activo
      </span>
    </div>

    <!-- Trial banner -->
    <div class="mn-trial-banner ${isEnding ? 'mn-trial-banner--ending' : ''}">
      <div class="mn-trial-banner__text">
        <div class="mn-trial-banner__headline">
          ${isEnding ? '⚠️ Tu prueba está terminando pronto' : '🕐 Estás en tu periodo de prueba gratuita'}
        </div>
        <div class="mn-trial-banner__sub">
          Te quedan <strong id="trialCountdownTime">${tl.label || '0m'}</strong>
          para proteger tus datos permanentemente.
        </div>
      </div>
      <div class="mn-trial-banner__ring">
        <svg width="64" height="64" viewBox="0 0 64 64" style="transform:rotate(-90deg)">
          <circle cx="32" cy="32" r="${r}" fill="none"
            stroke="rgba(255,255,255,0.10)" stroke-width="4"/>
          <circle cx="32" cy="32" r="${r}" fill="none"
            stroke="${isEnding ? '#FBBF24' : '#A78BFA'}" stroke-width="4"
            stroke-linecap="round"
            stroke-dasharray="${circ.toFixed(2)}"
            stroke-dashoffset="${offset}"/>
        </svg>
      </div>
    </div>

    <!-- Plan grid -->
    <div class="billing-section" style="padding:28px">
      <div class="billing-section-title">Elige tu plan</div>
      <div class="mn-section-sub">Protege tus datos antes de que expire tu prueba gratuita</div>
      <div class="mn-trial-grid">

        <!-- Free Trial (dim, actual) -->
        <div class="mn-plan-card mn-plan-card--trial mn-plan-card--current-dim">
          <div class="mn-plan-card__badge">Plan actual</div>
          <div class="mn-plan-card__icon">⏳</div>
          <div class="mn-plan-card__name">Free Trial</div>
          <div class="mn-plan-card__price-block">
            <span class="mn-price-flat">Gratis</span>
          </div>
          <div class="mn-plan-card__period">Acceso 24 horas</div>
          <ul class="mn-plan-card__features">
            <li>✓ 📱 Todas las pantallas</li>
            <li>✓ 💾 Datos locales</li>
            <li>✓ 📄 Exportar PDF</li>
            <li class="mn-feat--locked">🔒 Sin exportación Excel</li>
            <li class="mn-feat--locked">🔒 Sin cloud sync</li>
          </ul>
          <div class="mn-plan-card__cta mn-plan-card__cta--current">✓ Plan actual</div>
        </div>

        <!-- Local Lifetime (HERO — objetivo conversión) -->
        <div class="mn-plan-card mn-plan-card--local mn-plan-card--hero">
          <div class="mn-plan-card__popular-tag">⭐ Más elegido</div>
          <div class="mn-plan-card__glow"></div>
          <div class="mn-plan-card__icon">💾</div>
          <div class="mn-plan-card__name">Local Lifetime</div>
          <div class="mn-plan-card__price-block">
            <span class="mn-price-currency mn-price-currency--local">€</span>
            <span class="mn-price-amount mn-price-amount--local">5</span>
          </div>
          <div class="mn-plan-card__period">Pago único · Para siempre</div>
          <ul class="mn-plan-card__features">
            <li>✓ ∞ Datos ilimitados</li>
            <li>✓ 📊 Exportar Excel</li>
            <li>✓ 🔌 Funciona offline</li>
            <li>✓ 🔒 Sin fecha de expiración</li>
            <li>✓ 💾 Datos solo en tu dispositivo</li>
          </ul>
          <button class="mn-plan-card__cta mn-plan-card__cta--local"
            onclick="MNBillingUI.startBuyLocal()">
            🔓 Desbloquear Forever — €5
          </button>
          <div class="mn-plan-card__guarantee">✅ Pago único · Sin suscripción</div>
        </div>

        <!-- Pro Annual -->
        <div class="mn-plan-card mn-plan-card--pro">
          <div class="mn-plan-card__icon">⚡</div>
          <div class="mn-plan-card__name">Pro</div>
          <div class="mn-plan-card__price-block">
            <span class="mn-price-currency mn-price-currency--pro">€</span>
            <span class="mn-price-amount mn-price-amount--pro">5</span>
            <span class="mn-price-period">/ año</span>
          </div>
          <div class="mn-plan-card__period">7 días gratis incluidos</div>
          <ul class="mn-plan-card__features">
            <li>✓ ☁️ Cloud sync</li>
            <li>✓ 🖥️ Multi-dispositivo</li>
            <li>✓ 📦 Backup automático</li>
            <li>✓ ✨ Insights con IA</li>
            <li>✓ ⭐ Soporte prioritario</li>
          </ul>
          <button class="mn-plan-card__cta mn-plan-card__cta--pro"
            onclick="MNBillingUI.startActivatePro()">
            ${trialUsed ? '⚡ Activar Pro — €5/año' : '⚡ Iniciar 7 días gratis'}
          </button>
        </div>

      </div>
    </div>

    ${_sectionInvoices()}
  </div>`;

  _startCountdownTimer();
}

// ════════════════════════════════════════════════════════════════
//  ESCENARIO B — Local Lifetime: comparativa + upsell Pro
// ════════════════════════════════════════════════════════════════

function _renderLocal(content) {
  const b = _b();
  const { sub } = b.getSubStatus();
  const trialUsed = sub?.proTrialUsed;

  content.innerHTML = `
  <div class="billing-page">
    <div class="section-header">
      <div>
        <div class="page-h1">💳 Plan & Facturación</div>
        <div class="page-sub">Gestiona tu suscripción y acceso a MoneyNest</div>
      </div>
      <span class="plan-status-badge badge--local">
        <span class="badge-dot"></span> Local Lifetime
      </span>
    </div>

    <!-- COMPARATIVA DUAL -->
    <div class="billing-section" style="padding:28px">
      <div class="billing-section-title">Tu plan vs Pro</div>
      <div class="mn-dual-compare">

        <!-- Izquierda: Local (actual) -->
        <div class="mn-dual-card mn-dual-card--local">
          <div class="mn-dual-card__header">
            <div class="mn-dual-card__icon">💾</div>
            <div>
              <div class="mn-dual-card__name">Local Lifetime</div>
              <div class="mn-dual-card__tagline">Pago único · Lifetime · Offline-first</div>
            </div>
          </div>
          <div class="mn-dual-card__current-tag">
            <span>✓</span> Plan Actual — Desbloqueado
          </div>
          <ul class="mn-dual-card__features">
            <li class="mn-feat--ok">✓ ∞ Datos ilimitados</li>
            <li class="mn-feat--ok">✓ 📄 Exportar PDF</li>
            <li class="mn-feat--ok">✓ 📊 Exportar Excel</li>
            <li class="mn-feat--ok">✓ 🔌 Funciona offline</li>
            <li class="mn-feat--ok">✓ 🔒 Sin expiración nunca</li>
            <li class="mn-feat--ok">✓ 💾 Datos solo en tu dispositivo</li>
            <li class="mn-feat--no">✗ ☁️ Sin cloud sync</li>
            <li class="mn-feat--no">✗ 🖥️ Sin multi-dispositivo</li>
            <li class="mn-feat--no">✗ 📦 Sin backup automático</li>
          </ul>
          <div class="mn-dual-card__price-row">
            <span class="mn-dual-price mn-dual-price--paid">€5 — pagado ✓</span>
          </div>
        </div>

        <!-- Separador -->
        <div class="mn-dual-arrow">
          <div class="mn-dual-arrow__line"></div>
          <div class="mn-dual-arrow__label">Upgrade</div>
          <div class="mn-dual-arrow__icon">→</div>
        </div>

        <!-- Derecha: Pro (upsell) -->
        <div class="mn-dual-card mn-dual-card--pro">
          <div class="mn-dual-card__glow"></div>
          <div class="mn-dual-card__pro-badge">⚡ Pro</div>
          <div class="mn-dual-card__header">
            <div class="mn-dual-card__icon mn-dual-card__icon--pro">⚡</div>
            <div>
              <div class="mn-dual-card__name">Pro Annual</div>
              <div class="mn-dual-card__tagline">Suscripción anual · Cloud sync activo</div>
            </div>
          </div>
          <div class="mn-dual-card__upgrade-highlights">
            <div class="mn-upgrade-item">
              <span class="mn-upgrade-item__icon">☁️</span>
              <div>
                <div class="mn-upgrade-item__title">Cloud Sync</div>
                <div class="mn-upgrade-item__desc">Datos sincronizados en tiempo real</div>
              </div>
            </div>
            <div class="mn-upgrade-item">
              <span class="mn-upgrade-item__icon">📦</span>
              <div>
                <div class="mn-upgrade-item__title">Backup automático en la nube</div>
                <div class="mn-upgrade-item__desc">Nunca pierdas tus datos financieros</div>
              </div>
            </div>
            <div class="mn-upgrade-item">
              <span class="mn-upgrade-item__icon">🖥️</span>
              <div>
                <div class="mn-upgrade-item__title">Multi-dispositivo</div>
                <div class="mn-upgrade-item__desc">Móvil, tablet y ordenador</div>
              </div>
            </div>
            <div class="mn-upgrade-item">
              <span class="mn-upgrade-item__icon">✨</span>
              <div>
                <div class="mn-upgrade-item__title">Insights con IA</div>
                <div class="mn-upgrade-item__desc">Análisis inteligente de tus finanzas</div>
              </div>
            </div>
          </div>
          <div class="mn-dual-card__price-row">
            <span class="mn-dual-price mn-dual-price--pro">€5 / año</span>
            ${!trialUsed ? '<span class="mn-dual-trial-tag">7 días gratis</span>' : ''}
          </div>
          <button class="mn-dual-card__cta" onclick="MNBillingUI.startActivatePro()">
            ${trialUsed ? '⚡ Activar Pro — €5/año' : '⚡ Probar 7 días gratis →'}
          </button>
        </div>

      </div>
    </div>

    <!-- Gestión cuenta local -->
    <div class="billing-section">
      <div class="billing-section-title">⚙️ Tu cuenta Local</div>
      <div class="billing-row">
        <span class="billing-row-label">📦 Plan</span>
        <span class="billing-row-value">Local Lifetime — pago único</span>
      </div>
      <div class="billing-row">
        <span class="billing-row-label">✅ Expiración</span>
        <span class="billing-row-value positive">Nunca expira</span>
      </div>
      <div class="billing-row">
        <span class="billing-row-label">📦 Backup manual</span>
        <span class="billing-row-value">
          <button onclick="if(typeof exportarJSON==='function')exportarJSON()"
            style="font-size:.72rem;padding:4px 10px;border-radius:7px;border:1px solid rgba(0,212,170,0.3);background:rgba(0,212,170,0.08);color:#00D4AA;cursor:pointer;font-family:inherit;font-weight:700">
            Exportar JSON
          </button>
        </span>
      </div>
    </div>

    ${_sectionInvoices()}
  </div>`;
}

// ════════════════════════════════════════════════════════════════
//  ESCENARIO C — Pro Active: dashboard premium limpio
// ════════════════════════════════════════════════════════════════

function _renderPro(content) {
  const b = _b();
  const { sub, state } = b.getSubStatus();
  const isTrialing = state === 'pro_trialing';

  const trialDaysLeft = sub.proTrialEndsAt
    ? Math.ceil(Math.max(0, sub.proTrialEndsAt - Date.now()) / 86400000)
    : 0;
  const trialPct = isTrialing
    ? Math.max(5, ((7 - trialDaysLeft) / 7) * 100).toFixed(1)
    : 100;

  const nextBilling = sub.nextBillingAt ? b.formatNextBilling(sub.nextBillingAt) : '—';
  const lastSync    = sub.lastSyncAt    ? b.formatDate(sub.lastSyncAt)           : 'hoy';
  const renewDate   = sub.nextBillingAt ? b.formatNextBilling(sub.nextBillingAt) : '—';

  content.innerHTML = `
  <div class="billing-page">
    <div class="section-header">
      <div>
        <div class="page-h1">💳 Plan & Facturación</div>
        <div class="page-sub">Gestiona tu suscripción y acceso a MoneyNest</div>
      </div>
      <span class="plan-status-badge badge--pro">
        <span class="badge-dot"></span> ${isTrialing ? 'Pro · Prueba' : 'Pro Activo'}
      </span>
    </div>

    <!-- PRO HERO -->
    <div class="mn-pro-hero">
      <div class="mn-pro-hero__glow"></div>
      <div class="mn-pro-hero__content">
        <div class="mn-pro-hero__icon">☁️</div>
        <div class="mn-pro-hero__title">Tu cuenta está protegida en la nube</div>
        <div class="mn-pro-hero__sub">
          ${isTrialing
            ? `Estás en tu prueba Pro — <strong>${trialDaysLeft} día${trialDaysLeft !== 1 ? 's' : ''} restante${trialDaysLeft !== 1 ? 's' : ''}</strong> antes de la primera facturación.`
            : `Sincronización activa · Backup automático · Multi-dispositivo habilitado.`}
        </div>

        ${isTrialing ? `
        <div class="mn-pro-trial-bar">
          <div class="mn-pro-trial-bar__label">
            <span>Inicio prueba</span>
            <span>${trialDaysLeft}d restantes</span>
            <span>Fin 7 días</span>
          </div>
          <div class="mn-pro-trial-bar__track">
            <div class="mn-pro-trial-bar__fill" style="width:${trialPct}%"></div>
          </div>
        </div>` : ''}
      </div>
    </div>

    <!-- SUBSCRIPTION DASHBOARD -->
    <div class="billing-section" style="padding:28px">
      <div class="billing-section-title">📊 Dashboard de Suscripción</div>

      <div class="mn-sub-dashboard">
        <div class="mn-sub-stat">
          <div class="mn-sub-stat__icon">✅</div>
          <div class="mn-sub-stat__label">Estado</div>
          <div class="mn-sub-stat__value mn-sub-stat__value--pro">
            ${isTrialing ? 'Periodo de prueba' : 'Activo'}
          </div>
        </div>
        <div class="mn-sub-stat">
          <div class="mn-sub-stat__icon">📅</div>
          <div class="mn-sub-stat__label">Próximo cobro</div>
          <div class="mn-sub-stat__value">${renewDate}</div>
        </div>
        <div class="mn-sub-stat">
          <div class="mn-sub-stat__icon">💶</div>
          <div class="mn-sub-stat__label">Importe</div>
          <div class="mn-sub-stat__value">€5 / año</div>
        </div>
        <div class="mn-sub-stat">
          <div class="mn-sub-stat__icon">☁️</div>
          <div class="mn-sub-stat__label">Última sync</div>
          <div class="mn-sub-stat__value">${lastSync}</div>
        </div>
      </div>

      <!-- CTA principal de gestión -->
      <div class="mn-sub-manage-cta">
        <button class="mn-sub-manage-btn"
          onclick="alert('Próximamente: portal de facturación Stripe')">
          ⚙️ Gestionar mi suscripción
        </button>
        <button class="mn-sub-invoices-btn"
          onclick="alert('Próximamente: historial de facturas')">
          🧾 Ver facturas
        </button>
      </div>
    </div>

    <!-- VENTAJAS ACTIVAS -->
    <div class="billing-section" style="padding:28px">
      <div class="billing-section-title">✅ Ventajas activas</div>
      <div class="mn-pro-benefits">
        <div class="mn-pro-benefit">
          <div class="mn-pro-benefit__icon">☁️</div>
          <div>
            <div class="mn-pro-benefit__title">Cloud Sync activo</div>
            <div class="mn-pro-benefit__desc">Última sincronización: ${lastSync}</div>
          </div>
          <button onclick="MNBillingUI.triggerSync()" class="mn-pro-benefit__action">Sincronizar</button>
        </div>
        <div class="mn-pro-benefit">
          <div class="mn-pro-benefit__icon">🖥️</div>
          <div>
            <div class="mn-pro-benefit__title">Multi-dispositivo</div>
            <div class="mn-pro-benefit__desc">${sub.deviceCount || 1} dispositivo${(sub.deviceCount||1) !== 1 ? 's' : ''} vinculado${(sub.deviceCount||1) !== 1 ? 's' : ''}</div>
          </div>
        </div>
        <div class="mn-pro-benefit">
          <div class="mn-pro-benefit__icon">📦</div>
          <div>
            <div class="mn-pro-benefit__title">Backup automático en la nube</div>
            <div class="mn-pro-benefit__desc">Tus datos siempre seguros y recuperables</div>
          </div>
          <span class="mn-pro-benefit__status-ok">Activo</span>
        </div>
        <div class="mn-pro-benefit">
          <div class="mn-pro-benefit__icon">🔐</div>
          <div>
            <div class="mn-pro-benefit__title">Cifrado extremo a extremo</div>
            <div class="mn-pro-benefit__desc">Privacidad total en tránsito y reposo</div>
          </div>
          <span class="mn-pro-benefit__status-ok">Habilitado</span>
        </div>
        <div class="mn-pro-benefit">
          <div class="mn-pro-benefit__icon">✨</div>
          <div>
            <div class="mn-pro-benefit__title">Insights con IA</div>
            <div class="mn-pro-benefit__desc">Análisis inteligente de tus finanzas</div>
          </div>
          <span class="mn-pro-benefit__status-ok">Activo</span>
        </div>
      </div>
    </div>

    <!-- Cancelar Pro -->
    <div class="billing-section">
      <div class="billing-section-title">⚙️ Opciones avanzadas</div>
      <div id="cancelProArea">
        <button onclick="MNBillingUI.showCancelConfirm()"
          style="width:100%;padding:11px;border-radius:10px;font-size:.78rem;font-weight:700;cursor:pointer;font-family:inherit;background:rgba(244,63,94,0.08);border:1px solid rgba(244,63,94,0.2);color:#FB7185">
          Cancelar suscripción Pro
        </button>
      </div>
    </div>

    ${_sectionInvoices()}
  </div>`;
}

// ════════════════════════════════════════════════════════════════
//  ESCENARIO EXPIRED — vista fantasma (el overlay cubre todo)
// ════════════════════════════════════════════════════════════════

function _renderExpired(content) {
  // We just show the dashboard shell behind the overlay — it's blurred anyway
  content.innerHTML = `
  <div class="billing-page" style="pointer-events:none;user-select:none">
    <div class="section-header">
      <div>
        <div class="page-h1">💳 Plan & Facturación</div>
        <div class="page-sub">Tu prueba ha expirado</div>
      </div>
    </div>
    <div style="height:300px;display:flex;align-items:center;justify-content:center;opacity:.3;font-size:.9rem;color:var(--text2)">
      Contenido no disponible
    </div>
  </div>`;
}

// ════════════════════════════════════════════════════════════════
//  SHARED SECTION BUILDERS
// ════════════════════════════════════════════════════════════════

function _sectionInvoices() {
  const b = _b();
  const invoices = b.getInvoices();
  return `
  <div class="billing-section">
    <div class="billing-section-title">🧾 Historial de pagos</div>
    ${invoices.length === 0
      ? `<div style="padding:20px;text-align:center;color:var(--text2);font-size:.82rem">
           Sin historial de pagos
         </div>`
      : invoices.map(inv => `
        <div class="invoice-row">
          <span class="invoice-plan-tag">${inv.plan === 'local_lifetime' ? 'Local' : 'Pro'}</span>
          <span class="invoice-date">${b.formatDate(inv.date)}</span>
          <span class="invoice-amount">€${inv.amount.toFixed(2)}</span>
          <span class="invoice-status">${inv.status === 'paid' ? 'Pagado' : inv.status}</span>
        </div>`).join('')}
  </div>`;
}



// ════════════════════════════════════════════════════════════════
//  COUNTDOWN TIMER
// ════════════════════════════════════════════════════════════════

let _cdTimer = null;

function _startCountdownTimer() {
  if (_cdTimer) clearInterval(_cdTimer);
  _cdTimer = setInterval(() => {
    const el = document.getElementById('trialCountdownTime');
    if (!el) { clearInterval(_cdTimer); return; }
    const tl = _b().getTrialTimeLeft();
    if (tl.ms <= 0) {
      clearInterval(_cdTimer);
      // Trigger state change which will handle everything
      _onStateChange();
      return;
    }
    el.textContent = tl.label;
    el.classList.add('counter-animate');
    setTimeout(() => el.classList.remove('counter-animate'), 300);
  }, 60000);
}

// ════════════════════════════════════════════════════════════════
//  EXPORT BUTTON GATING
// ════════════════════════════════════════════════════════════════

function _applyExportGating(scenario) {
  scenario = scenario || _getScenario();
  const isLocked = scenario === 'TRIAL' || scenario === 'EXPIRED';

  document.querySelectorAll(
    '[onclick*="exportarGastos"], [onclick*="exportarPDF"], [onclick*="exportarIngresos"]'
  ).forEach(btn => {
    if (isLocked && !btn.dataset.locked) {
      btn.dataset.originalOnclick = btn.getAttribute('onclick');
      btn.setAttribute('onclick', 'MNBillingUI._exportBlocked()');
      btn.dataset.locked = '1';
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
      btn.title = 'Disponible en Plan Local o Pro';
    } else if (!isLocked && btn.dataset.locked) {
      btn.setAttribute('onclick', btn.dataset.originalOnclick || '');
      delete btn.dataset.locked;
      delete btn.dataset.originalOnclick;
      btn.style.opacity = '';
      btn.style.cursor = '';
      btn.title = '';
    }
  });
}

function _exportBlocked() {
  if (typeof window.toast === 'function') {
    toast('🔒 Exportación disponible en Plan Local — €5 único', 'warning');
  }
  if (typeof window.goTo === 'function') goTo('billing');
}

// ════════════════════════════════════════════════════════════════
//  CHECKOUT FLOWS
// ════════════════════════════════════════════════════════════════

function _showCheckoutModal(color, onStart) {
  document.getElementById('billingCheckoutModal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'billingCheckoutModal';
  modal.style.cssText = `
    position:fixed;inset:0;z-index:99500;display:flex;align-items:center;
    justify-content:center;padding:24px;
    background:rgba(10,14,23,0.85);
    backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
    animation:lockOverlayIn 0.3s ease forwards;`;
  modal.innerHTML = `
  <div style="background:var(--card,#111827);border:1px solid rgba(255,255,255,0.08);
    border-radius:24px;width:min(420px,100%);overflow:hidden;
    box-shadow:0 40px 100px rgba(0,0,0,0.7);
    animation:lockCardIn 0.4s cubic-bezier(0.22,1,0.36,1) forwards">
    <div style="height:4px;background:linear-gradient(90deg,${color},${color}88)"></div>
    <div id="billingCheckoutBody" style="padding:32px">
      <div class="billing-processing">
        <div class="billing-processing-icon" style="border-top-color:${color}"></div>
        <div class="billing-processing-msg" id="billingCheckoutMsg">Iniciando…</div>
      </div>
    </div>
  </div>`;

  document.body.appendChild(modal);
  onStart(modal);
}

function _closeCheckoutModal() {
  const m = document.getElementById('billingCheckoutModal');
  if (!m) return;
  m.style.animation = 'lockOverlayIn 0.25s reverse forwards';
  setTimeout(() => m.remove(), 260);
}

function startBuyLocal() {
  // Close lock overlay first (it will reappear if purchase fails)
  document.getElementById('billingLockOverlay')?.remove();
  _lockActive = false;

  _showCheckoutModal('#00D4AA', async () => {
    const msg = () => document.getElementById('billingCheckoutMsg');
    try {
      await _b().mockBuyLocal({
        onProgress: (m) => { if (msg()) msg().textContent = m; }
      });
      const body = document.getElementById('billingCheckoutBody');
      if (body) {
        body.innerHTML = `
          <div class="billing-success">
            <div class="billing-success-icon">🔓</div>
            <div class="billing-success-title">¡Plan Local activado!</div>
            <div class="billing-success-sub">Acceso permanente. Nunca más verás el bloqueo.</div>
          </div>`;
      }
      // State change fires automatically via mn:billing:activated → mn:billing:change
      setTimeout(() => { _closeCheckoutModal(); }, 2200);
    } catch { _closeCheckoutModal(); }
  });
}

function startActivatePro() {
  document.getElementById('billingLockOverlay')?.remove();
  _lockActive = false;

  _showCheckoutModal('#A78BFA', async () => {
    const msg = () => document.getElementById('billingCheckoutMsg');
    try {
      await _b().mockActivatePro({
        onProgress: (m) => { if (msg()) msg().textContent = m; }
      });
      const body = document.getElementById('billingCheckoutBody');
      if (body) {
        body.innerHTML = `
          <div class="billing-success">
            <div class="billing-success-icon">⚡</div>
            <div class="billing-success-title">¡Bienvenido a Pro!</div>
            <div class="billing-success-sub">7 días de prueba activos. Cloud sync habilitado.</div>
          </div>`;
      }
      setTimeout(() => { _closeCheckoutModal(); }, 2200);
    } catch { _closeCheckoutModal(); }
  });
}

async function triggerSync() {
  const b = _b();
  if (!b.getSub() || b.getSub().plan !== 'pro_annual') return;
  document.querySelectorAll('.sync-indicator').forEach(el => {
    el.className = 'sync-indicator sync-indicator--syncing';
    el.innerHTML = '<div class="sync-spinner"></div> Sincronizando…';
  });
  await b.mockSyncCloud({});
  if (typeof window.toast === 'function') toast('☁️ Sincronización completada');
  // _onStateChange will re-render if on billing page
}

async function confirmCancelPro() {
  const area = document.getElementById('cancelProArea');
  if (area) area.innerHTML = `<div style="font-size:.8rem;color:var(--text2);text-align:center;padding:12px">Cancelando…</div>`;
  await _b().mockCancelPro({
    onProgress: (m) => { if (area) area.innerHTML = `<div style="font-size:.8rem;color:var(--text2);text-align:center;padding:12px">${m}</div>`; }
  });
  // _onStateChange fires via mn:billing:cancelled → renders LOCAL scenario
}

function showCancelConfirm() {
  const area = document.getElementById('cancelProArea');
  if (!area) return;
  area.innerHTML = `
  <div class="cancel-confirm-card">
    <p>¿Seguro que quieres cancelar Pro? Seguirás con <strong>Local Lifetime</strong>. Perderás el cloud sync.</p>
    <div class="cancel-confirm-btns">
      <button class="btn-cancel-confirm btn-cancel-keep" onclick="MNBillingUI.hideCancelConfirm()">Mantener Pro</button>
      <button class="btn-cancel-confirm btn-cancel-go" onclick="MNBillingUI.confirmCancelPro()">Sí, cancelar</button>
    </div>
  </div>`;
}

function hideCancelConfirm() {
  const area = document.getElementById('cancelProArea');
  if (!area) return;
  area.innerHTML = `
  <button onclick="MNBillingUI.showCancelConfirm()"
    style="width:100%;padding:11px;border-radius:10px;font-size:.78rem;font-weight:700;
    cursor:pointer;font-family:inherit;background:rgba(244,63,94,0.08);
    border:1px solid rgba(244,63,94,0.2);color:#FB7185">
    Cancelar suscripción Pro
  </button>`;
}

// ════════════════════════════════════════════════════════════════
//  DYNAMIC BACKGROUNDS
// ════════════════════════════════════════════════════════════════

// ── Dynamic background: BILLING PAGE ONLY ───────────────────────
// Applies plan-colored canvas + orbs exclusively inside the billing view.
// Must never pollute the global layout (dashboard, etc.).

function initDynamicBg() {
  // Guard: only apply when the billing page is the active view
  if (!_isBillingPageActive()) {
    cleanupDynamicBg();
    return;
  }

  const b = _b();
  if (!b) return;
  const plan = b.getSub()?.plan || 'free_trial';

  let canvas = document.getElementById('mn-bg-canvas');
  if (!canvas) {
    canvas = document.createElement('div');
    canvas.id = 'mn-bg-canvas';
    // Scoped to billing content area — never injected globally into body
    const content = document.getElementById('content');
    const parent = content || document.body;
    parent.insertBefore(canvas, parent.firstChild);
  }

  canvas.className = '';
  // Strip any stale plan classes from body (safety)
  document.body.className = document.body.className.replace(/\bplan-[\w-]+\b/g, '').trim();

  const bgMap = { free_trial:'mn-bg--trial', local_lifetime:'mn-bg--local', pro_annual:'mn-bg--pro' };
  canvas.classList.add(bgMap[plan] || 'mn-bg--trial');
  // Scope plan class to canvas only — NOT body
  canvas.classList.add('plan-' + plan.replace(/_/g, '-'));

  document.querySelectorAll('.pro-orb').forEach(o => o.remove());
  if (plan === 'pro_annual') {
    [
      { size:400, top:'10%', left:'-10%', color:'#A78BFA', dur:'18s' },
      { size:300, top:'60%', right:'-5%', color:'#6366F1', dur:'24s' },
      { size:200, top:'40%', left:'40%',  color:'#00D4AA', dur:'15s' },
    ].forEach(o => {
      const el = document.createElement('div');
      el.className = 'pro-orb';
      el.style.cssText = `width:${o.size}px;height:${o.size}px;background:${o.color};
        top:${o.top||'auto'};left:${o.left||'auto'};right:${o.right||'auto'};
        animation-duration:${o.dur}`;
      // Orbs scoped to billing content, not body
      (document.getElementById('content') || document.body).appendChild(el);
    });
  }
}

/**
 * cleanupDynamicBg() — removes all dynamic background artifacts injected by initDynamicBg().
 * Called on every navigation away from the billing page to restore the clean global layout.
 */
function cleanupDynamicBg() {
  const canvas = document.getElementById('mn-bg-canvas');
  if (canvas) canvas.remove();
  document.querySelectorAll('.pro-orb').forEach(o => o.remove());
  // Strip any residual plan-* classes from body (belt-and-suspenders)
  document.body.className = document.body.className.replace(/\bplan-[\w-]+\b/g, '').trim();
}

// ════════════════════════════════════════════════════════════════
//  BADGES / GLOBAL REFRESH
// ════════════════════════════════════════════════════════════════

function renderStatusBadge(el) {
  if (typeof el === 'string') el = document.getElementById(el);
  if (!el) return;
  const { state, statusLabel } = _b().getSubStatus();
  const cls = {
    active_trial:'trial', trial_ending:'trial-ending', expired_trial:'expired',
    local_active:'local', pro_trialing:'pro', pro_active:'pro',
    pro_cancelled:'expired', syncing:'syncing'
  }[state] || 'trial';
  const dot = ['active_trial','trial_ending','local_active','pro_trialing','pro_active','syncing'].includes(state);
  el.innerHTML = `<span class="plan-status-badge badge--${cls}">${dot?'<span class="badge-dot"></span>':''}${statusLabel}</span>`;
}

function _refreshBadges() {
  if (window.MNAuthUI?.renderAuthBadge) window.MNAuthUI.renderAuthBadge('authPlanBadge');
  if (window.MNAuthUI?.renderTrialPill) window.MNAuthUI.renderTrialPill('trialPillContainer');

  const { state } = _b()?.getSubStatus?.() || {};

  // ── Topbar "Activar Pro" button ─────────────────────────────────────
  // Show ONLY during the 7-day free trial of the Pro Annual plan (pro_trialing).
  // Hide for every other state: initial trial, expired, local, pro_active, cancelled.
  const topBtn = document.getElementById('topActivarProBtn');
  if (topBtn) {
    topBtn.style.display = state === 'pro_trialing' ? 'flex' : 'none';
  }

  // ── Sidebar ⚡ PRO badge (next to MoneyNest logo) ───────────────────
  // Rendered by updateSidebarLogo() in app.js; visibility toggled here.
  // Visible ONLY when the subscription is fully active (pro_active).
  const proBadge = document.getElementById('sidebarProBadge');
  if (proBadge) {
    proBadge.style.display = state === 'pro_active' ? 'inline-flex' : 'none';
  }
}

function refreshAll() {
  _onStateChange();
}

// ════════════════════════════════════════════════════════════════
//  INIT — Register all event listeners
// ════════════════════════════════════════════════════════════════

function initBillingUI() {
  const b = _b();
  if (!b) { console.warn('[MNBillingUI] MNBilling not loaded'); return; }

  b.init();
  // Dynamic background only if billing page is the entry point (rare, but safe)
  if (_isBillingPageActive()) {
    initDynamicBg();
  }
  _refreshBadges();

  // ── Core reactive listener ──
  // Every billing state change flows through _onStateChange()
  document.addEventListener('mn:billing:change', _onStateChange);

  // Trial expired mid-session
  document.addEventListener('mn:billing:trialExpired', _onStateChange);

  // After purchase/cancel
  document.addEventListener('mn:billing:activated', (e) => {
    if (typeof window.toast === 'function') {
      const msgs = {
        local_lifetime: '🔓 ¡Plan Local activado! Acceso permanente.',
        pro_annual:     '⚡ ¡Pro activado! Cloud sync habilitado.',
      };
      toast(msgs[e.detail?.plan] || '✅ Plan activado');
    }
    // _onStateChange fires via mn:billing:change which activateXxx already dispatches
  });

  document.addEventListener('mn:billing:cancelled', _onStateChange);

  // Export gating: re-apply after every page navigation
  document.addEventListener('mn:navigate', () => setTimeout(() => _applyExportGating(), 80));

  // Check paywall on boot (if trial already expired before app loaded)
  const bootScenario = _getScenario();
  if (bootScenario === 'EXPIRED') {
    setTimeout(_activateLock, 400);
  }
  _applyExportGating(bootScenario);
}

// ════════════════════════════════════════════════════════════════
//  EXPORTS
// ════════════════════════════════════════════════════════════════

window.MNBillingUI = {
  init:              initBillingUI,
  renderBillingPage,
  showLockOverlay,
  hideLockOverlay,
  renderStatusBadge,
  initDynamicBg,
  cleanupDynamicBg,
  refreshAll,
  // Checkout
  startBuyLocal,
  startActivatePro,
  triggerSync,
  showCancelConfirm,
  hideCancelConfirm,
  confirmCancelPro,
  // Export gating
  _exportBlocked,
  _applyExportGating,
  // Lock internals
  _restoreAccess,
  _getScenario,
};
