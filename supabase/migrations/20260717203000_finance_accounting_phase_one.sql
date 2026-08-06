-- HisabERP Finance & Accounting Phase 1
-- Fiscal periods, tax controls, cash/bank accounts, manual journals,
-- payment allocation, fixed assets, depreciation, and finance reporting.

alter table public.accounts
  add column if not exists account_subtype text,
  add column if not exists currency char(3) not null default 'ETB',
  add column if not exists allow_manual_posting boolean not null default true;

alter table public.payments
  add column if not exists counterparty_name text,
  add column if not exists reference text,
  add column if not exists notes text,
  add column if not exists tax_amount numeric(18,2) not null default 0,
  add column if not exists status text not null default 'posted';

create table public.accounting_periods (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'open' check (status in ('open','soft_closed','locked')),
  locked_by uuid references auth.users(id),
  locked_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (organization_id,start_date,end_date),
  check (end_date >= start_date)
);

create table public.tax_codes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null,
  name text not null,
  rate numeric(7,4) not null default 0 check (rate >= 0 and rate <= 100),
  tax_type text not null check (tax_type in ('output','input','withholding','exempt')),
  account_id uuid references public.accounts(id),
  is_active boolean not null default true,
  effective_from date not null default current_date,
  effective_to date,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (organization_id,code),
  check (effective_to is null or effective_to >= effective_from)
);

create table public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  account_id uuid not null references public.accounts(id),
  name text not null,
  bank_name text,
  account_number_masked text,
  currency char(3) not null default 'ETB',
  is_active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (organization_id,account_id)
);

create table public.fixed_assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  asset_number text not null,
  name text not null,
  category text not null,
  acquisition_date date not null,
  in_service_date date not null,
  cost numeric(18,2) not null check (cost > 0),
  salvage_value numeric(18,2) not null default 0 check (salvage_value >= 0),
  useful_life_months integer not null check (useful_life_months > 0),
  depreciation_method text not null default 'straight_line' check (depreciation_method = 'straight_line'),
  accumulated_depreciation numeric(18,2) not null default 0 check (accumulated_depreciation >= 0),
  status text not null default 'active' check (status in ('draft','active','fully_depreciated','disposed')),
  asset_account_id uuid not null references public.accounts(id),
  accumulated_depreciation_account_id uuid not null references public.accounts(id),
  depreciation_expense_account_id uuid not null references public.accounts(id),
  acquisition_journal_entry_id uuid references public.journal_entries(id),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id,asset_number),
  check (salvage_value < cost),
  check (accumulated_depreciation <= cost - salvage_value)
);

create table public.asset_depreciation_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  asset_id uuid not null references public.fixed_assets(id) on delete cascade,
  period_start date not null,
  depreciation_date date not null,
  amount numeric(18,2) not null check (amount > 0),
  journal_entry_id uuid not null references public.journal_entries(id),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (asset_id,period_start)
);

create index accounting_periods_org_dates_idx on public.accounting_periods(organization_id,start_date,end_date);
create index tax_codes_org_active_idx on public.tax_codes(organization_id,is_active);
create index bank_accounts_org_active_idx on public.bank_accounts(organization_id,is_active);
create index fixed_assets_org_status_idx on public.fixed_assets(organization_id,status);
create index asset_depreciation_runs_org_date_idx on public.asset_depreciation_runs(organization_id,depreciation_date);

alter table public.accounting_periods enable row level security;
alter table public.tax_codes enable row level security;
alter table public.bank_accounts enable row level security;
alter table public.fixed_assets enable row level security;
alter table public.asset_depreciation_runs enable row level security;

create policy accounting_period_select on public.accounting_periods
  for select to authenticated using (public.is_org_member(organization_id));
create policy tax_code_select on public.tax_codes
  for select to authenticated using (public.is_org_member(organization_id));
create policy bank_account_select on public.bank_accounts
  for select to authenticated using (public.is_org_member(organization_id));
create policy fixed_asset_select on public.fixed_assets
  for select to authenticated using (public.is_org_member(organization_id));
create policy asset_depreciation_select on public.asset_depreciation_runs
  for select to authenticated using (public.is_org_member(organization_id));

grant select on public.accounting_periods, public.tax_codes, public.bank_accounts,
  public.fixed_assets, public.asset_depreciation_runs to authenticated;
revoke all on public.accounting_periods, public.bank_accounts,
  public.fixed_assets, public.asset_depreciation_runs from anon;
revoke insert, update, delete on public.accounting_periods, public.bank_accounts,
  public.fixed_assets, public.asset_depreciation_runs from authenticated;

create or replace view public.account_balance_view
with (security_invoker = true)
as
select
  a.organization_id,
  a.id as account_id,
  a.code,
  a.name,
  a.account_type,
  a.account_subtype,
  a.normal_side,
  a.currency,
  a.is_system,
  a.is_active,
  coalesce(sum(case when je.status = 'posted' then jl.debit else 0 end),0)::numeric(18,2) as total_debit,
  coalesce(sum(case when je.status = 'posted' then jl.credit else 0 end),0)::numeric(18,2) as total_credit,
  case when a.normal_side = 'debit'
    then coalesce(sum(case when je.status = 'posted' then jl.debit - jl.credit else 0 end),0)
    else coalesce(sum(case when je.status = 'posted' then jl.credit - jl.debit else 0 end),0)
  end::numeric(18,2) as balance
