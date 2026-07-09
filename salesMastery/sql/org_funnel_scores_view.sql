-- =============================================================================
-- Org funnel scoring views — salesMastery Supabase (smqwemfobrqxnpcooigd)
-- Internal reporting only. No RLS on views; no changes to base tables.
-- =============================================================================

CREATE OR REPLACE VIEW public.org_funnel_contacts AS
WITH personal_domains AS (
  SELECT unnest(ARRAY[
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'
  ]) AS domain
),
internal_domains AS (
  SELECT unnest(ARRAY[
    'seamlessly.us', 'ezdrink.us', 'mauricethefirst.com'
  ]) AS domain
),
visit_resolved AS (
  SELECT
    v.id,
    v.created_at,
    v.updated_at,
    v.name,
    v.phone,
    v.query_params,
    v.funnel_stage,
    COALESCE(v.emails_sent, 0) AS emails_sent,
    v.page_key,
    split_part(coalesce(v.path, ''), '?', 1) AS page_base,
    COALESCE(
      NULLIF(trim(lower(v.email)), ''),
      NULLIF(trim(lower(v.query_params->>'email')), ''),
      NULLIF(trim(lower(v.query_params->>'contact')), ''),
      NULLIF(
        lower(regexp_replace(substring(v.path FROM 'email=([^&]+)'), '%40', '@', 'g')),
        ''
      )
    ) AS resolved_email
  FROM public.calculator_page_visits v
),
with_domain AS (
  SELECT
    vr.*,
    CASE
      WHEN vr.resolved_email ~ '^[^@]+@[^@]+\.[^@]+$'
      THEN split_part(vr.resolved_email, '@', 2)
      ELSE NULL
    END AS domain
  FROM visit_resolved vr
),
enriched AS (
  SELECT
    wd.*,
    bc.first_name AS brevo_first_name,
    bc.last_name AS brevo_last_name,
    bc.name AS brevo_name,
    bc.phone AS brevo_phone
  FROM with_domain wd
  LEFT JOIN public.brevo_contacts bc
    ON lower(bc.email) = lower(wd.resolved_email)
)
SELECT DISTINCT ON (e.domain, e.resolved_email)
  e.domain,
  e.resolved_email AS email,
  COALESCE(
    NULLIF(trim(e.name), ''),
    NULLIF(trim(concat_ws(' ', e.query_params->>'firstName', e.query_params->>'lastName')), ''),
    NULLIF(trim(e.query_params->>'name'), ''),
    NULLIF(trim(concat_ws(' ', e.brevo_first_name, e.brevo_last_name)), ''),
    NULLIF(trim(e.brevo_name), '')
  ) AS name,
  COALESCE(
    NULLIF(trim(e.phone), ''),
    NULLIF(trim(e.query_params->>'phone'), ''),
    NULLIF(trim(e.brevo_phone), '')
  ) AS phone,
  NULL::text AS company,
  e.funnel_stage,
  e.emails_sent,
  e.page_key AS calculator_name,
  GREATEST(e.created_at, COALESCE(e.updated_at, e.created_at)) AS last_seen
FROM enriched e
WHERE e.domain IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM personal_domains pd WHERE pd.domain = e.domain)
  AND NOT EXISTS (SELECT 1 FROM internal_domains id WHERE id.domain = e.domain)
ORDER BY e.domain, e.resolved_email, e.created_at DESC;

COMMENT ON VIEW public.org_funnel_contacts IS
  'Drill-down: latest calculator visit per business-domain email.';

