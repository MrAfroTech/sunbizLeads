-- Run in Supabase SQL Editor (project smqwemfobrqxnpcooigd)
ALTER TABLE public.calculator_page_visits
  ADD COLUMN IF NOT EXISTS reached_checkout boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.calculator_page_visits.reached_checkout IS
  'True after the user was redirected to Stripe checkout for this visit.';
