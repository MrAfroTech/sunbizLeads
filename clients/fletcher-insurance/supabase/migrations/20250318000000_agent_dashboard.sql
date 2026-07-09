-- Agent dashboard: life insurance score + category on leads and responses

alter table public.leads
  add column if not exists lead_score integer,
  add column if not exists lead_category text,
  add column if not exists form_completed_at timestamptz;

create index if not exists leads_lead_category_idx on public.leads (lead_category);
create index if not exists leads_form_completed_at_idx on public.leads (form_completed_at desc nulls last);

alter table public.lead_responses
  add column if not exists lead_score integer,
  add column if not exists lead_category text;
