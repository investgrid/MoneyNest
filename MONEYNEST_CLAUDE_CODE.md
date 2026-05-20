# MoneyNest — Plan de acción para Claude Code
> Stack: Vanilla JS · Supabase Edge Functions (Deno) · Stripe · Vercel
> Prioridad: ejecuta los bloques en orden. Cada uno es independiente.

---

## BLOQUE 1 — CRÍTICO: Idempotencia del webhook (bug de doble ejecución)

**Archivo:** `supabase/functions/stripe-webhook/index.ts`

**Problema:** El webhook ejecuta los handlers de negocio (`activate_local_plan`, `activate_pro_plan`, etc.) ANTES de insertar en `billing_events`. Cuando Stripe reintenta un evento (lo hace siempre si no recibe 200 a tiempo), el plan se activa dos veces o se producen inserciones duplicadas en `purchases`.

**Fix:** Al inicio del handler principal, consulta `billing_events` por `stripe_event_id`. Si ya existe, devuelve 200 inmediatamente.

```typescript
// En la función Deno.serve, justo después de construir el evento verificado:

// ── Idempotency check ─────────────────────────────────────────
const { data: existingEvent } = await supabase
  .from('billing_events')
  .select('id')
  .eq('stripe_event_id', event.id)
  .maybeSingle();

if (existingEvent) {
  return json({ received: true, skipped: 'duplicate' });
}
// ─────────────────────────────────────────────────────────────
```

Coloca este bloque ANTES del `switch (event.type)` y ANTES de cualquier llamada a handlers.

---

## BLOQUE 2 — CRÍTICO: CORS restrictivo en Edge Functions

**Archivos:**
- `supabase/functions/create-checkout/index.ts`
- `supabase/functions/create-payment-intent/index.ts`

**Problema:** Ambas funciones tienen `'Access-Control-Allow-Origin': '*'`. Cualquier origen puede llamar tu backend y crear sesiones de pago o payment intents con emails arbitrarios.

**Fix:** Reemplaza el objeto CORS en ambos archivos:

```typescript
// Reemplaza el objeto CORS existente por este:
const ALLOWED_ORIGINS = new Set([
  'https://moneynest.vercel.app',         // ← tu dominio de producción en Vercel
  'https://www.moneynest.vercel.app',     // ← con www si aplica
  'http://localhost:3000',                 // ← solo para desarrollo local
  'http://localhost:5173',                 // ← si usas Vite localmente
]);

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? '';
  const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : '';
  return {
    'Access-Control-Allow-Origin':  allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}
```

Luego en cada respuesta usa `getCorsHeaders(req)` en lugar del objeto `CORS` estático.

> **Importante:** Actualiza `ALLOWED_ORIGINS` con tu dominio real de Vercel antes de hacer deploy.

---

## BLOQUE 3 — CRÍTICO: URL hardcodeada de Netlify en create-checkout

**Archivo:** `supabase/functions/create-checkout/index.ts`

**Problema:** La línea:
```typescript
const origin = req.headers.get('origin') ?? 'https://agent-6a08ab04eaf8e721444cc273--moneynestv.netlify.app';
```
Si el header `Origin` llega vacío, Stripe redirige a la URL de desarrollo antigua. El flujo de pago se rompe en producción.

**Fix:** Valida el origin contra la lista blanca y lanza error si no es válido:

