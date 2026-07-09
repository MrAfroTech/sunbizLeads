-- Store Typeform tier/score/payload on public.leads (no separate lead_responses table).

do $$
begin
  if not exists (select 1 from pg_type where typname = 'urgency_tier') then
    create type public.urgency_tier as enum ('TIER_1_HIGH', 'TIER_2_MEDIUM', 'TIER_3_LOW');
  end if;
end$$;

alter table public.leads add column if not exists budget integer;
alter table public.leads add column if not exists purchase_timeline text;
alter table public.leads add column if not exists urgency_tier public.urgency_tier;
alter table public.leads add column if not exists lead_score integer;
alter table public.leads add column if not exists lead_category text;
alter table public.leads add column if not exists raw_typeform jsonb;
alter table public.leads add column if not exists typeform_token text;
alter table public.leads add column if not exists form_submitted_at timestamptz;

create unique index if not exists leads_typeform_token_uidx
  on public.leads (typeform_token)
  where typeform_token is not null;

create index if not exists leads_urgency_tier_idx on public.leads (urgency_tier);
create index if not exists leads_form_submitted_at_idx on public.leads (form_submitted_at desc nulls last);

-- If you previously created public.lead_responses, you can drop it after backfilling into leads:
-- drop table if exists public.lead_responses cascade;
