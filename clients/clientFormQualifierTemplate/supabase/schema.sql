-- Fletcher Inssurance - Lead Urgency Scoring schema

create extension if not exists "pgcrypto";

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text,
  sms text,
  created_at timestamptz not null default now()
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_email_idx on public.leads (email);
create index if not exists leads_sms_idx on public.leads (sms);

do $$
begin
  if not exists (select 1 from pg_type where typname = 'urgency_tier') then
    create type public.urgency_tier as enum ('TIER_1_HIGH', 'TIER_2_MEDIUM', 'TIER_3_LOW');
  end if;
end$$;

create table if not exists public.lead_responses (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  budget integer, -- monthly budget in USD
  purchase_timeline text,
  urgency_tier public.urgency_tier not null,
  submitted_at timestamptz not null default now(),
  raw_typeform jsonb
);

create index if not exists lead_responses_lead_id_idx on public.lead_responses (lead_id);
create index if not exists lead_responses_submitted_at_idx on public.lead_responses (submitted_at desc);

