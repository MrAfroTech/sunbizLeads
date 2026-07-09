-- Align public.leads with contact fields: full_name, phone, region, product_interest, source, updated_at.
-- Scores/tiers are stored on public.leads (see 20250318190000_typeform_columns_on_leads.sql).

alter table public.leads add column if not exists full_name text;
alter table public.leads add column if not exists phone text;
alter table public.leads add column if not exists region text;
alter table public.leads add column if not exists product_interest text;
alter table public.leads add column if not exists source text;
alter table public.leads add column if not exists updated_at timestamptz;

update public.leads
set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;

alter table public.leads
  alter column updated_at set default now();

-- Backfill from legacy columns when present
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'leads' and column_name = 'first_name'
  ) then
    update public.leads
    set full_name = trim(coalesce(first_name, '') || ' ' || coalesce(last_name, ''))
    where full_name is null;

    update public.leads set phone = sms where phone is null and sms is not null;

    update public.leads
    set full_name = 'Unknown Lead'
    where full_name is null or trim(full_name) = '';
  end if;
end $$;

alter table public.leads
  alter column updated_at set not null;

-- Remove legacy lead-level scoring / name columns (safe if already absent)
alter table public.leads drop column if exists first_name;
alter table public.leads drop column if exists last_name;
alter table public.leads drop column if exists sms;
alter table public.leads drop column if exists lead_score;
alter table public.leads drop column if exists lead_category;
alter table public.leads drop column if exists form_completed_at;

drop index if exists leads_sms_idx;
drop index if exists leads_lead_category_idx;
drop index if exists leads_form_completed_at_idx;

create index if not exists leads_phone_idx on public.leads using btree (phone);
