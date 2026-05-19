/**
 * MoneyNest — js/gamification.js
 * Achievements, streak system, confetti. Completely self-contained.
 */
;(function () {
  'use strict';

  const STORE_KEY  = 'mn_achievements';
  const STREAK_KEY = 'mn_streak';

  // ─── Achievement definitions ──────────────────────────────────────
  const ACHIEVEMENTS = [
    // ── Primeros pasos ──
    { id:'primer_ingreso',      emoji:'💰', cat:'inicio',    nombre:'Primer ingreso',         desc:'Añade tu primer ingreso',                        trigger:'ingreso_added'    },
    { id:'primer_gasto',        emoji:'📝', cat:'inicio',    nombre:'Primer gasto',           desc:'Registra tu primer gasto',                       trigger:'gasto_added'      },
    { id:'primera_deuda',       emoji:'🎯', cat:'inicio',    nombre:'Deuda registrada',       desc:'Registra tu primera deuda',                      trigger:'deuda_added'      },
    { id:'primera_inversion',   emoji:'📈', cat:'inicio',    nombre:'Inversor',               desc:'Crea tu primera inversión',                      trigger:'inversion_added'  },
    { id:'primer_objetivo',     emoji:'🌟', cat:'inicio',    nombre:'Soñador',                desc:'Crea tu primer objetivo de ahorro',              trigger:'objetivo_added'   },
    { id:'primer_presupuesto',  emoji:'📋', cat:'inicio',    nombre:'Planificador',           desc:'Crea tu primer presupuesto',                     trigger:'presupuesto_added'},
    // ── Constancia ──
    { id:'streak_7',            emoji:'🔥', cat:'constancia',nombre:'Una semana seguida',     desc:'7 días de racha de uso',                         trigger:'streak'           },
    { id:'streak_30',           emoji:'💎', cat:'constancia',nombre:'Un mes de racha',        desc:'30 días de racha de uso',                        trigger:'streak'           },
    { id:'streak_100',          emoji:'👑', cat:'constancia',nombre:'Centenario',             desc:'100 días de racha — eres imparable',             trigger:'streak'           },
    { id:'ahorrador_3meses',    emoji:'🌱', cat:'constancia',nombre:'Ahorrador constante',    desc:'3 meses seguidos con ahorro positivo',           trigger:'data_check'       },
    { id:'ahorrador_6meses',    emoji:'🌳', cat:'constancia',nombre:'Raíces profundas',       desc:'6 meses seguidos con ahorro positivo',           trigger:'data_check'       },
    // ── Volumen ──
    { id:'diez_ingresos',       emoji:'💵', cat:'volumen',   nombre:'Flujo constante',        desc:'10 ingresos registrados',                        trigger:'ingreso_added'    },
    { id:'cincuenta_gastos',    emoji:'🧾', cat:'volumen',   nombre:'Detallista',             desc:'50 gastos registrados',                          trigger:'gasto_added'      },
    { id:'cinco_inversiones',   emoji:'🏦', cat:'volumen',   nombre:'Cartera diversificada',  desc:'5 inversiones activas',                          trigger:'inversion_added'  },
    { id:'cinco_objetivos',     emoji:'🎯', cat:'volumen',   nombre:'Ambicioso',              desc:'5 objetivos de ahorro creados',                  trigger:'objetivo_added'   },
    // ── Logros financieros ──
    { id:'sin_deudas',          emoji:'🏆', cat:'finanzas',  nombre:'Libre de deudas',        desc:'Todas tus deudas en cero',                       trigger:'deuda_updated'    },
    { id:'objetivo_completado', emoji:'✅', cat:'finanzas',  nombre:'Meta alcanzada',         desc:'Completa tu primer objetivo de ahorro',          trigger:'objetivo_done'    },
    { id:'saldo_positivo',      emoji:'📊', cat:'finanzas',  nombre:'En positivo',            desc:'Cash flow positivo este mes',                    trigger:'data_check'       },
    { id:'ahorro_1000',         emoji:'💶', cat:'finanzas',  nombre:'Mil euros ahorrados',    desc:'Acumula 1.000€ en objetivos completados',        trigger:'data_check'       },
    // ── Exportar y personalizar ──
    { id:'exportador',          emoji:'📄', cat:'pro',       nombre:'Documentado',            desc:'Primera exportación PDF o Excel',                trigger:'export_done'      },
    { id:'personalizado',       emoji:'✨', cat:'pro',       nombre:'A tu manera',            desc:'Primera categoría personalizada creada',         trigger:'cat_created'      },
    { id:'tres_cuentas',        emoji:'🏛️', cat:'pro',       nombre:'Multibanco',             desc:'3 o más cuentas bancarias gestionadas',          trigger:'data_check'       },
    // ── Especiales ──
    { id:'madrugador',          emoji:'🌅', cat:'especial',  nombre:'Madrugador',             desc:'Añade una transacción antes de las 7am',         trigger:'ingreso_added'    },
    { id:'nocturno',            emoji:'🌙', cat:'especial',  nombre:'Noctámbulo',             desc:'Añade una transacción después de las 23h',       trigger:'gasto_added'      },
    { id:'fin_de_semana',       emoji:'🎉', cat:'especial',  nombre:'Fin de semana activo',   desc:'Usa la app un sábado o domingo',                 trigger:'data_check'       },
  ];

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
      const raw = localStorage.getItem('mn_data');
      const data = raw ? JSON.parse(raw) : {};

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
        <div style="font-size:.65rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(0,212,170,.8);margin-bottom:2px">¡Logro desbloqueado!</div>
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
  const CAT_META = {
    inicio:    { label: 'Primeros pasos', icon: '🚀', color: '#6366F1' },
    constancia:{ label: 'Constancia',     icon: '🔥', color: '#F59E0B' },
    volumen:   { label: 'Volumen',         icon: '📦', color: '#10B981' },
    finanzas:  { label: 'Logros financieros', icon: '💰', color: '#00D4AA' },
    pro:       { label: 'Pro',             icon: '⚡', color: '#A855F7' },
    especial:  { label: 'Especiales',      icon: '✨', color: '#F472B6' },
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

    function renderCard(a) {
      const done = !!store.unlocked[a.id];
      const dateStr = done
        ? new Date(store.unlocked[a.id].unlockedAt).toLocaleDateString('es-ES', { day:'numeric', month:'short' })
        : '';
      return `
        <div style="
          background:${done ? 'rgba(0,212,170,0.08)' : 'rgba(255,255,255,0.03)'};
          border:1px solid ${done ? 'rgba(0,212,170,0.3)' : 'rgba(255,255,255,0.07)'};
          border-radius:12px;padding:14px;text-align:center;
          transition:all .2s;${done ? '' : 'opacity:.45;filter:grayscale(1)'}
        ">
          <div style="font-size:1.8rem;margin-bottom:6px">${a.emoji}</div>
          <div style="font-size:.8rem;font-weight:700;color:${done ? '#fff' : 'rgba(255,255,255,.5)'}">${a.nombre}</div>
          <div style="font-size:.68rem;color:rgba(255,255,255,.35);margin-top:3px">${a.desc}</div>
          ${done ? `<div style="font-size:.65rem;color:#00D4AA;margin-top:6px;font-weight:600">✓ ${dateStr}</div>` : ''}
        </div>`;
    }

    const groupsHtml = Object.entries(CAT_META).map(([catKey, meta]) => {
      const items = groups[catKey];
      if (!items || items.length === 0) return '';
      const doneCount = items.filter(a => !!store.unlocked[a.id]).length;
      return `
        <div style="margin-bottom:20px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
            <span style="font-size:1rem">${meta.icon}</span>
            <span style="font-size:.78rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:${meta.color}">${meta.label}</span>
            <span style="font-size:.68rem;color:rgba(255,255,255,.3);margin-left:auto">${doneCount}/${items.length}</span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px">
            ${items.map(renderCard).join('')}
          </div>
        </div>`;
    }).join('');

    el.innerHTML = `
      <div style="margin-bottom:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-size:.85rem;font-weight:700;color:var(--text,#fff)">${unlocked} / ${ACHIEVEMENTS.length} logros</span>
          <span style="font-size:.8rem;color:#00D4AA;font-weight:700">${pct}%</span>
        </div>
        <div style="height:6px;background:rgba(255,255,255,0.06);border-radius:99px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#00D4AA,#6366F1);border-radius:inherit;transition:width .5s ease"></div>
        </div>
      </div>
      ${groupsHtml}
    `;
  }

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

  window.MNGamification = { checkAchievement, renderAchievementsPanel, getAchievements, isUnlocked };
})();
