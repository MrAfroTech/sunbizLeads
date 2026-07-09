-- Account cluster routing + Explorium enrichment support for v_lead_priority
-- Part 1: static POC overrides | Part 2: enriched_contacts + queue

-- ---------------------------------------------------------------------------
-- Part 1 — Static POC overrides (fallback when Explorium has not assigned POC)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.account_poc_overrides (
  domain       TEXT PRIMARY KEY,
  poc_email    TEXT NOT NULL,
  poc_name     TEXT,
  poc_title    TEXT,
  prospect_id  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.account_poc_overrides (domain, poc_email, poc_name, poc_title, prospect_id)
VALUES
  ('columbiafireflies.com', 'bshank@columbiafireflies.com', 'Brad Shank', 'President',
   '54e3dd41a42774d482dcb12e354158dfc5a84419'),
  ('athletics.ucla.edu', 'kmaciel@athletics.ucla.edu', 'Karina Maciel',
   'Asst. Director Marketing & Fan Experiences', NULL),
  ('whitecapsbaseball.com', 'danm@whitecapsbaseball.com', 'Dan Morrison', 'VP Sales', NULL)
ON CONFLICT (domain) DO UPDATE SET
  poc_email = EXCLUDED.poc_email,
  poc_name = EXCLUDED.poc_name,
  poc_title = EXCLUDED.poc_title,
  prospect_id = EXCLUDED.prospect_id;

-- Explorium-assigned POC per domain (primary over static overrides)
CREATE TABLE IF NOT EXISTS public.account_cluster_poc (
  domain       TEXT PRIMARY KEY,
  poc_email    TEXT NOT NULL,
  source       TEXT NOT NULL DEFAULT 'explorium' CHECK (source IN ('explorium', 'manual')),
  assigned_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Part 2 — Enrichment storage + queue
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.enriched_contacts (
  lead_email       TEXT PRIMARY KEY,
  prospect_id      TEXT,
  full_name        TEXT,
  job_title        TEXT,
  seniority_level  TEXT,
  linkedin_url     TEXT,
  company_name     TEXT,
  enriched_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lead_enrichment_queue (
  email        TEXT PRIMARY KEY,
  status       TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'skipped', 'failed')),
  error        TEXT,
  queued_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.enrichment_daily_usage (
  usage_date    DATE PRIMARY KEY DEFAULT CURRENT_DATE,
  credits_used  INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS enriched_contacts_enriched_at_idx
  ON public.enriched_contacts (enriched_at DESC);

CREATE INDEX IF NOT EXISTS lead_enrichment_queue_status_idx
  ON public.lead_enrichment_queue (status, queued_at);

ALTER TABLE public.account_poc_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_cluster_poc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enriched_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_enrichment_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrichment_daily_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_account_poc_overrides" ON public.account_poc_overrides
  FOR SELECT TO anon USING (true);
CREATE POLICY "service_all_account_poc_overrides" ON public.account_poc_overrides
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "anon_select_account_cluster_poc" ON public.account_cluster_poc
  FOR SELECT TO anon USING (true);
CREATE POLICY "service_all_account_cluster_poc" ON public.account_cluster_poc
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "anon_select_enriched_contacts" ON public.enriched_contacts
  FOR SELECT TO anon USING (true);
CREATE POLICY "service_all_enriched_contacts" ON public.enriched_contacts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_all_lead_enrichment_queue" ON public.lead_enrichment_queue
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_all_enrichment_daily_usage" ON public.enrichment_daily_usage
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT ON public.account_poc_overrides TO anon;
GRANT SELECT ON public.account_cluster_poc TO anon;
GRANT SELECT ON public.enriched_contacts TO anon;

-- ---------------------------------------------------------------------------
-- Queue helper (triggers on source tables — views cannot have triggers)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.queue_lead_enrichment(p_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT := lower(trim(p_email));
BEGIN
  IF v_email IS NULL OR v_email = '' OR v_email LIKE '%test%'
     OR v_email LIKE '%seamlessly%' OR v_email LIKE '%user%'
     OR v_email = 'maurice@mauricethefirst.com' THEN
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM enriched_contacts WHERE lead_email = v_email) THEN
    RETURN;
  END IF;

  INSERT INTO lead_enrichment_queue (email, status, queued_at)
  VALUES (v_email, 'pending', now())
  ON CONFLICT (email) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_queue_lead_enrichment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.queue_lead_enrichment(NEW.email);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_queue_enrichment_finished_calc ON public.finished_calc_leads;
CREATE TRIGGER trg_queue_enrichment_finished_calc
  AFTER INSERT OR UPDATE OF email ON public.finished_calc_leads
  FOR EACH ROW
  WHEN (NEW.email IS NOT NULL)
  EXECUTE FUNCTION public.trg_queue_lead_enrichment();

DROP TRIGGER IF EXISTS trg_queue_enrichment_cpv ON public.calculator_page_visits;
CREATE TRIGGER trg_queue_enrichment_cpv
  AFTER INSERT OR UPDATE OF email ON public.calculator_page_visits
  FOR EACH ROW
  WHEN (NEW.email IS NOT NULL)
  EXECUTE FUNCTION public.trg_queue_lead_enrichment();

DROP TRIGGER IF EXISTS trg_queue_enrichment_ssce ON public.scan_and_scale_click_events;
CREATE TRIGGER trg_queue_enrichment_ssce
  AFTER INSERT OR UPDATE OF email ON public.scan_and_scale_click_events
  FOR EACH ROW
  WHEN (NEW.email IS NOT NULL)
  EXECUTE FUNCTION public.trg_queue_lead_enrichment();

-- ---------------------------------------------------------------------------
-- v_lead_priority — cluster routing + enrichment join
-- DROP required: CREATE OR REPLACE cannot reorder/rename view columns
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS public.v_lead_priority;

CREATE VIEW public.v_lead_priority AS
WITH all_emails AS (
  SELECT lower(trim(email)) AS email
  FROM public.lead_events
  WHERE email IS NOT NULL AND trim(email) <> ''
  UNION
  SELECT lower(trim(email)) FROM public.finished_calc_leads
  WHERE email IS NOT NULL AND trim(email) <> ''
  UNION
  SELECT lower(trim(email)) FROM public.follow_up_tasks
  WHERE email IS NOT NULL AND trim(email) <> ''
  UNION
  SELECT lower(trim(email)) FROM public.setter_dispositions
  WHERE email IS NOT NULL AND trim(email) <> ''
  UNION
  SELECT lower(trim(email)) FROM public.scan_and_scale_click_events
  WHERE email IS NOT NULL AND trim(email) <> ''
  UNION
  SELECT lower(trim(email)) FROM public.calculator_page_visits
  WHERE email IS NOT NULL AND trim(email) <> ''
),
eligible_emails AS (
  SELECT DISTINCT email FROM all_emails
  WHERE email NOT LIKE '%test%' AND email NOT LIKE '%seamlessly%'
    AND email NOT LIKE '%user%' AND email <> 'maurice@mauricethefirst.com'
),
domain_activity_30d AS (
  SELECT lower(split_part(trim(email), '@', 2)) AS domain, lower(trim(email)) AS email
  FROM (
    SELECT email, created_at AS activity_at FROM public.lead_events
    WHERE email IS NOT NULL AND created_at >= (now() - interval '30 days')
    UNION ALL
    SELECT email, created_at FROM public.calculator_page_visits
    WHERE email IS NOT NULL AND created_at >= (now() - interval '30 days')
    UNION ALL
    SELECT email, coalesce(last_activity_at, created_at) FROM public.finished_calc_leads
    WHERE email IS NOT NULL AND coalesce(last_activity_at, created_at) >= (now() - interval '30 days')
    UNION ALL
    SELECT email, coalesce(last_event_at, updated_at, created_at) FROM public.scan_and_scale_click_events
    WHERE email IS NOT NULL
      AND coalesce(last_event_at, updated_at, created_at) >= (now() - interval '30 days')
  ) recent
  WHERE email IS NOT NULL AND trim(email) <> ''
),
cluster_size_30d AS (
  SELECT domain, COUNT(DISTINCT email)::int AS cluster_size
  FROM domain_activity_30d
  GROUP BY domain
),
domain_poc AS (
  SELECT
    cs.domain,
    cs.cluster_size,
    lower(trim(coalesce(acp.poc_email, apo.poc_email))) AS cluster_poc_email,
    coalesce(acp.poc_email IS NOT NULL, false) AS poc_from_explorium,
    apo.poc_name AS static_poc_name,
    apo.poc_title AS static_poc_title
  FROM cluster_size_30d cs
  LEFT JOIN public.account_cluster_poc acp ON acp.domain = cs.domain
  LEFT JOIN public.account_poc_overrides apo ON apo.domain = cs.domain
  WHERE cs.cluster_size >= 3
    AND coalesce(acp.poc_email, apo.poc_email) IS NOT NULL
),
events_30d AS (
  SELECT lower(trim(email)) AS email, COUNT(*)::int AS event_count_30d
  FROM public.lead_events
  WHERE email IS NOT NULL AND created_at >= (now() - interval '30 days')
  GROUP BY 1
),
events_flags AS (
  SELECT lower(trim(email)) AS email,
    bool_or(event_name = 'calculator_started') AS has_calc_started,
    bool_or(event_name IN ('calculator_started', 'calculator_completed', 'lead_submitted')) AS has_calc_activity
  FROM public.lead_events WHERE email IS NOT NULL GROUP BY 1
),
has_lead_events AS (
  SELECT lower(trim(email)) AS email, true AS has_events
  FROM public.lead_events WHERE email IS NOT NULL GROUP BY 1
),
has_cpv AS (
  SELECT lower(trim(email)) AS email, true AS has_visit
  FROM public.calculator_page_visits
  WHERE email IS NOT NULL AND trim(email) <> '' GROUP BY 1
),
finished_latest AS (
  SELECT DISTINCT ON (lower(trim(email)))
    lower(trim(email)) AS email, name, phone, lead_source, title, company_name,
    linkedin_url, calculator_output, coalesce(last_activity_at, created_at) AS finished_at
  FROM public.finished_calc_leads WHERE email IS NOT NULL
  ORDER BY lower(trim(email)), coalesce(last_activity_at, created_at) DESC NULLS LAST
),
cpv_latest AS (
  SELECT DISTINCT ON (lower(trim(email)))
    lower(trim(email)) AS email, name, page_key, coalesce(updated_at, created_at) AS cpv_at
  FROM public.calculator_page_visits WHERE email IS NOT NULL AND trim(email) <> ''
  ORDER BY lower(trim(email)), coalesce(updated_at, created_at) DESC NULLS LAST
),
ssce_latest AS (
  SELECT DISTINCT ON (lower(trim(email)))
    lower(trim(email)) AS email, company,
    coalesce(last_event_at, updated_at, created_at) AS ssce_at
  FROM public.scan_and_scale_click_events WHERE email IS NOT NULL
  ORDER BY lower(trim(email)), coalesce(last_event_at, updated_at, created_at) DESC NULLS LAST
),
enriched_latest AS (
  SELECT lower(trim(lead_email)) AS email, prospect_id, full_name, job_title,
    seniority_level, linkedin_url, company_name, enriched_at
  FROM public.enriched_contacts
),
am_status AS (
  SELECT DISTINCT ON (lower(trim(email)))
    lower(trim(email)) AS email, status, coalesce(updated_at, created_at) AS am_at
  FROM public.follow_up_tasks WHERE email IS NOT NULL AND task_type = 'am_outreach'
  ORDER BY lower(trim(email)), coalesce(updated_at, created_at) DESC NULLS LAST
),
call_tasks AS (
  SELECT lower(trim(email)) AS email, true AS has_call_task
  FROM public.follow_up_tasks
  WHERE email IS NOT NULL AND task_type <> 'am_outreach'
    AND status IN ('pending', 'scheduled')
  GROUP BY 1
),
lead_last_event AS (
  SELECT lower(trim(email)) AS email, MAX(created_at) AS le_last
  FROM public.lead_events WHERE email IS NOT NULL GROUP BY 1
),
setter_last AS (
  SELECT lower(trim(email)) AS email, MAX(updated_at) AS setter_at
  FROM public.setter_dispositions WHERE email IS NOT NULL GROUP BY 1
),
staged AS (
  SELECT
    e.email,
    lower(split_part(e.email, '@', 2)) AS domain,
    CASE
      WHEN am.status IN ('scheduled_meeting', 'scheduled') THEN 7
      WHEN am.status = 'contacted' THEN 6
      WHEN ct.has_call_task THEN 5
      WHEN fl.phone IS NOT NULL AND trim(fl.phone) <> '' THEN 4
      WHEN fl.email IS NOT NULL THEN 3
      WHEN ef.has_calc_started OR ef.has_calc_activity THEN 2
      WHEN hle.has_events OR cpv.has_visit THEN 1
      ELSE 1
    END AS furthest_stage,
    coalesce(ev30.event_count_30d, 0) AS event_count_30d,
    coalesce(cs30.cluster_size, 0) AS cluster_size,
    dp.cluster_poc_email,
    dp.poc_from_explorium,
    greatest(
      coalesce(lle.le_last, '-infinity'::timestamptz),
      coalesce(fl.finished_at, '-infinity'::timestamptz),
      coalesce(am.am_at, '-infinity'::timestamptz),
      coalesce(sl.setter_at, '-infinity'::timestamptz),
      coalesce(ss.ssce_at, '-infinity'::timestamptz),
      coalesce(cpv_l.cpv_at, '-infinity'::timestamptz),
      coalesce(ec.enriched_at, '-infinity'::timestamptz)
    ) AS last_activity,
    coalesce(am.status, 'not_contacted') AS status,
    coalesce(fl.lead_source, cpv_l.page_key) AS calculator_type,
    NULLIF(trim(fl.phone), '') AS phone,
    NULLIF(trim(coalesce(fl.name, cpv_l.name, ec.full_name)), '') AS full_name,
    NULLIF(trim(coalesce(ec.job_title, fl.title)), '') AS title,
    NULLIF(trim(coalesce(ec.company_name, fl.company_name,
      fl.calculator_output->>'venue_name', fl.calculator_output->>'company_name',
      fl.calculator_output->>'venueName', ss.company, '')), '') AS company_name,
    NULLIF(trim(coalesce(ec.linkedin_url, fl.linkedin_url)), '') AS linkedin_url,
    ec.seniority_level,
    ec.prospect_id
  FROM eligible_emails e
  LEFT JOIN events_30d ev30 ON ev30.email = e.email
  LEFT JOIN events_flags ef ON ef.email = e.email
  LEFT JOIN has_lead_events hle ON hle.email = e.email
  LEFT JOIN has_cpv cpv ON cpv.email = e.email
  LEFT JOIN cluster_size_30d cs30 ON cs30.domain = lower(split_part(e.email, '@', 2))
  LEFT JOIN domain_poc dp ON dp.domain = lower(split_part(e.email, '@', 2))
  LEFT JOIN finished_latest fl ON fl.email = e.email
  LEFT JOIN cpv_latest cpv_l ON cpv_l.email = e.email
  LEFT JOIN ssce_latest ss ON ss.email = e.email
  LEFT JOIN enriched_latest ec ON ec.email = e.email
  LEFT JOIN am_status am ON am.email = e.email
  LEFT JOIN call_tasks ct ON ct.email = e.email
  LEFT JOIN lead_last_event lle ON lle.email = e.email
  LEFT JOIN setter_last sl ON sl.email = e.email
),
with_domain_counts AS (
  SELECT s.*, COUNT(*) OVER (PARTITION BY s.domain)::int AS contacts_at_domain
  FROM staged s
)
SELECT
  email,
  domain,
  furthest_stage,
  CASE furthest_stage
    WHEN 1 THEN 'Newsletter Engaged' WHEN 2 THEN 'Calculator Started'
    WHEN 3 THEN 'Calculator Completed' WHEN 4 THEN 'Phone Submitted'
    WHEN 5 THEN 'Follow-up Scheduled' WHEN 6 THEN 'Contacted by AM'
    WHEN 7 THEN 'Meeting Booked' ELSE 'Unknown'
  END AS furthest_stage_label,
  event_count_30d,
  contacts_at_domain,
  cluster_size,
  cluster_poc_email,
  (cluster_size >= 3 AND cluster_poc_email IS NOT NULL
    AND lower(trim(email)) <> lower(trim(cluster_poc_email))) AS suppress_individual_outreach,
  NULLIF(last_activity, '-infinity'::timestamptz) AS last_activity,
  ((furthest_stage * 10) + (event_count_30d * 2) + (contacts_at_domain * 5))::numeric AS priority_score,
  status,
  calculator_type,
  phone,
  full_name,
  title,
  company_name,
  linkedin_url,
  seniority_level,
  prospect_id,
  poc_from_explorium,
  (cluster_size >= 3) AS is_cluster_signal
FROM with_domain_counts;

COMMENT ON VIEW public.v_lead_priority IS
  'Lead priority with 30d cluster routing, POC assignment, Explorium enrichment, and outreach suppression.';

GRANT SELECT ON public.v_lead_priority TO anon;
