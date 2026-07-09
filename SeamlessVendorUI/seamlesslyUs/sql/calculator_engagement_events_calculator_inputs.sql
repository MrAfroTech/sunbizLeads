-- Venue-leak calculator inputs on engagement events
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/smqwemfobrqxnpcooigd

ALTER TABLE public.calculator_engagement_events
  ADD COLUMN IF NOT EXISTS peak_night_customers numeric,
  ADD COLUMN IF NOT EXISTS average_spend_per_customer numeric;

COMMENT ON COLUMN public.calculator_engagement_events.peak_night_customers IS
  'Peak-night customer count from URL or calculator form at event time.';
COMMENT ON COLUMN public.calculator_engagement_events.average_spend_per_customer IS
  'Average spend per customer from URL or calculator form at event time.';
