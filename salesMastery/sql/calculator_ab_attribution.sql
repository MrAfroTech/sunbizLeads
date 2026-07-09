-- Calculator A/B copy test + lead scoring attribution columns and reporting views.

ALTER TABLE public.calculator_page_visits
  ADD COLUMN IF NOT EXISTS ab_variant text,
  ADD COLUMN IF NOT EXISTS persona text,
  ADD COLUMN IF NOT EXISTS ordering_method text,
  ADD COLUMN IF NOT EXISTS lead_score integer;

ALTER TABLE public.calculator_engagement_events
  ADD COLUMN IF NOT EXISTS ab_variant text,
  ADD COLUMN IF NOT EXISTS persona text,
  ADD COLUMN IF NOT EXISTS ordering_method text,
  ADD COLUMN IF NOT EXISTS lead_score integer;

ALTER TABLE public.sports_revenue_game_journeys
  ADD COLUMN IF NOT EXISTS ab_variant text,
  ADD COLUMN IF NOT EXISTS persona text,
  ADD COLUMN IF NOT EXISTS ordering_method text,
  ADD COLUMN IF NOT EXISTS lead_score integer;

CREATE INDEX IF NOT EXISTS idx_calculator_page_visits_ab_variant
  ON public.calculator_page_visits (ab_variant);

CREATE INDEX IF NOT EXISTS idx_calculator_page_visits_persona
  ON public.calculator_page_visits (persona);

CREATE INDEX IF NOT EXISTS idx_calculator_page_visits_ordering_method
  ON public.calculator_page_visits (ordering_method);

CREATE INDEX IF NOT EXISTS idx_calculator_page_visits_lead_score
  ON public.calculator_page_visits (lead_score);

CREATE INDEX IF NOT EXISTS idx_calculator_engagement_events_ab_variant
  ON public.calculator_engagement_events (ab_variant);

CREATE INDEX IF NOT EXISTS idx_calculator_engagement_events_event_type
  ON public.calculator_engagement_events (event_type);

COMMENT ON COLUMN public.calculator_page_visits.ab_variant IS
  'A/B copy test variant: a (control) or b.';

-- Variant-level funnel metrics (venue leak calculators).
CREATE OR REPLACE VIEW public.calculator_ab_variant_report AS
WITH venue_visits AS (
  SELECT *
  FROM public.calculator_page_visits
  WHERE page_key IN ('wait_calculator', 'restaurants_calculator', 'hotels_calculator')
),
venue_events AS (
  SELECT e.*
  FROM public.calculator_engagement_events e
  WHERE e.calculator_name IN ('calculator-wait', 'calculator-restaurants', 'calculator-hotels')
)
SELECT
  v.ab_variant,
  COUNT(DISTINCT v.id) AS page_visits,
  COUNT(DISTINCT CASE WHEN e.event_type = 'calculator_started' THEN e.session_id END) AS calculator_starts,
  COUNT(DISTINCT CASE WHEN e.event_type = 'calculator_completed' THEN e.session_id END) AS calculator_completions,
  COUNT(DISTINCT CASE WHEN e.event_type IN ('cta_clicked', 'lead_submitted') THEN e.session_id END) AS lead_submissions,
  COUNT(DISTINCT CASE WHEN e.event_type = 'consultation_cta_clicked' THEN e.session_id END) AS consultation_cta_clicks,
  COUNT(DISTINCT CASE WHEN e.event_type IN ('consultation_booked', 'phone_provided') THEN e.session_id END) AS consultation_bookings,
  ROUND(AVG(v.lead_score)::numeric, 1) AS avg_lead_score,
  MAX(v.lead_score) AS highest_lead_score,
  COUNT(DISTINCT CASE WHEN v.lead_score >= 80 THEN v.id END) AS leads_score_80_plus,
  COUNT(DISTINCT CASE WHEN v.lead_score >= 50 AND v.lead_score < 80 THEN v.id END) AS leads_score_50_79,
  COUNT(DISTINCT CASE WHEN v.lead_score >= 30 AND v.lead_score < 50 THEN v.id END) AS leads_score_30_49,
  COUNT(DISTINCT CASE WHEN v.lead_score < 30 THEN v.id END) AS leads_score_under_30
FROM venue_visits v
LEFT JOIN venue_events e
  ON e.ab_variant = v.ab_variant
  AND e.created_at >= v.created_at - interval '1 day'
  AND e.created_at <= v.created_at + interval '7 days'
WHERE v.ab_variant IN ('a', 'b')
GROUP BY v.ab_variant
ORDER BY v.ab_variant;

