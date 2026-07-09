-- Unified Lead Engine — canonical lead table extensions + lead_events
-- Project: smqwemfobrqxnpcooigd

ALTER TABLE public.scan_and_scale_click_events
  ADD COLUMN IF NOT EXISTS engine_version TEXT DEFAULT 'v1',
  ADD COLUMN IF NOT EXISTS intent_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS intent_tier TEXT DEFAULT 'COLD',
  ADD COLUMN IF NOT EXISTS lead_source TEXT,
  ADD COLUMN IF NOT EXISTS last_event_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS event_count INTEGER DEFAULT 0;

-- Generated domain column (add only if not present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'scan_and_scale_click_events'
      AND column_name = 'domain'
  ) THEN
    ALTER TABLE public.scan_and_scale_click_events
      ADD COLUMN domain TEXT GENERATED ALWAYS AS (
        CASE
          WHEN email IS NOT NULL AND email LIKE '%@%'
          THEN split_part(email, '@', 2)
          ELSE NULL
        END
      ) STORED;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_scan_and_scale_click_events_engine_version
  ON public.scan_and_scale_click_events (engine_version);

CREATE INDEX IF NOT EXISTS idx_scan_and_scale_click_events_intent_tier
  ON public.scan_and_scale_click_events (intent_tier);

CREATE TABLE IF NOT EXISTS public.lead_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  email TEXT,
  domain TEXT GENERATED ALWAYS AS (
    CASE WHEN email LIKE '%@%' THEN split_part(email, '@', 2) ELSE NULL END
  ) STORED,
  lead_id UUID REFERENCES public.scan_and_scale_click_events(id),
  event_name TEXT NOT NULL,
  engagement_type TEXT NOT NULL CHECK (
    engagement_type IN ('view', 'interact', 'submit', 'repeat', 'phone_provided')
  ),
  source TEXT NOT NULL,
  session_id TEXT,
  meta JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS lead_events_email_idx ON public.lead_events(email);
CREATE INDEX IF NOT EXISTS lead_events_domain_idx ON public.lead_events(domain);
CREATE INDEX IF NOT EXISTS lead_events_lead_idx ON public.lead_events(lead_id);
CREATE INDEX IF NOT EXISTS lead_events_event_name_idx ON public.lead_events(event_name);

ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_lead_events" ON public.lead_events;
CREATE POLICY "anon_insert_lead_events" ON public.lead_events
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "service_all_lead_events" ON public.lead_events;
CREATE POLICY "service_all_lead_events" ON public.lead_events
  FOR ALL TO service_role USING (true);

COMMENT ON TABLE public.lead_events IS
  'Unified lead magnet engagement stream — all calculators and landing pages.';

GRANT INSERT ON TABLE public.lead_events TO anon;
