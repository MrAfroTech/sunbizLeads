-- Run in Supabase SQL Editor for THIS project (paste in Dashboard → SQL):
--   https://supabase.com/dashboard/project/smqwemfobrqxnpcooigd
-- Project ref: smqwemfobrqxnpcooigd  →  URL: https://smqwemfobrqxnpcooigd.supabase.co
-- Target table: public.scan_and_scale_site_events
-- Written by eCommerceSite/scan-and-scale POST /api/log-site-event (site-analytics.js).
-- Re-runnable: IF NOT EXISTS / DROP-then-CREATE policies.

CREATE TABLE IF NOT EXISTS public.scan_and_scale_site_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  session_id text NOT NULL,
  event_type text NOT NULL,
  page_path text NOT NULL,
  campaign text,
  contact text,
  contact_id text,
  email text,
  first_name text,
  last_name text,
  element_label text,
  target_href text,
  link_text text,
  referrer text,
  user_agent text
);

ALTER TABLE public.scan_and_scale_site_events
  ADD COLUMN IF NOT EXISTS session_id text,
  ADD COLUMN IF NOT EXISTS event_type text,
  ADD COLUMN IF NOT EXISTS page_path text,
  ADD COLUMN IF NOT EXISTS campaign text,
  ADD COLUMN IF NOT EXISTS contact text,
  ADD COLUMN IF NOT EXISTS contact_id text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS element_label text,
  ADD COLUMN IF NOT EXISTS target_href text,
  ADD COLUMN IF NOT EXISTS link_text text,
  ADD COLUMN IF NOT EXISTS referrer text,
  ADD COLUMN IF NOT EXISTS user_agent text;

CREATE INDEX IF NOT EXISTS idx_scan_and_scale_site_events_created_at
  ON public.scan_and_scale_site_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_scan_and_scale_site_events_session
  ON public.scan_and_scale_site_events (session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_scan_and_scale_site_events_page_path
  ON public.scan_and_scale_site_events (page_path);

CREATE INDEX IF NOT EXISTS idx_scan_and_scale_site_events_contact_id
  ON public.scan_and_scale_site_events (contact_id)
  WHERE contact_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_scan_and_scale_site_events_email
  ON public.scan_and_scale_site_events (email)
  WHERE email IS NOT NULL;

ALTER TABLE public.scan_and_scale_site_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_scan_and_scale_site_events" ON public.scan_and_scale_site_events;
CREATE POLICY "anon_insert_scan_and_scale_site_events"
  ON public.scan_and_scale_site_events FOR INSERT TO anon WITH CHECK (true);

GRANT INSERT ON TABLE public.scan_and_scale_site_events TO anon;

COMMENT ON TABLE public.scan_and_scale_site_events IS
  'Scan & Scale storefront analytics: session_id, contact_id, email, names, campaign (?contactId= / ?email= / legacy ?contact=).';
