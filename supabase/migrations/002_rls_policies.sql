-- ═══════════════════════════════════════════════════════════════
-- MONEYNEST — RLS POLICIES (Row Level Security)
-- ═══════════════════════════════════════════════════════════════
-- Deploy: supabase db push

-- Enable RLS on all tables
ALTER TABLE IF EXISTS ingresos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inversiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS deudas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS objetivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cuentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS billing_subscriptions ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════
-- INGRESOS
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "Users can view own ingresos"
ON ingresos FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ingresos"
ON ingresos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ingresos"
ON ingresos FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ingresos"
ON ingresos FOR DELETE
USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- GASTOS
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "Users can view own gastos"
ON gastos FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gastos"
ON gastos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gastos"
ON gastos FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own gastos"
ON gastos FOR DELETE
USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- INVERSIONES
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "Users can view own inversiones"
ON inversiones FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inversiones"
ON inversiones FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inversiones"
ON inversiones FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own inversiones"
ON inversiones FOR DELETE
USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- DEUDAS
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "Users can view own deudas"
ON deudas FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deudas"
ON deudas FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deudas"
ON deudas FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own deudas"
ON deudas FOR DELETE
USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- OBJETIVOS
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "Users can view own objetivos"
ON objetivos FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own objetivos"
ON objetivos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own objetivos"
ON objetivos FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own objetivos"
ON objetivos FOR DELETE
USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- CUENTAS
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "Users can view own cuentas"
ON cuentas FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cuentas"
ON cuentas FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cuentas"
ON cuentas FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cuentas"
ON cuentas FOR DELETE
USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- BILLING (special: read-only for users, write only from webhook)
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "Users can view own billing"
ON billing_subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- Only service_role (webhooks) can insert/update billing
CREATE POLICY "Service role can write billing"
ON billing_subscriptions FOR ALL
USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════
-- INDEXES for performance
-- ═══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_ingresos_user_id ON ingresos(user_id);
CREATE INDEX IF NOT EXISTS idx_ingresos_fecha ON ingresos(fecha);
CREATE INDEX IF NOT EXISTS idx_gastos_user_id ON gastos(user_id);
CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON gastos(fecha);
CREATE INDEX IF NOT EXISTS idx_inversiones_user_id ON inversiones(user_id);
CREATE INDEX IF NOT EXISTS idx_deudas_user_id ON deudas(user_id);
CREATE INDEX IF NOT EXISTS idx_objetivos_user_id ON objetivos(user_id);
CREATE INDEX IF NOT EXISTS idx_cuentas_user_id ON cuentas(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_user_id ON billing_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_status ON billing_subscriptions(status);
