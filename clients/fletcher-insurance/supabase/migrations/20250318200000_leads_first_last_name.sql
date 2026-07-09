-- Prefer first_name + last_name; drop legacy full_name if present.

alter table public.leads add column if not exists first_name text;
alter table public.leads add column if not exists last_name text;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'leads' and column_name = 'full_name'
  ) then
    update public.leads
    set first_name = full_name
    where first_name is null and full_name is not null;
  end if;
end $$;

update public.leads set first_name = 'Unknown' where first_name is null or trim(first_name) = '';
update public.leads set last_name = coalesce(nullif(trim(last_name), ''), 'Lead');

alter table public.leads drop column if exists full_name;
