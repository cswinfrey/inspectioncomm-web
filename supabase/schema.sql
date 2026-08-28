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

-- Security audit finding (2026-08-28): the previous single `for all` policy
-- here let any inspector edit OR DELETE their own inspection via a direct
-- REST call no matter its status — the "completed inspections are locked
-- except for managers" rule (checkInspectionEditPermission in
-- app/inspector/inspections/actions.ts) was only enforced in the Next.js
-- server action, not the database, so it was trivially bypassable by
-- calling PostgREST directly with a valid inspector session. Replaced below
-- (after current_inspector_active() is defined, which the replacements
-- depend on) with narrower select/insert/update policies — see that block
-- for the full explanation. No DELETE policy at all for inspectors: nothing
-- in the app deletes an inspection, and a completed report should never be
-- unilaterally erasable by the inspector who wrote it. Same reasoning
-- applies to inspection_media below.
drop policy if exists "Inspectors manage own inspections" on public.inspections;
drop policy if exists "Inspectors manage own inspection media" on public.inspection_media;

-- Discovered via pg_policies introspection while verifying the fix above:
-- three more legacy policies on public.inspections, left over from the
-- original property-inspection product this Supabase project predates (see
-- the big comment near the top of this file) and never removed when this
-- schema.sql became the source of truth. Postgres OR's multiple permissive
-- policies for the same command together, so
-- "Inspectors can view own inspections" — an unconditional
-- `inspector_id = auth.uid()` SELECT with no current_inspector_active()
-- check — silently granted a deactivated inspector read access the whole
-- time regardless of the replacement policy above. "...can insert own
-- inspections" has the same gap for INSERT. "Customers can view their
-- property inspections" is inert dead weight (this app has no customer
-- login accounts, so customer_id = auth.uid() can never match) but is
-- confusing to leave in place.
drop policy if exists "Inspectors can view own inspections" on public.inspections;
drop policy if exists "Inspectors can insert own inspections" on public.inspections;
drop policy if exists "Customers can view their property inspections" on public.inspections;

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
--
-- Security audit finding (2026-08-28): deactivating an inspector
-- (deactivateInspector in app/inspector/manager/actions.ts) bans them in
-- Supabase Auth and sets is_active = false, but banning doesn't revoke an
-- already-issued access token — it only blocks future logins/refreshes.
-- Nothing previously checked is_active at the data layer, so a deactivated
-- inspector kept full read/write access to their own data (and, if they
-- were a manager, everyone's) until their token happened to expire. Folding
-- `and is_active` into is_manager(), plus the new
-- current_inspector_active() below used by the owner-scoped policies, makes
-- deactivation take effect on the next request regardless of token
-- lifetime, since RLS re-evaluates this against live table state every
-- query rather than trusting anything cached in the JWT.
create or replace function public.is_manager()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.inspectors
    where id = auth.uid() and role = 'manager' and is_active
  );
$$;

create or replace function public.current_inspector_active()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.inspectors
    where id = auth.uid() and is_active
  );
$$;

-- Replacements for "Inspectors manage own inspections" / "...inspection
-- media" (dropped above) — see the security audit comment there for why
-- the single `for all` policy was unsafe. Inspectors can always read/create
-- their own rows, but can only UPDATE an inspection (or its media) while
-- `status = 'in_progress'`: the `using` clause checks the OLD row, so this
-- blocks further edits the instant status flips to 'completed' — flipping
-- it in the first place is still allowed since `with check` doesn't
-- re-require in_progress. Uploading new media isn't status-gated (the app
-- has never restricted that), only editing an existing item's tag. All of
-- select/insert/update additionally require current_inspector_active(), so
-- a deactivated inspector's access disappears on their very next request
-- rather than waiting for their token to expire.
drop policy if exists "Inspectors select own inspections" on public.inspections;
create policy "Inspectors select own inspections"
  on public.inspections for select
  to authenticated
  using (inspector_id = auth.uid() and public.current_inspector_active());

drop policy if exists "Inspectors insert own inspections" on public.inspections;
create policy "Inspectors insert own inspections"
  on public.inspections for insert
  to authenticated
  with check (inspector_id = auth.uid() and public.current_inspector_active());

drop policy if exists "Inspectors update own in-progress inspections" on public.inspections;
create policy "Inspectors update own in-progress inspections"
  on public.inspections for update
  to authenticated
  using (inspector_id = auth.uid() and status = 'in_progress' and public.current_inspector_active())
  with check (inspector_id = auth.uid());

drop policy if exists "Inspectors select own inspection media" on public.inspection_media;
create policy "Inspectors select own inspection media"
  on public.inspection_media for select
  to authenticated
  using (
    public.current_inspector_active()
    and exists (
      select 1 from public.inspections
      where inspections.id = inspection_media.inspection_id
        and inspections.inspector_id = auth.uid()
    )
  );

drop policy if exists "Inspectors insert own inspection media" on public.inspection_media;
create policy "Inspectors insert own inspection media"
  on public.inspection_media for insert
  to authenticated
  with check (
    public.current_inspector_active()
    and exists (
      select 1 from public.inspections
      where inspections.id = inspection_media.inspection_id
        and inspections.inspector_id = auth.uid()
    )
  );

