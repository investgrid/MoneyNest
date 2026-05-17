-- ════════════════════════════════════════════════════════════════
--  MoneyNest Migration 002 — OAuth support + auto-profile trigger
-- ════════════════════════════════════════════════════════════════

-- ── Add OAuth/display columns to profiles ──────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS provider     TEXT    DEFAULT 'email';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url   TEXT;

-- ── Relax email unique to allow NULL for edge cases ────────────
-- (email is still present for email/password users; OAuth users
--  always have email in Supabase auth.users anyway)

-- ── Auto-create profile on new Supabase auth user ──────────────
-- This handles BOTH email/password AND OAuth signups.
-- ON CONFLICT (id) DO NOTHING prevents trial reset for returning users.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (
    id,
    email,
    plan,
    trial_ends_at,
    provider,
    display_name,
    avatar_url
  )
  VALUES (
    NEW.id,
    NEW.email,
    'trial',
    NOW() + INTERVAL '24 hours',
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NULL
    ),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── RLS: allow profile insert from trigger (service role) ──────
-- Service role bypasses RLS, so the trigger always works.
-- These policies cover the anon/authenticated client:

-- Drop existing policies to recreate cleanly
DROP POLICY IF EXISTS "Users can view own profile"   ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Authenticated users can insert their own profile as fallback
-- (trigger should handle it, but this covers edge cases)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ── Function: get_my_plan — safe RPC for frontend ──────────────
-- Returns the current plan for the authenticated user.
-- Used as fallback when profile read is needed without knowing id.
CREATE OR REPLACE FUNCTION get_my_plan()
RETURNS TABLE(plan TEXT, trial_ends_at TIMESTAMPTZ, pro_trial_ends_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
    SELECT p.plan, p.trial_ends_at, p.pro_trial_ends_at
    FROM profiles p
    WHERE p.id = auth.uid();
END;
$$;

-- ── Index for provider lookups ────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_provider ON profiles(provider);
