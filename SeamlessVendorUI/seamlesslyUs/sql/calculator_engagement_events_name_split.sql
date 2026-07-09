-- Split contact fields on calculator_engagement_events
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/smqwemfobrqxnpcooigd

ALTER TABLE public.calculator_engagement_events
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS phone_number text;

CREATE INDEX IF NOT EXISTS idx_calculator_engagement_events_email_lower
  ON public.calculator_engagement_events ((lower(email)))
  WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_calculator_engagement_events_phone_number
  ON public.calculator_engagement_events (phone_number)
  WHERE phone_number IS NOT NULL;

COMMENT ON COLUMN public.calculator_engagement_events.first_name IS
  'Contact first name from URL or form at event time.';
COMMENT ON COLUMN public.calculator_engagement_events.last_name IS
  'Contact last name from URL or form at event time.';
COMMENT ON COLUMN public.calculator_engagement_events.phone_number IS
  'Contact phone from URL or form at event time.';
