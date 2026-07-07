-- KeyaTree floorplan persistence schema
-- Run this once in the Supabase SQL Editor.

create table if not exists public.floorplans (
  id uuid primary key default gen_random_uuid(),
  property_id text not null unique,
  property_name text not null default '',
  data jsonb not null default '{}'::jsonb,
  thumbnail text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.floorplan_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rooms jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Enable RLS. Server access uses the service_role key which bypasses RLS,
-- so no public policies are added (anon/public clients are blocked).
alter table public.floorplans enable row level security;
alter table public.floorplan_templates enable row level security;
