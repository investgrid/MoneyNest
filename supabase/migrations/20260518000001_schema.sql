-- ════════════════════════════════════════════════════════════════
--  MoneyNest Database Schema
--  Supabase PostgreSQL
-- ════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ────────────────────────────────────────────────────────────────
--  PROFILES
-- ────────────────────────────────────────────────────────────────
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,

  plan TEXT NOT NULL DEFAULT 'trial',  -- 'trial' | 'locked_local' | 'local' | 'pro'
  trial_ends_at TIMESTAMPTZ,
  pro_trial_ends_at TIMESTAMPTZ,
  pro_trial_used BOOLEAN DEFAULT FALSE,

  stripe_customer_id TEXT UNIQUE,

  cloud_enabled BOOLEAN DEFAULT FALSE,
  last_sync_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_email           ON profiles(email);
CREATE INDEX idx_profiles_stripe_customer ON profiles(stripe_customer_id);

-- ────────────────────────────────────────────────────────────────
--  SUBSCRIPTIONS  (Pro Annual)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,

  status TEXT NOT NULL,  -- 'active' | 'trialing' | 'canceled' | 'past_due' | 'unpaid'

  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user           ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_sub     ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);

-- ────────────────────────────────────────────────────────────────
--  PURCHASES  (Local Lifetime — one-time payment)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  stripe_checkout_session_id TEXT UNIQUE NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_customer_id TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,

  amount INTEGER NOT NULL,   -- cents
  currency TEXT NOT NULL DEFAULT 'eur',
  status TEXT NOT NULL,      -- 'pending' | 'completed' | 'failed' | 'refunded'

  product_type TEXT NOT NULL,  -- 'local_lifetime'

  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_purchases_user           ON purchases(user_id);
CREATE INDEX idx_purchases_stripe_session ON purchases(stripe_checkout_session_id);
CREATE INDEX idx_purchases_stripe_customer ON purchases(stripe_customer_id);

-- ────────────────────────────────────────────────────────────────
--  CLOUD_DATA  (Pro sync)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE cloud_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  data JSONB NOT NULL,

  device_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX        idx_cloud_data_user      ON cloud_data(user_id);
CREATE INDEX        idx_cloud_data_synced_at ON cloud_data(synced_at DESC);
CREATE UNIQUE INDEX idx_cloud_data_user_latest ON cloud_data(user_id);

-- ────────────────────────────────────────────────────────────────
--  BILLING_EVENTS  (audit log)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE billing_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  event_type TEXT NOT NULL,
  stripe_event_id TEXT UNIQUE NOT NULL,

  payload JSONB,

  processed BOOLEAN DEFAULT FALSE,
  error TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_billing_events_user      ON billing_events(user_id);
CREATE INDEX idx_billing_events_type      ON billing_events(event_type);
CREATE INDEX idx_billing_events_processed ON billing_events(processed);
CREATE INDEX idx_billing_events_created   ON billing_events(created_at DESC);

-- ────────────────────────────────────────────────────────────────
--  TRIGGERS — auto updated_at
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cloud_data_updated_at
  BEFORE UPDATE ON cloud_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ────────────────────────────────────────────────────────────────
--  ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────────
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases      ENABLE ROW LEVEL SECURITY;
ALTER TABLE cloud_data     ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own purchases"
  ON purchases FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own cloud data"
  ON cloud_data FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cloud data"
  ON cloud_data FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cloud data"
  ON cloud_data FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cloud data"
  ON cloud_data FOR DELETE USING (auth.uid() = user_id);

-- billing_events: sin policies públicas — solo service_role

-- ────────────────────────────────────────────────────────────────
--  HELPER FUNCTIONS  (SECURITY DEFINER = service_role privileges)
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_or_create_profile(user_email TEXT)
RETURNS UUID AS $$
DECLARE
  profile_id UUID;
BEGIN
  SELECT id INTO profile_id FROM profiles WHERE email = user_email;
  IF profile_id IS NULL THEN
    INSERT INTO profiles (email, plan, trial_ends_at)
    VALUES (user_email, 'trial', NOW() + INTERVAL '24 hours')
    RETURNING id INTO profile_id;
  END IF;
  RETURN profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION activate_local_plan(user_email TEXT, customer_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles
  SET plan = 'local', stripe_customer_id = customer_id, updated_at = NOW()
  WHERE email = user_email;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION activate_pro_plan(user_email TEXT, subscription_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles
  SET plan = 'pro', cloud_enabled = TRUE, pro_trial_used = TRUE, updated_at = NOW()
  WHERE email = user_email;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cancel_pro_plan(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles
  SET plan = 'local', cloud_enabled = FALSE, updated_at = NOW()
  WHERE email = user_email;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
