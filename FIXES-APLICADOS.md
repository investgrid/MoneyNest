# 🔧 FIXES APLICADOS — 2026-05-27

## ❌ BUGS ENCONTRADOS (CAUSA RAÍZ)

### BUG #1: Sistema de cuentas nunca se inicializaba
**Problema:** `accounts.js` no estaba cargado en `index.html`
**Impacto:** El onboarding no funcionaba porque el sistema multi-cuenta no existía
**Archivos afectados:**
- `index.html` (faltaba `<script src="js/accounts.js"></script>`)
- `app.js` (faltaba llamada a `MNAccounts.boot()`)

### BUG #2: Filtro de período no funcionaba
**Problema:** Los onclick de los botones tenían problemas de escapado de comillas
**Impacto:** Al hacer click en "Todo", "Este año", etc., no se ejecutaba nada
**Archivos afectados:**
- `app.js` función `_gFilterBar()` — onclick con comillas rotas

---

## ✅ FIXES APLICADOS

### FIX #1: Cargar accounts.js en index.html
**Archivo:** `index.html` línea 1328
**Cambio:**
```html
<!-- ANTES: accounts.js NO existía -->
<script src="js/auth.js"></script>

<!-- DESPUÉS: accounts.js cargado PRIMERO -->
<script src="js/accounts.js"></script>
<script src="js/auth.js"></script>
```

### FIX #2: Inicializar MNAccounts.boot() en DOMContentLoaded
**Archivo:** `app.js` línea 14199
**Cambio:**
```js
// ANTES
window.addEventListener('DOMContentLoaded', function() {
  init()
  ...
})

// DESPUÉS
window.addEventListener('DOMContentLoaded', function() {
  // Initialize multi-account system BEFORE app loads
  if (window.MNAccounts) {
    try {
      window.MNAccounts.boot()
      console.log('[MoneyNest] Multi-account system initialized')
    } catch(e) {
      console.error('[MoneyNest] Failed to initialize accounts system:', e)
    }
  }

  init()
  ...
})
```

### FIX #3: Limpiar flags de onboarding en cuentas nuevas
**Archivo:** `accounts.js` línea 100-119
**Cambio:**
```js
function createAccount(opts = {}) {
  const id = genId()
  // ... crear cuenta ...

  // NUEVO: Asegurar que los flags de onboarding NO existen
  const obFlags = ['mn7_ob_seen_v2', 'mn7_tut_done']
  for (const flag of obFlags) {
    const nsKey = 'mn_accounts:' + id + ':' + flag
    try { localStorage.removeItem(nsKey) } catch(_) {}
  }

  return account
}
```

### FIX #4: Refactorizar filtro de período con funciones globales
**Archivo:** `app.js` línea 3670-3720
**Cambio:**
```js
// ANTES: onclick directo con comillas problemáticas
onclick="_gTimePeriod='month';renderGastos()"

// DESPUÉS: función helper global
onclick="window._setPeriodAndRender('month','renderGastos()')"

// Nueva función global
window._setPeriodAndRender = function(period, renderFnName) {
  console.log('[Period Filter] Changing to:', period)
  window._gTimePeriod = period
  try {
    if (renderFnName && typeof window[renderFnName.replace('()','')]  === 'function') {
      window[renderFnName.replace('()','')]()
    }
  } catch(e) {
    console.error('[Period Filter] Error:', e)
  }
}
```

### FIX #5: Añadir logs de debug en checkOnboarding
**Archivo:** `app.js` línea 11580-11600
**Cambio:**
```js
function checkOnboarding() {
  const flagValue = localStorage.getItem(OB_FLAG_KEY)
  console.log('[checkOnboarding] Flag value:', flagValue, '| Active account:', localStorage.getItem('mn_active_account'))

  if (_obFlagSeen()) {
    console.log('[checkOnboarding] Onboarding already completed - skipping')
    return
  }

  console.log('[checkOnboarding] Starting onboarding flow...')
  // ... resto del código ...
}
```

### FIX #6: Añadir logs en renderGastos y renderIngresos
**Archivo:** `app.js`
**Cambio:**
```js
function renderGastos() {
  console.log('[renderGastos] Called with period:', _gTimePeriod, '| Total gastos:', S.gastos.length)
  // ... resto del código ...
}

function renderIngresos() {
  console.log('[renderIngresos] Called with period:', _gTimePeriod, '| Total ingresos:', S.ingresos.length)
  // ... resto del código ...
}
```

---

## 🧪 CÓMO VERIFICAR QUE FUNCIONA

### Test 1: Onboarding en cuenta nueva
1. Abre la app
2. Abre la consola del navegador (F12)
3. Busca el log: `[MoneyNest] Multi-account system initialized`
4. Crea una cuenta nueva desde el selector
5. Deberías ver el onboarding aparecer

### Test 2: Filtro de período
1. Ve a Gastos o Ingresos
2. Haz click en "Todo"
3. Deberías ver en consola: `[Period Filter] Changing to: all`
4. La tabla debería actualizar mostrando TODOS los registros

### Test 3: Verificar que accounts.js está cargado
1. Abre consola (F12)
2. Escribe: `window.MNAccounts`
3. Debería mostrar un objeto con funciones (boot, getAccounts, etc.)
4. Si muestra `undefined` → accounts.js no se cargó

---

## 📊 RESUMEN

| Bug | Estado | Causa | Fix |
|-----|--------|-------|-----|
| Onboarding no aparece | ✅ FIXED | accounts.js no cargado | Añadido script + boot() |
| Filtro de período no funciona | ✅ FIXED | onclick con comillas rotas | Función helper global |
| Flags onboarding se heredan | ✅ FIXED | No se limpiaban en nueva cuenta | removeItem explícito |

---

## ⚠️ NOTAS

- Los logs de consola son **temporales** para debug — se pueden quitar después
- El fix de accounts.js es **crítico** — sin él nada del sistema multi-cuenta funciona
- El onboarding ahora SÍ debería aparecer en cuentas nuevas
- El filtro de período ahora SÍ debería funcionar en todas las secciones

---

*Fixes aplicados el 2026-05-27 por Claude Code*
