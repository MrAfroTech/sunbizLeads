-- Lead Priority Dashboard: canonical funnel view + AM status write-back support
-- Project: smqwemfobrqxnpcooigd

-- Optional enrichment columns on finished_calc_leads (section 9 going forward)
ALTER TABLE public.finished_calc_leads
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- AM outreach status rows (separate from phone-call queue tasks)
CREATE UNIQUE INDEX IF NOT EXISTS follow_up_tasks_am_outreach_email_uidx
  ON public.follow_up_tasks (lower(trim(email)), task_type)
  WHERE task_type = 'am_outreach';

-- RevOps: read priority view + upsert AM status
DROP POLICY IF EXISTS "anon_upsert_follow_up_tasks_am" ON public.follow_up_tasks;
CREATE POLICY "anon_upsert_follow_up_tasks_am" ON public.follow_up_tasks
  FOR ALL TO anon
  USING (task_type = 'am_outreach')
  WITH CHECK (task_type = 'am_outreach');

GRANT INSERT, UPDATE ON public.follow_up_tasks TO anon;

CREATE OR REPLACE VIEW public.v_lead_priority AS
WITH all_emails AS (
  SELECT lower(trim(email)) AS email
  FROM public.lead_events
  WHERE email IS NOT NULL AND trim(email) <> ''
  UNION
  SELECT lower(trim(email))
  FROM public.finished_calc_leads
  WHERE email IS NOT NULL AND trim(email) <> ''
  UNION
  SELECT lower(trim(email))
  FROM public.follow_up_tasks
  WHERE email IS NOT NULL AND trim(email) <> ''
  UNION
  SELECT lower(trim(email))
  FROM public.setter_dispositions
  WHERE email IS NOT NULL AND trim(email) <> ''
  UNION
  SELECT lower(trim(email))
  FROM public.scan_and_scale_click_events
  WHERE email IS NOT NULL AND trim(email) <> ''
),
eligible_emails AS (
  SELECT DISTINCT email
  FROM all_emails
  WHERE email NOT LIKE '%test%'
    AND email NOT LIKE '%seamlessly%'
    AND email NOT LIKE '%user%'
    AND email <> 'maurice@mauricethefirst.com'
),
events_30d AS (
  SELECT lower(trim(email)) AS email, COUNT(*)::int AS event_count_30d
  FROM public.lead_events
  WHERE email IS NOT NULL
    AND created_at >= (now() - interval '30 days')
  GROUP BY 1
),
events_flags AS (
  SELECT
    lower(trim(email)) AS email,
    bool_or(event_name = 'calculator_started') AS has_calc_started,
    bool_or(event_name IN ('calculator_started', 'calculator_completed', 'lead_submitted')) AS has_calc_activity
  FROM public.lead_events
  WHERE email IS NOT NULL
  GROUP BY 1
),
has_lead_events AS (
  SELECT lower(trim(email)) AS email, true AS has_events
  FROM public.lead_events
  WHERE email IS NOT NULL
  GROUP BY 1
),
finished_latest AS (
  SELECT DISTINCT ON (lower(trim(email)))
    lower(trim(email)) AS email,
    name,
    phone,
    lead_source,
    title,
    company_name,
    linkedin_url,
    calculator_output,
    coalesce(last_activity_at, created_at) AS finished_at
  FROM public.finished_calc_leads
  WHERE email IS NOT NULL
  ORDER BY lower(trim(email)), coalesce(last_activity_at, created_at) DESC NULLS LAST
),
ssce_latest AS (
  SELECT DISTINCT ON (lower(trim(email)))
    lower(trim(email)) AS email,
    company,
    coalesce(last_event_at, updated_at, created_at) AS ssce_at
  FROM public.scan_and_scale_click_events
  WHERE email IS NOT NULL
  ORDER BY lower(trim(email)), coalesce(last_event_at, updated_at, created_at) DESC NULLS LAST
),
am_status AS (
  SELECT DISTINCT ON (lower(trim(email)))
    lower(trim(email)) AS email,
    status,
    coalesce(updated_at, created_at) AS am_at
  FROM public.follow_up_tasks
  WHERE email IS NOT NULL AND task_type = 'am_outreach'
  ORDER BY lower(trim(email)), coalesce(updated_at, created_at) DESC NULLS LAST
),
call_tasks AS (
  SELECT lower(trim(email)) AS email, true AS has_call_task
  FROM public.follow_up_tasks
  WHERE email IS NOT NULL
    AND task_type <> 'am_outreach'
    AND status IN ('pending', 'scheduled')
  GROUP BY 1
),
lead_last_event AS (
  SELECT lower(trim(email)) AS email, MAX(created_at) AS le_last
  FROM public.lead_events
  WHERE email IS NOT NULL
  GROUP BY 1
),
setter_last AS (
  SELECT lower(trim(email)) AS email, MAX(updated_at) AS setter_at
  FROM public.setter_dispositions
  WHERE email IS NOT NULL
  GROUP BY 1
),
staged AS (
  SELECT
    e.email,
    lower(split_part(e.email, '@', 2)) AS domain,
    CASE
      WHEN am.status = 'scheduled_meeting' OR am.status = 'scheduled' THEN 7
      WHEN am.status = 'contacted' THEN 6
      WHEN ct.has_call_task THEN 5
      WHEN fl.phone IS NOT NULL AND trim(fl.phone) <> '' THEN 4
      WHEN fl.email IS NOT NULL THEN 3
      WHEN ef.has_calc_started OR ef.has_calc_activity THEN 2
      WHEN hle.has_events THEN 1
      ELSE 1
    END AS furthest_stage,
    coalesce(ev30.event_count_30d, 0) AS event_count_30d,
    greatest(
      coalesce(lle.le_last, '-infinity'::timestamptz),
      coalesce(fl.finished_at, '-infinity'::timestamptz),
      coalesce(am.am_at, '-infinity'::timestamptz),
      coalesce(sl.setter_at, '-infinity'::timestamptz),
      coalesce(ss.ssce_at, '-infinity'::timestamptz)
    ) AS last_activity,
    coalesce(am.status, 'not_contacted') AS status,
    fl.lead_source AS calculator_type,
    NULLIF(trim(fl.phone), '') AS phone,
    NULLIF(trim(fl.name), '') AS full_name,
    NULLIF(trim(fl.title), '') AS title,
    NULLIF(
      trim(
        coalesce(
          fl.company_name,
          fl.calculator_output->>'venue_name',
          fl.calculator_output->>'company_name',
          fl.calculator_output->>'venueName',
          ss.company,
          ''
        )
      ),
      ''
    ) AS company_name,
    NULLIF(trim(fl.linkedin_url), '') AS linkedin_url
  FROM eligible_emails e
  LEFT JOIN events_30d ev30 ON ev30.email = e.email
  LEFT JOIN events_flags ef ON ef.email = e.email
  LEFT JOIN has_lead_events hle ON hle.email = e.email
  LEFT JOIN finished_latest fl ON fl.email = e.email
  LEFT JOIN ssce_latest ss ON ss.email = e.email
  LEFT JOIN am_status am ON am.email = e.email
  LEFT JOIN call_tasks ct ON ct.email = e.email
  LEFT JOIN lead_last_event lle ON lle.email = e.email
  LEFT JOIN setter_last sl ON sl.email = e.email
),
with_domain_counts AS (
  SELECT
    s.*,
    COUNT(*) OVER (PARTITION BY s.domain)::int AS contacts_at_domain
  FROM staged s
)
SELECT
  email,
  domain,
  furthest_stage,
  CASE furthest_stage
    WHEN 1 THEN 'Newsletter Engaged'
    WHEN 2 THEN 'Calculator Started'
    WHEN 3 THEN 'Calculator Completed'
    WHEN 4 THEN 'Phone Submitted'
    WHEN 5 THEN 'Follow-up Scheduled'
    WHEN 6 THEN 'Contacted by AM'
    WHEN 7 THEN 'Meeting Booked'
    ELSE 'Unknown'
  END AS furthest_stage_label,
  event_count_30d,
  contacts_at_domain,
  NULLIF(last_activity, '-infinity'::timestamptz) AS last_activity,
  (
    (furthest_stage * 10)
    + (event_count_30d * 2)
    + (contacts_at_domain * 5)
  )::numeric AS priority_score,
  status,
  calculator_type,
  phone,
  full_name,
  title,
  company_name,
  linkedin_url,
  (contacts_at_domain >= 3) AS is_cluster_signal
FROM with_domain_counts;

COMMENT ON VIEW public.v_lead_priority IS
  'One row per email — funnel stage, priority score, and AM status for RevOps Lead Priority tab.';

GRANT SELECT ON public.v_lead_priority TO anon;
