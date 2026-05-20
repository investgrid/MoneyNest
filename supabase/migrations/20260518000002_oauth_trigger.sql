-- ════════════════════════════════════════════════════════════════
--  MoneyNest Migration 002
--  Ejecuta este SQL en Supabase → SQL Editor (todo de una vez)
-- ════════════════════════════════════════════════════════════════

-- ── 1. Añadir columnas nuevas a profiles ─────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS provider     TEXT DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url   TEXT;

-- ── 2. Función trigger — se ejecuta al crear usuario en auth ──────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
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
    COALESCE(NEW.email, ''),
    'trial',
    NOW() + INTERVAL '24 hours',
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- ── 3. Trigger sobre auth.users ───────────────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ── 4. RLS policies ───────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ── 5. RPC seguro para leer el plan del usuario actual ────────────
CREATE OR REPLACE FUNCTION public.get_my_plan()
RETURNS TABLE(plan TEXT, trial_ends_at TIMESTAMPTZ, pro_trial_ends_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    SELECT p.plan, p.trial_ends_at, p.pro_trial_ends_at
    FROM public.profiles p
    WHERE p.id = auth.uid();
END;
$$;

-- ── 6. Índice para búsquedas por provider ─────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_provider ON public.profiles(provider);
