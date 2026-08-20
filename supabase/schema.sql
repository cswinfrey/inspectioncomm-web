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

-- Core product schema (vehicle inspections, not property inspections).
-- RLS is enabled on all four tables below but no policies are attached yet:
-- access rules depend on the inspector/customer auth model built in Week 3-4
-- (e.g. an inspector should only see their own inspections). Until those
-- policies exist, these tables are readable/writable only via the Supabase
-- service role (dashboard, SQL editor, or a trusted server context) — not
-- through the public anon key.

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.customers enable row level security;

-- One row per inspector, keyed to their Supabase Auth user.
create table if not exists public.inspectors (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.inspectors enable row level security;

create table if not exists public.inspections (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers (id) on delete set null,
  inspector_id uuid references public.inspectors (id) on delete set null,
  vehicle_vin text,
  vehicle_year integer,
  vehicle_make text,
  vehicle_model text,
  vehicle_mileage integer,
  inspection_date date not null default current_date,
  inspection_type text not null default 'pre-purchase',
  notes text,
  created_at timestamptz not null default now()
);

alter table public.inspections enable row level security;

create table if not exists public.inspection_media (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.inspections (id) on delete cascade,
  file_url text not null,
  file_type text not null,
  uploaded_at timestamptz not null default now()
);

alter table public.inspection_media enable row level security;
