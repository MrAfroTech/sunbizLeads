-- Seamlessly US: three separate journey tables for Supabase (Postgres)
-- Run in Supabase SQL Editor or via migration.
--
-- Wire-up: insert/update rows from your app (Edge Function with service role,
-- or client with RLS policies you trust). Do not expose service role in the browser.

-- ---------------------------------------------------------------------------
-- 1) Staff turnover calculator (StaffTurnoverCalculator.js)
--     Buttons: primary "Calculate", secondary "Calculate" (after first results)
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

  -- Optional: last inputs for analytics (mirror component state)
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
-- 2) Staff burnout calculator results page (StaffBurnoutCalculatorResults.js)
--     Interactive control: "Back to calculator" link
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

  -- Optional: snapshot of URL/query params when useful
  query_params jsonb
);

CREATE INDEX IF NOT EXISTS idx_staff_burnout_results_journeys_email
  ON public.staff_burnout_results_journeys (lower(email));
CREATE INDEX IF NOT EXISTS idx_staff_burnout_results_journeys_created_at
  ON public.staff_burnout_results_journeys (created_at DESC);

COMMENT ON TABLE public.staff_burnout_results_journeys IS
  'Staff turnover results page: contact + Back to calculator click.';

-- ---------------------------------------------------------------------------
-- 3) Sports revenue / watch vs order (MakingPurchaseVsWatchingGame.js)
--     Buttons: "Calculate", "Schedule a Demo" (BookingModal: name, email, phone, date, time)
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

  -- Mirror BookingModal when captured
  preferred_demo_date date,
  preferred_demo_time text,
  demo_time_zone text,

  -- Optional: last calculator inputs
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
-- updated_at maintenance (single trigger function)
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
-- Row Level Security (tighten as needed; service role bypasses RLS)
-- ---------------------------------------------------------------------------
ALTER TABLE public.staff_turnover_calculator_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_burnout_results_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sports_revenue_game_journeys ENABLE ROW LEVEL SECURITY;

-- Example: no client access until you add policies. Uncomment one pattern:

-- Direct anon insert only (spam risk — prefer Edge Function + service role):
-- CREATE POLICY "anon_insert_staff_turnover"
--   ON public.staff_turnover_calculator_journeys FOR INSERT TO anon WITH CHECK (true);
-- CREATE POLICY "anon_insert_staff_burnout_results"
--   ON public.staff_burnout_results_journeys FOR INSERT TO anon WITH CHECK (true);
-- CREATE POLICY "anon_insert_sports_revenue"
--   ON public.sports_revenue_game_journeys FOR INSERT TO anon WITH CHECK (true);
