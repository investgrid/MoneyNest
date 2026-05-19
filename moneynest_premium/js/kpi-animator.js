/**
 * MoneyNest — js/kpi-animator.js
 * Anima contadores numéricos de 0 → valor real con easing.
 * Se engancha automáticamente a .kpi-value[data-animate] y
 * .patrimonio-num[data-animate] tras cada render del dashboard.
 */
;(function () {
  'use strict';

  const DURATION = 650;   // ms
  const EASE_OUT_EXPO = t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

  /**
   * Anima un elemento de 0 → targetValue.
   * @param {HTMLElement} el  — elemento a animar
   * @param {number}      end — valor final
   * @param {Function}    fmt — formateador (ej: eur, pct)
   * @param {number}      [delay=0] — delay en ms
   */
  function animateNumber(el, end, fmt, delay = 0) {
    if (!el) return;
    // Si no hay diferencia significativa, no animar
    if (Math.abs(end) < 0.01) { el.textContent = fmt(0); return; }

    let start = null;
    let rafId = null;

    function step(ts) {
      if (!start) start = ts + delay;
      if (ts < start) { rafId = requestAnimationFrame(step); return; }

      const elapsed = ts - start;
      const progress = Math.min(elapsed / DURATION, 1);
      const eased    = EASE_OUT_EXPO(progress);
      const current  = end * eased;

      el.textContent = fmt(current);

      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        el.textContent = fmt(end); // valor exacto al final
      }
    }

    if (rafId) cancelAnimationFrame(rafId);
    requestAnimationFrame(step);
  }

  /**
   * Formateador monetario rápido (sin Intl — síncrono para animación).
   * @param {number} v
   * @returns {string}
   */
  function _fmtEur(v) {
    const abs = Math.abs(v);
    const sign = v < 0 ? '−' : '';
    if (abs >= 1_000_000) return sign + (abs / 1_000_000).toFixed(2).replace('.', ',') + ' M€';
    if (abs >= 1_000)    return sign + (abs / 1_000).toFixed(1).replace('.', ',') + ' K€';
    return sign + abs.toFixed(2).replace('.', ',') + ' €';
  }

  function _fmtPct(v) {
    return v.toFixed(1).replace('.', ',') + ' %';
  }

  /**
   * Extrae el valor numérico de una cadena formateada (€, K€, M€, %).
   * @param {string} str
   * @returns {number}
   */
  function _parseFormatted(str) {
    if (!str) return 0;
    const s = str.replace(/\s/g, '').replace(',', '.');
    const negative = s.includes('−') || s.startsWith('-');
    const abs = parseFloat(s.replace(/[^0-9.]/g, '')) || 0;
    let val = abs;
    if (s.includes('M')) val = abs * 1_000_000;
    else if (s.includes('K')) val = abs * 1_000;
    return negative ? -val : val;
  }

  /**
   * Detecta si una cadena es un porcentaje.
   */
  function _isPct(str) { return typeof str === 'string' && str.includes('%'); }

  /**
   * Lanza la animación en todos los elementos marcados con data-animate.
   * Llamar después de inyectar HTML del dashboard.
   */
  function runDashboardAnimations() {
    // .kpi-value con data-animate
    document.querySelectorAll('.kpi-value[data-animate], .patrimonio-num[data-animate]').forEach((el, i) => {
      const rawTarget = el.getAttribute('data-animate');
      if (!rawTarget) return;

      const isPct  = _isPct(rawTarget);
      const target = _parseFormatted(rawTarget);
      const fmt    = isPct ? _fmtPct : _fmtEur;
      const delay  = i * 60; // stagger de 60ms entre KPIs

      // Guardar texto original para restaurar si el valor es exacto
      animateNumber(el, target, fmt, delay);
    });

    // .patrimonio-stat-val con data-animate
    document.querySelectorAll('.patrimonio-stat-val[data-animate]').forEach((el, i) => {
      const rawTarget = el.getAttribute('data-animate');
      if (!rawTarget) return;
      const target = _parseFormatted(rawTarget);
      animateNumber(el, target, _fmtEur, 200 + i * 40);
    });

    // YTD strips
    document.querySelectorAll('[data-animate-ytd]').forEach((el, i) => {
      const rawTarget = el.getAttribute('data-animate-ytd');
      if (!rawTarget) return;
      const target = _parseFormatted(rawTarget);
      animateNumber(el, target, _fmtEur, 100 + i * 80);
    });
  }

  window.MNKPIAnimator = { runDashboardAnimations, animateNumber, _fmtEur, _fmtPct, _parseFormatted };
})();
