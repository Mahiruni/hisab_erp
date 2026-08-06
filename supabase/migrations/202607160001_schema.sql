-- Hisab ERP production foundation
-- Run in a new Supabase project. All exposed tables use RLS.

create extension if not exists pgcrypto;

create type public.app_role as enum ('owner','admin','accountant','sales','inventory','viewer');
create type public.journal_status as enum ('draft','posted','reversed');
create type public.invoice_status as enum ('draft','posted','partially_paid','paid','void');
create type public.stock_movement_type as enum ('opening','purchase','sale','adjustment_in','adjustment_out','transfer_in','transfer_out','return_in','return_out');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 160),
  tin text,
  vat_number text,
  phone text,
  base_currency char(3) not null default 'ETB',
  timezone text not null default 'Africa/Addis_Ababa',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  code text not null,
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  role public.app_role not null default 'viewer',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table public.document_counters (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  prefix text not null,
  current_value bigint not null default 0 check (current_value >= 0),
  primary key (organization_id, prefix)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  name text not null check (char_length(name) between 2 and 160),
  email text,
  phone text,
  tin text,
  credit_limit numeric(18,2) not null default 0 check (credit_limit >= 0),
  payment_terms_days integer not null default 0 check (payment_terms_days between 0 and 3650),
  is_active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index customers_org_tin_unique on public.customers(organization_id, tin) where tin is not null;
create index customers_org_name_idx on public.customers(organization_id, lower(name));

create table public.warehouses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  name text not null,
  code text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sku text not null,
  name text not null,
  unit text not null default 'unit',
  unit_price numeric(18,2) not null default 0 check (unit_price >= 0),
  cost_price numeric(18,2) not null default 0 check (cost_price >= 0),
  reorder_level numeric(18,3) not null default 0 check (reorder_level >= 0),
  is_active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, sku)
);

create table public.stock_balances (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  quantity numeric(18,3) not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default now(),
  primary key (organization_id, product_id, warehouse_id)
);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid not null references public.products(id),
  warehouse_id uuid not null references public.warehouses(id),
  movement_type public.stock_movement_type not null,
  quantity numeric(18,3) not null check (quantity > 0),
  reference text,
  source_type text,
  source_id uuid,
  actor_id uuid references auth.users(id),
  occurred_at timestamptz not null default now()
);
create index stock_movements_lookup_idx on public.stock_movements(organization_id, product_id, warehouse_id, occurred_at desc);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null,
  name text not null,
  account_type text not null check (account_type in ('asset','liability','equity','revenue','expense')),
  normal_side text not null check (normal_side in ('debit','credit')),
  is_system boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  entry_number text not null,
  entry_date date not null default current_date,
  memo text not null,
  status public.journal_status not null default 'draft',
  source_type text,
  source_id uuid,
  created_by uuid references auth.users(id),
  posted_by uuid references auth.users(id),
  posted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, entry_number)
);

create table public.journal_lines (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  journal_entry_id uuid not null references public.journal_entries(id) on delete cascade,
  account_id uuid not null references public.accounts(id),
  description text,
  debit numeric(18,2) not null default 0 check (debit >= 0),
  credit numeric(18,2) not null default 0 check (credit >= 0),
  created_at timestamptz not null default now(),
  check ((debit > 0 and credit = 0) or (credit > 0 and debit = 0))
);
create index journal_lines_entry_idx on public.journal_lines(journal_entry_id);
create index journal_lines_account_idx on public.journal_lines(organization_id, account_id);

create table public.sales_invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  customer_id uuid not null references public.customers(id),
  invoice_number text not null,
  invoice_date date not null default current_date,
  due_date date not null default current_date,
  status public.invoice_status not null default 'draft',
  subtotal numeric(18,2) not null default 0 check (subtotal >= 0),
  tax_amount numeric(18,2) not null default 0 check (tax_amount >= 0),
  total numeric(18,2) generated always as (subtotal + tax_amount) stored,
  amount_paid numeric(18,2) not null default 0 check (amount_paid >= 0),
  notes text,
  journal_entry_id uuid references public.journal_entries(id),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  posted_at timestamptz,
  unique (organization_id, invoice_number),
  check (amount_paid <= subtotal + tax_amount)
);

create table public.sales_invoice_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  invoice_id uuid not null references public.sales_invoices(id) on delete cascade,
  product_id uuid not null references public.products(id),
  warehouse_id uuid not null references public.warehouses(id),
  description text not null,
  quantity numeric(18,3) not null check (quantity > 0),
  unit_price numeric(18,2) not null check (unit_price >= 0),
  tax_rate numeric(7,4) not null default 0 check (tax_rate between 0 and 100),
  line_subtotal numeric(18,2) not null check (line_subtotal >= 0),
  line_tax numeric(18,2) not null check (line_tax >= 0),
  cost_total numeric(18,2) not null default 0 check (cost_total >= 0)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  customer_id uuid references public.customers(id),
  invoice_id uuid references public.sales_invoices(id),
  payment_number text not null,
  payment_type text not null check (payment_type in ('receipt','payment')),
  amount numeric(18,2) not null check (amount > 0),
  method text not null,
  payment_date date not null default current_date,
  journal_entry_id uuid references public.journal_entries(id),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (organization_id, payment_number)
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);
create index audit_events_org_time_idx on public.audit_events(organization_id, occurred_at desc);

create table public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  requested_by uuid not null references auth.users(id),
  decided_by uuid references auth.users(id),
  decision_note text,
  requested_at timestamptz not null default now(),
  decided_at timestamptz
);