```typescript
const origin = req.headers.get('origin') ?? '';

if (!ALLOWED_ORIGINS.has(origin)) {
  return new Response(JSON.stringify({ error: 'invalid_origin' }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

---

## BLOQUE 4 — CRÍTICO: Headers de seguridad en Vercel

**Archivo:** `vercel.json`

**Problema:** Falta `Content-Security-Policy` (protección XSS), `Strict-Transport-Security` (fuerza HTTPS) y `Permissions-Policy`. Sin CSP, un XSS puede robar sesiones de Supabase del localStorage.

**Fix:** Reemplaza el array `headers` en `vercel.json` por:

```json
{
  "outputDirectory": "moneynest_premium",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), payment=(self)" },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://api.stripe.com; frame-src https://js.stripe.com; font-src 'self' data:;"
        }
      ]
    },
    {
      "source": "/service-worker.js",
      "headers": [{ "key": "Cache-Control", "value": "no-cache" }]
    },
    {
      "source": "/assets/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}
```

> **Nota:** `'unsafe-inline'` en scripts es necesario si tienes JS inline en el HTML. Si puedes evitarlo, elimínalo y añade hashes específicos para mayor seguridad.

---

## BLOQUE 5 — IMPORTANTE: metadata.priceId faltante en checkout

**Archivo:** `supabase/functions/create-checkout/index.ts`

**Problema:** El webhook lee `session.metadata?.priceId` para guardar el `stripe_price_id` en la tabla `purchases`, pero `create-checkout` no incluye `priceId` en la metadata. El campo queda vacío en base de datos.

**Fix:** En la llamada a `stripe.checkout.sessions.create`, añade `priceId` al objeto `metadata`:

```typescript
metadata: {
  plan: isSubscription ? 'pro_annual' : 'local_lifetime',
  priceId: priceId,   // ← añade esta línea
},
```

---

## BLOQUE 6 — IMPORTANTE: user_id no se resuelve en handleSubscriptionUpsert

**Archivo:** `supabase/functions/stripe-webhook/index.ts`

**Problema:** La función `handleSubscriptionUpsert` hace upsert en `subscriptions` sin el campo `user_id`. El JOIN con `profiles` queda roto para las suscripciones creadas por este path (renovaciones, actualizaciones).

**Fix:** Resuelve el `user_id` a partir del email del customer:

```typescript
async function handleSubscriptionUpsert(sub: Stripe.Subscription) {
  const email  = await resolveEmail(sub.customer);
  const custId = typeof sub.customer === 'string' ? sub.customer : '';

  // ── Resolver user_id desde profiles ──────────────────────────
  let userId: string | null = null;
  if (email) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    userId = profile?.id ?? null;
  }
  // ──────────────────────────────────────────────────────────────

  await supabase.from('subscriptions').upsert({
    user_id:                userId,          // ← añade este campo
    stripe_subscription_id: sub.id,
    stripe_customer_id:     custId,
    stripe_price_id:        sub.items.data[0]?.price.id ?? '',
    status:                 sub.status,
    current_period_start:   new Date(sub.current_period_start * 1000).toISOString(),
    current_period_end:     new Date(sub.current_period_end   * 1000).toISOString(),
    cancel_at_period_end:   sub.cancel_at_period_end,
    canceled_at:            sub.canceled_at
                              ? new Date(sub.canceled_at * 1000).toISOString()
                              : null,
  }, { onConflict: 'stripe_subscription_id' });

  // ... resto del handler sin cambios
}
```

---

## BLOQUE 7 — IMPORTANTE: Verificación JWT en Edge Functions

**Archivo:** `supabase/functions/create-payment-intent/index.ts`

**Problema:** Cualquiera puede llamar esta función con cualquier email sin estar autenticado. No hay verificación de que el usuario que paga es quien dice ser.

**Fix:** Añade verificación del JWT de Supabase al inicio del handler:

```typescript
// Añade al inicio de Deno.serve, antes de parsear el body:

const authHeader = req.headers.get('Authorization');
if (!authHeader?.startsWith('Bearer ')) {
  return json({ error: 'unauthorized' }, 401);
}

const token = authHeader.replace('Bearer ', '');
const { data: { user }, error: authError } = await supabase.auth.getUser(token);
if (authError || !user) {
  return json({ error: 'unauthorized' }, 401);
}

// Sobrescribe el email con el del token verificado (no del body)
// para que nadie pueda pagar por otro usuario:
const verifiedEmail = user.email ?? '';
```

En el frontend, cuando llames a esta función, incluye el token en la cabecera:

```javascript
const { data: { session } } = await supabase.auth.getSession();

const response = await fetch(endpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,  // ← añade esto
  },
  body: JSON.stringify({ priceId, email }),
});
```

---

## BLOQUE 8 — IMPORTANTE: Webhooks de Stripe faltantes

**Archivo:** `supabase/functions/stripe-webhook/index.ts`

**Problema:** Faltan eventos críticos del ciclo de vida. Sin `trial_will_end` no puedes avisar al usuario 3 días antes. Sin `charge.refunded` no haces downgrade al reembolsar.

**Fix:** Añade estos handlers y regístralos en el `switch`:

```typescript
// ── Handler: aviso fin de trial (3 días antes) ────────────────
async function handleTrialWillEnd(sub: Stripe.Subscription) {
  const email = await resolveEmail(sub.customer);
  if (!email) return;

  // Llama a tu función send-email con tipo 'trial_ending'
  await supabase.functions.invoke('send-email', {
    body: {
      to: email,
      type: 'trial_ending',
      trialEnd: new Date(sub.trial_end! * 1000).toISOString(),
    },
  });
}

