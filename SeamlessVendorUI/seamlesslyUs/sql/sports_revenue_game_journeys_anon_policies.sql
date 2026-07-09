-- Run in Supabase SQL Editor if the app uses the anon key from the browser.
-- INSERT alone is not enough: PostgREST needs SELECT on the row to return `id` after insert.
-- UPDATE is needed for "Schedule a Demo" flag on the same row.

-- If policies already exist, drop them first (names must match).
DROP POLICY IF EXISTS "anon_insert_sports_revenue" ON public.sports_revenue_game_journeys;
DROP POLICY IF EXISTS "anon_select_sports_revenue" ON public.sports_revenue_game_journeys;
DROP POLICY IF EXISTS "anon_update_sports_revenue" ON public.sports_revenue_game_journeys;

CREATE POLICY "anon_insert_sports_revenue"
  ON public.sports_revenue_game_journeys
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "anon_select_sports_revenue"
  ON public.sports_revenue_game_journeys
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "anon_update_sports_revenue"
  ON public.sports_revenue_game_journeys
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);
