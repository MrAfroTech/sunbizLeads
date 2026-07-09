-- Agents (who owns a lead) + default assignment for new leads

create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  created_at timestamptz not null default now()
);

-- Default agent — change email in SQL if needed (must match your team)
insert into public.agents (name, email)
values ('Rohan', 'rohan@fletcherip.com')
on conflict (email) do update set name = excluded.name;

alter table public.leads add column if not exists assigned_agent_id uuid references public.agents(id);

create index if not exists leads_assigned_agent_id_idx on public.leads (assigned_agent_id);

update public.leads
set assigned_agent_id = (select id from public.agents order by created_at asc limit 1)
where assigned_agent_id is null;

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
