# MoneyNest — CLAUDE.md
**Proyecto:** MoneyNest | **Empresa:** InvestGrid | **Versión:** 2.0  
**Stack:** Vanilla JS + Supabase + Stripe | **Arquitectura:** Local-First PWA  
**Repo:** https://github.com/investgrid/MoneyNest  
**Deploy:** Vercel (branch `main`)

---

## REGLAS DE TRABAJO

1. Verificar siempre con el código real antes de asumir que algo funciona
2. Si el usuario dice que algo no va — ES QUE NO VA. No defender el código anterior
3. Hacer tantos intentos como haga falta hasta que funcione de verdad
4. Verificar con Playwright/screenshots antes de marcar como resuelto
5. Actualizar este CLAUDE.md después de cada bloque de cambios

---

## ARQUITECTURA

```
moneynest_premium/
├── index.html              # Entry point + HTML estructura
├── manifest.json           # PWA manifest
├── service-worker.js       # SW con cache offline
├── assets/                 # Iconos, logo (Logo.png → icon-192/512.png)
├── css/
│   ├── styles.css          # CSS principal (~4000 líneas)
│   ├── premium-ux.css      # Estilos premium
│   ├── billing.css         # Billing UI
│   └── data-manager.css    # Export/Import panel
├── js/
│   ├── app.js              # App principal (~14.700 líneas) — TODO está aquí
│   ├── accounts.js         # Sistema multi-cuenta con proxy localStorage
│   ├── auth.js             # Auth local (planes, trial)
│   ├── billing-ui.js       # UI del trial pill y billing
│   ├── gamification.js     # 150+ logros con lógica real
│   ├── notifications.js    # Sistema notificaciones web
│   ├── data-manager.js     # Export/Import panel (topbar)
│   ├── premium-empty-states.js  # Empty states con animación
│   ├── premium-ux.js       # UX effects
│   └── ...otros
└── components/
    └── auth-ui.js          # Modal de auth y trial pill Pro
```

### Sistema de cuentas (accounts.js)
- Proxy de localStorage: intercepta reads/writes de `ACCOUNT_SCOPED_KEYS` y los namespaces con `mn_accounts:{accountId}:{key}`
- Claves con namespace: `mn7_data`, `mn_user`, `mn7_lang`, `mn7_ob_seen`, `mn7_ob_seen_v2`, `mn7_tut_done`, `mn_billing_sub`, etc.
- `MIGRATION_EXCLUDE`: claves que NUNCA se copian entre cuentas: `mn7_ob_seen`, `mn7_ob_seen_v2`, `mn7_tut_done`
- Proxy se instala una sola vez (`_proxied = true`), reemplaza `Storage.prototype` globalmente

---

## SISTEMA DE PLANES

| Plan | Condición | Features |
|------|-----------|----------|
| `trial` | Nuevo usuario, 24h desde registro | Todo desbloqueado |
| `local` | Pago 5€ único | Sin cloud, todo local ilimitado |
| `pro` | 5€/año + 7d trial | Cloud sync, export PDF/Excel |

---

## ONBOARDING

**Flag actual:** `mn7_ob_seen_v2` (cambiado de `mn7_ob_seen` para forzar reset en usuarios existentes)

**Flujo:**
1. `init()` → `_obFlagSeen()` → si true → `runMiniIntro()` → dashboard
2. Si false → `checkOnboarding()` → `runCinematicIntro()` → `obRender()` → 5 pasos

**Pasos del onboarding (OB_TOTAL=5):**
1. Registro/Login (email + password)
2. Nombre del usuario
3. Tema + idioma + preferencias
4. Plan (trial/local/pro)
5. Finalización → `finishOnboarding()`

**Problema histórico resuelto:** `accounts.js` migraba el flag antiguo (`mn7_ob_seen`) al namespace de nuevas cuentas. Solución: `MIGRATION_EXCLUDE` lo excluye, y renombrado a `_v2` invalida flags existentes.

---

## FILTRO DE PERÍODO GLOBAL

**Variable:** `_gTimePeriod` ('month' | 'lastmonth' | 'year' | 'all' | 'custom')  
**Función:** `_gDateInPeriod(dateStr)` — retorna true si la fecha cae en el período  
**UI:** `_gFilterBar(onChangeFn)` — genera los botones de período

**Estado por sección:**
- ✅ Gastos: usa `_gDateInPeriod(g.fecha)` directamente
- ✅ Ingresos: usa `_gDateInPeriod(i.fecha)` (arreglado — antes ignoraba el período)
- ✅ Análisis: usa `_gDateInPeriod()` en cálculos
- ✅ Inversiones: filtra por `inv.fecha` si período != 'all'
- ✅ Deudas: filtra por pagos o vencimiento en período
- ✅ Objetivos: filtra por aportaciones o fechaObjetivo
- ✅ Presupuestos: muestra mes del período seleccionado

---

## TRIAL PILL (topbar)

El pill de trial viene de `data-manager.js` → `_updateTrialPill()`.  
Mismo tamaño que el badge "Disponible": `padding:5px 14px`, `font-size:.85rem`.  
Colores: indigo normal, amber si <6h, red si <2h.

---

## LOGROS (gamification.js)

150+ achievements con lógica real conectada al estado de la app.  
**Triggers en app.js:** `ingreso_added`, `gasto_added`, `gasto_deleted`, `inversion_added`, `inversion_liquidada`, `revalorizacion_done`, `deuda_added`, `pago_deuda`, `deuda_saldada`, `objetivo_added`, `objetivo_done`, `aportacion_done`, `cuenta_added`, `presupuesto_added`, `cat_created`, `settings_change`, `lang_change`, `demo_mode`, `data_check`, `streak`, `page_visit`, `export_pdf`, `export_excel`, `export_done`, `import_csv`, `custom_debt`, `avalanche_used`, `snowball_used`, `shortcut_used`

