-- Fix abandoned_calc_leads upsert target (partial unique index breaks PostgREST onConflict)
DROP INDEX IF EXISTS abandoned_calc_leads_session_id_uidx;

CREATE UNIQUE INDEX abandoned_calc_leads_session_id_key
  ON abandoned_calc_leads (session_id);

-- Backfill anonymous abandons (NULL email was excluded by prior migration filters)
INSERT INTO abandoned_calc_leads (
  email, session_id, lead_source, event_count, last_event_at, created_at
)
SELECT
  email,
  session_id,
  source,
  COUNT(*)::integer,
  MAX(created_at),
  MIN(created_at)
FROM lead_events
WHERE event_name = 'calculator_completed'
  AND lead_id IS NULL
  AND session_id IS NOT NULL
  AND (
    email IS NULL
    OR (
      email NOT ILIKE '%test%'
      AND email NOT ILIKE '%seamlessly%'
      AND email <> 'maurice@mauricethefirst.com'
      AND email NOT ILIKE '%user%'
    )
  )
GROUP BY email, session_id, source
ON CONFLICT (session_id) DO UPDATE SET
  event_count = EXCLUDED.event_count,
  last_event_at = EXCLUDED.last_event_at,
  lead_source = COALESCE(abandoned_calc_leads.lead_source, EXCLUDED.lead_source),
  email = COALESCE(abandoned_calc_leads.email, EXCLUDED.email);

-- Mirror calculator fields onto finished_calc_leads from canonical SSCE row
UPDATE finished_calc_leads fcl
SET calculator_output = jsonb_strip_nulls(
  jsonb_build_object(
    'estimated_loss', ssce.estimated_loss,
    'avg_wait_time', ssce.avg_wait_time,
    'primary_friction_zone', ssce.primary_friction_zone
  )
)
FROM scan_and_scale_click_events ssce
WHERE ssce.id = fcl.click_event_id
  AND ssce.estimated_loss IS NOT NULL;
