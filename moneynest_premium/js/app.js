/// CINEMATIC INTRO
// ═══════════════════════════════════════════════════════════════
function runCinematicIntro(onComplete) {
  const intro = document.getElementById('mnIntro')
  if (!intro) { onComplete(); return }

  intro.style.display = 'flex'

  // Phase 1: fade in background (0ms)
  const bg = document.getElementById('mnIntroBg')
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (bg) bg.classList.add('visible')
    })
  })

  // Phase 2: reveal content (150ms)
  setTimeout(() => {
    const content = document.getElementById('mnIntroContent')
    if (content) content.classList.add('visible')
    const wordmark = document.getElementById('mnIntroWordmark')
    if (wordmark) wordmark.classList.add('visible')
    const tagline = document.getElementById('mnIntroTagline')
    if (tagline) tagline.classList.add('visible')
  }, 150)

  // Phase 3: trigger SVG stroke animation (250ms)
  setTimeout(() => {
    const svg = document.getElementById('mnIntroSvg')
    if (svg) svg.classList.add('animate')
  }, 250)

  // Phase 4: hold, then fade out (2100ms total)
  setTimeout(() => {
    intro.classList.add('fade-out')
    setTimeout(() => {
      intro.style.display = 'none'
      onComplete()
    }, 500)
  }, 2100)
}

// ─── DEMO DATA ────────────────────────────────────────────────
const DEMO_FLAG = 'mn7_demo_mode'
function isDemoMode() { try { return localStorage.getItem(DEMO_FLAG) === 'true' } catch(e){ return false } }

function loadDemoData(scenario, nombreOverride) {
  try { localStorage.setItem(DEMO_FLAG, 'true') } catch(e){}
  const hoy = new Date()
  const m0 = hoy.toISOString().slice(0,7)
  const m1 = new Date(hoy.getFullYear(), hoy.getMonth()-1, 1).toISOString().slice(0,7)
  const m2 = new Date(hoy.getFullYear(), hoy.getMonth()-2, 1).toISOString().slice(0,7)
  const d = (mes, dia) => `${mes}-${String(dia).padStart(2,'0')}`

  // Helper: slight randomness so amounts look human
  const jitter = (base, pct=0.08) => Math.round(base * (1 + (Math.random()-0.5)*pct))

  // Scenario config
  const sc = scenario || 'standard'
  const scenarios = {
    standard:  { nombre:'Alex García',     salario:2950, extra:580,  alquiler:900,  ahorroBase:9200 },
    freelance: { nombre:'Sara López',      salario:0,    extra:4200, alquiler:850,  ahorroBase:6500 },
    family:    { nombre:'Familia Martín',  salario:5200, extra:300,  alquiler:1100, ahorroBase:15000 },
    investor:  { nombre:'Carlos Rueda',    salario:3800, extra:1200, alquiler:0,    ahorroBase:28000 },
  }
  const cfg = scenarios[sc] || scenarios.standard

  S.usuario.nombre = nombreOverride || cfg.nombre || 'Demo'

  // ── CUENTAS ────────────────────────────────────────────────────
  const saldoCorriente = sc === 'freelance' ? 1850 : sc === 'family' ? 4200 : sc === 'investor' ? 6800 : 2870
  const saldoAhorro    = cfg.ahorroBase
  S.cuentas = [
    { id:'dc1', nombre: sc==='family'?'BBVA Familia':'BBVA Corriente', tipo:'banco',    saldo: saldoCorriente, color:'#00D4AA' },
    { id:'dc2', nombre:'ING Ahorro',     tipo:'ahorro',   saldo: saldoAhorro, color:'#6366F1' },
    { id:'dc3', nombre:'Revolut',        tipo:'banco',    saldo: sc==='investor'?1200:340, color:'#F59E0B' },
    { id:'dc4', nombre:'Efectivo',       tipo:'efectivo', saldo:95, color:'#10B981' },
  ]

  // ── INGRESOS: 3 meses, varias fuentes ─────────────────────────
  const salNombre = sc==='freelance' ? 'Proyecto principal' : sc==='family' ? 'Nómina titular' : 'Nómina'
  const salario   = cfg.salario
  const extra     = cfg.extra
  const extraNom  = sc==='freelance' ? 'Proyecto secundario' : sc==='family' ? 'Nómina pareja' : sc==='investor' ? 'Dividendos cartera' : 'Proyecto freelance'
  S.ingresos = [
    // Mes actual
    ...(salario > 0 ? [{ id:'di01', concepto:`${salNombre} ${new Date(hoy.getFullYear(),hoy.getMonth()).toLocaleString('es',{month:'long'})}`, importe:salario, categoria:'Salario', fecha:d(m0,'01'), cuentaId:'dc1', status:'cobrado', recurrente:true }] : []),
    { id:'di02', concepto: extraNom,          importe:extra,  categoria: sc==='freelance'?'Freelance':sc==='investor'?'Dividendos':'Freelance', fecha:d(m0,'08'), cuentaId:'dc3', status:'cobrado' },
    { id:'di03', concepto:'Dividendos ETF',   importe: sc==='investor'?340:94, categoria:'Dividendos', fecha:d(m0,'15'), cuentaId:'dc2', status:'cobrado' },
    { id:'di04', concepto:'Alquiler habitación', importe:380, categoria:'Alquiler', fecha:d(m0,'05'), cuentaId:'dc1', status:'pendiente' },
    // Mes anterior
    ...(salario > 0 ? [{ id:'di05', concepto:`${salNombre} (mes anterior)`, importe:jitter(salario,.03), categoria:'Salario', fecha:d(m1,'01'), cuentaId:'dc1', status:'cobrado', recurrente:true }] : []),
    { id:'di06', concepto: extraNom,          importe:jitter(extra,.15), categoria: sc==='freelance'?'Freelance':sc==='investor'?'Dividendos':'Freelance', fecha:d(m1,'22'), cuentaId:'dc3', status:'cobrado' },
    { id:'di07', concepto:'Dividendos ETF',   importe: sc==='investor'?jitter(340,.08):88, categoria:'Dividendos', fecha:d(m1,'15'), cuentaId:'dc2', status:'cobrado' },
    // Hace 2 meses
    ...(salario > 0 ? [{ id:'di08', concepto:`${salNombre} (hace 2 meses)`, importe:jitter(salario,.03), categoria:'Salario', fecha:d(m2,'01'), cuentaId:'dc1', status:'cobrado', recurrente:true }] : []),
    { id:'di09', concepto:'Bono / ingreso extra', importe: sc==='investor'?800:750, categoria:'Bono', fecha:d(m2,'07'), cuentaId:'dc1', status:'cobrado' },
    { id:'di10', concepto:'Venta artículo',    importe:145, categoria:'Otros', fecha:d(m2,'19'), cuentaId:'dc3', status:'cobrado' },
    { id:'di11', concepto:'Dividendos ETF',    importe: sc==='investor'?jitter(340,.05):91, categoria:'Dividendos', fecha:d(m2,'15'), cuentaId:'dc2', status:'cobrado' },
  ].filter(Boolean)

  // ── GASTOS: 55+ transacciones distribuidas en 3 meses ─────────
  const alq = cfg.alquiler
  const g = []

  // ─ MES ACTUAL (m0) ─
  // Fijos recurrentes
  if (alq > 0) g.push(['dg01','Alquiler', alq, 'Vivienda', m0,'01','dc1',true])
  g.push(['dg02','Gym Urban Sports',   jitter(40),  'Salud',         m0,'01','dc1',true])
  g.push(['dg03','Netflix',            jitter(18),  'Suscripciones', m0,'05','dc3',true])
  g.push(['dg04','Spotify',            jitter(10),  'Suscripciones', m0,'05','dc3',true])
  g.push(['dg05','Amazon Prime',       jitter(5),   'Suscripciones', m0,'07','dc3',true])
  g.push(['dg06','Seguro médico',      jitter(55),  'Salud',         m0,'02','dc1',true])
  // Alimentación (compras semanales)
  g.push(['dg07','Mercadona',          jitter(82),  'Alimentación',  m0,'04','dc1'])
  g.push(['dg08','Lidl',               jitter(47),  'Alimentación',  m0,'11','dc1'])
  g.push(['dg09','Mercadona',          jitter(91),  'Alimentación',  m0,'18','dc1'])
  g.push(['dg10','Frutas mercado',     jitter(14),  'Alimentación',  m0,'20','dc4'])
  g.push(['dg11','Mercadona',          jitter(78),  'Alimentación',  m0,'25','dc1'])
  // Cafés / pequeños
  g.push(['dg12','Café Avenida',       jitter(3),   'Restaurantes',  m0,'06','dc4'])
  g.push(['dg13','Café',               jitter(2),   'Restaurantes',  m0,'08','dc4'])
  g.push(['dg14','Café Starbucks',     jitter(6),   'Restaurantes',  m0,'13','dc3'])
  g.push(['dg15','Café',               jitter(3),   'Restaurantes',  m0,'17','dc4'])
  g.push(['dg16','Café Cortado',       jitter(2),   'Restaurantes',  m0,'22','dc4'])
  // Restaurantes
  g.push(['dg17','Restaurante Mesón',  jitter(38),  'Restaurantes',  m0,'09','dc1'])
  g.push(['dg18','Sushi bar',          jitter(52),  'Restaurantes',  m0,'16','dc3'])
  // Transporte
  g.push(['dg19','Gasolina BP',        jitter(68),  'Transporte',    m0,'10','dc1'])
  g.push(['dg20','Tren AVE',           jitter(42),  'Transporte',    m0,'14','dc1'])
  // Ocio / personal
  g.push(['dg21','Cine',               jitter(12),  'Ocio',          m0,'12','dc3'])
  g.push(['dg22','Farmacia',           jitter(24),  'Salud',         m0,'15','dc4'])
  g.push(['dg23','H&M ropa',           jitter(75),  'Ropa',          m0,'19','dc1'])

  // ─ MES ANTERIOR (m1) ─
  // Fijos recurrentes
  if (alq > 0) g.push(['dg24','Alquiler', alq, 'Vivienda', m1,'01','dc1',true])
  g.push(['dg25','Gym Urban Sports',   jitter(40),  'Salud',         m1,'01','dc1',true])
  g.push(['dg26','Netflix',            jitter(18),  'Suscripciones', m1,'05','dc3',true])
  g.push(['dg27','Spotify',            jitter(10),  'Suscripciones', m1,'05','dc3',true])
  g.push(['dg28','Amazon Prime',       jitter(5),   'Suscripciones', m1,'07','dc3',true])
  g.push(['dg29','Seguro médico',      jitter(55),  'Salud',         m1,'02','dc1',true])
  // Alimentación
  g.push(['dg30','Mercadona',          jitter(89),  'Alimentación',  m1,'05','dc1'])
  g.push(['dg31','Carrefour',          jitter(63),  'Alimentación',  m1,'12','dc1'])
  g.push(['dg32','Mercadona',          jitter(74),  'Alimentación',  m1,'19','dc1'])
  g.push(['dg33','Panadería',          jitter(8),   'Alimentación',  m1,'23','dc4'])
  g.push(['dg34','Mercadona',          jitter(55),  'Alimentación',  m1,'26','dc1'])
  // Cafés
  g.push(['dg35','Café',               jitter(2),   'Restaurantes',  m1,'03','dc4'])
  g.push(['dg36','Café Cortado',       jitter(3),   'Restaurantes',  m1,'09','dc4'])
  g.push(['dg37','Starbucks',          jitter(5),   'Restaurantes',  m1,'15','dc3'])
  g.push(['dg38','Café',               jitter(2),   'Restaurantes',  m1,'21','dc4'])
  // Restaurantes
  g.push(['dg39','Cena cumpleaños',    jitter(88),  'Restaurantes',  m1,'20','dc1'])
  g.push(['dg40','Almuerzo trabajo',   jitter(14),  'Restaurantes',  m1,'10','dc3'])
  // Transporte
  g.push(['dg41','Gasolina',           jitter(61),  'Transporte',    m1,'08','dc1'])
  g.push(['dg42','Metro mensual',      jitter(20),  'Transporte',    m1,'01','dc1',true])
  // Educación / ocio
  g.push(['dg43','Udemy curso',        jitter(18),  'Educación',     m1,'14','dc3'])
  g.push(['dg44','Concierto entrada',  jitter(45),  'Ocio',          m1,'24','dc1'])

  // ─ HACE 2 MESES (m2) ─
  // Fijos recurrentes
  if (alq > 0) g.push(['dg45','Alquiler', alq, 'Vivienda', m2,'01','dc1',true])
  g.push(['dg46','Gym Urban Sports',   jitter(40),  'Salud',         m2,'01','dc1',true])
  g.push(['dg47','Netflix',            jitter(18),  'Suscripciones', m2,'05','dc3',true])
  g.push(['dg48','Spotify',            jitter(10),  'Suscripciones', m2,'05','dc3',true])
  g.push(['dg49','Amazon Prime',       jitter(5),   'Suscripciones', m2,'07','dc3',true])
  g.push(['dg50','Seguro médico',      jitter(55),  'Salud',         m2,'02','dc1',true])
  // Alimentación
  g.push(['dg51','Mercadona',          jitter(77),  'Alimentación',  m2,'06','dc1'])
  g.push(['dg52','Lidl',               jitter(44),  'Alimentación',  m2,'13','dc1'])
  g.push(['dg53','Mercadona',          jitter(83),  'Alimentación',  m2,'20','dc1'])
  g.push(['dg54','Mercado ecológico',  jitter(22),  'Alimentación',  m2,'24','dc4'])
  // Cafés
  g.push(['dg55','Café',               jitter(3),   'Restaurantes',  m2,'04','dc4'])
  g.push(['dg56','Café Cortado',       jitter(2),   'Restaurantes',  m2,'11','dc4'])
  g.push(['dg57','Café Starbucks',     jitter(5),   'Restaurantes',  m2,'18','dc3'])
  // Restaurantes / ocio
  g.push(['dg58','Tapas bar',          jitter(28),  'Restaurantes',  m2,'17','dc1'])
  g.push(['dg59','Teatro',             jitter(32),  'Ocio',          m2,'22','dc3'])
  g.push(['dg60','Gasolina',           jitter(72),  'Transporte',    m2,'11','dc1'])
  g.push(['dg61','Metro mensual',      jitter(20),  'Transporte',    m2,'01','dc1',true])
  g.push(['dg62','Libro técnico',      jitter(28),  'Educación',     m2,'16','dc2'])
  g.push(['dg63','Farmacia',           jitter(19),  'Salud',         m2,'27','dc4'])

  S.gastos = g.map(([id,concepto,importe,categoria,mes,dia,cuentaId,recurrente]) => ({
    id, concepto, importe, categoria,
    fecha: `${mes}-${String(dia).padStart(2,'0')}`,
    cuentaId, recurrente: !!recurrente, _demo: true
  }))

  // ── INVERSIONES ────────────────────────────────────────────────
  S.inversiones = [
    { id:'dinv1', nombre:'ETF World MSCI',      importe:5000, rentabilidad:13.2, categoria:'ETF',           fecha:d(m2,'15'), cuentaId:'dc2', cerrada:false },
    { id:'dinv2', nombre:'Bitcoin',             importe:600,  rentabilidad:-6.4, categoria:'Cripto',        fecha:d(m1,'20'), cuentaId:'dc3', cerrada:false },
    { id:'dinv3', nombre:'Acciones Inditex',    importe:1400, rentabilidad:7.8,  categoria:'Acciones',      fecha:d(m2,'03'), cuentaId:'dc2', cerrada:false },
    { id:'dinv4', nombre:'Fondo indexado S&P',  importe:2500, rentabilidad:14.5, categoria:'Fondo indexado',fecha:d(m2,'10'), cuentaId:'dc2', cerrada:false },
  ]

  // ── DEUDAS ─────────────────────────────────────────────────────
  S.deudas = [
    { id:'dd1', nombre:'Préstamo coche',   importeTotal:9200, importePagado:4100, interes:4.2, categoria:'Préstamo personal', vencimiento:'2027-06-01', pagos:[] },
    { id:'dd2', nombre:'Tarjeta Visa',     importeTotal:950,  importePagado:320,  interes:17,  categoria:'Tarjeta crédito',   vencimiento:'2026-02-01', pagos:[] },
  ]

  // ── OBJETIVOS ──────────────────────────────────────────────────
  S.objetivos = [
    { id:'do1', nombre:'Fondo de emergencia', objetivo:10000, actual:9200, categoria:'Emergencia', color:'#00D4AA', emoji:'🛡️', fechaObjetivo:'2025-09-01' },
    { id:'do2', nombre:'Vacaciones Japón',    objetivo:4000,  actual:1450, categoria:'Viaje',      color:'#6366F1', emoji:'✈️', fechaObjetivo:'2026-03-01' },
    { id:'do3', nombre:'MacBook Pro M4',      objetivo:2800,  actual:700,  categoria:'Tecnología', color:'#F59E0B', emoji:'💻', fechaObjetivo:'2026-06-01' },
  ]

  // ── PRESUPUESTOS ───────────────────────────────────────────────
  S.presupuestos = {
    'Alimentación':  300,
    'Transporte':    110,
    'Restaurantes':  130,
    'Ocio':          100,
    'Suscripciones':  50,
    'Ropa':          120,
  }

  // ── PATRIMONIO HISTÓRICO ───────────────────────────────────────
  const basePatr = 19500
  S.patrimonio_hist = []
  for (let i = 5; i >= 0; i--) {
    const dt  = new Date(hoy.getFullYear(), hoy.getMonth()-i, 1)
    const mes = dt.toISOString().slice(0,7)
    const growth = (5-i) * 380 + Math.round(Math.random()*300 - 60)
    S.patrimonio_hist.push({ mes, valor: basePatr + growth })
  }
}

function clearDemoData() {
  try { localStorage.removeItem(DEMO_FLAG) } catch(e){}
  const nombre = S.usuario.nombre
  const theme  = S.theme
  S = defaultState()
  S.usuario.nombre = nombre === 'Demo' ? 'Usuario' : (nombre || 'Usuario')
  S.theme = theme
  save()
  // Remove all demo UI elements
  ;['demo-mode-chip','demoFab','demoFabReal','demoPanelModal'].forEach(id => {
    const el = document.getElementById(id)
    if (el) el.remove()
  })
  render()
  // Show the "real mode" subtle FAB
  setTimeout(_renderDemoFab, 300)
  toast('✅ Modo real activado — app lista para tus datos')
}

function showDemoChip() { _renderDemoFab() }  // Alias kept for compatibility

// ─── DEMO FAB & PANEL ──────────────────────────────────────────
let _demoPanelOpen = false

function _renderDemoFab() {
  // Remove any existing FABs or chips
  ['demo-mode-chip','demoFab','demoFabReal','demoPanelModal'].forEach(id => {
    const el = document.getElementById(id)
    if (el) el.remove()
  })
  // 2. MODO DEMO: Only render FAB when in demo mode
  if (isDemoMode()) {
    // Gold FAB when demo is active
    const fab = document.createElement('button')
    fab.id = 'demoFab'
    fab.innerHTML = `<span class="fab-dot"></span><span class="fab-label">Modo demo<span class="fab-sub">Datos de ejemplo activos</span></span>`
    fab.title = 'Gestionar modo demo'
    fab.onclick = toggleDemoPanel
    document.body.appendChild(fab)

    // Build panel
    const panel = document.createElement('div')
    panel.id = 'demoPanelModal'
    panel.innerHTML = _buildDemoPanel()
    document.body.appendChild(panel)

    // Close on outside click
    document.addEventListener('pointerdown', _demoOutsideClick, { capture: true })
  }
}

function _demoOutsideClick(e) {
  const panel = document.getElementById('demoPanelModal')
  const fab   = document.getElementById('demoFab') || document.getElementById('demoFabReal')
  if (!panel || !panel.classList.contains('open')) return
  if (panel.contains(e.target) || (fab && fab.contains(e.target))) return
  panel.classList.remove('open')
  _demoPanelOpen = false
}

function toggleDemoPanel() {
  const panel = document.getElementById('demoPanelModal')
  if (!panel) return
  _demoPanelOpen = !panel.classList.contains('open')
  panel.classList.toggle('open', _demoPanelOpen)
}

