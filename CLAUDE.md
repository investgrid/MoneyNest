# 🏦 MoneyNest V2.0 — CLAUDE.md
**Proyecto:** MoneyNest | **Empresa:** InvestGrid | **Versión:** 2.0  
**Stack:** Vanilla JS + Supabase + Stripe | **Arquitectura:** Local-First PWA

---

## 🧠 QUIÉN ERES
Actúas como el **CTO técnico de MoneyNest**. Cada decisión técnica debe estar al nivel de **Linear, Stripe o Apple**. Sin compromisos de calidad. Sin atajos. El resultado debe parecer una fintech SaaS de millones de euros.

---

## 🚀 PLAN DE REESCRITURA PROFESIONAL V2.0

### 📋 CONTEXTO

**Problema actual:**
- `app.js` monolítico: **14,697 líneas** (759 KB)
- Sistema i18n parcial: 735 keys existentes, ~50 strings hardcodeados pendientes
- CSS: 284 KB distribuido en 4 archivos
- Sin modularización ni arquitectura escalable

**Objetivo:**
Reescribir completamente la aplicación con **arquitectura profesional** nivel Linear/Stripe, manteniendo el backend actual (Supabase + Stripe) 100% intacto.

**Estrategia:**
Implementación **pestaña por pestaña**, una a una, con coexistencia temporal de código viejo y nuevo hasta completar la migración.

**Ubicación nuevo proyecto:** `c:\Users\joanm\Desktop\MoneyNest`

---

## 🎯 REQUISITOS CLAVE

1. ✅ **i18n perfecto desde día 1** — Cero textos hardcodeados
2. ✅ **Backend intacto** — Supabase + Stripe sin tocar (solo fix endpoints)
3. ✅ **Vanilla JS + ES6 modules** — NO React/Vue
4. ✅ **Implementación gradual** — Módulo por módulo
5. ✅ **Calidad premium** — Nivel Linear/Stripe/Apple

---

## 📁 NUEVA ESTRUCTURA PROFESIONAL

```
c:\Users\joanm\Desktop\MoneyNest\
├── index.html
├── manifest.json
├── service-worker.js
│
├── css/
│   ├── 1-tokens.css              # Design tokens
│   ├── 2-base.css                # Reset + base
│   ├── 3-layout.css              # Grid, sidebar, topbar
│   ├── 4-components/             # Componentes UI
│   │   ├── buttons.css
│   │   ├── cards.css
│   │   ├── modals.css
│   │   ├── forms.css
│   │   ├── navigation.css
│   │   └── tables.css
│   ├── 5-modules/                # Estilos por módulo
│   │   ├── dashboard.css
│   │   ├── income.css
│   │   ├── expenses.css
│   │   └── [resto de módulos]
│   ├── 6-animations.css
│   ├── 7-responsive.css
│   └── 8-utilities.css
│
├── js/
│   ├── core/                     # ⭐ SISTEMAS FUNDAMENTALES
│   │   ├── state.js              # Estado global reactivo (Proxy)
│   │   ├── router.js             # SPA router (History API)
│   │   ├── i18n.js               # Sistema i18n completo
│   │   ├── storage.js            # IndexedDB + localStorage fallback
│   │   ├── logger.js             # Logger dev/prod
│   │   ├── events.js             # Event bus
│   │   └── utils.js              # Utilities compartidas
│   │
│   ├── ui/                       # Helpers UI
│   │   ├── toast.js
│   │   ├── modal.js
│   │   ├── loading.js
│   │   └── confirm.js
│   │
│   ├── modules/                  # ⭐ MÓDULOS DE NEGOCIO
│   │   ├── dashboard/
│   │   │   ├── dashboard.module.js
│   │   │   ├── dashboard.render.js
│   │   │   ├── dashboard.charts.js
│   │   │   └── dashboard.kpis.js
│   │   ├── income/
│   │   │   ├── income.module.js
│   │   │   ├── income.render.js
│   │   │   └── income.modal.js
│   │   ├── expenses/
│   │   ├── investments/
│   │   ├── debts/
│   │   ├── goals/
│   │   ├── budgets/
│   │   ├── accounts/
│   │   ├── networth/
│   │   ├── analysis/
│   │   ├── export/
│   │   └── settings/
│   │
│   ├── auth/                     # Mantener actual mejorado
│   │   ├── auth.js
│   │   └── supabase-auth.js
│   │
│   ├── billing/                  # Mantener + fix endpoints
│   │   ├── billing.js
│   │   ├── billing-ui.js
│   │   ├── stripe-config.js      # FIX: endpoints null → URLs reales
│   │   └── stripe-payment.js
│   │
│   ├── features/                 # Mantener
│   │   ├── gamification.js
│   │   ├── notifications.js
│   │   ├── recurring.js
│   │   └── csv-import.js
│   │
│   ├── locales/                  # ⭐ i18n JSON
│   │   ├── es.json               # 735+ keys
│   │   ├── en.json
│   │   └── ca.json
│   │
│   └── app.js                    # Entry point + bootstrap
│
└── supabase/                     # NO TOCAR (mantener)
    └── functions/
```

