-- ============================================
-- Strike After Dark purchaser contact table
-- ============================================
-- Prefer supabase-strikeafterdark-scoring.sql for full
-- purchase + cross-event customer score setup.
-- ============================================

CREATE TABLE IF NOT EXISTS public.strikeafterdark (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  transaction_id VARCHAR(255),
  event_name VARCHAR(255),
  event_date DATE,
  event_slug VARCHAR(255),
  tier VARCHAR(50),
  ticket_count INTEGER DEFAULT 1,
  amount_cents INTEGER DEFAULT 0,
  purchase_points INTEGER DEFAULT 0,
  customer_score INTEGER DEFAULT 0,
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_strikeafterdark_customer_email ON public.strikeafterdark(customer_email);
CREATE INDEX IF NOT EXISTS idx_strikeafterdark_transaction_id ON public.strikeafterdark(transaction_id);

ALTER TABLE public.strikeafterdark ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow insert strikeafterdark purchasers" ON public.strikeafterdark;
CREATE POLICY "Allow insert strikeafterdark purchasers"
  ON public.strikeafterdark
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service role read strikeafterdark" ON public.strikeafterdark;
CREATE POLICY "Allow service role read strikeafterdark"
  ON public.strikeafterdark
  FOR SELECT
  TO authenticated
  USING (true);