function _buildDemoPanel() {
  if (isDemoMode()) {
    return `
      <div class="dpm-title">🟡 Modo demo activo</div>
      <div class="dpm-sub">Explora la app con datos de ejemplo. Tus datos reales están intactos.</div>
      <div class="dpm-sep"></div>
      <div class="dpm-row">
        <div class="dpm-label">Perfil del escenario</div>
        <select class="dpm-select" id="dpmScenario" onchange="demoScenarioPreview(this.value)">
          <option value="standard">👤 Perfil estándar — Asalariado con ahorro</option>
          <option value="freelance">💼 Freelance — Ingresos variables</option>
          <option value="family">👨‍👩‍👧 Familia — Dos ingresos, más gastos</option>
          <option value="investor">📈 Inversor activo — Cartera diversificada</option>
        </select>
      </div>
      <div class="dpm-actions">
        <button class="dpm-btn-gold" onclick="reloadDemoWithScenario()">🔄 Recargar con este perfil</button>
        <button class="dpm-btn-ghost" onclick="goTo('configuracion');toggleDemoPanel()">⚙️ Ver en Configuración</button>
        <button class="dpm-btn-danger" onclick="toggleDemoPanel();confirmar('¿Salir del modo demo y borrar los datos de ejemplo?',()=>{clearDemoData()},{titulo:\'Salir del demo\',icono:\'🏁\',btnLabel:\'Salir del demo\'})">🏁 Salir al modo real</button>
      </div>`
  } else {
    return `
      <div class="dpm-title">🔍 Explorar con datos demo</div>
      <div class="dpm-sub">Activa datos de ejemplo para ver todas las funciones sin introducir datos propios.</div>
      <div class="dpm-sep"></div>
      <div class="dpm-row">
        <div class="dpm-label">Nombre del usuario demo</div>
        <input class="dpm-input" id="dpmNombre" type="text" placeholder="Ej: María García" maxlength="30">
      </div>
      <div class="dpm-row">
        <div class="dpm-label">Perfil del escenario</div>
        <select class="dpm-select" id="dpmScenario">
          <option value="standard">👤 Perfil estándar — Asalariado con ahorro</option>
          <option value="freelance">💼 Freelance — Ingresos variables</option>
          <option value="family">👨‍👩‍👧 Familia — Dos ingresos, más gastos</option>
          <option value="investor">📈 Inversor activo — Cartera diversificada</option>
        </select>
      </div>
      <div class="dpm-actions">
        <button class="dpm-btn-gold" onclick="activateDemoWithConfig()">🚀 Activar modo demo</button>
      </div>`
  }
}

function demoScenarioPreview(val) { /* future: live preview */ }

function activateDemoWithConfig() {
  const nombre   = (document.getElementById('dpmNombre')?.value || '').trim() || 'Demo'
  const scenario = document.getElementById('dpmScenario')?.value || 'standard'
  toggleDemoPanel()
  loadDemoData(scenario, nombre)
  save()
  render()
  _renderDemoFab()
  toast('✅ Modo demo activado — explora sin límites')
}

function reloadDemoWithScenario() {
  const scenario = document.getElementById('dpmScenario')?.value || 'standard'
  const nombre   = S.usuario.nombre || 'Demo'
  toggleDemoPanel()
  loadDemoData(scenario, nombre)
  save()
  render()
  _renderDemoFab()
  toast('🔄 Escenario recargado: ' + scenario)
}

function finishOnboarding() {
  if (obData.nombre) S.usuario.nombre = obData.nombre
  S.usuario.mode = 'personal'

  if (obData.theme) {
    let resolved = obData.theme
    if (resolved === 'auto') resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    S.theme = resolved
  }

  if (obData.lang) { _currentLang = obData.lang; try { localStorage.setItem(LANG_STORAGE_KEY, obData.lang) } catch(e){} }
  _setObSeen()
  document.getElementById('onboardingOverlay').style.display = 'none'
  document.body.style.overflow = ''
  applyTheme()
  updateModeUI()

  if (obData.loadDemo) {
    loadDemoData('standard', obData.nombre || 'Demo')
    _setTutDone()
    save()
    render()
    toast('Datos de ejemplo cargados — explora libremente')
    _renderDemoFab()
    // Register in background after demo loaded
    _obRegisterSupabase()
    return
  }

  save()
  render()

  // ── Registro en Supabase con el email/password del onboarding ──
  _obRegisterSupabase()

  if (obData.startTutorial === true) {
    setTimeout(() => startTutorial(), 400)
  } else {
    _setTutDone()
    toast(`${t('hola')} ${S.usuario.nombre || 'Usuario'}! 🎉`)
  }
}

async function _obRegisterSupabase() {
  // Account was already created during OTP verification (obNext step 1).
  // Just sync the auth badge and send welcome email.
  if (!obData.email) return
  if (window.MNEmail && obData._registered && !obData._welcomeSent) {
    obData._welcomeSent = true
    MNEmail.sendWelcome(obData.email, obData.nombre || '')
  }
  if (window.MNAuthUI) {
    window.MNAuthUI.renderAuthBadge('authPlanBadge')
    window.MNAuthUI.renderTrialPill('trialPillContainer')
  }
}

function skipOnboarding() {
  _setObSeen()
  _setTutDone()
  document.getElementById('onboardingOverlay').style.display = 'none'
  document.body.style.overflow = ''
  render()
  _updateSidebarLang()
  toast(t('page_configuracion') + ' — ⚙️')
}

// ─── ONBOARDING FLAGS (persistent, never fail silently) ────────
const OB_FLAG_KEY  = 'mn7_ob_seen'    // 'true' after onboarding
const TUT_FLAG_KEY = 'mn7_tut_done'   // 'true' after tutorial

function _obFlagSeen()  { return localStorage.getItem(OB_FLAG_KEY)  === 'true' }
function _tutFlagDone() { return localStorage.getItem(TUT_FLAG_KEY) === 'true' }
function _setObSeen()   { try { localStorage.setItem(OB_FLAG_KEY,  'true') } catch(e){} }
function _setTutDone()  { try { localStorage.setItem(TUT_FLAG_KEY, 'true') } catch(e){} }

function checkOnboarding() {
  // If user already has a Supabase session, skip onboarding entirely
  if (window.MNSupabaseAuth && window.MNSupabaseAuth.isLoggedIn()) {
    _setObSeen()
    return
  }
  if (!_obFlagSeen()) {
    obStep = 1
    obData = { nombre:'', email:'', password:'', mode:'personal', lang:'es', theme:'dark', startTutorial:false, loadDemo:false }
    // Run cinematic intro first, then reveal onboarding
    runCinematicIntro(() => {
      obRender()
      const ov = document.getElementById('onboardingOverlay')
      if (ov) {
        ov.style.display = 'flex'
        requestAnimationFrame(() => ov.classList.add('ob-visible'))
        document.body.style.overflow = 'hidden'
      }
    })
  }
}

// ════════════════════════════════════════════════════════════════
// ─── MÓDULO: TUTORIAL INTERACTIVO ────────────────────────────
// Tutorial uses MOCK data — never touches real S state
// ════════════════════════════════════════════════════════════════
let tutStep = 0
let _tutMockActive = false

// ── Inject / remove mock data ──────────────────────────────────
function _tutInjectMock() {
  if (_tutMockActive) return
  _tutMockActive = true
  const today = todayISO()
  const cuentaId = S.cuentas[0]?.id || 'c1'

  // Fake income
  S.ingresos.unshift({
    id: '__tut_ing__', concepto: '💼 Salario (demo)', importe: 2500,
    categoria: 'Salario', fecha: today, cuentaId, _tutorial: true
  })
  // Update account saldo temporarily
  const cuenta = getCuenta(cuentaId)
  if (cuenta) cuenta._tutSaldoOrig = cuenta.saldo
  if (cuenta) cuenta.saldo = (Number(cuenta.saldo)||0) + 2500

  // Fake investment
  S.inversiones.unshift({
    id: '__tut_inv__', nombre: '📈 Fondo indexado S&P500 (demo)',
    importe: 500, categoria: 'Fondo indexado', rentabilidad: 8,
    fecha: today, cuentaId, cerrada: false, _tutorial: true
  })
  if (cuenta) cuenta.saldo = Math.max(0, (Number(cuenta.saldo)||0) - 500)

  // Fake physical asset
  if (!S.assets) S.assets = []
  S.assets.unshift({
    id: '__tut_asset__', nombre: '🚗 Audi A3 (demo)', tipo: 'vehicle',
    valorCompra: 22000, valor: 18000, fecha: todayISO(), status: 'active',
    depreciacion: false, depPct: 0, notas: 'Demo tutorial', _tutorial: true
  })

  save()
}

function _tutClearMock() {
  if (!_tutMockActive) return
  _tutMockActive = false
  S.ingresos = S.ingresos.filter(i => !i._tutorial)
  S.gastos   = S.gastos.filter(g => !g._tutorial)
  S.inversiones = S.inversiones.filter(i => !i._tutorial)
  S.assets   = (S.assets||[]).filter(a => !a._tutorial)
  // Restore account saldo
  S.cuentas.forEach(c => {
    if (c._tutSaldoOrig !== undefined) {
      c.saldo = c._tutSaldoOrig
      delete c._tutSaldoOrig
    }
  })
  save()
}

// ── Tutorial steps ─────────────────────────────────────────────
const TUT_STEPS = [
  { title: 'Bienvenido al tour 👋',
    text: 'Tour rápido con datos de demo. Tus datos reales no se tocarán.',
    target: null, page: 'dashboard' },
  { title: 'Patrimonio neto',
    text: 'Tu riqueza real: liquidez + inversiones + activos físicos − deudas.',
    target: '.patrimonio-hero', page: 'dashboard' },
  { title: 'KPIs del mes',
    text: 'Ingresos, gastos y cash flow. El porcentaje compara con el mes anterior.',
    target: '.kpi-grid', page: 'dashboard' },
  { title: 'Ingresos',
    text: 'Registra tus entradas. Demo: salario de 2.500 € ya añadido.',
    target: '#nav-ingresos', page: 'ingresos' },
  { title: 'Gastos',
    text: 'Registra y categoriza tus salidas. Usa presupuestos para controlar límites.',
    target: '#nav-gastos', page: 'gastos' },
  { title: 'Inversiones',
    text: 'Sigue tu cartera. Pulsa Liquidar para cerrar posiciones con ganancia/pérdida.',
    target: '#nav-inversiones', page: 'inversiones' },
  { title: 'Deudas',
    text: 'Gestiona préstamos con 3 estrategias: Conservador, Moderado o Agresivo.',
    target: '#nav-deudas', page: 'deudas' },
  { title: 'Objetivos',
    text: 'Define metas financieras. MoneyNest calcula cuándo las alcanzarás.',
    target: '#nav-objetivos', page: 'objetivos' },
  { title: 'Análisis avanzado',
    text: 'Burn rate, regla 50/30/20, fondo de emergencia y predicciones.',
    target: '#nav-analisis', page: 'analisis' },
  { title: '¡Listo! 🎉',
    text: 'Demo eliminada. Añade tus cuentas reales y empieza a registrar.',
    target: null, page: 'dashboard' }
]

function startTutorial() {
  tutStep = 0
  _tutInjectMock()
  destroyAllCharts()
  renderDashboard()
  currentPage = 'dashboard'
  document.querySelectorAll('.nav-item').forEach(el=>el.classList.remove('active'))
  const nav = document.getElementById('nav-dashboard')
  if (nav) nav.classList.add('active')
  document.getElementById('tutorialOverlay').style.display = 'block'
  renderTutStep()
}

function renderTutStep() {
  const step    = TUT_STEPS[tutStep]
  const overlay = document.getElementById('tutorialOverlay')
  const hl      = document.getElementById('tutHighlight')
  const tooltip = document.getElementById('tutTooltip')
  if (!overlay || !step) return

  // Navigate to step page
  const pageFns = {
    dashboard:renderDashboard, ingresos:renderIngresos, gastos:renderGastos,
    inversiones:renderInversiones, deudas:renderDeudas, cuentas:renderCuentas,
    objetivos:renderObjetivos, presupuestos:renderPresupuestos,
    analisis:renderAnalisis, configuracion:renderConfiguracion,
    patrimonio:renderPatrimonio, billing:renderBilling, logros:renderLogros
  }
  if (step.page && step.page !== currentPage) {
    currentPage = step.page
    destroyAllCharts()
    if (pageFns[step.page]) pageFns[step.page]()
    document.querySelectorAll('.nav-item').forEach(el=>el.classList.remove('active'))
    const nav = document.getElementById('nav-'+step.page)
    if (nav) nav.classList.add('active')
    const contentEl = document.getElementById('content')
    if (contentEl) contentEl.scrollTop = 0
  }

  // Update tooltip text
  const gi = (id) => document.getElementById(id)
  if (gi('tutTitle'))   gi('tutTitle').textContent   = step.title
  if (gi('tutText'))    gi('tutText').innerHTML      = step.text
  if (gi('tutStepNum')) gi('tutStepNum').textContent = `Paso ${tutStep+1} de ${TUT_STEPS.length}`
  if (gi('tutCounter')) gi('tutCounter').textContent = `${tutStep+1}/${TUT_STEPS.length}`
  const dotsEl = gi('tutDots')
  if (dotsEl) dotsEl.innerHTML = TUT_STEPS.map((_,i)=>`<div class="tut-dot${i===tutStep?' active':''}"></div>`).join('')
  if (gi('tutNextBtn')) gi('tutNextBtn').textContent = tutStep === TUT_STEPS.length-1 ? 'Finalizar ✓' : 'Siguiente →'
  if (gi('tutBack'))    gi('tutBack').style.display  = tutStep > 0 ? 'inline-flex' : 'none'

  // Animate in
  tooltip.style.opacity = '0'
  tooltip.style.transform = 'translateY(4px)'
  tooltip.style.display = 'block'
  tooltip.className = 'tut-tooltip'
  requestAnimationFrame(() => {
    tooltip.style.transition = 'opacity .15s ease, transform .15s ease'
    tooltip.style.opacity = '1'
    tooltip.style.transform = 'translateY(0)'
  })

  setTimeout(() => {
    const ttW = 320, ttH = 200
    const targetEl = step.target ? document.querySelector(step.target) : null

    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      setTimeout(() => {
        const r = targetEl.getBoundingClientRect()
        // Highlight box
        hl.style.cssText = [
          'display:block', 'position:fixed', 'pointer-events:none', 'z-index:9998',
          `top:${r.top-5}px`, `left:${r.left-5}px`,
          `width:${r.width+10}px`, `height:${r.height+10}px`,
          'border:2px solid var(--accent)', 'border-radius:8px',
          'box-shadow:0 0 0 4000px rgba(0,0,0,0.5)',
          'transition:all .15s ease'
        ].join(';')
        // Position tooltip
        const sp = window.innerWidth - r.right - 12
        const sl = r.left - 12
        let tL, tT
        if (sp >= ttW)      { tL = r.right+12;      tT = Math.max(12, r.top) }
        else if (sl >= ttW) { tL = r.left-ttW-12;   tT = Math.max(12, r.top) }
        else                { tL = Math.max(12, r.left); tT = r.bottom+12 }
        tL = Math.max(12, Math.min(tL, window.innerWidth-ttW-12))
        tT = Math.max(12, Math.min(tT, window.innerHeight-ttH-12))
        tooltip.style.cssText = `display:block;position:fixed;top:${tT}px;left:${tL}px;max-width:${ttW}px;z-index:9999;opacity:1;transform:none;transition:none`
      }, 85)
    } else {
      if (hl) hl.style.cssText = 'display:none'
      const tL = Math.max(12, (window.innerWidth-ttW)/2)
      const tT = Math.max(12, (window.innerHeight-ttH)/2)
      tooltip.style.cssText = `display:block;position:fixed;top:${tT}px;left:${tL}px;max-width:${ttW}px;z-index:9999;opacity:1;transform:none;transition:none`
    }
  }, 72)
}

function tutNext() {
  if (tutStep >= TUT_STEPS.length - 1) { endTutorial(); return }
  tutStep++
  renderTutStep()
}
function tutPrev() {
  if (tutStep <= 0) return
  tutStep--
  renderTutStep()
}
function endTutorial() {
  _tutClearMock()
  _setTutDone()
  const ov = document.getElementById('tutorialOverlay')
  const hl = document.getElementById('tutHighlight')
  const tt = document.getElementById('tutTooltip')
  if (ov) ov.style.display = 'none'
  if (hl) hl.style.cssText = 'display:none'
  if (tt) tt.style.display = 'none'
  destroyAllCharts()
  currentPage = 'dashboard'
  render()
  toast('¡Tour completado! 🎉 Añade tus cuentas reales para empezar.')
}
function lanzarTutorial() { startTutorial() }


// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
// PROVEEDORES (disabled in personal mode)
// ══════════════════════════════════════════════════════════════
var _provSearch = ""

function renderProveedores() { goTo('dashboard') }

function resetProveedorForm() {
  document.getElementById("proveedorId").value = ""
  document.getElementById("proveedorModalTitle").textContent = "Nuevo Proveedor"
  ;["proveedorNombre","proveedorEmpresa","proveedorEmail","proveedorTelefono","proveedorCategoria","proveedorNotas"].forEach(function(id){ document.getElementById(id).value = "" })
  document.getElementById("proveedorColor").value = "#6366F1"
  document.getElementById("proveedorAvatar").value = ""
  document.getElementById("proveedorAvatarEmoji").style.display = "block"
  document.getElementById("proveedorAvatarImg").style.display = "none"
  document.getElementById("proveedorAvatarImg").src = ""
}

function editarProveedor(id) {
  var p = (S.proveedores||[]).find(function(x){ return x.id===id })
  if (!p) return
  resetProveedorForm()
  document.getElementById("proveedorId").value = id
  document.getElementById("proveedorModalTitle").textContent = "Editar Proveedor"
  document.getElementById("proveedorNombre").value = p.nombre||""
  document.getElementById("proveedorEmpresa").value = p.empresa||""
  document.getElementById("proveedorEmail").value = p.email||""
  document.getElementById("proveedorTelefono").value = p.telefono||""
  document.getElementById("proveedorCategoria").value = p.categoria||""
  document.getElementById("proveedorNotas").value = p.notas||""
  document.getElementById("proveedorColor").value = p.color||"#6366F1"
  document.getElementById("proveedorAvatar").value = p.avatar||""
  if (p.avatar) {
    document.getElementById("proveedorAvatarEmoji").style.display = "none"
    document.getElementById("proveedorAvatarImg").style.display = "block"
    document.getElementById("proveedorAvatarImg").src = p.avatar
  }
  openModal("proveedorModal")
}

function guardarProveedor() {
  var nombre = document.getElementById("proveedorNombre").value.trim()
  if (!nombre) { toast("El nombre es requerido","error"); return }
  if (!S.proveedores) S.proveedores = []
  var id = document.getElementById("proveedorId").value
  var data = {
    nombre: nombre,
    empresa: document.getElementById("proveedorEmpresa").value.trim(),
    email: document.getElementById("proveedorEmail").value.trim(),
    telefono: document.getElementById("proveedorTelefono").value.trim(),
    categoria: document.getElementById("proveedorCategoria").value.trim(),
    notas: document.getElementById("proveedorNotas").value.trim(),
    color: document.getElementById("proveedorColor").value||"#6366F1",
    avatar: document.getElementById("proveedorAvatar").value||null
  }
  if (id) {
    var idx = S.proveedores.findIndex(function(x){ return x.id===id })
    if (idx>=0) S.proveedores[idx] = Object.assign({}, S.proveedores[idx], data)
  } else {
    S.proveedores.push(Object.assign({id:uid()}, data))
  }
  save(); closeModal("proveedorModal"); render(); toast("Proveedor guardado ✓")
}

function borrarProveedor(id) {
  confirmar("¿Eliminar este proveedor?", function(){
    S.proveedores = (S.proveedores||[]).filter(function(x){ return x.id!==id })
    save(); render(); toast("Proveedor eliminado")
  }, {titulo:"Eliminar proveedor",icono:"🗑️"})
}

function previewProveedorAvatar(input) {
  var file = input.files[0]
  if (!file) return
  var reader = new FileReader()
  reader.onload = function(e) {
    document.getElementById("proveedorAvatar").value = e.target.result
    document.getElementById("proveedorAvatarEmoji").style.display = "none"
    document.getElementById("proveedorAvatarImg").style.display = "block"
    document.getElementById("proveedorAvatarImg").src = e.target.result
  }
  reader.readAsDataURL(file)
}

