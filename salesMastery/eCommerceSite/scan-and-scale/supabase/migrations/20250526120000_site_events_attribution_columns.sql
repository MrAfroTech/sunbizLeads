-- Extended attribution on scan_and_scale_site_events (contact_id, email, names).
-- Re-runnable via IF NOT EXISTS.

ALTER TABLE public.scan_and_scale_site_events
  ADD COLUMN IF NOT EXISTS contact_id text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text;

CREATE INDEX IF NOT EXISTS idx_scan_and_scale_site_events_contact_id
  ON public.scan_and_scale_site_events (contact_id)
  WHERE contact_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_scan_and_scale_site_events_email
  ON public.scan_and_scale_site_events (email)
  WHERE email IS NOT NULL;

COMMENT ON COLUMN public.scan_and_scale_site_events.contact_id IS
  'Brevo contact.ID from ?contactId= (preferred subscriber key).';
COMMENT ON COLUMN public.scan_and_scale_site_events.email IS
  'Subscriber email from ?email= or legacy ?contact=.';
COMMENT ON COLUMN public.scan_and_scale_site_events.contact IS
  'Legacy email mirror; kept for backward-compatible queries and lead upsert.';
