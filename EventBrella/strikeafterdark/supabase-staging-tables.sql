-- ============================================
-- Strike After Dark — Staging table duplicates
-- Prefix: stage_
-- Schemas match production setup SQL in this repo
-- (tickets, strikeafterdark, strikeafterdark_customers,
--  "strike-after-dark", "strike-after-dark-pool")
-- Prefer LIKE copies when production tables exist.
-- ============================================

-- Prefer exact clones from live production tables
DO $$
BEGIN
  IF to_regclass('public.tickets') IS NOT NULL AND to_regclass('public.stage_tickets') IS NULL THEN
    EXECUTE 'CREATE TABLE public.stage_tickets (LIKE public.tickets INCLUDING ALL)';
  END IF;

  IF to_regclass('public.strikeafterdark') IS NOT NULL AND to_regclass('public.stage_strikeafterdark') IS NULL THEN
    EXECUTE 'CREATE TABLE public.stage_strikeafterdark (LIKE public.strikeafterdark INCLUDING ALL)';
  END IF;

  IF to_regclass('public.strikeafterdark_customers') IS NOT NULL AND to_regclass('public.stage_strikeafterdark_customers') IS NULL THEN
    EXECUTE 'CREATE TABLE public.stage_strikeafterdark_customers (LIKE public.strikeafterdark_customers INCLUDING ALL)';
  END IF;

  IF to_regclass('public."strike-after-dark"') IS NOT NULL AND to_regclass('public."stage_strike-after-dark"') IS NULL THEN
    EXECUTE 'CREATE TABLE public."stage_strike-after-dark" (LIKE public."strike-after-dark" INCLUDING ALL)';
  END IF;

  IF to_regclass('public."strike-after-dark-pool"') IS NOT NULL AND to_regclass('public."stage_strike-after-dark-pool"') IS NULL THEN
    EXECUTE 'CREATE TABLE public."stage_strike-after-dark-pool" (LIKE public."strike-after-dark-pool" INCLUDING ALL)';
  END IF;
END $$;

-- Fallback DDL if production tables were missing at clone time
CREATE TABLE IF NOT EXISTS public.stage_tickets (
  id SERIAL PRIMARY KEY,
  ticket_id VARCHAR(255) UNIQUE NOT NULL,
  transaction_id VARCHAR(255) NOT NULL,
  event_name VARCHAR(255),
  event_date DATE,
  event_time VARCHAR(100),
  event_venue VARCHAR(255),
  vendor_name VARCHAR(255),
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  ticket_count INTEGER DEFAULT 1,
  ticket_number INTEGER DEFAULT 1,
  tier VARCHAR(50),
  purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  qr_code_url TEXT,
  checksum VARCHAR(100),
  redeemed BOOLEAN DEFAULT FALSE,
  redeemed_at TIMESTAMP,
  redeemed_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.stage_strikeafterdark (
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

CREATE TABLE IF NOT EXISTS public.stage_strikeafterdark_customers (
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

CREATE TABLE IF NOT EXISTS public."stage_strike-after-dark" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number SMALLINT NOT NULL CHECK (table_number BETWEEN 1 AND 5),
  guest_name TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  event_date DATE NOT NULL DEFAULT DATE '2026-08-06',
  event_window TEXT NOT NULL DEFAULT '9PM – Midnight',
  status TEXT NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'cancelled')),
  reservation_fee_cents INTEGER NOT NULL DEFAULT 0,
  food_tier TEXT NULL,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."stage_strike-after-dark-pool" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number SMALLINT NOT NULL CHECK (table_number BETWEEN 1 AND 8),
  time_slot TEXT NOT NULL CHECK (time_slot IN ('9pm-10pm', '10pm-11pm', '11pm-midnight')),
  guest_name TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  event_date DATE NOT NULL DEFAULT DATE '2026-08-06',
  status TEXT NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'cancelled')),
  reservation_fee_cents INTEGER NOT NULL DEFAULT 0,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stage_tickets_ticket_id ON public.stage_tickets(ticket_id);
CREATE INDEX IF NOT EXISTS idx_stage_tickets_transaction_id ON public.stage_tickets(transaction_id);
CREATE INDEX IF NOT EXISTS idx_stage_tickets_customer_email ON public.stage_tickets(customer_email);
CREATE INDEX IF NOT EXISTS idx_stage_tickets_event_date ON public.stage_tickets(event_date);
CREATE INDEX IF NOT EXISTS idx_stage_strikeafterdark_customer_email ON public.stage_strikeafterdark(customer_email);
CREATE INDEX IF NOT EXISTS idx_stage_strikeafterdark_transaction_id ON public.stage_strikeafterdark(transaction_id);
CREATE INDEX IF NOT EXISTS idx_stage_strikeafterdark_customers_email ON public.stage_strikeafterdark_customers(customer_email);

CREATE UNIQUE INDEX IF NOT EXISTS stage_strike_after_dark_unique_active_table
  ON public."stage_strike-after-dark" (event_date, table_number)
  WHERE status = 'reserved';

CREATE UNIQUE INDEX IF NOT EXISTS stage_strike_after_dark_pool_unique_active_slot
  ON public."stage_strike-after-dark-pool" (event_date, table_number, time_slot)
  WHERE status = 'reserved';

ALTER TABLE public.stage_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_strikeafterdark ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_strikeafterdark_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."stage_strike-after-dark" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."stage_strike-after-dark-pool" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stage_tickets_service_all" ON public.stage_tickets;
CREATE POLICY "stage_tickets_service_all"
  ON public.stage_tickets FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "stage_tickets_anon_all" ON public.stage_tickets;
CREATE POLICY "stage_tickets_anon_all"
  ON public.stage_tickets FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "stage_strikeafterdark_service_all" ON public.stage_strikeafterdark;
CREATE POLICY "stage_strikeafterdark_service_all"
  ON public.stage_strikeafterdark FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "stage_strikeafterdark_insert" ON public.stage_strikeafterdark;
CREATE POLICY "stage_strikeafterdark_insert"
  ON public.stage_strikeafterdark FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "stage_strikeafterdark_customers_service_all" ON public.stage_strikeafterdark_customers;
CREATE POLICY "stage_strikeafterdark_customers_service_all"
  ON public.stage_strikeafterdark_customers FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "stage_lounge_service_all" ON public."stage_strike-after-dark";
CREATE POLICY "stage_lounge_service_all"
  ON public."stage_strike-after-dark" FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "stage_lounge_anon_read" ON public."stage_strike-after-dark";
CREATE POLICY "stage_lounge_anon_read"
  ON public."stage_strike-after-dark" FOR SELECT TO anon, authenticated
  USING (status = 'reserved');

DROP POLICY IF EXISTS "stage_lounge_anon_insert" ON public."stage_strike-after-dark";
CREATE POLICY "stage_lounge_anon_insert"
  ON public."stage_strike-after-dark" FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "stage_pool_service_all" ON public."stage_strike-after-dark-pool";
CREATE POLICY "stage_pool_service_all"
  ON public."stage_strike-after-dark-pool" FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "stage_pool_anon_read" ON public."stage_strike-after-dark-pool";
CREATE POLICY "stage_pool_anon_read"
  ON public."stage_strike-after-dark-pool" FOR SELECT TO anon, authenticated
  USING (status = 'reserved');

DROP POLICY IF EXISTS "stage_pool_anon_insert" ON public."stage_strike-after-dark-pool";
CREATE POLICY "stage_pool_anon_insert"
  ON public."stage_strike-after-dark-pool" FOR INSERT TO anon, authenticated
  WITH CHECK (true);