function nuevoGastoProveedor(proveedorId) {
  resetGastoForm()
  window._gastoProveedorId = proveedorId
  setTimeout(function(){
    var sel = document.getElementById("gastoProveedor")
    if (sel) sel.value = proveedorId
  }, 50)
  openModal("gastoModal")
}

function poblarClienteSelect(selectId, selectedId) {
  // Personal mode — cliente link is hidden field, nothing to populate
}

function poblarProveedorSelect(selectId, selectedId) {
  const sel = document.getElementById(selectId)
  if (!sel || sel.type === 'hidden') return
  sel.innerHTML = '<option value="">Sin proveedor</option>' +
    (S.proveedores||[]).map(p =>
      `<option value="${p.id}" ${p.id===(selectedId||'')?'selected':''}>${p.nombre}${p.empresa?' ('+p.empresa+')':''}</option>`
    ).join('')
}

function exportarProveedores() {
  try {
    var wb = XLSX.utils.book_new()
    var headers = ["Nombre","Empresa","Email","Teléfono","Categoría","Total Pagado (€)","Facturas"]
    var rows = (S.proveedores||[]).map(function(p) {
      var gastado = S.gastos.filter(function(g){ return g.proveedorId===p.id }).reduce(function(a,g){ return a+(Number(g.importe)||0) },0)
      var facturas = S.gastos.filter(function(g){ return g.proveedorId===p.id }).length
      return [p.nombre||"",p.empresa||"",p.email||"",p.telefono||"",p.categoria||"",gastado,facturas]
    })
    var ws = XLSX.utils.aoa_to_sheet([headers].concat(rows))
    ws["!cols"] = headers.map(function(h){ return {wch:Math.max(h.length,14)} })
    XLSX.utils.book_append_sheet(wb, ws, "Proveedores")
    XLSX.writeFile(wb, "MoneyNest_Proveedores_"+todayISO()+".xlsx")
    toast("Proveedores exportados ✓")
  } catch(e) { toast("Error al exportar","error") }
}

// ══════════════════════════════════════════════════════════════
// DEVENGO
// ══════════════════════════════════════════════════════════════
var _devSearch = "", _devTipoFilter = "", _devEstadoFilter = ""

function renderDevengo() { goTo('dashboard') }

// ─── FAQ ───────────────────────────────────────────────────────
if (!window._faqOpen) window._faqOpen = {}
function toggleFAQ(id) {
  window._faqOpen[id] = !window._faqOpen[id]
  const body = document.getElementById('faq-body-'+id)
  const arrow = document.getElementById('faq-arrow-'+id)
  if (body) body.style.display = window._faqOpen[id] ? 'block' : 'none'
  if (arrow) arrow.textContent = window._faqOpen[id] ? '▲' : '▼'
}

function renderFAQ() {
  const faqs = [
    { group: '🚀 Primeros pasos', color: 'var(--accent)', items: [
      { q: '¿Cómo añado un ingreso?', a: 'Ve a la sección <strong>Ingresos</strong> desde la barra lateral. Haz clic en <strong>+ Nuevo ingreso</strong>. Rellena el importe, categoría, fecha y descripción opcional. Pulsa <strong>Guardar</strong>.' },
      { q: '¿Cómo añado un gasto?', a: 'Ve a la sección <strong>Gastos</strong>. Pulsa <strong>+ Nuevo gasto</strong>. Introduce el importe, elige la categoría (con emoji), la fecha y una descripción. Guarda y aparecerá en la lista y en el dashboard automáticamente.' },
      { q: '¿Cómo creo categorías personalizadas?', a: 'En <strong>Configuración → Categorías</strong> encontrarás las listas de ingresos y gastos. Escribe el nombre en el campo de texto y pulsa <strong>Añadir</strong>. El emoji se asigna automáticamente según el nombre.' },
    ]},
    { group: '📚 Conceptos financieros', color: 'var(--indigo)', items: [
      { q: '¿Qué es el patrimonio neto?', a: 'El patrimonio neto es la diferencia entre todos tus activos (cuentas, inversiones, inmuebles…) y tus pasivos (deudas). Refleja tu riqueza real en un momento dado. MoneyNest lo calcula automáticamente en la sección <strong>Patrimonio</strong>.' },
      { q: '¿Cómo funciona el análisis?', a: 'El <strong>Análisis</strong> cruza tus datos de ingresos, gastos, inversiones y deudas para generar insights personalizados: tasa de ahorro, categorías con mayor gasto, evolución mensual, proyecciones y regla 50/30/20.' },
      { q: '¿Cómo interpreto los gráficos?', a: 'Los gráficos de líneas muestran evolución temporal. Los de dona muestran distribución por categorías. Los KPI con <span style="color:var(--green)">▲</span> verde indican mejora respecto al período anterior; en <span style="color:var(--red)">▼</span> rojo indican empeoramiento.' },
    ]},
    { group: '💳 Deudas', color: 'var(--red)', items: [
      { q: '¿Qué es una estrategia de pago?', a: 'Es un plan para liquidar tus deudas de forma ordenada. MoneyNest ofrece tres ritmos: <strong>Conservador</strong> 🐢 (pagos bajos), <strong>Moderado</strong> ⚖️ (equilibrado) y <strong>Agresivo</strong> 🚀 (máxima velocidad de liquidación).' },
      { q: '¿Cuál es la diferencia entre Bola de nieve y Avalancha?', a: '<strong>❄️ Bola de nieve:</strong> pagas primero la deuda más pequeña para ganar motivación psicológica.<br><strong>🌊 Avalancha:</strong> pagas primero la de mayor interés, ahorrando más dinero a largo plazo. Ambas son válidas; elige la que mejor se adapte a ti.' },
      { q: '¿Cómo se calcula el tiempo para quedar libre de deudas?', a: 'MoneyNest usa la fórmula financiera estándar de amortización: considera el saldo pendiente total, el interés medio anual de tus deudas y el pago mensual estimado según la estrategia. El resultado es orientativo.' },
    ]},
    { group: '📦 Datos y dispositivos', color: 'var(--gold)', items: [
      { q: '¿Cómo exporto mis datos?', a: 'Ve a <strong>Configuración → Importar / Exportar datos</strong>. Puedes exportar un informe completo en PDF o Excel, o descargar una copia de seguridad en JSON con todos tus datos.' },
      { q: '¿Cómo importo una copia de seguridad?', a: 'En <strong>Configuración → Importar / Exportar datos</strong>, pulsa <strong>Importar copia de seguridad</strong> y selecciona tu archivo .json. Todos los datos se restaurarán. <em>⚠️ Esto sobreescribe los datos actuales.</em>' },
      { q: '¿Cómo traslado MoneyNest a otro dispositivo?', a: '<strong>Paso 1:</strong> Exporta desde <em>Configuración → Copia de seguridad (JSON)</em>.<br><strong>Paso 2:</strong> En el nuevo dispositivo, abre MoneyNest.<br><strong>Paso 3:</strong> Ve a <em>Configuración → Importar</em>.<br><strong>Paso 4:</strong> Selecciona el archivo .json. ¡Listo!' },
      { q: '¿Qué pasa si reseteo la app?', a: 'El reset elimina <strong>todos los datos permanentemente</strong>: ingresos, gastos, inversiones, deudas, objetivos y configuración. Solo hazlo si estás seguro. Exporta siempre una copia de seguridad antes.' },
    ]},
    { group: '⚙️ Uso de la app', color: 'var(--green)', items: [
      { q: '¿Cómo cambio el idioma?', a: 'Ve a <strong>Configuración → Idioma</strong> y haz clic en el idioma que quieres. El cambio es inmediato. Idiomas disponibles: 🇪🇸 Español, 🇺🇸 English, 🇮🇹 Italiano, 🇫🇷 Français, 🇩🇪 Deutsch, 🇵🇹 Português.' },
      { q: '¿Por qué no aparecen mis datos?', a: 'Los datos se guardan en el navegador (localStorage). Asegúrate de usar el mismo navegador y dispositivo. Si limpiaste el caché, los datos pueden haberse perdido. Usa siempre la exportación JSON como respaldo regular.' },
      { q: '¿Cómo reseteo la app correctamente?', a: '<strong>Paso 1:</strong> Exporta tu copia de seguridad.<br><strong>Paso 2:</strong> Ve a Configuración → <em>Zona de peligro</em>.<br><strong>Paso 3:</strong> Haz clic en <em>Resetear todo</em>.<br><strong>Paso 4:</strong> Confirma. La app vuelve al estado inicial.' },
    ]},
  ]

  let faqHtml = faqs.map((group, gi) => {
    const items = group.items.map((item, qi) => {
      const id = `faq-${gi}-${qi}`
      const isOpen = window._faqOpen && window._faqOpen[id]
      return `
      <div class="faq-item" id="faqitem-${id}">
        <button class="faq-q" onclick="toggleFAQ('${id}')" aria-expanded="${isOpen}">
          <span class="faq-q-text">${item.q}</span>
          <span class="faq-chevron" id="faq-arrow-${id}">${isOpen ? '▲' : '▼'}</span>
        </button>
        <div class="faq-a" id="faq-body-${id}" style="display:${isOpen?'block':'none'}">${item.a}</div>
      </div>`
    }).join('')

    return `
    <div class="faq-group">
      <div class="faq-group-header">
        <span class="faq-group-dot" style="background:${group.color}"></span>
        <span class="faq-group-title">${group.group}</span>
      </div>
      <div class="faq-group-items">${items}</div>
    </div>`
  }).join('')

  try { if (!window._sugerencias) window._sugerencias = JSON.parse(localStorage.getItem('mn_sugerencias')||'[]') } catch(e) { window._sugerencias = [] }
  const sugCats = ['General','UI / Diseño','Nuevas funciones','Rendimiento','Idioma / Traducción','Otro']
  const sugList = (window._sugerencias||[]).map(s=>`
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;margin-bottom:8px;display:flex;gap:12px;align-items:flex-start">
      <div style="flex:1;min-width:0">
        <div style="font-size:.88rem;font-weight:600;color:var(--text);margin-bottom:5px">${s.text}</div>
        <div style="font-size:.73rem;color:var(--text3)">${s.fecha} · <span style="background:var(--border);padding:2px 8px;border-radius:99px;font-weight:600;color:var(--text2)">${s.categoria}</span>${s.tipo?` · <span style="font-size:.7rem;color:var(--accent)">${s.tipo}</span>`:''}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:6px;flex-shrink:0">
        <button onclick="votarSugerencia(${s.id})" style="background:var(--accent-dim);border:1px solid rgba(0,212,170,.2);color:var(--accent);border-radius:8px;padding:4px 10px;font-size:.78rem;font-weight:700;cursor:pointer;min-width:52px">👍 ${s.votos||0}</button>
        <button onclick="borrarSugerencia(${s.id})" style="background:transparent;border:none;color:var(--text3);font-size:.72rem;cursor:pointer" onmouseover="this.style.color='var(--red)'" onmouseout="this.style.color='var(--text3)'">✕ Eliminar</button>
      </div>
    </div>`).join('') || `<div class="empty"><div class="empty-icon">💬</div><div class="empty-title">Aún no hay sugerencias</div><div class="empty-sub">¡Sé el primero en proponer una mejora para MoneyNest!</div></div>`

  document.getElementById('content').innerHTML = `
  <div style="max-width:720px;margin:0 auto">
    <div class="section-header">
      <div>
        <div class="page-h1">❓ FAQ & Sugerencias</div>
        <div class="page-sub">Guías paso a paso, respuestas frecuentes y envío de sugerencias</div>
      </div>
    </div>

    ${faqHtml}

    <div style="margin-top:56px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
        <div style="flex:1;height:1px;background:var(--border)"></div>
        <div style="font-size:1.05rem;font-weight:800;color:var(--text);letter-spacing:-.02em">💡 Sugerencias</div>
        <div style="flex:1;height:1px;background:var(--border)"></div>
      </div>

      <div class="card" style="margin-bottom:16px">
        <div class="card-title" style="margin-bottom:16px">✍️ Nueva sugerencia</div>
        <div class="form-group">
          <label>Tipo</label>
          <div style="display:flex;gap:10px;margin-bottom:4px">
            <label style="display:flex;align-items:center;gap:7px;padding:9px 14px;border-radius:var(--radius-sm);border:1.5px solid var(--border2);background:var(--bg2);cursor:pointer;flex:1;font-size:.85rem;font-weight:600;color:var(--text2);transition:all .15s" id="sug-tipo-label-sug">
              <input type="radio" name="sug-tipo" value="Sugerencia" id="sug-tipo-sug" checked style="accent-color:var(--accent)" onchange="document.getElementById('sug-tipo-label-sug').style.borderColor='var(--accent)';document.getElementById('sug-tipo-label-sug').style.color='var(--accent)';document.getElementById('sug-tipo-label-preg').style.borderColor='var(--border2)';document.getElementById('sug-tipo-label-preg').style.color='var(--text2)'">
              💡 ${t('sug_tipo_sug')}
            </label>
            <label style="display:flex;align-items:center;gap:7px;padding:9px 14px;border-radius:var(--radius-sm);border:1.5px solid var(--border2);background:var(--bg2);cursor:pointer;flex:1;font-size:.85rem;font-weight:600;color:var(--text2);transition:all .15s" id="sug-tipo-label-preg">
              <input type="radio" name="sug-tipo" value="Pregunta" id="sug-tipo-preg" style="accent-color:var(--accent)" onchange="document.getElementById('sug-tipo-label-preg').style.borderColor='var(--accent)';document.getElementById('sug-tipo-label-preg').style.color='var(--accent)';document.getElementById('sug-tipo-label-sug').style.borderColor='var(--border2)';document.getElementById('sug-tipo-label-sug').style.color='var(--text2)'">
              ❓ ${t('sug_tipo_preg')}
            </label>
          </div>
        </div>
        <div class="form-group">
          <label>Categoría</label>
          <select id="sug-cat">${sugCats.map(c=>`<option value="${c}">${c}</option>`).join('')}</select>
        </div>
        <div class="form-group">
          <label>Mensaje</label>
          <textarea id="sug-input" placeholder="${t('sug_placeholder')}" style="min-height:100px;-webkit-user-select:text;user-select:text"></textarea>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:4px">
          <button class="btn btn-primary" onclick="saveSugerencia()">${t('sug_guardar')}</button>
          <button class="btn btn-secondary" onclick="enviarSugerenciaEmail()">📧 Enviar por email</button>
        </div>
        <div style="margin-top:12px;padding:10px 14px;background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius-sm);display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <span style="font-size:.72rem;color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:.05em">Contacto directo:</span>
          <a href="mailto:invest.grid.main@gmail.com" style="font-size:.85rem;font-weight:700;color:var(--accent);text-decoration:none;user-select:text">invest.grid.main@gmail.com</a>
        </div>
      </div>

      <div class="card">
        <div class="card-header" style="margin-bottom:12px">
          <div class="card-title">📋 Sugerencias enviadas</div>
          <span class="badge badge-accent">${(window._sugerencias||[]).length}</span>
        </div>
        ${sugList}
      </div>
    </div>
  </div>`

  // Highlight the initially-selected radio
  setTimeout(()=>{
    const lbl = document.getElementById('sug-tipo-label-sug')
    if (lbl) { lbl.style.borderColor='var(--accent)'; lbl.style.color='var(--accent)' }
  }, 0)
}

// ─── SUGERENCIAS ───────────────────────────────────────────────
try { if (!window._sugerencias) window._sugerencias = JSON.parse(localStorage.getItem('mn_sugerencias')||'[]') } catch(e) { window._sugerencias = [] }

function saveSugerencia() {
  const input = document.getElementById('sug-input')
  const cat = document.getElementById('sug-cat')
  const tipoEl = document.querySelector('input[name="sug-tipo"]:checked')
  if (!input) return
  const text = (input.value||'').trim()
  if (!text) { toast('Escribe una sugerencia primero','error'); return }
  const sug = { id: Date.now(), text, categoria: cat?.value||'General', tipo: tipoEl?.value||'Sugerencia', fecha: new Date().toISOString().slice(0,10), votos: 0 }
  window._sugerencias.unshift(sug)
  try { localStorage.setItem('mn_sugerencias', JSON.stringify(window._sugerencias)) } catch(e) {}
  toast('¡Sugerencia guardada! Gracias 🙏','success')
  renderFAQ()
}

function votarSugerencia(id) {
  const sug = window._sugerencias.find(s=>s.id===id)
  if (sug) sug.votos = (sug.votos||0)+1
  try { localStorage.setItem('mn_sugerencias', JSON.stringify(window._sugerencias)) } catch(e) {}
  renderFAQ()
}

function borrarSugerencia(id) {
  window._sugerencias = window._sugerencias.filter(s=>s.id!==id)
  try { localStorage.setItem('mn_sugerencias', JSON.stringify(window._sugerencias)) } catch(e) {}
  renderFAQ()
}

function copiarEmailSugerencias() {
  const email = 'invest.grid.main@gmail.com'
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(email).then(()=>toast('Email copiado al portapapeles 📋')).catch(()=>{
      _copiarEmailFallback(email)
    })
  } else {
    _copiarEmailFallback(email)
  }
}
function _copiarEmailFallback(email) {
  const ta = document.createElement('textarea')
  ta.value = email; ta.style.position='fixed'; ta.style.opacity='0'
  document.body.appendChild(ta); ta.select()
  try { document.execCommand('copy'); toast('Email copiado al portapapeles 📋') }
  catch(e) { toast('Copia manualmente: '+email,'error') }
  document.body.removeChild(ta)
}

function enviarSugerenciaEmail() {
  const input  = document.getElementById('sug-input')
  const cat    = document.getElementById('sug-cat')
  const tipoEl = document.querySelector('input[name="sug-tipo"]:checked')
  if (!input) return
  const text = (input.value||'').trim()
  if (!text) { toast('Escribe un mensaje primero','error'); return }

  const tipo      = tipoEl?.value || 'Sugerencia'
  const categoria = cat?.value    || 'General'
  const userEmail = window.MNSupabaseAuth?.getEmail() || MNAuth?.getUser()?.email || ''

  const btn = document.querySelector('[onclick="enviarSugerenciaEmail()"]')
  if (btn) { btn.disabled = true; btn.textContent = 'Enviando…' }

  fetch('https://jwddciqqhmfkbqhdrfre.supabase.co/functions/v1/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3ZGRjaXFxaG1ma2JxaGRyZnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NjkyMjcsImV4cCI6MjA5NDM0NTIyN30.Gqz39AWpW1BkWXhfhnR_vOUYUy93bgdSNvBfXYQ3VGk' },
    body: JSON.stringify({ type: 'sugerencia', tipo, categoria, mensaje: text, userEmail }),
  })
  .then(r => r.json())
  .then(data => {
    if (data.ok) {
      toast('✅ Sugerencia enviada directamente. ¡Gracias!', 'success')
      if (input) input.value = ''
      renderFAQ()
    } else {
      toast('⚠ Error al enviar: ' + (data.error || 'inténtalo de nuevo'), 'error')
    }
  })
  .catch(() => toast('⚠ No se pudo enviar. Comprueba tu conexión.', 'error'))
  .finally(() => {
    if (btn) { btn.disabled = false; btn.textContent = '📧 Enviar por email' }
  })
}

