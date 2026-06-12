create extension if not exists "pgcrypto";

create table if not exists public.goal_navigator_records (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  kind text not null check (kind in ('quantitative', 'qualitative')),
  employee_id text not null,
  employee_name text not null,
  department text not null default '',
  title text not null,
  status text not null check (status in ('draft', 'submitted', 'approved')),
  answers jsonb not null default '{}'::jsonb,
  submitted_at timestamptz null,
  approved_at timestamptz null,
  approved_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_goal_navigator_records_employee_id
  on public.goal_navigator_records(employee_id);

create index if not exists idx_goal_navigator_records_owner_id
  on public.goal_navigator_records(owner_id);

create index if not exists idx_goal_navigator_records_kind
  on public.goal_navigator_records(kind);

create index if not exists idx_goal_navigator_records_status
  on public.goal_navigator_records(status);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  operation text not null check (operation in ('create', 'update', 'approve')),
  actor_id text null,
  actor_name text null,
  before_data jsonb null,
  after_data jsonb null,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_entity
  on public.audit_logs(entity_type, entity_id, created_at desc);

create or replace function public.set_updated_at_goal_navigator_records()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_goal_navigator_records_updated_at on public.goal_navigator_records;
create trigger trg_goal_navigator_records_updated_at
before update on public.goal_navigator_records
for each row
execute function public.set_updated_at_goal_navigator_records();