CREATE OR REPLACE VIEW public.org_funnel_scores AS
WITH personal_domains AS (
  SELECT unnest(ARRAY[
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'
  ]) AS domain
),
internal_domains AS (
  SELECT unnest(ARRAY[
    'seamlessly.us', 'ezdrink.us', 'mauricethefirst.com'
  ]) AS domain
),
visit_resolved AS (
  SELECT
    v.id,
    v.created_at,
    v.phone,
    COALESCE(v.emails_sent, 0) AS emails_sent,
    split_part(coalesce(v.path, ''), '?', 1) AS page_base,
    COALESCE(
      NULLIF(trim(lower(v.email)), ''),
      NULLIF(trim(lower(v.query_params->>'email')), ''),
      NULLIF(trim(lower(v.query_params->>'contact')), ''),
      NULLIF(
        lower(regexp_replace(substring(v.path FROM 'email=([^&]+)'), '%40', '@', 'g')),
        ''
      )
    ) AS resolved_email
  FROM public.calculator_page_visits v
),
business_visits AS (
  SELECT
    vr.*,
    CASE
      WHEN vr.resolved_email ~ '^[^@]+@[^@]+\.[^@]+$'
      THEN split_part(vr.resolved_email, '@', 2)
      ELSE NULL
    END AS domain
  FROM visit_resolved vr
  WHERE vr.resolved_email ~ '^[^@]+@[^@]+\.[^@]+$'
),
business_visits_filtered AS (
  SELECT bv.*
  FROM business_visits bv
  WHERE bv.domain IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM personal_domains pd WHERE pd.domain = bv.domain)
    AND NOT EXISTS (SELECT 1 FROM internal_domains id WHERE id.domain = bv.domain)
),
session_domain AS (
  SELECT DISTINCT ON (e.session_id)
    e.session_id,
    bv.domain
  FROM public.calculator_engagement_events e
  INNER JOIN business_visits_filtered bv
    ON bv.page_base = split_part(coalesce(e.page, ''), '?', 1)
   AND abs(extract(EPOCH FROM (e.created_at - bv.created_at))) <= 7200
  ORDER BY e.session_id, abs(extract(EPOCH FROM (e.created_at - bv.created_at)))
),
visit_agg AS (
  SELECT
    domain,
    COUNT(*)::integer AS visit_count,
    COUNT(DISTINCT resolved_email)::integer AS unique_emails,
    BOOL_OR(phone IS NOT NULL AND trim(phone) <> '') AS has_phone,
    BOOL_OR(emails_sent > 0) AS reached_email_sequence,
    MAX(created_at) AS visits_last_seen
  FROM business_visits_filtered
  GROUP BY domain
),
engagement_agg AS (
  SELECT
    sd.domain,
    COUNT(*) FILTER (WHERE e.event_type = 'phone_provided')::integer AS phone_provided_count,
    BOOL_OR(e.event_type = 'calculator_completed') AS completed_calculator,
    BOOL_OR(e.event_type = 'cta_clicked') AS clicked_cta,
    MAX(e.created_at) AS engagement_last_seen
  FROM session_domain sd
  INNER JOIN public.calculator_engagement_events e ON e.session_id = sd.session_id
  WHERE e.event_type IN ('phone_provided', 'calculator_completed', 'cta_clicked')
  GROUP BY sd.domain
),
combined AS (
  SELECT
    COALESCE(va.domain, ea.domain) AS domain,
    COALESCE(va.visit_count, 0) AS visit_count,
    COALESCE(va.unique_emails, 0) AS unique_emails,
    COALESCE(va.has_phone, false) AS has_phone,
    COALESCE(ea.phone_provided_count, 0) AS phone_provided_count,
    COALESCE(ea.completed_calculator, false) AS completed_calculator,
    COALESCE(ea.clicked_cta, false) AS clicked_cta,
    COALESCE(va.reached_email_sequence, false) AS reached_email_sequence,
    COALESCE(va.unique_emails, 0) > 1 AS multi_person,
    GREATEST(va.visits_last_seen, ea.engagement_last_seen) AS last_seen,
  -- Scoring (adjust point values here):
  -- has_phone +30 | phone_provided +20 ea max 2 | calculator_completed +20
  -- cta_clicked +15 | emails_sent>0 +10 | unique_emails>1 +25
    (CASE WHEN COALESCE(va.has_phone, false) THEN 30 ELSE 0 END)
    + LEAST(COALESCE(ea.phone_provided_count, 0), 2) * 20
    + (CASE WHEN COALESCE(ea.completed_calculator, false) THEN 20 ELSE 0 END)
    + (CASE WHEN COALESCE(ea.clicked_cta, false) THEN 15 ELSE 0 END)
    + (CASE WHEN COALESCE(va.reached_email_sequence, false) THEN 10 ELSE 0 END)
    + (CASE WHEN COALESCE(va.unique_emails, 0) > 1 THEN 25 ELSE 0 END)
    AS funnel_score
  FROM visit_agg va
  FULL OUTER JOIN engagement_agg ea ON ea.domain = va.domain
)
SELECT
  domain,
  NULL::text AS company_name,
  unique_emails,
  visit_count,
  has_phone,
  phone_provided_count,
  completed_calculator,
  clicked_cta,
  reached_email_sequence,
  multi_person,
  funnel_score,
  CASE
    WHEN funnel_score >= 60 THEN 'HOT'
    WHEN funnel_score >= 30 THEN 'WARM'
    ELSE 'COLD'
  END AS priority_tier,
  last_seen
FROM combined
WHERE domain IS NOT NULL
  AND domain NOT IN ('seamlessly.us', 'ezdrink.us', 'mauricethefirst.com')
ORDER BY funnel_score DESC, last_seen DESC;

COMMENT ON VIEW public.org_funnel_scores IS
  'Org-level calculator funnel priority by business email domain.';