from public.accounts a
left join public.journal_lines jl on jl.account_id = a.id and jl.organization_id = a.organization_id
left join public.journal_entries je on je.id = jl.journal_entry_id and je.organization_id = a.organization_id
group by a.organization_id,a.id,a.code,a.name,a.account_type,a.account_subtype,
  a.normal_side,a.currency,a.is_system,a.is_active;

grant select on public.account_balance_view to authenticated;
alter view public.journal_summary_view set (security_invoker = true);
alter view public.product_stock_view set (security_invoker = true);

create or replace function public.enforce_open_accounting_period()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if exists (
    select 1 from public.accounting_periods ap
    where ap.organization_id = new.organization_id
      and new.entry_date between ap.start_date and ap.end_date
      and ap.status = 'locked'
  ) then raise exception 'The accounting period for % is locked', new.entry_date;
  end if;
  return new;
end; $$;

create trigger journal_period_guard
before insert or update of entry_date,status on public.journal_entries
for each row execute function public.enforce_open_accounting_period();

create or replace function public.protect_posted_journal_lines()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare parent_status public.journal_status;
declare target_journal uuid;
begin
  target_journal := case when tg_op = 'DELETE' then old.journal_entry_id else new.journal_entry_id end;
  select je.status into parent_status from public.journal_entries je where je.id = target_journal;
  if parent_status in ('posted','reversed') then raise exception 'Posted journal lines are immutable'; end if;
  return case when tg_op = 'DELETE' then old else new end;
end; $$;

create trigger journal_line_immutable
before insert or update or delete on public.journal_lines
for each row execute function public.protect_posted_journal_lines();

create or replace function public.create_finance_account(
  p_organization_id uuid, p_code text, p_name text, p_account_type text,
  p_normal_side text, p_account_subtype text, p_currency text,
  p_bank_name text, p_account_number_masked text, p_actor_id uuid
) returns uuid language plpgsql security definer set search_path = '' as $$
declare new_account_id uuid;
begin
  if p_actor_id is distinct from auth.uid() then raise exception 'Actor mismatch'; end if;
  if not public.has_org_role(p_organization_id,array['owner','admin','accountant']::public.app_role[])
    then raise exception 'Insufficient finance permission'; end if;
  if p_account_type not in ('asset','liability','equity','revenue','expense') then raise exception 'Invalid account type'; end if;
  if p_normal_side not in ('debit','credit') then raise exception 'Invalid normal side'; end if;
  if nullif(trim(p_code),'') is null or nullif(trim(p_name),'') is null then raise exception 'Code and name are required'; end if;
  if char_length(coalesce(nullif(trim(p_currency),''),'ETB')) <> 3 then raise exception 'Currency must be a 3-letter code'; end if;

  insert into public.accounts(organization_id,code,name,account_type,normal_side,account_subtype,currency,is_system,is_active)
  values (p_organization_id,upper(trim(p_code)),trim(p_name),p_account_type,p_normal_side,
    nullif(trim(p_account_subtype),''),coalesce(nullif(upper(trim(p_currency)),''),'ETB'),false,true)
  returning id into new_account_id;

  if p_account_subtype = 'bank' then
    insert into public.bank_accounts(organization_id,account_id,name,bank_name,account_number_masked,currency,created_by)
    values (p_organization_id,new_account_id,trim(p_name),nullif(trim(p_bank_name),''),
      nullif(trim(p_account_number_masked),''),coalesce(nullif(upper(trim(p_currency)),''),'ETB'),p_actor_id);
  end if;

  insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,metadata)
  values (p_organization_id,p_actor_id,'finance.account.created','account',new_account_id,
    jsonb_build_object('code',upper(trim(p_code)),'name',trim(p_name)));
  return new_account_id;
end; $$;

