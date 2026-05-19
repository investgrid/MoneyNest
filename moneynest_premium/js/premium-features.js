/**
 * MoneyNest — js/premium-features.js
 * Features premium standalone:
 *   - Sparklines en KPI cards
 *   - Swipe móvil entre páginas
 *   - Confetti extendido
 *   - Quick-add inteligente (predicción de categoría)
 *   - Comparar meses en análisis
 *   - Budget alertas visuales inline
 *   - Logros mejorados (animación desbloqueo + progreso al siguiente)
 */
;(function () {
  'use strict';

  // ── i18n helper ─────────────────────────────────────────────────
  function _t(k, fb) { return (typeof window.t === 'function' ? window.t(k) || fb : fb); }

  // ════════════════════════════════════════════════════════════════
  //  1. SPARKLINES EN KPI CARDS
  // ════════════════════════════════════════════════════════════════

  /**
   * Dibuja un sparkline inline (SVG) dentro de .kpi-card[data-sparkline].
   * El atributo data-sparkline="ingresos|gastos|cashflow|patrimonio" indica qué métrica usar.
   * Se llama después del render del dashboard.
   */
  function renderSparklines() {
    if (typeof window.getMonths !== 'function') return;
    const months6 = window.getMonths(6);

    const METRICS = {
      ingresos:   m => (typeof window.calcIngresosMes  === 'function' ? window.calcIngresosMes(m)  : 0),
      gastos:     m => (typeof window.calcGastosMes    === 'function' ? window.calcGastosMes(m)    : 0),
      cashflow:   m => (typeof window.calcCashFlow     === 'function' ? window.calcCashFlow(m)     : 0),
      patrimonio: m => {
        if (!window.S || !window.S.patrimonio_hist) return 0;
        const h = window.S.patrimonio_hist.find(h => h.mes === m);
        return h ? h.valor : 0;
      },
    };

    document.querySelectorAll('.kpi-card[data-sparkline]').forEach(card => {
      const metric = card.getAttribute('data-sparkline');
      const fn = METRICS[metric];
      if (!fn) return;

      const vals = months6.map(fn);
      const existing = card.querySelector('.mn-sparkline');
      if (existing) existing.remove();

      const el = _buildSparklineSVG(vals, metric);
      card.appendChild(el);
    });
  }

  function _buildSparklineSVG(vals, metric) {
    const W = 80, H = 32;
    const nonZero = vals.filter(v => v !== 0);
    if (nonZero.length < 2) {
      const el = document.createElement('div');
      el.className = 'mn-sparkline';
      return el;
    }

    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max - min || 1;
    const n = vals.length;

    const pts = vals.map((v, i) => {
      const x = (i / (n - 1)) * W;
      const y = H - ((v - min) / range) * (H - 4) - 2;
      return [x, y];
    });

    const pathD = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
    const fillD = `${pathD} L${W},${H} L0,${H} Z`;

    const isPositive = metric === 'ingresos' || metric === 'patrimonio' ||
      (metric === 'cashflow' && vals[vals.length - 1] >= 0);
    const color = metric === 'gastos' ? '#F43F5E' : isPositive ? '#00D4AA' : '#F43F5E';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.className.baseVal = 'mn-sparkline';

    // Fill gradient
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    grad.setAttribute('id', `spk-${metric}-${Date.now()}`);
    grad.setAttribute('x1', '0'); grad.setAttribute('y1', '0');
    grad.setAttribute('x2', '0'); grad.setAttribute('y2', '1');
    const s1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    s1.setAttribute('offset', '0%');
    s1.setAttribute('stop-color', color);
    s1.setAttribute('stop-opacity', '0.2');
    const s2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    s2.setAttribute('offset', '100%');
    s2.setAttribute('stop-color', color);
    s2.setAttribute('stop-opacity', '0');
    grad.appendChild(s1); grad.appendChild(s2); defs.appendChild(grad);
    svg.appendChild(defs);

    const fill = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    fill.setAttribute('d', fillD);
    fill.setAttribute('fill', `url(#${grad.id})`);
    svg.appendChild(fill);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    line.setAttribute('d', pathD);
    line.setAttribute('fill', 'none');
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', '1.8');
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(line);

    // Last point dot
    const last = pts[pts.length - 1];
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', last[0]);
    dot.setAttribute('cy', last[1]);
    dot.setAttribute('r', '2.5');
    dot.setAttribute('fill', color);
    svg.appendChild(dot);

    return svg;
  }

  // Inyectar CSS de sparklines
  function _injectSparklineStyles() {
    if (document.getElementById('mn-sparkline-css')) return;
    const s = document.createElement('style');
    s.id = 'mn-sparkline-css';
    s.textContent = `
      .mn-sparkline {
        display: block;
        margin-top: 8px;
        opacity: 0.85;
        animation: mnSparkIn 400ms ease both;
      }
      @keyframes mnSparkIn { from { opacity:0; transform:scaleX(0.8); } to { opacity:0.85; transform:none; } }
      .kpi-card[data-sparkline] { overflow: visible; }
    `;
    document.head.appendChild(s);
  }


  // ════════════════════════════════════════════════════════════════
  //  2. SWIPE MÓVIL ENTRE PÁGINAS
  // ════════════════════════════════════════════════════════════════

  const SWIPE_PAGES = ['dashboard', 'ingresos', 'gastos', 'inversiones', 'deudas', 'objetivos'];
  const SWIPE_THRESHOLD = 60;
  const SWIPE_MAX_VERTICAL = 80; // ignora si swipe es más vertical que horizontal
  let _swipeStartX = 0, _swipeStartY = 0, _swipeStartTime = 0;

  function _initSwipe() {
    const content = document.getElementById('content');
    if (!content || content._mnSwipeInit) return;
    content._mnSwipeInit = true;

    content.addEventListener('touchstart', e => {
      if (e.touches.length !== 1) return;
      _swipeStartX    = e.touches[0].clientX;
      _swipeStartY    = e.touches[0].clientY;
      _swipeStartTime = Date.now();
    }, { passive: true });

    content.addEventListener('touchend', e => {
      if (e.changedTouches.length !== 1) return;
      const dx   = e.changedTouches[0].clientX - _swipeStartX;
      const dy   = e.changedTouches[0].clientY - _swipeStartY;
      const dt   = Date.now() - _swipeStartTime;

      // Reject slow swipes, too-vertical swipes, or short swipes
      if (dt > 500) return;
      if (Math.abs(dy) > SWIPE_MAX_VERTICAL) return;
      if (Math.abs(dx) < SWIPE_THRESHOLD) return;

      const cur = window.currentPage || 'dashboard';
      const idx = SWIPE_PAGES.indexOf(cur);
      if (idx === -1) return;

      if (dx < 0 && idx < SWIPE_PAGES.length - 1) {
        // Swipe left → next page
        if (typeof window.goTo === 'function') window.goTo(SWIPE_PAGES[idx + 1]);
      } else if (dx > 0 && idx > 0) {
        // Swipe right → previous page
        if (typeof window.goTo === 'function') window.goTo(SWIPE_PAGES[idx - 1]);
      }
    }, { passive: true });
  }

  // Re-init swipe after each render (content element is replaced)
  function _watchSwipeTarget() {
    let last = null;
    setInterval(() => {
      const el = document.getElementById('content');
      if (el && el !== last) { last = el; _initSwipe(); }
    }, 800);
  }


  // ════════════════════════════════════════════════════════════════
  //  3. CONFETTI EXTENDIDO
  // ════════════════════════════════════════════════════════════════

  /**
   * Dispara confetti (usa el mismo sistema que gamification.js pero standalone).
   * @param {string} [reason] — 'goal'|'debt'|'cashflow'|'generic'
   */
  function fireConfetti(reason) {
    // Reuse gamification confetti if available
    if (window.MNGamification && typeof window.MNGamification._fireConfetti === 'function') {
      window.MNGamification._fireConfetti();
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:99998;';
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const colorMap = {
      goal:      ['#00D4AA', '#10B981', '#6EE7B7', '#F59E0B', '#FDE68A'],
      debt:      ['#6366F1', '#A78BFA', '#00D4AA', '#F472B6', '#FB7185'],
      cashflow:  ['#10B981', '#00D4AA', '#34D399', '#A7F3D0', '#6366F1'],
      generic:   ['#00D4AA', '#6366F1', '#F59E0B', '#10B981', '#F472B6'],
    };
    const colors = colorMap[reason] || colorMap.generic;

    const particles = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvas.width,
      y: -10 - Math.random() * 60,
      r: Math.random() * 7 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      vx: Math.random() * 2 - 1,
      vy: Math.random() * 4 + 2,
      ts: Math.random() * 2,
    }));

    let frame = 0;
    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.y   += p.vy;
        p.x   += p.vx;
        p.tilt += 0.12;
        const alpha = Math.max(0, 1 - frame / 110);
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.ellipse(
          p.x + Math.sin(p.tilt) * 12,
          p.y,
          p.r, p.r * 0.45,
          p.tilt, 0, Math.PI * 2
        );
        ctx.fillStyle = p.color;
        ctx.fill();
      });
      frame++;
      if (frame < 110) requestAnimationFrame(loop);
      else { ctx.globalAlpha = 1; canvas.remove(); }
    };
    requestAnimationFrame(loop);
    if (navigator.vibrate) navigator.vibrate([30, 20, 30]);
  }

  window.MNConfetti = { fire: fireConfetti };

  // ── Hook: objetivo completado ───────────────────────────────────
  function _hookConfettiTriggers() {
    // Objetivo al 100% — patchear guardarObjetivo/aportar
    const _origSave = window.save;
    if (!_origSave || window._mnConfettiHooked) return;
    window._mnConfettiHooked = true;

    // Listen for objective completion event
    document.addEventListener('mn:objetivo:completado', () => fireConfetti('goal'));
    document.addEventListener('mn:deuda:saldada',       () => fireConfetti('debt'));
    document.addEventListener('mn:cashflow:positivo',   () => fireConfetti('cashflow'));
  }


  // ════════════════════════════════════════════════════════════════
  //  4. QUICK-ADD INTELIGENTE — predicción de categoría
  // ════════════════════════════════════════════════════════════════

  /**
   * Predice la categoría a partir del concepto usando fuzzy matching
   * contra los últimos 100 movimientos del historial.
   * @param {string} concepto
   * @param {'gasto'|'ingreso'} tipo
   * @returns {string|null} categoría predicha o null
   */
  function predictCategory(concepto, tipo) {
    if (!concepto || concepto.length < 2) return null;
    if (!window.S) return null;

    const src = concepto.toLowerCase().trim();
    const list = tipo === 'gasto'
      ? (window.S.gastos  || []).slice(-150)
      : (window.S.ingresos || []).slice(-150);

    // Exact match first, then prefix, then substring
    const matches = list
      .filter(m => m.categoria && m.concepto)
      .map(m => {
        const c = (m.concepto || '').toLowerCase();
        let score = 0;
        if (c === src)           score = 100;
        else if (c.startsWith(src) || src.startsWith(c)) score = 70;
        else if (c.includes(src) || src.includes(c))      score = 40;
        else {
          // Word-level matching
          const srcWords = src.split(/\s+/);
          const cWords   = c.split(/\s+/);
          const hits = srcWords.filter(w => w.length > 2 && cWords.some(cw => cw.includes(w) || w.includes(cw)));
          if (hits.length) score = hits.length * 20;
        }
        return { cat: m.categoria, score };
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score);

    if (!matches.length) return null;

    // Frequency vote among top matches
    const tally = {};
    matches.slice(0, 20).forEach(m => { tally[m.cat] = (tally[m.cat] || 0) + m.score; });
    const best = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
    return best ? best[0] : null;
  }

  /**
   * Engancha la predicción al campo quickConcepto.
   * Añade un badge de sugerencia debajo del input.
   */
  function initQuickAddPredictor() {
    const input = document.getElementById('quickConcepto');
    if (!input || input._mnPredictInit) return;
    input._mnPredictInit = true;

    let _badge = null;

    const _removeBadge = () => { if (_badge) { _badge.remove(); _badge = null; } };

    const _showBadge = (cat) => {
      _removeBadge();
      if (!cat) return;
      const emoji = typeof window.catEmoji === 'function' ? window.catEmoji(cat) : '';
      _badge = document.createElement('div');
      _badge.className = 'mn-qa-predict-badge';
      _badge.innerHTML = `
        <span class="mn-qa-predict-icon">${emoji}</span>
        <span class="mn-qa-predict-text">${cat}</span>
        <button class="mn-qa-predict-apply" onclick="window.MNQuickPredictor.apply('${cat.replace(/'/g, "\\'")}')">✓</button>`;
      input.parentNode.insertBefore(_badge, input.nextSibling);

      // Auto-apply after 1.5s of no typing
      if (_badge._timer) clearTimeout(_badge._timer);
      _badge._timer = setTimeout(() => {
        if (_badge) window.MNQuickPredictor.apply(cat);
      }, 1500);
    };

    input.addEventListener('input', () => {
      const tipo = window._qaType || 'gasto';
      const pred = predictCategory(input.value, tipo);
      if (pred) _showBadge(pred);
      else _removeBadge();
    });

    // Re-init when modal opens
    document.addEventListener('mn:quickadd:open', () => {
      setTimeout(() => {
        const inp = document.getElementById('quickConcepto');
        if (inp && !inp._mnPredictInit) initQuickAddPredictor();
      }, 50);
    });
  }

  window.MNQuickPredictor = {
    predict: predictCategory,
    init: initQuickAddPredictor,
    apply(cat) {
      // Select the predicted category in the quick-add grid
      const btns = document.querySelectorAll('#quickCatRow .quick-cat-btn');
      let found = false;
      btns.forEach(btn => {
        const text = btn.textContent.replace(/[^\w\s]/g, '').trim();
        if (btn.textContent.includes(cat)) {
          btn.click();
          found = true;
        }
      });
      // Remove badge
      const badge = document.querySelector('.mn-qa-predict-badge');
      if (badge) badge.remove();
      // If not in visible cats, set directly
      if (!found && window._qaCat !== cat) {
        window._qaCat = cat;
      }
    },
  };

  function _injectPredictorStyles() {
    if (document.getElementById('mn-predictor-css')) return;
    const s = document.createElement('style');
    s.id = 'mn-predictor-css';
    s.textContent = `
      .mn-qa-predict-badge {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        margin-bottom: 10px;
        background: rgba(0,212,170,0.08);
        border: 1px solid rgba(0,212,170,0.25);
        border-radius: 8px;
        font-size: .78rem;
        color: var(--text2);
        animation: mnFadeIn 150ms ease;
      }
      .mn-qa-predict-text { font-weight: 700; color: var(--text); flex: 1; }
      .mn-qa-predict-apply {
        background: rgba(0,212,170,0.15);
        border: 1px solid rgba(0,212,170,0.3);
        color: var(--accent, #00D4AA);
        border-radius: 6px;
        padding: 2px 8px;
        font-size: .72rem;
        font-weight: 700;
        cursor: pointer;
        font-family: inherit;
        transition: background .15s;
      }
      .mn-qa-predict-apply:hover { background: rgba(0,212,170,0.25); }
    `;
    document.head.appendChild(s);
  }


  // ════════════════════════════════════════════════════════════════
  //  5. COMPARAR MESES EN ANÁLISIS
  // ════════════════════════════════════════════════════════════════

  window._analisisCompareMonth = null;

  function renderCompareMonthSelector() {
    if (typeof window.getMonths !== 'function') return '';
    const months = window.getMonths(12);
    const cur = window.currentMonth ? window.currentMonth() : '';
    const sel = window._analisisCompareMonth || '';
    return `
      <div class="mn-compare-selector">
        <label style="font-size:.72rem;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.06em">${_t('comparar_con','Comparar con')}</label>
        <select onchange="window._analisisCompareMonth=this.value;renderAnalisis?.()" style="font-size:.78rem;padding:5px 10px;border-radius:8px;border:1px solid var(--border2);background:var(--bg2);color:var(--text);cursor:pointer;font-family:inherit">
          <option value="">${_t('ninguno','— Sin comparar')}</option>
          ${months.filter(m => m !== cur).map(m => `
            <option value="${m}" ${sel === m ? 'selected' : ''}>${typeof window.monthLabel === 'function' ? window.monthLabel(m) : m}</option>`).join('')}
        </select>
        ${sel ? `<span class="mn-compare-badge">vs ${typeof window.monthLabel === 'function' ? window.monthLabel(sel) : sel}</span>` : ''}
      </div>`;
  }

  function getCompareDeltas(metrics) {
    const cmp = window._analisisCompareMonth;
    if (!cmp) return {};
    const result = {};
    metrics.forEach(({ key, fn }) => {
      try { result[key] = fn(cmp); } catch { result[key] = 0; }
    });
    return result;
  }

  function renderCompareDelta(current, compare, format) {
    if (!compare && compare !== 0) return '';
    const delta = current - compare;
    const pct   = compare !== 0 ? ((delta / Math.abs(compare)) * 100).toFixed(1) : null;
    const up    = delta >= 0;
    const color = up ? 'var(--green)' : 'var(--red)';
    const arrow = up ? '▲' : '▼';
    const fmtDelta = format ? format(Math.abs(delta)) : Math.abs(delta).toFixed(0);
    return `<div class="mn-compare-delta" style="color:${color}">${arrow} ${fmtDelta}${pct !== null ? ` (${Math.abs(pct)}%)` : ''}</div>`;
  }

  window.MNCompare = { renderSelector: renderCompareMonthSelector, getDeltas: getCompareDeltas, delta: renderCompareDelta };

  function _injectCompareStyles() {
    if (document.getElementById('mn-compare-css')) return;
    const s = document.createElement('style');
    s.id = 'mn-compare-css';
    s.textContent = `
      .mn-compare-selector {
        display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
        padding: 8px 14px;
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm, 8px);
        margin-bottom: 16px;
      }
      .mn-compare-badge {
        font-size: .72rem; font-weight: 700;
        background: var(--indigo-dim); border: 1px solid rgba(99,102,241,.3);
        color: var(--indigo); padding: 3px 10px; border-radius: 99px;
      }
      .mn-compare-delta {
        font-size: .7rem; font-weight: 700;
        margin-top: 2px;
      }
    `;
    document.head.appendChild(s);
  }


  // ════════════════════════════════════════════════════════════════
  //  6. BUDGET ALERTAS VISUALES INLINE
  // ════════════════════════════════════════════════════════════════

  function enhanceBudgetCards() {
    document.querySelectorAll('.budget-item').forEach(card => {
      const bar = card.querySelector('.progress-bar');
      if (!bar) return;

      const cls = bar.className;
      const isDanger = cls.includes('progress-danger');
      const isWarn   = cls.includes('progress-warn');

      // Remove stale classes
      card.classList.remove('budget-pulse', 'budget-shake', 'budget-warn-glow');

      if (isDanger) {
        card.classList.add('budget-shake');
        // Remove shake after animation so it can re-trigger
        setTimeout(() => card.classList.remove('budget-shake'), 600);
        card.classList.add('budget-danger-glow');
      } else if (isWarn) {
        card.classList.add('budget-pulse');
      }
    });
  }

  function _injectBudgetAlertStyles() {
    if (document.getElementById('mn-budget-alert-css')) return;
    const s = document.createElement('style');
    s.id = 'mn-budget-alert-css';
    s.textContent = `
      @keyframes mnBudgetPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); }
        50%       { box-shadow: 0 0 0 6px rgba(245,158,11,0.15); }
      }
      @keyframes mnBudgetShake {
        0%,100% { transform: translateX(0); }
        20%     { transform: translateX(-4px); }
        40%     { transform: translateX(4px); }
        60%     { transform: translateX(-3px); }
        80%     { transform: translateX(3px); }
      }
      .budget-item { transition: border-color .3s, background .3s; }
      .budget-pulse {
        animation: mnBudgetPulse 1.8s ease infinite;
        border-color: rgba(245,158,11,0.4) !important;
        background: rgba(245,158,11,0.04);
      }
      .budget-shake {
        animation: mnBudgetShake 0.5s ease;
      }
      .budget-danger-glow {
        border-color: rgba(244,63,94,0.4) !important;
        background: rgba(244,63,94,0.04);
      }
      .budget-nums { font-size: .82rem; color: var(--text2); }
    `;
    document.head.appendChild(s);
  }


  // ════════════════════════════════════════════════════════════════
  //  7. LOGROS MEJORADOS
  // ════════════════════════════════════════════════════════════════

  /**
   * Inyecta CSS de animación para las cards de logros.
   * El flip/glow se dispara añadiendo la clase .logro-unlock a la card.
   */
  function _injectLogroStyles() {
    if (document.getElementById('mn-logros-css')) return;
    const s = document.createElement('style');
    s.id = 'mn-logros-css';
    s.textContent = `
      @keyframes mnLogroUnlock {
        0%   { transform: scale(1) rotateY(0deg);   filter: brightness(1); }
        25%  { transform: scale(1.12) rotateY(90deg); filter: brightness(1.5); }
        50%  { transform: scale(1.12) rotateY(180deg);filter: brightness(1.8); }
        75%  { transform: scale(1.05) rotateY(270deg);filter: brightness(1.3); }
        100% { transform: scale(1) rotateY(360deg);  filter: brightness(1); }
      }
      @keyframes mnLogroGlow {
        0%,100% { box-shadow: 0 0 0 0 rgba(0,212,170,0); }
        50%     { box-shadow: 0 0 20px 4px rgba(0,212,170,0.35); }
      }
      .logro-card {
        transition: transform .2s ease, opacity .2s ease;
        perspective: 600px;
      }
      .logro-card:hover { transform: translateY(-3px); }
      .logro-unlock {
        animation: mnLogroUnlock 0.6s ease, mnLogroGlow 1.2s ease 0.6s;
      }
      .logro-progress-wrap {
        height: 3px;
        background: rgba(255,255,255,0.07);
        border-radius: 99px;
        margin-top: 8px;
        overflow: hidden;
      }
      .logro-progress-fill {
        height: 100%;
        border-radius: inherit;
        background: var(--accent, #00D4AA);
        transition: width .6s cubic-bezier(0.16,1,0.3,1);
      }
      .logro-next-hint {
        font-size: .62rem;
        color: rgba(255,255,255,0.3);
        margin-top: 4px;
        line-height: 1.4;
      }
      [data-theme="light"] .logro-next-hint { color: rgba(0,0,0,0.3); }
      [data-theme="light"] .logro-progress-wrap { background: rgba(0,0,0,0.07); }
    `;
    document.head.appendChild(s);
  }

  /**
   * Anima la card de un logro recién desbloqueado.
   * @param {string} achievementId
   */
  function animateLogroUnlock(achievementId) {
    const card = document.querySelector(`[data-logro-id="${achievementId}"]`);
    if (!card) return;
    card.classList.remove('logro-unlock');
    void card.offsetWidth; // reflow
    card.classList.add('logro-unlock');
    setTimeout(() => card.classList.remove('logro-unlock'), 1800);
  }

  window.MNLogros = { animateUnlock: animateLogroUnlock };


  // ════════════════════════════════════════════════════════════════
  //  INIT — Llamar desde app.js o index.html
  // ════════════════════════════════════════════════════════════════

  function init() {
    _injectSparklineStyles();
    _injectPredictorStyles();
    _injectCompareStyles();
    _injectBudgetAlertStyles();
    _injectLogroStyles();
    _watchSwipeTarget();

    // Predictor se inicia cuando el modal se abre
    document.addEventListener('mn:quickadd:open', () => {
      setTimeout(initQuickAddPredictor, 80);
    });

    // Enhance budget cards after render
    document.addEventListener('mn:navigate', () => {
      setTimeout(enhanceBudgetCards, 120);
    });
    // Also run after initial render
    setTimeout(enhanceBudgetCards, 600);
  }

  window.MNPremiumFeatures = {
    init,
    renderSparklines,
    predictCategory,
    initQuickAddPredictor,
    enhanceBudgetCards,
    fireConfetti,
    animateLogroUnlock,
    renderCompareMonthSelector,
    renderCompareDelta,
  };
})();
