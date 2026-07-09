-- Allow the browser dashboard (anon / publishable key) to read leads and responses.
-- Webhook continues to use the service role and bypasses RLS.

drop policy if exists "Dashboard anon can select leads" on public.leads;

create policy "Dashboard anon can select leads"
  on public.leads
  for select
  to anon, authenticated
  using (true);

alter table public.lead_responses enable row level security;

drop policy if exists "Dashboard anon can select lead_responses" on public.lead_responses;

create policy "Dashboard anon can select lead_responses"
  on public.lead_responses
  for select
  to anon, authenticated
  using (true);