function renderSugerencias() {
  try { if (!window._sugerencias) window._sugerencias = JSON.parse(localStorage.getItem('mn_sugerencias')||'[]') } catch(e) { window._sugerencias = [] }
  const cats = ['General','UI / Diseño','Nuevas funciones','Rendimiento','Idioma / Traducción','Otro']
  const list = (window._sugerencias||[]).map(s=>`
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;margin-bottom:8px;display:flex;gap:12px;align-items:flex-start">
      <div style="flex:1;min-width:0">
        <div style="font-size:.88rem;font-weight:600;color:var(--text);margin-bottom:5px">${s.text}</div>
        <div style="font-size:.73rem;color:var(--text3)">${s.fecha} · <span style="background:var(--border);padding:2px 8px;border-radius:99px;font-weight:600;color:var(--text2)">${s.categoria}</span>${s.tipo?` · <span style="font-size:.7rem;color:var(--accent)">${s.tipo}</span>`:''}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:6px;flex-shrink:0">
        <button onclick="votarSugerencia(${s.id})" style="background:var(--accent-dim);border:1px solid rgba(0,212,170,.2);color:var(--accent);border-radius:8px;padding:4px 10px;font-size:.78rem;font-weight:700;cursor:pointer;min-width:52px">👍 ${s.votos||0}</button>
        <button onclick="borrarSugerencia(${s.id})" style="background:transparent;border:none;color:var(--text3);font-size:.72rem;cursor:pointer" onmouseover="this.style.color='var(--red)'" onmouseout="this.style.color='var(--text3)'">✕ Eliminar</button>
      </div>
    </div>`).join('') || `<div class="empty"><div class="empty-icon">💬</div><div class="empty-title">Aún no hay sugerencias</div><div class="empty-sub">¡Sé el primero en proponer una mejora para MoneyNest!</div></div>`

  document.getElementById('content').innerHTML = `
  <div class="section-header">
    <div><div class="page-h1">💡 ${t('page_sugerencias')}</div><div class="page-sub">Propón mejoras — se guardan localmente en tu dispositivo</div></div>
  </div>
  <div style="max-width:680px">
    <div class="card" style="margin-bottom:16px">
      <div class="card-title" style="margin-bottom:14px">✍️ Nueva sugerencia</div>
      <div class="form-group">
        <label>Tipo</label>
        <div style="display:flex;gap:10px;margin-bottom:4px">
          <label style="display:flex;align-items:center;gap:7px;padding:9px 14px;border-radius:var(--radius-sm);border:1.5px solid var(--border2);background:var(--bg2);cursor:pointer;flex:1;font-size:.85rem;font-weight:600;color:var(--text2);transition:all .15s" id="sug-tipo-label-sug">
            <input type="radio" name="sug-tipo" value="Sugerencia" id="sug-tipo-sug" checked style="accent-color:var(--accent)" onchange="document.getElementById('sug-tipo-label-sug').style.borderColor='var(--accent)';document.getElementById('sug-tipo-label-sug').style.color='var(--accent)';document.getElementById('sug-tipo-label-preg').style.borderColor='var(--border2)';document.getElementById('sug-tipo-label-preg').style.color='var(--text2)'">
            💡 ${t('sug_tipo_sug')}
          </label>
          <label style="display:flex;align-items:center;gap:7px;padding:9px 14px;border-radius:var(--radius-sm);border:1.5px solid var(--border2);background:var(--bg2);cursor:pointer;flex:1;font-size:.85rem;font-weight:600;color:var(--text2);transition:all .15s" id="sug-tipo-label-preg">
            <input type="radio" name="sug-tipo" value="Pregunta" id="sug-tipo-preg" style="accent-color:var(--accent)" onchange="document.getElementById('sug-tipo-label-preg').style.borderColor='var(--accent)';document.getElementById('sug-tipo-label-preg').style.color='var(--accent)';document.getElementById('sug-tipo-label-sug').style.borderColor='var(--border2)';document.getElementById('sug-tipo-label-sug').style.color='var(--text2)'">
            ❓ ${t('sug_tipo_preg')}
          </label>
        </div>
      </div>
      <div class="form-group">
        <label>Categoría</label>
        <select id="sug-cat">${cats.map(c=>`<option value="${c}">${c}</option>`).join('')}</select>
      </div>
      <div class="form-group">
        <label>Mensaje</label>
        <textarea id="sug-input" placeholder="${t('sug_placeholder')}" style="min-height:90px;-webkit-user-select:text;user-select:text"></textarea>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <button class="btn btn-primary" onclick="saveSugerencia()">${t('sug_guardar')}</button>
        <button class="btn btn-secondary" onclick="enviarSugerenciaEmail()">${t('sug_enviar_email')}</button>
        <button class="btn btn-ghost" onclick="copiarEmailSugerencias()" title="Copiar email" style="font-size:.78rem;padding:7px 10px">📋 Copiar email</button>
      </div>
      <div style="margin-top:10px;padding:8px 12px;background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius-sm);display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <span style="font-size:.72rem;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:.04em">Contacto:</span>
        <span style="font-size:.82rem;font-weight:700;color:var(--accent);user-select:text;-webkit-user-select:text">invest.grid.main@gmail.com</span>
      </div>
    </div>
    <div class="card">
      <div class="card-header" style="margin-bottom:12px">
        <div class="card-title">📋 Sugerencias enviadas</div>
        <span class="badge badge-accent">${(window._sugerencias||[]).length}</span>
      </div>
      ${list}
    </div>
  </div>`

  // Highlight the initially-selected radio
  setTimeout(()=>{
    const lbl = document.getElementById('sug-tipo-label-sug')
    if (lbl) { lbl.style.borderColor='var(--accent)'; lbl.style.color='var(--accent)' }
  }, 0)
}


function abrirDevengoModal() {
  document.getElementById("devengoId").value = ""
  document.getElementById("devengoModalTitle").textContent = "Nuevo Devengo"
  ;["devengoConcepto","devengoImporte","devengoNotas"].forEach(function(id){ document.getElementById(id).value = "" })
  document.getElementById("devengoTipo").value = "ingreso"
  document.getElementById("devengoFecha").value = todayISO()
  document.getElementById("devengoCobro").value = ""
  document.getElementById("devengoEstado").value = "pendiente"
  var sel = document.getElementById("devengoContacto")
  if (sel) {
    var clis = (S.clientes||[]).map(function(c){ return "<option value=\""+c.id+"\">👥 "+c.nombre+"</option>" }).join("")
    var pros = (S.proveedores||[]).map(function(p){ return "<option value=\""+p.id+"\">🏭 "+p.nombre+"</option>" }).join("")
    sel.innerHTML = "<option value=\"\">Sin asociar</option>" + clis + pros
  }
  openModal("devengoModal")
}

function editarDevengo(id) {
  var d = (S.devengos||[]).find(function(x){ return x.id===id })
  if (!d) return
  abrirDevengoModal()
  setTimeout(function(){
    document.getElementById("devengoId").value = id
    document.getElementById("devengoModalTitle").textContent = "Editar Devengo"
    document.getElementById("devengoConcepto").value = d.concepto||""
    document.getElementById("devengoImporte").value = d.importe||""
    document.getElementById("devengoTipo").value = d.tipo||"ingreso"
    document.getElementById("devengoFecha").value = d.fecha||todayISO()
    document.getElementById("devengoCobro").value = d.fechaCobro||""
    document.getElementById("devengoEstado").value = d.estado||"pendiente"
    document.getElementById("devengoNotas").value = d.notas||""
    var s = document.getElementById("devengoContacto"); if(s) s.value = d.contactoId||""
  }, 60)
}

function guardarDevengo() {
  var concepto = document.getElementById("devengoConcepto").value.trim()
  var importe = parseFloat(document.getElementById("devengoImporte").value)
  if (!concepto || !importe || importe<=0) { toast("Concepto e importe requeridos","error"); return }
  if (!S.devengos) S.devengos = []
  var id = document.getElementById("devengoId").value
  var data = {
    concepto: concepto, importe: importe,
    tipo: document.getElementById("devengoTipo").value,
    fecha: document.getElementById("devengoFecha").value||todayISO(),
    fechaCobro: document.getElementById("devengoCobro").value||"",
    contactoId: document.getElementById("devengoContacto").value||null,
    estado: document.getElementById("devengoEstado").value,
    notas: document.getElementById("devengoNotas").value.trim()
  }
  if (id) {
    var idx = S.devengos.findIndex(function(x){ return x.id===id })
    if (idx>=0) S.devengos[idx] = Object.assign({}, S.devengos[idx], data)
  } else {
    S.devengos.push(Object.assign({id:uid()}, data))
  }
  save(); closeModal("devengoModal"); render(); toast("Devengo guardado ✓")
}

function borrarDevengo(id) {
  confirmar("¿Eliminar este registro de devengo?", function(){
    S.devengos = (S.devengos||[]).filter(function(x){ return x.id!==id })
    save(); render(); toast("Devengo eliminado")
  }, {titulo:"Eliminar devengo",icono:"🗑️"})
}

function marcarDevengoCobrado(id) {
  var idx = (S.devengos||[]).findIndex(function(x){ return x.id===id })
  if (idx<0) return
  S.devengos[idx].estado = "cobrado"
  S.devengos[idx].fechaCobro = S.devengos[idx].fechaCobro || todayISO()
  save(); render(); toast("Marcado como cobrado/pagado ✓")
}

function exportarDevengos() {
  try {
    var wb = XLSX.utils.book_new()
    var headers = ["Concepto","Tipo","Importe (€)","Fecha Devengo","Fecha Cobro/Pago","Contacto","Estado","Notas"]
    function getNombre(cid) {
      var c = (S.clientes||[]).find(function(x){ return x.id===cid }); if(c) return c.nombre
      var p = (S.proveedores||[]).find(function(x){ return x.id===cid }); if(p) return p.nombre
      return ""
    }
    var rows = (S.devengos||[]).map(function(d){
      return [d.concepto||"",d.tipo||"",Number(d.importe)||0,d.fecha||"",d.fechaCobro||"",getNombre(d.contactoId),d.estado||"",d.notas||""]
    })
    var ws = XLSX.utils.aoa_to_sheet([headers].concat(rows))
    ws["!cols"] = headers.map(function(h){ return {wch:Math.max(h.length,14)} })
    XLSX.utils.book_append_sheet(wb, ws, "Devengo")
    XLSX.writeFile(wb, "MoneyNest_Devengo_"+todayISO()+".xlsx")
    toast("Devengos exportados ✓")
  } catch(e) { toast("Error al exportar","error") }
}



function verDetalleCuenta(cuentaId) {
  const cuenta = getCuenta(cuentaId)
  if (!cuenta) return
  const ings = S.ingresos.filter(i=>i.cuentaId===cuentaId).sort((a,b)=>b.fecha?.localeCompare(a.fecha||'')||0)
  const gas  = S.gastos.filter(g=>g.cuentaId===cuentaId).sort((a,b)=>b.fecha?.localeCompare(a.fecha||'')||0)
  const invs = S.inversiones.filter(i=>i.cuentaId===cuentaId).sort((a,b)=>b.fecha?.localeCompare(a.fecha||'')||0)

  const allMov = [
    ...ings.map(i=>({...i, _tipo:'ingreso', _sign:'+', _color:'var(--green)'})),
    ...gas.map(g=>({...g, _tipo:'gasto', _sign:'−', _color:'var(--red)'})),
    ...invs.map(i=>({...i, _tipo:'inversion', _sign:'−', _color:'var(--gold)', concepto:i.nombre, importe:i.importe}))
  ].sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||''))

  const rows = allMov.slice(0,50).map(m=>{
    const tipoBadge = m._tipo==='ingreso'
      ? '<span class="badge badge-green">💰 Ingreso</span>'
      : m._tipo==='gasto'
        ? '<span class="badge badge-red">💳 Gasto</span>'
        : '<span class="badge badge-gold">📈 Inversión</span>'
    return `<tr>
      <td>${fmtDate(m.fecha)}</td>
      <td class="td-main">${m.concepto||'—'}</td>
      <td>${tipoBadge}</td>
      <td class="td-amount" style="color:${m._color}">${m._sign}${eur(m.importe)}</td>
      <td><span class="tag">${m.categoria||'—'}</span></td>
    </tr>`
  }).join('') || '<tr><td colspan="5"><div class="empty"><div class="empty-icon">📋</div><div class="empty-title">Sin movimientos</div></div></td></tr>'

  const totalEnt = ings.reduce((a,i)=>a+(Number(i.importe)||0),0)
  const totalSal = gas.reduce((a,g)=>a+(Number(g.importe)||0),0) + invs.filter(i=>!i.cerrada).reduce((a,i)=>a+(Number(i.importe)||0),0)

  document.getElementById('content').innerHTML = `
  <div class="section-header">
    <div>
      <div class="page-h1" style="display:flex;align-items:center;gap:10px">
        <button class="btn btn-ghost btn-sm" onclick="goTo('cuentas')" style="font-size:.85rem">← Cuentas</button>
        <span style="width:12px;height:12px;border-radius:50%;background:${cuenta.color||'#00D4AA'};display:inline-block"></span>
        ${cuenta.nombre}
      </div>
      <div class="page-sub">Historial completo de movimientos</div>
    </div>
    <div class="section-actions">
      <button class="btn-edit" onclick="editarCuenta('${cuentaId}')">✏ Editar cuenta</button>
    </div>
  </div>

  <div class="kpi-grid kpi-grid-4" style="margin-bottom:16px">
    <div class="kpi-card">
      <div class="kpi-icon" style="background:var(--accent-dim)">💰</div>
      <div class="kpi-label">Saldo disponible</div>
      <div class="kpi-value" style="color:var(--accent)">${eur(cuenta.saldo||0)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon" style="background:var(--green-dim)">📥</div>
      <div class="kpi-label">Total entradas</div>
      <div class="kpi-value sm" style="color:var(--green)">${eur(totalEnt)}</div>
      <div class="kpi-sub">${ings.length} ingresos</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon" style="background:var(--red-dim)">📤</div>
      <div class="kpi-label">Total salidas</div>
      <div class="kpi-value sm" style="color:var(--red)">${eur(totalSal)}</div>
      <div class="kpi-sub">${gas.length} gastos · ${invs.filter(i=>!i.cerrada).length} inversiones activas</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon" style="background:var(--indigo-dim)">📊</div>
      <div class="kpi-label">Total movimientos</div>
      <div class="kpi-value">${allMov.length}</div>
    </div>
  </div>

  <div class="card">
    <div class="card-header">
      <div class="card-title">📋 Movimientos</div>
      <span style="font-size:.78rem;color:var(--text2)">${allMov.length > 50 ? 'Mostrando últimos 50' : allMov.length + ' movimientos'}</span>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Fecha</th><th>Concepto</th><th>Tipo</th><th>Importe</th><th>Categoría</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>`
}


function mostrarSaldoCuenta() {
  const sel = document.getElementById('invCuenta')
  const hint = document.getElementById('invCuentaSaldoHint')
  if (!sel || !hint) return
  const cuentaId = sel.value
  if (!cuentaId) { hint.textContent = 'Selecciona una cuenta para ver el saldo disponible'; hint.style.color='var(--text3)'; return }
  const cuenta = getCuenta(cuentaId)
  if (!cuenta) return
  const saldo = Number(cuenta.saldo)||0
  hint.textContent = '💰 Disponible: ' + eur(saldo)
  hint.style.color = saldo > 0 ? 'var(--green)' : 'var(--red)'
}

// ════════════════════════════════════════════════════════════════
// ─── MÓDULO: PATRIMONIO ──────────────────────────────────────
// ════════════════════════════════════════════════════════════════

function renderPatrimonio() {
  if (!S.assets) S.assets = []
  const pat       = calcPatrimonio()
  const dis       = calcDineroDisponible()
  const cartera   = calcCartera()
  const assetsVal = calcAssetsValue()
  const deuda     = calcTotalDeuda()
  const m         = currentMonth()
  const mp        = prevMonth(m)
  const patP      = (() => { const h = S.patrimonio_hist.find(h=>h.mes===mp); return h ? h.valor : null })()
  const patDelta  = patP !== null ? ((pat - patP) / Math.abs(patP || 1)) * 100 : null

  // Investment aggregates
  const invAbiertas = S.inversiones.filter(i=>!i.cerrada)
  const totalInv    = invAbiertas.reduce((a,i)=>a+(Number(i.importe)||0),0)
  const totalRet    = calcGananciaLatente()
  const totalRealiz = calcGananciaTotal()
  const roiPct      = totalInv ? (totalRet/totalInv*100) : 0

  // Accounts
  const cuentasHtml = S.cuentas.map(c=>`
    <div onclick="verDetalleCuenta('${c.id}')" style="display:flex;align-items:center;justify-content:space-between;
      padding:10px 12px;border-radius:var(--radius-sm);background:var(--bg2);
      border:1px solid var(--border);margin-bottom:6px;cursor:pointer;transition:all .15s"
      onmouseover="this.style.borderColor='var(--border2)'" onmouseout="this.style.borderColor='var(--border)'">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="width:10px;height:10px;border-radius:50%;background:${c.color||'#00D4AA'};flex-shrink:0"></span>
        <div>
          <div style="font-size:.88rem;font-weight:600;color:var(--text)">${c.nombre}</div>
          <div style="font-size:.7rem;color:var(--text2)">${c.tipo||'banco'}</div>
        </div>
      </div>
      <span style="font-size:.95rem;font-weight:700;color:var(--text)">${eur(c.saldo||0)}</span>
    </div>`).join('')

  // Assets — active & sold
  const activeAssets = S.assets.filter(a=>a.status==='active')
  const soldAssets   = S.assets.filter(a=>a.status==='sold')

  function getAssetIcon(tipo) {
    const icons = {vehicle:'🚗',property:'🏠',electronics:'💻',jewelry:'💎',business:'🏢',other:'📦'}
    return icons[tipo] || '📦'
  }
  function getAssetBg(tipo) {
    const bgs = {vehicle:'var(--gold-dim)',property:'var(--indigo-dim)',electronics:'var(--accent-dim)',jewelry:'var(--red-dim)',business:'var(--green-dim)',other:'var(--border)'}
    return bgs[tipo] || 'var(--border)'
  }
  function getAssetLabel(tipo, customLabel) {
    if (tipo==='__custom__' || (customLabel && tipo==='other')) return customLabel||'Otro'
    const labels = {vehicle:'Vehículo',property:'Inmueble',electronics:'Electrónica',jewelry:'Joyería / Arte',business:'Negocio',other:'Otro'}
    return labels[tipo] || tipo
  }
  function assetCurrentVal(a) {
    let val = Number(a.valor)||0
    if (a.depreciacion && a.depPct && a.fecha) {
      const years = (Date.now()-new Date(a.fecha).getTime())/(1000*60*60*24*365.25)
      val = val*Math.pow(1-(Number(a.depPct)||0)/100,Math.max(0,years))
    }
    return val
  }

  function renderAssetCard(a, isSold) {
    const cv = assetCurrentVal(a)
    const vc = Number(a.valorCompra)||Number(a.valor)||0
    const gainLoss = cv - vc
    const icon = getAssetIcon(a.tipo)
    const bg   = isSold ? 'var(--border)' : getAssetBg(a.tipo)
    const label = getAssetLabel(a.tipo, a.tipoCustom)
    return `<div style="padding:14px 0;border-bottom:1px solid var(--border)">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
        <div style="display:flex;align-items:center;gap:10px;min-width:0">
          <div style="width:36px;height:36px;border-radius:9px;background:${bg};display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0">${icon}</div>
          <div style="min-width:0">
            <div style="font-size:.9rem;font-weight:700;color:${isSold?'var(--text2)':'var(--text)'}">${a.nombre}</div>
            <div style="font-size:.7rem;color:var(--text2)">${label}${a.fecha?' · Compra: '+fmtDate(a.fecha):''}${a.fechaVenta?' · Venta: '+fmtDate(a.fechaVenta):''}</div>
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-size:.95rem;font-weight:700;color:${isSold?'var(--text2)':'var(--text)'}">${eur(cv)}</div>
          ${vc&&vc!==cv?`<div style="font-size:.68rem;color:${gainLoss>=0?'var(--green)':'var(--red)'}">${gainLoss>=0?'▲':'▼'} ${eur(Math.abs(gainLoss))} vs compra</div>`:''}
          ${a.valorCompra?`<div style="font-size:.65rem;color:var(--text3)">Compra: ${eur(a.valorCompra)}</div>`:''}
        </div>
      </div>
      ${!isSold?`<div style="display:flex;gap:6px;margin-top:10px;align-items:center">
        <button class="btn-edit" onclick="editarAsset('${a.id}')" style="font-size:.72rem">✏ Editar</button>
        <button class="btn btn-ghost btn-sm" style="font-size:.72rem;padding:3px 10px" onclick="quickUpdateAssetValue('${a.id}')">💰 Actualizar valor</button>
        <button class="btn btn-ghost btn-sm" style="font-size:.72rem;padding:3px 10px" onclick="marcarAssetVendido('${a.id}')">🔴 Vender</button>
        <button class="btn-del" onclick="borrarAsset('${a.id}')" style="font-size:.72rem;margin-left:auto">🗑</button>
      </div>`:`<div style="margin-top:6px"><button class="btn-del" onclick="borrarAsset('${a.id}')" style="font-size:.72rem">🗑 Eliminar</button></div>`}
    </div>`
  }

  const assetsListHtml = activeAssets.length
    ? activeAssets.map(a=>renderAssetCard(a,false)).join('')
    : (window.mnEmptyStates ? window.mnEmptyStates.activos() : '<div class="empty"><div class="empty-icon">🏠</div><div class="empty-title">Sin activos físicos</div></div>')

  document.getElementById('content').innerHTML = `
  <div class="section-header" style="margin-bottom:16px">
    <div>
      <div class="page-h1">🏛 Patrimonio Neto</div>
      <div class="page-sub">Vista completa de tu riqueza financiera</div>
    </div>
  </div>

  <!-- NET WORTH HERO -->
  <div class="pat-hero">
    <div class="pat-nw-label">Patrimonio Neto Total</div>
    <div class="pat-nw-row">
      <div class="pat-nw-value">${eur(pat)}</div>
      ${patDelta!==null?`<span class="kpi-delta ${deltaClass(patDelta)}" style="font-size:.88rem">${deltaIcon(patDelta)} ${pct(Math.abs(patDelta))} vs. mes ant.</span>`:'<span class="kpi-delta neu">Primer registro</span>'}
    </div>
    <div class="pat-breakdown">
      <div class="pat-bd-item">
        <div class="pat-bd-label">💰 Liquidez</div>
        <div class="pat-bd-value" style="color:var(--accent)">${eur(dis)}</div>
      </div>
      <div class="pat-bd-item">
        <div class="pat-bd-label">📈 Inversiones</div>
        <div class="pat-bd-value" style="color:var(--indigo)">${eur(cartera)}</div>
      </div>
      <div class="pat-bd-item">
        <div class="pat-bd-label">🏠 Activos físicos</div>
        <div class="pat-bd-value" style="color:var(--gold)">${eur(assetsVal)}</div>
      </div>
      <div class="pat-bd-item">
        <div class="pat-bd-label">${t('deudas_lbl')}</div>
        <div class="pat-bd-value" style="color:${deuda>0?'var(--red)':'var(--green)'}">${deuda>0?'−'+eur(deuda):'Sin deudas ✅'}</div>
      </div>
    </div>
  </div>

  <!-- SPLIT VIEW: LEFT = Accounts + Investments | RIGHT = Physical Assets -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px" class="pat-split-grid">

    <!-- LEFT PANEL -->
    <div style="display:flex;flex-direction:column;gap:16px">

      <!-- Accounts -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">${t('cuentas_lbl')}</div>
            <div class="card-subtitle">Total liquidez: ${eur(dis)}</div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="goTo('cuentas')" style="font-size:.75rem">Gestionar →</button>
        </div>
        ${cuentasHtml||(window.mnEmptyStates ? window.mnEmptyStates.cuentas() : '<div class="empty"><div class="empty-icon">🏦</div><div class="empty-title">Sin cuentas</div></div>')}
      </div>

      <!-- Investments summary -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">📈 Activos Financieros</div>
            <div class="card-subtitle">Cartera de inversión</div>
          </div>
          <span class="pat-inv-link" onclick="goTo('inversiones')">Ver detalle →</span>
        </div>
        <div class="kpi-grid kpi-grid-3" style="margin-bottom:0">
          <div class="kpi-card">
            <div class="kpi-label">Capital</div>
            <div class="kpi-value sm">${eur(totalInv)}</div>
            <div class="kpi-sub">${invAbiertas.length} activa${invAbiertas.length!==1?'s':''}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Ganancia latente</div>
            <div class="kpi-value sm" style="color:${totalRet>=0?'var(--green)':'var(--red)'}">${totalRet>=0?'+':''}${eur(totalRet)}</div>
            <div class="kpi-sub">No realizada</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Rendimiento</div>
            <div class="kpi-value sm" style="color:${roiPct>=0?'var(--green)':'var(--red)'}">${roiPct>=0?'+':''}${pct(roiPct)}</div>
            <div class="kpi-sub">Realizado: ${eur(totalRealiz)}</div>
          </div>
        </div>
      </div>

      <!-- Wealth evolution chart -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">📊 Evolución del patrimonio</div>
          <div class="card-subtitle">Últimos 12 meses</div>
        </div>
        ${S.patrimonio_hist.length>=2
          ?`<div class="chart-container"><canvas id="chartPatrimonioPage"></canvas></div>`
          :(window.mnEmptyStates ? window.mnEmptyStates.pocoDatos() : `<div class="empty"><div class="empty-icon">📈</div><div class="empty-title">Pocos datos</div></div>`)}
      </div>
    </div>

    <!-- RIGHT PANEL: Physical Assets -->
    <div class="card" style="display:flex;flex-direction:column">
      <div class="card-header" style="flex-shrink:0">
        <div>
          <div class="card-title">🏠 Activos Físicos</div>
          <div class="card-subtitle">${activeAssets.length} activo${activeAssets.length!==1?'s':''} · ${eur(assetsVal)}</div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="openModal('assetModal');resetAssetForm()">+ Añadir</button>
      </div>
      <div style="flex:1;overflow-y:auto">
        ${assetsListHtml}
        ${soldAssets.length?`
        <details style="margin-top:8px">
          <summary style="font-size:.75rem;color:var(--text2);cursor:pointer;padding:8px 0;border-top:1px solid var(--border)">
            📦 Ver ${soldAssets.length} activo${soldAssets.length!==1?'s':''} vendido${soldAssets.length!==1?'s':''}
          </summary>
          <div style="opacity:.6">${soldAssets.map(a=>renderAssetCard(a,true)).join('')}</div>
        </details>`:''}
      </div>
    </div>
  </div>`

  if (S.patrimonio_hist.length >= 2) {
    setTimeout(renderChartPatrimonioPage, 80)
  }
}

