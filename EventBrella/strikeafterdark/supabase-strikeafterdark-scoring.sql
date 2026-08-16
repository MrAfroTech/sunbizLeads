-- ============================================
-- Strike After Dark — purchases + customer score
-- Run in Supabase SQL Editor
-- ============================================

-- Purchase / contact rows (one per checkout)
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

-- Lifetime customer profile (one row per email across events)
CREATE TABLE IF NOT EXISTS public.strikeafterdark_customers (
  id SERIAL PRIMARY KEY,
  customer_email VARCHAR(255) NOT NULL UNIQUE,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(50),
  total_purchases INTEGER NOT NULL DEFAULT 0,
  total_tickets INTEGER NOT NULL DEFAULT 0,
  lifetime_spend_cents INTEGER NOT NULL DEFAULT 0,
  unique_events INTEGER NOT NULL DEFAULT 0,
  customer_score INTEGER NOT NULL DEFAULT 0,
  last_tier VARCHAR(50),
  first_purchase_at TIMESTAMP WITH TIME ZONE,
  last_purchase_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safe column adds if strikeafterdark already exists
ALTER TABLE public.strikeafterdark
  ADD COLUMN IF NOT EXISTS event_slug VARCHAR(255),
  ADD COLUMN IF NOT EXISTS amount_cents INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS purchase_points INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS customer_score INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_strikeafterdark_customer_email
  ON public.strikeafterdark(customer_email);
CREATE INDEX IF NOT EXISTS idx_strikeafterdark_transaction_id
  ON public.strikeafterdark(transaction_id);
CREATE INDEX IF NOT EXISTS idx_strikeafterdark_event_date
  ON public.strikeafterdark(event_date);
CREATE INDEX IF NOT EXISTS idx_strikeafterdark_customers_score
  ON public.strikeafterdark_customers(customer_score DESC);
CREATE INDEX IF NOT EXISTS idx_strikeafterdark_customers_email
  ON public.strikeafterdark_customers(customer_email);

ALTER TABLE public.strikeafterdark ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strikeafterdark_customers ENABLE ROW LEVEL SECURITY;

-- Purchases: allow insert from checkout webhook (anon/authenticated)
DROP POLICY IF EXISTS "Allow insert strikeafterdark purchasers" ON public.strikeafterdark;
CREATE POLICY "Allow insert strikeafterdark purchasers"
  ON public.strikeafterdark
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service role all strikeafterdark" ON public.strikeafterdark;
CREATE POLICY "Allow service role all strikeafterdark"
  ON public.strikeafterdark
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated read strikeafterdark" ON public.strikeafterdark;
CREATE POLICY "Allow authenticated read strikeafterdark"
  ON public.strikeafterdark
  FOR SELECT
  TO authenticated
  USING (true);

-- Customers profile: service_role manages scoring upserts
DROP POLICY IF EXISTS "Allow service role all strikeafterdark_customers" ON public.strikeafterdark_customers;
CREATE POLICY "Allow service role all strikeafterdark_customers"
  ON public.strikeafterdark_customers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated read strikeafterdark_customers" ON public.strikeafterdark_customers;
CREATE POLICY "Allow authenticated read strikeafterdark_customers"
  ON public.strikeafterdark_customers
  FOR SELECT
  TO authenticated
  USING (true);

-- Optional: recompute helper view for leaderboards
CREATE OR REPLACE VIEW public.strikeafterdark_vip_board
WITH (security_invoker = true) AS
SELECT
  customer_email,
  customer_name,
  total_purchases,
  total_tickets,
  unique_events,
  lifetime_spend_cents,
  customer_score,
  last_tier,
  last_purchase_at
FROM public.strikeafterdark_customers
ORDER BY customer_score DESC, total_tickets DESC;
