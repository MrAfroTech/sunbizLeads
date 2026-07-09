-- Scan & Scale funnel automation — schema additions
-- Apply with: Supabase Dashboard SQL editor, or merge into repo supabase migrations.

-- ---------------------------------------------------------------------------
-- 1. scan_and_scale_click_events — funnel columns
-- ---------------------------------------------------------------------------
ALTER TABLE public.scan_and_scale_click_events
  ADD COLUMN IF NOT EXISTS funnel_stage text NOT NULL DEFAULT 'new_lead';

ALTER TABLE public.scan_and_scale_click_events
  ADD COLUMN IF NOT EXISTS emails_sent integer NOT NULL DEFAULT 0;

ALTER TABLE public.scan_and_scale_click_events
  ADD COLUMN IF NOT EXISTS call_task_created boolean NOT NULL DEFAULT false;

ALTER TABLE public.scan_and_scale_click_events
  ADD COLUMN IF NOT EXISTS notification_sent boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.scan_and_scale_click_events.funnel_stage IS
  'Funnel progression for Scan & Scale email automation.';
COMMENT ON COLUMN public.scan_and_scale_click_events.emails_sent IS
  'Count of sequence emails delivered (1–4).';
COMMENT ON COLUMN public.scan_and_scale_click_events.call_task_created IS
  'True after a follow_up_tasks call row was created for this click event.';
COMMENT ON COLUMN public.scan_and_scale_click_events.notification_sent IS
  'True after the owner notification email was sent via Brevo.';

CREATE INDEX IF NOT EXISTS idx_scan_and_scale_click_events_funnel_followup
  ON public.scan_and_scale_click_events (emails_sent, created_at ASC)
  WHERE emails_sent < 4;

-- ---------------------------------------------------------------------------
-- 2. follow_up_tasks
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.follow_up_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid (),
  click_event_id uuid REFERENCES public.scan_and_scale_click_events (id),
  email text NOT NULL,
  name text,
  phone text,
  company text,
  task_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now (),
  updated_at timestamptz NOT NULL DEFAULT now (),
  CONSTRAINT follow_up_tasks_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE public.follow_up_tasks IS
  'Internal call tasks driven by Scan & Scale funnel automation.';

ALTER TABLE public.follow_up_tasks ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.set_follow_up_tasks_updated_at ()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $$
BEGIN
  NEW.updated_at = now ();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_follow_up_tasks_set_updated_at ON public.follow_up_tasks;

CREATE TRIGGER tr_follow_up_tasks_set_updated_at
  BEFORE UPDATE ON public.follow_up_tasks
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_follow_up_tasks_updated_at ();

CREATE INDEX IF NOT EXISTS idx_follow_up_tasks_click_event_id
  ON public.follow_up_tasks (click_event_id);

CREATE INDEX IF NOT EXISTS idx_follow_up_tasks_status
  ON public.follow_up_tasks (status);
