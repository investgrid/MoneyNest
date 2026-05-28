// ═══════════════════════════════════════════════════════════════
// MONEYNEST — DASHBOARD MODULE
// ═══════════════════════════════════════════════════════════════

/**
 * Dashboard principal con KPIs, patrimonio, insights
 * Extracted from app.js for better maintainability
 */

// Dependencies will be passed from main app
let S, t, currentMonth, prevMonth, monthLabel, fmtDate, calcIngresosMes, calcGastosMes
let calcPatrimonio, calcDineroDisponible, calcCartera, calcTotalDeuda, calcAssetsValue
let checkMonthSummary, getStreak, generarInsights, calcSavingsRate, calc503020, calcHealthScore
let eur, pct, fmt, deltaClass, deltaIcon, catEmoji, goTo, verDetalleCuenta, openModal
let renderMonthSummaryBanner, renderHealthScore, renderPresupuestosResumen
let renderDash503020, renderSubscriptionDetector, renderChartPatrimonio, renderChartDonut
let animateCounter, syncBottomNav, updateDocTitle, TX_TYPES

export function initDashboard(deps) {
  Object.assign(window, deps)
  S = deps.S
  t = deps.t
  currentMonth = deps.currentMonth
  prevMonth = deps.prevMonth
  monthLabel = deps.monthLabel
  fmtDate = deps.fmtDate
  calcIngresosMes = deps.calcIngresosMes
  calcGastosMes = deps.calcGastosMes
  calcPatrimonio = deps.calcPatrimonio
  calcDineroDisponible = deps.calcDineroDisponible
  calcCartera = deps.calcCartera
  calcTotalDeuda = deps.calcTotalDeuda
  calcAssetsValue = deps.calcAssetsValue
  checkMonthSummary = deps.checkMonthSummary
  getStreak = deps.getStreak
  generarInsights = deps.generarInsights
  calcSavingsRate = deps.calcSavingsRate
  calc503020 = deps.calc503020
  calcHealthScore = deps.calcHealthScore
  eur = deps.eur
  pct = deps.pct
  fmt = deps.fmt
  deltaClass = deps.deltaClass
  deltaIcon = deps.deltaIcon
  catEmoji = deps.catEmoji
  goTo = deps.goTo
  verDetalleCuenta = deps.verDetalleCuenta
  openModal = deps.openModal
  renderMonthSummaryBanner = deps.renderMonthSummaryBanner
  renderHealthScore = deps.renderHealthScore
  renderPresupuestosResumen = deps.renderPresupuestosResumen
  renderDash503020 = deps.renderDash503020
  renderSubscriptionDetector = deps.renderSubscriptionDetector
  renderChartPatrimonio = deps.renderChartPatrimonio
  renderChartDonut = deps.renderChartDonut
  animateCounter = deps.animateCounter
  syncBottomNav = deps.syncBottomNav
  updateDocTitle = deps.updateDocTitle
  TX_TYPES = deps.TX_TYPES
}

