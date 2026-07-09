-- Calculator engagement events: scroll depth, page loads, custom interactions.
-- Run in Supabase SQL Editor (salesMastery project).
-- Writes go through track-calculator-event Edge Function (service role) or anon INSERT.

CREATE TABLE IF NOT EXISTS public.calculator_engagement_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  event_type text NOT NULL,
  scroll_depth integer,
  page text,
  referrer text,
  calculator_name text,
  name text,
  email text,
  phone text,
  venue_name text,
  ab_variant text,
  persona text,
  ordering_method text,
  lead_score integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calculator_engagement_events_session_id
  ON public.calculator_engagement_events (session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_calculator_engagement_events_calculator_name
  ON public.calculator_engagement_events (calculator_name, created_at DESC)
  WHERE calculator_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_calculator_engagement_events_event_type
  ON public.calculator_engagement_events (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_calculator_engagement_events_created_at
  ON public.calculator_engagement_events (created_at DESC);

COMMENT ON TABLE public.calculator_engagement_events IS
  'Universal calculator analytics: page_load, scroll_depth, calculator_started, etc.';

ALTER TABLE public.calculator_engagement_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_calculator_engagement_events"
  ON public.calculator_engagement_events;

CREATE POLICY "anon_insert_calculator_engagement_events"
  ON public.calculator_engagement_events
  FOR INSERT
  TO anon
  WITH CHECK (true);

GRANT INSERT ON TABLE public.calculator_engagement_events TO anon;
