-- Run in the Supabase SQL editor for this project.

create extension if not exists pgcrypto;

create table if not exists public.signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.signups enable row level security;

drop policy if exists "Allow anonymous signups" on public.signups;
create policy "Allow anonymous signups"
  on public.signups
  for insert
  to anon
  with check (true);

-- Core product schema. IMPORTANT: customers/inspectors/inspections/
-- inspection_media already existed in this Supabase project before this
-- file was first run — built separately, earlier, for a property-inspection
-- product (confirmed 0 rows in all of them on 2026-08-20, so no data is at
-- risk here). The `create table if not exists` calls below are therefore
-- no-ops against the real database; the statements that follow each one are
-- ALTERs that bring the existing tables in line with this app: add the
-- foreign keys that were never applied, migrate `inspections` from
-- `property_id` to vehicle fields, and drop the now-unused `properties`
-- table. This file is meant to be the source of truth going forward — keep
-- it in sync if columns are ever added by hand again.

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customers enable row level security;

-- One row per inspector, keyed to their Supabase Auth user.
create table if not exists public.inspectors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.inspectors enable row level security;

-- id must always equal the matching auth.users id (set explicitly by the
-- handle_new_inspector trigger below) — never self-generated.
alter table public.inspectors alter column id drop default;

do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public' and table_name = 'inspectors'
      and constraint_name = 'inspectors_id_fkey'
  ) then
    alter table public.inspectors
      add constraint inspectors_id_fkey
      foreign key (id) references auth.users (id) on delete cascade;
  end if;
end $$;

create table if not exists public.inspections (
  id uuid primary key default gen_random_uuid(),
  inspector_id uuid not null,
  customer_id uuid not null,
  inspection_type text not null,
  status text not null default 'in_progress',
  notes text,
  inspection_date date not null default current_date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_text tsvector
);

alter table public.inspections enable row level security;

-- Migrate from the pre-existing property-inspection shape to vehicles.
alter table public.inspections drop column if exists property_id;
alter table public.inspections
  add column if not exists vehicle_vin text,
  add column if not exists vehicle_year integer,
  add column if not exists vehicle_make text,
  add column if not exists vehicle_model text,
  add column if not exists vehicle_mileage integer;

drop table if exists public.properties;

do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public' and table_name = 'inspections'
      and constraint_name = 'inspections_inspector_id_fkey'
  ) then
    alter table public.inspections
      add constraint inspections_inspector_id_fkey
      foreign key (inspector_id) references public.inspectors (id);
  end if;

  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public' and table_name = 'inspections'
      and constraint_name = 'inspections_customer_id_fkey'
  ) then
    alter table public.inspections
      add constraint inspections_customer_id_fkey
      foreign key (customer_id) references public.customers (id);
  end if;
end $$;

create table if not exists public.inspection_media (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null,
  file_url text not null,
  file_type text not null,
  file_name text not null,
  file_size_bytes bigint,
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.inspection_media enable row level security;

do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public' and table_name = 'inspection_media'
      and constraint_name = 'inspection_media_inspection_id_fkey'
  ) then
    alter table public.inspection_media
      add constraint inspection_media_inspection_id_fkey
      foreign key (inspection_id) references public.inspections (id) on delete cascade;
  end if;
end $$;

-- Auth wiring: creates the matching public.inspectors row whenever someone
-- signs up via Supabase Auth (email/password). Reads the display name from
-- the signup form's options.data.name, set in app/inspector/actions.ts.
create or replace function public.handle_new_inspector()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.inspectors (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.email),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_inspector();

-- RLS policies, now that auth.uid() identifies a logged-in inspector.

drop policy if exists "Inspectors can view own profile" on public.inspectors;
create policy "Inspectors can view own profile"
  on public.inspectors for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "Inspectors can update own profile" on public.inspectors;
create policy "Inspectors can update own profile"
  on public.inspectors for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "Inspectors manage own inspections" on public.inspections;
create policy "Inspectors manage own inspections"
  on public.inspections for all
  to authenticated
  using (inspector_id = auth.uid())
  with check (inspector_id = auth.uid());

drop policy if exists "Inspectors manage own inspection media" on public.inspection_media;
create policy "Inspectors manage own inspection media"
  on public.inspection_media for all
  to authenticated
  using (
    exists (
      select 1 from public.inspections
      where inspections.id = inspection_media.inspection_id
        and inspections.inspector_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.inspections
      where inspections.id = inspection_media.inspection_id
        and inspections.inspector_id = auth.uid()
    )
  );

