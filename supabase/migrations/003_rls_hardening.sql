-- Bloque 11: RLS Hardening
-- Evita operaciones directas no autorizadas desde el cliente

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