create or replace function public.post_manual_journal(
  p_organization_id uuid, p_branch_id uuid, p_entry_date date,
  p_memo text, p_lines jsonb, p_actor_id uuid
) returns text language plpgsql security definer set search_path = '' as $$
declare journal_id uuid;
declare journal_no text;
declare line_count integer;
declare total_debit numeric(18,2);
declare total_credit numeric(18,2);
declare invalid_accounts integer;
begin
  if p_actor_id is distinct from auth.uid() then raise exception 'Actor mismatch'; end if;
  if not public.has_org_role(p_organization_id,array['owner','admin','accountant']::public.app_role[])
    then raise exception 'Insufficient finance permission'; end if;
  if p_branch_id is not null and not exists(select 1 from public.branches b where b.id=p_branch_id and b.organization_id=p_organization_id and b.is_active)
    then raise exception 'Invalid branch'; end if;
  if nullif(trim(p_memo),'') is null then raise exception 'Memo is required'; end if;
  if jsonb_typeof(p_lines) <> 'array' then raise exception 'Journal lines must be an array'; end if;

  select count(*), coalesce(sum(coalesce((line->>'debit')::numeric,0)),0),
    coalesce(sum(coalesce((line->>'credit')::numeric,0)),0)
  into line_count,total_debit,total_credit from jsonb_array_elements(p_lines) line;
  if line_count < 2 then raise exception 'At least two journal lines are required'; end if;
  if total_debit <= 0 or round(total_debit,2) <> round(total_credit,2) then raise exception 'Journal must be balanced'; end if;

  select count(*) into invalid_accounts
  from jsonb_array_elements(p_lines) line
  left join public.accounts a on a.id=(line->>'accountId')::uuid
    and a.organization_id=p_organization_id and a.is_active and a.allow_manual_posting
  where a.id is null or not (
    (coalesce((line->>'debit')::numeric,0)>0 and coalesce((line->>'credit')::numeric,0)=0)
    or (coalesce((line->>'credit')::numeric,0)>0 and coalesce((line->>'debit')::numeric,0)=0)
  );
  if invalid_accounts > 0 then raise exception 'One or more journal lines are invalid'; end if;

  journal_no := public.next_document_number(p_organization_id,'JE');
  insert into public.journal_entries(organization_id,branch_id,entry_number,entry_date,memo,status,source_type,created_by)
  values (p_organization_id,p_branch_id,journal_no,coalesce(p_entry_date,current_date),trim(p_memo),'draft','manual',p_actor_id)
  returning id into journal_id;

  insert into public.journal_lines(organization_id,journal_entry_id,account_id,description,debit,credit)
  select p_organization_id,journal_id,(line->>'accountId')::uuid,nullif(trim(line->>'description'),''),
    round(coalesce((line->>'debit')::numeric,0),2),round(coalesce((line->>'credit')::numeric,0),2)
  from jsonb_array_elements(p_lines) line;

  update public.journal_entries set status='posted',posted_by=p_actor_id,posted_at=now() where id=journal_id;
  insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,metadata)
  values (p_organization_id,p_actor_id,'journal.posted','journal_entry',journal_id,
    jsonb_build_object('entry_number',journal_no,'debit',total_debit,'credit',total_credit));
  return journal_no;
end; $$;

create or replace function public.record_finance_payment(
  p_organization_id uuid, p_branch_id uuid, p_payment_type text,
  p_amount numeric, p_tax_amount numeric, p_method text, p_payment_date date,
  p_cash_account_id uuid, p_counter_account_id uuid, p_tax_account_id uuid,
  p_customer_id uuid, p_invoice_id uuid, p_counterparty_name text,
  p_reference text, p_notes text, p_actor_id uuid
) returns text language plpgsql security definer set search_path = '' as $$
declare payment_id uuid;
declare payment_no text;
declare journal_id uuid;
declare journal_no text;
declare total_amount numeric(18,2);
declare invoice_total numeric(18,2);
declare invoice_paid numeric(18,2);
begin
  if p_actor_id is distinct from auth.uid() then raise exception 'Actor mismatch'; end if;
  if not public.has_org_role(p_organization_id,array['owner','admin','accountant','sales']::public.app_role[])
    then raise exception 'Insufficient payment permission'; end if;
  if p_payment_type not in ('receipt','payment') then raise exception 'Invalid payment type'; end if;
  if p_amount <= 0 or coalesce(p_tax_amount,0) < 0 then raise exception 'Invalid payment amount'; end if;
  if nullif(trim(p_method),'') is null then raise exception 'Payment method is required'; end if;
  if p_branch_id is not null and not exists(select 1 from public.branches b where b.id=p_branch_id and b.organization_id=p_organization_id and b.is_active)
    then raise exception 'Invalid branch'; end if;
  if p_customer_id is not null and not exists(select 1 from public.customers c where c.id=p_customer_id and c.organization_id=p_organization_id and c.is_active)
    then raise exception 'Invalid customer'; end if;
  if not exists(select 1 from public.accounts where id=p_cash_account_id and organization_id=p_organization_id and account_type='asset' and is_active)
    then raise exception 'Invalid cash account'; end if;
  if not exists(select 1 from public.accounts where id=p_counter_account_id and organization_id=p_organization_id and is_active)
    then raise exception 'Invalid counter account'; end if;
  if coalesce(p_tax_amount,0)>0 and not exists(select 1 from public.accounts where id=p_tax_account_id and organization_id=p_organization_id and is_active)
    then raise exception 'Invalid tax account'; end if;

  total_amount := round(p_amount+coalesce(p_tax_amount,0),2);
  if p_invoice_id is not null then
    if p_payment_type <> 'receipt' or coalesce(p_tax_amount,0) <> 0 then raise exception 'Invoice allocation supports receipts without separate tax'; end if;
    select subtotal+tax_amount,amount_paid into invoice_total,invoice_paid
    from public.sales_invoices where id=p_invoice_id and organization_id=p_organization_id and status in ('posted','partially_paid') for update;
    if not found then raise exception 'Open invoice not found'; end if;
    if p_amount > round(invoice_total-invoice_paid,2) then raise exception 'Receipt exceeds invoice balance'; end if;
  end if;

  payment_no := public.next_document_number(p_organization_id,case when p_payment_type='receipt' then 'RCPT' else 'PAY' end);
  journal_no := public.next_document_number(p_organization_id,'JE');
  insert into public.journal_entries(organization_id,branch_id,entry_number,entry_date,memo,status,source_type,created_by)
  values (p_organization_id,p_branch_id,journal_no,coalesce(p_payment_date,current_date),
    case when p_payment_type='receipt' then 'Receipt ' else 'Payment ' end||payment_no,'draft','payment',p_actor_id)
  returning id into journal_id;

  if p_payment_type='receipt' then
    insert into public.journal_lines(organization_id,journal_entry_id,account_id,description,debit,credit) values
      (p_organization_id,journal_id,p_cash_account_id,'Cash or bank received',total_amount,0),
      (p_organization_id,journal_id,p_counter_account_id,coalesce(nullif(trim(p_counterparty_name),''),'Receipt counter account'),0,p_amount);
    if coalesce(p_tax_amount,0)>0 then
      insert into public.journal_lines(organization_id,journal_entry_id,account_id,description,debit,credit)
      values (p_organization_id,journal_id,p_tax_account_id,'Tax collected',0,p_tax_amount);
    end if;
  else
    insert into public.journal_lines(organization_id,journal_entry_id,account_id,description,debit,credit) values
      (p_organization_id,journal_id,p_counter_account_id,coalesce(nullif(trim(p_counterparty_name),''),'Payment counter account'),p_amount,0),
      (p_organization_id,journal_id,p_cash_account_id,'Cash or bank paid',0,total_amount);
    if coalesce(p_tax_amount,0)>0 then
      insert into public.journal_lines(organization_id,journal_entry_id,account_id,description,debit,credit)
      values (p_organization_id,journal_id,p_tax_account_id,'Recoverable input tax',p_tax_amount,0);
    end if;
  end if;

  insert into public.payments(organization_id,branch_id,customer_id,invoice_id,payment_number,payment_type,amount,tax_amount,
    method,payment_date,journal_entry_id,created_by,counterparty_name,reference,notes,status)
  values (p_organization_id,p_branch_id,p_customer_id,p_invoice_id,payment_no,p_payment_type,total_amount,coalesce(p_tax_amount,0),
    trim(p_method),coalesce(p_payment_date,current_date),journal_id,p_actor_id,nullif(trim(p_counterparty_name),''),
    nullif(trim(p_reference),''),nullif(trim(p_notes),''),'posted') returning id into payment_id;

  if p_invoice_id is not null then
    update public.sales_invoices set amount_paid=amount_paid+p_amount,
      status=case when round(amount_paid+p_amount,2)>=round(subtotal+tax_amount,2)
        then 'paid'::public.invoice_status else 'partially_paid'::public.invoice_status end
    where id=p_invoice_id;
  end if;

  update public.journal_entries set status='posted',source_id=payment_id,posted_by=p_actor_id,posted_at=now() where id=journal_id;
  insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,metadata)
  values (p_organization_id,p_actor_id,'payment.posted','payment',payment_id,
    jsonb_build_object('payment_number',payment_no,'type',p_payment_type,'amount',total_amount,'journal_entry_id',journal_id));
  return payment_no;
