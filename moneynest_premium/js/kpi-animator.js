/**
 * MoneyNest — js/kpi-animator.js
 * Anima contadores numéricos de 0 → valor real con easing.
 * Usa data-animate-raw (número puro) en lugar de parsear cadenas formateadas.
 */
;(function () {
  'use strict';

  const DURATION = 650;
  const EASE_OUT_EXPO = t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

  function animateNumber(el, end, fmt, delay) {
    if (!el) return;
    delay = delay || 0;
    if (!isFinite(end) || Math.abs(end) < 0.001) { el.textContent = fmt(0); return; }

    let start = null;
    let rafId = null;
    function step(ts) {
      if (!start) start = ts + delay;
      if (ts < start) { rafId = requestAnimationFrame(step); return; }
      const p = Math.min((ts - start) / DURATION, 1);
      const eased = EASE_OUT_EXPO(p);
      el.textContent = fmt(end * eased);
      if (p < 1) { rafId = requestAnimationFrame(step); }
      else { el.textContent = fmt(end); }
    }
    if (rafId) cancelAnimationFrame(rafId);
    requestAnimationFrame(step);
  }

  // Usa la función eur() de la app — muestra números completos con separadores
  function _appFmt(v) {
    if (typeof window.eur === 'function') return window.eur(v);
    // Fallback con ceros completos (sin K ni M)
    const abs = Math.abs(v);
    const sign = v < 0 ? '-' : '';
    return sign + abs.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  }

  function _pctFmt(v) {
    return v.toFixed(1).replace('.', ',') + ' %';
  }

  function runDashboardAnimations() {
    // Elementos con data-animate-raw llevan el número puro (sin formatear)
    document.querySelectorAll('[data-animate-raw]').forEach((el, i) => {
      const raw = el.getAttribute('data-animate-raw');
      const val = parseFloat(raw);
      if (!isFinite(val)) return;
      const isPct = el.hasAttribute('data-animate-pct');
      animateNumber(el, val, isPct ? _pctFmt : _appFmt, i * 60);
    });

    // YTD strips
    document.querySelectorAll('[data-animate-ytd-raw]').forEach((el, i) => {
      const raw = el.getAttribute('data-animate-ytd-raw');
      const val = parseFloat(raw);
      if (!isFinite(val)) return;
      animateNumber(el, val, _appFmt, 100 + i * 80);
    });
  }

  window.MNKPIAnimator = { runDashboardAnimations, animateNumber };
})();
