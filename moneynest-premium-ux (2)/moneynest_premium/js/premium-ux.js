/* ══════════════════════════════════════════════════════════════
   MONEYNEST — PREMIUM UX SYSTEM (JS)
   Toasts · Empty States · Autosave · Skeleton Loaders
   ══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';
  try {

  // ─── 1. TOAST SYSTEM PREMIUM ──────────────────────────────────

  // Crear contenedor de toasts premium si no existe
  function ensureToastContainer() {
    let c = document.getElementById('mn-toasts');
    if (!c) {
      c = document.createElement('div');
      c.id = 'mn-toasts';
      document.body.appendChild(c);
    }
    return c;
  }

  const TOAST_ICONS = {
    success: '✓',
    error:   '✕',
    warning: '⚠',
    info:    'ℹ',
  };

  /**
   * Muestra un toast premium con progreso, icono y autocierre
   * @param {string} msg     - Mensaje a mostrar
   * @param {string} type    - 'success' | 'error' | 'warning' | 'info'
   * @param {number} duration - Duración en ms (default 3200)
   */
  function showToastPremium(msg, type = 'success', duration = 3200) {
    const container = ensureToastContainer();
    const icon = TOAST_ICONS[type] || '●';

    const el = document.createElement('div');
    el.className = `mn-toast ${type}`;
    el.style.setProperty('--duration', duration + 'ms');
    el.innerHTML = `
      <div class="mn-toast-icon">${icon}</div>
      <div class="mn-toast-text">${msg}</div>
      <div class="mn-toast-close" role="button" aria-label="Cerrar">✕</div>
      <div class="mn-toast-bar"></div>
    `;

    // Cerrar manualmente
    el.querySelector('.mn-toast-close').addEventListener('click', () => removeToast(el));

    container.appendChild(el);

    // Límite: máx 4 toasts simultáneos
    const toasts = container.querySelectorAll('.mn-toast:not(.removing)');
    if (toasts.length > 4) {
      removeToast(toasts[0]);
    }

    // Auto-remove
    const timer = setTimeout(() => removeToast(el), duration);
    el._toastTimer = timer;

    return el;
  }

  function removeToast(el) {
    if (!el || el.classList.contains('removing')) return;
    clearTimeout(el._toastTimer);
    el.classList.add('removing');
    el.addEventListener('animationend', () => el.remove(), { once: true });
    // Fallback remove
    setTimeout(() => { try { el.remove(); } catch(e) {} }, 400);
  }

  // ─── Bridge con app.js toast ─────────────────────────────────
  // Registrar el sistema premium para que app.js lo use
  window._mnPremiumToast = function(msg, type) {
    const t = type === 'success' ? 'success'
            : type === 'error'   ? 'error'
            : type === 'warning' ? 'warning'
            : 'info';
    showToastPremium(msg, t);
  };
  window._mnPremiumToastReady = true;

  // Ocultar el toast legacy
  window.addEventListener('DOMContentLoaded', () => {
    const oldToast = document.getElementById('toast');
    if (oldToast) {
      oldToast.style.cssText = 'display:none!important;pointer-events:none!important';
      oldToast.setAttribute('aria-hidden', 'true');
    }
  });

  // Exponer la API premium directa
  window.mnToast = showToastPremium;


  // ─── 2. AUTOSAVE INDICATOR ────────────────────────────────────

  let autosaveEl = null;
  let autosaveFadeTimer = null;

  function createAutosaveIndicator() {
    if (autosaveEl) return;
    autosaveEl = document.createElement('div');
    autosaveEl.id = 'mn-autosave';
    autosaveEl.innerHTML = `<span class="mn-autosave-dot"></span><span class="mn-autosave-label">Guardando…</span>`;
    document.body.appendChild(autosaveEl);
  }

  function showAutosaveSaving() {
    createAutosaveIndicator();
    clearTimeout(autosaveFadeTimer);
    autosaveEl.className = 'saving';
    autosaveEl.querySelector('.mn-autosave-label').textContent = 'Guardando…';
  }

  function showAutosaveSaved() {
    if (!autosaveEl) createAutosaveIndicator();
    autosaveEl.className = 'saved';
    autosaveEl.querySelector('.mn-autosave-label').textContent = 'Guardado';
    autosaveFadeTimer = setTimeout(() => {
      if (autosaveEl) autosaveEl.className = '';
    }, 3200);
  }

  // Interceptar la función save() global mediante el evento mn:saved
  window.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('mn:saved', () => {
      showAutosaveSaved();
    });

    // Monkey-patch save() para mostrar "Guardando..." antes
    const origSave = window.save;
    if (typeof origSave === 'function') {
      window.save = function() {
        showAutosaveSaving();
        const result = origSave.apply(this, arguments);
        // Pequeño delay para que se vea la transición
        setTimeout(showAutosaveSaved, 120);
        return result;
      };
    }
  });


  // ─── 3. EMPTY STATE BUILDER ────────────────────────────────────

  /**
   * Genera HTML de empty state premium
   * @param {object} opts
   * @param {string}   opts.icon      - Emoji o SVG
   * @param {string}   opts.title     - Título principal
   * @param {string}   opts.sub       - Descripción
   * @param {string}  [opts.cta]      - Texto del botón CTA
   * @param {string}  [opts.action]   - onClick del CTA
   * @param {boolean} [opts.compact]  - Versión compacta
   * @param {boolean} [opts.dots]     - Mostrar dots orbitales
   */
  function buildEmptyState({ icon, title, sub, cta, action, compact = false, dots = true }) {
    const dotsHtml = (!compact && dots) ? `
      <div class="mn-empty-art-ring"></div>
      <div class="mn-empty-art-ring"></div>
      <div class="mn-empty-art-dot"></div>
      <div class="mn-empty-art-dot"></div>
      <div class="mn-empty-art-dot"></div>
    ` : '';

    const ctaHtml = cta ? `
      <button class="mn-empty-cta" ${action ? `onclick="${action}"` : ''}>
        <span>+</span> ${cta}
      </button>
    ` : '';

    return `
      <div class="mn-empty${compact ? ' compact' : ''}">
        <div class="mn-empty-art">
          ${dotsHtml}
          <div class="mn-empty-art-icon">${icon}</div>
        </div>
        <div class="mn-empty-title">${title}</div>
        <div class="mn-empty-sub">${sub}</div>
        ${ctaHtml}
      </div>
    `;
  }

  window.mnEmptyState = buildEmptyState;


  // ─── 4. SKELETON LOADER BUILDER ────────────────────────────────

  /**
   * Genera HTML de skeleton card
   * @param {object} opts
   * @param {number} [opts.rows]    - Número de filas de texto
   * @param {boolean}[opts.avatar]  - Mostrar avatar circle
   */
  function buildSkeletonCard({ rows = 3, avatar = false } = {}) {
    const avatarHtml = avatar ? `<div class="mn-skeleton mn-skeleton-circle" style="width:36px;height:36px;flex-shrink:0"></div>` : '';
    const rowsHtml = Array.from({ length: rows }, (_, i) => `
      <div class="mn-skeleton mn-skeleton-text${i === 0 ? ' lg' : ''}" style="width:${i === 0 ? 60 : 40 + Math.random() * 35 | 0}%"></div>
    `).join('');

    return `
      <div class="mn-skeleton-card">
        <div class="mn-skeleton-row">
          ${avatarHtml}
          <div style="flex:1;display:flex;flex-direction:column;gap:7px">
            ${rowsHtml}
          </div>
        </div>
      </div>
    `;
  }

  function buildSkeletonList(count = 3) {
    return Array.from({ length: count }, () => buildSkeletonCard({ avatar: true, rows: 2 })).join('');
  }

  window.mnSkeleton = buildSkeletonCard;
  window.mnSkeletonList = buildSkeletonList;


  // ─── 5. EMPTY STATES ESPECÍFICOS — OVERRIDE INLINE ────────────
  //
  // Estos son los empty states concretos de cada sección,
  // reemplazando los textos aburridos con versiones premium.

  const EMPTY_STATES = {
    activos: () => buildEmptyState({
      icon: '🏠',
      title: 'Aún no tienes activos',
      sub: 'Añade propiedades, vehículos, joyas o cualquier bien que forme parte de tu patrimonio.',
      cta: 'Añadir activo',
      action: "openModal('assetModal');resetAssetForm()",
    }),

    cuentas: () => buildEmptyState({
      icon: '🏦',
      title: 'Sin cuentas bancarias',
      sub: 'Conecta tus cuentas para tener una vista completa de tu liquidez.',
      cta: 'Añadir cuenta',
      action: "openModal('cuentaModal')",
      compact: true,
    }),

    inversiones: () => buildEmptyState({
      icon: '📈',
      title: 'Tu cartera está vacía',
      sub: 'Registra ETFs, acciones, criptos o cualquier inversión para hacer seguimiento del rendimiento.',
      cta: 'Primera inversión',
      action: "openModal('inversionModal')",
    }),

    deudas: () => buildEmptyState({
      icon: '📉',
      title: 'Sin deudas registradas',
      sub: 'Añade hipotecas, préstamos o tarjetas para controlar exactamente lo que debes.',
      cta: 'Añadir deuda',
      action: "openModal('deudaModal')",
    }),

    objetivos: () => buildEmptyState({
      icon: '🎯',
      title: 'Define tu próxima meta',
      sub: 'Vacaciones, fondo de emergencia, un coche… MoneyNest calculará cuándo lo alcanzarás.',
      cta: 'Crear objetivo',
      action: "openModal('objetivoModal')",
    }),

    presupuestos: () => buildEmptyState({
      icon: '📊',
      title: 'Aún no hay presupuestos',
      sub: 'Establece límites por categoría y controla tu gasto fácilmente — menos de 30 segundos.',
      cta: 'Crear presupuesto',
      action: "openModal('presupuestoModal')",
    }),

    gastos: () => buildEmptyState({
      icon: '💸',
      title: 'Sin gastos este período',
      sub: 'Registra tus gastos para mantener el control total de a dónde va tu dinero.',
      cta: 'Añadir gasto',
      action: "openModal('gastoModal')",
    }),

    ingresos: () => buildEmptyState({
      icon: '💰',
      title: 'Sin ingresos registrados',
      sub: 'Registra tu sueldo, freelance o cualquier ingreso para ver tu flujo real.',
      cta: 'Registrar ingreso',
      action: "openModal('ingresoModal')",
    }),

    sinResultados: () => buildEmptyState({
      icon: '🔍',
      title: 'Sin resultados',
      sub: 'Prueba con otros filtros o términos de búsqueda.',
      compact: true,
      dots: false,
    }),

    sinDeudas: () => buildEmptyState({
      icon: '🎉',
      title: '¡Sin deudas!',
      sub: 'Enhorabuena — no tienes ninguna deuda registrada. Una posición envidiable.',
      dots: false,
    }),

    pocoDatos: () => buildEmptyState({
      icon: '📈',
      title: 'Pocos datos todavía',
      sub: 'Vuelve el mes que viene para ver la evolución de tu patrimonio en el tiempo.',
      compact: true,
      dots: false,
    }),

    sugerencias: () => buildEmptyState({
      icon: '💬',
      title: 'Sé el primero en sugerir',
      sub: '¿Tienes una idea para mejorar MoneyNest? ¡Cuéntanosla!',
      compact: true,
      dots: false,
    }),
  };

  window.mnEmptyStates = EMPTY_STATES;


  // ─── 6. DOM MUTATION OBSERVER — AUTO-UPGRADE EMPTY STATES ──────
  // Actualiza los .empty existentes cuando se renderiza una sección

  function upgradeExistingEmpty(root) {
    root = root || document;
    // Añadir animación a .empty que no la tengan
    root.querySelectorAll('.empty').forEach(el => {
      if (!el.dataset.mnUpgraded) {
        el.dataset.mnUpgraded = '1';
        // Animar hover en el icono existente
        const icon = el.querySelector('.empty-icon');
        if (icon && !icon.classList.contains('mn-upgraded')) {
          icon.classList.add('mn-upgraded');
        }
      }
    });
  }

  // Observer para content dinámico
  window.addEventListener('DOMContentLoaded', () => {
    const content = document.getElementById('content');
    if (!content) return;

    upgradeExistingEmpty(content);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach(m => {
        if (m.addedNodes.length) {
          upgradeExistingEmpty(content);
        }
      });
    });

    observer.observe(content, { childList: true, subtree: true });
  });


  // ─── 7. HOVER STATE ELEGANTE EN CUENTAS / LISTAS ───────────────

  window.addEventListener('DOMContentLoaded', () => {
    // Upgrade botones existentes de editar/borrar para microinteracciones
    document.addEventListener('mouseover', (e) => {
      const btn = e.target.closest('.btn-edit, .btn-del');
      if (btn && !btn.dataset.mnHover) {
        btn.dataset.mnHover = '1';
        btn.style.transition = 'transform 120ms cubic-bezier(0.34,1.56,0.64,1), background 100ms';
        btn.addEventListener('mouseenter', () => { btn.style.transform = 'scale(1.08)'; });
        btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
        btn.addEventListener('mousedown',  () => { btn.style.transform = 'scale(0.94)'; });
        btn.addEventListener('mouseup',    () => { btn.style.transform = 'scale(1.08)'; });
      }
    });
  });


  // ─── 8. SUCCESS FLASH EN GUARDADO ──────────────────────────────

  window.mnSuccessFlash = function(selector) {
    const el = typeof selector === 'string'
      ? document.querySelector(selector)
      : selector;
    if (!el) return;
    el.classList.remove('mn-success-flash');
    void el.offsetWidth; // reflow
    el.classList.add('mn-success-flash');
    el.addEventListener('animationend', () => el.classList.remove('mn-success-flash'), { once: true });
  };


  // ─── 9. SKELETON PARA SECCIONES AL NAVEGAR ─────────────────────

  let _skeletonTimer = null;

  window.mnShowPageSkeleton = function(containerId = 'content', rows = 3) {
    clearTimeout(_skeletonTimer);
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="mn-page-skeleton">
        <div class="mn-skel-header">
          <div style="display:flex;flex-direction:column;gap:8px">
            <div class="mn-skeleton mn-skeleton-text xl" style="width:180px"></div>
            <div class="mn-skeleton mn-skeleton-text" style="width:120px"></div>
          </div>
          <div class="mn-skeleton mn-skeleton-btn"></div>
        </div>
        ${buildSkeletonList(rows)}
      </div>
    `;
  };


  // ─── 10. RIPPLE ON BUTTONS ────────────────────────────────────

  window.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-primary, .btn-secondary');
      if (!btn) return;
      const ripple = document.createElement('span');
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      ripple.style.cssText = `
        position:absolute;
        border-radius:50%;
        background:rgba(255,255,255,0.15);
        width:${size}px;
        height:${size}px;
        left:${e.clientX - rect.left - size/2}px;
        top:${e.clientY - rect.top - size/2}px;
        pointer-events:none;
        transform:scale(0);
        animation:mnRippleKey 500ms ease-out forwards;
      `;
      if (!document.getElementById('mn-ripple-style')) {
        const s = document.createElement('style');
        s.id = 'mn-ripple-style';
        s.textContent = '@keyframes mnRippleKey{to{transform:scale(1);opacity:0}}';
        document.head.appendChild(s);
      }
      btn.style.position = btn.style.position || 'relative';
      btn.style.overflow = 'hidden';
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });


  // ─── INIT LOG ─────────────────────────────────────────────────
  console.log('%c✦ MoneyNest Premium UX cargado', 'color:#00D4AA;font-weight:700;font-size:12px');
  } catch(e) { console.warn('MoneyNest Premium UX: error de inicialización —', e); }

})();
