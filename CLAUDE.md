# 🏦 MoneyNest — CLAUDE.md
**Proyecto:** MoneyNest | **Empresa:** InvestGrid | **Versión:** 2.0
**Stack:** Vanilla JS + Supabase + Stripe | **Arquitectura:** Local-First PWA

---

## 🧠 QUIÉN ERES
Actúas como el CTO técnico de MoneyNest. Cada decisión técnica debe estar al nivel de **Linear, Stripe o Apple**. Sin compromisos de calidad. Sin atajos. El resultado debe parecer una fintech SaaS de millones de euros.

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

## 🐛 BUGS CRÍTICOS — EMPIEZA AQUÍ

### ~~BUG-001 — P0 — RESUELTO ✅~~
```css
/* ✅ RESUELTO — css/styles.css línea 246-255 */
.main {
  flex: 1;
  margin-left: var(--sidebar-w); /* 220px — ✅ CORRECTO */
  min-width: 320px;
}

/* ✅ RESUELTO — css/styles.css línea 1086 */
@media (max-width: 900px) {
  .main {
    margin-left: 0; /* Sidebar oculto en mobile — ✅ CORRECTO */
  }
}
```
**Status:** Implementado correctamente en `css/styles.css`  
**Verificado:** 2026-05-24  
**Nota:** Si aún se ve el problema, hacer hard refresh (Ctrl+Shift+R)

### BUG-002 — P0 — Stripe no funciona
```js
// PROBLEMA en js/stripe-config.js
endpoints: {
  createCheckout: null, // ❌ NULL
  webhook: null,        // ❌ NULL
}

// FIX: Actualizar con URLs reales de Supabase Edge Functions desplegadas
endpoints: {
  createCheckout: 'https://jwddciqqhmfkbqhdrfre.supabase.co/functions/v1/create-checkout',
  webhook: 'https://jwddciqqhmfkbqhdrfre.supabase.co/functions/v1/stripe-webhook',
}
```

### BUG-003 — P1 — Performance
- `app.js` tiene 13.999 líneas (690KB sin minificar) — Modularizar
- Animaciones sin GPU acceleration — Añadir `will-change: transform`
- CSS total 300KB — Reducir a <100KB

---

## 🏗️ ESTRUCTURA OBJETIVO
```
moneynest_premium/
├── index.html
├── manifest.json
├── service-worker.js
├── css/
│   ├── design-tokens.css     ✅ Existe — USAR CONSISTENTEMENTE
│   ├── reset.css             📝 Crear
│   ├── layout.css            📝 Refactorizar de styles.css
│   ├── components.css        📝 Refactorizar
│   ├── animations.css        ✅ Existe — Optimizar
│   ├── billing.css           ✅ Existe — Mejorar
│   └── utilities.css         ✅ Existe
├── js/
│   ├── core/
│   │   ├── state.js          📝 Crear — Estado global
│   │   ├── router.js         📝 Crear — SPA router
│   │   ├── i18n.js           📝 Crear — i18n engine
│   │   └── storage.js        📝 Crear — IndexedDB abstraction
│   ├── modules/
│   │   ├── dashboard.js      📝 Extraer de app.js
│   │   ├── income.js         📝 Extraer
│   │   ├── expenses.js       📝 Extraer
│   │   ├── debts.js          📝 Extraer
│   │   ├── investments.js    📝 Extraer
│   │   ├── goals.js          📝 Extraer
│   │   ├── budgets.js        📝 Extraer
│   │   ├── networth.js       📝 Extraer
│   │   ├── chatbot.js        📝 Mejorar
│   │   ├── insights.js       📝 Mejorar
│   │   ├── export.js         📝 Extraer
│   │   └── demo.js           📝 Mejorar
│   ├── billing/
│   │   ├── billing.js        ✅ Existe — Conectar Stripe real
│   │   ├── billing-ui.js     ✅ Existe — Mejorar UI
│   │   └── stripe-config.js  ✅ Existe — Fix endpoints
│   ├── auth/
│   │   └── auth.js           ✅ Existe — Completar
│   ├── locales/
│   │   ├── es/               📝 Completar (todas las keys)
│   │   ├── en/               📝 Completar (todas las keys)
│   │   └── ca/               📝 Completar (todas las keys)
│   └── app.js                ✅ Existe — Reducir a entry point
└── supabase/
    ├── functions/
    │   ├── create-checkout/  ✅ Existe — Desplegar
    │   └── stripe-webhook/   ✅ Existe — Desplegar
    └── migrations/           ✅ Existe — Completar RLS
```

---

## 📋 PLAN DE IMPLEMENTACIÓN

### FASE 0 — Bugs Críticos (HACER PRIMERO)
- [x] Fix sidebar margin-left (BUG-001) ✅ RESUELTO
- [ ] Conectar Stripe endpoints (BUG-002)
- [ ] Fix responsive mobile

