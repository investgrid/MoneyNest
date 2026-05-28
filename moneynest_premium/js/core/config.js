// ═══════════════════════════════════════════════════════════════
// MONEYNEST — CONFIG CENTRALIZADA
// ═══════════════════════════════════════════════════════════════

/**
 * SECURITY: Keys públicas de solo lectura (ANON)
 * Las SECRET keys van SOLO en Supabase Edge Functions (env vars)
 */

export const CONFIG = {
  VERSION: '2.0.0',

  // Supabase (public anon key - read only)
  SUPABASE: {
    URL: 'https://jwddciqqhmfkbqhdrfre.supabase.co',
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3ZGRjaXFxaG1ma2JxaGRyZnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NjkyMjcsImV4cCI6MjA5NDM0NTIyN30.Gqz39AWpW1BkWXhfhnR_vOUYUy93bgdSNvBfXYQ3VGk'
  },

  // Stripe (public publishable key)
  STRIPE: {
    PUBLISHABLE_KEY: 'pk_live_51T57NbFWll222Kpac9uR0087YoUUATVJCxRg3TzYSC7y0EacJnpooDne5ty7vZOEGrkqA35mj6Rf5unOsDiMzBlp00h0Q8bEJt',
    PRICES: {
      LOCAL_LIFETIME: 'price_1TTJCBFWll222Kpazyvo4A4W',  // 5€ único
      PRO_ANNUAL: 'price_1TTJD3FWll222KpaJ1T6OG6C'      // 5€/año
    },
    PRODUCTS: {
      LOCAL: 'prod_USDdaHgyW9lPe6',
      PRO: 'prod_USDeOkWj3MryiO'
    }
  },

  // Edge Functions (server-side endpoints)
  ENDPOINTS: {
    CREATE_CHECKOUT: 'https://jwddciqqhmfkbqhdrfre.supabase.co/functions/v1/create-checkout',
    STRIPE_WEBHOOK: 'https://jwddciqqhmfkbqhdrfre.supabase.co/functions/v1/stripe-webhook'
  },

  // Storage keys
  STORAGE_KEYS: {
    DATA: 'mn7_data',
    USER: 'mn_user',
    BILLING: 'mn_billing_sub',
    LANG: 'mn7_lang',
    THEME: 'mn_theme',
    ONBOARDING_SEEN: 'mn7_ob_seen_v2',
    TUTORIAL_DONE: 'mn7_tut_done',
    DEMO_MODE: 'mn_demo_mode'
  },

  // Plans
  PLANS: {
    TRIAL: { id: 'trial', name: 'Trial', duration: 24 * 60 * 60 * 1000 }, // 24h
    LOCAL: { id: 'local', name: 'Local Lifetime', price: 5 },
    PRO: { id: 'pro', name: 'Pro Annual', price: 5, trialDays: 7 }
  }
}

// Read-only freeze
Object.freeze(CONFIG)
Object.freeze(CONFIG.SUPABASE)
Object.freeze(CONFIG.STRIPE)
Object.freeze(CONFIG.STRIPE.PRICES)
Object.freeze(CONFIG.STRIPE.PRODUCTS)
Object.freeze(CONFIG.ENDPOINTS)
Object.freeze(CONFIG.STORAGE_KEYS)
Object.freeze(CONFIG.PLANS)
