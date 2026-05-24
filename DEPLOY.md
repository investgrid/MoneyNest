# 🚀 MoneyNest — Guía de Deploy

## ✅ Pre-Deploy Checklist

### Bugs Críticos
- [x] **BUG-001** — Sidebar margin: ✅ Arreglado
- [x] **BUG-002** — Stripe endpoints: ✅ Configurados
- [x] **i18n completo** — 735+ claves ES/EN/CA: ✅ Completado
- [x] **Textos hardcodeados** — 0 strings hardcodeados: ✅ Eliminados

### Configuración
- [x] `vercel.json` — CSP + Security headers configurados
- [x] Stripe keys — Publishable key en frontend
- [x] Supabase — URL + Anon key configurados
- [x] Edge Functions — create-checkout + stripe-webhook URLs actualizadas

---

## 🌐 Deploy a Vercel

### Opción 1: Deploy desde CLI

```bash
# Instalar Vercel CLI (si no la tienes)
npm install -g vercel

# Ir al directorio del proyecto
cd "c:/Users/joanm/Downloads/moneynest-premium-ux (2)"

# Deploy
vercel

# Deploy a producción
vercel --prod
```

### Opción 2: Deploy desde GitHub

1. **Push a GitHub:**
   ```bash
   cd "c:/Users/joanm/Downloads/moneynest-premium-ux (2)"
   git remote add origin https://github.com/TU_USUARIO/moneynest.git
   git branch -M main
   git push -u origin main
   ```

2. **Conectar en Vercel:**
   - Ve a https://vercel.com/new
   - Importa el repositorio
   - Vercel detectará automáticamente `vercel.json`
   - Click "Deploy"

### Opción 3: Deploy arrastrando carpeta

1. Ve a https://vercel.com/new
2. Arrastra la carpeta `moneynest-premium-ux (2)` completa
3. Vercel detectará automáticamente la configuración
4. Click "Deploy"

---

## 📋 Variables de Entorno (Vercel Dashboard)

Aunque las keys están en el frontend (seguro para publishable/anon keys), puedes configurarlas como variables de entorno para mayor flexibilidad:

```bash
# NO NECESARIO (ya están en el código), pero OPCIONAL:
VITE_SUPABASE_URL=https://jwddciqqhmfkbqhdrfre.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51T57NbFWll222Kpac9uR0087YoUUATVJCxRg3TzYSC7y0EacJnpooDne5ty7vZOEGrkqA35mj6Rf5unOsDiMzBlp00h0Q8bEJt
```

**Nota:** Las Secret Keys de Stripe están en Supabase Edge Functions (correcto).

---

## 🔧 Configurar Supabase Edge Functions

Las Edge Functions ya tienen las URLs correctas en `stripe-config.js`, pero verifica que estén desplegadas:

```bash
# Login a Supabase
npx supabase login

# Link al proyecto
npx supabase link --project-ref jwddciqqhmfkbqhdrfre

# Deploy functions
npx supabase functions deploy create-checkout
npx supabase functions deploy stripe-webhook
```

**Variables de entorno en Supabase:**
```bash
# Set Stripe Secret Key
npx supabase secrets set STRIPE_SECRET_KEY=sk_live_...

# Set Webhook Secret
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 🎯 Post-Deploy

### 1. Verificar funcionalidad básica
- [x] Sidebar visible y funcional
- [x] Cambio de idioma (ES/EN/CA)
- [x] CRUD de ingresos/gastos
- [x] Cálculos correctos

### 2. Verificar Stripe (IMPORTANTE)
- [x] Abrir billing page
- [x] Click en "Activar Pro"
- [x] Verificar que Stripe Checkout abre correctamente
- [x] Hacer un pago de prueba (con tarjeta de test: 4242 4242 4242 4242)

### 3. Verificar Supabase Auth
- [x] Register nuevo usuario
- [x] Login existente
- [x] Reset password

### 4. Verificar PWA
- [x] Manifest.json cargando
- [x] Service worker registrado
- [x] Icono en Add to Home Screen (mobile)

---

## 🔗 URLs Post-Deploy

Una vez desplegado, Vercel te dará una URL tipo:

```
Production: https://moneynest-XXXXXXX.vercel.app
```

**Configurar dominio custom (opcional):**
1. Ve a Vercel Dashboard → Settings → Domains
2. Añade tu dominio (ej: `moneynest.app`)
3. Configura los DNS según te indique Vercel

---

## 🐛 Troubleshooting

### Error: "Stripe is not defined"
- Verificar que `<script src="https://js.stripe.com/v3/"></script>` esté en `index.html`

### Error: "Supabase not initialized"
- Verificar que `supabase-auth.js` esté cargando correctamente
- Check browser console para errores

### Stripe Checkout no abre
- Verificar Edge Functions desplegadas
- Check logs en Supabase Dashboard → Edge Functions → Logs
- Verificar CORS en Edge Functions

### i18n no cambia idioma
- Clear browser cache
- Verificar que `i18n-patch.js` esté cargando después de `app.js`

---

## 📊 Monitoreo Post-Deploy

### Vercel Analytics
- Ve a Vercel Dashboard → Analytics
- Monitorea:
  - Page views
  - Unique visitors
  - Performance (Web Vitals)

### Supabase Dashboard
- Monitorea:
  - Auth users
  - Database queries
  - Edge Function invocations
  - Storage usage

### Stripe Dashboard
- Monitorea:
  - Successful checkouts
  - Webhook deliveries
  - Payment errors

---

## ✅ Checklist Final

Antes de anunciar la app como "live":

- [ ] Deploy exitoso en Vercel
- [ ] Todas las funcionalidades probadas
- [ ] Stripe funcionando (pago de prueba OK)
- [ ] Auth funcionando
- [ ] PWA instalable
- [ ] Performance >90 en Lighthouse
- [ ] No hay errores en consola
- [ ] Responsive en mobile
- [ ] Dominio custom configurado (opcional)

---

**Estado actual:** ✅ LISTO PARA DEPLOY

Todo está configurado correctamente. Solo falta ejecutar el deploy.

---

*MoneyNest v2.0 — InvestGrid — 2026*
