-- Bloque 11: RLS Hardening
-- Evita operaciones directas no autorizadas desde el cliente

-- Bloquear INSERT directo en profiles desde el cliente
-- (los perfiles solo se crean via SECURITY DEFINER functions)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'No direct insert on profiles'
  ) THEN
    CREATE POLICY "No direct insert on profiles"
      ON profiles FOR INSERT
      WITH CHECK (false);
  END IF;
END $$;

-- Bloquear DELETE directo en profiles desde el cliente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'No direct delete on profiles'
  ) THEN
    CREATE POLICY "No direct delete on profiles"
      ON profiles FOR DELETE
      USING (false);
  END IF;
END $$;

-- Asegurar que billing_events solo es accesible por service_role
-- (ya no tiene policies, pero hacemos explícito el bloqueo)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'billing_events' AND policyname = 'No client access to billing_events'
  ) THEN
    CREATE POLICY "No client access to billing_events"
      ON billing_events FOR ALL
      USING (false);
  END IF;
END $$;
