-- Chaos Mastery landing workbook — run in Supabase SQL Editor for project smqwemfobrqxnpcooigd
-- Owner key disambiguates authenticated vs guest rows for a single UNIQUE constraint.

CREATE TABLE IF NOT EXISTS public.chaos_mastery_workbook (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE,
  guest_token text,
  owner_key text NOT NULL DEFAULT '',
  chapter integer NOT NULL CHECK (chapter >= 1 AND chapter <= 21),
  field_id text NOT NULL CHECK (char_length(field_id) <= 200),
  field_value text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chaos_mastery_workbook_identity CHECK (
    (user_id IS NOT NULL AND guest_token IS NULL)
    OR (user_id IS NULL AND guest_token IS NOT NULL)
  )
);

ALTER TABLE public.chaos_mastery_workbook
  DROP CONSTRAINT IF EXISTS chaos_mastery_workbook_owner_ch_field_uq;
ALTER TABLE public.chaos_mastery_workbook
  ADD CONSTRAINT chaos_mastery_workbook_owner_ch_field_uq UNIQUE (owner_key, chapter, field_id);

CREATE INDEX IF NOT EXISTS chaos_mastery_workbook_user_ch_idx
  ON public.chaos_mastery_workbook (user_id, chapter)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS chaos_mastery_workbook_guest_ch_idx
  ON public.chaos_mastery_workbook (guest_token, chapter)
  WHERE guest_token IS NOT NULL;

CREATE OR REPLACE FUNCTION public.chaos_mastery_workbook_set_owner_key()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND NEW.guest_token IS NULL THEN
    NEW.owner_key := 'u:' || NEW.user_id::text;
  ELSIF NEW.user_id IS NULL AND NEW.guest_token IS NOT NULL THEN
    NEW.owner_key := 'g:' || NEW.guest_token;
  ELSE
    RAISE EXCEPTION 'invalid workbook identity';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS chaos_mastery_workbook_owner_trg ON public.chaos_mastery_workbook;
CREATE TRIGGER chaos_mastery_workbook_owner_trg
  BEFORE INSERT OR UPDATE OF user_id, guest_token ON public.chaos_mastery_workbook
  FOR EACH ROW
  EXECUTE FUNCTION public.chaos_mastery_workbook_set_owner_key();

ALTER TABLE public.chaos_mastery_workbook ENABLE ROW LEVEL SECURITY;

CREATE POLICY chaos_mastery_workbook_select_own
  ON public.chaos_mastery_workbook FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY chaos_mastery_workbook_insert_own
  ON public.chaos_mastery_workbook FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY chaos_mastery_workbook_update_own
  ON public.chaos_mastery_workbook FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY chaos_mastery_workbook_delete_own
  ON public.chaos_mastery_workbook FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Guests cannot use the table directly; use SECURITY DEFINER RPCs below.

CREATE OR REPLACE FUNCTION public.cm_guest_workbook_select(p_guest_token text, p_chapter integer)
RETURNS TABLE (field_id text, field_value text, updated_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT w.field_id, w.field_value, w.updated_at
  FROM public.chaos_mastery_workbook w
  WHERE w.user_id IS NULL
    AND w.guest_token = p_guest_token
    AND w.chapter = p_chapter
    AND p_chapter BETWEEN 1 AND 21
    AND p_guest_token IS NOT NULL
    AND p_guest_token ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
$$;

CREATE OR REPLACE FUNCTION public.cm_guest_workbook_upsert(
  p_guest_token text,
  p_chapter integer,
  p_field_id text,
  p_field_value text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_chapter IS NULL OR p_chapter < 1 OR p_chapter > 21 THEN
    RAISE EXCEPTION 'invalid chapter';
  END IF;
  IF p_field_id IS NULL OR char_length(p_field_id) > 200 THEN
    RAISE EXCEPTION 'invalid field_id';
  END IF;
  IF p_guest_token IS NULL
     OR NOT (p_guest_token ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$') THEN
    RAISE EXCEPTION 'invalid guest token';
  END IF;

  INSERT INTO public.chaos_mastery_workbook (user_id, guest_token, chapter, field_id, field_value)
  VALUES (NULL, p_guest_token, p_chapter, p_field_id, p_field_value)
  ON CONFLICT ON CONSTRAINT chaos_mastery_workbook_owner_ch_field_uq
  DO UPDATE SET
    field_value = EXCLUDED.field_value,
    updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.cm_guest_workbook_select(text, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.cm_guest_workbook_upsert(text, integer, text, text) TO anon;