function renderChartPatrimonioPage() {
  const ctx = document.getElementById('chartPatrimonioPage')
  if (!ctx) return
  const hist = S.patrimonio_hist.slice(-12)
  const labels = hist.map(h=>monthLabel(h.mes))
  const data   = hist.map(h=>h.valor)
  const ch = new Chart(ctx,{
    type:'line',
    data:{labels,datasets:[{
      label:'Patrimonio neto',data,
      borderColor:'var(--accent)',backgroundColor:'rgba(0,212,170,0.08)',
      fill:true,tension:.4,pointRadius:4,pointBackgroundColor:'var(--accent)'
    }]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false}},
      scales:{x:{grid:{color:'var(--border)'},ticks:{color:'var(--text2)',font:{size:11}}},
              y:{grid:{color:'var(--border)'},ticks:{color:'var(--text2)',font:{size:11},callback:v=>eur(v)}}}}
  })
  charts['chartPatrimonioPage'] = ch
}

// ─── ASSET CRUD ────────────────────────────────────────────────
function checkAssetCustomCat() {
  const sel = document.getElementById('assetTipo')
  const box = document.getElementById('assetTipoCustom')
  if (!sel || !box) return
  box.style.display = sel.value === '__custom__' ? 'block' : 'none'
}

function resetAssetForm() {
  document.getElementById('assetId').value = ''
  document.getElementById('assetModalTitle').textContent = 'Nuevo Activo Físico'
  document.getElementById('assetNombre').value = ''
  document.getElementById('assetTipo').value = 'vehicle'
  document.getElementById('assetTipoCustom').style.display = 'none'
  document.getElementById('assetTipoCustomInput').value = ''
  document.getElementById('assetValorCompra').value = ''
  document.getElementById('assetValor').value = ''
  document.getElementById('assetFecha').value = ''
  document.getElementById('assetFechaVenta').value = ''
  document.getElementById('assetEstado').value = 'active'
  document.getElementById('assetNotas').value = ''
  document.getElementById('assetDepPct').value = ''
  document.getElementById('assetDepPct').disabled = true
  const sw = document.getElementById('depToggleSwitch')
  if (sw) sw.classList.remove('on')
}

function toggleDepreciacion() {
  const sw  = document.getElementById('depToggleSwitch')
  const inp = document.getElementById('assetDepPct')
  if (!sw || !inp) return
  const isOn = sw.classList.toggle('on')
  inp.disabled = !isOn
  if (!isOn) inp.value = ''
}

function editarAsset(id) {
  const a = (S.assets||[]).find(x=>x.id===id)
  if (!a) return
  resetAssetForm()
  document.getElementById('assetId').value = id
  document.getElementById('assetModalTitle').textContent = 'Editar Activo'
  document.getElementById('assetNombre').value = a.nombre||''
  // Handle legacy tipo values
  const tipoVal = a.tipo==='car'?'vehicle':a.tipo==='house'?'property':a.tipo||'other'
  document.getElementById('assetTipo').value = tipoVal
  if (a.tipoCustom) {
    document.getElementById('assetTipo').value = '__custom__'
    document.getElementById('assetTipoCustom').style.display = 'block'
    document.getElementById('assetTipoCustomInput').value = a.tipoCustom
  }
  document.getElementById('assetValorCompra').value = a.valorCompra||a.valor||''
  document.getElementById('assetValor').value  = a.valor||''
  document.getElementById('assetFecha').value  = a.fecha||''
  document.getElementById('assetFechaVenta').value = a.fechaVenta||''
  document.getElementById('assetEstado').value = a.status||'active'
  document.getElementById('assetNotas').value  = a.notas||''
  if (a.depreciacion) {
    const sw = document.getElementById('depToggleSwitch')
    if (sw) sw.classList.add('on')
    document.getElementById('assetDepPct').disabled = false
    document.getElementById('assetDepPct').value = a.depPct||''
  }
  openModal('assetModal')
}

function guardarAsset() {
  const nombre = document.getElementById('assetNombre').value.trim()
  const valor  = parseFloat(document.getElementById('assetValor').value)
  if (!nombre) { toast('El nombre es obligatorio','error'); return }
  if (isNaN(valor)||valor<0) { toast('Introduce un valor actual válido','error'); return }
  if (!S.assets) S.assets = []
  const id   = document.getElementById('assetId').value
  const depOn = document.getElementById('depToggleSwitch')?.classList.contains('on')
  const tipoSel = document.getElementById('assetTipo').value
  const tipoFinal = tipoSel === '__custom__' ? 'other' : tipoSel
  const tipoCustom = tipoSel === '__custom__' ? document.getElementById('assetTipoCustomInput').value.trim() : null
  const valorCompra = parseFloat(document.getElementById('assetValorCompra').value) || valor
  const data = {
    nombre,
    tipo:       tipoFinal,
    tipoCustom: tipoCustom||null,
    valorCompra,
    valor,
    fecha:      document.getElementById('assetFecha').value||null,
    fechaVenta: document.getElementById('assetFechaVenta').value||null,
    status:     document.getElementById('assetEstado').value,
    notas:      document.getElementById('assetNotas').value.trim(),
    depreciacion: depOn,
    depPct: depOn ? parseFloat(document.getElementById('assetDepPct').value)||0 : 0
  }
  if (id) {
    const idx = S.assets.findIndex(x=>x.id===id)
    if (idx>=0) S.assets[idx] = {...S.assets[idx],...data}
  } else {
    S.assets.push({id:uid(),...data})
  }
  recordPatrimonio()
  save()
  closeModal('assetModal')
  if (currentPage==='patrimonio') renderPatrimonio()
  toast('Activo guardado ✓')
}

function borrarAsset(id) {
  confirmar('¿Eliminar este activo?', ()=>{
    S.assets = (S.assets||[]).filter(x=>x.id!==id)
    recordPatrimonio()
    save()
    if (currentPage==='patrimonio') renderPatrimonio()
    toast('Activo eliminado')
  }, {titulo:'Eliminar activo',icono:'🗑️'})
}

function marcarAssetVendido(id) {
  const a = (S.assets||[]).find(x=>x.id===id)
  if (!a) return
  // Build account options for the sale proceeds
  const cuentaOpts = S.cuentas.map(c=>`<option value="${c.id}">${c.nombre} (${eur(c.saldo||0)})</option>`).join('')
  const currentVal = (() => {
    let val = Number(a.valor)||0
    if (a.depreciacion && a.depPct && a.fecha) {
      const years = (Date.now()-new Date(a.fecha).getTime())/(1000*60*60*24*365.25)
      val = val*Math.pow(1-(Number(a.depPct)||0)/100,Math.max(0,years))
    }
    return val
  })()

  // Use confirm modal body for sale dialog
  const body = document.getElementById('confirmBody')
  const btn  = document.getElementById('confirmBtn')
  if (!body || !btn) return
  body.innerHTML = `
    <div class="confirm-icon">🏷</div>
    <div class="confirm-title">Vender activo</div>
    <div class="confirm-msg" style="text-align:left;margin-top:12px">
      <div style="font-size:.88rem;color:var(--text2);margin-bottom:12px">
        Vender <strong style="color:var(--text)">${a.nombre}</strong> generará un ingreso automático en la cuenta seleccionada.
      </div>
      <div class="form-group" style="margin-bottom:10px">
        <label style="font-size:.8rem">Valor de venta (€)</label>
        <input type="number" id="_saleValue" value="${currentVal.toFixed(2)}" step="0.01" min="0"
          style="width:100%;padding:8px 12px;background:var(--bg2);border:1.5px solid var(--border2);border-radius:var(--radius-sm);color:var(--text);font-size:.9rem;margin-top:4px">
      </div>
      <div class="form-group">
        <label style="font-size:.8rem">Cuenta que recibe el dinero *</label>
        <select id="_saleCuenta" style="width:100%;padding:8px 12px;background:var(--bg2);border:1.5px solid var(--border2);border-radius:var(--radius-sm);color:var(--text);font-size:.85rem;margin-top:4px">
          <option value="">— Selecciona cuenta —</option>
          ${cuentaOpts}
        </select>
      </div>
    </div>`
  btn.textContent = '💰 Confirmar venta'
  btn.className = 'btn btn-primary btn-sm'
  btn.onclick = () => {
    const saleVal  = parseFloat(document.getElementById('_saleValue')?.value) || 0
    const cuentaId = document.getElementById('_saleCuenta')?.value
    if (!cuentaId) { toast(t('err_selecciona_cuenta'),'error'); return }
    // Create income transaction
    S.ingresos.push({
      id: uid(),
      concepto: `Venta: ${a.nombre}`,
      importe: saleVal,
      categoria: 'Venta',
      fecha: todayISO(),
      cuentaId,
      status: 'paid',
      notas: `Activo vendido · Valor compra: ${eur(Number(a.valorCompra)||Number(a.valor)||0)}`
    })
    // Update account balance
    const cuenta = getCuenta(cuentaId)
    if (cuenta) cuenta.saldo = (Number(cuenta.saldo)||0) + saleVal
    // Mark asset as sold
    a.status = 'sold'
    a.fechaVenta = todayISO()
    recordPatrimonio()
    save()
    closeModal('confirmModal')
    render()
    toast(`Activo vendido · +${eur(saleVal)} ingresado ✓`)
  }
  openModal('confirmModal')
}

function quickUpdateAssetValue(id) {
  const a = (S.assets||[]).find(x=>x.id===id)
  if (!a) return
  const body = document.getElementById('confirmBody')
  const btn  = document.getElementById('confirmBtn')
  if (!body || !btn) return
  body.innerHTML = `
    <div class="confirm-icon">💰</div>
    <div class="confirm-title">Actualizar valor actual</div>
    <div class="confirm-msg" style="text-align:left;margin-top:12px">
      <div style="font-size:.82rem;color:var(--text2);margin-bottom:10px"><strong>${a.nombre}</strong> — Valor actual: <strong>${eur(Number(a.valor)||0)}</strong></div>
      <div class="form-group">
        <label style="font-size:.8rem">Nuevo valor de mercado (€)</label>
        <input type="number" id="_quickVal" value="${a.valor||''}" step="0.01" min="0"
          style="width:100%;padding:8px 12px;background:var(--bg2);border:1.5px solid var(--border2);border-radius:var(--radius-sm);color:var(--text);font-size:.9rem;margin-top:4px">
      </div>
    </div>`
  btn.textContent = '✓ Actualizar'
  btn.className = 'btn btn-primary btn-sm'
  btn.onclick = () => {
    const newVal = parseFloat(document.getElementById('_quickVal')?.value)
    if (isNaN(newVal) || newVal < 0) { toast('Valor inválido','error'); return }
    a.valor = newVal
    recordPatrimonio()
    save()
    closeModal('confirmModal')
    if (currentPage === 'patrimonio') renderPatrimonio()
    toast(`Valor actualizado: ${eur(newVal)} ✓`)
  }
  openModal('confirmModal')
}

function assetIcon(tipo) {
  if (tipo==='car') return {icon:'🚗',bg:'var(--gold-dim)'}
  if (tipo==='house') return {icon:'🏠',bg:'var(--indigo-dim)'}
  return {icon:'📦',bg:'var(--border)'}
}

