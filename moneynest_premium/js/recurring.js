/**
 * MoneyNest — js/recurring.js
 * Automatic recurring transactions (salary, rent, subscriptions…).
 */
;(function () {
  'use strict';

  const STORE_KEY = 'mn_recurring';

  // ─── Storage ──────────────────────────────────────────────────────
  function getRecurrings() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch { return []; }
  }

  function saveRecurrings(arr) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(arr)); } catch {}
  }

  // ─── Next execution calculation ───────────────────────────────────
  function calcNextExecution(frecuencia, diaDelMes) {
    const now = new Date();
    let next  = new Date();

    switch (frecuencia) {
      case 'semanal':
        next = new Date(now.getTime() + 7 * 86400000);
        break;
      case 'anual':
        next = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
        break;
      default: { // mensual
        const day = Number(diaDelMes) || 1;
        next = new Date(now.getFullYear(), now.getMonth(), day);
        if (next <= now) next = new Date(now.getFullYear(), now.getMonth() + 1, day);
      }
    }
    return next.getTime();
  }

  function addRecurring(item) {
    const arr = getRecurrings();
    item.id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2);
    item.activa         = item.activa !== false;
    item.ultimaEjecucion = null;
    item.creadaEn       = Date.now();
    item.proximaEjecucion = calcNextExecution(item.frecuencia, item.diaDelMes);
    arr.push(item);
    saveRecurrings(arr);
    return item;
  }

  function updateRecurring(id, patch) {
    const arr = getRecurrings();
    const idx = arr.findIndex(r => r.id === id);
    if (idx === -1) return;
    arr[idx] = Object.assign({}, arr[idx], patch);
    saveRecurrings(arr);
  }

  function deleteRecurring(id) {
    saveRecurrings(getRecurrings().filter(r => r.id !== id));
  }

  // ─── Process due recurrings (call on app init) ────────────────────
  function processDueRecurrings() {
    const arr = getRecurrings();
    let changed = false;

    arr.forEach(r => {
      if (!r.activa) return;
      if (Date.now() < r.proximaEjecucion) return;

      const item = {
        concepto:  r.nombre,
        importe:   r.importe,
        categoria: r.categoria || 'Recurrente',
        fecha:     new Date().toISOString().slice(0, 10),
        recurrente: true,
        origen:    'recurring',
      };

      if (window.MNData) {
        MNData.addItem(r.type === 'ingreso' ? 'ingresos' : 'gastos', item);
      } else {
        try {
          const raw  = localStorage.getItem('mn_data');
          const data = raw ? JSON.parse(raw) : {};
          const sec  = r.type === 'ingreso' ? 'ingresos' : 'gastos';
          if (!Array.isArray(data[sec])) data[sec] = [];
          item.id = Date.now().toString(36);
          data[sec].push(item);
          localStorage.setItem('mn_data', JSON.stringify(data));
        } catch {}
      }

      r.ultimaEjecucion   = Date.now();
      r.proximaEjecucion  = calcNextExecution(r.frecuencia, r.diaDelMes);
      changed = true;

      const eur = v => new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(v);
      _toast(`✓ ${r.emoji||''} ${r.nombre} añadido automáticamente — ${eur(r.importe)}`);
    });

    if (changed) {
      saveRecurrings(arr);
      if (typeof render === 'function') setTimeout(render, 100);
    }
  }

  function _toast(msg) {
    if (typeof toast === 'function') { toast(msg); return; }
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1e293b;color:#fff;padding:10px 16px;border-radius:10px;font-size:.82rem;z-index:9999;border:1px solid rgba(0,212,170,.3)';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  // ─── Panel UI ─────────────────────────────────────────────────────
  function openPanel() {
    _ensureStyles();
    let modal = document.getElementById('mnRecurringModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'mnRecurringModal';
      modal.style.cssText = 'position:fixed;inset:0;z-index:9800;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.65);backdrop-filter:blur(12px)';
      modal.onclick = e => { if (e.target === modal) closePanel(); };
      document.body.appendChild(modal);
    }
    modal.style.display = 'flex';
    _renderPanel();
  }

  function closePanel() {
    const m = document.getElementById('mnRecurringModal');
    if (m) m.style.display = 'none';
  }

  function _renderPanel() {
    const modal = document.getElementById('mnRecurringModal');
    if (!modal) return;
    const arr  = getRecurrings();
    const eur  = v => new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(v);
    const fmtDate = ts => ts ? new Date(ts).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'}) : '—';
    const freqLabel = f => ({mensual:'Mensual',semanal:'Semanal',anual:'Anual'}[f]||f);

    const cards = arr.length
      ? arr.map(r => `
        <div style="
          background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
          border-radius:12px;padding:14px;display:flex;align-items:center;gap:12px;margin-bottom:8px;
        ">
          <div style="font-size:1.6rem;flex-shrink:0">${r.emoji||'💸'}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:.9rem;font-weight:700;color:var(--text,#fff);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.nombre}</div>
            <div style="font-size:.72rem;color:rgba(255,255,255,.4);margin-top:2px">
              ${eur(r.importe)} · ${freqLabel(r.frecuencia)} · Próxima: ${fmtDate(r.proximaEjecucion)}
            </div>
          </div>
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;flex-shrink:0">
            <input type="checkbox" ${r.activa?'checked':''} onchange="MNRecurring._toggleActive('${r.id}',this.checked)"
              style="width:16px;height:16px;accent-color:#00D4AA;cursor:pointer">
          </label>
          <button onclick="MNRecurring._deleteItem('${r.id}')" style="background:none;border:none;color:rgba(255,100,100,.6);font-size:.85rem;cursor:pointer;padding:2px 6px;border-radius:6px">✕</button>
        </div>`)
      .join('')
      : `<div style="text-align:center;padding:32px 0;color:rgba(255,255,255,.35);font-size:.85rem">
          Sin recurrentes configuradas aún
         </div>`;

    modal.innerHTML = `
      <div style="
        background:var(--card,#0F172A);border-top:1px solid rgba(255,255,255,.08);
        border-radius:20px 20px 0 0;width:min(540px,100vw);max-height:80dvh;
        overflow-y:auto;padding:24px 20px 32px;
        box-shadow:0 -20px 60px rgba(0,0,0,.5);
        animation:mnRecIn .3s cubic-bezier(0.22,1,0.36,1) forwards;
      ">
        <div style="width:40px;height:4px;background:rgba(255,255,255,.12);border-radius:99px;margin:0 auto 20px"></div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <div style="font-size:1.05rem;font-weight:800;color:var(--text,#fff)">🔄 Transacciones recurrentes</div>
          <button onclick="MNRecurring.closePanel()" style="background:none;border:none;color:rgba(255,255,255,.4);font-size:1.1rem;cursor:pointer;padding:4px 8px">✕</button>
        </div>
        ${cards}
        <button onclick="MNRecurring._openCreateForm()" style="
          width:100%;margin-top:8px;padding:12px;border-radius:12px;
          border:1.5px dashed rgba(0,212,170,.3);background:rgba(0,212,170,.05);
          color:#00D4AA;font-size:.85rem;font-weight:700;cursor:pointer;font-family:inherit;
          transition:all .18s;
        ">+ Nueva transacción recurrente</button>
      </div>
    `;
  }

  function _toggleActive(id, val) {
    updateRecurring(id, { activa: val });
    _renderPanel();
  }

  function _deleteItem(id) {
    deleteRecurring(id);
    _renderPanel();
  }

  function _openCreateForm() {
    const modal = document.getElementById('mnRecurringModal');
    if (!modal) return;
    const emojis = ['💰','💳','🏠','🚗','📱','🎬','🛒','🏥','📚','✈️','☕','🎮'];

    modal.innerHTML = `
      <div style="
        background:var(--card,#0F172A);border-top:1px solid rgba(255,255,255,.08);
        border-radius:20px 20px 0 0;width:min(540px,100vw);max-height:80dvh;
        overflow-y:auto;padding:24px 20px 32px;
        box-shadow:0 -20px 60px rgba(0,0,0,.5);
      ">
        <div style="width:40px;height:4px;background:rgba(255,255,255,.12);border-radius:99px;margin:0 auto 20px"></div>
        <div style="font-size:1.05rem;font-weight:800;color:var(--text,#fff);margin-bottom:20px">✨ Nueva recurrente</div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
          <label style="grid-column:1/-1">
            <div style="font-size:.75rem;color:rgba(255,255,255,.4);margin-bottom:4px">Nombre</div>
            <input id="rNombre" placeholder="Ej: Nómina, Netflix…" style="width:100%;box-sizing:border-box;padding:9px 12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:9px;color:var(--text,#fff);font-size:.85rem;font-family:inherit">
          </label>
          <label>
            <div style="font-size:.75rem;color:rgba(255,255,255,.4);margin-bottom:4px">Tipo</div>
            <select id="rType" style="width:100%;padding:9px 12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:9px;color:var(--text,#fff);font-size:.85rem;font-family:inherit">
              <option value="gasto">Gasto</option>
              <option value="ingreso">Ingreso</option>
            </select>
          </label>
          <label>
            <div style="font-size:.75rem;color:rgba(255,255,255,.4);margin-bottom:4px">Importe (€)</div>
            <input id="rImporte" type="number" min="0" step="0.01" placeholder="0.00" style="width:100%;box-sizing:border-box;padding:9px 12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:9px;color:var(--text,#fff);font-size:.85rem;font-family:inherit">
          </label>
          <label>
            <div style="font-size:.75rem;color:rgba(255,255,255,.4);margin-bottom:4px">Frecuencia</div>
            <select id="rFrecuencia" onchange="MNRecurring._updateDayField()" style="width:100%;padding:9px 12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:9px;color:var(--text,#fff);font-size:.85rem;font-family:inherit">
              <option value="mensual">Mensual</option>
              <option value="semanal">Semanal</option>
              <option value="anual">Anual</option>
            </select>
          </label>
          <label id="rDayField">
            <div style="font-size:.75rem;color:rgba(255,255,255,.4);margin-bottom:4px">Día del mes</div>
            <input id="rDia" type="number" min="1" max="31" value="1" style="width:100%;box-sizing:border-box;padding:9px 12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:9px;color:var(--text,#fff);font-size:.85rem;font-family:inherit">
          </label>
          <label>
            <div style="font-size:.75rem;color:rgba(255,255,255,.4);margin-bottom:4px">Categoría</div>
            <input id="rCat" placeholder="Ej: Ocio, Salud…" style="width:100%;box-sizing:border-box;padding:9px 12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:9px;color:var(--text,#fff);font-size:.85rem;font-family:inherit">
          </label>
        </div>
        <div style="margin-bottom:16px">
          <div style="font-size:.75rem;color:rgba(255,255,255,.4);margin-bottom:6px">Emoji</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px" id="rEmojiPicker">
            ${emojis.map(e=>`<button onclick="MNRecurring._pickEmoji('${e}')" style="font-size:1.3rem;padding:4px 6px;border-radius:8px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);cursor:pointer">${e}</button>`).join('')}
          </div>
          <span id="rEmojiSelected" style="font-size:.8rem;color:#00D4AA;margin-top:4px;display:block"></span>
        </div>
        <div id="rPreview" style="font-size:.78rem;color:rgba(255,255,255,.35);margin-bottom:14px;min-height:16px"></div>
        <div style="display:flex;gap:10px">
          <button onclick="MNRecurring.openPanel()" style="flex:1;padding:11px;border-radius:11px;border:1px solid rgba(255,255,255,.1);background:transparent;color:rgba(255,255,255,.4);font-size:.82rem;cursor:pointer;font-family:inherit">Cancelar</button>
          <button onclick="MNRecurring._saveNew()" style="flex:2;padding:11px;border-radius:11px;border:none;background:linear-gradient(135deg,#00D4AA,#059669);color:#fff;font-size:.85rem;font-weight:700;cursor:pointer;font-family:inherit">Guardar recurrente</button>
        </div>
      </div>
    `;
    window._mnREmoji = '';
  }

  function _pickEmoji(e) {
    window._mnREmoji = e;
    const el = document.getElementById('rEmojiSelected');
    if (el) el.textContent = `Seleccionado: ${e}`;
    _updateDayField();
  }

  function _updateDayField() {
    const frec = document.getElementById('rFrecuencia');
    const df   = document.getElementById('rDayField');
    const nombre = (document.getElementById('rNombre')||{}).value || '';
    const dia    = (document.getElementById('rDia')||{}).value || '1';
    const prev   = document.getElementById('rPreview');
    if (!frec || !df) return;
    df.style.display = frec.value === 'mensual' ? '' : 'none';
    if (prev && nombre && frec) {
      const map = {mensual:`el día ${dia} de cada mes`, semanal:'cada semana', anual:'cada año'};
      prev.textContent = `→ "${nombre}" se añadirá ${map[frec.value]||''}`;
    }
  }

  function _saveNew() {
    const nombre    = (document.getElementById('rNombre')||{}).value?.trim();
    const importe   = parseFloat((document.getElementById('rImporte')||{}).value);
    const type      = (document.getElementById('rType')||{}).value || 'gasto';
    const frecuencia = (document.getElementById('rFrecuencia')||{}).value || 'mensual';
    const diaDelMes = parseInt((document.getElementById('rDia')||{}).value) || 1;
    const categoria = (document.getElementById('rCat')||{}).value?.trim() || '';
    const emoji     = window._mnREmoji || '💸';

    if (!nombre || !importe || importe <= 0) {
      _toast('Nombre e importe son obligatorios');
      return;
    }
    addRecurring({ nombre, importe, type, frecuencia, diaDelMes, categoria, emoji });
    openPanel();
  }

  function _ensureStyles() {
    if (document.getElementById('mn-rec-style')) return;
    const s = document.createElement('style');
    s.id = 'mn-rec-style';
    s.textContent = `@keyframes mnRecIn { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }`;
    document.head.appendChild(s);
  }

  // ─── Public API ──────────────────────────────────────────────────
  window.MNRecurring = {
    addRecurring,
    getRecurrings,
    processDueRecurrings,
    openPanel,
    closePanel,
    calcNextExecution,
    _toggleActive,
    _deleteItem,
    _openCreateForm,
    _pickEmoji,
    _updateDayField,
    _saveNew,
  };
})();
