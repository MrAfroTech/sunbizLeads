-- Lead system standing rule: every table that stores ab_variant / lead_score / funnel
-- attribution must also store identity (email, name, phone) when known.
-- Apply to current tables; new lead-system tables must follow the same pattern.

ALTER TABLE public.scan_and_scale_click_events
  ADD COLUMN IF NOT EXISTS ab_variant text,
  ADD COLUMN IF NOT EXISTS persona text,
  ADD COLUMN IF NOT EXISTS ordering_method text,
  ADD COLUMN IF NOT EXISTS lead_score integer;

ALTER TABLE public.lead_events
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS ab_variant text,
  ADD COLUMN IF NOT EXISTS persona text,
  ADD COLUMN IF NOT EXISTS ordering_method text,
  ADD COLUMN IF NOT EXISTS lead_score integer;

ALTER TABLE public.abandoned_calc_leads
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS phone text;

ALTER TABLE public.finished_calc_leads
  ADD COLUMN IF NOT EXISTS ab_variant text,
  ADD COLUMN IF NOT EXISTS persona text,
  ADD COLUMN IF NOT EXISTS ordering_method text,
  ADD COLUMN IF NOT EXISTS lead_score integer;

CREATE INDEX IF NOT EXISTS idx_scan_and_scale_click_events_ab_variant
  ON public.scan_and_scale_click_events (ab_variant)
  WHERE ab_variant IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lead_events_session_id
  ON public.lead_events (session_id)
  WHERE session_id IS NOT NULL;

COMMENT ON COLUMN public.scan_and_scale_click_events.ab_variant IS
  'A/B copy test variant (a|b) captured with the lead.';
COMMENT ON COLUMN public.lead_events.name IS
  'Visitor name when known at event time.';
COMMENT ON COLUMN public.lead_events.phone IS
  'Visitor phone when known at event time.';

-- Backfill identity from URL query_params on rows that already have A/B attribution.
UPDATE public.calculator_page_visits v
SET
  email = COALESCE(
    NULLIF(trim(lower(v.email)), ''),
    NULLIF(trim(lower(v.query_params->>'email')), ''),
    NULLIF(trim(lower(v.query_params->>'contact')), '')
  ),
  name = COALESCE(
    NULLIF(trim(v.name), ''),
    NULLIF(trim(v.query_params->>'name'), ''),
    NULLIF(trim(concat_ws(' ', v.query_params->>'firstName', v.query_params->>'lastName')), '')
  ),
  phone = COALESCE(
    NULLIF(trim(v.phone), ''),
    NULLIF(trim(v.query_params->>'phone'), '')
  )
WHERE v.ab_variant IS NOT NULL
  AND (
    v.email IS NULL
    OR v.name IS NULL
    OR v.phone IS NULL
  )
  AND v.query_params IS NOT NULL;

-- Backfill visit rows from lead_events that recorded visit_id in meta
UPDATE public.calculator_page_visits v
SET
  email = COALESCE(NULLIF(trim(lower(v.email)), ''), NULLIF(trim(lower(le.email)), '')),
  name = COALESCE(NULLIF(trim(v.name), ''), NULLIF(trim(le.name), '')),
  phone = COALESCE(NULLIF(trim(v.phone), ''), NULLIF(trim(le.phone), '')),
  ab_variant = COALESCE(v.ab_variant, le.ab_variant),
  persona = COALESCE(v.persona, le.persona),
  ordering_method = COALESCE(v.ordering_method, le.ordering_method),
  lead_score = COALESCE(v.lead_score, le.lead_score)
FROM public.lead_events le
WHERE le.meta->>'visit_id' = v.id::text
  AND v.ab_variant IS NOT NULL
  AND (
    v.email IS NULL
    OR v.name IS NULL
    OR v.phone IS NULL
    OR v.lead_score IS NULL
  );

-- Mirror attribution from visits onto canonical lead rows when email matches
UPDATE public.scan_and_scale_click_events s
SET
  ab_variant = COALESCE(s.ab_variant, v.ab_variant),
  persona = COALESCE(s.persona, v.persona),
  ordering_method = COALESCE(s.ordering_method, v.ordering_method),
  lead_score = COALESCE(s.lead_score, v.lead_score),
  updated_at = now()
FROM public.calculator_page_visits v
WHERE lower(s.email) = lower(v.email)
  AND v.ab_variant IS NOT NULL
  AND (
    s.ab_variant IS NULL
    OR s.lead_score IS NULL
  );
