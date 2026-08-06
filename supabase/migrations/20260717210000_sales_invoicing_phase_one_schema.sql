-- Sales & Invoicing Phase 1 schema

alter table public.sales_invoice_items
  add column if not exists discount_rate numeric(7,4) not null default 0 check (discount_rate between 0 and 100),
  add column if not exists line_discount numeric(18,2) not null default 0 check (line_discount >= 0);

create table if not exists public.sales_quotations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  customer_id uuid not null references public.customers(id),
  quotation_number text not null,
  quotation_date date not null default current_date,
  valid_until date not null,
  status text not null default 'draft' check (status in ('draft','sent','accepted','rejected','expired','converted')),
  subtotal numeric(18,2) not null default 0 check (subtotal >= 0),
  discount_amount numeric(18,2) not null default 0 check (discount_amount >= 0 and discount_amount <= subtotal),
  tax_amount numeric(18,2) not null default 0 check (tax_amount >= 0),
  total numeric(18,2) generated always as (subtotal - discount_amount + tax_amount) stored,
  currency char(3) not null default 'ETB',
  notes text,
  converted_order_id uuid,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id,quotation_number),
  check (valid_until >= quotation_date)
);

create table if not exists public.sales_quotation_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  quotation_id uuid not null references public.sales_quotations(id) on delete cascade,
  product_id uuid not null references public.products(id),
  warehouse_id uuid references public.warehouses(id),
  description text not null,
  quantity numeric(18,3) not null check (quantity > 0),
  unit_price numeric(18,2) not null check (unit_price >= 0),
  discount_rate numeric(7,4) not null default 0 check (discount_rate between 0 and 100),
  tax_rate numeric(7,4) not null default 0 check (tax_rate between 0 and 100),
  line_subtotal numeric(18,2) not null check (line_subtotal >= 0),
  line_discount numeric(18,2) not null default 0 check (line_discount >= 0),
  line_tax numeric(18,2) not null default 0 check (line_tax >= 0),
  line_total numeric(18,2) generated always as (line_subtotal-line_discount+line_tax) stored,
  created_at timestamptz not null default now()
);

create table if not exists public.sales_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  customer_id uuid not null references public.customers(id),
  quotation_id uuid references public.sales_quotations(id) on delete set null,
  order_number text not null,
  order_date date not null default current_date,
  expected_date date,
  status text not null default 'confirmed' check (status in ('draft','confirmed','invoiced','cancelled')),
  subtotal numeric(18,2) not null default 0 check (subtotal >= 0),
  discount_amount numeric(18,2) not null default 0 check (discount_amount >= 0 and discount_amount <= subtotal),
  tax_amount numeric(18,2) not null default 0 check (tax_amount >= 0),
  total numeric(18,2) generated always as (subtotal-discount_amount+tax_amount) stored,
  currency char(3) not null default 'ETB',
  customer_reference text,
  notes text,
  converted_invoice_id uuid references public.sales_invoices(id) on delete set null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id,order_number),
  check (expected_date is null or expected_date >= order_date)
);

create table if not exists public.sales_order_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sales_order_id uuid not null references public.sales_orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  warehouse_id uuid not null references public.warehouses(id),
  description text not null,
  quantity numeric(18,3) not null check (quantity > 0),
  unit_price numeric(18,2) not null check (unit_price >= 0),
  discount_rate numeric(7,4) not null default 0 check (discount_rate between 0 and 100),
  tax_rate numeric(7,4) not null default 0 check (tax_rate between 0 and 100),
  line_subtotal numeric(18,2) not null check (line_subtotal >= 0),
  line_discount numeric(18,2) not null default 0 check (line_discount >= 0),
  line_tax numeric(18,2) not null default 0 check (line_tax >= 0),
  line_total numeric(18,2) generated always as (line_subtotal-line_discount+line_tax) stored,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname='sales_quotations_converted_order_id_fkey') then
    alter table public.sales_quotations add constraint sales_quotations_converted_order_id_fkey foreign key (converted_order_id) references public.sales_orders(id) on delete set null;
  end if;
