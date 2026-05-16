import Stripe from 'npm:stripe@14';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-04-10',
});

const PRICE_LOCAL = 'price_1TTJCBFWll222Kpazyvo4A4W';
const PRICE_PRO   = 'price_1TTJD3FWll222KpaJ1T6OG6C';
const ALLOWED_PRICES = new Set([PRICE_LOCAL, PRICE_PRO]);

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  let priceId: string;
  let email: string;

  try {
    const body = await req.json();
    priceId = body.priceId ?? '';
    email   = body.email   ?? '';
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  if (!ALLOWED_PRICES.has(priceId)) {
    return new Response(JSON.stringify({ error: 'invalid_price' }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const origin = req.headers.get('origin') ?? 'https://agent-6a08ab04eaf8e721444cc273--moneynestv.netlify.app';
  const isSubscription = priceId === PRICE_PRO;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? 'subscription' : 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      ...(email ? { customer_email: email } : {}),
      success_url: `${origin}/?checkout=success&plan=${isSubscription ? 'pro' : 'local'}`,
      cancel_url:  `${origin}/?checkout=cancelled`,
      allow_promotion_codes: true,
      ...(isSubscription && {
        subscription_data: {
          trial_period_days: 7,
          metadata: { plan: 'pro_annual' },
        },
      }),
      metadata: { plan: isSubscription ? 'pro_annual' : 'local_lifetime' },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'stripe_error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
