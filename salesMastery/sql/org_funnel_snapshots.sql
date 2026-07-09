-- Org funnel daily snapshots — salesMastery Supabase (smqwemfobrqxnpcooigd)
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New query).

create table if not exists public.org_funnel_snapshots (
  id uuid default gen_random_uuid() primary key,
  snapshot_date date not null,
  domain text,
  company_name text,
  unique_emails integer,
  visit_count integer,
  has_phone boolean,
  phone_provided_count integer,
  completed_calculator boolean,
  clicked_cta boolean,
  reached_email_sequence boolean,
  multi_person boolean,
  funnel_score integer,
  priority_tier text,
  last_seen timestamptz,
  created_at timestamptz default now()
);

alter table public.org_funnel_snapshots enable row level security;

create policy "service_role_full_access_org_funnel_snapshots"
  on public.org_funnel_snapshots
  for all
  to service_role
  using (true)
  with check (true);

comment on table public.org_funnel_snapshots is
  'Daily point-in-time copy of org_funnel_scores for trend reporting.';
