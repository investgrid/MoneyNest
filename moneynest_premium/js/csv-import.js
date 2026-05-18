/**
 * MoneyNest — js/csv-import.js
 * Import bank CSV extracts (Revolut, N26, BBVA, Santander, generic).
 */
;(function () {
  'use strict';

  // ─── Bank format detection ────────────────────────────────────────
  function detectBankFormat(headers) {
    const h = headers.map(s => (s||'').toLowerCase().trim());
    if (h.includes('balance') && h.includes('currency'))          return 'revolut';
    if (h.some(x => x.includes('destinatario')) && h.some(x => x.includes('saldo (eur)'))) return 'n26';
    if (h.includes('f.valor') || h.includes('disponible'))        return 'bbva';
    if (h.some(x => x.includes('concepto')) && h.some(x => x.includes('saldo')) && !h.includes('disponible')) return 'santander';
    return 'generic';
  }

  // ─── CSV parser ──────────────────────────────────────────────────
  function parseCSV(text) {
    const lines = text.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n').filter(l => l.trim());
    if (lines.length < 2) return { headers: [], rows: [] };

    const sep = (lines[0].split(';').length > lines[0].split(',').length) ? ';' : ',';

    function splitLine(line) {
      const cells = [];
      let cur = '', inQ = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') { inQ = !inQ; continue; }
        if (c === sep && !inQ) { cells.push(cur.trim()); cur = ''; continue; }
        cur += c;
      }
      cells.push(cur.trim());
      return cells;
    }

    const headers = splitLine(lines[0]);
    const rows    = lines.slice(1).map(l => {
      const vals = splitLine(l);
      const obj  = {};
      headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
      return obj;
    });
    return { headers, rows };
  }

  // ─── Row normalization ────────────────────────────────────────────
  function _parseAmount(str) {
    if (!str) return 0;
    return parseFloat(String(str).replace(/[^\d.,-]/g,'').replace(',','.')) || 0;
  }

  function _parseDate(str) {
    if (!str) return new Date();
    // Try ISO, dd/mm/yyyy, mm/dd/yyyy
    const iso = str.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return new Date(str.slice(0,10));
    const eu  = str.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (eu) return new Date(`${eu[3]}-${eu[2].padStart(2,'0')}-${eu[1].padStart(2,'0')}`);
    return new Date(str) || new Date();
  }

  function normalizeRow(row, format) {
    let date, description, amount;
    const keys = Object.keys(row).map(k => k.toLowerCase());

    switch (format) {
      case 'revolut':
        date        = _parseDate(row['Date'] || row['Started Date'] || '');
        description = row['Description'] || '';
        amount      = _parseAmount(row['Amount'] || '0');
        break;
      case 'n26':
        date        = _parseDate(row['Fecha'] || '');
        description = row['Nombre del destinatario'] || row['Referencia de la cuenta'] || '';
        amount      = _parseAmount(row['Importe (EUR)'] || '0');
        break;
      case 'bbva':
        date        = _parseDate(row['F.Valor'] || row['Fecha'] || '');
        description = row['Concepto'] || '';
        amount      = _parseAmount(row['Importe'] || '0');
        break;
      case 'santander':
        date        = _parseDate(row['Fecha'] || '');
        description = row['Concepto'] || '';
        amount      = _parseAmount(row['Importe'] || '0');
        break;
      default: {
        const dateKey = Object.keys(row).find(k => /fecha|date/i.test(k)) || Object.keys(row)[0];
        const descKey = Object.keys(row).find(k => /concepto|description|descripcion|detalle/i.test(k)) || Object.keys(row)[1];
        const amtKey  = Object.keys(row).find(k => /importe|amount|monto/i.test(k)) || Object.keys(row)[2];
        date        = _parseDate(row[dateKey] || '');
        description = row[descKey] || '';
        amount      = _parseAmount(row[amtKey] || '0');
      }
    }

    return {
      date,
      description: description.trim(),
      amount:  Math.abs(amount),
      isExpense: amount < 0,
    };
  }

  // ─── Import logic ─────────────────────────────────────────────────
  function importFromCSV(csvText) {
    try {
      const { headers, rows } = parseCSV(csvText);
      if (!rows.length) return { success: false, rows: [], duplicates: [], errors: ['Archivo vacío o sin filas'] };

      const format    = detectBankFormat(headers);
      const normalized = rows.map(r => { try { return normalizeRow(r, format); } catch { return null; } }).filter(Boolean);

      // Duplicate detection against existing data
      const raw  = localStorage.getItem('mn_data');
      const data = raw ? JSON.parse(raw) : {};
      const existing = [...(data.gastos||[]), ...(data.ingresos||[])];

      const duplicates = [];
      const clean      = normalized.filter(n => {
        const iso = n.date.toISOString().slice(0,10);
        const dup = existing.find(e =>
          e.fecha === iso &&
          Math.abs((Number(e.importe)||0) - n.amount) < 0.01 &&
          (e.concepto||'').toLowerCase() === n.description.toLowerCase()
        );
        if (dup) { duplicates.push(n); return false; }
        return true;
      });

      return { success: true, format, rows: clean, duplicates, errors: [] };
    } catch(e) {
      return { success: false, rows: [], duplicates: [], errors: [e.message] };
    }
  }

  // ─── Modal UI ─────────────────────────────────────────────────────
  function openModal() {
    _ensureStyles();
    let modal = document.getElementById('mnCSVModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'mnCSVModal';
      modal.style.cssText = 'position:fixed;inset:0;z-index:9800;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.7);backdrop-filter:blur(12px)';
      modal.innerHTML = `
        <div style="
          background:var(--card,#0F172A);border:1px solid rgba(255,255,255,0.08);
          border-radius:20px;width:min(520px,calc(100vw - 32px));max-height:calc(100dvh - 48px);
          overflow-y:auto;padding:28px 24px;
          box-shadow:0 40px 100px rgba(0,0,0,.6);
          animation:mnCSVIn .35s cubic-bezier(0.22,1,0.36,1) forwards;
        " id="mnCSVCard">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
            <div>
              <div style="font-size:1.1rem;font-weight:800;color:var(--text,#fff)">📂 Importar CSV bancario</div>
              <div style="font-size:.75rem;color:rgba(255,255,255,.4);margin-top:2px">Revolut · N26 · BBVA · Santander · Genérico</div>
            </div>
            <button onclick="MNCSVImport.closeModal()" style="background:none;border:none;color:rgba(255,255,255,.4);font-size:1.2rem;cursor:pointer;padding:4px 8px;border-radius:8px">✕</button>
          </div>
          <div id="mnCSVDropZone" style="
            border:2px dashed rgba(255,255,255,0.12);border-radius:14px;padding:36px 20px;
            text-align:center;cursor:pointer;transition:border-color .2s;margin-bottom:16px;
          " onclick="document.getElementById('mnCSVFileInput').click()"
             ondragover="event.preventDefault();this.style.borderColor='#00D4AA'"
             ondragleave="this.style.borderColor='rgba(255,255,255,0.12)'"
             ondrop="MNCSVImport._handleDrop(event)">
            <div style="font-size:2.5rem;margin-bottom:8px">📄</div>
            <div style="font-size:.9rem;font-weight:600;color:rgba(255,255,255,.7)">Arrastra tu CSV aquí</div>
            <div style="font-size:.75rem;color:rgba(255,255,255,.35);margin-top:4px">o haz clic para seleccionar</div>
          </div>
          <input type="file" id="mnCSVFileInput" accept=".csv,text/csv" style="display:none" onchange="MNCSVImport._handleFile(event)">
          <div id="mnCSVPreview"></div>
        </div>`;
      document.body.appendChild(modal);
    } else {
      modal.style.display = 'flex';
    }
    document.getElementById('mnCSVPreview').innerHTML = '';
  }

  function closeModal() {
    const m = document.getElementById('mnCSVModal');
    if (m) m.style.display = 'none';
  }

  function _handleDrop(e) {
    e.preventDefault();
    document.getElementById('mnCSVDropZone').style.borderColor = 'rgba(255,255,255,0.12)';
    const file = e.dataTransfer.files[0];
    if (file) _readFile(file);
  }

  function _handleFile(e) {
    const file = e.target.files[0];
    if (file) _readFile(file);
  }

  function _readFile(file) {
    const reader = new FileReader();
    reader.onload = e => _showPreview(e.target.result, file.name);
    reader.readAsText(file, 'UTF-8');
  }

  const BANK_LABELS = { revolut:'🟣 Revolut', n26:'🔵 N26', bbva:'🔵 BBVA', santander:'🔴 Santander', generic:'🏦 Genérico' };

  function _showPreview(csvText, fileName) {
    const result = importFromCSV(csvText);
    const preview = document.getElementById('mnCSVPreview');
    if (!preview) return;

    if (!result.success) {
      preview.innerHTML = `<div style="color:var(--red,#f43f5e);font-size:.85rem;padding:12px 0">${result.errors.join(', ')}</div>`;
      return;
    }

    const { rows, duplicates, format } = result;
    const allRows = [...rows, ...duplicates.map(d => ({...d, _dup:true}))].slice(0, 5);
    const cats    = ['Alimentación','Transporte','Vivienda','Ocio','Salud','Suscripciones','Otros'];

    const previewRows = allRows.map(r => {
      const dateStr = r.date.toLocaleDateString('es-ES', { day:'numeric', month:'short' });
      return `<tr style="opacity:${r._dup?0.4:1}">
        <td style="padding:6px 8px;font-size:.78rem;color:var(--text2,rgba(255,255,255,.6))">${dateStr}</td>
        <td style="padding:6px 8px;font-size:.78rem;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.description}</td>
        <td style="padding:6px 8px;font-size:.78rem;font-weight:700;color:${r.isExpense?'var(--red,#f43f5e)':'var(--green,#10b981)'}">
          ${r.isExpense?'-':'+'} ${r.amount.toFixed(2)}€
        </td>
        ${r._dup ? '<td style="padding:6px 8px;font-size:.7rem;color:rgba(255,200,0,.6)">Duplicado</td>' : '<td></td>'}
      </tr>`;
    }).join('');

    const catOptions = cats.map(c => `<option>${c}</option>`).join('');

    preview.innerHTML = `
      <div style="margin-bottom:12px">
        <span style="font-size:.8rem;font-weight:700;color:#00D4AA">${BANK_LABELS[format]}</span>
        <span style="font-size:.78rem;color:rgba(255,255,255,.4);margin-left:8px">
          ${rows.length} transacciones · ${duplicates.length} duplicados omitidos
        </span>
      </div>
      <div style="border:1px solid rgba(255,255,255,.06);border-radius:10px;overflow:hidden;margin-bottom:14px">
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:rgba(255,255,255,.04)">
            <th style="padding:8px;font-size:.7rem;color:rgba(255,255,255,.4);text-align:left;font-weight:600">Fecha</th>
            <th style="padding:8px;font-size:.7rem;color:rgba(255,255,255,.4);text-align:left;font-weight:600">Concepto</th>
            <th style="padding:8px;font-size:.7rem;color:rgba(255,255,255,.4);text-align:left;font-weight:600">Importe</th>
            <th></th>
          </tr></thead>
          <tbody>${previewRows}</tbody>
        </table>
        ${allRows.length < rows.length + duplicates.length
          ? `<div style="padding:8px 12px;font-size:.7rem;color:rgba(255,255,255,.3);text-align:center">+ ${rows.length + duplicates.length - allRows.length} más…</div>`
          : ''}
      </div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
        <label style="font-size:.8rem;color:rgba(255,255,255,.5);flex-shrink:0">Categoría por defecto:</label>
        <select id="mnCSVDefaultCat" style="flex:1;padding:7px 10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:8px;color:var(--text,#fff);font-size:.8rem">
          ${catOptions}
        </select>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end">
        <button onclick="MNCSVImport.closeModal()" style="padding:9px 18px;border-radius:10px;border:1px solid rgba(255,255,255,.1);background:transparent;color:rgba(255,255,255,.5);font-size:.82rem;cursor:pointer;font-family:inherit">Cancelar</button>
        <button onclick="MNCSVImport._confirmImport(${JSON.stringify(csvText).replace(/</g,'\\u003c')})" style="padding:9px 20px;border-radius:10px;border:none;background:linear-gradient(135deg,#00D4AA,#059669);color:#fff;font-size:.82rem;font-weight:700;cursor:pointer;font-family:inherit">
          Importar ${rows.length} transacciones →
        </button>
      </div>
      <div id="mnCSVResult" style="margin-top:10px;font-size:.82rem"></div>
    `;

    // Store for confirm
    preview._csvText = csvText;
  }

  function _confirmImport(csvText) {
    const result = importFromCSV(csvText);
    if (!result.success || !result.rows.length) return;

    const catEl = document.getElementById('mnCSVDefaultCat');
    const cat   = catEl ? catEl.value : 'Otros';
    let count = 0;

    result.rows.forEach(r => {
      const today = new Date().toISOString().slice(0,10);
      const fecha = (r.date instanceof Date && !isNaN(r.date)) ? r.date.toISOString().slice(0,10) : today;
      const item  = {
        concepto: r.description || 'Importado CSV',
        importe:  r.amount,
        fecha,
        categoria: cat,
        origen: 'csv-import',
      };
      if (window.MNData) {
        MNData.addItem(r.isExpense ? 'gastos' : 'ingresos', item);
      } else {
        // Fallback: write directly to mn_data localStorage
        try {
          const raw  = localStorage.getItem('mn_data');
          const data = raw ? JSON.parse(raw) : {};
          const section = r.isExpense ? 'gastos' : 'ingresos';
          if (!Array.isArray(data[section])) data[section] = [];
          item.id = Date.now().toString(36) + count;
          data[section].push(item);
          localStorage.setItem('mn_data', JSON.stringify(data));
        } catch {}
      }
      count++;
    });

    const resultEl = document.getElementById('mnCSVResult');
    if (resultEl) resultEl.innerHTML = `<span style="color:#00D4AA;font-weight:700">✓ ${count} transacciones importadas correctamente</span>`;

    if (typeof render === 'function') setTimeout(render, 200);
    if (window.MNGamification) MNGamification.checkAchievement('gasto_added');
    setTimeout(() => closeModal(), 1800);
  }

  function _ensureStyles() {
    if (document.getElementById('mn-csv-style')) return;
    const s = document.createElement('style');
    s.id = 'mn-csv-style';
    s.textContent = `@keyframes mnCSVIn { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }`;
    document.head.appendChild(s);
  }

  window.MNCSVImport = {
    openModal,
    closeModal,
    importFromCSV,
    detectBankFormat,
    _handleDrop,
    _handleFile,
    _confirmImport,
  };
})();
