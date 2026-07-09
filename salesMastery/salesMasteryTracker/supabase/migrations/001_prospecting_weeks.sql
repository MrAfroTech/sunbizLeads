-- Prospecting form data: one row per week (week_key = YYYY-MM-W#).
-- Supabase project id: vtpydjccfxrwlanabpwd
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).

create table if not exists public.prospecting_weeks (
  week_key text primary key,

  -- Section 1: LinkedIn
  s1_date text,
  s1_requests text,
  s1_accepted text,
  s1_responses text,
  s1_contact text,
  s1_demos text,
  s1_sales text,
  s1_rating text,
  s1_journal text,

  -- Section 2: Cold Calls
  s2_calls text,
  s2_answered text,
  s2_positive text,
  s2_demos text,
  s2_sales text,
  s2_rating text,
  s2_journal text,

  -- Section 3: Walk-Ins
  s3_walkins text,
  s3_convos text,
  s3_contact text,
  s3_demos text,
  s3_sales text,
  s3_rating text,
  s3_journal text,

  -- Section 4: Networking
  s4_weekof text,
  s4_events text,
  s4_contacts text,
  s4_followups text,
  s4_demos text,
  s4_sales text,
  s4_rating text,
  s4_journal text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Optional: RLS (allow anon read/write for this table; tighten in production)
alter table public.prospecting_weeks enable row level security;

create policy "Allow anon read/write prospecting_weeks"
  on public.prospecting_weeks
  for all
  to anon
  using (true)
  with check (true);

-- Trigger to refresh updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists prospecting_weeks_updated_at on public.prospecting_weeks;
create trigger prospecting_weeks_updated_at
  before update on public.prospecting_weeks
  for each row execute function public.set_updated_at();
