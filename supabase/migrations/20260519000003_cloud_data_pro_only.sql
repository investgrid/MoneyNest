-- ════════════════════════════════════════════════════════════════
--  MoneyNest Migration 003  (idempotente — se puede ejecutar N veces)
--  Cloud data access restricted to Pro users only (server-enforced)
--
--  HOW TO RUN:
--  Supabase Dashboard → SQL Editor → New query → paste → Run
-- ════════════════════════════════════════════════════════════════

-- ── 1. Drop ALL policies on cloud_data (old + new, por si acaso) ──
DROP POLICY IF EXISTS "Users can view own cloud data"         ON public.cloud_data;
DROP POLICY IF EXISTS "Users can insert own cloud data"       ON public.cloud_data;
DROP POLICY IF EXISTS "Users can update own cloud data"       ON public.cloud_data;
DROP POLICY IF EXISTS "Users can delete own cloud data"       ON public.cloud_data;
DROP POLICY IF EXISTS "Pro users can select own cloud data"   ON public.cloud_data;
DROP POLICY IF EXISTS "Pro users can insert own cloud data"   ON public.cloud_data;
DROP POLICY IF EXISTS "Pro users can update own cloud data"   ON public.cloud_data;
DROP POLICY IF EXISTS "Pro users can delete own cloud data"   ON public.cloud_data;

-- ── 2. Recrear policies Pro-only ─────────────────────────────────
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

-- ── 3. get_my_plan() — DROP siempre antes de recrear ─────────────
DROP FUNCTION IF EXISTS public.get_my_plan();

CREATE FUNCTION public.get_my_plan()
RETURNS TABLE(
  plan              TEXT,
  trial_ends_at     TIMESTAMPTZ,
  pro_trial_ends_at TIMESTAMPTZ,
  cloud_enabled     BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    SELECT p.plan, p.trial_ends_at, p.pro_trial_ends_at, p.cloud_enabled
    FROM public.profiles p
    WHERE p.id = auth.uid();
END;
$$;

-- ── 4. Trigger: cloud_enabled se sincroniza al cambiar plan ───────
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