end; $$;

create or replace function public.register_fixed_asset(
  p_organization_id uuid, p_branch_id uuid, p_name text, p_category text,
  p_acquisition_date date, p_in_service_date date, p_cost numeric,
  p_salvage_value numeric, p_useful_life_months integer,
  p_asset_account_id uuid, p_accumulated_depreciation_account_id uuid,
  p_depreciation_expense_account_id uuid, p_funding_account_id uuid, p_actor_id uuid
) returns text language plpgsql security definer set search_path = '' as $$
declare asset_id uuid;
declare asset_no text;
declare journal_id uuid;
declare journal_no text;
declare valid_accounts integer;
begin
  if p_actor_id is distinct from auth.uid() then raise exception 'Actor mismatch'; end if;
  if not public.has_org_role(p_organization_id,array['owner','admin','accountant']::public.app_role[])
    then raise exception 'Insufficient finance permission'; end if;
  if p_branch_id is not null and not exists(select 1 from public.branches b where b.id=p_branch_id and b.organization_id=p_organization_id and b.is_active)
    then raise exception 'Invalid branch'; end if;
  if nullif(trim(p_name),'') is null or nullif(trim(p_category),'') is null then raise exception 'Asset name and category are required'; end if;
  if p_cost<=0 or coalesce(p_salvage_value,0)<0 or coalesce(p_salvage_value,0)>=p_cost then raise exception 'Invalid asset values'; end if;
  if p_useful_life_months<=0 then raise exception 'Useful life must be positive'; end if;
  select count(*) into valid_accounts from public.accounts
  where organization_id=p_organization_id and is_active
    and id in (p_asset_account_id,p_accumulated_depreciation_account_id,p_depreciation_expense_account_id,p_funding_account_id);
  if valid_accounts<>4 then raise exception 'Invalid asset accounts'; end if;

  asset_no:=public.next_document_number(p_organization_id,'AST');
  journal_no:=public.next_document_number(p_organization_id,'JE');
  insert into public.journal_entries(organization_id,branch_id,entry_number,entry_date,memo,status,source_type,created_by)
  values (p_organization_id,p_branch_id,journal_no,coalesce(p_acquisition_date,current_date),'Asset acquisition '||asset_no,'draft','fixed_asset',p_actor_id)
  returning id into journal_id;
  insert into public.journal_lines(organization_id,journal_entry_id,account_id,description,debit,credit) values
    (p_organization_id,journal_id,p_asset_account_id,trim(p_name),p_cost,0),
    (p_organization_id,journal_id,p_funding_account_id,'Asset funding',0,p_cost);
  insert into public.fixed_assets(organization_id,branch_id,asset_number,name,category,acquisition_date,in_service_date,cost,
    salvage_value,useful_life_months,asset_account_id,accumulated_depreciation_account_id,depreciation_expense_account_id,
    acquisition_journal_entry_id,created_by)
  values (p_organization_id,p_branch_id,asset_no,trim(p_name),trim(p_category),coalesce(p_acquisition_date,current_date),
    coalesce(p_in_service_date,p_acquisition_date,current_date),round(p_cost,2),round(coalesce(p_salvage_value,0),2),
    p_useful_life_months,p_asset_account_id,p_accumulated_depreciation_account_id,p_depreciation_expense_account_id,
    journal_id,p_actor_id) returning id into asset_id;
  update public.journal_entries set status='posted',source_id=asset_id,posted_by=p_actor_id,posted_at=now() where id=journal_id;
  insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,metadata)
  values (p_organization_id,p_actor_id,'asset.registered','fixed_asset',asset_id,
    jsonb_build_object('asset_number',asset_no,'cost',p_cost,'journal_entry_id',journal_id));
  return asset_no;
