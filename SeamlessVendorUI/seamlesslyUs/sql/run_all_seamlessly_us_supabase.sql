-- =============================================================================
-- Seamlessly US — run this entire file in Supabase SQL Editor (one paste).
-- Creates journey tables, visit log, triggers, RLS, and anon policies for the SPA.
-- Safe to re-run: IF NOT EXISTS / DROP POLICY IF EXISTS / OR REPLACE where applicable.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) staff_turnover_calculator_journeys
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.staff_turnover_calculator_journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  email text,
  full_name text,
  phone text,
  company text,
  job_title text,
  notes text,
  clicked_primary_calculate boolean NOT NULL DEFAULT false,
  clicked_secondary_calculate boolean NOT NULL DEFAULT false,
  last_turnover_per_month numeric,
  last_tenure_days numeric
);

CREATE INDEX IF NOT EXISTS idx_staff_turnover_calc_journeys_email
  ON public.staff_turnover_calculator_journeys (lower(email));
CREATE INDEX IF NOT EXISTS idx_staff_turnover_calc_journeys_created_at
  ON public.staff_turnover_calculator_journeys (created_at DESC);

COMMENT ON TABLE public.staff_turnover_calculator_journeys IS
  'Staff turnover calculator: contact + click flags for primary/secondary Calculate.';

-- ---------------------------------------------------------------------------
-- 2) staff_burnout_results_journeys
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.staff_burnout_results_journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  email text,
  full_name text,
  phone text,
  company text,
  job_title text,
  notes text,
  clicked_back_to_calculator boolean NOT NULL DEFAULT false,
  query_params jsonb
);

CREATE INDEX IF NOT EXISTS idx_staff_burnout_results_journeys_email
  ON public.staff_burnout_results_journeys (lower(email));
CREATE INDEX IF NOT EXISTS idx_staff_burnout_results_journeys_created_at
  ON public.staff_burnout_results_journeys (created_at DESC);

COMMENT ON TABLE public.staff_burnout_results_journeys IS
  'Staff turnover results page: contact + Back to calculator click.';

-- ---------------------------------------------------------------------------
-- 3) sports_revenue_game_journeys
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sports_revenue_game_journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  email text,
  full_name text,
  phone text,
  company text,
  job_title text,
  notes text,
  clicked_calculate boolean NOT NULL DEFAULT false,
  clicked_schedule_demo boolean NOT NULL DEFAULT false,
  clicked_booking_confirm boolean NOT NULL DEFAULT false,
  preferred_demo_date date,
  preferred_demo_time text,
  demo_time_zone text,
  last_total_fans numeric,
  last_average_order_value numeric,
  last_percent_never_ordered numeric
);

CREATE INDEX IF NOT EXISTS idx_sports_revenue_game_journeys_email
  ON public.sports_revenue_game_journeys (lower(email));
CREATE INDEX IF NOT EXISTS idx_sports_revenue_game_journeys_created_at
  ON public.sports_revenue_game_journeys (created_at DESC);

COMMENT ON TABLE public.sports_revenue_game_journeys IS
  'Watch vs order calculator: contact + Calculate / Schedule demo / booking confirm.';

-- ---------------------------------------------------------------------------
-- 4) calculator_page_visits (page views only)
-- ---------------------------------------------------------------------------
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
  'One row per calculator page view (sports + staff flows).';

-- Post-click email landing attribution: update public.brevo_contacts (last_click_* columns).
-- See salesMastery/playwrightAutomation/scripts/brevo_contacts_click_tracking.sql

-- ---------------------------------------------------------------------------
-- updated_at triggers (journey tables only)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_staff_turnover_calculator_journeys_updated_at
  ON public.staff_turnover_calculator_journeys;
CREATE TRIGGER tr_staff_turnover_calculator_journeys_updated_at
  BEFORE UPDATE ON public.staff_turnover_calculator_journeys
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS tr_staff_burnout_results_journeys_updated_at
  ON public.staff_burnout_results_journeys;
CREATE TRIGGER tr_staff_burnout_results_journeys_updated_at
  BEFORE UPDATE ON public.staff_burnout_results_journeys
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS tr_sports_revenue_game_journeys_updated_at
  ON public.sports_revenue_game_journeys;
CREATE TRIGGER tr_sports_revenue_game_journeys_updated_at
  BEFORE UPDATE ON public.sports_revenue_game_journeys
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.staff_turnover_calculator_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_burnout_results_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sports_revenue_game_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculator_page_visits ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Anon policies (browser + public anon key)
-- ---------------------------------------------------------------------------

-- sports_revenue_game_journeys
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

-- calculator_page_visits
DROP POLICY IF EXISTS "anon_insert_calculator_page_visits" ON public.calculator_page_visits;
DROP POLICY IF EXISTS "anon_update_calculator_page_visits" ON public.calculator_page_visits;

CREATE POLICY "anon_insert_calculator_page_visits"
  ON public.calculator_page_visits FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_update_calculator_page_visits"
  ON public.calculator_page_visits
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);