end $$;

alter table public.sales_invoices
  add column if not exists quotation_id uuid references public.sales_quotations(id) on delete set null,
  add column if not exists sales_order_id uuid references public.sales_orders(id) on delete set null,
  add column if not exists discount_amount numeric(18,2) not null default 0 check (discount_amount >= 0),
  add column if not exists currency char(3) not null default 'ETB',
  add column if not exists customer_reference text;

create table if not exists public.sales_returns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  customer_id uuid not null references public.customers(id),
  invoice_id uuid not null references public.sales_invoices(id),
  return_number text not null,
  return_date date not null default current_date,
  status text not null default 'posted' check (status in ('posted','void')),
  resolution text not null default 'customer_credit' check (resolution='customer_credit'),
  subtotal numeric(18,2) not null default 0 check (subtotal >= 0),
  tax_amount numeric(18,2) not null default 0 check (tax_amount >= 0),
  total numeric(18,2) generated always as (subtotal+tax_amount) stored,
  cost_total numeric(18,2) not null default 0 check (cost_total >= 0),
  reason text not null,
  journal_entry_id uuid references public.journal_entries(id),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  posted_at timestamptz not null default now(),
  unique (organization_id,return_number)
);

create table if not exists public.sales_return_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sales_return_id uuid not null references public.sales_returns(id) on delete cascade,
  invoice_item_id uuid not null references public.sales_invoice_items(id),
  product_id uuid not null references public.products(id),
  warehouse_id uuid not null references public.warehouses(id),
  description text not null,
  quantity numeric(18,3) not null check (quantity > 0),
  unit_price numeric(18,2) not null check (unit_price >= 0),
  tax_rate numeric(7,4) not null default 0 check (tax_rate between 0 and 100),
  line_subtotal numeric(18,2) not null check (line_subtotal >= 0),
  line_tax numeric(18,2) not null default 0 check (line_tax >= 0),
  cost_total numeric(18,2) not null default 0 check (cost_total >= 0),
  created_at timestamptz not null default now()
);

insert into public.accounts(organization_id,code,name,account_type,normal_side,is_system,account_subtype,currency,allow_manual_posting)
select o.id,'4050','Sales Returns and Allowances','revenue','debit',true,'sales_return',coalesce(o.base_currency,'ETB'),false
from public.organizations o
on conflict (organization_id,code) do nothing;

create index if not exists sales_quotations_org_date_idx on public.sales_quotations(organization_id,quotation_date desc);
create index if not exists sales_quotations_customer_idx on public.sales_quotations(customer_id);
create index if not exists sales_quotation_items_quote_idx on public.sales_quotation_items(quotation_id);
create index if not exists sales_quotation_items_product_idx on public.sales_quotation_items(product_id);
create index if not exists sales_orders_org_date_idx on public.sales_orders(organization_id,order_date desc);
create index if not exists sales_orders_customer_idx on public.sales_orders(customer_id);
create index if not exists sales_orders_quote_idx on public.sales_orders(quotation_id);
create index if not exists sales_order_items_order_idx on public.sales_order_items(sales_order_id);
create index if not exists sales_order_items_product_idx on public.sales_order_items(product_id);
create index if not exists sales_returns_org_date_idx on public.sales_returns(organization_id,return_date desc);
create index if not exists sales_returns_invoice_idx on public.sales_returns(invoice_id);
create index if not exists sales_returns_customer_idx on public.sales_returns(customer_id);
create index if not exists sales_return_items_return_idx on public.sales_return_items(sales_return_id);
create index if not exists sales_return_items_invoice_item_idx on public.sales_return_items(invoice_item_id);
create index if not exists sales_invoices_sales_order_idx on public.sales_invoices(sales_order_id);
create index if not exists sales_invoices_quotation_idx on public.sales_invoices(quotation_id);

