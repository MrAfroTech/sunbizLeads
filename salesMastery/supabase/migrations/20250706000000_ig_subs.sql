-- Instagram / Chaos Mastery newsletter welcome modal subscriptions
-- Project: smqwemfobrqxnpcooigd

CREATE TABLE IF NOT EXISTS public.ig_subs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  email text NOT NULL,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'instagram',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ig_subs_email_lower
  ON public.ig_subs ((lower(email)));

CREATE INDEX IF NOT EXISTS idx_ig_subs_created_at
  ON public.ig_subs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ig_subs_source
  ON public.ig_subs (source);

ALTER TABLE public.ig_subs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_ig_subs" ON public.ig_subs;
CREATE POLICY "anon_select_ig_subs"
  ON public.ig_subs FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon_update_ig_subs" ON public.ig_subs;
CREATE POLICY "anon_update_ig_subs"
  ON public.ig_subs FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_insert_ig_subs" ON public.ig_subs;
CREATE POLICY "anon_insert_ig_subs"
  ON public.ig_subs FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "service_all_ig_subs" ON public.ig_subs;
CREATE POLICY "service_all_ig_subs"
  ON public.ig_subs FOR ALL TO service_role USING (true);

GRANT SELECT, INSERT, UPDATE ON TABLE public.ig_subs TO anon;

COMMENT ON TABLE public.ig_subs IS
  'Newsletter welcome modal signups (Chaos Mastery / Instagram). One row per email.';