**Funciones internas:** `_incCounter()`, `_getCounter()`, `_markPageVisited()`, `_checkFinancial()`, `_checkStreakAchievements()`, `_calcPatrimonio()`, `_checkPresupuestoCumplido()`

**Traducciones:** `_w(key, fallback)` y `_gt(key, fallback)` — comparan resultado con clave para evitar mostrar la clave literal cuando no está traducida.

---

## MOBILE / PWA

**viewport:** `width=device-width, initial-scale=1.0, viewport-fit=cover`  
**status bar iOS:** `apple-mobile-web-app-status-bar-style: black`  
**safe-area:** topbar usa `env(safe-area-inset-top)`, bottom-nav usa `env(safe-area-inset-bottom)`  
**Bottom nav:** 5 items con SVG Lucide (Dashboard, Gastos, +, Análisis, Config)  
**Sidebar overlay:** cubre inset:0 completo con backdrop-filter:blur  
**Idioma en iOS:** `loadLang()` hace fallback a 'es' si no hay preferencia guardada

---

## INVERSIONES — LIQUIDACIÓN

**Lógica correcta:**
```
ganancia = valorSalida - capitalInicial
gananciaTotal = ganancia + beneficiosRetirados   // beneficio REAL total
pendienteRegistrar = ganancia - beneficiosRetirados  // lo que se registra ahora
ROI = (gananciaTotal / capitalInicial) * 100
```
- Si gananciaTotal=0 y beneficiosRetirados>0 → mostrar "Toda la ganancia ya fue retirada"
- `syncLiq()` usa `.toFixed(2)` (punto decimal) para inputs type="number"

---

## BUGS RESUELTOS (historial)

| Bug | Archivo | Causa | Fix |
|-----|---------|-------|-----|
| App en negro | app.js + gamification.js | ASI bug en `return [` + `window.MNGamification` undefined | `;[...` + `= window.MNGamification \|\| {}` |
| Onboarding saltado | accounts.js + app.js | Flag `mn7_ob_seen` migrado al namespace de nueva cuenta | MIGRATION_EXCLUDE + flag renombrado a `_v2` |
| Logros muestran claves raw | gamification.js | `t(k) \|\| fallback` truthy con key | Comparar resultado === key |
| syncLiq "cannot be parsed" | app.js | `fmt()` usa comas ES-ES en `<input type="number">` | Usar `.toFixed(2)` |
| manifest.json 401 | vercel.json | Rewrite `/(.*) → index.html` interceptaba manifest | Rewrites explícitos antes del catch-all |
| i18n iOS en inglés | app.js | `navigator.language='en'` sobreescribía preferencia | Default a 'es' en `loadLang()` |
| Doble flag modo demo | app.js | `_renderDemoFab()` llamada dos veces simultáneamente | Debounce con `_renderDemoFabPending` |
| Liquidar: ganancia incorrecta | app.js | `gananciaFinal = ganancia + beneficiosRetirados` (doble) | `gananciaFinal = ganancia - beneficiosRetirados` |
| Filtro período Ingresos | app.js | `else { // show ALL }` ignoraba `_gTimePeriod` | Aplicar `_gDateInPeriod(i.fecha)` |

---

## PENDIENTE / PRÓXIMOS PASOS

- Mobile responsive: revisión completa pendiente (el usuario ha reportado problemas generales)
- Export PDF/Excel: verificar que funciona en producción con plan Pro
- Sync Supabase: pendiente de integración completa
- i18n: los módulos nuevos tienen textos en ES hardcodeado, falta EN/CA en algunos
- Botón + quick add en bottom nav: verificar que `openQuickAdd()` funciona

---

## AUDITORÍA COMPLETA — 2026-05-27

### Estado verificado con Playwright + screenshots

| Sección | Estado | Notas |
|---------|--------|-------|
| Dashboard | ✅ | KPIs, actividad reciente, gráficos OK |
| Ingresos | ✅ | Tabla, filtros, período OK |
| Gastos | ✅ | Tabla, filtros, período OK |
| Inversiones | ✅ | Abiertas siempre visibles; cerradas filtra por fechaCierre |
| Deudas | ✅ | Estrategias, pago, período OK |
| Objetivos | ✅ | Progreso, aportaciones OK |
| Presupuestos | ✅ | Barras progreso, alertas OK |
| Cuentas | ✅ | Cards, movimientos OK |
| Patrimonio | ✅ | Cálculo correcto OK |
| Análisis | ✅ | Gráficos, métricas OK |
| Logros | ✅ | 140 cards con nombres correctos |
| Configuración | ✅ | Idioma, tema, categorías OK |

### Bugs adicionales arreglados hoy
- **Topbar "GuardaGuarda"**: botones estáticos del HTML se acumulaban con los dinámicos de data-manager.js → eliminados del HTML
- **Inversiones vacías con período**: posiciones abiertas siempre visibles (span múltiples meses)

### Funcionalidad verificada
- Añadir ingreso, gasto, deuda, objetivo: ✅ OK
- Quick add: ✅ OK (display=flex)
- Toggle tema: ✅ OK
- Export fn: ✅ OK
- Período filter ingresos: ✅ OK (all=1, month=1 con datos de prueba)
- Logros: ✅ 140 cards cargadas
- JS Errors: 0
