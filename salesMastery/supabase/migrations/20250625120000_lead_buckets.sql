-- FINISHED LEADS
-- Submitted gate form, have contact info, in nurture sequence
CREATE TABLE IF NOT EXISTS finished_calc_leads (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        TIMESTAMPTZ DEFAULT now(),
  email             TEXT NOT NULL,
  name              TEXT,
  phone             TEXT,
  lead_source       TEXT,
  calculator_output JSONB DEFAULT '{}',
  intent_score      INTEGER DEFAULT 0,
  intent_tier       TEXT DEFAULT 'COLD',
  funnel_stage      TEXT DEFAULT 'email_1_sent',
  emails_sent       INTEGER DEFAULT 0,
  call_task_created BOOLEAN DEFAULT false,
  click_event_id    UUID REFERENCES scan_and_scale_click_events(id),
  last_activity_at  TIMESTAMPTZ DEFAULT now(),
  notes             TEXT
);

-- ABANDONED LEADS
-- Completed calculator, saw their number, never submitted gate form
CREATE TABLE IF NOT EXISTS abandoned_calc_leads (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ DEFAULT now(),
  email            TEXT,
  session_id       TEXT,
  lead_source      TEXT,
  calculator_output JSONB DEFAULT '{}',
  event_count      INTEGER DEFAULT 0,
  last_event_at    TIMESTAMPTZ,
  re_engaged       BOOLEAN DEFAULT false
);

-- Upsert targets
CREATE UNIQUE INDEX IF NOT EXISTS finished_calc_leads_click_event_id_uidx
  ON finished_calc_leads (click_event_id)
  WHERE click_event_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS abandoned_calc_leads_session_id_uidx
  ON abandoned_calc_leads (session_id)
  WHERE session_id IS NOT NULL;

-- RLS
ALTER TABLE finished_calc_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE abandoned_calc_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_all_finished" ON finished_calc_leads
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_all_abandoned" ON abandoned_calc_leads
  FOR ALL TO service_role USING (true);

CREATE POLICY "anon_select_finished" ON finished_calc_leads
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_update_finished" ON finished_calc_leads
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_select_abandoned" ON abandoned_calc_leads
  FOR SELECT TO anon USING (true);

GRANT SELECT, UPDATE ON finished_calc_leads TO anon;
GRANT SELECT ON abandoned_calc_leads TO anon;

-- Indexes
CREATE INDEX IF NOT EXISTS finished_leads_intent_idx
  ON finished_calc_leads(intent_tier, created_at DESC);

CREATE INDEX IF NOT EXISTS abandoned_leads_source_idx
  ON abandoned_calc_leads(lead_source, created_at DESC);

-- Backfill finished leads (v2 gate submits)
INSERT INTO finished_calc_leads (
  email, name, phone, lead_source,
  intent_score, intent_tier, funnel_stage,
  emails_sent, call_task_created, click_event_id,
  created_at, last_activity_at
)
SELECT
  email, name, phone, lead_source,
  intent_score, intent_tier, funnel_stage,
  emails_sent, call_task_created, id,
  created_at, last_event_at
FROM scan_and_scale_click_events
WHERE engine_version = 'v2'
AND email NOT ILIKE '%test%'
AND email NOT ILIKE '%seamlessly%'
AND email != 'maurice@mauricethefirst.com'
AND email NOT ILIKE '%user%'
ON CONFLICT DO NOTHING;

-- Backfill abandoned leads (completed calculator, no gate submit)
INSERT INTO abandoned_calc_leads (
  email, session_id, lead_source,
  event_count, last_event_at, created_at
)
SELECT
  email,
  session_id,
  source,
  COUNT(*) AS event_count,
  MAX(created_at) AS last_event_at,
  MIN(created_at) AS created_at
FROM lead_events
WHERE event_name = 'calculator_completed'
AND lead_id IS NULL
AND email NOT ILIKE '%test%'
AND email NOT ILIKE '%seamlessly%'
AND email != 'maurice@mauricethefirst.com'
GROUP BY email, session_id, source
ON CONFLICT DO NOTHING;