---

## 🔧 SISTEMAS CORE (Semana 1)

### 1. State Management (`js/core/state.js`)

**Características:**
- Proxy reactivo con detección automática de cambios
- Observers granulares por clave
- Persistencia automática en storage
- Batch updates

**API:**
```javascript
const state = createState(initialState);

// Leer
const ingresos = state.get('ingresos');

// Escribir (dispara observers)
state.set('ingresos', [...ingresos, newIncome]);

// Observar cambios
state.observe('ingresos', (newVal, oldVal) => {
  console.log('Ingresos updated');
  render();
});

// Batch updates
state.batch(() => {
  state.set('ingresos', [...]);
  state.set('gastos', [...]);
});
```

### 2. Router (`js/core/router.js`)

**Características:**
- History API (URLs limpias)
- Lazy loading de módulos
- Guards (beforeEnter, beforeLeave)
- Query params

**API:**
```javascript
router.addRoute('/', DashboardModule);
router.addRoute('/income', IncomeModule);
router.addRoute('/expenses', ExpensesModule);

router.navigate('/expenses?month=2025-05');

router.beforeEnter('/billing', () => {
  if (!isPro()) return false;
  return true;
});
```

### 3. i18n System (`js/core/i18n.js`)

**Características:**
- Carga dinámica de JSON por idioma
- Interpolación: `t('welcome', { name: 'Juan' })`
- Pluralización
- Fallback en cascada: ca → es → en
- Hot reload (cambio instantáneo)

**API:**
```javascript
await i18n.init('es');

i18n.t('nav.dashboard'); // → "Dashboard"
i18n.t('welcome_user', { name: 'Juan' }); // → "Hola, Juan"

await i18n.setLanguage('en');
```

**Estructura JSON:**
```json
{
  "nav": {
    "dashboard": "Dashboard",
    "income": "Ingresos",
    "expenses": "Gastos"
  },
  "dashboard": {
    "networth": "Patrimonio Neto",
    "available": "Disponible"
  },
  "common": {
    "save": "Guardar",
    "cancel": "Cancelar"
  }
}
```

### 4. Storage (`js/core/storage.js`)

IndexedDB como principal, localStorage como fallback, con versionado y migraciones automáticas.

### 5. Logger (`js/core/logger.js`)

Niveles debug/info/warn/error, deshabilitado en producción, persistencia de errores críticos.

### 6. UI Helpers

```javascript
// Toast
toast.success('Guardado correctamente');

// Modal
await modal.open({ title: 'Nuevo ingreso', content: formHTML });

// Loading
loading.show('Exportando...');

// Confirm
const confirmed = await confirm('¿Eliminar?', 'No se puede deshacer');
```

---

## 📋 ORDEN DE IMPLEMENTACIÓN (Pestaña por Pestaña)

### FASE 1 - Infraestructura (Semana 1)
1. **Core Systems** (state, router, i18n, storage, logger, ui helpers)
2. **Accounts Module** (simple, sin dependencias críticas)
3. Testing infraestructura

### FASE 2 - Módulos Financieros Básicos (Semanas 2-3)
4. **Income Module** (Ingresos) — Más simple que gastos
5. **Expenses Module** (Gastos) — Reutiliza patterns de income
6. **Dashboard Module** — Consume income + expenses

### FASE 3 - Módulos Avanzados (Semanas 4-5)
7. **Investments Module** (Inversiones + revalorización + ROI)
8. **Debts Module** (Deudas + analyzer avalancha/snowball)
9. **Goals Module** (Objetivos + upload imágenes)

### FASE 4 - Planificación y Análisis (Semana 6)
10. **Budgets Module** (Presupuestos)
11. **Net Worth Module** (Patrimonio — consume todos)
12. **Analysis Module** (Análisis + proyecciones)

### FASE 5 - Módulos Auxiliares (Semana 7)
13. **Settings Module**
14. **Export Module** (PDF/Excel)
15. **Demo Module**

### FASE 6 - Polish + Launch (Semanas 8-9)
16. CSS final + Testing exhaustivo
17. Deploy + Launch

---

## 🔄 COEXISTENCIA CÓDIGO VIEJO/NUEVO

