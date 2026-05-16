# 🏦 MoneyNest — CLAUDE.md v2.1 (Optimizado para Claude Code)

**Proyecto:** MoneyNest | **Stack:** Vanilla JS + Supabase + Stripe | **PWA**

---

## ⚠️ REGLA DE ORO — LEE ESTO PRIMERO

**Haz UNA SOLA TAREA a la vez.**
- Lee el código existente ANTES de tocar nada.
- Muéstrame el diff antes de aplicar cualquier cambio.
- NO toques archivos que no estén en la tarea actual.
- NO refactorices, NO renombres, NO reformatees lo que no se pide.
- Si encuentras un bug fuera de scope, anótalo pero NO lo toques.
- Al terminar cada tarea, para y espera confirmación.

---

## 📦 STACK
- Vanilla HTML5 + CSS3 + JS ES6+ (NO React, NO Vue)
- Supabase (Auth + PostgreSQL + Edge Functions)
- Stripe (Checkout + Webhooks)
- Chart.js, IndexedDB/localStorage, PWA

## 🔑 CREDENCIALES
```
Stripe PK:          pk_live_51T57NbFWll222Kpac9uR0087YoUUATVJCxRg3TzYSC7y0EacJnpooDne5ty7vZOEGrkqA35mj6Rf5unOsDiMzBlp00h0Q8bEJt
Stripe Price Local: price_1TTJCBFWll222Kpazyvo4A4W   (5€ único)
Stripe Price Pro:   price_1TTJD3FWll222KpaJ1T6OG6C   (5€/año)
Supabase URL:       https://jwddciqqhmfkbqhdrfre.supabase.co
Supabase Anon Key:  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3ZGRjaXFxaG1ma2JxaGRyZnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NjkyMjcsImV4cCI6MjA5NDM0NTIyN30.Gqz39AWpW1BkWXhfhnR_vOUYUy93bgdSNvBfXYQ3VGk
```
> Secret Key de Stripe y Webhook Secret: SOLO en variables de entorno de Supabase Edge Functions.

## 🎨 REGLAS DE DISEÑO (no cambies nada que no se pida)
- Usa SIEMPRE los CSS custom properties existentes en `css/styles.css` (`--sidebar-w`, `--color-*`, `--space-*`)
- Animaciones: solo `transform` y `opacity`. Añadir `will-change: transform` donde haya animación.
- Spacing: escala de 8px usando variables existentes.
- CERO `!important` salvo emergencia documentada.
- CERO colores hardcoded (usa variables).

---

## 🐛 TAREAS EN ORDEN — EJECUTA DE UNA EN UNA

### ✅ TAREA 1 — Fix sidebar layout (10 min)
**Archivo:** `css/styles.css`
**Problema:** `.main` en línea 223 no tiene `margin-left`. El sidebar tapa el contenido.
**Fix exacto — solo estas líneas, nada más:**
```css
/* ANTES (línea 223): */
.main{flex:1;min-width:320px;display:flex;flex-direction:column;overflow:hidden}

/* DESPUÉS: */
.main{flex:1;margin-left:var(--sidebar-w);min-width:320px;display:flex;flex-direction:column;overflow:hidden}

/* En el media query mobile (<900px), añadir: */
.main{margin-left:0}
```
**Verificar:** desktop muestra sidebar + contenido lado a lado. Mobile: contenido a ancho completo.
**STOP. No toques nada más.**

---

### ✅ TAREA 2 — Conectar Stripe real (30 min)
**Archivos a crear/modificar:**
1. Crear `js/stripe-config.js` (nuevo archivo)
2. Modificar `index.html` — los listeners `mn:buyLocal` y `mn:activatePro`

