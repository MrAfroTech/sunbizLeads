-- Run in Supabase SQL Editor (project smqwemfobrqxnpcooigd):
-- Allows browser anon key to UPDATE visit rows (contact fields, reached_checkout).
-- Required for calculatorPageVisits.js update + markCalculatorVisitReachedCheckout.

DROP POLICY IF EXISTS "anon_update_calculator_page_visits" ON public.calculator_page_visits;

CREATE POLICY "anon_update_calculator_page_visits"
  ON public.calculator_page_visits
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