**Estrategia:** Código legacy coexiste temporalmente hasta que cada módulo nuevo esté 100% completo.

```javascript
// js/app.js (bootstrap)
import { router } from './core/router.js';
import DashboardModule from './modules/dashboard/dashboard.module.js';
import IncomeModule from './modules/income/income.module.js';

// Legacy temporal
import { renderInversiones, renderDeudas } from './legacy/app-legacy.js';

async function init() {
  await i18n.init('es');
  await state.init();
  await router.init();
  
  // Rutas NUEVAS (migradas)
  router.addRoute('/', DashboardModule);
  router.addRoute('/income', IncomeModule);
  
  // Rutas LEGACY (temporales — se eliminan al migrar)
  router.addRoute('/investments', () => renderInversiones());
  router.addRoute('/debts', () => renderDeudas());
  
  router.start();
}
```

---

## ✅ CHECKLIST DE TESTING POR MÓDULO

**Template para cada módulo:**

### Funcionalidad Core
- [ ] CRUD completo
- [ ] Validación de formularios
- [ ] Persistencia en storage
- [ ] Filtros funcionando

### UI/UX
- [ ] Modal open/close sin glitches
- [ ] Animaciones suaves (60fps)
- [ ] Loading states
- [ ] Empty states premium

### i18n
- [ ] Todos los textos traducidos (ES/EN/CA)
- [ ] Cambio de idioma en vivo funciona
- [ ] Formatos moneda/fecha correctos

### Responsive
- [ ] Desktop (>1200px) óptimo
- [ ] Tablet (768-1200px) funcional
- [ ] Mobile (<768px) touch-friendly
- [ ] Touch targets >44px

### Performance
- [ ] Render inicial <100ms
- [ ] Sin memory leaks
- [ ] Charts destroy correctamente

### Accesibilidad
- [ ] Navegación por teclado
- [ ] Focus visible
- [ ] ARIA labels
- [ ] Contraste WCAG AA

---

## 🎨 DISEÑO PROFESIONAL

### Design Tokens

```css
:root {
  /* Colors */
  --color-bg: #0A0E17;
  --color-surface: #111827;
  --color-text-primary: #E8EFF7;
  --color-accent: #00D4AA;
  
  /* Spacing (8px scale) */
  --space-1: 0.25rem;  /* 4px */
  --space-4: 1rem;     /* 16px */
  --space-6: 1.5rem;   /* 24px */
  
  /* Typography */
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-xl: 1.25rem;
  
  /* Radius */
  --radius-sm: 8px;
  --radius-lg: 16px;
  
  /* Transitions */
  --transition-fast: 120ms cubic-bezier(0.16, 1, 0.3, 1);
}
```

### Motion (Linear-style)

```css
/* ✅ CORRECTO — Animaciones GPU */
.element { 
  transition: transform 150ms cubic-bezier(0.16, 1, 0.3, 1), opacity 150ms;
  will-change: transform;
}

/* ❌ INCORRECTO — Animaciones lentas */
.element { transition: margin 300ms ease, background-color 500ms; }
```

### GPU Optimization

```css
/* ✅ BUENO — Solo composite */
.card {
  transition: transform var(--transition-base);
  will-change: transform;
}
.card:hover {
  transform: translateY(-4px);
}
```

---

## 📦 MIGRACIÓN i18n (735 keys existentes)

**Proceso:**

1. **Extraer keys del código actual** (`app.js`, `i18n-patch.js`)
2. **Reorganizar en namespaces** (nav, dashboard, income, common, etc.)
3. **Crear JSON files** (`es.json`, `en.json`, `ca.json`)
4. **Completar traducciones faltantes** (~50 strings hardcodeados)
5. **Migrar a nuevo sistema** (reemplazar llamadas a `t()` legacy)

---

## ⏱️ CRONOGRAMA

| Semana | Días | Tareas | Milestone |
|--------|------|--------|-----------|
| 1 | 1-7 | Core Systems + Accounts | M1: Infraestructura OK |
| 2 | 8-14 | Income + CSS tokens | M2: 2 módulos migrados |
| 3 | 15-21 | Expenses + Dashboard | M3: App funcional básica |
| 4 | 22-28 | Investments | - |
| 5 | 29-35 | Debts + Goals | M4: Módulos avanzados |
| 6 | 36-42 | Budgets + Networth + Analysis | M5: Planificación completa |
| 7 | 43-49 | Export + Demo + Settings | M6: Legacy eliminado |
| 8 | 50-56 | CSS final + Testing | M7: Polish completo |
| 9 | 57-63 | Deploy + Launch | M8: Producción |

**Total:** 63 días full-time (~9 semanas)  
**Part-time (4h/día):** ~18 semanas (4.5 meses)

