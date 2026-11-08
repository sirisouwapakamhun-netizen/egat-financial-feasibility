-- EGAT Feasibility Platform — Supabase schema
-- Run once in Supabase → SQL Editor on a new project.
-- Each signed-in user can only see and change their own rows (Row Level Security).

-- Client projects (one row per customer project)
create table if not exists public.client_projects (
  owner uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  product text not null check (product in ('solar', 'hybrid', 'battery')),
  name text not null check (char_length(name) between 1 and 80),
  scenario jsonb not null,
  position integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (owner, id)
);

-- Which product / project is selected in the workspace (one row per user)
create table if not exists public.workspace_settings (
  owner uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  selected text not null check (selected in ('solar', 'hybrid', 'battery')),
  active jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Keep updated_at current
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists client_projects_touch on public.client_projects;
create trigger client_projects_touch before update on public.client_projects
  for each row execute function public.touch_updated_at();

drop trigger if exists workspace_settings_touch on public.workspace_settings;
create trigger workspace_settings_touch before update on public.workspace_settings
  for each row execute function public.touch_updated_at();

-- Row Level Security: owners only
alter table public.client_projects enable row level security;
alter table public.workspace_settings enable row level security;

drop policy if exists "own projects" on public.client_projects;
create policy "own projects" on public.client_projects
  for all to authenticated
  using (owner = (select auth.uid()))
  with check (owner = (select auth.uid()));

drop policy if exists "own settings" on public.workspace_settings;
create policy "own settings" on public.workspace_settings
  for all to authenticated
  using (owner = (select auth.uid()))
  with check (owner = (select auth.uid()));

grant select, insert, update, delete on public.client_projects to authenticated;
grant select, insert, update, delete on public.workspace_settings to authenticated;