-- Customers are a shared roster across all inspectors (a small team booking
-- the same customers), not siloed per inspector.
drop policy if exists "Inspectors manage customers" on public.customers;
create policy "Inspectors manage customers"
  on public.customers for all
  to authenticated
  using (true)
  with check (true);

-- Manager role: read-only visibility across all inspectors' data. Promoting
-- someone to manager is a manual, deliberate action — run directly in the
-- SQL editor, e.g.:
--   update public.inspectors set role = 'manager' where email = '...';
alter table public.inspectors
  add column if not exists role text not null default 'inspector';

-- Roster management: managers add/deactivate inspectors (via the Admin API,
-- using the service_role key — never exposed to the client). New inspectors
-- must change their manager-set temp password before using the app.
alter table public.inspectors
  add column if not exists is_active boolean not null default true,
  add column if not exists must_change_password boolean not null default true;

-- "Inspectors can update own profile" below allows updating any column of
-- the caller's own row, including role/is_active — without this trigger, any
-- inspector could self-promote or reactivate themselves via a plain PATCH to
-- /rest/v1/inspectors. must_change_password is deliberately NOT guarded here
-- since inspectors need to clear it themselves after a password change.
-- auth.uid() is only non-null for requests going through PostgREST (i.e. the
-- app/API), so this leaves the SQL-editor promotion path above, and the
-- service_role-authenticated manager actions, untouched (auth.uid() is null
-- in both — no request JWT / RLS is bypassed entirely for service_role).
create or replace function public.prevent_self_role_change()
returns trigger
language plpgsql
as $$
begin
  if (new.role is distinct from old.role or new.is_active is distinct from old.is_active)
     and auth.uid() is not null then
    raise exception 'Changing role or active status is not permitted through this API.';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_inspector_role_change on public.inspectors;
create trigger prevent_inspector_role_change
  before update on public.inspectors
  for each row execute function public.prevent_self_role_change();

do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public' and table_name = 'inspectors'
      and constraint_name = 'inspectors_role_check'
  ) then
    alter table public.inspectors
      add constraint inspectors_role_check check (role in ('inspector', 'manager'));
  end if;
end $$;

-- security definer + a dedicated function (rather than an inline subquery in
-- each policy) avoids RLS recursion when this is used inside a policy on
-- public.inspectors itself.
create or replace function public.is_manager()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.inspectors
    where id = auth.uid() and role = 'manager'
  );
$$;

drop policy if exists "Managers view all inspectors" on public.inspectors;
create policy "Managers view all inspectors"
  on public.inspectors for select
  to authenticated
  using (public.is_manager());

drop policy if exists "Managers view all inspections" on public.inspections;
create policy "Managers view all inspections"
  on public.inspections for select
  to authenticated
  using (public.is_manager());

drop policy if exists "Managers view all inspection media" on public.inspection_media;
create policy "Managers view all inspection media"
  on public.inspection_media for select
  to authenticated
  using (public.is_manager());

-- Full-text search: keeps inspections.search_text (already existed from the
-- pre-existing schema) up to date from vehicle info, type, notes, and the
-- linked customer's name.
create or replace function public.update_inspection_search_text()
returns trigger
language plpgsql
as $$
declare
  customer_name text;
begin
  select name into customer_name from public.customers where id = new.customer_id;
  new.search_text := to_tsvector(
    'english',
    coalesce(new.vehicle_vin, '') || ' ' ||
    coalesce(new.vehicle_make, '') || ' ' ||
    coalesce(new.vehicle_model, '') || ' ' ||
    coalesce(new.vehicle_year::text, '') || ' ' ||
    coalesce(new.inspection_type, '') || ' ' ||
    coalesce(new.notes, '') || ' ' ||
    coalesce(customer_name, '')
  );
  return new;
end;
$$;

drop trigger if exists update_inspection_search_text_trigger on public.inspections;
create trigger update_inspection_search_text_trigger
  before insert or update on public.inspections
  for each row execute function public.update_inspection_search_text();

create index if not exists inspections_search_text_idx
  on public.inspections using gin (search_text);

-- One-time backfill so existing rows (inserted before the trigger existed)
-- get a search_text value too. Safe to re-run.
update public.inspections set updated_at = updated_at;
