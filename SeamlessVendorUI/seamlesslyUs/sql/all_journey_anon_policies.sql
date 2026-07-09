-- Journey tables + calculator page visits: create visits table (if needed) and anon RLS policies.
-- Run in Supabase SQL Editor as one script.

-- Page views only (not funnel rows)
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

ALTER TABLE public.calculator_page_visits ENABLE ROW LEVEL SECURITY;

-- sports_revenue_game_journeys (INSERT + SELECT for returning id + UPDATE for schedule demo)
DROP POLICY IF EXISTS "anon_insert_sports_revenue" ON public.sports_revenue_game_journeys;
DROP POLICY IF EXISTS "anon_select_sports_revenue" ON public.sports_revenue_game_journeys;
DROP POLICY IF EXISTS "anon_update_sports_revenue" ON public.sports_revenue_game_journeys;

CREATE POLICY "anon_insert_sports_revenue"
  ON public.sports_revenue_game_journeys FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_select_sports_revenue"
  ON public.sports_revenue_game_journeys FOR SELECT TO anon USING (true);
CREATE POLICY "anon_update_sports_revenue"
  ON public.sports_revenue_game_journeys FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- staff_turnover_calculator_journeys
DROP POLICY IF EXISTS "anon_insert_staff_turnover" ON public.staff_turnover_calculator_journeys;
DROP POLICY IF EXISTS "anon_select_staff_turnover" ON public.staff_turnover_calculator_journeys;
DROP POLICY IF EXISTS "anon_update_staff_turnover" ON public.staff_turnover_calculator_journeys;

CREATE POLICY "anon_insert_staff_turnover"
  ON public.staff_turnover_calculator_journeys FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_select_staff_turnover"
  ON public.staff_turnover_calculator_journeys FOR SELECT TO anon USING (true);
CREATE POLICY "anon_update_staff_turnover"
  ON public.staff_turnover_calculator_journeys FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- staff_burnout_results_journeys
DROP POLICY IF EXISTS "anon_insert_staff_burnout_results" ON public.staff_burnout_results_journeys;
DROP POLICY IF EXISTS "anon_select_staff_burnout_results" ON public.staff_burnout_results_journeys;

CREATE POLICY "anon_insert_staff_burnout_results"
  ON public.staff_burnout_results_journeys FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_select_staff_burnout_results"
  ON public.staff_burnout_results_journeys FOR SELECT TO anon USING (true);

-- calculator_page_visits (anon insert + update for contact / reached_checkout)
DROP POLICY IF EXISTS "anon_insert_calculator_page_visits" ON public.calculator_page_visits;
DROP POLICY IF EXISTS "anon_update_calculator_page_visits" ON public.calculator_page_visits;

CREATE POLICY "anon_insert_calculator_page_visits"
  ON public.calculator_page_visits FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_update_calculator_page_visits"
  ON public.calculator_page_visits
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

-- brevo_contacts click updates: see salesMastery/playwrightAutomation/scripts/brevo_contacts_click_tracking.sql

