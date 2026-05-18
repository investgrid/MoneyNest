/**
 * MoneyNest — js/data.js
 * Centralised data layer. Bridge between app storage and sync.js.
 * Fires 'mn:data:saved' after every write so sync.js picks it up automatically.
 */
;(function () {
  'use strict';

  const DATA_KEY = 'mn_data';

  const DEFAULT_DATA = {
    ingresos:    [],
    gastos:      [],
    deudas:      [],
    objetivos:   [],
    inversiones: [],
    cuentas:     [],
    activos:     [],
    presupuestos:[],
    _version:    '3.0',
    _updatedAt:  null,
  };

  function getData() {
    try {
      const raw = localStorage.getItem(DATA_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return Object.assign({}, DEFAULT_DATA, parsed);
    } catch {
      return Object.assign({}, DEFAULT_DATA);
    }
  }

  function saveData(data) {
    try {
      data._updatedAt = Date.now();
      localStorage.setItem(DATA_KEY, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent('mn:data:saved', { detail: data }));
    } catch(e) {
      console.warn('[MNData] saveData error:', e);
    }
  }

  function patchData(section, items) {
    const data = getData();
    data[section] = items;
    saveData(data);
  }

  function addItem(section, item) {
    const data = getData();
    if (!Array.isArray(data[section])) data[section] = [];
    if (!item.id) {
      item.id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString(36) + Math.random().toString(36).slice(2);
    }
    if (!item.createdAt) item.createdAt = new Date().toISOString();
    data[section].push(item);
    saveData(data);
    return item;
  }

  function updateItem(section, id, patch) {
    const data = getData();
    if (!Array.isArray(data[section])) return null;
    const idx = data[section].findIndex(i => i.id === id);
    if (idx === -1) return null;
    data[section][idx] = Object.assign({}, data[section][idx], patch);
    saveData(data);
    return data[section][idx];
  }

  function deleteItem(section, id) {
    const data = getData();
    if (!Array.isArray(data[section])) return;
    data[section] = data[section].filter(i => i.id !== id);
    saveData(data);
  }

  function getSection(section) {
    return getData()[section] || [];
  }

  function clearAllData() {
    saveData(Object.assign({}, DEFAULT_DATA));
  }

  function getDataSize() {
    try {
      const raw = localStorage.getItem(DATA_KEY) || '';
      const data = getData();
      const items = Object.values(data)
        .filter(v => Array.isArray(v))
        .reduce((a, arr) => a + arr.length, 0);
      return { bytes: raw.length, kb: (raw.length / 1024).toFixed(1), items };
    } catch {
      return { bytes: 0, kb: '0', items: 0 };
    }
  }

  function importData(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      const valid = ['ingresos','gastos','deudas','objetivos','inversiones','cuentas','activos','presupuestos']
        .some(k => k in parsed);
      if (!valid) throw new Error('Estructura inválida');
      saveData(Object.assign({}, DEFAULT_DATA, parsed));
      return true;
    } catch(e) {
      console.warn('[MNData] importData error:', e);
      return false;
    }
  }

  function exportData() {
    return JSON.stringify(getData(), null, 2);
  }

  window.MNData = {
    getData, saveData, patchData, addItem, updateItem,
    deleteItem, getSection, clearAllData, getDataSize,
    importData, exportData,
  };
})();
