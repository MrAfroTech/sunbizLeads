-- Run in Supabase SQL Editor:
--   https://supabase.com/dashboard/project/smqwemfobrqxnpcooigd
-- Adds contact fields to engagement events (aligned with calculator_page_visits).

ALTER TABLE public.calculator_engagement_events
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS venue_name text;

CREATE INDEX IF NOT EXISTS idx_calculator_engagement_events_email_lower
  ON public.calculator_engagement_events ((lower(email)))
  WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_calculator_engagement_events_phone
  ON public.calculator_engagement_events (phone)
  WHERE phone IS NOT NULL;

COMMENT ON COLUMN public.calculator_engagement_events.name IS
  'Contact first name (or display name) when known at event time.';
COMMENT ON COLUMN public.calculator_engagement_events.email IS
  'Contact email when known at event time.';
COMMENT ON COLUMN public.calculator_engagement_events.phone IS
  'Contact phone when known at event time.';
COMMENT ON COLUMN public.calculator_engagement_events.venue_name IS
  'Venue / organization from the leak-report gate.';
