// ════════════════════════════════════════════════════════════════
// MONEYNEST — MULTI-ACCOUNT SYSTEM v1.0
// Arquitectura: cada cuenta tiene su propio namespace en localStorage
// Preparado para cloud sync futuro via accountId UUID
// ════════════════════════════════════════════════════════════════

;(function(window) {
'use strict'

// ─── Constants ──────────────────────────────────────────────────
const MN_ACCOUNTS_INDEX = 'mn_accounts_index'   // [{id, name, emoji, createdAt, lastUsed}]
const MN_ACTIVE_ACCOUNT = 'mn_active_account'   // accountId string

// Keys that belong to each account (prefixed with accountId)
const ACCOUNT_SCOPED_KEYS = [
  'mn7_data',
  'mn_user',
  'mn7_lang',
  'mn7_demo_mode',
  'mn7_ob_seen',       // legacy — kept for proxy completeness, excluded from migration
  'mn7_ob_seen_v2',    // current onboarding flag
  'mn7_tut_done',
  'mn_billing_sub',
  'mn_billing_history',
  'mn_auth_user',
  'mn_monthly_story_shown',
  'mn_yearly_story_shown',
]

// ─── Helpers ────────────────────────────────────────────────────
function genId() {
  try { return crypto.randomUUID() } catch(_) {
    return 'acct_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  }
}

function _ls(key)        { try { return localStorage.getItem(key) }        catch(_) { return null } }
function _lsSet(key, v)  { try { localStorage.setItem(key, v) }            catch(_) {} }
function _lsDel(key)     { try { localStorage.removeItem(key) }            catch(_) {} }

// ─── Account Index ──────────────────────────────────────────────
function getAccounts() {
  try { return JSON.parse(_ls(MN_ACCOUNTS_INDEX)) || [] } catch(_) { return [] }
}

function saveAccounts(list) {
  _lsSet(MN_ACCOUNTS_INDEX, JSON.stringify(list))
}

function getActiveId() {
  return _ls(MN_ACTIVE_ACCOUNT) || null
}

function setActiveId(id) {
  _lsSet(MN_ACTIVE_ACCOUNT, id)
}

// ─── Namespace helpers ──────────────────────────────────────────
// All account data is stored as  mn_accounts:{accountId}:{original_key}
function _nsKey(accountId, key) {
  return 'mn_accounts:' + accountId + ':' + key
}

function _readAccountKey(accountId, key) {
  return _ls(_nsKey(accountId, key))
}

function _writeAccountKey(accountId, key, value) {
  _lsSet(_nsKey(accountId, key), value)
}

function _deleteAccountKey(accountId, key) {
  _lsDel(_nsKey(accountId, key))
}

// ─── Migration: wrap legacy (no-account) data into account ─────
// Keys that should NOT be migrated from legacy (non-namespaced) storage.
// Onboarding and tutorial flags are device/session state, not user data —
// migrating them would cause new users to skip onboarding if ANY previous
// session had completed it on the same device.
const MIGRATION_EXCLUDE = new Set(['mn7_ob_seen', 'mn7_ob_seen_v2', 'mn7_tut_done'])

function _migrateLegacyData(accountId) {
  let migrated = false
  for (const key of ACCOUNT_SCOPED_KEYS) {
    if (MIGRATION_EXCLUDE.has(key)) continue  // Never migrate onboarding flags
    const val = _ls(key)
    if (val !== null) {
      const dest = _nsKey(accountId, key)
      if (_ls(dest) === null) {
        _lsSet(dest, val)
        migrated = true
      }
    }
  }
  return migrated
}

// ─── Account CRUD ───────────────────────────────────────────────
function createAccount(opts = {}) {
  const id = genId()
  const account = {
    id,
    name:      opts.name      || 'Mi cuenta',
    emoji:     opts.emoji     || '🏠',
    createdAt: Date.now(),
    lastUsed:  Date.now(),
  }
  const list = getAccounts()
  list.push(account)
  saveAccounts(list)

  // CRITICAL: Ensure onboarding flags are NOT set for new accounts
  // This prevents inheriting flags from other accounts or legacy storage
  const obFlags = ['mn7_ob_seen_v2', 'mn7_tut_done']
  for (const flag of obFlags) {
    const nsKey = 'mn_accounts:' + id + ':' + flag
    try { localStorage.removeItem(nsKey) } catch(_) {}
  }

  return account
}

function updateAccount(id, patch) {
  const list = getAccounts().map(a => a.id === id ? { ...a, ...patch } : a)
  saveAccounts(list)
}

function deleteAccount(id) {
  // Remove all scoped keys for this account
  for (const key of ACCOUNT_SCOPED_KEYS) {
    _deleteAccountKey(id, key)
  }
  // Also scan for any extra keys this account may have written
  const prefix = 'mn_accounts:' + id + ':'
  const toDelete = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith(prefix)) toDelete.push(k)
  }
  toDelete.forEach(k => _lsDel(k))

  const list = getAccounts().filter(a => a.id !== id)
  saveAccounts(list)
}

function touchAccount(id) {
  updateAccount(id, { lastUsed: Date.now() })
}

// ─── Active account localStorage proxy ──────────────────────────
// Intercepts app's localStorage reads/writes and scopes them to the active account
let _activeId = null
let _proxied  = false

function _installProxy(accountId) {
  if (_proxied) return
  _activeId = accountId
  _proxied  = true

  const _origGetItem    = Storage.prototype.getItem
  const _origSetItem    = Storage.prototype.setItem
  const _origRemoveItem = Storage.prototype.removeItem

  Storage.prototype.getItem = function(key) {
    if (this === localStorage && _activeId && ACCOUNT_SCOPED_KEYS.includes(key)) {
      return _origGetItem.call(this, _nsKey(_activeId, key))
    }
    return _origGetItem.call(this, key)
  }

  Storage.prototype.setItem = function(key, value) {
    if (this === localStorage && _activeId && ACCOUNT_SCOPED_KEYS.includes(key)) {
      return _origSetItem.call(this, _nsKey(_activeId, key), value)
    }
    return _origSetItem.call(this, key, value)
  }

  Storage.prototype.removeItem = function(key) {
    if (this === localStorage && _activeId && ACCOUNT_SCOPED_KEYS.includes(key)) {
      return _origRemoveItem.call(this, _nsKey(_activeId, key))
    }
    return _origRemoveItem.call(this, key)
  }

  // Expose way to temporarily bypass proxy (for account switching)
  window._mnAccountsProxy = { origGet: _origGetItem, origSet: _origSetItem, origDel: _origRemoveItem }
}

function _updateProxyTarget(accountId) {
  _activeId = accountId
}

// ─── Switch account ─────────────────────────────────────────────
function switchAccount(accountId) {
  touchAccount(accountId)
  setActiveId(accountId)
  _updateProxyTarget(accountId)
  closeAccountSelector()
  // Reload app state into memory from new account's storage
  if (typeof window.load === 'function') window.load()
  if (typeof window.render === 'function') {
    if (typeof window.destroyAllCharts === 'function') window.destroyAllCharts()
    window.render()
    if (typeof window._updateSidebarLang === 'function') window._updateSidebarLang()
    if (typeof window.updateSidebarLogo === 'function') window.updateSidebarLogo()
    if (typeof window.checkOnboarding === 'function') window.checkOnboarding()
  }
}

// ─── Boot ───────────────────────────────────────────────────────
function boot() {
  let accounts = getAccounts()
  let activeId = getActiveId()

  if (accounts.length === 0) {
    // First ever launch — create default account, migrate any legacy data into it
    const first = createAccount({ name: 'Mi cuenta', emoji: '🏠' })
    activeId = first.id
    setActiveId(activeId)
    _migrateLegacyData(activeId)
    accounts = getAccounts()
  } else if (!activeId || !accounts.find(a => a.id === activeId)) {
    // Last active account was deleted or ID is stale — pick most recent
    accounts.sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0))
    activeId = accounts[0].id
    setActiveId(activeId)
  }

  touchAccount(activeId)
  _installProxy(activeId)
  return activeId
}