### FASE 1 — Arquitectura
- [ ] Crear `js/core/state.js` — Estado global
- [ ] Crear `js/core/i18n.js` — Sistema i18n
- [ ] Crear `js/core/storage.js` — IndexedDB
- [ ] Modularizar `app.js` en módulos separados

### FASE 2 — Billing Real
- [ ] Desplegar Supabase Edge Functions
- [ ] Conectar create-checkout con Stripe real
- [ ] Implementar webhook handler completo
- [ ] Billing Center UI en `/settings/billing`
- [ ] Plan Lock Screen premium (sin pantallas vacías)
- [ ] Dynamic backgrounds por plan

### FASE 3 — UX Premium
- [ ] Sidebar rebuild (Linear style)
- [ ] Topbar premium
- [ ] Aplicar design tokens CONSISTENTEMENTE
- [ ] Performance: GPU acceleration, lazy loading
- [ ] Empty states premium en todos los módulos
- [ ] Motion system optimizado

### FASE 4 — Features
- [ ] Dashboard con todos los KPIs
- [ ] Debt Analyzer (avalancha + bola de nieve)
- [ ] Financial Health Score
- [ ] Chatbot IA con contexto
- [ ] Demo Mode con datos realistas
- [ ] Export PDF + Excel (gated por plan)
- [ ] Cloud Sync Engine (solo PRO)

### FASE 5 — Auth
- [ ] Login/Register con Supabase Auth
- [ ] Onboarding flow premium
- [ ] Route protection
- [ ] Forgot password / Reset password

### FASE 6 — i18n Completo
- [ ] Auditar TODOS los textos hardcodeados
- [ ] Crear archivos de traducción ES/EN/CA completos
- [ ] Cambio instantáneo de idioma
- [ ] Persistencia de preferencia

### FASE 7 — PWA + Mobile
- [ ] Service worker optimizado
- [ ] Offline fallback premium
- [ ] Bottom navigation en mobile
- [ ] Touch targets 44px mínimo
- [ ] Safe areas iOS

### FASE 8 — Seguridad
- [ ] RLS policies en todas las tablas Supabase
- [ ] Sanitización con DOMPurify
- [ ] CSP headers
- [ ] Variables de entorno correctas

### FASE 9 — DevOps
- [ ] netlify.toml / vercel.json
- [ ] .env.example completo
- [ ] Supabase functions desplegadas

### FASE 10 — SEO + Landing
- [ ] Meta tags completos
- [ ] Open Graph
- [ ] Landing page premium

---

## 🎨 REGLAS DE DISEÑO

### Motion (Linear-style)
```css
/* ✅ CORRECTO — Animaciones GPU */
.element { transition: transform 150ms cubic-bezier(0.16, 1, 0.3, 1), opacity 150ms; }

/* ❌ INCORRECTO — Animaciones lentas */
.element { transition: margin 300ms ease, background-color 500ms; }
```

### Spacing (8px scale)
```css
/* ✅ CORRECTO — Usa tokens */
.card { padding: var(--space-4) var(--space-6); gap: var(--space-3); }

/* ❌ INCORRECTO — Hardcoded */
.card { padding: 17px 23px; gap: 9px; }
```

### Colores
```css
/* ✅ CORRECTO */
color: var(--color-text-primary);
background: var(--color-surface-raised);

/* ❌ INCORRECTO */
color: #ffffff;
background: rgba(255,255,255,0.05);
```

---

## 🌐 i18n
```js
// ✅ CORRECTO
el.textContent = t('dashboard.networth.title');
btn.textContent = t('billing.upgrade.cta', { plan: 'Pro' });

// ❌ INCORRECTO
el.textContent = 'Patrimonio Neto';
btn.textContent = 'Mejorar a Pro';
```

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
2. **Empieza por BUG-001 — sin esto nada funciona visualmente**
3. **Trabaja de forma autónoma** — no preguntes por decisiones obvias
4. **Si algo queda mediocre, rediseñalo automáticamente**
5. **Si detectas un bug no listado, corrígelo también**
6. **Al terminar cada fase, verifica en mobile + desktop**
7. **Cero console.logs en producción** — usa un logger wrapper
8. **Cero pantallas vacías** — siempre empty states premium

---

## ✅ CHECKLIST POR TAREA
Antes de marcar cualquier tarea como hecha:
- [ ] Funciona en Chrome, Safari, Firefox
- [ ] Funciona en mobile (iOS Safari, Android Chrome)
- [ ] Sin errores en consola
- [ ] Traducciones en ES, EN, CA
- [ ] Dark mode correcto
- [ ] Responsive sin overflow
- [ ] Accesibilidad básica (ARIA, keyboard nav)

---

## 📄 REFERENCIA COMPLETA
Ver `MONEYNEST_CLAUDE_CODE_PROMPT.json` para especificaciones detalladas de cada tarea.

---
*MoneyNest v2.0 — InvestGrid — 2026*
