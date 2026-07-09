-- One-time test lead purge (run in Supabase SQL editor after reviewing preview).
-- Preview first:
-- SELECT id, email, name, lead_source, engine_version, created_at
-- FROM scan_and_scale_click_events
-- WHERE email ILIKE '%test%' OR email ILIKE '%seamlessly%'
--   OR email ILIKE '%maurice@mauricethefirst.com%' OR email ILIKE '%user%'
--   OR name ILIKE '%test%' OR name ILIKE '%user%'
-- ORDER BY created_at DESC;

BEGIN;

-- 2a. follow_up_tasks (click_event_id AND calculator_visit_id FKs)
DELETE FROM follow_up_tasks
WHERE click_event_id IN (
  SELECT id FROM scan_and_scale_click_events
  WHERE email ILIKE '%test%'
    OR email ILIKE '%seamlessly%'
    OR email = 'maurice@mauricethefirst.com'
    OR email ILIKE '%user%'
    OR name ILIKE '%test%'
    OR name ILIKE '%user%'
)
OR calculator_visit_id IN (
  SELECT id FROM calculator_page_visits
  WHERE email ILIKE '%test%'
    OR email ILIKE '%seamlessly%'
    OR email = 'maurice@mauricethefirst.com'
    OR email ILIKE '%user%'
);

-- 2b. lead_events (email + lead_id for name-only test rows)
DELETE FROM lead_events
WHERE email ILIKE '%test%'
  OR email ILIKE '%seamlessly%'
  OR email = 'maurice@mauricethefirst.com'
  OR email ILIKE '%user%'
  OR lead_id IN (
    SELECT id FROM scan_and_scale_click_events
    WHERE name ILIKE '%test%' OR name ILIKE '%user%'
  );

-- 2c. calculator_page_visits
DELETE FROM calculator_page_visits
WHERE email ILIKE '%test%'
  OR email ILIKE '%seamlessly%'
  OR email = 'maurice@mauricethefirst.com'
  OR email ILIKE '%user%';

-- 2d. calculator_engagement_events
DELETE FROM calculator_engagement_events
WHERE email ILIKE '%test%'
  OR email ILIKE '%seamlessly%'
  OR email = 'maurice@mauricethefirst.com'
  OR email ILIKE '%user%';

-- 2e. sports_revenue_game_journeys
DELETE FROM sports_revenue_game_journeys
WHERE email ILIKE '%test%'
  OR email ILIKE '%seamlessly%'
  OR email = 'maurice@mauricethefirst.com'
  OR email ILIKE '%user%';

-- 2f. canonical leads last
DELETE FROM scan_and_scale_click_events
WHERE email ILIKE '%test%'
  OR email ILIKE '%seamlessly%'
  OR email = 'maurice@mauricethefirst.com'
  OR email ILIKE '%user%'
  OR name ILIKE '%test%'
  OR name ILIKE '%user%';

COMMIT;
