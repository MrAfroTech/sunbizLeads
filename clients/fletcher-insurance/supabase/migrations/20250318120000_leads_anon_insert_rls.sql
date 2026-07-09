-- Allow the public intake form (Supabase anon / publishable key) to insert rows into public.leads.
-- The API continues to use the service role and bypasses RLS.

alter table public.leads enable row level security;

drop policy if exists "Public intake can insert leads" on public.leads;

create policy "Public intake can insert leads"
  on public.leads
  for insert
  to anon, authenticated
  with check (true);

-- Anon SELECT for the browser dashboard is added in 20250318160000_dashboard_anon_select_rls.sql.