alter table public.sales_quotations enable row level security;
alter table public.sales_quotation_items enable row level security;
alter table public.sales_orders enable row level security;
alter table public.sales_order_items enable row level security;
alter table public.sales_returns enable row level security;
alter table public.sales_return_items enable row level security;

drop policy if exists sales_quotation_select on public.sales_quotations;
create policy sales_quotation_select on public.sales_quotations for select to authenticated using (public.is_org_member(organization_id));
drop policy if exists sales_quotation_item_select on public.sales_quotation_items;
create policy sales_quotation_item_select on public.sales_quotation_items for select to authenticated using (public.is_org_member(organization_id));
drop policy if exists sales_order_select on public.sales_orders;
create policy sales_order_select on public.sales_orders for select to authenticated using (public.is_org_member(organization_id));
drop policy if exists sales_order_item_select on public.sales_order_items;
create policy sales_order_item_select on public.sales_order_items for select to authenticated using (public.is_org_member(organization_id));
drop policy if exists sales_return_select on public.sales_returns;
create policy sales_return_select on public.sales_returns for select to authenticated using (public.is_org_member(organization_id));
drop policy if exists sales_return_item_select on public.sales_return_items;
create policy sales_return_item_select on public.sales_return_items for select to authenticated using (public.is_org_member(organization_id));

revoke all on public.sales_quotations,public.sales_quotation_items,public.sales_orders,public.sales_order_items,public.sales_returns,public.sales_return_items from anon;
grant select on public.sales_quotations,public.sales_quotation_items,public.sales_orders,public.sales_order_items,public.sales_returns,public.sales_return_items to authenticated;

create or replace view public.sales_invoice_balance_view with (security_invoker=true) as
select si.id,si.organization_id,si.branch_id,si.customer_id,si.invoice_number,si.invoice_date,si.due_date,si.status,si.subtotal,si.discount_amount,si.tax_amount,si.total,si.amount_paid,si.sales_order_id,si.quotation_id,si.customer_reference,
coalesce(r.returned_amount,0)::numeric(18,2) returned_amount,
greatest(si.total-si.amount_paid-coalesce(r.returned_amount,0),0)::numeric(18,2) outstanding_amount,
greatest(si.amount_paid+coalesce(r.returned_amount,0)-si.total,0)::numeric(18,2) customer_credit
from public.sales_invoices si
left join (select invoice_id,sum(total)::numeric(18,2) returned_amount from public.sales_returns where status='posted' group by invoice_id) r on r.invoice_id=si.id;

create or replace view public.customer_sales_balance_view with (security_invoker=true) as
select c.id customer_id,c.organization_id,c.name,c.email,c.phone,c.tin,c.credit_limit,c.payment_terms_days,
coalesce(i.invoiced,0)::numeric(18,2) invoiced,coalesce(p.received,0)::numeric(18,2) received,coalesce(r.returned,0)::numeric(18,2) returned,
(coalesce(i.invoiced,0)-coalesce(p.received,0)-coalesce(r.returned,0))::numeric(18,2) balance,
greatest(c.credit_limit-(coalesce(i.invoiced,0)-coalesce(p.received,0)-coalesce(r.returned,0)),0)::numeric(18,2) available_credit
from public.customers c
left join (select customer_id,sum(total)::numeric(18,2) invoiced from public.sales_invoices where status<>'void' group by customer_id) i on i.customer_id=c.id
left join (select customer_id,sum(amount)::numeric(18,2) received from public.payments where payment_type='receipt' and status='posted' and customer_id is not null group by customer_id) p on p.customer_id=c.id
left join (select customer_id,sum(total)::numeric(18,2) returned from public.sales_returns where status='posted' group by customer_id) r on r.customer_id=c.id
where c.is_active;

grant select on public.sales_invoice_balance_view,public.customer_sales_balance_view to authenticated;
