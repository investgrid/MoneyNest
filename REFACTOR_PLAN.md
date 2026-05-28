# MoneyNest — Refactor Plan

## ✅ COMPLETADO (2026-05-28)

### Security
- ✅ Config centralizada (`js/core/config.js`) con Object.freeze
- ✅ Storage wrapper seguro (`js/core/storage.js`)
- ✅ DOMPurify integrado (`js/core/dompurify-wrapper.js`)
- ✅ Sanitizer básico (`js/core/sanitizer.js`)
- ✅ Console.logs eliminados de producción
- ✅ accounts.js eliminado (sistema multi-perfil desactivado)

### Arquitectura
- ✅ Estructura modular creada: `core/`, `modules/`, `services/`, `utils/`
- ✅ Frozen config para prevenir modificación runtime

## 🚧 PENDIENTE (Next PR)

### 1. Split app.js (14,849 líneas)

**Target structure:**
```
js/
├── core/
│   ├── config.js          ✅
│   ├── storage.js         ✅
│   ├── sanitizer.js       ✅
│   ├── dompurify-wrapper.js  ✅
│   └── state.js           🚧 TODO
├── modules/
│   ├── dashboard.js       🚧 Extract from app.js (líneas 4061-4360)
│   ├── ingresos.js        🚧 Extract (4466-4710)
│   ├── gastos.js          🚧 Extract (4712-4874)
│   ├── inversiones.js     🚧 Extract (4876-5121)
│   ├── deudas.js          🚧 Extract (5123-5412)
│   ├── objetivos.js       🚧 Extract (5644-5877)
│   ├── presupuestos.js    🚧 Extract (5879-5973)
│   ├── cuentas.js         🚧 Extract (5975-6118)
│   ├── configuracion.js   🚧 Extract (6120-6285)
│   ├── logros.js          🚧 Extract (6287-6376)
│   ├── analisis.js        🚧 Extract (6378-6900)
│   ├── onboarding.js      🚧 Extract (11496-11640)
│   └── demo.js            🚧 Extract (11213-11499)
├── services/
│   ├── auth.js            ✅ Ya existe (refactor pending)
│   ├── billing.js         ✅ Ya existe
│   ├── charts.js          🚧 Extract all render*Chart functions
│   ├── export.js          🚧 Extract PDF/Excel/CSV
│   └── sync.js            ✅ Ya existe
└── utils/
    ├── formatters.js      🚧 Extract eur(), fmt(), monthLabel(), etc.
    ├── validators.js      🚧 Extract validation functions
    └── helpers.js         🚧 Extract misc utilities
```

### 2. Reemplazar innerHTML con DOMPurify

**83 usos a sanitizar:**
```bash
# Buscar todos:
grep -n "innerHTML\s*=" moneynest_premium/js/app.js

# Reemplazar pattern:
element.innerHTML = html
↓
import { setSafeHTML } from './core/dompurify-wrapper.js'
setSafeHTML(element, html)
```

### 3. Rate Limiting

**Crear:** `js/services/rate-limiter.js`
```js
export const RateLimiter = {
  limits: new Map(),
  
  check(key, maxRequests, windowMs) {
    const now = Date.now()
    const record = this.limits.get(key) || { count: 0, resetAt: now + windowMs }
    
    if (now > record.resetAt) {
      record.count = 0
      record.resetAt = now + windowMs
    }
    
    if (record.count >= maxRequests) {
      return false // Rate limited
    }
    
    record.count++
    this.limits.set(key, record)
    return true
  }
}

// Usage:
if (!RateLimiter.check('api_call', 10, 60000)) {
  toast('Demasiadas peticiones. Espera 1 minuto.', 'error')
  return
}
```

### 4. Validaciones Backend

**Pending Supabase RLS Policies:**

```sql
-- policies.sql

-- Ingresos: solo owner puede ver/editar
CREATE POLICY "Users can CRUD own ingresos"
ON ingresos FOR ALL
USING (auth.uid() = user_id);

-- Gastos: solo owner
CREATE POLICY "Users can CRUD own gastos"
ON gastos FOR ALL
USING (auth.uid() = user_id);

-- Inversiones: solo owner
CREATE POLICY "Users can CRUD own inversiones"
ON inversiones FOR ALL
USING (auth.uid() = user_id);

-- Deudas: solo owner
CREATE POLICY "Users can CRUD own deudas"
ON deudas FOR ALL
USING (auth.uid() = user_id);

-- Billing: read-only para user, write solo desde webhook
CREATE POLICY "Users can read own billing"
ON billing_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Only service_role can write billing"
ON billing_subscriptions FOR INSERT
WITH CHECK (auth.role() = 'service_role');
```

**Edge Functions Validations:**

```typescript
// supabase/functions/create-checkout/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@11.1.0'

serve(async (req) => {
  // ✅ Validate auth
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const { priceId, email } = await req.json()

  // ✅ Validate inputs
  if (!priceId || !email) {
    return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 })
  }

  // ✅ Whitelist price IDs (prevent arbitrary prices)
  const allowedPrices = [
    'price_1TTJCBFWll222Kpazyvo4A4W', // Local
    'price_1TTJD3FWll222KpaJ1T6OG6C'  // Pro
  ]

  if (!allowedPrices.includes(priceId)) {
    return new Response(JSON.stringify({ error: 'Invalid price' }), { status: 400 })
  }

  // ✅ Rate limiting (Supabase built-in or custom)
  // TODO: Add rate limit per user_id

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${req.headers.get('origin')}/success`,
    cancel_url: `${req.headers.get('origin')}/billing`,
    customer_email: email
  })

  return new Response(JSON.stringify({ url: session.url }), { status: 200 })
})
```

### 5. localStorage Protection

**Crear middleware para detección de manipulación:**

```js
// js/core/storage-guard.js

const CRITICAL_KEYS = ['mn_user', 'mn_billing_sub']

export const StorageGuard = {
  init() {
    // Listen to storage changes from other tabs
    window.addEventListener('storage', (e) => {
      if (CRITICAL_KEYS.includes(e.key)) {
        this.validateKey(e.key, e.newValue)
      }
    })

    // Periodic check (detect console manipulation)
    setInterval(() => {
      CRITICAL_KEYS.forEach(key => {
        const value = localStorage.getItem(key)
        this.validateKey(key, value)
      })
    }, 5000)
  },

  validateKey(key, value) {
    if (key === 'mn_user') {
      try {
        const user = JSON.parse(value)
        // ✅ Check plan consistency with backend
        if (user.plan === 'pro' && !this.verifyProPlanBackend(user.id)) {
          console.error('[Security] Plan mismatch detected!')
          localStorage.removeItem('mn_user')
          window.location.reload()
        }
      } catch {}
    }
  },

  async verifyProPlanBackend(userId) {
    // TODO: Call backend to verify plan
    return true
  }
}
```

## 🎯 PRIORIDADES

1. **P0 (Crítico):** Rate limiting + backend validations
2. **P1 (Alto):** Split app.js en 15 módulos
3. **P2 (Medio):** Sanitizar 83 innerHTML con DOMPurify
4. **P3 (Bajo):** Storage guard anti-manipulación

## 📊 MÉTRICAS

- **Antes:** app.js 14,849 líneas, 83 innerHTML sin sanitizar, 0 validaciones backend
- **Después:** ~15 archivos <1000 líneas, 100% sanitizado, RLS + Edge Functions protegidos

## 🚀 DEPLOY

Después de cada fase:
```bash
npm run build
vercel --prod
```

---

*Last updated: 2026-05-28*