**stripe-config.js debe contener:**
```js
'use strict';
const STRIPE_CONFIG = Object.freeze({
  publishableKey: 'pk_live_51T57NbFWll222Kpac9uR0087YoUUATVJCxRg3TzYSC7y0EacJnpooDne5ty7vZOEGrkqA35mj6Rf5unOsDiMzBlp00h0Q8bEJt',
  prices: {
    local: 'price_1TTJCBFWll222Kpazyvo4A4W',
    pro:   'price_1TTJD3FWll222KpaJ1T6OG6C',
  },
  endpoints: {
    createCheckout: 'https://jwddciqqhmfkbqhdrfre.supabase.co/functions/v1/create-checkout',
    webhook:        'https://jwddciqqhmfkbqhdrfre.supabase.co/functions/v1/stripe-webhook',
  },
});
```

**En index.html — reemplazar los TODOs por llamadas reales a createCheckout.**
El flujo: `fetch(STRIPE_CONFIG.endpoints.createCheckout, { method:'POST', body: JSON.stringify({priceId, email}) })` → obtener `sessionUrl` → `window.location.href = sessionUrl`.

**Añadir `<script src="js/stripe-config.js"></script>` ANTES de billing.js en index.html.**
**STOP. No toques CSS, no toques app.js.**

---

### ✅ TAREA 3 — Supabase Edge Functions (45 min)
**Archivos:** `supabase/functions/create-checkout/index.ts` y `supabase/functions/stripe-webhook/index.ts`

Si no existen, créalos. Si existen, revísalos y completa lo que falte.

**create-checkout/index.ts** debe:
- Recibir `{ priceId, email, successUrl, cancelUrl }`
- Crear Stripe Checkout Session con `stripe.checkout.sessions.create(...)`
- Devolver `{ sessionUrl }`
- Usar `Deno.env.get('STRIPE_SECRET_KEY')`

**stripe-webhook/index.ts** debe:
- Verificar firma con `stripe.webhooks.constructEvent(body, sig, Deno.env.get('STRIPE_WEBHOOK_SECRET'))`
- Manejar `checkout.session.completed` → actualizar tabla `profiles` en Supabase
- Manejar `customer.subscription.deleted` → degradar plan
- Devolver 200 OK siempre (aunque falle internamente, para que Stripe no reintente)

**STOP. No toques frontend hasta que las functions estén listas.**

---

### ✅ TAREA 4 — Performance CSS (20 min)
**Archivo:** `css/styles.css` y `css/premium-ux.css`

Solo añadir `will-change: transform` a elementos animados.
Busca con: `grep -n "transition\|animation\|@keyframes" css/styles.css`
Para cada elemento con animación, añade `will-change: transform` en su selector.

**NO cambies ningún valor de color, spacing, layout ni tipografía.**
**STOP.**

---

### ✅ TAREA 5 — Modularizar app.js (2-3h)
Solo después de que las tareas 1-4 estén funcionando y testeadas.

Extraer en este orden:
1. `js/core/storage.js` — funciones localStorage/IndexedDB
2. `js/core/state.js` — estado global
3. `js/modules/dashboard.js` — funciones del dashboard
4. `js/modules/income.js` — ingresos
5. `js/modules/expenses.js` — gastos
(continuar módulo a módulo)

**Regla:** Extrae funciones, NO las reescribas. Copia el código exacto, muévelo al módulo, exporta, importa en app.js. Verifica que funciona igual antes de extraer el siguiente.

---

### ✅ TAREAS 6-11 (Fases 2-10)
Solo cuando la Tarea 5 esté completa. Se detallan en `MONEYNEST_CLAUDE_CODE_PROMPT.json`.

---

## 🚨 SI CLAUDE CODE SE DESMADRA

Si empieza a cambiar cosas que no se piden, escribe exactamente:

```
Stop. Revert all changes. Let's start over with ONLY this specific change:
[describe el cambio exacto]
Show me the diff before applying. Do not touch any other file.
```

---

## ✅ CHECKLIST ANTES DE MARCAR TAREA COMO HECHA
- [ ] Solo toqué los archivos de la tarea
- [ ] Funciona en Chrome desktop
- [ ] Funciona en mobile (resize ventana a 375px)
- [ ] Sin errores en consola
- [ ] El diseño no cambió visualmente (salvo lo que debía cambiar)
- [ ] Hice `git commit` con mensaje descriptivo

---
*MoneyNest v2.1 — InvestGrid — 2026*