// ── Handler: reembolso → downgrade ───────────────────────────
async function handleChargeRefunded(charge: Stripe.Charge) {
  if (!charge.payment_intent) return;

  // Buscar la compra en purchases y marcarla como refunded
  await supabase
    .from('purchases')
    .update({ status: 'refunded' })
    .eq('stripe_payment_intent_id', charge.payment_intent as string);

  // Si era un plan local, hacer downgrade a trial bloqueado
  const email = await resolveEmail(charge.customer);
  if (email) {
    await supabase
      .from('profiles')
      .update({ plan: 'locked_local', updated_at: new Date().toISOString() })
      .eq('email', email);
  }
}
```

En el `switch`:

```typescript
case 'customer.subscription.trial_will_end':
  await handleTrialWillEnd(event.data.object as Stripe.Subscription);
  break;
case 'charge.refunded':
  await handleChargeRefunded(event.data.object as Stripe.Charge);
  break;
```

**Importante:** Registra estos nuevos eventos en el dashboard de Stripe → Developers → Webhooks → tu endpoint → Add events.

---

## BLOQUE 9 — MEJORA: Stripe Customer Portal

**Archivo nuevo:** `supabase/functions/create-portal-session/index.ts`

Permite al usuario gestionar su suscripción (cambiar tarjeta, ver facturas, cancelar) desde la UI premium de Stripe. Mucho más seguro que implementarlo tú mismo.

```typescript
import Stripe from 'npm:stripe@14';
import { createClient } from 'npm:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-04-10',
});
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });

  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user?.email) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('email', user.email)
    .single();

  if (!profile?.stripe_customer_id) {
    return new Response(JSON.stringify({ error: 'no_customer' }), { status: 404 });
  }

  const origin = req.headers.get('origin') ?? '';
  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${origin}/settings/billing`,
  });

  return new Response(JSON.stringify({ url: session.url }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
```

En el frontend, el botón "Gestionar suscripción" llama a esta función y redirige a `session.url`.

> **Requisito:** Activa el Customer Portal en Stripe Dashboard → Settings → Billing → Customer portal.

---

## BLOQUE 10 — MEJORA: Email de confirmación en compras

**Archivo:** `supabase/functions/stripe-webhook/index.ts`

**Problema:** La función `send-email` existe pero no se llama desde el webhook al completar una compra. El usuario no recibe confirmación.

**Fix:** Al final de `handleCheckoutCompleted`, después de activar el plan:

```typescript
// Al final de handleCheckoutCompleted, después de los ifs de plan:

if (email) {
  await supabase.functions.invoke('send-email', {
    body: {
      to: email,
      type: plan === 'local_lifetime' ? 'purchase_local' : 'purchase_pro',
      plan: plan,
    },
  });
}
```

---

## BLOQUE 11 — MEJORA: RLS — política INSERT explícita en profiles

**Archivo:** `supabase/migrations/` (nueva migración)

**Problema:** No existe política `INSERT` en `profiles`. Los perfiles se crean via `get_or_create_profile` (SECURITY DEFINER), lo cual es correcto — pero sin una política `INSERT` que lo prohíba explícitamente desde el cliente, un usuario autenticado podría insertar directamente.

**Crea una nueva migración** `003_rls_hardening.sql`:

```sql
-- Bloquear INSERT directo en profiles desde el cliente
-- (los perfiles solo se crean via SECURITY DEFINER functions)
CREATE POLICY "No direct insert on profiles"
  ON profiles FOR INSERT
  WITH CHECK (false);

-- Bloquear DELETE directo en profiles desde el cliente
CREATE POLICY "No direct delete on profiles"
  ON profiles FOR DELETE
  USING (false);

-- Asegurar que billing_events solo es accesible por service_role
-- (ya no tiene policies, pero hacemos explícito el bloqueo)
CREATE POLICY "No client access to billing_events"
  ON billing_events FOR ALL
  USING (false);
```

---

## BLOQUE 12 — MEJORA: Service Worker con cache busting

**Archivo:** `moneynest_premium/service-worker.js`

