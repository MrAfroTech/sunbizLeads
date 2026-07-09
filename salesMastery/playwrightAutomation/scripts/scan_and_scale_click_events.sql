-- Run in Supabase SQL Editor for THIS project (paste in Dashboard → SQL):
--   https://supabase.com/dashboard/project/smqwemfobrqxnpcooigd
-- Project ref: smqwemfobrqxnpcooigd  →  URL: https://smqwemfobrqxnpcooigd.supabase.co
-- Target table: public.scan_and_scale_click_events
-- Env (same as playwrightAutomation/scripts/.env): VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
--
-- Mirrors playwrightAutomation/scripts/brevo_contacts_click_tracking.sql:
--   • one row per contact, keyed by email
--   • last_click_path / last_click_campaign / last_click_at written by
--     chaosMastery/chaos-mastery-web/backend/api/logEmailClick.js
--   • anon SELECT / INSERT / UPDATE so the public site can upsert without a service role
-- Re-runnable: every CREATE/ALTER/POLICY uses IF [NOT] EXISTS or DROP-then-CREATE.

CREATE TABLE IF NOT EXISTS public.scan_and_scale_click_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text,
  phone text,
  contact_info text,
  company text,
  last_click_path text,
  last_click_campaign text,
  last_click_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Defensive ADDs in case the table already exists from an earlier draft.
ALTER TABLE public.scan_and_scale_click_events
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS contact_info text,
  ADD COLUMN IF NOT EXISTS company text,
  ADD COLUMN IF NOT EXISTS last_click_path text,
  ADD COLUMN IF NOT EXISTS last_click_campaign text,
  ADD COLUMN IF NOT EXISTS last_click_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Email is the natural key the logEmailClick.js upsert relies on (`.eq('email', email)`).
-- Stored lower-cased on write; enforce uniqueness case-insensitively.
CREATE UNIQUE INDEX IF NOT EXISTS idx_scan_and_scale_click_events_email_lower
  ON public.scan_and_scale_click_events ((lower(email)));

CREATE INDEX IF NOT EXISTS idx_scan_and_scale_click_events_last_click_at
  ON public.scan_and_scale_click_events (last_click_at DESC);

CREATE INDEX IF NOT EXISTS idx_scan_and_scale_click_events_campaign
  ON public.scan_and_scale_click_events (last_click_campaign);

ALTER TABLE public.scan_and_scale_click_events ENABLE ROW LEVEL SECURITY;

-- PostgREST update().select() needs SELECT on returned rows
DROP POLICY IF EXISTS "anon_select_scan_and_scale_click_events" ON public.scan_and_scale_click_events;
CREATE POLICY "anon_select_scan_and_scale_click_events"
  ON public.scan_and_scale_click_events FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon_update_scan_and_scale_click_events" ON public.scan_and_scale_click_events;
CREATE POLICY "anon_update_scan_and_scale_click_events"
  ON public.scan_and_scale_click_events FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_insert_scan_and_scale_click_events" ON public.scan_and_scale_click_events;
CREATE POLICY "anon_insert_scan_and_scale_click_events"
  ON public.scan_and_scale_click_events FOR INSERT TO anon WITH CHECK (true);

COMMENT ON TABLE  public.scan_and_scale_click_events IS
  'Scan & Scale lead-capture + email-click tracking. One row per contact (keyed by lower(email)).';
COMMENT ON COLUMN public.scan_and_scale_click_events.email IS
  'Contact email (stored lower-cased; unique via idx_scan_and_scale_click_events_email_lower).';
COMMENT ON COLUMN public.scan_and_scale_click_events.name IS
  'Full name captured from the Scan & Scale form / QR landing.';
COMMENT ON COLUMN public.scan_and_scale_click_events.phone IS
  'Phone number (free-form; normalize client-side if needed).';
COMMENT ON COLUMN public.scan_and_scale_click_events.contact_info IS
  'Freeform additional contact info (LinkedIn, address, preferred channel, notes).';
COMMENT ON COLUMN public.scan_and_scale_click_events.company IS
  'Company / organization the contact represents.';
COMMENT ON COLUMN public.scan_and_scale_click_events.last_click_path IS
  'Latest marketing landing path (pathname + query) from ?contact=&campaign= links.';
COMMENT ON COLUMN public.scan_and_scale_click_events.last_click_campaign IS
  'Campaign query param from email links.';
COMMENT ON COLUMN public.scan_and_scale_click_events.last_click_at IS
  'When last_click_path was recorded.';
COMMENT ON COLUMN public.scan_and_scale_click_events.created_at IS
  'Row creation timestamp (first time this email was seen).';
COMMENT ON COLUMN public.scan_and_scale_click_events.updated_at IS
  'Last write timestamp; set by API on every insert/update.';
