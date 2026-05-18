/**
 * MoneyNest — js/notifications.js
 * Local push notifications (Web Notifications API — no server needed).
 */
;(function () {
  'use strict';

  const PREFS_KEY = 'mn_notif_prefs';
  const PERM_KEY  = 'mn_notif_permission';

  function getPrefs() {
    try { return JSON.parse(localStorage.getItem(PREFS_KEY) || '{"budget":true,"streak":true,"recurring":true,"trial":true}'); }
    catch { return { budget: true, streak: true, recurring: true, trial: true }; }
  }

  function savePrefs(p) {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch {}
  }

  // ─── Permission ───────────────────────────────────────────────────
  async function requestPermission() {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (localStorage.getItem(PERM_KEY) === 'denied') return false;

    // Show friendly modal first
    await _showPermissionModal();
    return Notification.permission === 'granted';
  }

  function _showPermissionModal() {
    return new Promise(resolve => {
      const el = document.createElement('div');
      el.style.cssText = 'position:fixed;inset:0;z-index:9900;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.65);backdrop-filter:blur(12px)';
      el.innerHTML = `
        <div style="background:var(--card,#0F172A);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:28px 24px;max-width:360px;width:calc(100vw - 40px);text-align:center;box-shadow:0 40px 100px rgba(0,0,0,.6)">
          <div style="font-size:2.5rem;margin-bottom:12px">🔔</div>
          <div style="font-size:1rem;font-weight:700;color:var(--text,#fff);margin-bottom:8px">Notificaciones de MoneyNest</div>
          <div style="font-size:.82rem;color:rgba(255,255,255,.5);line-height:1.55;margin-bottom:20px">
            MoneyNest puede avisarte cuando superes un presupuesto, tu trial esté por expirar, o una transacción recurrente se haya añadido.
          </div>
          <div style="display:flex;gap:10px">
            <button id="mnNotifDecline" style="flex:1;padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,.1);background:transparent;color:rgba(255,255,255,.4);font-size:.82rem;cursor:pointer;font-family:inherit">Ahora no</button>
            <button id="mnNotifAccept" style="flex:2;padding:10px;border-radius:10px;border:none;background:linear-gradient(135deg,#6366F1,#00D4AA);color:#fff;font-size:.82rem;font-weight:700;cursor:pointer;font-family:inherit">Activar notificaciones</button>
          </div>
        </div>`;
      document.body.appendChild(el);

      document.getElementById('mnNotifDecline').onclick = () => {
        localStorage.setItem(PERM_KEY, 'denied');
        el.remove();
        resolve(false);
      };

      document.getElementById('mnNotifAccept').onclick = async () => {
        el.remove();
        const perm = await Notification.requestPermission();
        localStorage.setItem(PERM_KEY, perm);
        resolve(perm === 'granted');
      };
    });
  }

  // ─── Send notification ────────────────────────────────────────────
  function sendNotification(title, body, icon, tag) {
    if (!('Notification' in window))              return;
    if (Notification.permission !== 'granted')    return;
    if (document.visibilityState === 'visible')   return; // in-app, skip
    try {
      new Notification(title, {
        body,
        icon: icon || './assets/icon-192.png',
        tag:  tag  || 'moneynest',
        badge: './assets/icon-192.png',
      });
    } catch(e) {
      console.warn('[MNNotifications] sendNotification error:', e);
    }
  }

  // ─── Budget alerts ────────────────────────────────────────────────
  function checkBudgetAlerts() {
    const prefs = getPrefs();
    if (!prefs.budget) return;
    try {
      const raw  = localStorage.getItem('mn_data');
      const data = raw ? JSON.parse(raw) : {};
      const pres = data.presupuestos || {};
      const gastos = data.gastos || [];
      const currentMonth = new Date().toISOString().slice(0, 7);

      Object.entries(pres).forEach(([cat, limit]) => {
        const spent = gastos
          .filter(g => (g.fecha||'').startsWith(currentMonth) && (g.categoria||'') === cat)
          .reduce((a, g) => a + (Number(g.importe) || 0), 0);
        if (spent > Number(limit) && Number(limit) > 0) {
          sendNotification(
            `Presupuesto superado — ${cat}`,
            `Has gastado ${_eur(spent)} de ${_eur(limit)} en ${cat} este mes.`,
            null,
            `budget-${cat}`
          );
        }
      });
    } catch(e) {
      console.warn('[MNNotifications] checkBudgetAlerts error:', e);
    }
  }

  // ─── Trial expiry reminder ────────────────────────────────────────
  function scheduleTrialExpiry() {
    const prefs = getPrefs();
    if (!prefs.trial) return;
    try {
      const raw = localStorage.getItem('mn_auth') || localStorage.getItem('mn_user');
      if (!raw) return;
      const auth = JSON.parse(raw);
      const exp  = auth.trialExpiry || auth.trial_expiry;
      if (!exp) return;
      const msLeft = new Date(exp).getTime() - Date.now();
      if (msLeft <= 0 || msLeft > 26 * 3600000) return; // only if < 26h away
      const delay  = Math.max(0, msLeft - 3600000); // 1h before expiry
      setTimeout(() => {
        sendNotification(
          'Tu prueba de MoneyNest expira pronto',
          'Desbloquea MoneyNest por 5€ y conserva todos tus datos.',
          null,
          'trial-expiry'
        );
      }, delay);
    } catch {}
  }

  // ─── Streak notification ──────────────────────────────────────────
  function checkStreakNotification() {
    const prefs = getPrefs();
    if (!prefs.streak) return;
    try {
      const s = JSON.parse(localStorage.getItem('mn_streak') || '{}');
      if ((s.streak || 0) >= 7) {
        sendNotification(
          `¡${s.streak} días de racha! 🔥`,
          '¡Sigue así! La constancia es la clave del éxito financiero.',
          null,
          'streak'
        );
      }
    } catch {}
  }

  function _eur(v) {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(v);
  }

  // ─── Settings UI ─────────────────────────────────────────────────
  function renderSettingsUI(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const prefs = getPrefs();
    const perm  = Notification.permission;

    el.innerHTML = `
      <div style="padding:16px 0">
        <div style="font-size:.85rem;font-weight:700;color:var(--text,#fff);margin-bottom:12px">🔔 Notificaciones</div>
        ${perm !== 'granted' ? `
          <div style="font-size:.78rem;color:rgba(245,158,11,.8);margin-bottom:10px;padding:8px 12px;background:rgba(245,158,11,0.08);border-radius:8px">
            ⚠️ Los permisos de notificación no están activados.
            <button onclick="MNNotifications.requestPermission()" style="margin-left:8px;font-size:.72rem;color:#F59E0B;background:none;border:1px solid rgba(245,158,11,.4);border-radius:6px;padding:2px 8px;cursor:pointer;font-family:inherit">Activar</button>
          </div>` : ''}
        ${_toggle('Alertas de presupuesto', 'budget', prefs.budget)}
        ${_toggle('Recordatorios de racha', 'streak', prefs.streak)}
        ${_toggle('Transacciones recurrentes', 'recurring', prefs.recurring)}
        ${_toggle('Aviso expiración trial', 'trial', prefs.trial)}
        <button onclick="MNNotifications._sendTest()" style="margin-top:12px;padding:8px 16px;border-radius:9px;border:1px solid rgba(255,255,255,.1);background:transparent;color:rgba(255,255,255,.5);font-size:.78rem;cursor:pointer;font-family:inherit">
          Enviar notificación de prueba
        </button>
      </div>
    `;
  }

  function _toggle(label, key, val) {
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.05)">
        <span style="font-size:.82rem;color:rgba(255,255,255,.65)">${label}</span>
        <label style="position:relative;display:inline-block;width:38px;height:22px;cursor:pointer">
          <input type="checkbox" ${val?'checked':''} onchange="MNNotifications._setPref('${key}',this.checked)"
            style="opacity:0;width:0;height:0">
          <span style="position:absolute;inset:0;background:${val?'#00D4AA':'rgba(255,255,255,0.12)'};border-radius:99px;transition:.2s;cursor:pointer"></span>
          <span style="position:absolute;top:3px;left:${val?'19px':'3px'};width:16px;height:16px;background:#fff;border-radius:50%;transition:.2s"></span>
        </label>
      </div>`;
  }

  function _setPref(key, val) {
    const p = getPrefs();
    p[key] = val;
    savePrefs(p);
  }

  function _sendTest() {
    if (Notification.permission !== 'granted') { requestPermission(); return; }
    // Force send even if visible
    try {
      new Notification('MoneyNest — Prueba ✅', {
        body: '¡Las notificaciones funcionan correctamente!',
        icon: './assets/icon-192.png',
        tag:  'test',
      });
    } catch {}
  }

  // ─── Auto listeners ───────────────────────────────────────────────
  window.addEventListener('mn:data:saved', () => checkBudgetAlerts());

  scheduleTrialExpiry();

  window.MNNotifications = {
    requestPermission,
    sendNotification,
    checkBudgetAlerts,
    scheduleTrialExpiry,
    renderSettingsUI,
    _setPref,
    _sendTest,
  };
})();
