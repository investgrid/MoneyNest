-- ════════════════════════════════════════════════════════════════
--  MoneyNest Migration 003
--  Cloud data access restricted to Pro users only (server-enforced)
--
--  HOW TO RUN:
--  Supabase Dashboard → SQL Editor → New query → paste → Run
-- ════════════════════════════════════════════════════════════════

-- ── 1. Fix the cloud_data column name consistency ─────────────────
-- The schema already uses "data" (JSONB). This confirms it exists.
-- Nothing to change here — sync.js has been updated to use "data".

-- ── 2. Drop old open RLS policies on cloud_data ───────────────────
DROP POLICY IF EXISTS "Users can view own cloud data"   ON public.cloud_data;
DROP POLICY IF EXISTS "Users can insert own cloud data" ON public.cloud_data;
DROP POLICY IF EXISTS "Users can update own cloud data" ON public.cloud_data;
DROP POLICY IF EXISTS "Users can delete own cloud data" ON public.cloud_data;

-- ── 3. Create Pro-gated RLS policies ─────────────────────────────
-- A user can only touch cloud_data if:
--   a) auth.uid() matches their row (own data)
--   b) their profile.plan = 'pro' (cloud feature)

CREATE POLICY "Pro users can select own cloud data"
  ON public.cloud_data FOR SELECT
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND plan = 'pro'
    )
  );

CREATE POLICY "Pro users can insert own cloud data"
  ON public.cloud_data FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND plan = 'pro'
    )
  );

CREATE POLICY "Pro users can update own cloud data"
  ON public.cloud_data FOR UPDATE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND plan = 'pro'
    )
  );

CREATE POLICY "Pro users can delete own cloud data"
  ON public.cloud_data FOR DELETE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND plan = 'pro'
    )
  );

-- ── 4. RPC para que el frontend verifique el plan sin exponer datos ─
-- Devuelve el plan actual del usuario autenticado.
-- Uso: await supabase.rpc('get_my_plan')
-- DROP primero porque añadimos cloud_enabled al RETURNS TABLE
-- y Postgres no permite cambiar tipos de retorno con CREATE OR REPLACE.
DROP FUNCTION IF EXISTS public.get_my_plan();
CREATE FUNCTION public.get_my_plan()
RETURNS TABLE(
  plan             TEXT,
  trial_ends_at    TIMESTAMPTZ,
  pro_trial_ends_at TIMESTAMPTZ,
  cloud_enabled    BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    SELECT
      p.plan,
      p.trial_ends_at,
      p.pro_trial_ends_at,
      p.cloud_enabled
    FROM public.profiles p
    WHERE p.id = auth.uid();
END;
$$;

-- ── 5. Trigger: al activar Pro, marcar cloud_enabled = TRUE ──────
-- Esto ya lo hace activate_pro_plan(), pero reforzamos con trigger
-- por si el webhook actualiza plan directamente via service_role.
CREATE OR REPLACE FUNCTION public.sync_cloud_enabled_on_plan_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.plan = 'pro' THEN
    NEW.cloud_enabled := TRUE;
  ELSIF NEW.plan IN ('trial', 'locked_local', 'local') THEN
    NEW.cloud_enabled := FALSE;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_cloud_enabled ON public.profiles;

CREATE TRIGGER trg_sync_cloud_enabled
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.plan IS DISTINCT FROM NEW.plan)
  EXECUTE FUNCTION public.sync_cloud_enabled_on_plan_change();