-- Persona breakdown.
CREATE OR REPLACE VIEW public.calculator_ab_persona_report AS
WITH venue_visits AS (
  SELECT *
  FROM public.calculator_page_visits
  WHERE page_key IN ('wait_calculator', 'restaurants_calculator', 'hotels_calculator')
    AND persona IS NOT NULL
),
venue_events AS (
  SELECT e.*
  FROM public.calculator_engagement_events e
  WHERE e.calculator_name IN ('calculator-wait', 'calculator-restaurants', 'calculator-hotels')
    AND e.persona IS NOT NULL
)
SELECT
  v.persona,
  COUNT(DISTINCT v.id) AS visitors,
  COUNT(DISTINCT CASE WHEN e.event_type IN ('cta_clicked', 'lead_submitted') THEN e.session_id END) AS lead_submissions,
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN e.event_type IN ('cta_clicked', 'lead_submitted') THEN e.session_id END)
    / NULLIF(COUNT(DISTINCT v.id), 0),
    1
  ) AS conversion_rate_pct,
  COUNT(DISTINCT CASE WHEN e.event_type IN ('consultation_booked', 'phone_provided') THEN e.session_id END) AS consultation_bookings,
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN e.event_type IN ('consultation_booked', 'phone_provided') THEN e.session_id END)
    / NULLIF(COUNT(DISTINCT v.id), 0),
    1
  ) AS consultation_booking_rate_pct,
  ROUND(AVG(v.lead_score)::numeric, 1) AS avg_lead_score
FROM venue_visits v
LEFT JOIN venue_events e
  ON e.persona = v.persona
  AND e.created_at >= v.created_at - interval '1 day'
  AND e.created_at <= v.created_at + interval '7 days'
GROUP BY v.persona
ORDER BY avg_lead_score DESC NULLS LAST;

-- Ordering method breakdown.
CREATE OR REPLACE VIEW public.calculator_ab_ordering_report AS
WITH venue_visits AS (
  SELECT *
  FROM public.calculator_page_visits
  WHERE page_key IN ('wait_calculator', 'restaurants_calculator', 'hotels_calculator')
    AND ordering_method IS NOT NULL
),
venue_events AS (
  SELECT e.*
  FROM public.calculator_engagement_events e
  WHERE e.calculator_name IN ('calculator-wait', 'calculator-restaurants', 'calculator-hotels')
    AND e.ordering_method IS NOT NULL
)
SELECT
  v.ordering_method,
  COUNT(DISTINCT v.id) AS visitors,
  COUNT(DISTINCT CASE WHEN e.event_type IN ('cta_clicked', 'lead_submitted') THEN e.session_id END) AS lead_submissions,
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN e.event_type IN ('cta_clicked', 'lead_submitted') THEN e.session_id END)
    / NULLIF(COUNT(DISTINCT v.id), 0),
    1
  ) AS conversion_rate_pct,
  COUNT(DISTINCT CASE WHEN e.event_type IN ('consultation_booked', 'phone_provided') THEN e.session_id END) AS consultation_bookings,
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN e.event_type IN ('consultation_booked', 'phone_provided') THEN e.session_id END)
    / NULLIF(COUNT(DISTINCT v.id), 0),
    1
  ) AS consultation_booking_rate_pct,
  ROUND(AVG(v.lead_score)::numeric, 1) AS avg_lead_score
FROM venue_visits v
LEFT JOIN venue_events e
  ON e.ordering_method = v.ordering_method
  AND e.created_at >= v.created_at - interval '1 day'
  AND e.created_at <= v.created_at + interval '7 days'
GROUP BY v.ordering_method
ORDER BY avg_lead_score DESC NULLS LAST;

-- Lead score distribution by variant.
CREATE OR REPLACE VIEW public.calculator_ab_lead_score_by_variant AS
SELECT
  ab_variant,
  lead_score,
  COUNT(*) AS visit_count
FROM public.calculator_page_visits
WHERE page_key IN ('wait_calculator', 'restaurants_calculator', 'hotels_calculator')
  AND ab_variant IN ('a', 'b')
  AND lead_score IS NOT NULL
GROUP BY ab_variant, lead_score
ORDER BY ab_variant, lead_score DESC;

GRANT SELECT ON public.calculator_ab_variant_report TO anon;
GRANT SELECT ON public.calculator_ab_persona_report TO anon;
GRANT SELECT ON public.calculator_ab_ordering_report TO anon;
GRANT SELECT ON public.calculator_ab_lead_score_by_variant TO anon;