**Problema:** Si el service worker cachea los assets JS/CSS, un deploy nuevo puede no llegar al usuario durante días.

**Fix:** Añade versionado al cache name y limpieza de caches antiguos:

```javascript
// Al inicio del service-worker.js
const CACHE_VERSION = 'v3'; // ← incrementa con cada deploy importante
const CACHE_NAME = `moneynest-${CACHE_VERSION}`;

// En el evento 'activate', limpia caches de versiones anteriores:
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name.startsWith('moneynest-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});
```

---

## BLOQUE 13 — MEJORA: Stripe API version

**Archivos:** todas las Edge Functions que instancian Stripe.

**Fix:** Actualiza la versión de la API de Stripe en todos los archivos que la usen:

```typescript
// Cambia en todos los archivos de Edge Functions:
// DE:
apiVersion: '2024-04-10',
// A:
apiVersion: '2025-04-30',  // ← versión estable actual a mayo 2026
```

Revisa los breaking changes en https://stripe.com/docs/upgrades antes de hacer deploy en producción. Los cambios que más te afectan son en los objetos `Invoice` y `Subscription` que usas intensamente en el webhook.

---

## BLOQUE 14 — MEJORA: Monitoring con Sentry

**Archivos:** frontend (`index.html`) y Edge Functions

Los errores del webhook ahora solo aparecen en `billing_events.error` — nadie te avisa cuando falla una activación de plan en producción.

**Frontend** — añade en `index.html` antes de tus scripts:

```html
<script
  src="https://js.sentry-cdn.com/TU_DSN_AQUI.min.js"
  crossorigin="anonymous"
></script>
<script>
  Sentry.init({
    dsn: 'https://TU_DSN@sentry.io/TU_PROJECT_ID',
    environment: 'production',
    tracesSampleRate: 0.1,
  });
</script>
```

**Edge Functions** — envuelve los handlers en try/catch con log estructurado:

```typescript
// Añade esta función de utilidad en stripe-webhook/index.ts:
async function reportError(context: string, error: unknown, metadata?: object) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({ context, error: message, ...metadata, ts: new Date().toISOString() }));
  // Los logs de Supabase Edge Functions van a tu dashboard en tiempo real
}
```

Registra tu cuenta gratuita en https://sentry.io (gratis hasta 5.000 errores/mes).

---

## Checklist de verificación post-implementación

```
STRIPE
□ Webhook endpoint registrado en Stripe Dashboard con los eventos correctos:
    checkout.session.completed
    customer.subscription.created / updated / deleted
    invoice.payment_succeeded / payment_failed
    payment_intent.succeeded
    customer.subscription.trial_will_end   ← nuevo
    charge.refunded                        ← nuevo
□ STRIPE_WEBHOOK_SECRET actualizado en Supabase secrets
□ Customer Portal activado en Stripe Dashboard → Settings → Billing
□ Stripe API version actualizada en todas las Edge Functions

SUPABASE
□ Migración 003_rls_hardening.sql ejecutada en producción
□ Secrets de Supabase actualizados (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET)
□ Edge Functions re-desplegadas: supabase functions deploy --all

VERCEL
□ vercel.json con los nuevos headers de seguridad
□ Dominio de producción añadido a ALLOWED_ORIGINS en Edge Functions
□ Re-deploy en Vercel para que apliquen los nuevos headers

FRONTEND
□ Llamadas a create-payment-intent incluyen Authorization header con JWT
□ Botón "Gestionar suscripción" conectado a create-portal-session
□ CACHE_VERSION incrementado en service-worker.js

TESTING
□ Simula un checkout completo en modo test de Stripe
□ Usa `stripe trigger checkout.session.completed` para testear el webhook
□ Verifica en billing_events que el evento queda marcado como processed=true
□ Simula reintento del webhook (Stripe Dashboard → webhook → resend) y verifica que NO se duplica el plan
□ Prueba cancelación de Pro → verifica que vuelve a Local sin perder datos
```

---

## Variables de entorno — referencia completa

```bash
# Supabase Edge Functions secrets (supabase secrets set)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://jwddciqqhmfkbqhdrfre.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Vercel environment variables (vercel env add)
# No se necesitan variables adicionales — el frontend usa keys públicas hardcodeadas
# Si quieres moverlas a env vars de Vercel, renombra stripe-config.js para leerlas
```

---

*Generado a partir de la auditoría del código real de MoneyNest · Mayo 2026*
