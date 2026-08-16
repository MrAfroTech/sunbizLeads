-- ============================================
-- Strike After Dark — Lounge + Pool Reservations
-- Tables: "strike-after-dark", "strike-after-dark-pool"
-- Lounge: full event window 9PM–Midnight · Free · No time slots
-- Pool: 1-hour blocks 9PM–Midnight · Free
-- ============================================

CREATE TABLE IF NOT EXISTS "strike-after-dark" (
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

CREATE UNIQUE INDEX IF NOT EXISTS strike_after_dark_unique_active_table
  ON "strike-after-dark" (event_date, table_number)
  WHERE status = 'reserved';

CREATE INDEX IF NOT EXISTS strike_after_dark_event_date_idx
  ON "strike-after-dark" (event_date);

CREATE INDEX IF NOT EXISTS strike_after_dark_guest_email_idx
  ON "strike-after-dark" (guest_email);

CREATE TABLE IF NOT EXISTS "strike-after-dark-pool" (
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

CREATE UNIQUE INDEX IF NOT EXISTS strike_after_dark_pool_unique_active_slot
  ON "strike-after-dark-pool" (event_date, table_number, time_slot)
  WHERE status = 'reserved';

CREATE INDEX IF NOT EXISTS strike_after_dark_pool_event_date_idx
  ON "strike-after-dark-pool" (event_date);

ALTER TABLE "strike-after-dark" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "strike-after-dark-pool" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow service role all lounge" ON "strike-after-dark";
CREATE POLICY "Allow service role all lounge"
  ON "strike-after-dark"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon read lounge reserved" ON "strike-after-dark";
CREATE POLICY "Allow anon read lounge reserved"
  ON "strike-after-dark"
  FOR SELECT
  TO anon, authenticated
  USING (status = 'reserved');

DROP POLICY IF EXISTS "Allow anon insert lounge" ON "strike-after-dark";
CREATE POLICY "Allow anon insert lounge"
  ON "strike-after-dark"
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service role all pool" ON "strike-after-dark-pool";
CREATE POLICY "Allow service role all pool"
  ON "strike-after-dark-pool"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon read pool reserved" ON "strike-after-dark-pool";
CREATE POLICY "Allow anon read pool reserved"
  ON "strike-after-dark-pool"
  FOR SELECT
  TO anon, authenticated
  USING (status = 'reserved');

DROP POLICY IF EXISTS "Allow anon insert pool" ON "strike-after-dark-pool";
CREATE POLICY "Allow anon insert pool"
  ON "strike-after-dark-pool"
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
