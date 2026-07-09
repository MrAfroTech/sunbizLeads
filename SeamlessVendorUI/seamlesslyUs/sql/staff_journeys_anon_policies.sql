-- Staff turnover + burnout results tables: anon policies for browser inserts/updates.
-- Run after seamlessly_us_journey_tables.sql. Adjust or remove if you use Edge Functions only.

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