end; $$;

create or replace function public.post_asset_depreciation(
  p_organization_id uuid, p_asset_id uuid, p_depreciation_date date, p_actor_id uuid
) returns text language plpgsql security definer set search_path = '' as $$
declare asset_row public.fixed_assets%rowtype;
declare depreciation_amount numeric(18,2);
declare remaining_amount numeric(18,2);
declare monthly_amount numeric(18,2);
declare period_start_date date;
declare journal_id uuid;
declare journal_no text;
begin
  if p_actor_id is distinct from auth.uid() then raise exception 'Actor mismatch'; end if;
  if not public.has_org_role(p_organization_id,array['owner','admin','accountant']::public.app_role[])
    then raise exception 'Insufficient finance permission'; end if;
  select * into asset_row from public.fixed_assets
  where id=p_asset_id and organization_id=p_organization_id and status in ('active','fully_depreciated') for update;
  if not found then raise exception 'Asset not found'; end if;
  if asset_row.status='fully_depreciated' then raise exception 'Asset is already fully depreciated'; end if;
  if coalesce(p_depreciation_date,current_date)<asset_row.in_service_date then raise exception 'Depreciation date precedes service date'; end if;
  period_start_date:=date_trunc('month',coalesce(p_depreciation_date,current_date))::date;
  if exists(select 1 from public.asset_depreciation_runs where asset_id=p_asset_id and period_start=period_start_date)
    then raise exception 'Depreciation already posted for this month'; end if;
  monthly_amount:=round((asset_row.cost-asset_row.salvage_value)/asset_row.useful_life_months,2);
  remaining_amount:=round(asset_row.cost-asset_row.salvage_value-asset_row.accumulated_depreciation,2);
  depreciation_amount:=least(monthly_amount,remaining_amount);
  if depreciation_amount<=0 then raise exception 'No depreciable balance remains'; end if;
  journal_no:=public.next_document_number(p_organization_id,'JE');
  insert into public.journal_entries(organization_id,branch_id,entry_number,entry_date,memo,status,source_type,source_id,created_by)
  values (p_organization_id,asset_row.branch_id,journal_no,coalesce(p_depreciation_date,current_date),
    'Depreciation '||asset_row.asset_number,'draft','asset_depreciation',asset_row.id,p_actor_id) returning id into journal_id;
  insert into public.journal_lines(organization_id,journal_entry_id,account_id,description,debit,credit) values
    (p_organization_id,journal_id,asset_row.depreciation_expense_account_id,'Depreciation expense',depreciation_amount,0),
    (p_organization_id,journal_id,asset_row.accumulated_depreciation_account_id,'Accumulated depreciation',0,depreciation_amount);
  insert into public.asset_depreciation_runs(organization_id,asset_id,period_start,depreciation_date,amount,journal_entry_id,created_by)
  values (p_organization_id,p_asset_id,period_start_date,coalesce(p_depreciation_date,current_date),depreciation_amount,journal_id,p_actor_id);
  update public.fixed_assets set accumulated_depreciation=accumulated_depreciation+depreciation_amount,
    status=case when round(accumulated_depreciation+depreciation_amount,2)>=round(cost-salvage_value,2)
      then 'fully_depreciated' else 'active' end,updated_at=now() where id=p_asset_id;
  update public.journal_entries set status='posted',posted_by=p_actor_id,posted_at=now() where id=journal_id;
  insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,metadata)
  values (p_organization_id,p_actor_id,'asset.depreciation.posted','fixed_asset',p_asset_id,
    jsonb_build_object('amount',depreciation_amount,'period_start',period_start_date,'journal_entry_id',journal_id));
  return journal_no;
