-- When RLS is DISABLED: anon still needs privileges on public.leads for the browser dashboard.

grant usage on schema public to anon, authenticated;

grant select on table public.leads to anon, authenticated;