export function renderDashboard() {
  const m  = currentMonth()
  const mp = prevMonth(m)
  const yr = new Date().getFullYear() + ''
  const ing  = calcIngresosMes(m)
  const gas  = calcGastosMes(m)
  const cf   = ing - gas
  const ingP = calcIngresosMes(mp)
  const gasP = calcGastosMes(mp)
  const pat  = calcPatrimonio()
  const patP = (() => { const h = S.patrimonio_hist.find(h=>h.mes===mp); return h ? h.valor : null })()
  const patDelta = patP !== null ? ((pat - patP) / Math.abs(patP || 1)) * 100 : null
  const dis  = calcDineroDisponible()

  // Year-to-date totals
  const ingYTD = S.ingresos.filter(i=>i.status!=='pending'&&(i.fecha||'').startsWith(yr)).reduce((a,i)=>a+(Number(i.importe)||0),0)
  const gasYTD = S.gastos.filter(g=>(g.fecha||'').startsWith(yr)&&g.tipo!==TX_TYPES.GOAL_TRANSFER).reduce((a,g)=>a+(Number(g.importe)||0),0)

  // Recent transactions
  const recentMovs = [
    ...S.ingresos.map(i=>({...i,_tipo:'ingreso',_sign:'+',_color:'var(--green)'})),
    ...S.gastos.filter(g=>g.tipo!==TX_TYPES.GOAL_TRANSFER).map(g=>({...g,_tipo:'gasto',_sign:'−',_color:'var(--red)'}))
  ].sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||'')).slice(0,6)

  const recentRows = recentMovs.length ? recentMovs.map(m=>`
    <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--border)">
      <div style="display:flex;align-items:center;gap:10px;min-width:0">
        <div style="width:32px;height:32px;border-radius:8px;background:${m._tipo==='ingreso'?'var(--green-dim)':'var(--red-dim)'};
          display:flex;align-items:center;justify-content:center;font-size:.9rem;flex-shrink:0">
          ${m._tipo==='ingreso'?'💰':'💳'}
        </div>
        <div style="min-width:0">
          <div style="font-size:.88rem;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px">${m.concepto||'—'}</div>
          <div style="font-size:.72rem;color:var(--text2)">${fmtDate(m.fecha)} · <span style="font-size:.78rem">${catEmoji(m.categoria)}</span> ${m.categoria||'—'}</div>
        </div>
      </div>
      <div style="font-size:.9rem;font-weight:700;color:${m._color};flex-shrink:0;margin-left:12px">${m._sign}${eur(m.importe)}</div>
    </div>`).join('') :
    '<div style="padding:24px;text-align:center;color:var(--text2);font-size:.85rem">' + t('sin_movimientos_aun') + '</div>'

  // Assets preview
  const activeAssets = (S.assets||[]).filter(a=>a.status==='active')
  const assetsVal    = calcAssetsValue()
  const assetsPreviewHtml = activeAssets.length
    ? activeAssets.slice(0,4).map(a=>{
        const icons = {vehicle:'🚗',property:'🏠',electronics:'💻',jewelry:'💎',business:'🏢',other:'📦',car:'🚗',house:'🏠'}
        const icon = icons[a.tipo]||'📦'
        let cv = Number(a.valor)||0
        if (a.depreciacion && a.depPct && a.fecha) {
          const yrs = (Date.now()-new Date(a.fecha).getTime())/(1000*60*60*24*365.25)
          cv = cv*Math.pow(1-(Number(a.depPct)||0)/100,Math.max(0,yrs))
        }
        return `<div style="display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border)">
          <div style="display:flex;align-items:center;gap:7px">
            <span style="font-size:.9rem">${icon}</span>
            <span style="font-size:.8rem;color:var(--text);font-weight:600;max-width:120px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.nombre}</span>
          </div>
          <span style="font-size:.8rem;font-weight:700;color:var(--text);flex-shrink:0">${eur(cv)}</span>
        </div>`
      }).join('') +
      (activeAssets.length > 4 ? `<div style="font-size:.72rem;color:var(--text2);padding-top:8px;text-align:center">+${activeAssets.length-4} más → <span style="color:var(--accent);cursor:pointer" onclick="goTo('patrimonio')">ver todo</span></div>` : '')
    : `<div style="padding:16px 0;text-align:center;color:var(--text2);font-size:.8rem">
        <div style="font-size:1.4rem;margin-bottom:6px">🏠</div>
        ${t('sin_activos')}
        <div style="margin-top:6px"><span style="color:var(--accent);cursor:pointer;font-size:.75rem" onclick="goTo('patrimonio')">${t('anadir_activo')}</span></div>
      </div>`

  const monthlySummary = checkMonthSummary()
  const streak = getStreak()
  const insights = generarInsights()

  // Build insights HTML
  const insightsHtml = (() => {
    if (insights === null) return `
      <div class="insight-empty">
        <div class="insight-empty-icon">📊</div>
        <div style="font-weight:600;color:var(--text);margin-bottom:4px">${t('aun_sin_datos')}</div>
        <div>${t('anadir_movs')}</div>
      </div>`
    if (insights.length === 0) return `
      <div class="insight-empty">
        <div class="insight-empty-icon">✅</div>
        <div style="font-weight:600;color:var(--text);margin-bottom:4px">${t('todo_orden_mes')}</div>
        <div>${t('sigue_mas_detalle')}</div>
      </div>`
    return `<div class="insight-pill-list">${insights.map(i=>`
      <div class="insight-pill">
        <div class="insight-pill-icon" style="background:${i.bg}">${i.icon}</div>
        <div class="insight-pill-text">${i.text}</div>
      </div>`).join('')}</div>`
  })()

  const html = `
  <div class="section-header" style="margin-bottom:20px;align-items:flex-start">
    <div>
      <div class="page-h1">${t('hola_sin_coma')} <span style="color:var(--accent)">${S.usuario.nombre}</span>
        ${streak >= 3 ? `<span class="streak-badge" style="font-size:.7rem;vertical-align:middle;margin-left:8px">🔥 ${streak} días</span>` : ''}
      </div>
      <div class="page-sub">${monthLabel(m)} · ${t('resumen_financiero')}</div>
    </div>
    <div style="display:flex;gap:8px;flex-shrink:0" class="ytd-strip">
      <div style="display:flex;align-items:center;gap:9px;padding:9px 14px;background:var(--card);border:1px solid var(--border);border-radius:var(--radius-sm)">
        <div style="width:28px;height:28px;background:var(--green-dim);border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:.82rem;flex-shrink:0">📥</div>
        <div>
          <div style="font-size:.6rem;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.06em">${yr}</div>
          <div style="font-size:.95rem;font-weight:800;color:var(--green)" data-animate-ytd-raw="${ingYTD}">${eur(ingYTD)}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:9px;padding:9px 14px;background:var(--card);border:1px solid var(--border);border-radius:var(--radius-sm)">
        <div style="width:28px;height:28px;background:var(--red-dim);border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:.82rem;flex-shrink:0">📤</div>
        <div>
          <div style="font-size:.6rem;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.06em">${yr}</div>
          <div style="font-size:.95rem;font-weight:800;color:var(--red)" data-animate-ytd-raw="${gasYTD}">${eur(gasYTD)}</div>
        </div>
      </div>
    </div>
  </div>

  ${renderMonthSummaryBanner(monthlySummary)}
  ${renderHealthScore()}

  <div style="display:grid;grid-template-columns:1fr 270px;gap:14px;margin-bottom:14px" class="dash-hero-grid">
    <div class="patrimonio-hero" style="margin-bottom:0">
      <div class="patrimonio-label">${t('patrimonio_neto')}</div>
      <div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap">
        <div class="patrimonio-num" data-animate-raw="${pat}" data-sparkline-off="patrimonio">${eur(pat)}</div>
        ${patDelta !== null ? `<span class="kpi-delta ${deltaClass(patDelta)}" style="font-size:.82rem">${deltaIcon(patDelta)} ${pct(Math.abs(patDelta))} vs. mes ant.</span>` : ''}
      </div>
      <div class="patrimonio-stats" style="margin-top:12px">
        <div class="patrimonio-stat"><span class="patrimonio-stat-label">💰 ${t('liquidez')}</span><span class="patrimonio-stat-val">${eur(dis)}</span></div>
        <div class="patrimonio-stat"><span class="patrimonio-stat-label">📈 ${t('invertido')}</span><span class="patrimonio-stat-val">${eur(calcCartera())}</span></div>
        <div class="patrimonio-stat"><span class="patrimonio-stat-label">🏠 ${t('activos')}</span><span class="patrimonio-stat-val">${eur(assetsVal)}</span></div>
        <div class="patrimonio-stat"><span class="patrimonio-stat-label">📉 ${t('deudas_lbl')}</span><span class="patrimonio-stat-val" style="color:${calcTotalDeuda()>0?'var(--red)':'var(--green)'}">${calcTotalDeuda()>0?'−'+eur(calcTotalDeuda()):t('sin_deudas')}</span></div>
      </div>
      <div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.06)">
        <div style="font-size:.7rem;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">${t('cuentas_lbl')}</div>
        <div style="display:flex;flex-wrap:wrap;gap:7px">
          ${S.cuentas.map(c=>`<div onclick="verDetalleCuenta('${c.id}')" style="display:flex;align-items:center;gap:6px;padding:5px 11px;border-radius:99px;background:${c.color||'#00D4AA'}18;border:1px solid ${c.color||'#00D4AA'}30;cursor:pointer;transition:all .15s" onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform=''"><span style="width:7px;height:7px;border-radius:50%;background:${c.color||'#00D4AA'};flex-shrink:0"></span><span style="font-size:.73rem;color:var(--text2)">${c.nombre}</span><span style="font-size:.8rem;font-weight:700;color:var(--text)">${eur(c.saldo||0)}</span></div>`).join('')}
        </div>
      </div>
    </div>
    <div class="card" style="display:flex;flex-direction:column">
      <div class="card-header" style="flex-shrink:0;margin-bottom:8px">
        <div><div class="card-title">🏠 ${t('activos')}</div><div class="card-subtitle">${eur(assetsVal)} total</div></div>
        <span class="pat-inv-link" onclick="goTo('patrimonio')" style="font-size:.72rem">Ver →</span>
      </div>
      <div style="flex:1">${assetsPreviewHtml}</div>
      ${calcTotalDeuda()>0?`<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border)">
        <div style="font-size:.67rem;color:var(--text2);font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">${t('deudas_lbl')}</div>
        ${S.deudas.slice(0,2).map(d=>`<div style="display:flex;justify-content:space-between;font-size:.77rem;padding:3px 0"><span style="color:var(--text2)">${d.nombre||'—'}</span><span style="color:var(--red);font-weight:700">${eur((Number(d.importeTotal)||0)-(Number(d.importePagado)||0))}</span></div>`).join('')}
        ${S.deudas.length>2?`<div style="font-size:.7rem;color:var(--text3);margin-top:4px;cursor:pointer" onclick="goTo('deudas')">+${S.deudas.length-2} más →</div>`:''}
      </div>`:''}
    </div>
  </div>

  <div class="kpi-grid kpi-grid-3" style="margin-bottom:14px">
    <div class="kpi-card" data-sparkline-off="ingresos">
      <div class="kpi-icon" style="background:var(--green-dim)">💰</div>
      <div class="kpi-label">${t('ingresos_mes')}</div>
      <div class="kpi-value" data-animate-raw="${ing}">${eur(ing)}</div>
      ${ingP ? `<span class="kpi-delta ${deltaClass(ing-ingP)}">${deltaIcon(ing-ingP)} ${pct(Math.abs(ingP?((ing-ingP)/ingP*100):0))} vs. ant.</span>` : '<span class="kpi-delta neu">Primer mes</span>'}
      <div class="kpi-sub" style="margin-top:5px">${S.ingresos.filter(i=>i.status!=='pending'&&(i.fecha||'').startsWith(m)).length} entradas</div>
    </div>
    <div class="kpi-card" data-sparkline-off="gastos">
      <div class="kpi-icon" style="background:var(--red-dim)">💳</div>
      <div class="kpi-label">${t('gastos_mes')}</div>
      <div class="kpi-value" data-animate-raw="${gas}">${eur(gas)}</div>
      ${gasP ? `<span class="kpi-delta ${gas>gasP?'down':'up'}">${gas>gasP?'↑':'↓'} ${pct(Math.abs(gasP?((gas-gasP)/gasP*100):0))} vs. ant.</span>` : '<span class="kpi-delta neu">Primer mes</span>'}
      <div class="kpi-sub" style="margin-top:5px">${S.gastos.filter(g=>g.tipo!==TX_TYPES.GOAL_TRANSFER&&(g.fecha||'').startsWith(m)).length} salidas</div>
    </div>
    <div class="kpi-card" data-sparkline-off="cashflow">
      <div class="kpi-icon" style="background:${cf>=0?'var(--accent-dim)':'var(--red-dim)'}">${cf>=0?'📊':'⚠️'}</div>
      <div class="kpi-label">${t('cash_flow')}</div>
      <div class="kpi-value" style="color:${cf>=0?'var(--accent)':'var(--red)'}" data-animate-raw="${cf}">${cf>=0?'+':''}${eur(cf)}</div>
      <span class="kpi-delta ${cf>=0?'up':'down'}">${cf>=0?'Superávit':'Déficit'} · ${monthLabel(m)}</span>
      <div class="kpi-sub" style="margin-top:5px">Ahorro: <strong style="color:${calcSavingsRate(m)>=20?'var(--green)':'var(--gold)'}">${pct(Math.max(0,calcSavingsRate(m)))}</strong></div>
    </div>
  </div>

  <div class="grid-2" style="margin-bottom:14px">
    <div class="card">
      <div class="card-header">
        <div><div class="card-title">📈 ${t('evolucion_patrimonio')}</div><div class="card-subtitle">${t('ultimos_6_meses')}</div></div>
      </div>
      <div class="chart-container"><canvas id="chartPatrimonio"></canvas></div>
    </div>
    <div class="card">
      <div class="card-header">
        <div><div class="card-title">🕐 ${t('actividad_reciente')}</div><div class="card-subtitle">${t('ultimas_transacciones')}</div></div>
        <button class="btn btn-ghost btn-sm" onclick="goTo('ingresos')" style="font-size:.75rem">${t('ver_todo')}</button>
      </div>
      <div>${recentRows}</div>
    </div>
  </div>

  <div class="grid-2" style="margin-bottom:14px">
    <div class="card">
      <div class="card-header">
        <div><div class="card-title">🍩 ${t('gastos_categoria')}</div><div class="card-subtitle">${monthLabel(m)}</div></div>
      </div>
      <div style="display:flex;gap:16px;align-items:center">
        <div style="flex:0 0 130px"><canvas id="chartDonut" height="130"></canvas></div>
        <div class="legend" id="donutLegend" style="flex:1;margin-top:0"></div>
      </div>
    </div>
    <div class="card">
      <div class="card-header">
        <div><div class="card-title">💡 Insights</div><div class="card-subtitle">${t('generados_tus_datos')}</div></div>
      </div>
      <div id="insightsContainer">${insightsHtml}</div>
    </div>
  </div>

  ${renderPresupuestosResumen()}
  ${renderDash503020()}
  ${renderSubscriptionDetector()}
  `

  document.getElementById('content').innerHTML = html

  // Animate health score ring
  const scoreVal = calcHealthScore()
  const scoreEl  = document.getElementById('healthScoreNum')
  const ringEl   = document.getElementById('healthRingFill')
  const r = 22, circum = 2 * Math.PI * r
  if (scoreEl && ringEl && scoreVal > 0) {
    scoreEl.textContent = '0'
    const dur = 1200, start = performance.now()
    function animScore(now) {
      const p   = Math.min((now - start) / dur, 1)
      const ease = 1 - Math.pow(1-p, 3)
      const cur  = Math.round(ease * scoreVal)
      scoreEl.textContent = cur
      ringEl.style.strokeDashoffset = circum - (cur/100) * circum
      if (p < 1) requestAnimationFrame(animScore)
      else { scoreEl.textContent = scoreVal; ringEl.style.strokeDashoffset = circum - (scoreVal/100)*circum }
    }
    requestAnimationFrame(animScore)
  }

  document.querySelectorAll('.kpi-value[data-target]').forEach(el => animateCounter(el, el.dataset.target))
  setTimeout(() => { renderChartPatrimonio(); renderChartDonut() }, 50)
  syncBottomNav('dashboard')
  updateDocTitle()
}

// Global export for legacy compatibility
window.renderDashboard = renderDashboard