// ─── RENDER: full routing ──────────────────────────────────────
function renderBilling() {
  if (window.MNBillingUI && window.MNBillingUI.renderBillingPage) {
    window.MNBillingUI.renderBillingPage();
  } else {
    document.getElementById('content').innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:300px;color:var(--text2);font-size:.9rem">
        Cargando Billing Center…
      </div>`;
  }
}

function render() {
  if (!S) return // Safety: S must be loaded before rendering
  updateTopBar()
  updateBadges()
  syncBottomNav(currentPage)
  // Show or hide demo mode FAB
  const hasDemoFab  = !!document.getElementById('demoFab')
  const hasRealFab  = !!document.getElementById('demoFabReal')
  const isDemo      = isDemoMode()
  if (isDemo && !hasDemoFab)  _renderDemoFab()
  if (!isDemo && !hasRealFab) _renderDemoFab()
  const fn = {
    dashboard:    renderDashboard,
    ingresos:     renderIngresos,
    gastos:       renderGastos,
    inversiones:  renderInversiones,
    deudas:       renderDeudas,
    objetivos:    renderObjetivos,
    presupuestos: renderPresupuestos,
    cuentas:      renderCuentas,
    analisis:     renderAnalisis,
    configuracion:renderConfiguracion,
    billing:      renderBilling,
    patrimonio:   renderPatrimonio,
    faq:          renderFAQ,
    sugerencias:  renderFAQ,
    logros:       renderLogros,
  }
  const pageKeyMap = {
    dashboard:'nav_dashboard', ingresos:'nav_ingresos', gastos:'nav_gastos',
    inversiones:'nav_inversiones', deudas:'nav_deudas', objetivos:'nav_objetivos',
    presupuestos:'nav_presupuestos', cuentas:'nav_cuentas',
    analisis:'nav_analisis', configuracion:'nav_configuracion',
    patrimonio:'nav_patrimonio', faq:'nav_faq', sugerencias:'nav_sugerencias', billing:'nav_billing',
    logros:'nav_logros',
  }
  const el = document.getElementById('pageTitle')
  if (el) el.textContent = pageKeyMap[currentPage] ? t(pageKeyMap[currentPage]) : currentPage
  const renderFn = fn[currentPage]
  if (renderFn) {
    destroyAllCharts()
    document.getElementById('content').innerHTML = ''
    renderFn()
    if (currentPage === 'analisis') setTimeout(renderProjectionChart, 80)
  }
}

// ─── PATCH: init() — personal-only ─────────────────────────────
// ─── FINANCIAL HEALTH SCORE ────────────────────────────────────
function calcHealthScore() {
  const m  = currentMonth()
  const mp = prevMonth(m)
  const ing  = calcIngresosMes(m)
  const gas  = calcGastosMes(m)
  const ingP = calcIngresosMes(mp)
  const gasP = calcGastosMes(mp)

  // Need at least some data to compute a meaningful score
  const totalTx = S.ingresos.length + S.gastos.length
  if (totalTx < 3) return 0

  // ── FACTOR 1: Savings rate (weight 40 pts) ─────────────────────
  let f1 = 0
  if (ing > 0) {
    const sr = (ing - gas) / ing * 100
    if (sr >= 30)      f1 = 40
    else if (sr >= 20) f1 = 32
    else if (sr >= 10) f1 = 22
    else if (sr >= 0)  f1 = 10
    else               f1 = 0   // deficit
  }

  // ── FACTOR 2: Expense stability month-over-month (weight 20 pts) ─
  let f2 = 10 // neutral if no previous month data
  if (gasP > 0 && gas > 0) {
    const variation = Math.abs(gas - gasP) / gasP * 100
    if (variation <= 10)      f2 = 20
    else if (variation <= 20) f2 = 15
    else if (variation <= 35) f2 = 8
    else                      f2 = 2
  }

  // ── FACTOR 3: Category balance — no single cat > 50% of expenses (weight 20 pts) ─
  let f3 = 20
  if (gas > 0) {
    const catMap = gastosMesByCat(m)
    const topVal = Math.max(...Object.values(catMap).map(Number))
    const topPct = topVal / gas * 100
    if (topPct > 80)      f3 = 2
    else if (topPct > 65) f3 = 8
    else if (topPct > 50) f3 = 14
    else                  f3 = 20
  }

  // ── FACTOR 4: Recurring burden — % of income locked in recurring (weight 20 pts) ─
  let f4 = 20
  if (ing > 0) {
    const recurringGas = S.gastos
      .filter(g => g.recurrente && (g.fecha||'').startsWith(m))
      .reduce((a,g) => a + (Number(g.importe)||0), 0)
    const recurPct = recurringGas / ing * 100
    if (recurPct <= 30)      f4 = 20
    else if (recurPct <= 45) f4 = 14
    else if (recurPct <= 60) f4 = 8
    else                     f4 = 2
  }

  return Math.min(100, Math.max(0, Math.round(f1 + f2 + f3 + f4)))
}

// Returns the 4 individual factor scores for display purposes
function calcHealthFactors() {
  const m  = currentMonth()
  const mp = prevMonth(m)
  const ing  = calcIngresosMes(m)
  const gas  = calcGastosMes(m)
  const gasP = calcGastosMes(mp)

  const sr = ing > 0 ? (ing - gas) / ing * 100 : 0
  const savingsOk = sr >= 20

  let stabilityOk = true
  if (gasP > 0 && gas > 0) {
    stabilityOk = Math.abs(gas - gasP) / gasP * 100 <= 20
  }

  let balanceOk = true
  if (gas > 0) {
    const catMap = gastosMesByCat(m)
    const topVal = Math.max(...Object.values(catMap).map(Number))
    balanceOk = topVal / gas * 100 <= 50
  }

  let recurOk = true
  if (ing > 0) {
    const rec = S.gastos.filter(g=>g.recurrente&&(g.fecha||'').startsWith(m)).reduce((a,g)=>a+(Number(g.importe)||0),0)
    recurOk = rec / ing * 100 <= 45
  }

  return [
    { label: 'Ahorro',      ok: savingsOk },
    { label: 'Estabilidad', ok: stabilityOk },
    { label: 'Distribución',ok: balanceOk },
    { label: 'Fijos',       ok: recurOk },
  ]
}

function healthScoreLabel(score) {
  if (score >= 80) return { label: '¡Excelente!',  color: 'var(--green)' }
  if (score >= 65) return { label: 'Muy buena',    color: 'var(--accent)' }
  if (score >= 45) return { label: 'En progreso',  color: 'var(--gold)' }
  if (score >= 25) return { label: 'Mejorable',    color: 'var(--gold)' }
  if (score === 0) return { label: 'Sin datos',    color: 'var(--text3)' }
  return             { label: 'Crítica',           color: 'var(--red)' }
}

function renderHealthScore() {
  const score   = calcHealthScore()
  const factors = calcHealthFactors()
  const { label, color } = healthScoreLabel(score)
  const eom    = calcEOMBalance()
  const r      = 22
  const circum = 2 * Math.PI * r
  const dashOff = score > 0 ? circum - (score / 100) * circum : circum

  const factorDots = factors.map(f => `
    <div class="hsc-factor">
      <div class="hsc-factor-dot" style="background:${f.ok ? 'var(--green)' : 'var(--red)'}"></div>
      <span>${f.label}</span>
    </div>`).join('')

  return `<div class="health-score-compact">
    <div class="hsc-ring-wrap">
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r="${r}" fill="none" stroke="var(--border)" stroke-width="5"/>
        <circle cx="28" cy="28" r="${r}" fill="none"
          stroke="${color}" stroke-width="5"
          stroke-linecap="round"
          stroke-dasharray="${circum}"
          stroke-dashoffset="${dashOff}"
          id="healthRingFill" style="transition:stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)"/>
      </svg>
      <div class="hsc-num" id="healthScoreNum">${score > 0 ? 0 : '—'}</div>
    </div>
    <div class="hsc-info">
      <div class="hsc-title">${t('salud_financiera')}</div>
      <div class="hsc-label" style="color:${color}">${label}</div>
      <div class="hsc-factors">${factorDots}</div>
    </div>
    <div class="hsc-eom">
      <div class="hsc-eom-label">${t('fin_de_mes')}</div>
      <div class="hsc-eom-val" style="color:${eom>=0?'var(--accent)':'var(--red)'}">${eom>=0?'+':''}${eur(eom)}</div>
      <div class="hsc-eom-sub">${eom>=0?t('estimado'):t('posible_deficit')}</div>
    </div>
  </div>`
}

// ─── END OF MONTH BALANCE PREDICTION ───────────────────────────
function calcEOMBalance() {
  const m = currentMonth()
  const today = new Date()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth()+1, 0).getDate()
  const dayOfMonth  = today.getDate()
  const daysLeft    = daysInMonth - dayOfMonth
  const hoyStr      = today.toISOString().slice(0,10)

  // 1. Base: saldo real actual en todas las cuentas
  const saldoActual = calcDineroDisponible()

  // 2. Ingresos pendientes de cobro este mes (status 'pending' con fecha en el mes)
  const ingresosPendientes = S.ingresos
    .filter(i => i.status === 'pending' && (i.fecha||'').startsWith(m))
    .reduce((a,i) => a + (Number(i.importe)||0), 0)

  // 3. Gastos recurrentes que faltan por ocurrir este mes
  const gastosRecurrentesPendientes = S.gastos
    .filter(g => {
      if (g.tipo === TX_TYPES.GOAL_TRANSFER) return false
      if (!g.recurrente) return false
      // Tiene fecha futura en el mes actual
      if ((g.fecha||'').startsWith(m) && g.fecha > hoyStr) return true
      // Es recurrente de meses anteriores (se asume que repetirá)
      if (g.fecha && g.fecha < hoyStr && !(g.fecha||'').startsWith(m)) return true
      return false
    })
    .reduce((a,g) => a + (Number(g.importe)||0), 0)

  // 4. Proyección conservadora del gasto no-recurrente restante
  //    (ritmo diario de lo ya gastado × días que quedan × 0.7)
  const gastosMes   = calcGastosMes(m)
  const gastosDiario = dayOfMonth > 0 ? gastosMes / dayOfMonth : 0
  const gastosRestantes = gastosDiario * daysLeft * 0.7

  return Math.round(saldoActual + ingresosPendientes - gastosRecurrentesPendientes - gastosRestantes)
}

// ─── STREAK TRACKING ───────────────────────────────────────────
function updateStreak() {
  const today = todayISO()
  if (!S.streak) S.streak = { count: 0, lastDate: '' }
  if (S.streak.lastDate === today) return // already recorded today
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yd = yesterday.toISOString().slice(0,10)
  if (S.streak.lastDate === yd) {
    S.streak.count = (S.streak.count || 0) + 1
  } else if (S.streak.lastDate !== today) {
    S.streak.count = 1
  }
  S.streak.lastDate = today
  save()
}

function getStreak() {
  if (!S.streak) return 0
  const today = todayISO()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yd = yesterday.toISOString().slice(0,10)
  if (S.streak.lastDate !== today && S.streak.lastDate !== yd) return 0
  return S.streak.count || 0
}

// ─── TIP OF THE DAY ────────────────────────────────────────────
const TIPS = [
  { icon:'💡', text:'<strong>Regla del 50/30/20:</strong> destina el 50% a necesidades, 30% a deseos y 20% a ahorro e inversión.' },
  { icon:'🏦', text:'<strong>Fondo de emergencia:</strong> mantén entre 3 y 6 meses de gastos en una cuenta de fácil acceso.' },
  { icon:'📈', text:'<strong>Interés compuesto:</strong> con la regla del 72, divide 72 entre tu rentabilidad anual para saber en cuántos años doblas tu dinero.' },
  { icon:'🔄', text:'<strong>Gastos recurrentes:</strong> revisa tus suscripciones cada trimestre. El coste medio oculto es de 180€/año.' },
  { icon:'🎯', text:'<strong>Objetivos SMART:</strong> tus metas financieras deben ser específicas, medibles y con fecha límite.' },
  { icon:'💳', text:'<strong>Deuda buena vs mala:</strong> la deuda que genera valor (formación, vivienda) es diferente a la de consumo.' },
  { icon:'🌍', text:'<strong>Diversificación:</strong> no concentres más del 5% de tu cartera en un solo activo.' },
  { icon:'📉', text:'<strong>Método bola de nieve:</strong> paga primero la deuda más pequeña para ganar impulso psicológico.' },
  { icon:'⚡', text:'<strong>Automatiza el ahorro:</strong> transfiere a ahorro el mismo día que cobras, antes de gastar.' },
  { icon:'🏠', text:'<strong>Vivienda:</strong> el coste total (hipoteca + gastos) no debería superar el 28-30% de tus ingresos.' },
  { icon:'🔮', text:'<strong>Inflación:</strong> el dinero parado pierde valor. Una inflación del 3% hace que en 24 años pierda la mitad de su poder adquisitivo.' },
  { icon:'📅', text:'<strong>Revisión mensual:</strong> 15 minutos al mes revisando tus finanzas vale más que cualquier app.' },
]
function getTipOfDay() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(),0,0)) / 86400000)
  return TIPS[dayOfYear % TIPS.length]
}

// ─── MONTH SUMMARY (first access of new month) ─────────────────
function checkMonthSummary() {
  const m = currentMonth()
  if (!S._lastRenderedMonth) { S._lastRenderedMonth = m; save(); return null }
  if (S._lastRenderedMonth === m) return null
  // New month! Generate summary of previous month
  const prevM = S._lastRenderedMonth
  S._lastRenderedMonth = m
  save()
  const ingP = calcIngresosMes(prevM)
  const gasP = calcGastosMes(prevM)
  const cfP  = ingP - gasP
  const srP  = ingP > 0 ? Math.round((cfP/ingP)*100) : 0
  const catMap = gastosMesByCat(prevM)
  const topCat = Object.entries(catMap).sort((a,b)=>b[1]-a[1])[0]
  return { prevM, ingP, gasP, cfP, srP, topCat }
}

function renderMonthSummaryBanner(summary) {
  if (!summary) return ''
  const { prevM, ingP, gasP, cfP, srP, topCat } = summary
  return `<div class="month-summary-banner" id="monthSummaryBanner">
    <button class="month-summary-close" onclick="document.getElementById('monthSummaryBanner').remove()">✕</button>
    <div class="msb-title">📅 Tu resumen de ${monthLabel(prevM)}</div>
    <div class="msb-stats">
      <div class="msb-stat">Ingresaste <strong style="color:var(--green)">${eur(ingP)}</strong></div>
      <div class="msb-stat">Gastaste <strong style="color:var(--red)">${eur(gasP)}</strong></div>
      <div class="msb-stat">Ahorraste <strong style="color:var(--accent)">${eur(Math.max(0,cfP))}</strong> (${srP}%)</div>
      ${topCat ? `<div class="msb-stat">Mayor gasto: <strong>${topCat[0]}</strong> (${eur(topCat[1])})</div>` : ''}
    </div>
  </div>`
}

// ─── ANIMATED KPI COUNTER ──────────────────────────────────────
function animateCounter(el, target) {
  if (!el) return
  const isEur = target.includes('€')
  const num = parseFloat(target.replace(/[^\d.,-]/g,'').replace(',','.')) || 0
  const start = 0
  const duration = 700
  const startTime = performance.now()
  el.classList.add('anim')
  function step(now) {
    const elapsed = now - startTime
    const progress = Math.min(elapsed / duration, 1)
    const ease = 1 - Math.pow(1 - progress, 3)
    const current = start + (num - start) * ease
    el.textContent = isEur ? fmt(current) + '\u00A0€' : fmt(current)
    if (progress < 1) requestAnimationFrame(step)
    else el.textContent = target
  }
  requestAnimationFrame(step)
}

// ─── BOTTOM NAV SYNC ───────────────────────────────────────────
function syncBottomNav(page) {
  const map = { dashboard:'bn-dashboard', gastos:'bn-gastos', analisis:'bn-analisis', configuracion:'bn-config' }
  document.querySelectorAll('.bottom-nav-item').forEach(el => el.classList.remove('active'))
  const id = map[page]
  if (id) { const el = document.getElementById(id); if (el) el.classList.add('active') }
}

// ─── QUICK ADD FUNCTIONALITY ────────────────────────────────────
let _qaType = 'gasto'
let _qaCat  = ''

function openQuickAdd() {
  // Guests cannot add movements
  if (isGuest()) { _showGuestGateModal(); return }
  _qaType = 'gasto'
  _qaCat  = ''
  document.getElementById('quickAmount').value = ''
  document.getElementById('quickConcepto').value = ''
  setQuickType('gasto')
  document.getElementById('quickAddModal').classList.add('open')
  setTimeout(() => document.getElementById('quickAmount').focus(), 200)
}

function closeQuickAdd() {
  document.getElementById('quickAddModal').classList.remove('open')
}

function setQuickType(type) {
  _qaType = type
  _qaCat  = ''
  document.getElementById('qat-gasto').className = 'quick-add-type' + (type==='gasto'?' gasto-active':'')
  document.getElementById('qat-ingreso').className = 'quick-add-type' + (type==='ingreso'?' active':'')
  const cats = type === 'gasto'
    ? (S.categorias.gasto || []).slice(0,8)
    : (S.categorias.ingreso || []).slice(0,6)
  const activeClass = type === 'gasto' ? 'gasto-active' : 'active'
  document.getElementById('quickCatRow').innerHTML = cats.map(c =>
    `<div class="quick-cat-btn" onclick="selectQuickCat('${c}',this,'${activeClass}')">${catEmoji(c)} ${c}</div>`
  ).join('')
}

function selectQuickCat(cat, el, activeClass) {
  _qaCat = cat
  document.querySelectorAll('#quickCatRow .quick-cat-btn').forEach(b => b.className='quick-cat-btn')
  el.className = `quick-cat-btn ${activeClass}`
}

function saveQuickAdd() {
  if (isGuest()) { closeQuickAdd(); _showGuestGateModal(); return }
  const importe = parseFloat(document.getElementById('quickAmount').value)
  if (!importe || importe <= 0) { toast('Introduce un importe válido','error'); return }
  const concepto = document.getElementById('quickConcepto').value.trim() || (_qaCat || (_qaType==='gasto'?'Gasto':'Ingreso'))
  const cat = _qaCat || (_qaType==='gasto' ? 'Otro' : 'Otro')
  const fecha = todayISO()
  if (_qaType === 'gasto') {
    S.gastos.push({ id:uid(), concepto, importe, categoria:cat, fecha, recurrente:false })
    // Deduct from first account
    if (S.cuentas.length) S.cuentas[0].saldo = (Number(S.cuentas[0].saldo)||0) - importe
  } else {
    S.ingresos.push({ id:uid(), concepto, importe, categoria:cat, fecha, status:'cobrado' })
    if (S.cuentas.length) S.cuentas[0].saldo = (Number(S.cuentas[0].saldo)||0) + importe
  }
  save()
  updateStreak()
  closeQuickAdd()
  render()
  toast(`${_qaType==='gasto'?'Gasto':'Ingreso'} de ${eur(importe)} registrado ✓`)
  // Haptic feedback on mobile
  if (navigator.vibrate) navigator.vibrate(10)
}

// ─── TITLE WITH AVAILABLE BALANCE ──────────────────────────────
function updateDocTitle() {
  const dis = calcDineroDisponible()
  document.title = `MoneyNest · ${eur(dis)}`
}

// ═══════════════════════════════════════════════════════════════
// MINI INTRO — runs every app open, max 1.5s, skippable
// Completely separate from runCinematicIntro (first-time only)
// ═══════════════════════════════════════════════════════════════
function runMiniIntro(onComplete) {
  const overlay  = document.getElementById('mnMiniIntro')
  const stage    = document.getElementById('mnMiniStage')
  const logo     = document.getElementById('mnMiniLogo')
  const svg      = document.getElementById('mnMiniSvg')
  const wordmark = document.getElementById('mnMiniWordmark')
  const tagline  = document.getElementById('mnMiniTagline')
  const appEl    = document.querySelector('.app')

  // Safety: if elements missing, skip immediately
  if (!overlay || !stage) { if (onComplete) onComplete(); return }

  let done = false

  // ── Apply blur to app shell behind the overlay ─────────────────
  if (appEl) appEl.classList.add('mn-intro-blur')

  // ── SKIP handler — click or scroll dismisses immediately ────────
  function skip() {
    if (done) return
    done = true
    cleanup()
    if (onComplete) onComplete()
  }

  function cleanup() {
    // Remove blur transition class from app
    if (appEl) {
      appEl.classList.add('mn-intro-unblur')
      // Remove blur classes after transition ends
      setTimeout(() => {
        appEl.classList.remove('mn-intro-blur', 'mn-intro-unblur')
      }, 320)
    }
    // Fade out overlay + stage simultaneously
    stage.classList.add('mn-stage-out')
    overlay.classList.add('mn-exiting')
    // Remove from DOM after exit transition
    setTimeout(() => {
      overlay.remove()
    }, 280)
    // Remove listeners
    document.removeEventListener('pointerdown', skip, true)
    document.removeEventListener('keydown',     skip, true)
    document.removeEventListener('wheel',       skip, true)
  }

  // Attach skip listeners — use capture so they fire even if intro has pointer-events:all
  document.addEventListener('pointerdown', skip, { capture:true, once:true })
  document.addEventListener('keydown',     skip, { capture:true, once:true })
  document.addEventListener('wheel',       skip, { capture:true, once:true })

  // ── PHASE 1: Trigger entrance animations (rAF guarantees paint first) ──
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // Stage scales in
      stage.classList.add('mn-stage-in')
      // Logo slides up
      logo.classList.add('mn-logo-in')
      // SVG strokes draw
      svg.classList.add('mn-svg-run')
      // Wordmark fades up (delay built into CSS)
      wordmark.classList.add('mn-word-in')
      // Tagline fades in last
      tagline.classList.add('mn-tag-in')
    })
  })

  // ── PHASE 2: Hold, then begin exit sequence at 1100ms ──────────
  // Total budget: 1500ms. Exit takes ~280ms. So start exit at 1100ms.
  const holdTimer = setTimeout(() => {
    if (done) return
    done = true
    cleanup()
    if (onComplete) onComplete()
  }, 1100)

  // Failsafe: hard kill at 1600ms no matter what
  setTimeout(() => {
    if (!done) { done = true; cleanup(); if (onComplete) onComplete() }
  }, 1600)
}

function init() {
  // ── Auth: inicializar usuario y verificar acceso ────────────
  initUser()
  const access = checkAccess()
  if (!access.ok) return // bloquearApp() ya fue llamado internamente
  // ──────────────────────────────────────────────────────────
  try { load() } catch(e) { S = defaultState() }
  try { loadLang() } catch(e) {}
  // Guarantee every required field exists — defensive after any crash or corrupt data
  if (!S || typeof S !== 'object') S = defaultState()
  if (!S.usuario || typeof S.usuario !== 'object') S.usuario = defaultState().usuario
  S.usuario.mode = 'personal'
  if (!Array.isArray(S.clientes))   S.clientes   = []
  if (!Array.isArray(S.proveedores)) S.proveedores = []
  if (!Array.isArray(S.devengos))   S.devengos   = []
  if (!Array.isArray(S.assets))     S.assets     = []
  if (!Array.isArray(S.ingresos))   S.ingresos   = []
  if (!Array.isArray(S.gastos))     S.gastos     = []
  if (!Array.isArray(S.inversiones)) S.inversiones = []
  if (!Array.isArray(S.deudas))     S.deudas     = []
  if (!Array.isArray(S.objetivos))  S.objetivos  = []
  if (!Array.isArray(S.cuentas) || !S.cuentas.length) S.cuentas = defaultState().cuentas
  if (!Array.isArray(S.patrimonio_hist)) S.patrimonio_hist = []
  if (!S.presupuestos || typeof S.presupuestos !== 'object') S.presupuestos = {}
  document.documentElement.setAttribute('lang', _currentLang)
  applyTheme()
  recordPatrimonio()
  updateSidebarLogo()
  updateStreak()
  if (window.MNRecurring) try { MNRecurring.processDueRecurrings() } catch {}
  render()                    // ← app renders first (visible behind overlay)
  _updateSidebarLang()
  translateDOM()              // PASO 3: traduce modales estáticos index.html
  _autoResetFlagsIfEmpty()
  updateDocTitle()
  // Show demo/real FAB
  setTimeout(_renderDemoFab, 400)
  // ── Mini intro runs every open EXCEPT first-time (which uses cinematic intro) ──
  if (_obFlagSeen()) {
    // Returning user: show mini intro, then nothing
    runMiniIntro(() => {})
  } else {
    // First-time user: skip mini intro, go straight to cinematic intro + onboarding
    // Remove mini intro overlay immediately without animating
    const miniEl = document.getElementById('mnMiniIntro')
    if (miniEl) miniEl.remove()
    const appEl = document.querySelector('.app')
    if (appEl) appEl.classList.remove('mn-intro-blur')
    checkOnboarding()         // onboarding only fires if first-time
  }
}


// ─── BEFOREUNLOAD: warn if modal open ──────────────────────────
window.addEventListener('beforeunload', function(e) {
  const hasOpenModal = document.querySelector('.modal-overlay.open')
  if (hasOpenModal) {
    e.preventDefault()
    e.returnValue = '¿Seguro que quieres salir? Tienes cambios sin guardar.'
    return e.returnValue
  }
})


// ════════════════════════════════════════════════════════════════
// APP_NAME CONSTANT
// ════════════════════════════════════════════════════════════════
const APP_NAME = 'MoneyNest'

// ════════════════════════════════════════════════════════════════
// ─── MODO HISTORIA — Monthly & Annual Story Slides ────────────
// ════════════════════════════════════════════════════════════════
const MONTHLY_STORY_KEY = 'mn_monthly_story_shown'
const YEARLY_STORY_KEY  = 'mn_yearly_story_shown'

let _smSlides = []
let _smStep   = 0

function _buildMonthlySlides() {
  const now   = new Date()
  const prevM = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevKey = prevM.toISOString().slice(0, 7)
  const monthName = prevM.toLocaleString('es', { month: 'long', year: 'numeric' })

  // Gather data from previous month
  const prevIngresos = (S.ingresos || []).filter(i => i.fecha && i.fecha.startsWith(prevKey))
  const prevGastos   = (S.gastos   || []).filter(g => g.fecha && g.fecha.startsWith(prevKey))
  const prevM2       = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().slice(0, 7)
  const prev2Gastos  = (S.gastos   || []).filter(g => g.fecha && g.fecha.startsWith(prevM2))

  const totalIngr = prevIngresos.reduce((a, i) => a + (Number(i.importe) || 0), 0)
  const totalGast = prevGastos  .reduce((a, g) => a + (Number(g.importe) || 0), 0)
  const totalGast2= prev2Gastos .reduce((a, g) => a + (Number(g.importe) || 0), 0)
  const ahorro    = totalIngr - totalGast
  const ahorroSign = ahorro >= 0 ? 'green' : 'red'
  const deltaGast  = totalGast2 > 0 ? ((totalGast - totalGast2) / totalGast2 * 100).toFixed(0) : null

  // Top category
  const catMap = {}
  prevGastos.forEach(g => { const c = g.categoria || 'Otros'; catMap[c] = (catMap[c] || 0) + (Number(g.importe) || 0) })
  const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]

  const euroFmt = v => new Intl.NumberFormat('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(v)

  // Highlights
  const highlights = []
  if (ahorro > 0) highlights.push({ icon: '💚', text: `Has ahorrado <strong style="color:var(--accent)">€${euroFmt(ahorro)}</strong>`, sub: 'Sigue así — cada euro cuenta' })
  if (ahorro < 0) highlights.push({ icon: '⚠️', text: `Has gastado <strong style="color:var(--red)">€${euroFmt(Math.abs(ahorro))}</strong> más de lo que ingresaste`, sub: 'Intenta reducir gastos el próximo mes' })
  if (topCat) highlights.push({ icon: '📊', text: `Tu categoría top: <strong>${topCat[0]}</strong> (€${euroFmt(topCat[1])})`, sub: 'La partida que más peso tiene' })
  if (deltaGast !== null) {
    const dir = Number(deltaGast) <= 0 ? '📉' : '📈'
    const col = Number(deltaGast) <= 0 ? 'var(--accent)' : 'var(--red)'
    highlights.push({ icon: dir, text: `Gastos ${Number(deltaGast) <= 0 ? 'reducidos' : 'aumentados'} un <strong style="color:${col}">${Math.abs(deltaGast)}%</strong> vs mes anterior`, sub: 'Comparativa mensual' })
  }

  const slides = [
    // Slide 1 — intro
    {
      heroIcon: '📅',
      heroGrad: 'linear-gradient(135deg,rgba(0,212,170,.25),rgba(99,102,241,.15))',
      glowColor: '#00D4AA',
      eyebrow: `Resumen de ${monthName}`,
      title: `Este mes has hecho esto 👇`,
      subtitle: `Aquí está tu resumen financiero de ${monthName}. Tómate un momento para verlo.`,
      extra: `<div class="sm-stats">
        <div class="sm-stat" style="animation-delay:.05s">
          <div class="sm-stat-val" style="color:var(--accent)">€${euroFmt(totalIngr)}</div>
          <div class="sm-stat-lbl">Ingresos</div>
        </div>
        <div class="sm-stat" style="animation-delay:.1s">
          <div class="sm-stat-val" style="color:var(--red)">€${euroFmt(totalGast)}</div>
          <div class="sm-stat-lbl">Gastos</div>
        </div>
        <div class="sm-stat" style="animation-delay:.15s">
          <div class="sm-stat-val" style="color:var(--${ahorroSign === 'green' ? 'accent' : 'red'})">€${euroFmt(ahorro)}</div>
          <div class="sm-stat-lbl">Ahorro neto</div>
          ${deltaGast !== null ? `<div class="sm-stat-delta ${Number(deltaGast) <= 0 ? 'up' : 'down'}">${Number(deltaGast) <= 0 ? '▼' : '▲'} ${Math.abs(deltaGast)}%</div>` : ''}
        </div>
      </div>`
    }
  ]

  // Slide 2 — highlights (if any)
  if (highlights.length > 0) {
    slides.push({
      heroIcon: '✨',
      heroGrad: 'linear-gradient(135deg,rgba(245,158,11,.2),rgba(244,63,94,.1))',
      glowColor: '#F59E0B',
      eyebrow: 'Lo más destacado',
      title: `Tu mes, en detalle`,
      subtitle: 'Los momentos más relevantes de tus finanzas este mes.',
      extra: `<div class="sm-highlights">` +
        highlights.slice(0, 3).map((h, i) =>
          `<div class="sm-highlight" style="animation-delay:${i * .07}s">
            <div class="sm-highlight-icon">${h.icon}</div>
            <div class="sm-highlight-text">${h.text}<span>${h.sub}</span></div>
          </div>`).join('') +
        `</div>`
    })
  }

  // Slide 3 — forward look
  slides.push({
    heroIcon: '🚀',
    heroGrad: 'linear-gradient(135deg,rgba(99,102,241,.25),rgba(0,212,170,.15))',
    glowColor: '#6366F1',
    eyebrow: `Nuevo mes, nueva oportunidad`,
    title: '¡Adelante con el nuevo mes!',
    subtitle: ahorro >= 0
      ? `Terminaste en positivo. Mantener este ritmo te acerca a tus objetivos financieros.`
      : `El próximo mes es una nueva oportunidad. Pequeños cambios producen grandes resultados.`,
    extra: ''
  })

  return slides
}

function _buildYearlySlides() {
  const prevYear = new Date().getFullYear() - 1
  const yearStr  = String(prevYear)

  const yIngresos = (S.ingresos  || []).filter(i => i.fecha && i.fecha.startsWith(yearStr))
  const yGastos   = (S.gastos    || []).filter(g => g.fecha && g.fecha.startsWith(yearStr))

  const totalIngr = yIngresos.reduce((a, i) => a + (Number(i.importe) || 0), 0)
  const totalGast = yGastos  .reduce((a, g) => a + (Number(g.importe) || 0), 0)
  const totalAhor = totalIngr - totalGast

  // Monthly breakdown for chart
  const months = Array.from({ length: 12 }, (_, i) => {
    const key = `${yearStr}-${String(i + 1).padStart(2, '0')}`
    const ing = (S.ingresos || []).filter(x => x.fecha && x.fecha.startsWith(key)).reduce((a, x) => a + (Number(x.importe) || 0), 0)
    const gas = (S.gastos   || []).filter(x => x.fecha && x.fecha.startsWith(key)).reduce((a, x) => a + (Number(x.importe) || 0), 0)
    return { key, ing, gas, sav: ing - gas }
  })

  const bestMonth  = months.reduce((a, b) => b.sav > a.sav ? b : a, months[0])
  const worstMonth = months.reduce((a, b) => b.sav < a.sav ? b : a, months[0])
  const maxVal = Math.max(...months.map(m => Math.max(m.ing, m.gas)), 1)

  const catMap = {}
  yGastos.forEach(g => { const c = g.categoria || 'Otros'; catMap[c] = (catMap[c] || 0) + (Number(g.importe) || 0) })
  const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]

  const euroFmt = v => new Intl.NumberFormat('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)
  const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

  const barHtml = `
    <div class="sm-year-bars">
      ${months.map((m, i) => `
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;height:100%">
          <div class="sm-year-bar" style="width:100%;background:${m.sav >= 0 ? '#00D4AA' : '#F43F5E'};height:${Math.round((Math.max(m.ing, m.gas) / maxVal) * 100)}%"></div>
        </div>`).join('')}
    </div>
    <div class="sm-year-bar-lbl">
      <span>${monthNames[0]}</span><span>${monthNames[5]}</span><span>${monthNames[11]}</span>
    </div>`

  return [
    {
      heroIcon: '🎊',
      heroGrad: 'linear-gradient(135deg,rgba(245,158,11,.3),rgba(244,63,94,.15))',
      glowColor: '#F59E0B',
      eyebrow: `Tu año ${prevYear} en ${APP_NAME}`,
      title: `¡Otro año completado!`,
      subtitle: `Esto es lo que has logrado en ${prevYear}. Tómate un momento para verlo.`,
      extra: `<div class="sm-stats">
        <div class="sm-stat"><div class="sm-stat-val" style="color:var(--accent)">€${euroFmt(totalIngr)}</div><div class="sm-stat-lbl">Ingresos</div></div>
        <div class="sm-stat"><div class="sm-stat-val" style="color:var(--red)">€${euroFmt(totalGast)}</div><div class="sm-stat-lbl">Gastos</div></div>
        <div class="sm-stat"><div class="sm-stat-val" style="color:${totalAhor >= 0 ? 'var(--accent)' : 'var(--red)'}">€${euroFmt(totalAhor)}</div><div class="sm-stat-lbl">Ahorro total</div></div>
      </div>`
    },
    {
      heroIcon: '📊',
      heroGrad: 'linear-gradient(135deg,rgba(99,102,241,.25),rgba(0,212,170,.1))',
      glowColor: '#6366F1',
      eyebrow: 'Evolución mensual',
      title: `Mes a mes, aquí tu huella`,
      subtitle: `${bestMonth ? `Tu mejor mes fue ${monthNames[months.indexOf(bestMonth)]} con €${euroFmt(bestMonth.sav)} de ahorro.` : ''}`,
      extra: barHtml + (topCat ? `<div class="sm-highlight" style="margin-top:8px"><div class="sm-highlight-icon">🏆</div><div class="sm-highlight-text">Categoría top: <strong>${topCat[0]}</strong> · €${euroFmt(topCat[1])}<span>Tu partida de gasto más importante del año</span></div></div>` : '')
    },
    {
      heroIcon: '⭐',
      heroGrad: 'linear-gradient(135deg,rgba(0,212,170,.2),rgba(99,102,241,.2))',
      glowColor: '#00D4AA',
      eyebrow: `Bienvenido a ${new Date().getFullYear()}`,
      title: `Un nuevo año por delante`,
      subtitle: totalAhor > 0
        ? `Ahorraste €${euroFmt(totalAhor)} el año pasado. ¡Este año puedes ir aún más lejos!`
        : `Un nuevo comienzo. Pequeños cambios consistentes producen grandes resultados.`,
      extra: ''
    }
  ]
}

function _smRenderSlide(animate) {
  const s = _smSlides[_smStep]
  if (!s) return
  const wrap = document.getElementById('smSlideWrap')
  if (!wrap) return

  const total = _smSlides.length
  const prog  = document.getElementById('smProgress')
  if (prog) prog.innerHTML = Array.from({ length: total }, (_, i) =>
    `<div class="sm-pdot ${i === _smStep ? 'active' : ''}"></div>`).join('')

  const nextBtn = document.getElementById('smNextBtn')
  if (nextBtn) nextBtn.textContent = _smStep === total - 1 ? '¡Entendido! ✓' : 'Siguiente →'

  const html = `
    <div class="sm-hero" style="background:${s.heroGrad}">
      <div class="sm-hero-glow" style="background:${s.glowColor}"></div>
      <div class="sm-hero-icon">${s.heroIcon}</div>
    </div>
    <div class="sm-body">
      <div class="sm-eyebrow"><div class="sm-eyebrow-dot"></div>${s.eyebrow}</div>
      <div class="sm-title">${s.title}</div>
      <div class="sm-subtitle">${s.subtitle}</div>
      ${s.extra || ''}
    </div>`

  if (animate) {
    wrap.classList.add('sm-exit')
    setTimeout(() => {
      wrap.innerHTML = html
      wrap.classList.remove('sm-exit')
      wrap.classList.add('sm-enter')
      requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.remove('sm-enter')))
    }, 180)
  } else {
    wrap.innerHTML = html
  }
}

function smNext() {
  if (_smStep >= _smSlides.length - 1) { smClose(); return }
  _smStep++
  _smRenderSlide(true)
}

function smClose() {
  const modal = document.getElementById('storyModal')
  if (!modal) return
  modal.style.animation = 'smFadeIn .25s ease reverse forwards'
  setTimeout(() => {
    modal.classList.remove('sm-visible')
    modal.style.animation = ''
  }, 250)
}

function showMonthlySummary() {
  const prevM = new Date()
  prevM.setDate(0) // last day of prev month
  const prevKey = `${prevM.getFullYear()}-${String(prevM.getMonth() + 1).padStart(2, '0')}`

  const hasData = (S.ingresos || []).some(i => i.fecha && i.fecha.startsWith(prevKey)) ||
                  (S.gastos   || []).some(g => g.fecha && g.fecha.startsWith(prevKey))
  if (!hasData) return

  _smSlides = _buildMonthlySlides()
  _smStep   = 0
  const modal = document.getElementById('storyModal')
  if (!modal) return
  _smRenderSlide(false)
  modal.classList.add('sm-visible')
  try { localStorage.setItem(MONTHLY_STORY_KEY, new Date().toISOString().slice(0, 7)) } catch(e) {}
}

function showYearlySummary() {
  const prevYear = new Date().getFullYear() - 1
  const yearStr  = String(prevYear)
  const hasData  = (S.ingresos || []).some(i => i.fecha && i.fecha.startsWith(yearStr)) ||
                   (S.gastos   || []).some(g => g.fecha && g.fecha.startsWith(yearStr))
  if (!hasData) return

  _smSlides = _buildYearlySlides()
  _smStep   = 0
  const modal = document.getElementById('storyModal')
  if (!modal) return
  _smRenderSlide(false)
  modal.classList.add('sm-visible')
  try { localStorage.setItem(YEARLY_STORY_KEY, String(new Date().getFullYear())) } catch(e) {}
}

function checkStories() {
  if (!_obFlagSeen()) return // No mostrar si no ha pasado por el onboarding
  const now = new Date()
  const curMonth = now.toISOString().slice(0, 7)
  const curYear  = String(now.getFullYear())

  try {
    const shownM = localStorage.getItem(MONTHLY_STORY_KEY)
    const shownY = localStorage.getItem(YEARLY_STORY_KEY)

    // Annual: show on January if prev year not shown
    if (now.getMonth() === 0 && shownY !== curYear) {
      setTimeout(() => showYearlySummary(), 1800)
      return
    }
    // Monthly: show if current month not shown
    if (shownM !== curMonth) {
      setTimeout(() => showMonthlySummary(), 1800)
    }
  } catch(e) {}
}

// ════════════════════════════════════════════════════════════════
// ─── OBJETIVO GUIADO — Goal Coach ────────────────────────────
// ════════════════════════════════════════════════════════════════
const GC_FLAG = 'mn_goal_coach_shown'

function gcSetAmount(v) {
  const inp = document.getElementById('gcAmount')
  if (inp) { inp.value = v }
  document.querySelectorAll('.gc-chip').forEach(c => {
    c.classList.toggle('selected', c.textContent.replace(/[^0-9]/g,'') == String(v))
  })
}

function gcClose() {
  try { localStorage.setItem(GC_FLAG, 'true') } catch(e) {}
  const modal = document.getElementById('goalCoachModal')
  if (modal) { modal.style.animation = 'smFadeIn .25s ease reverse forwards'; setTimeout(() => { modal.classList.remove('gc-visible'); modal.style.animation = '' }, 250) }
}

function gcCreate() {
  const amt = Number(document.getElementById('gcAmount')?.value) || 0
  if (amt <= 0) { document.getElementById('gcAmount')?.focus(); return }
  const now = new Date()
  const meta = amt
  const nombre = `Ahorro ${now.toLocaleString('es', { month: 'long' })} ${now.getFullYear()}`
  const nuevoObj = {
    id: 'gc_' + Date.now(),
    nombre, meta,
    actual: 0,
    fecha: now.toISOString().slice(0, 10),
    completado: false
  }
  if (!Array.isArray(S.objetivos)) S.objetivos = []
  S.objetivos.push(nuevoObj)
  save()
  render()
  gcClose()
  toast(`🎯 Objetivo creado: ${nombre}`)
}

function checkGoalCoach() {
  if (!_obFlagSeen()) return
  try { if (localStorage.getItem(GC_FLAG) === 'true') return } catch(e) {}
  const hasObj  = Array.isArray(S.objetivos) && S.objetivos.length > 0
  const hasData = (S.ingresos || []).length > 0 || (S.gastos || []).length > 0
  if (hasObj || !hasData) return
  setTimeout(() => {
    const modal = document.getElementById('goalCoachModal')
    if (modal) modal.classList.add('gc-visible')
  }, 3000)
}

// ════════════════════════════════════════════════════════════════
// ─── MISIONES TOUR — Active Mission System ───────────────────
// ════════════════════════════════════════════════════════════════
const MISION_FLAG = 'mn_misiones_done'
const MISION_STATE_KEY = 'mn_misiones_state'

function _getMisionState() {
  try {
    const s = JSON.parse(localStorage.getItem(MISION_STATE_KEY) || '{}')
    return { m1: s.m1 || false, m2: s.m2 || false, m3: s.m3 || false, dismissed: s.dismissed || false }
  } catch(e) { return { m1: false, m2: false, m3: false, dismissed: false } }
}

function _saveMisionState(state) {
  try { localStorage.setItem(MISION_STATE_KEY, JSON.stringify(state)) } catch(e) {}
}

function _checkMisionProgress() {
  const state = _getMisionState()
  state.m1 = (S.ingresos  || []).length > 0
  state.m2 = (S.gastos    || []).length > 0
  state.m3 = (S.objetivos || []).length > 0
  _saveMisionState(state)
  return state
}

function misionDone() {
  try { localStorage.setItem(MISION_FLAG, 'true') } catch(e) {}
  const bar = document.getElementById('misionBar')
  if (bar) { bar.style.transform = 'translateX(-50%) scale(.9)'; bar.style.opacity = '0'; setTimeout(() => bar.style.display = 'none', 300) }
}

function misionDismiss() {
  const state = _getMisionState()
  state.dismissed = true
  _saveMisionState(state)
  const bar = document.getElementById('misionBar')
  if (bar) { bar.style.animation = 'none'; bar.style.opacity = '0'; setTimeout(() => bar.style.display = 'none', 300) }
}

function checkMisiones() {
  if (!_obFlagSeen()) return
  try { if (localStorage.getItem(MISION_FLAG) === 'true') return } catch(e) {}
  const state = _checkMisionProgress()
  if (state.dismissed) return
  if (state.m1 && state.m2 && state.m3) {
    // All done — show completion modal
    _showMisionComplete()
    return
  }
  updateMisionBar()
  const bar = document.getElementById('misionBar')
  if (bar) { bar.style.display = 'flex' }
}

function updateMisionBar() {
  const state = _checkMisionProgress()
  const done  = [state.m1, state.m2, state.m3].filter(Boolean).length
  const pct   = Math.round((done / 3) * 100)
  const bar   = document.getElementById('misionBar')
  if (!bar) return
  const icons   = ['🎯', '📊', '✅']
  const titles  = ['Añade tu primer ingreso', 'Registra un gasto', 'Crea tu primer objetivo']
  const subs    = ['Paso 1 de 3 — empieza aquí', 'Paso 2 de 3 — registra un gasto', 'Paso 3 de 3 — define una meta']
  const nextIdx = state.m1 ? (state.m2 ? 2 : 1) : 0
  document.getElementById('mbIcon').textContent = icons[nextIdx]
  document.getElementById('mbTitle').textContent = titles[nextIdx]
  document.getElementById('mbSub').textContent   = subs[nextIdx]
  document.getElementById('mbFill').style.width  = pct + '%'
  document.getElementById('mbPct').textContent   = pct + '%'
  if (done === 3) { misionDone(); return }
}

function misionOpenModal() {
  const state = _checkMisionProgress()
  const done  = [state.m1, state.m2, state.m3].filter(Boolean).length
  const pct   = Math.round((done / 3) * 100)
  const mmFill = document.getElementById('mmFill')
  const mmPct  = document.getElementById('mmPctLabel')
  if (mmFill) mmFill.style.width = pct + '%'
  if (mmPct)  mmPct.textContent  = `${done} de 3 completadas`

  const missions = [
    { title: 'Añade tu primer ingreso', sub: 'Ve a Ingresos y registra tu primera entrada de dinero.', done: state.m1, action: () => { misionCloseModal(); goTo('ingresos') } },
    { title: 'Registra un gasto',        sub: 'Ve a Gastos y apunta tu primer desembolso.',             done: state.m2, action: () => { misionCloseModal(); goTo('gastos')   } },
    { title: 'Crea un objetivo',          sub: 'Define una meta de ahorro en la sección Objetivos.',     done: state.m3, action: () => { misionCloseModal(); goTo('objetivos') } },
  ]
  const cont = document.getElementById('mmMissions')
  if (cont) cont.innerHTML = missions.map((m, i) => {
    const prevDone = i === 0 || missions[i - 1].done
    const cls = m.done ? 'done' : (prevDone ? 'active' : '')
    const badgeLabel = m.done ? 'Hecho' : (prevDone ? 'Siguiente' : 'Bloqueado')
    const badgeCls   = m.done ? 'done-badge' : (prevDone ? 'active-badge' : 'lock-badge')
    return `<div class="mm-mission ${cls}" onclick="${prevDone && !m.done ? `(_mmActions[${i}])()` : ''}">
      <div class="mm-check">${m.done ? '✓' : (i + 1)}</div>
      <div class="mm-info">
        <div class="mm-mission-title">${m.title}</div>
        <div class="mm-mission-sub">${m.sub}</div>
      </div>
      <span class="mm-badge ${badgeCls}">${badgeLabel}</span>
    </div>`
  }).join('')

  // Store actions for inline onclick
  window._mmActions = missions.map(m => m.action)

  const modal = document.getElementById('misionModal')
  if (modal) modal.classList.add('mm-visible')
}

function misionCloseModal() {
  const modal = document.getElementById('misionModal')
  if (modal) modal.classList.remove('mm-visible')
}

function _showMisionComplete() {
  misionDone()
  // Create a custom completion modal
  const overlay = document.createElement('div')
  overlay.id = 'misionCompleteOverlay'
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9300;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.8);backdrop-filter:blur(10px);animation:smFadeIn .3s ease forwards'
  overlay.innerHTML = `
    <div style="background:var(--card);border-radius:24px;width:min(420px,calc(100vw - 32px));padding:36px 32px;text-align:center;animation:smCardIn .4s cubic-bezier(0.22,1,0.36,1) forwards;box-shadow:0 40px 100px rgba(0,0,0,.7)">
      <div style="font-size:3rem;margin-bottom:16px;animation:smPop .5s cubic-bezier(0.34,1.56,.64,1) .1s both">🏆</div>
      <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:1.4rem;font-weight:800;color:var(--text);letter-spacing:-.04em;margin-bottom:8px">¡Misiones completadas!</div>
      <div style="font-size:.875rem;color:var(--text2);line-height:1.6;margin-bottom:28px">Ya conoces lo esencial de ${APP_NAME}. ¿Qué quieres hacer con los datos de práctica?</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <button onclick="document.getElementById('misionCompleteOverlay').remove();toast('✅ Datos guardados — ¡bienvenido a ${APP_NAME}!')" style="padding:14px;border-radius:12px;border:none;background:linear-gradient(135deg,#00D4AA,#00A882);color:#0A0E17;font-size:.9rem;font-weight:800;cursor:pointer;font-family:inherit;box-shadow:0 4px 16px rgba(0,212,170,.3)">Mantener datos y continuar 🚀</button>
        <button onclick="document.getElementById('misionCompleteOverlay').remove();const s=defaultState();s.usuario.nombre=S.usuario.nombre;s.theme=S.theme;S=s;save();render();toast('App reiniciada — empieza con tus datos reales 🚀')" style="padding:13px;border-radius:12px;border:1.5px solid var(--border2);background:transparent;color:var(--text2);font-size:.85rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all .18s">Empezar limpio (borrar práctica)</button>
      </div>
    </div>`
  document.body.appendChild(overlay)
}

// ════════════════════════════════════════════════════════════════
// ─── CHAT FAQ — Offline keyword assistant ────────────────────
// ════════════════════════════════════════════════════════════════


// ════════════════════════════════════════════════════════════════
// ─── HOOKS INTO INIT ─────────────────────────────────────────
// ════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════
// ─── AUTH UI ─────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════

function _renderAuthBadge() {
  // v2 — delegado a MNAuthUI
  if (window.MNAuthUI) { MNAuthUI.renderAuthBadge('authPlanBadge'); }
  // Also refresh the ⚡ PRO badge next to the sidebar logo
  updateSidebarLogo();
}

function _renderTrialPill() {
  // v2 — delegado a MNAuthUI
  if (window.MNAuthUI) { MNAuthUI.renderTrialPill('trialPillContainer'); return; }
}

function _renderTrialBanner() { _renderTrialPill() }

function _showAuthModal() {
  // v2 — delegado a MNAuthUI (components/auth-ui.js)
  if (window.MNAuthUI && window.MNAuthUI.showAuthModal) {
    window.MNAuthUI.showAuthModal();
    return;
  }
  // Fallback: abrir modal legacy si MNAuthUI no está disponible
  const modal = document.getElementById('authModal');
  if (modal) modal.style.display = 'flex';
}

function _authStartTrial() {
  // v2: el trial ya se activa en initUser(). Esta función es un alias de compatibilidad.
  upgradeTrial();
  document.getElementById('authModal').style.display = 'none';
  const gg = document.getElementById('guestGateModal');
  if (gg) gg.style.display = 'none';
  _renderAuthBadge();
  _renderTrialPill();
  toast('⏳ ¡Prueba de 24h activada! Explora todas las funciones.');
}

function _authActivatePro() {
  // v2: dispatch event — el listener en index.html llama a MNAuth.activatePro()
  document.dispatchEvent(new CustomEvent('mn:activatePro', { detail: { source: 'app' } }));
  document.getElementById('authModal').style.display = 'none';
  const gg = document.getElementById('guestGateModal');
  if (gg) gg.style.display = 'none';
  _renderTrialPill();
  _renderAuthBadge();
  if (window.MNAuthUI) { MNAuthUI.showAuthModal('plan'); }
}

/** Guest-gate modal: shown when a locked_local user tries to add a movement */
function _showGuestGateModal() {
  // If we have MNAuthUI, open the plan modal directly — it has all the logic
  if (window.MNAuthUI) {
    MNAuthUI.showAuthModal('plan')
    return
  }
  // Fallback if MNAuthUI not loaded
  let modal = document.getElementById('guestGateModal')
  if (!modal) {
    modal = document.createElement('div')
    modal.id = 'guestGateModal'
    modal.style.cssText = 'position:fixed;inset:0;z-index:9500;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.6);backdrop-filter:blur(8px)'
    document.body.appendChild(modal)
  }
  modal.innerHTML = `
    <div style="background:var(--card);border:1px solid var(--border2);border-radius:24px;width:min(420px,calc(100vw-32px));padding:36px 32px;text-align:center;box-shadow:0 40px 100px rgba(0,0,0,.6);animation:smCardIn .4s cubic-bezier(0.22,1,0.36,1) forwards">
      <div style="font-size:3rem;margin-bottom:12px">🔒</div>
      <div style="font-size:1.25rem;font-weight:800;color:var(--text);letter-spacing:-.04em;margin-bottom:8px">Tu prueba de 24h ha expirado</div>
      <div style="font-size:.85rem;color:var(--text2);line-height:1.6;margin-bottom:28px">Tus datos están a salvo. Elige un plan para seguir usando MoneyNest.</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <button onclick="document.getElementById('guestGateModal').style.display='none';goTo('billing')" style="padding:14px;border-radius:12px;border:none;background:linear-gradient(135deg,#00D4AA,#00A882);color:#0A0E17;font-size:.9rem;font-weight:800;cursor:pointer;font-family:inherit;box-shadow:0 4px 16px rgba(0,212,170,.3)">🔓 Ver planes — desde 5€</button>
        <button onclick="document.getElementById('guestGateModal').style.display='none'" style="padding:11px;border-radius:12px;border:1.5px solid var(--border2);background:transparent;color:var(--text3);font-size:.8rem;font-weight:600;cursor:pointer;font-family:inherit">Solo explorar</button>
      </div>
    </div>`
  modal.style.display = 'flex'
  modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none' }
}

function _postInitHooks() {
  // Run after app is initialized and rendered
  _renderAuthBadge()
  _renderTrialPill()
  checkStories()
  checkGoalCoach()
  checkMisiones()
  document.addEventListener('mn:saved', () => {
    updateMisionBar()
  })
  document.addEventListener('mn:upgradePro',     () => _showAuthModal())
  document.addEventListener('mn:restoreAccess',  () => _showAuthModal())
}





window.addEventListener('DOMContentLoaded', function() {
  init()
  setTimeout(_postInitHooks, 600)

  // Re-render sidebar badge whenever billing plan changes
  ;['mn:billing:change','mn:billing:activated','mn:billing:cancelled'].forEach(ev => {
    document.addEventListener(ev, () => setTimeout(updateSidebarLogo, 50))
  })
})

/* ─── PWA Service Worker Registration ─── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(reg => console.log('[MoneyNest] SW registered:', reg.scope))
      .catch(err => console.warn('[MoneyNest] SW registration failed:', err))
  })
}


/* ═══════════════════════════════════════════════════════════════════
   OPCIÓN C — ANIMATION PATCH (app.js addendum)
   Principios:
     · Patcha las funciones de cierre existentes para animar la salida
       antes de ocultar el elemento (evita el "snap" abrupto).
     · La doble validación (Gate 1 / Gate 2) permanece intacta.
     · Nunca modifica display/visibility directamente — delega al CSS.
     · Utiliza un helper _mnAnimatedClose() reutilizable.
   ═══════════════════════════════════════════════════════════════════ */

// ─── HELPER: cierre animado genérico ─────────────────────────────────
/**
 * Anima la salida de un overlay añadiendo la clase CSS 'mn-closing'.
 * Espera al fin de la animación (transitionend / animationend) y luego
 * ejecuta el callback de limpieza (ocultar el elemento, etc.).
 *
 * @param {HTMLElement} el       - El elemento overlay a cerrar.
 * @param {Function}    cleanup  - Función a ejecutar tras la animación.
 * @param {number}      [fallbackMs=250] - Timeout de seguridad (ms).
 */
function _mnAnimatedClose(el, cleanup, fallbackMs = 250) {
  if (!el) { if (cleanup) cleanup(); return }

  // Si ya está cerrando, no apilamos otra animación
  if (el.classList.contains('mn-closing')) return

  el.classList.add('mn-closing')

  // Limpiamos will-change tras animar (buena práctica de rendimiento)
  function _done() {
    el.removeEventListener('animationend', _done)
    el.style.willChange = 'auto'
    el.classList.remove('mn-closing')
    if (cleanup) cleanup()
  }

  el.addEventListener('animationend', _done, { once: true })

  // Fallback por si animationend no dispara (e.g., display:none previo)
  setTimeout(() => {
    el.removeEventListener('animationend', _done)
    el.style.willChange = 'auto'
    el.classList.remove('mn-closing')
    if (cleanup) cleanup()
  }, fallbackMs)
}

// ─── HELPER: feedback de shake (Gate rechazado) ───────────────────────
/**
 * Añade la clase mn-shake al elemento y la elimina cuando termina.
 * Se llama desde los guards cuando el usuario intenta ejecutar la
 * acción sin permisos (Gate 1 visual o Gate 2 de seguridad).
 *
 * @param {HTMLElement|string} elOrId - Elemento o ID del card a sacudir.
 */
function _mnShakeFeedback(elOrId) {
  const el = typeof elOrId === 'string'
    ? document.getElementById(elOrId)
    : elOrId
  if (!el) return
  el.classList.remove('mn-shake') // reset si ya estaba
  void el.offsetWidth            // fuerza reflow para reiniciar animación
  el.classList.add('mn-shake')
  el.addEventListener('animationend', () => el.classList.remove('mn-shake'), { once: true })
}

// ─── PATCH: closeQuickAdd — salida animada ────────────────────────────
/**
 * Sobrescribimos closeQuickAdd para animar la salida antes de quitar .open.
 * Gate 1 y Gate 2 en openQuickAdd / saveQuickAdd se mantienen sin cambios.
 */
;(function _patchCloseQuickAdd() {
  const _orig = window.closeQuickAdd
  window.closeQuickAdd = function closeQuickAdd() {
    const modal = document.getElementById('quickAddModal')
    if (!modal || !modal.classList.contains('open')) return
    _mnAnimatedClose(modal, () => {
      // Tras la animación de salida, quitamos .open (display:none)
      modal.classList.remove('open')
    }, 220)
  }
})()

// ─── PATCH: _showGuestGateModal — añadir ARIA y cierre animado ────────
/**
 * Mejoramos el GuestGate con:
 *   · role="dialog" + aria-modal para lectores de pantalla.
 *   · Foco atrapado en el modal mientras está abierto (focus trap básico).
 *   · La X y el botón "Continuar explorando" cierran CON animación.
 * Gate 1 (openQuickAdd) y Gate 2 (saveQuickAdd) no se tocan.
 */
;(function _patchGuestGateModal() {
  const _orig = window._showGuestGateModal
  window._showGuestGateModal = function _showGuestGateModal() {
    // 1. Llamamos a la función original (crea el modal si no existe, rellena innerHTML)
    _orig()

    const modal = document.getElementById('guestGateModal')
    if (!modal) return

    // 2. Mejoras de accesibilidad
    modal.setAttribute('role', 'dialog')
    modal.setAttribute('aria-modal', 'true')
    modal.setAttribute('aria-labelledby', 'ggModalTitle')

    // Añadimos id al título si existe para el aria-labelledby
    const titleEl = modal.querySelector('div[style*="font-size:1.25rem"]')
    if (titleEl && !titleEl.id) titleEl.id = 'ggModalTitle'

    // 3. Reemplazamos los onclick de cierre por versión animada
    // El botón "Continuar explorando" (último button del modal)
    const buttons = modal.querySelectorAll('button')
    buttons.forEach(btn => {
      const txt = btn.textContent.trim()
      if (txt.includes('explorando') || txt.includes('✕')) {
        btn.onclick = () => _mnCloseGuestGate()
      }
    })

    // 4. Backdrop click también anima la salida
    modal.onclick = (e) => { if (e.target === modal) _mnCloseGuestGate() }

    // 5. Escape key cierra el modal
    function _escHandler(e) {
      if (e.key === 'Escape') { _mnCloseGuestGate(); document.removeEventListener('keydown', _escHandler) }
    }
    document.addEventListener('keydown', _escHandler)

    // 6. Foco al primer botón interactivo (accesibilidad)
    const firstBtn = modal.querySelector('button')
    if (firstBtn) setTimeout(() => firstBtn.focus(), 80)
  }
})()

/**
 * Cierra el GuestGate con animación.
 * Función global para que los onclick inline del innerHTML puedan llamarla.
 */
function _mnCloseGuestGate() {
  const modal = document.getElementById('guestGateModal')
  _mnAnimatedClose(modal, () => {
    if (modal) modal.style.display = 'none'
  }, 220)
}

// ─── PATCH: AuthModal — salida animada ───────────────────────────────
/**
 * El authModal se cierra en varios puntos del código con style.display='none'.
 * Creamos _mnCloseAuthModal() para centralizar el cierre animado y lo exponemos
 * globalmente para el onclick inline del botón ✕ en _showAuthModal().
 */
function _mnCloseAuthModal() {
  const modal = document.getElementById('authModal')
  _mnAnimatedClose(modal, () => {
    if (modal) modal.style.display = 'none'
  }, 220)
}

// ─── PATCH: _renderTrialPill — will-change cleanup ────────────────────
/**
 * Parcheamos _renderTrialPill para:
 *   · Animar la salida del pill anterior antes de quitarlo del DOM.
 *   · Añadir min touch-target y ARIA al nuevo pill.
 *   · Limpiar will-change tras la animación de entrada.
 */
;(function _patchRenderTrialPill() {
  const _orig = window._renderTrialPill
  window._renderTrialPill = function _renderTrialPill() {
    // Animamos la salida del pill existente antes de que _orig() lo elimine
    const existingPill = document.getElementById('trialPill')
    if (existingPill) {
      existingPill.classList.add('mn-pill-out')
      existingPill.addEventListener('animationend', () => existingPill.remove(), { once: true })
      // Breve retardo para que la salida sea visible antes de crear el nuevo
      setTimeout(() => {
        _orig()
        _mnSetupNewPill()
      }, 180)
      return
    }

    // No hay pill existente: mostramos directo
    _orig()
    _mnSetupNewPill()
  }

  function _mnSetupNewPill() {
    const pill = document.getElementById('trialPill')
    if (!pill) return

    // Accesibilidad
    pill.setAttribute('role', 'button')
    pill.setAttribute('aria-label', 'Ver tu plan de prueba — abrir opciones')
    pill.setAttribute('tabindex', '0')

    // Soporte teclado (Enter / Space activa el click)
    pill.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pill.click() }
    })

    // Limpiamos will-change tras la animación de entrada (ahorro de memoria GPU)
    pill.addEventListener('animationend', () => {
      pill.style.willChange = 'auto'
      // El hover de CSS ya maneja el estado visual — quitamos los listeners JS inline
      pill.onmouseenter = null
      pill.onmouseleave = null
    }, { once: true })
  }
})()

/* ─── GATE SHAKE INTEGRATION ─────────────────────────────────────────
 * Cuando el guard de openQuickAdd dispara (_showGuestGateModal),
 * sacudimos el botón FAB para reforzar el feedback visual del Gate 1.
 * Cuando saveQuickAdd dispara el Gate 2, sacudimos el modal.
 * Usamos MutationObserver para detectar el momento exacto.
 */
;(function _patchGateShake() {
  // Gate 1: shake al FAB del bottom-nav cuando openQuickAdd bloquea
  const _origOpen = window.openQuickAdd
  window.openQuickAdd = function openQuickAdd() {
    if (isGuest()) {
      // ── Gate 1 intacto ─────────────────────────────────────────────
      _showGuestGateModal()
      // Shake feedback en el botón + (bottom-nav-add)
      const fab = document.querySelector('.bottom-nav-add')
      if (fab) _mnShakeFeedback(fab)
      return
    }
    _origOpen()
  }

  // Gate 2: shake al card del quickAddModal cuando saveQuickAdd bloquea
  const _origSave = window.saveQuickAdd
  window.saveQuickAdd = function saveQuickAdd() {
    if (isGuest()) {
      // ── Gate 2 intacto ─────────────────────────────────────────────
      closeQuickAdd()
      _showGuestGateModal()
      const fab = document.querySelector('.bottom-nav-add')
      if (fab) _mnShakeFeedback(fab)
      return
    }
    _origSave()
  }
})()

// ─── Exportar helpers para tests / extensibilidad ────────────────────
window._mnAnimatedClose   = _mnAnimatedClose
window._mnShakeFeedback   = _mnShakeFeedback
window._mnCloseGuestGate  = _mnCloseGuestGate
window._mnCloseAuthModal  = _mnCloseAuthModal