drop policy if exists "Inspectors update own in-progress inspection media" on public.inspection_media;
create policy "Inspectors update own in-progress inspection media"
  on public.inspection_media for update
  to authenticated
  using (
    public.current_inspector_active()
    and exists (
      select 1 from public.inspections
      where inspections.id = inspection_media.inspection_id
        and inspections.inspector_id = auth.uid()
        and inspections.status = 'in_progress'
    )
  )
  with check (
    exists (
      select 1 from public.inspections
      where inspections.id = inspection_media.inspection_id
        and inspections.inspector_id = auth.uid()
    )
  );

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

-- Customer report access: no customer accounts/login. Each inspection gets
-- an unguessable token; possession of the link (inspectioncomm.com/report/
-- <token>) is the access control, not RLS. Deliberately no RLS policy grants
-- anon SELECT on inspections — that would let anyone enumerate every
-- inspection regardless of token. Instead app/report/[token]/page.tsx reads
-- via the service-role admin client (lib/supabase/admin.ts), filtered by an
-- exact token match server-side.
alter table public.inspections
  add column if not exists access_token uuid not null default gen_random_uuid();

do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public' and table_name = 'inspections'
      and constraint_name = 'inspections_access_token_key'
  ) then
    alter table public.inspections
      add constraint inspections_access_token_key unique (access_token);
  end if;
end $$;

-- Detailed vehicle checklist. A handful of identity/reading fields get real
-- columns (worth filtering/searching on later); everything else that's a
-- repeated "X condition" shape lives in one JSONB checklist column so new
-- checklist items don't need a migration each time. Shape (documented here,
-- not enforced by the DB — see app/inspector/inspections/checklist.ts):
--   tires: { size, condition, tread }
--   paint: { condition }
--   transmission: { type, condition }
--   suspension_steering: { condition }
--   power_steering: { type, condition }
--   brake_fluid: { level, condition }
--   fluid_leaks: { condition, notes }
--   ac_heat: { condition }
--   interior_electronics: { radio, heated_cooled_seats, sunroof, rear_tailgate }
--   obd_scan: { ecm, tcm, abs, srs, awd_4wd }
alter table public.inspections
  add column if not exists vehicle_color text,
  add column if not exists license_plate text,
  add column if not exists license_plate_state text,
  add column if not exists engine_size text,
  add column if not exists engine_cylinders integer,
  add column if not exists odometer_before integer,
  add column if not exists odometer_after integer,
  add column if not exists checklist jsonb not null default '{}'::jsonb;

-- Managers can edit any inspection (e.g. correcting a completed one) —
-- previously they only had SELECT. Inspectors editing their own completed
-- inspections is blocked at the application layer (see setInspectionStatus/
-- updateInspectionChecklist in app/inspector/inspections/actions.ts), not
-- here — RLS can't cleanly express "locked except for the status columns"
-- without listing every column, so that rule lives in the server action.
drop policy if exists "Managers manage all inspections" on public.inspections;
create policy "Managers manage all inspections"
  on public.inspections for update
  to authenticated
  using (public.is_manager())
  with check (public.is_manager());

-- Inspector's overall diagnosis/summary, edited via the checklist form
-- alongside the existing `notes` column (same edit/lock rules as the rest
-- of the checklist).
alter table public.inspections
  add column if not exists synopsis text;

-- Lets a bulk photo upload tag every file in the batch with which checklist
-- item it documents (e.g. "Tires", "Engine") — see MEDIA_TAG_SUGGESTIONS in
-- lib/inspection-checklist.ts. Free text, not a fixed enum. Editable per
-- photo after upload too (e.g. "Tires" -> "Left front tire") via
-- updateMediaTag in app/inspector/inspections/media-actions.ts.
alter table public.inspection_media
  add column if not exists tag text;

-- Managers can edit any inspection's media (e.g. relabeling a photo on a
-- completed inspection) — previously they only had SELECT.
drop policy if exists "Managers manage all inspection media" on public.inspection_media;
create policy "Managers manage all inspection media"
  on public.inspection_media for update
  to authenticated
  using (public.is_manager())
  with check (public.is_manager());

-- Public "request an inspection" lead form on the homepage. No customer
-- accounts — anon can only INSERT (submit a lead), never read back other
-- people's submissions. The inspector team is a shared roster (like
-- customers), so any authenticated inspector can view/triage/update every
-- request, same as the customers table.
create table if not exists public.inspection_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  vehicle_type text not null,
  vehicle_year integer,
  vehicle_make text,
  vehicle_model text,
  location text,
  notes text,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.inspection_requests enable row level security;

do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public' and table_name = 'inspection_requests'
      and constraint_name = 'inspection_requests_status_check'
  ) then
    alter table public.inspection_requests
      add constraint inspection_requests_status_check
      check (status in ('new', 'contacted', 'scheduled', 'closed'));
  end if;
end $$;

drop policy if exists "Allow anonymous inspection requests" on public.inspection_requests;
create policy "Allow anonymous inspection requests"
  on public.inspection_requests
  for insert
  to anon
  with check (true);

drop policy if exists "Inspectors manage inspection requests" on public.inspection_requests;
create policy "Inspectors manage inspection requests"
  on public.inspection_requests for all
  to authenticated
  using (true)
  with check (true);

-- Fuel type: a core identity field like vehicle_color, not a JSONB
-- checklist item — one of Gas/Diesel/Electric, or free text when the
-- inspector picks "Other" (see FUEL_TYPE_OPTIONS in lib/inspection-checklist.ts).
alter table public.inspections
  add column if not exists fuel_type text;
