CREATE TABLE IF NOT EXISTS public.setter_dispositions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  disposition   TEXT NOT NULL CHECK (
    disposition IN ('booked', 'not_interested', 'voicemail', 'no_answer')
  ),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.setter_dispositions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_all_setter_dispositions" ON public.setter_dispositions
  FOR ALL TO service_role USING (true);

CREATE POLICY "anon_select_setter_dispositions" ON public.setter_dispositions
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_insert_setter_dispositions" ON public.setter_dispositions
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_update_setter_dispositions" ON public.setter_dispositions
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON public.setter_dispositions TO anon;