// ════════════════════════════════════════════════════════════════
// UI — ACCOUNT SELECTOR
// ════════════════════════════════════════════════════════════════

function openAccountSelector() {
  let overlay = document.getElementById('mnAccountOverlay')
  if (!overlay) {
    overlay = document.createElement('div')
    overlay.id = 'mnAccountOverlay'
    document.body.appendChild(overlay)
  }
  _renderSelector(overlay)
  requestAnimationFrame(() => overlay.classList.add('mn-acct-open'))
}

function closeAccountSelector() {
  const overlay = document.getElementById('mnAccountOverlay')
  if (!overlay) return
  overlay.classList.remove('mn-acct-open')
  setTimeout(() => { if (overlay.parentNode) overlay.parentNode.removeChild(overlay) }, 280)
}

function _renderSelector(overlay) {
  const accounts = getAccounts()
  const activeId = getActiveId()
  const sorted   = [...accounts].sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0))

  overlay.innerHTML = `
    <div class="mn-acct-backdrop" onclick="window.MNAccounts.closeAccountSelector()"></div>
    <div class="mn-acct-panel">
      <div class="mn-acct-header">
        <div class="mn-acct-header-title">
          <span style="font-size:1.2rem">🪺</span>
          <span>MoneyNest</span>
        </div>
        <button class="mn-acct-close" onclick="window.MNAccounts.closeAccountSelector()">✕</button>
      </div>

      <div class="mn-acct-label">Selecciona una cuenta</div>

      <div class="mn-acct-list">
        ${sorted.map(a => `
          <div class="mn-acct-card ${a.id === activeId ? 'mn-acct-card--active' : ''}"
               onclick="window.MNAccounts.switchAccount('${a.id}')">
            <div class="mn-acct-avatar">${a.emoji}</div>
            <div class="mn-acct-info">
              <div class="mn-acct-name">${_escHtml(a.name)}</div>
              <div class="mn-acct-meta">${a.id === activeId ? '● Cuenta activa' : 'Último acceso ' + _relTime(a.lastUsed)}</div>
            </div>
            ${a.id === activeId ? '<div class="mn-acct-check">✓</div>' : ''}
          </div>
        `).join('')}
      </div>

      <div class="mn-acct-actions">
        <button class="mn-acct-btn mn-acct-btn--create" onclick="window.MNAccounts.openCreateForm()">
          <span>＋</span> Nueva cuenta
        </button>
        <button class="mn-acct-btn mn-acct-btn--danger" onclick="window.MNAccounts._confirmFullLogout()">
          <span>🚪</span> Cerrar sesión completa
        </button>
      </div>

      <div id="mnAcctFormArea"></div>
    </div>
  `
}

