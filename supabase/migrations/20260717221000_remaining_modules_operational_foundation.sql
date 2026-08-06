create table if not exists public.operational_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  module_slug text not null check (module_slug in (
    'purchasing-expenses','inventory-warehouse','customers-suppliers','security-approvals-audit',
    'reports-analytics','localization-compliance','human-resources-payroll','fixed-assets',
    'budgeting-projects','integrations-automation'
  )),
  record_type text not null check (char_length(record_type) between 2 and 80),
  record_number text not null,
  title text not null check (char_length(title) between 2 and 180),
  description text,
  counterparty text,
  owner_name text,
  status text not null default 'draft' check (char_length(status) between 2 and 40),
  priority text not null default 'normal' check (priority in ('low','normal','high','critical')),
  amount numeric(18,2) not null default 0 check (amount >= 0),
  due_date date,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, record_number)
);

create table if not exists public.operational_record_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  record_id uuid not null references public.operational_records(id) on delete cascade,
  event_type text not null check (char_length(event_type) between 2 and 60),
  previous_status text,
  new_status text,
  message text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists operational_records_org_module_updated_idx on public.operational_records(organization_id,module_slug,updated_at desc);
create index if not exists operational_records_org_module_status_idx on public.operational_records(organization_id,module_slug,status);
create index if not exists operational_records_branch_idx on public.operational_records(branch_id);
create index if not exists operational_records_created_by_idx on public.operational_records(created_by);
create index if not exists operational_record_events_record_time_idx on public.operational_record_events(record_id,created_at desc);
create index if not exists operational_record_events_org_time_idx on public.operational_record_events(organization_id,created_at desc);
create index if not exists operational_record_events_created_by_idx on public.operational_record_events(created_by);

alter table public.operational_records enable row level security;
alter table public.operational_record_events enable row level security;

drop policy if exists operational_records_select on public.operational_records;
create policy operational_records_select on public.operational_records for select to authenticated
using (public.is_org_member(organization_id));

drop policy if exists operational_record_events_select on public.operational_record_events;
create policy operational_record_events_select on public.operational_record_events for select to authenticated
using (public.is_org_member(organization_id));

revoke all on public.operational_records from anon;
revoke all on public.operational_record_events from anon;
grant select on public.operational_records to authenticated;
grant select on public.operational_record_events to authenticated;
