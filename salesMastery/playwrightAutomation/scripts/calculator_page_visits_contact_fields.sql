-- Run in Supabase SQL Editor for THIS project (paste in Dashboard → SQL):
--   https://supabase.com/dashboard/project/smqwemfobrqxnpcooigd
-- Target table: public.calculator_page_visits (created by seamlesslyUs/sql/calculator_page_visits.sql)
-- Aligns contact columns with brevo_contacts / scan_and_scale_click_events.

ALTER TABLE public.calculator_page_visits
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS contact_info text,
  ADD COLUMN IF NOT EXISTS company text;

CREATE INDEX IF NOT EXISTS idx_calculator_page_visits_email_lower
  ON public.calculator_page_visits ((lower(email)))
  WHERE email IS NOT NULL;

COMMENT ON COLUMN public.calculator_page_visits.email IS
  'Subscriber email from ?contact= (or equivalent) on calculator landing URLs.';
COMMENT ON COLUMN public.calculator_page_visits.name IS
  'Full name when captured on the calculator flow.';
COMMENT ON COLUMN public.calculator_page_visits.phone IS
  'Phone number (free-form).';
COMMENT ON COLUMN public.calculator_page_visits.contact_info IS
  'Freeform additional contact info.';
COMMENT ON COLUMN public.calculator_page_visits.company IS
  'Company / organization.';