end; $$;

create or replace function public.set_accounting_period_status(
  p_organization_id uuid, p_period_id uuid, p_status text, p_actor_id uuid
) returns text language plpgsql security definer set search_path = '' as $$
declare period_name text;
declare current_status text;
begin
  if p_actor_id is distinct from auth.uid() then raise exception 'Actor mismatch'; end if;
  if p_status not in ('open','soft_closed','locked') then raise exception 'Invalid period status'; end if;
  select name,status into period_name,current_status from public.accounting_periods
  where id=p_period_id and organization_id=p_organization_id for update;
  if not found then raise exception 'Accounting period not found'; end if;
  if p_status='locked' or current_status='locked' then
    if not public.has_org_role(p_organization_id,array['owner','admin']::public.app_role[])
      then raise exception 'Only owners or administrators can lock or reopen a locked period'; end if;
  elsif not public.has_org_role(p_organization_id,array['owner','admin','accountant']::public.app_role[])
    then raise exception 'Insufficient finance permission'; end if;
  update public.accounting_periods set status=p_status,
    locked_by=case when p_status='locked' then p_actor_id else null end,
    locked_at=case when p_status='locked' then now() else null end where id=p_period_id;
  insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,metadata)
  values (p_organization_id,p_actor_id,'accounting.period.status_changed','accounting_period',p_period_id,
    jsonb_build_object('name',period_name,'from',current_status,'to',p_status));
  return period_name;
end; $$;

create or replace function public.get_finance_snapshot(target_organization_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
declare month_start date:=date_trunc('month',current_date)::date;
begin
  if not public.is_org_member(target_organization_id) then raise exception 'Access denied'; end if;
  select jsonb_build_object(
    'metrics',jsonb_build_object(
      'cash',coalesce((select sum(ab.balance) from public.account_balance_view ab where ab.organization_id=target_organization_id and (ab.account_subtype in ('cash','bank') or ab.code in ('1000','1010'))),0),
      'receivables',coalesce((select sum(ab.balance) from public.account_balance_view ab where ab.organization_id=target_organization_id and ab.code='1100'),0),
      'payables',coalesce((select sum(ab.balance) from public.account_balance_view ab where ab.organization_id=target_organization_id and ab.code='2000'),0),
      'revenue',coalesce((select sum(jl.credit-jl.debit) from public.journal_lines jl join public.journal_entries je on je.id=jl.journal_entry_id and je.status='posted' join public.accounts a on a.id=jl.account_id and a.account_type='revenue' where jl.organization_id=target_organization_id and je.entry_date>=month_start),0),
      'expenses',coalesce((select sum(jl.debit-jl.credit) from public.journal_lines jl join public.journal_entries je on je.id=jl.journal_entry_id and je.status='posted' join public.accounts a on a.id=jl.account_id and a.account_type='expense' where jl.organization_id=target_organization_id and je.entry_date>=month_start),0),
      'assets',coalesce((select sum(ab.balance) from public.account_balance_view ab where ab.organization_id=target_organization_id and ab.account_type='asset'),0),
      'liabilities',coalesce((select sum(ab.balance) from public.account_balance_view ab where ab.organization_id=target_organization_id and ab.account_type='liability'),0),
      'equity',coalesce((select sum(ab.balance) from public.account_balance_view ab where ab.organization_id=target_organization_id and ab.account_type='equity'),0)
    ),
    'accounts',coalesce((select jsonb_agg(jsonb_build_object('id',ab.account_id,'code',ab.code,'name',ab.name,'type',ab.account_type,'subtype',ab.account_subtype,'normalSide',ab.normal_side,'currency',ab.currency,'debit',ab.total_debit,'credit',ab.total_credit,'balance',ab.balance,'system',ab.is_system) order by ab.code) from public.account_balance_view ab where ab.organization_id=target_organization_id and ab.is_active),'[]'::jsonb),
    'journals',coalesce((select jsonb_agg(row_data order by entry_date desc,created_at desc) from (select jsonb_build_object('id',js.id,'number',js.entry_number,'date',js.entry_date,'memo',js.memo,'status',js.status,'debit',js.total_debit,'credit',js.total_credit) row_data,js.entry_date,je.created_at from public.journal_summary_view js join public.journal_entries je on je.id=js.id where js.organization_id=target_organization_id order by js.entry_date desc,je.created_at desc limit 30) rows),'[]'::jsonb),
    'payments',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'number',p.payment_number,'type',p.payment_type,'amount',p.amount,'taxAmount',p.tax_amount,'method',p.method,'date',p.payment_date,'counterparty',p.counterparty_name,'reference',p.reference,'status',p.status) order by p.payment_date desc,p.created_at desc) from (select * from public.payments where organization_id=target_organization_id order by payment_date desc,created_at desc limit 30) p),'[]'::jsonb),
    'periods',coalesce((select jsonb_agg(jsonb_build_object('id',ap.id,'name',ap.name,'startDate',ap.start_date,'endDate',ap.end_date,'status',ap.status,'lockedAt',ap.locked_at) order by ap.start_date desc) from (select * from public.accounting_periods where organization_id=target_organization_id order by start_date desc limit 18) ap),'[]'::jsonb),
    'taxCodes',coalesce((select jsonb_agg(jsonb_build_object('id',tc.id,'code',tc.code,'name',tc.name,'rate',tc.rate,'type',tc.tax_type,'accountId',tc.account_id,'balance',coalesce(ab.balance,0),'active',tc.is_active) order by tc.code) from public.tax_codes tc left join public.account_balance_view ab on ab.account_id=tc.account_id where tc.organization_id=target_organization_id),'[]'::jsonb),
    'assets',coalesce((select jsonb_agg(jsonb_build_object('id',fa.id,'number',fa.asset_number,'name',fa.name,'category',fa.category,'acquisitionDate',fa.acquisition_date,'inServiceDate',fa.in_service_date,'cost',fa.cost,'salvageValue',fa.salvage_value,'usefulLifeMonths',fa.useful_life_months,'accumulatedDepreciation',fa.accumulated_depreciation,'bookValue',fa.cost-fa.accumulated_depreciation,'status',fa.status) order by fa.created_at desc) from public.fixed_assets fa where fa.organization_id=target_organization_id),'[]'::jsonb),
    'customers',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'name',c.name) order by c.name) from public.customers c where c.organization_id=target_organization_id and c.is_active),'[]'::jsonb),
    'invoices',coalesce((select jsonb_agg(jsonb_build_object('id',si.id,'number',si.invoice_number,'customerId',si.customer_id,'total',si.subtotal+si.tax_amount,'paid',si.amount_paid,'outstanding',si.subtotal+si.tax_amount-si.amount_paid,'status',si.status) order by si.invoice_date desc) from public.sales_invoices si where si.organization_id=target_organization_id and si.status in ('posted','partially_paid')),'[]'::jsonb)
  ) into result;
  return result;
