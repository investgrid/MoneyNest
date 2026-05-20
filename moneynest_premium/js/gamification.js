/**
 * MoneyNest — js/gamification.js
 * Achievements, streak system, confetti. Completely self-contained.
 */
;(function () {
  'use strict';

  const STORE_KEY  = 'mn_achievements';
  const STREAK_KEY = 'mn_streak';

  // ─── Achievement definitions — nombres y descs via t() ───────────
  function _ach() {
    const _w = (k, fb) => (typeof window.t === 'function' ? window.t(k) || fb : fb);
    return [
      // ── Primeros pasos (6) ──
      { id:'primer_ingreso',      emoji:'💰', cat:'inicio',    get nombre(){ return _w('ach_primer_ingreso_n','Primer ingreso') },         get desc(){ return _w('ach_primer_ingreso_d','Añade tu primer ingreso') }},
      { id:'primer_gasto',        emoji:'📝', cat:'inicio',    get nombre(){ return _w('ach_primer_gasto_n','Primer gasto') },             get desc(){ return _w('ach_primer_gasto_d','Registra tu primer gasto') }},
      { id:'primera_deuda',       emoji:'💳', cat:'inicio',    get nombre(){ return _w('ach_primera_deuda_n','Deuda registrada') },        get desc(){ return _w('ach_primera_deuda_d','Registra tu primera deuda') }},
      { id:'primera_inversion',   emoji:'📈', cat:'inicio',    get nombre(){ return _w('ach_primera_inv_n','Inversor') },                  get desc(){ return _w('ach_primera_inv_d','Crea tu primera inversión') }},
      { id:'primer_objetivo',     emoji:'🎯', cat:'inicio',    get nombre(){ return _w('ach_primer_obj_n','Soñador') },                    get desc(){ return _w('ach_primer_obj_d','Crea tu primer objetivo de ahorro') }},
      { id:'primer_presupuesto',  emoji:'📋', cat:'inicio',    get nombre(){ return _w('ach_primer_pres_n','Planificador') },              get desc(){ return _w('ach_primer_pres_d','Crea tu primer presupuesto') }},

      // ── Ingresos (5) ──
      { id:'diez_ingresos',       emoji:'💵', cat:'ingresos',  get nombre(){ return _w('ach_diez_ing_n','Flujo constante') },              get desc(){ return _w('ach_diez_ing_d','10 ingresos registrados') }},
      { id:'ingreso_recurrente',  emoji:'🔄', cat:'ingresos',  get nombre(){ return _w('ach_ing_rec_n','Ingresos automáticos') },          get desc(){ return _w('ach_ing_rec_d','Crea tu primer ingreso recurrente') }},
      { id:'cinco_categorias_ing',emoji:'🏷️', cat:'ingresos',  get nombre(){ return _w('ach_5cat_ing_n','Ingresos diversificados') },      get desc(){ return _w('ach_5cat_ing_d','Usa 5 categorías diferentes de ingresos') }},
      { id:'ingreso_grande',      emoji:'💎', cat:'ingresos',  get nombre(){ return _w('ach_ing_grande_n','Golpe maestro') },              get desc(){ return _w('ach_ing_grande_d','Registra un ingreso de +5.000€') }},
      { id:'mes_record_ingresos', emoji:'🚀', cat:'ingresos',  get nombre(){ return _w('ach_mes_record_n','Mes récord') },                 get desc(){ return _w('ach_mes_record_d','Tu mejor mes de ingresos') }},

      // ── Gastos (6) ──
      { id:'cincuenta_gastos',    emoji:'🧾', cat:'gastos',    get nombre(){ return _w('ach_cincuenta_gas_n','Detallista') },              get desc(){ return _w('ach_cincuenta_gas_d','50 gastos registrados') }},
      { id:'presupuesto_cumplido',emoji:'✅', cat:'gastos',    get nombre(){ return _w('ach_pres_ok_n','Bajo control') },                  get desc(){ return _w('ach_pres_ok_d','Respeta un presupuesto todo el mes') }},
      { id:'tres_presupuestos',   emoji:'📊', cat:'gastos',    get nombre(){ return _w('ach_3pres_n','Maestro del presupuesto') },         get desc(){ return _w('ach_3pres_d','Crea 3 o más presupuestos') }},
      { id:'gasto_eliminado',     emoji:'🗑️', cat:'gastos',    get nombre(){ return _w('ach_gas_del_n','Corrector') },                     get desc(){ return _w('ach_gas_del_d','Elimina o edita un gasto') }},
      { id:'mes_austero',         emoji:'🌱', cat:'gastos',    get nombre(){ return _w('ach_austero_n','Mes austero') },                   get desc(){ return _w('ach_austero_d','Gastos <50% de tus ingresos') }},
      { id:'gasto_recurrente',    emoji:'🔁', cat:'gastos',    get nombre(){ return _w('ach_gas_rec_n','Suscriptor') },                    get desc(){ return _w('ach_gas_rec_d','Registra un gasto recurrente') }},

      // ── Inversiones (7) ──
      { id:'cinco_inversiones',   emoji:'🏦', cat:'inversiones',get nombre(){ return _w('ach_cinco_inv_n','Cartera diversificada') },      get desc(){ return _w('ach_cinco_inv_d','5 inversiones activas') }},
      { id:'inversion_liquidada', emoji:'💰', cat:'inversiones',get nombre(){ return _w('ach_inv_liq_n','Cobrador') },                      get desc(){ return _w('ach_inv_liq_d','Liquida tu primera inversión') }},
      { id:'ganancia_positiva',   emoji:'📈', cat:'inversiones',get nombre(){ return _w('ach_gan_pos_n','En ganancias') },                 get desc(){ return _w('ach_gan_pos_d','Liquida una inversión con ROI positivo') }},
      { id:'diez_inversiones',    emoji:'💼', cat:'inversiones',get nombre(){ return _w('ach_10inv_n','Portfolio profesional') },          get desc(){ return _w('ach_10inv_d','10 inversiones registradas') }},
      { id:'roi_chart',           emoji:'📊', cat:'inversiones',get nombre(){ return _w('ach_roi_n','Analista de ROI') },                   get desc(){ return _w('ach_roi_d','Consulta el gráfico de ROI') }},
      { id:'cinco_categorias_inv',emoji:'🎯', cat:'inversiones',get nombre(){ return _w('ach_5cat_inv_n','Inversor diversificado') },      get desc(){ return _w('ach_5cat_inv_d','Invierte en 5 categorías diferentes') }},
      { id:'inversion_cripto',    emoji:'₿', cat:'inversiones', get nombre(){ return _w('ach_cripto_n','Cripto trader') },                  get desc(){ return _w('ach_cripto_d','Registra una inversión en cripto') }},

      // ── Deudas (5) ──
      { id:'primera_deuda',       emoji:'💳', cat:'deudas',    get nombre(){ return _w('ach_primera_deuda_n','Deuda registrada') },        get desc(){ return _w('ach_primera_deuda_d','Registra tu primera deuda') }},
      { id:'pago_deuda',          emoji:'💸', cat:'deudas',    get nombre(){ return _w('ach_pago_deuda_n','Pagador') },                    get desc(){ return _w('ach_pago_deuda_d','Registra un pago a una deuda') }},
      { id:'deuda_saldada',       emoji:'🎉', cat:'deudas',    get nombre(){ return _w('ach_deuda_ok_n','Deuda saldada') },                get desc(){ return _w('ach_deuda_ok_d','Paga completamente una deuda') }},
      { id:'sin_deudas',          emoji:'🏆', cat:'deudas',    get nombre(){ return _w('ach_sin_deudas_n','Libre de deudas') },            get desc(){ return _w('ach_sin_deudas_d','Todas tus deudas en cero') }},
      { id:'estrategia_deuda',    emoji:'🧠', cat:'deudas',    get nombre(){ return _w('ach_estrategia_n','Estratega') },                  get desc(){ return _w('ach_estrategia_d','Usa el simulador de pago de deudas') }},

      // ── Objetivos (6) ──
      { id:'cinco_objetivos',     emoji:'🌟', cat:'objetivos', get nombre(){ return _w('ach_cinco_obj_n','Ambicioso') },                   get desc(){ return _w('ach_cinco_obj_d','5 objetivos de ahorro creados') }},
      { id:'objetivo_completado', emoji:'✅', cat:'objetivos', get nombre(){ return _w('ach_obj_completado_n','Meta alcanzada') },         get desc(){ return _w('ach_obj_completado_d','Completa tu primer objetivo') }},
      { id:'tres_obj_completos',  emoji:'🏅', cat:'objetivos', get nombre(){ return _w('ach_3obj_n','Alcanzador serial') },                get desc(){ return _w('ach_3obj_d','Completa 3 objetivos de ahorro') }},
      { id:'aportacion_objetivo', emoji:'💵', cat:'objetivos', get nombre(){ return _w('ach_aport_n','Aportador') },                        get desc(){ return _w('ach_aport_d','Haz una aportación a un objetivo') }},
      { id:'objetivo_grande',     emoji:'🎯', cat:'objetivos', get nombre(){ return _w('ach_obj_grande_n','Gran ambición') },              get desc(){ return _w('ach_obj_grande_d','Crea un objetivo de +10.000€') }},
      { id:'objetivo_rapido',     emoji:'⚡', cat:'objetivos', get nombre(){ return _w('ach_obj_rapido_n','Velocista') },                  get desc(){ return _w('ach_obj_rapido_d','Completa un objetivo en <30 días') }},

      // ── Patrimonio & Cuentas (5) ──
      { id:'tres_cuentas',        emoji:'🏛️', cat:'patrimonio',get nombre(){ return _w('ach_tres_cuentas_n','Multibanco') },              get desc(){ return _w('ach_tres_cuentas_d','3 o más cuentas gestionadas') }},
      { id:'patrimonio_10k',      emoji:'💎', cat:'patrimonio',get nombre(){ return _w('ach_patr_10k_n','10K club') },                     get desc(){ return _w('ach_patr_10k_d','Patrimonio neto supera 10.000€') }},
      { id:'patrimonio_50k',      emoji:'👑', cat:'patrimonio',get nombre(){ return _w('ach_patr_50k_n','50K club') },                     get desc(){ return _w('ach_patr_50k_d','Patrimonio neto supera 50.000€') }},
      { id:'saldo_positivo',      emoji:'📊', cat:'patrimonio',get nombre(){ return _w('ach_saldo_pos_n','En positivo') },                 get desc(){ return _w('ach_saldo_pos_d','Cash flow positivo este mes') }},
      { id:'activo_fisico',       emoji:'🏠', cat:'patrimonio',get nombre(){ return _w('ach_activo_n','Propietario') },                    get desc(){ return _w('ach_activo_d','Registra un activo físico') }},

      // ── Constancia (5) ──
      { id:'streak_7',            emoji:'🔥', cat:'constancia',get nombre(){ return _w('ach_streak_7_n','Una semana seguida') },           get desc(){ return _w('ach_streak_7_d','7 días de racha de uso') }},
      { id:'streak_30',           emoji:'💎', cat:'constancia',get nombre(){ return _w('ach_streak_30_n','Un mes de racha') },             get desc(){ return _w('ach_streak_30_d','30 días de racha de uso') }},
      { id:'streak_100',          emoji:'👑', cat:'constancia',get nombre(){ return _w('ach_streak_100_n','Centenario') },                 get desc(){ return _w('ach_streak_100_d','100 días de racha — imparable') }},
      { id:'ahorrador_3meses',    emoji:'🌱', cat:'constancia',get nombre(){ return _w('ach_ahorrador_3m_n','Ahorrador constante') },      get desc(){ return _w('ach_ahorrador_3m_d','3 meses con ahorro positivo') }},
      { id:'ahorrador_6meses',    emoji:'🌳', cat:'constancia',get nombre(){ return _w('ach_ahorrador_6m_n','Raíces profundas') },         get desc(){ return _w('ach_ahorrador_6m_d','6 meses con ahorro positivo') }},

      // ── Herramientas Pro (7) ──
      { id:'exportador_pdf',      emoji:'📄', cat:'pro',       get nombre(){ return _w('ach_pdf_n','PDF Master') },                        get desc(){ return _w('ach_pdf_d','Primera exportación PDF') }},
      { id:'exportador_excel',    emoji:'📊', cat:'pro',       get nombre(){ return _w('ach_excel_n','Excel Pro') },                       get desc(){ return _w('ach_excel_d','Primera exportación Excel') }},
      { id:'personalizado',       emoji:'✨', cat:'pro',       get nombre(){ return _w('ach_personalizado_n','A tu manera') },            get desc(){ return _w('ach_personalizado_d','Crea una categoría personalizada') }},
      { id:'modo_demo',           emoji:'🎭', cat:'pro',       get nombre(){ return _w('ach_demo_n','Explorador demo') },                  get desc(){ return _w('ach_demo_d','Activa el modo demo') }},
      { id:'cambio_tema',         emoji:'🎨', cat:'pro',       get nombre(){ return _w('ach_tema_n','Decorador') },                        get desc(){ return _w('ach_tema_d','Cambia el tema dark/light') }},
      { id:'cambio_idioma',       emoji:'🌐', cat:'pro',       get nombre(){ return _w('ach_idioma_n','Políglota') },                      get desc(){ return _w('ach_idioma_d','Cambia el idioma de la app') }},
      { id:'chatbot_usado',       emoji:'🤖', cat:'pro',       get nombre(){ return _w('ach_chatbot_n','Asistente IA') },                  get desc(){ return _w('ach_chatbot_d','Usa el chatbot IA') }},

      // ── Explorador (6) ──
      { id:'todas_paginas',       emoji:'🗺️', cat:'explorador',get nombre(){ return _w('ach_todas_pag_n','Explorador completo') },         get desc(){ return _w('ach_todas_pag_d','Visita todas las secciones') }},
      { id:'pagina_dashboard',    emoji:'🏠', cat:'explorador',get nombre(){ return _w('ach_dashboard_n','Bienvenida') },                   get desc(){ return _w('ach_dashboard_d','Visita el Dashboard') }},
      { id:'pagina_analisis',     emoji:'📊', cat:'explorador',get nombre(){ return _w('ach_analisis_n','Analista') },                     get desc(){ return _w('ach_analisis_d','Visita la página de Análisis') }},
      { id:'pagina_patrimonio',   emoji:'💰', cat:'explorador',get nombre(){ return _w('ach_patrimonio_n','Patrimonialista') },            get desc(){ return _w('ach_patrimonio_d','Visita la página de Patrimonio') }},
      { id:'pagina_logros',       emoji:'🏆', cat:'explorador',get nombre(){ return _w('ach_logros_n','Coleccionista') },                  get desc(){ return _w('ach_logros_d','Visita la página de Logros') }},
      { id:'configuracion_vista', emoji:'⚙️', cat:'explorador',get nombre(){ return _w('ach_config_n','Configurador') },                   get desc(){ return _w('ach_config_d','Visita Configuración') }},

      // ── Especiales (5) ──
      { id:'madrugador',          emoji:'🌅', cat:'especial',  get nombre(){ return _w('ach_madrugador_n','Madrugador') },                get desc(){ return _w('ach_madrugador_d','Transacción antes de las 7am') }},
      { id:'nocturno',            emoji:'🌙', cat:'especial',  get nombre(){ return _w('ach_nocturno_n','Noctámbulo') },                  get desc(){ return _w('ach_nocturno_d','Transacción después de las 23h') }},
      { id:'fin_de_semana',       emoji:'🎉', cat:'especial',  get nombre(){ return _w('ach_fin_semana_n','Weekend warrior') },            get desc(){ return _w('ach_fin_semana_d','Usa la app un fin de semana') }},
      { id:'perfeccionista',      emoji:'💯', cat:'especial',  get nombre(){ return _w('ach_perfect_n','Perfeccionista') },                get desc(){ return _w('ach_perfect_d','Completa 100% de tus objetivos') }},
      { id:'completista',         emoji:'👑', cat:'especial',  get nombre(){ return _w('ach_completista_n','Leyenda') },                   get desc(){ return _w('ach_completista_d','Desbloquea TODOS los logros') }},
    ];
  }
  const ACHIEVEMENTS = _ach();

  // ─── Storage ──────────────────────────────────────────────────────
  function getAchievements() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY) || '{"unlocked":{},"checks":{}}');
    } catch { return { unlocked: {}, checks: {} }; }
  }

  function saveAchievements(data) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch {}
  }

  function isUnlocked(id) {
    return !!getAchievements().unlocked[id];
  }

  function unlock(id) {
    if (isUnlocked(id)) return false;
    const def = ACHIEVEMENTS.find(a => a.id === id);
    if (!def) return false;
    const store = getAchievements();
    store.unlocked[id] = { unlockedAt: Date.now(), shown: false };
    saveAchievements(store);
    _showAchievementToast(def);
    _fireConfetti();
    return true;
  }

  // ─── Check logic ─────────────────────────────────────────────────
  function checkAchievement(trigger) {
    try {
      // Use global S state if available, fall back to localStorage key mn7_data
      const data = (typeof window.S !== 'undefined' && window.S)
        ? window.S
        : (() => { try { return JSON.parse(localStorage.getItem('mn7_data') || '{}'); } catch { return {}; } })();

      // Primeros pasos
      if (trigger === 'ingreso_added' && (data.ingresos||[]).length >= 1) unlock('primer_ingreso');
      if (trigger === 'gasto_added'   && (data.gastos||[]).length   >= 1) unlock('primer_gasto');
      if (trigger === 'deuda_added'   && (data.deudas||[]).length   >= 1) unlock('primera_deuda');
      if (trigger === 'inversion_added' && (data.inversiones||[]).length >= 1) unlock('primera_inversion');
      if (trigger === 'objetivo_added'  && (data.objetivos||[]).length   >= 1) unlock('primer_objetivo');
      if (trigger === 'export_done') unlock('exportador');
      if (trigger === 'cat_created')  unlock('personalizado');
      if (trigger === 'presupuesto_added') unlock('primer_presupuesto');
      if (trigger === 'objetivo_done') unlock('objetivo_completado');
      if (trigger === 'custom_debt') unlock('estratega');
      if (trigger === 'settings_change') unlock('configurador');
      if (trigger === 'page_visit') {
        const page = data._currentPage || '';
        if (page === 'analisis') unlock('analista');
        if (page === 'patrimonio') unlock('visualizador');
      }

      if (trigger === 'deuda_updated') {
        const deudas = data.deudas || [];
        if (deudas.length > 0 && deudas.every(d => (Number(d.importeTotal) - Number(d.importePagado||0)) <= 0)) {
          unlock('sin_deudas');
        }
      }

      // Volumen
      if (trigger === 'ingreso_added') {
        if ((data.ingresos||[]).length >= 10) unlock('diez_ingresos');
        const h = new Date().getHours();
        if (h < 7) unlock('madrugador');
      }
      if (trigger === 'gasto_added') {
        if ((data.gastos||[]).length >= 50) unlock('cincuenta_gastos');
        const h = new Date().getHours();
        if (h >= 23) unlock('nocturno');
      }
      if (trigger === 'inversion_added') {
        if ((data.inversiones||[]).filter(i=>!i.cerrada).length >= 5) unlock('cinco_inversiones');
      }
      if (trigger === 'objetivo_added') {
        if ((data.objetivos||[]).length >= 5) unlock('cinco_objetivos');
      }

      if (trigger === 'data_check') _checkFinancial(data);
      if (trigger === 'streak')     _checkStreakAchievements();
    } catch(e) {
      console.warn('[MNGamification] checkAchievement error:', e);
    }
  }

  function _checkFinancial(data) {
    const gastos   = data.gastos   || [];
    const ingresos = data.ingresos || [];
    const now      = new Date();

    // Ahorrador constante — count last N months with positive cash flow
    let positive = 0;
    for (let i = 1; i <= 6; i++) {
      const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mo  = d.toISOString().slice(0, 7);
      const ing = ingresos.filter(x => (x.fecha||'').startsWith(mo)).reduce((a,x)=>a+(Number(x.importe)||0),0);
      const gas = gastos.filter(x => (x.fecha||'').startsWith(mo)).reduce((a,x)=>a+(Number(x.importe)||0),0);
      if (ing > gas) positive++;
    }
    if (positive >= 3) unlock('ahorrador_3meses');
    if (positive >= 6) unlock('ahorrador_6meses');

    // Ahorro_1000 — total en objetivos completados
    const totalAhorrado = (data.objetivos||[]).filter(o=>o.completado).reduce((a,o)=>a+(Number(o.meta)||0),0);
    if (totalAhorrado >= 1000) unlock('ahorro_1000');

    // Cash flow positivo este mes
    const thisMo  = now.toISOString().slice(0, 7);
    const ingMes  = ingresos.filter(x => (x.fecha||'').startsWith(thisMo)).reduce((a,x)=>a+(Number(x.importe)||0),0);
    const gasMes  = gastos.filter(x => (x.fecha||'').startsWith(thisMo)).reduce((a,x)=>a+(Number(x.importe)||0),0);
    const cashFlow = ingMes - gasMes;
    if (cashFlow > 0) unlock('saldo_positivo');

    // Multibanco
    if ((data.cuentas||[]).length >= 3) unlock('tres_cuentas');

    // Fin de semana activo
    const day = new Date().getDay();
    if (day === 0 || day === 6) unlock('fin_de_semana');

    // Completista — all other achievements unlocked
    const totalAchs = ACHIEVEMENTS.length;
    const unlockedCount = Object.keys(getAchievements().unlocked).length;
    // Completista itself is excluded from the count (30th achievement)
    if (unlockedCount >= totalAchs - 1) unlock('completista');
  }

  function _checkStreakAchievements() {
    const s = _getStreak();
    if (s.streak >= 7)   unlock('streak_7');
    if (s.streak >= 30)  unlock('streak_30');
    if (s.streak >= 100) unlock('streak_100');
  }

  // ─── Toast premium ───────────────────────────────────────────────
  function _showAchievementToast(def) {
    const el = document.createElement('div');
    el.style.cssText = `
      position:fixed;bottom:80px;left:50%;transform:translateX(-50%) translateY(20px);
      background:rgba(15,23,42,0.95);border:1.5px solid rgba(0,212,170,0.5);
      border-radius:16px;padding:14px 20px;z-index:99999;
      box-shadow:0 20px 60px rgba(0,0,0,.6),0 0 0 1px rgba(0,212,170,0.15);
      display:flex;align-items:center;gap:12px;
      font-family:var(--font,inherit);
      animation:mnAchIn .4s cubic-bezier(0.22,1,0.36,1) forwards;
      backdrop-filter:blur(20px);
      max-width:320px;
    `;
    el.innerHTML = `
      <div style="font-size:2rem;flex-shrink:0">${def.emoji}</div>
      <div>
        <div style="font-size:.65rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(0,212,170,.8);margin-bottom:2px">${typeof window.t==='function'?window.t('achievement_unlocked','¡Logro desbloqueado!'):'¡Logro desbloqueado!'}</div>
        <div style="font-size:.95rem;font-weight:700;color:#fff">${def.nombre}</div>
        <div style="font-size:.75rem;color:rgba(255,255,255,.5);margin-top:2px">${def.desc}</div>
      </div>
    `;
    if (!document.getElementById('mn-ach-style')) {
      const s = document.createElement('style');
      s.id = 'mn-ach-style';
      s.textContent = `
        @keyframes mnAchIn { from{opacity:0;transform:translateX(-50%) translateY(20px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes mnAchOut{ from{opacity:1;transform:translateX(-50%) translateY(0)} to{opacity:0;transform:translateX(-50%) translateY(20px)} }
      `;
      document.head.appendChild(s);
    }
    document.body.appendChild(el);
    setTimeout(() => {
      el.style.animation = 'mnAchOut .35s ease forwards';
      setTimeout(() => el.remove(), 380);
    }, 4000);
  }

  // ─── Confetti canvas ─────────────────────────────────────────────
  function _fireConfetti() {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:99998;';
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: -10,
      r: Math.random() * 6 + 3,
      d: Math.random() * 80,
      color: ['#00D4AA','#6366F1','#F59E0B','#10B981','#F472B6'][Math.floor(Math.random()*5)],
      tilt: Math.random() * 10 - 10,
      ts: Math.random() * 2,
      vy: Math.random() * 3 + 2,
    }));
    let frame = 0;
    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.y += p.vy;
        p.tilt += 0.1;
        ctx.beginPath();
        ctx.ellipse(p.x + Math.sin(p.tilt) * 10, p.y, p.r, p.r * 0.5, p.tilt, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - frame / 90);
        ctx.fill();
      });
      frame++;
      if (frame < 90) requestAnimationFrame(loop);
      else canvas.remove();
    };
    requestAnimationFrame(loop);
  }

  // ─── Achievements panel ──────────────────────────────────────────
  function _gt(k, fb) { return (typeof window.t === 'function' ? window.t(k) || fb : fb); }

  const CAT_META = {
    inicio:      { label: () => _gt('logro_cat_inicio',      'Primeros pasos'),    icon: '🚀', color: '#6366F1' },
    ingresos:    { label: () => _gt('logro_cat_ingresos',    'Ingresos'),          icon: '💰', color: '#10B981' },
    gastos:      { label: () => _gt('logro_cat_gastos',      'Gastos'),            icon: '💸', color: '#F59E0B' },
    inversiones: { label: () => _gt('logro_cat_inversiones', 'Inversiones'),       icon: '📈', color: '#00D4AA' },
    deudas:      { label: () => _gt('logro_cat_deudas',      'Deudas'),            icon: '💳', color: '#F43F5E' },
    objetivos:   { label: () => _gt('logro_cat_objetivos',   'Objetivos'),         icon: '🎯', color: '#8B5CF6' },
    patrimonio:  { label: () => _gt('logro_cat_patrimonio',  'Patrimonio'),        icon: '🏦', color: '#0EA5E9' },
    constancia:  { label: () => _gt('logro_cat_constancia',  'Constancia'),        icon: '🔥', color: '#F97316' },
    pro:         { label: () => _gt('logro_cat_pro',         'Herramientas Pro'),  icon: '⚡', color: '#A855F7' },
    explorador:  { label: () => _gt('logro_cat_explorador',  'Explorador'),        icon: '🧭', color: '#3B82F6' },
    especial:    { label: () => _gt('logro_cat_especial',    'Especiales'),        icon: '✨', color: '#EC4899' },
  };

  // ─── Achievement guides (roadmap + steps) ────────────────────────
  const ACH_GUIDES = {
    primer_ingreso:      { steps: ['Pulsa el botón "+" en la barra inferior', 'Selecciona "Ingreso"', 'Rellena importe y concepto', 'Guarda'] },
    primer_gasto:        { steps: ['Pulsa el botón "+" en la barra inferior', 'Selecciona "Gasto"', 'Rellena importe y categoría', 'Guarda'] },
    primera_deuda:       { steps: ['Ve a la sección "Deudas"', 'Pulsa "+ Nueva deuda"', 'Introduce los datos: nombre, importe, interés', 'Guarda'] },
    primera_inversion:   { steps: ['Ve a la sección "Inversiones"', 'Pulsa "+ Nueva inversión"', 'Configura tipo, importe y fecha', 'Guarda'] },
    primer_objetivo:     { steps: ['Ve a la sección "Objetivos"', 'Pulsa "+ Nuevo objetivo"', 'Define meta, plazo y aportación mensual', 'Guarda'] },
    primer_presupuesto:  { steps: ['Ve a "Objetivos" → pestaña "Presupuestos"', 'Pulsa "Crear presupuesto"', 'Asigna límite por categoría', 'Activa'] },
    streak_7:            { steps: ['Abre MoneyNest cada día', 'Registra al menos 1 transacción', 'No dejes pasar ningún día', 'Mantén la racha viva'] },
    diez_ingresos:       { steps: ['Registra tus ingresos regularmente', 'Incluye salario, freelance, inversiones, etc.', 'Alcanza 10 registros totales'] },
    cincuenta_gastos:    { steps: ['Registra todos tus gastos diarios', 'Categoriza correctamente', 'Sé constante — cada compra cuenta', 'Llega a 50'] },
    sin_deudas:          { steps: ['Ve a "Deudas"', 'Registra pagos en cada deuda', 'Sigue una estrategia (Avalancha/Bola de nieve)', 'Salda todas'] },
    objetivo_completado: { steps: ['Crea un objetivo realista', 'Aporta regularmente', 'Marca como "Completado" cuando llegues a la meta'] },
    exportador:          { steps: ['Ve a Dashboard', 'Pulsa el botón "Exportar"', 'Elige PDF o Excel', 'Descarga tu reporte'] },
    analista:            { steps: ['Pulsa en "Análisis" desde el menú lateral', 'Explora gráficos, KPIs y proyecciones'] },
    visualizador:        { steps: ['Pulsa en "Patrimonio" desde el menú', 'Observa tu evolución de activos y pasivos'] },
    estratega:           { steps: ['Ve a "Deudas"', 'Pulsa "Crear estrategia" (4ª tarjeta)', 'Introduce tu pago mensual personalizado', 'Guarda'] },
    configurador:        { steps: ['Ve a "Configuración"', 'Cambia el tema (claro/oscuro) o el idioma', 'Los cambios se aplican automáticamente'] },
    completista:         { steps: ['Desbloquea los 29 logros anteriores', 'Explora todas las secciones de MoneyNest', 'Usa todas las funcionalidades', '¡Serás un maestro!'] },
  };

  function renderAchievementsPanel(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const store    = getAchievements();
    const unlocked = Object.keys(store.unlocked).length;
    const pct      = Math.round(unlocked / ACHIEVEMENTS.length * 100);

    // Group by category
    const groups = {};
    for (const a of ACHIEVEMENTS) {
      const cat = a.cat || 'especial';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(a);
    }

    // Render single achievement card (GRID style like before)
    function renderAchCard(a) {
      const done = !!store.unlocked[a.id];
      const guide = ACH_GUIDES[a.id] || {};
      const guideText = guide.tip || _gt(`ach_${a.id}_guide`, 'Toca para saber cómo');
      return `
        <div class="mn-ach-card ${done?'mn-ach-done':''}">
          <div class="mn-ach-emoji">${a.emoji}</div>
          <div class="mn-ach-name">${a.nombre}</div>
          <div class="mn-ach-desc">${a.desc}</div>
          ${done ? `<div class="mn-ach-badge">✓ ${_gt('completado','Completado')}</div>` : ''}
          <button class="mn-ach-info-btn" onclick="event.stopPropagation();window.MNGamification._showAchGuide('${a.id}','${a.emoji}','${a.nombre.replace(/'/g,"\\'")}','${done}')" title="${guideText}">
            ℹ️
          </button>
        </div>`;
    }

    const groupsHtml = Object.entries(CAT_META).map(([catKey, meta]) => {
      const items = groups[catKey];
      if (!items || items.length === 0) return '';
      const doneCount = items.filter(a => !!store.unlocked[a.id]).length;
      return `
        <div class="mn-ach-section">
          <div class="mn-ach-section-header">
            <span style="font-size:1.05rem;margin-right:8px">${meta.icon}</span>
            <span style="color:${meta.color}">${typeof meta.label === 'function' ? meta.label() : meta.label}</span>
            <span style="margin-left:8px;font-size:.8rem;color:var(--text3)">${doneCount}/${items.length}</span>
          </div>
          <div class="mn-ach-grid">
            ${items.map(renderAchCard).join('')}
          </div>
        </div>`;
    }).join('');

    el.innerHTML = `
      <div style="margin-bottom:24px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-size:1rem;font-weight:700;color:var(--text)">${unlocked} / ${ACHIEVEMENTS.length} ${_gt('logros','logros')}</span>
          <span style="font-size:.95rem;color:var(--accent);font-weight:800">${pct}%</span>
        </div>
        <div style="height:8px;background:var(--border);border-radius:99px;overflow:hidden;box-shadow:inset 0 1px 3px rgba(0,0,0,.2)">
          <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#00D4AA,#6366F1,#A855F7);border-radius:inherit;transition:width .5s cubic-bezier(0.22,1,0.36,1);box-shadow:0 0 12px rgba(0,212,170,.4)"></div>
        </div>
      </div>
      ${groupsHtml}
    `;

    // Inject styles if not already present
    if (!document.getElementById('mn-ach-ui-style')) {
      const style = document.createElement('style');
      style.id = 'mn-ach-ui-style';
      style.textContent = `
        .mn-ach-collapsed {
          display:flex;align-items:center;gap:10px;padding:10px 14px;
          background:var(--card2);border:1px solid var(--border);border-radius:10px;
          cursor:pointer;transition:all .15s;margin-bottom:8px;
        }
        .mn-ach-collapsed:hover { background:var(--bg2);border-color:var(--border2);transform:translateX(2px); }
        .mn-ach-expanded {
          padding:16px;background:var(--card2);border:1.5px solid var(--border2);
          border-radius:12px;margin-bottom:10px;
        }
        .mn-ach-info-btn {
          flex-shrink:0;width:28px;height:28px;border-radius:50%;
          background:var(--bg2);border:1px solid var(--border2);
          color:var(--text3);font-size:.9rem;cursor:pointer;
          display:flex;align-items:center;justify-content:center;
          transition:all .15s;font-family:inherit;
        }
        .mn-ach-info-btn:hover { background:var(--accent-dim);border-color:var(--accent);color:var(--accent); }
        .mn-ach-collapse-btn {
          flex-shrink:0;width:26px;height:26px;border-radius:6px;
          background:var(--bg2);border:1px solid var(--border);
          color:var(--text3);font-size:.7rem;cursor:pointer;
          display:flex;align-items:center;justify-content:center;
          transition:all .15s;font-family:inherit;
        }
        .mn-ach-collapse-btn:hover { background:var(--border);color:var(--text); }
        .mn-ach-roadmap {
          background:var(--bg2);border:1px solid var(--border);
          border-radius:10px;padding:12px 14px;
        }
        .mn-ach-step {
          display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;
        }
        .mn-ach-step:last-child { margin-bottom:0; }
        .mn-ach-step-num {
          width:22px;height:22px;border-radius:50%;flex-shrink:0;
          background:var(--accent-dim);border:1px solid var(--accent);
          color:var(--accent);font-size:.7rem;font-weight:800;
          display:flex;align-items:center;justify-content:center;
        }
        .mn-ach-step-text {
          flex:1;font-size:.8rem;color:var(--text2);line-height:1.5;padding-top:2px;
        }
        .mn-ach-cat-header {
          display:flex;align-items:center;justify-content:space-between;
          padding:10px 14px;background:var(--card2);border:1px solid var(--border);
          border-radius:10px;cursor:pointer;transition:all .15s;
        }
        .mn-ach-cat-header:hover { background:var(--bg2);border-color:var(--border2); }
        .mn-ach-cat-arrow {
          font-size:.7rem;color:var(--text3);transition:transform .2s;
        }
      `;
      document.head.appendChild(style);
    }
  }

  // ─── Collapsed/Expanded interactions ────────────────────────────
  window.MNGamification = window.MNGamification || {};
  window.MNGamification._expandAch = function(id) {
    window._achCollapsedState[id] = true;
    try { sessionStorage.setItem('mn_ach_collapsed', JSON.stringify(window._achCollapsedState)); } catch {}
    renderAchievementsPanel('achievementsContainer');
  };
  window.MNGamification._collapseAch = function(id) {
    window._achCollapsedState[id] = false;
    try { sessionStorage.setItem('mn_ach_collapsed', JSON.stringify(window._achCollapsedState)); } catch {}
    renderAchievementsPanel('achievementsContainer');
  };
  window.MNGamification._toggleCategory = function(catId) {
    const current = window._achCollapsedState[catId] !== false; // default collapsed
    window._achCollapsedState[catId] = !current;
    try { sessionStorage.setItem('mn_ach_collapsed', JSON.stringify(window._achCollapsedState)); } catch {}
    const body = document.getElementById(catId);
    const arrow = body?.previousElementSibling?.querySelector('.mn-ach-cat-arrow');
    if (body) body.style.display = window._achCollapsedState[catId] ? 'block' : 'none';
    if (arrow) arrow.style.transform = `rotate(${window._achCollapsedState[catId] ? '180deg' : '0'})`;
  };
  window.MNGamification._showAchGuide = function(id, emoji, nombre, done) {
    const guide = ACH_GUIDES[id] || { steps: [] };
    const isDone = done === 'true';
    const ach = ACHIEVEMENTS.find(a => a.id === id);
    const desc = ach ? ach.desc : '';

    const existing = document.getElementById('mn-ach-guide-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'mn-ach-guide-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9900;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.7);backdrop-filter:blur(12px);animation:mnFadeIn .2s ease';
    overlay.innerHTML = `
      <div style="background:#0D1424;border:1px solid rgba(255,255,255,.09);border-radius:20px;width:min(480px,100%);max-height:90vh;overflow-y:auto;padding:28px;position:relative;animation:mnScaleIn .25s cubic-bezier(0.22,1,0.36,1)">
        <button onclick="document.getElementById('mn-ach-guide-overlay').remove()" style="position:absolute;top:14px;right:14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.4);width:28px;height:28px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.75rem;font-family:inherit;transition:all .15s" onmouseover="this.style.background='var(--red-dim)';this.style.color='var(--red)'" onmouseout="this.style.background='rgba(255,255,255,.06)';this.style.color='rgba(255,255,255,.4)'">✕</button>
        <div style="text-align:center;margin-bottom:20px">
          <div style="font-size:3.2rem;margin-bottom:10px;${isDone?'':'filter:grayscale(1);opacity:.5'}">${emoji}</div>
          <div style="font-size:1.15rem;font-weight:800;color:${isDone?'var(--accent)':'rgba(255,255,255,.6)'};letter-spacing:-.02em;margin-bottom:6px">${nombre}</div>
          <div style="font-size:.82rem;color:var(--text2);line-height:1.5">${desc}</div>
          ${isDone ? `<div style="font-size:.75rem;color:var(--accent);margin-top:8px;font-weight:700;display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:var(--accent-dim);border-radius:99px;border:1px solid var(--accent)">✅ ${_gt('logro_completado','Completado')}</div>` : ''}
        </div>
        ${guide.steps.length ? `
          <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:18px 20px">
            <div style="font-size:.75rem;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.08em;margin-bottom:14px">${isDone?_gt('logro_roadmap_completado','🗺 Cómo lo hiciste'):_gt('logro_roadmap','🗺 Roadmap paso a paso')}</div>
            ${guide.steps.map((step,i)=>`
              <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:${i===guide.steps.length-1?'0':'12px'}">
                <div style="width:26px;height:26px;border-radius:50%;flex-shrink:0;background:${isDone?'rgba(0,212,170,.15)':'var(--indigo-dim)'};border:1.5px solid ${isDone?'var(--accent)':'var(--indigo)'};color:${isDone?'var(--accent)':'var(--indigo)'};font-size:.75rem;font-weight:800;display:flex;align-items:center;justify-content:center">${i+1}</div>
                <div style="flex:1;font-size:.88rem;color:rgba(255,255,255,.75);line-height:1.6;padding-top:2px">${step}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}
        ${!isDone ? `<div style="margin-top:16px;padding:14px 16px;background:var(--accent-dim);border:1px solid var(--accent);border-radius:12px;font-size:.8rem;color:var(--text);line-height:1.5"><strong style="color:var(--accent)">💡 Tip:</strong> ${_gt('logro_tip','Completa los pasos del roadmap para desbloquear este logro.')}</div>` : ''}
      </div>`;
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  };

  // ─── Streak system ───────────────────────────────────────────────
  function _getStreak() {
    try { return JSON.parse(localStorage.getItem(STREAK_KEY) || '{"streak":0,"lastOpenDate":""}'); }
    catch { return { streak: 0, lastOpenDate: '' }; }
  }

  function _saveStreak(data) {
    try { localStorage.setItem(STREAK_KEY, JSON.stringify(data)); } catch {}
  }

  function checkAndUpdateStreak() {
    const s     = _getStreak();
    const today = new Date().toISOString().slice(0, 10);
    if (s.lastOpenDate === today) return;

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (s.lastOpenDate === yesterday) {
      s.streak = (s.streak || 0) + 1;
    } else {
      s.streak = 1;
    }
    s.lastOpenDate = today;
    _saveStreak(s);
    showStreakBadge(s.streak);
    _checkStreakAchievements();
  }

  function showStreakBadge(streak) {
    if (streak < 3) return;
    // Inject badge near the topbar if container exists
    const container = document.getElementById('streakBadgeContainer') || document.querySelector('.topbar-right') || document.querySelector('.sidebar-footer');
    if (!container) return;
    let badge = document.getElementById('mn-streak-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'mn-streak-badge';
      badge.style.cssText = 'display:inline-flex;align-items:center;gap:4px;font-size:.72rem;font-weight:700;color:#F59E0B;cursor:default;padding:3px 8px;background:rgba(245,158,11,0.12);border-radius:99px;border:1px solid rgba(245,158,11,0.3)';
      container.appendChild(badge);
    }
    badge.textContent = `🔥 ${streak}`;
    badge.title = `${streak} días de racha`;
  }

  // ─── Auto-check on data save ──────────────────────────────────────
  window.addEventListener('mn:data:saved', e => {
    const data = e.detail;
    if (!data) return;
    if ((data.ingresos||[]).length >= 1)    checkAchievement('ingreso_added');
    if ((data.gastos||[]).length   >= 1)    checkAchievement('gasto_added');
    if ((data.deudas||[]).length   >= 1)    checkAchievement('deuda_added');
    if ((data.inversiones||[]).length >= 1) checkAchievement('inversion_added');
    if ((data.objetivos||[]).length   >= 1) checkAchievement('objetivo_added');
    if (Object.keys(data.presupuestos||{}).length >= 1) checkAchievement('presupuesto_added');
    if ((data.objetivos||[]).some(o=>o.completado)) checkAchievement('objetivo_done');
    checkAchievement('deuda_updated');
    checkAchievement('data_check');
  });

  checkAndUpdateStreak();

  // ─── Modal de detalle de logro ────────────────────────────────────
  function _showAchDetail(emoji, nombre, desc, done, dateStr) {
    const existing = document.getElementById('mn-ach-detail-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'mn-ach-detail-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9900;display:flex;align-items:flex-end;justify-content:center;padding:24px;background:rgba(0,0,0,.6);backdrop-filter:blur(8px);animation:mnFadeIn .2s ease';
    const isDone = done === 'true';
    overlay.innerHTML = `
      <div style="background:#0D1424;border:1px solid rgba(255,255,255,.09);border-radius:20px 20px 16px 16px;width:min(400px,100%);padding:24px;position:relative;animation:mnScaleIn .25s cubic-bezier(0.22,1,0.36,1)">
        <button onclick="document.getElementById('mn-ach-detail-overlay').remove()" style="position:absolute;top:12px;right:12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.4);width:26px;height:26px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.72rem;font-family:inherit">✕</button>
        <div style="text-align:center;margin-bottom:16px">
          <div style="font-size:3rem;margin-bottom:8px;${isDone?'':'filter:grayscale(1);opacity:.5'}">${emoji}</div>
          <div style="font-size:1rem;font-weight:800;color:${isDone?'#fff':'rgba(255,255,255,.5)'};letter-spacing:-.02em">${nombre}</div>
          ${isDone ? `<div style="font-size:.7rem;color:#00D4AA;margin-top:4px;font-weight:600">✓ ${_gt('logro_desbloqueado','Desbloqueado')} · ${dateStr}</div>` : `<div style="font-size:.7rem;color:rgba(255,255,255,.3);margin-top:4px">${_gt('logro_pendiente','Pendiente')}</div>`}
        </div>
        <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:14px 16px">
          <div style="font-size:.7rem;font-weight:700;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px">${isDone?_gt('logro_completado_como','Cómo lo conseguiste'):_gt('logro_como_completar','Cómo completarlo')}</div>
          <div style="font-size:.82rem;color:rgba(255,255,255,.7);line-height:1.55">${desc}</div>
        </div>
      </div>`;
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    if (!document.getElementById('mn-ach-style')) {
      const s = document.createElement('style');
      s.id = 'mn-ach-style';
      s.textContent = `@keyframes mnFadeIn{from{opacity:0}to{opacity:1}}@keyframes mnScaleIn{from{opacity:0;transform:scale(.94) translateY(8px)}to{opacity:1;transform:none}}`;
      document.head.appendChild(s);
    }
  }

  // Export all public methods (some already attached to window.MNGamification above)
  window.MNGamification = window.MNGamification || {};
  window.MNGamification.checkAchievement = checkAchievement;
  window.MNGamification.renderAchievementsPanel = renderAchievementsPanel;
  window.MNGamification.getAchievements = getAchievements;
  window.MNGamification.isUnlocked = isUnlocked;
  window.MNGamification._showAchDetail = _showAchDetail;
  window.MNGamification._fireConfetti = _fireConfetti;
  // _expandAch, _collapseAch, _toggleCategory, _showAchGuide already attached above
})();
