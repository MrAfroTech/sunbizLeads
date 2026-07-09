-- Page-visit tracking only (separate from journey / funnel tables).
-- Run in Supabase SQL Editor, then add anon INSERT policy (see all_journey_anon_policies.sql).

CREATE TABLE IF NOT EXISTS public.calculator_page_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),

  page_key text NOT NULL,
  path text,
  query_params jsonb,
  referrer text
);

CREATE INDEX IF NOT EXISTS idx_calculator_page_visits_page_key
  ON public.calculator_page_visits (page_key);
CREATE INDEX IF NOT EXISTS idx_calculator_page_visits_created_at
  ON public.calculator_page_visits (created_at DESC);

COMMENT ON TABLE public.calculator_page_visits IS
  'One row per calculator page view: sports + staff flows (landing and results pages).';

ALTER TABLE public.calculator_page_visits ENABLE ROW LEVEL SECURITY;