---

## 🚀 PRÓXIMOS PASOS INMEDIATOS

### HOY
1. ✅ Aprobar plan
2. Crear carpeta `c:\Users\joanm\Desktop\MoneyNest`
3. Backup completo del proyecto actual
4. Crear branch `rewrite-v2` en git

### MAÑANA (Día 1)
1. Crear estructura de carpetas nueva
2. Setup `js/core/state.js` básico
3. Setup `js/core/router.js` básico
4. Primera ruta funcionando (`/` → Dashboard vacío)

### ESTA SEMANA (Días 2-7)
1. Completar core systems
2. Migrar 735 keys i18n a JSON
3. Testing infraestructura
4. **Milestone 1**

---

## 📦 STACK TÉCNICO

- **Frontend:** Vanilla HTML5 + CSS3 + JavaScript ES6+ (NO React, NO Vue)
- **PWA:** Service Worker + Web App Manifest
- **Backend:** Supabase (PostgreSQL + Auth + Edge Functions)
- **Pagos:** Stripe (Checkout + Webhooks + Portal)
- **Charts:** Chart.js
- **Storage:** IndexedDB (preferido) + localStorage (fallback)

---

## 🔑 CREDENCIALES (YA CONFIGURADAS)

```
Stripe Publishable Key: pk_live_51T57NbFWll222Kpac9uR0087YoUUATVJCxRg3TzYSC7y0EacJnpooDne5ty7vZOEGrkqA35mj6Rf5unOsDiMzBlp00h0Q8bEJt
Stripe Price Local (5€ único):   price_1TTJCBFWll222Kpazyvo4A4W
Stripe Price Pro (5€/año):       price_1TTJD3FWll222KpaJ1T6OG6C
Stripe Product Local:            prod_USDdaHgyW9lPe6
Stripe Product Pro:              prod_USDeOkWj3MryiO
Supabase URL:                    https://jwddciqqhmfkbqhdrfre.supabase.co
Supabase Anon Key:               eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3ZGRjaXFxaG1ma2JxaGRyZnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NjkyMjcsImV4cCI6MjA5NDM0NTIyN30.Gqz39AWpW1BkWXhfhnR_vOUYUy93bgdSNvBfXYQ3VGk
```

> ⚠️ La Secret Key de Stripe y el Webhook Secret van SOLO en Supabase Edge Functions (variables de entorno), NUNCA en el frontend.

---

## 💰 PLANES

| Plan | Precio | Cloud | Duración |
|------|--------|-------|----------|
| FREE_TRIAL | Gratis | ❌ | 24h desde registro |
| LOCAL_LIFETIME | 5€ único | ❌ | Ilimitado |
| PRO_ANNUAL | 5€/año | ✅ Supabase | Anual, trial 7d |

---

## 🔐 SEGURIDAD

```js
// ✅ CORRECTO — Sanitizar siempre
el.innerHTML = DOMPurify.sanitize(userContent);
el.textContent = userContent; // Mejor cuando sea posible

// ❌ NUNCA
el.innerHTML = userContent;
eval(userCode);
```

---

## 🏃 REGLAS DE EJECUCIÓN

1. **Lee siempre el código existente antes de modificar**
2. **Implementación pestaña por pestaña** — una a una, completa antes de seguir
3. **Trabaja de forma autónoma** — no preguntes por decisiones obvias
4. **Si algo queda mediocre, rediseñalo automáticamente**
5. **Si detectas un bug no listado, corrígelo también**
6. **Al terminar cada módulo, verifica en mobile + desktop**
7. **Cero console.logs en producción** — usa logger wrapper
8. **Cero pantallas vacías** — siempre empty states premium
9. **i18n perfecto** — cero textos hardcodeados en código nuevo
10. **Cada error actualiza este CLAUDE.md** — para no repetir

---

## ✅ VERIFICACIÓN FINAL

**Antes de marcar v2.0 como completado:**

- [ ] Funciona en Chrome, Safari, Firefox, Edge
- [ ] Funciona en iOS Safari + Android Chrome
- [ ] Sin errores en consola
- [ ] i18n completo ES/EN/CA
- [ ] Dark mode + Light mode
- [ ] Responsive sin overflow
- [ ] Accesibilidad WCAG AA
- [ ] Performance: Lighthouse >90
- [ ] PWA funcionando
- [ ] Backend Supabase + Stripe OK
- [ ] TODO código legacy eliminado

---

**Este plan implementa una reescritura profesional completa, pestaña por pestaña, con i18n perfecto desde día 1, manteniendo el backend intacto.**

---
*MoneyNest v2.0 — InvestGrid — 2026*