function openCreateForm() {
  const area = document.getElementById('mnAcctFormArea')
  if (!area) return
  const EMOJIS = ['🏠','👤','💼','🌿','🎯','⭐','🔑','🌊','🏔','🎨','🛡','🚀']
  let selectedEmoji = '🏠'

  area.innerHTML = `
    <div class="mn-acct-form">
      <div class="mn-acct-form-title">Nueva cuenta</div>
      <div class="mn-acct-emoji-row">
        ${EMOJIS.map(e => `<button class="mn-acct-emoji-btn ${e === selectedEmoji ? 'selected' : ''}"
          onclick="window.MNAccounts._selectEmoji(this,'${e}')">${e}</button>`).join('')}
      </div>
      <input id="mnAcctNameInput" class="mn-acct-input" type="text"
        placeholder="Nombre de la cuenta" maxlength="32" autocomplete="off">
      <div class="mn-acct-form-actions">
        <button class="mn-acct-btn mn-acct-btn--ghost" onclick="document.getElementById('mnAcctFormArea').innerHTML=''">Cancelar</button>
        <button class="mn-acct-btn mn-acct-btn--create" onclick="window.MNAccounts._submitCreate()">Crear cuenta</button>
      </div>
    </div>
  `
  setTimeout(() => { const inp = document.getElementById('mnAcctNameInput'); if(inp) inp.focus() }, 80)
}

function _selectEmoji(btn, emoji) {
  document.querySelectorAll('.mn-acct-emoji-btn').forEach(b => b.classList.remove('selected'))
  btn.classList.add('selected')
  btn._emoji = emoji
  window._mnSelectedEmoji = emoji
}

function _submitCreate() {
  const inp   = document.getElementById('mnAcctNameInput')
  const name  = (inp ? inp.value.trim() : '') || 'Mi cuenta'
  const emoji = window._mnSelectedEmoji || '🏠'
  const acct  = createAccount({ name, emoji })
  switchAccount(acct.id)
}

function _confirmFullLogout() {
  closeAccountSelector()
  setTimeout(() => {
    if (typeof window.confirmar === 'function') {
      window.confirmar(
        '¿Cerrar sesión completamente? Tus datos seguirán guardados en este dispositivo.',
        _doFullLogout,
        { titulo: 'Cerrar sesión', icono: '🚪', btnLabel: 'Cerrar sesión' }
      )
    } else {
      if (confirm('¿Cerrar sesión completamente?')) _doFullLogout()
    }
  }, 320)
}

function _doFullLogout() {
  // Clear only auth/billing keys for active account — data stays
  const id = getActiveId()
  if (id) {
    const authKeys = ['mn_auth_user','mn_billing_sub','mn_billing_history']
    for (const k of authKeys) _deleteAccountKey(id, k)
  }
  // Clear active pointer so selector appears on next load
  _lsDel(MN_ACTIVE_ACCOUNT)
  setTimeout(() => location.reload(), 120)
}

function _escHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
}

function _relTime(ts) {
  if (!ts) return 'nunca'
  const d = Math.floor((Date.now() - ts) / 86400000)
  if (d === 0) return 'hoy'
  if (d === 1) return 'ayer'
  return 'hace ' + d + ' días'
}

// ─── Export ─────────────────────────────────────────────────────
window.MNAccounts = {
  boot,
  getAccounts,
  getActiveId,
  createAccount,
  updateAccount,
  deleteAccount,
  switchAccount,
  openAccountSelector,
  closeAccountSelector,
  openCreateForm,
  _selectEmoji,
  _submitCreate,
  _confirmFullLogout,
}

})(window)
