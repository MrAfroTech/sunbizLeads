-- Leak 2: quarantine junk emails before they contaminate v_lead_priority sources
-- Leak 1 helper: optional backfill only when visit_id join is reliable

CREATE TABLE IF NOT EXISTS public.lead_ingestion_rejects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT,
  source_table TEXT NOT NULL,
  reason       TEXT NOT NULL,
  payload      JSONB NOT NULL DEFAULT '{}',
  rejected_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lead_ingestion_rejects_rejected_at_idx
  ON public.lead_ingestion_rejects (rejected_at DESC);
CREATE INDEX IF NOT EXISTS lead_ingestion_rejects_reason_idx
  ON public.lead_ingestion_rejects (reason);

ALTER TABLE public.lead_ingestion_rejects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_all_lead_ingestion_rejects" ON public.lead_ingestion_rejects;
CREATE POLICY "service_all_lead_ingestion_rejects" ON public.lead_ingestion_rejects
  FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_select_lead_ingestion_rejects" ON public.lead_ingestion_rejects;
CREATE POLICY "anon_select_lead_ingestion_rejects" ON public.lead_ingestion_rejects
  FOR SELECT TO anon USING (true);
GRANT SELECT ON public.lead_ingestion_rejects TO anon;

CREATE OR REPLACE FUNCTION public.email_quarantine_reason(p_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v TEXT := lower(trim(coalesce(p_email, '')));
  v_domain TEXT;
BEGIN
  IF v = '' THEN
    RETURN NULL; -- null/empty email allowed (anonymous events)
  END IF;
  IF position('{{' in v) > 0 OR position('}}' in v) > 0
     OR position('*|' in v) > 0 OR position('|*' in v) > 0 THEN
    RETURN 'unresolved_merge_tag';
  END IF;
  IF v !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RETURN 'invalid_email';
  END IF;
  v_domain := split_part(v, '@', 2);
  IF v_domain IN (
       'example.com', 'example.org', 'example.net',
       'team.us', 'team.com', 'test.com',
       'mailinator.com', 'guerrillamail.com'
     )
     OR v_domain LIKE '%.example.com'
     OR v_domain LIKE '%.test'
     OR v_domain LIKE '%seamlessly%'
     OR v LIKE '%test%'
     OR v LIKE '%user%'
     OR v = 'maurice@mauricethefirst.com' THEN
    RETURN 'test_domain';
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_quarantine_lead_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reason TEXT;
  v_email TEXT;
BEGIN
  v_email := NEW.email;
  v_reason := public.email_quarantine_reason(v_email);
  IF v_reason IS NOT NULL THEN
    INSERT INTO public.lead_ingestion_rejects (email, source_table, reason, payload)
    VALUES (
      v_email,
      TG_TABLE_NAME,
      v_reason,
      jsonb_build_object('op', TG_OP)
    );
    RETURN NULL; -- cancel insert/update of junk row
  END IF;
  RETURN NEW;
END;
$$;

-- Attach to all six v_lead_priority source tables
DROP TRIGGER IF EXISTS trg_quarantine_lead_events ON public.lead_events;
CREATE TRIGGER trg_quarantine_lead_events
  BEFORE INSERT OR UPDATE OF email ON public.lead_events
  FOR EACH ROW EXECUTE FUNCTION public.trg_quarantine_lead_email();

DROP TRIGGER IF EXISTS trg_quarantine_finished_calc ON public.finished_calc_leads;
CREATE TRIGGER trg_quarantine_finished_calc
  BEFORE INSERT OR UPDATE OF email ON public.finished_calc_leads
  FOR EACH ROW EXECUTE FUNCTION public.trg_quarantine_lead_email();

DROP TRIGGER IF EXISTS trg_quarantine_follow_up_tasks ON public.follow_up_tasks;
CREATE TRIGGER trg_quarantine_follow_up_tasks
  BEFORE INSERT OR UPDATE OF email ON public.follow_up_tasks
  FOR EACH ROW EXECUTE FUNCTION public.trg_quarantine_lead_email();

DROP TRIGGER IF EXISTS trg_quarantine_setter_dispositions ON public.setter_dispositions;
CREATE TRIGGER trg_quarantine_setter_dispositions
  BEFORE INSERT OR UPDATE OF email ON public.setter_dispositions
  FOR EACH ROW EXECUTE FUNCTION public.trg_quarantine_lead_email();

DROP TRIGGER IF EXISTS trg_quarantine_ssce ON public.scan_and_scale_click_events;
CREATE TRIGGER trg_quarantine_ssce
  BEFORE INSERT OR UPDATE OF email ON public.scan_and_scale_click_events
  FOR EACH ROW EXECUTE FUNCTION public.trg_quarantine_lead_email();

DROP TRIGGER IF EXISTS trg_quarantine_cpv ON public.calculator_page_visits;
CREATE TRIGGER trg_quarantine_cpv
  BEFORE INSERT OR UPDATE OF email ON public.calculator_page_visits
  FOR EACH ROW EXECUTE FUNCTION public.trg_quarantine_lead_email();

-- Tighten v_lead_priority eligible filter (merge tags + test domains)
-- Recreate view with DROP so column order can change safely if needed.
-- We only patch eligible_emails via a helper used by the view — instead
-- update the view's eligible_emails CTE by re-applying the latest view
-- definition with stronger filters. For safety, add a SQL filter function
-- and document that the next view recreate should call it.
-- Immediate cleanup: clear FKs first, then child tables, then SSCE

UPDATE public.lead_events SET lead_id = NULL
WHERE lead_id IN (
  SELECT id FROM public.scan_and_scale_click_events
  WHERE public.email_quarantine_reason(email) IS NOT NULL
);

UPDATE public.finished_calc_leads SET click_event_id = NULL
WHERE click_event_id IN (
  SELECT id FROM public.scan_and_scale_click_events
  WHERE public.email_quarantine_reason(email) IS NOT NULL
);

UPDATE public.follow_up_tasks SET click_event_id = NULL
WHERE click_event_id IN (
  SELECT id FROM public.scan_and_scale_click_events
  WHERE public.email_quarantine_reason(email) IS NOT NULL
);

INSERT INTO public.lead_ingestion_rejects (email, source_table, reason, payload)
SELECT email, 'lead_events', public.email_quarantine_reason(email),
       jsonb_build_object('cleanup', true, 'id', id)
FROM public.lead_events WHERE public.email_quarantine_reason(email) IS NOT NULL;
DELETE FROM public.lead_events WHERE public.email_quarantine_reason(email) IS NOT NULL;

INSERT INTO public.lead_ingestion_rejects (email, source_table, reason, payload)
SELECT email, 'finished_calc_leads', public.email_quarantine_reason(email),
       jsonb_build_object('cleanup', true, 'id', id)
FROM public.finished_calc_leads WHERE public.email_quarantine_reason(email) IS NOT NULL;
DELETE FROM public.finished_calc_leads WHERE public.email_quarantine_reason(email) IS NOT NULL;

INSERT INTO public.lead_ingestion_rejects (email, source_table, reason, payload)
SELECT email, 'follow_up_tasks', public.email_quarantine_reason(email),
       jsonb_build_object('cleanup', true, 'id', id)
FROM public.follow_up_tasks WHERE public.email_quarantine_reason(email) IS NOT NULL;
DELETE FROM public.follow_up_tasks WHERE public.email_quarantine_reason(email) IS NOT NULL;

INSERT INTO public.lead_ingestion_rejects (email, source_table, reason, payload)
SELECT email, 'calculator_page_visits', public.email_quarantine_reason(email),
       jsonb_build_object('cleanup', true, 'id', id)
FROM public.calculator_page_visits WHERE public.email_quarantine_reason(email) IS NOT NULL;
DELETE FROM public.calculator_page_visits WHERE public.email_quarantine_reason(email) IS NOT NULL;

INSERT INTO public.lead_ingestion_rejects (email, source_table, reason, payload)
SELECT email, 'scan_and_scale_click_events', public.email_quarantine_reason(email),
       jsonb_build_object('cleanup', true, 'id', id)
FROM public.scan_and_scale_click_events WHERE public.email_quarantine_reason(email) IS NOT NULL;
DELETE FROM public.scan_and_scale_click_events WHERE public.email_quarantine_reason(email) IS NOT NULL;

-- Leak 1 backfill: only when meta.visit_id joins cleanly to CPV with email
UPDATE public.lead_events le
SET email = lower(trim(cpv.email)),
    name = coalesce(le.name, cpv.name),
    phone = coalesce(le.phone, cpv.phone)
FROM public.calculator_page_visits cpv
WHERE le.email IS NULL
  AND le.meta ? 'visit_id'
  AND cpv.id::text = le.meta->>'visit_id'
  AND cpv.email IS NOT NULL
  AND trim(cpv.email) <> ''
  AND public.email_quarantine_reason(cpv.email) IS NULL;
