-- Fletcher Insurance — single `leads` row holds contact + latest Typeform submission fields.

create extension if not exists "pgcrypto";

create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_type where typname = 'urgency_tier') then
    create type public.urgency_tier as enum ('TIER_1_HIGH', 'TIER_2_MEDIUM', 'TIER_3_LOW');
  end if;
end$$;

create table if not exists public.leads (
  id uuid not null default gen_random_uuid(),
  first_name text null,
  last_name text null,
  email text null,
  phone text null,
  region text null,
  product_interest text null,
  source text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  assigned_agent_id uuid null,
  -- Typeform / scoring (updated on each webhook submission)
  budget integer null,
  purchase_timeline text null,
  urgency_tier public.urgency_tier null,
  lead_score integer null,
  lead_category text null,
  raw_typeform jsonb null,
  typeform_token text null,
  form_submitted_at timestamptz null,
  constraint leads_pkey primary key (id),
  constraint leads_assigned_agent_id_fkey foreign key (assigned_agent_id) references public.agents (id)
);

create unique index if not exists leads_typeform_token_uidx
  on public.leads (typeform_token)
  where typeform_token is not null;

create index if not exists leads_email_idx on public.leads using btree (email);
create index if not exists leads_phone_idx on public.leads using btree (phone);
create index if not exists leads_created_at_idx on public.leads using btree (created_at desc);
create index if not exists leads_assigned_agent_id_idx on public.leads (assigned_agent_id);
create index if not exists leads_urgency_tier_idx on public.leads (urgency_tier);
create index if not exists leads_form_submitted_at_idx on public.leads (form_submitted_at desc nulls last);

insert into public.agents (name, email)
values ('Rohan', 'rohan@fletcherip.com')
on conflict (email) do nothing;

create or replace function public.leads_assign_default_agent()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.assigned_agent_id is null then
    select id into new.assigned_agent_id
    from public.agents
    order by created_at asc
    limit 1;
  end if;
  return new;
end;
$$;

drop trigger if exists leads_assign_default_agent on public.leads;
create trigger leads_assign_default_agent
  before insert on public.leads
  for each row
  execute procedure public.leads_assign_default_agent();