end; $$;

insert into public.accounts(organization_id,code,name,account_type,normal_side,is_system,account_subtype,currency,allow_manual_posting)
select o.id,v.code,v.name,v.account_type,v.normal_side,true,v.account_subtype,'ETB',v.allow_manual_posting
from public.organizations o cross join (values
  ('1000','Cash on Hand','asset','debit','cash',true),('1010','Bank Accounts','asset','debit','bank',true),
  ('1100','Accounts Receivable','asset','debit','receivable',false),('1200','Inventory','asset','debit','inventory',false),
  ('1300','Input VAT Recoverable','asset','debit','tax',true),('1500','Property, Plant & Equipment','asset','debit','fixed_asset',true),
  ('1510','Accumulated Depreciation','asset','credit','contra_asset',true),('2000','Accounts Payable','liability','credit','payable',true),
  ('2100','Output VAT Payable','liability','credit','tax',true),('2200','Other Taxes Payable','liability','credit','tax',true),
  ('3000','Owner Equity','equity','credit','equity',true),('4000','Sales Revenue','revenue','credit','sales',true),
  ('5000','Cost of Goods Sold','expense','debit','cogs',true),('6000','Operating Expenses','expense','debit','operating_expense',true),
  ('6100','Depreciation Expense','expense','debit','depreciation',true)
) v(code,name,account_type,normal_side,account_subtype,allow_manual_posting)
on conflict (organization_id,code) do update set name=excluded.name,account_subtype=excluded.account_subtype,
  currency=excluded.currency,allow_manual_posting=excluded.allow_manual_posting;

insert into public.tax_codes(organization_id,code,name,rate,tax_type,account_id,is_active,effective_from)
select o.id,'VAT15-OUT','VAT 15% Output',15,'output',a.id,true,current_date
from public.organizations o join public.accounts a on a.organization_id=o.id and a.code='2100'
on conflict (organization_id,code) do nothing;
insert into public.tax_codes(organization_id,code,name,rate,tax_type,account_id,is_active,effective_from)
select o.id,'VAT15-IN','VAT 15% Input',15,'input',a.id,true,current_date
from public.organizations o join public.accounts a on a.organization_id=o.id and a.code='1300'
on conflict (organization_id,code) do nothing;
insert into public.accounting_periods(organization_id,name,start_date,end_date,status)
select o.id,to_char(gs,'Mon YYYY'),gs::date,(gs+interval '1 month - 1 day')::date,'open'
from public.organizations o cross join generate_series(date_trunc('year',current_date),date_trunc('year',current_date)+interval '11 months',interval '1 month') gs
on conflict (organization_id,start_date,end_date) do nothing;

create or replace function public.bootstrap_organization(p_name text,p_full_name text,p_tin text default null,p_phone text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare org_id uuid;
declare branch_id uuid;
declare current_user_id uuid:=auth.uid();
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  select m.organization_id into org_id from public.organization_members m where m.user_id=current_user_id limit 1;
  if org_id is not null then return org_id; end if;
  insert into public.organizations(name,tin,phone,created_by) values(p_name,p_tin,p_phone,current_user_id) returning id into org_id;
  insert into public.branches(organization_id,name,code) values(org_id,'Main Branch','MAIN') returning id into branch_id;
  insert into public.organization_members(organization_id,branch_id,user_id,full_name,role) values(org_id,branch_id,current_user_id,p_full_name,'owner');
  insert into public.warehouses(organization_id,branch_id,name,code) values(org_id,branch_id,'Main Warehouse','MAIN');
  insert into public.accounts(organization_id,code,name,account_type,normal_side,is_system,account_subtype,currency,allow_manual_posting) values
    (org_id,'1000','Cash on Hand','asset','debit',true,'cash','ETB',true),(org_id,'1010','Bank Accounts','asset','debit',true,'bank','ETB',true),
    (org_id,'1100','Accounts Receivable','asset','debit',true,'receivable','ETB',false),(org_id,'1200','Inventory','asset','debit',true,'inventory','ETB',false),
    (org_id,'1300','Input VAT Recoverable','asset','debit',true,'tax','ETB',true),(org_id,'1500','Property, Plant & Equipment','asset','debit',true,'fixed_asset','ETB',true),
    (org_id,'1510','Accumulated Depreciation','asset','credit',true,'contra_asset','ETB',true),(org_id,'2000','Accounts Payable','liability','credit',true,'payable','ETB',true),
    (org_id,'2100','Output VAT Payable','liability','credit',true,'tax','ETB',true),(org_id,'2200','Other Taxes Payable','liability','credit',true,'tax','ETB',true),
    (org_id,'3000','Owner Equity','equity','credit',true,'equity','ETB',true),(org_id,'4000','Sales Revenue','revenue','credit',true,'sales','ETB',true),
    (org_id,'5000','Cost of Goods Sold','expense','debit',true,'cogs','ETB',true),(org_id,'6000','Operating Expenses','expense','debit',true,'operating_expense','ETB',true),
    (org_id,'6100','Depreciation Expense','expense','debit',true,'depreciation','ETB',true);
  insert into public.tax_codes(organization_id,code,name,rate,tax_type,account_id,created_by)
    select org_id,'VAT15-OUT','VAT 15% Output',15,'output',a.id,current_user_id from public.accounts a where a.organization_id=org_id and a.code='2100';
  insert into public.tax_codes(organization_id,code,name,rate,tax_type,account_id,created_by)
    select org_id,'VAT15-IN','VAT 15% Input',15,'input',a.id,current_user_id from public.accounts a where a.organization_id=org_id and a.code='1300';
  insert into public.accounting_periods(organization_id,name,start_date,end_date,status,created_by)
    select org_id,to_char(gs,'Mon YYYY'),gs::date,(gs+interval '1 month - 1 day')::date,'open',current_user_id
    from generate_series(date_trunc('year',current_date),date_trunc('year',current_date)+interval '11 months',interval '1 month') gs;
  insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,metadata)
    values(org_id,current_user_id,'organization.created','organization',org_id,jsonb_build_object('name',p_name));
  return org_id;
end; $$;

revoke execute on function public.create_finance_account(uuid,text,text,text,text,text,text,text,text,uuid) from public,anon;
revoke execute on function public.post_manual_journal(uuid,uuid,date,text,jsonb,uuid) from public,anon;
revoke execute on function public.record_finance_payment(uuid,uuid,text,numeric,numeric,text,date,uuid,uuid,uuid,uuid,uuid,text,text,text,uuid) from public,anon;
revoke execute on function public.register_fixed_asset(uuid,uuid,text,text,date,date,numeric,numeric,integer,uuid,uuid,uuid,uuid,uuid) from public,anon;
revoke execute on function public.post_asset_depreciation(uuid,uuid,date,uuid) from public,anon;
revoke execute on function public.set_accounting_period_status(uuid,uuid,text,uuid) from public,anon;
revoke execute on function public.get_finance_snapshot(uuid) from public,anon;
grant execute on function public.create_finance_account(uuid,text,text,text,text,text,text,text,text,uuid) to authenticated;
grant execute on function public.post_manual_journal(uuid,uuid,date,text,jsonb,uuid) to authenticated;
grant execute on function public.record_finance_payment(uuid,uuid,text,numeric,numeric,text,date,uuid,uuid,uuid,uuid,uuid,text,text,text,uuid) to authenticated;
grant execute on function public.register_fixed_asset(uuid,uuid,text,text,date,date,numeric,numeric,integer,uuid,uuid,uuid,uuid,uuid) to authenticated;
grant execute on function public.post_asset_depreciation(uuid,uuid,date,uuid) to authenticated;
grant execute on function public.set_accounting_period_status(uuid,uuid,text,uuid) to authenticated;
grant execute on function public.get_finance_snapshot(uuid) to authenticated;

comment on function public.post_manual_journal(uuid,uuid,date,text,jsonb,uuid)
is 'Posts an immutable, balanced manual journal after tenant, role and period validation.';
comment on function public.record_finance_payment(uuid,uuid,text,numeric,numeric,text,date,uuid,uuid,uuid,uuid,uuid,text,text,text,uuid)
is 'Posts receipts, supplier payments and expenses with balanced journal entries and optional invoice allocation.';
comment on function public.register_fixed_asset(uuid,uuid,text,text,date,date,numeric,numeric,integer,uuid,uuid,uuid,uuid,uuid)
is 'Registers a fixed asset and posts its acquisition journal.';
comment on function public.post_asset_depreciation(uuid,uuid,date,uuid)
is 'Posts one straight-line depreciation run per asset and month.';