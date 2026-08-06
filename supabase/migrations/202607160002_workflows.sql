create or replace function public.is_org_member(target_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.organization_members m where m.organization_id = target_org and m.user_id = auth.uid() and m.is_active);
$$;

create or replace function public.has_org_role(target_org uuid, allowed public.app_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.organization_members m where m.organization_id = target_org and m.user_id = auth.uid() and m.is_active and m.role = any(allowed));
$$;

grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.has_org_role(uuid, public.app_role[]) to authenticated;

create or replace function public.next_document_number(target_org uuid, target_prefix text)
returns text language plpgsql security definer set search_path = public as $$
declare next_value bigint;
begin
  insert into public.document_counters(organization_id,prefix,current_value) values(target_org,target_prefix,1)
  on conflict (organization_id,prefix) do update set current_value = public.document_counters.current_value + 1
  returning current_value into next_value;
  return target_prefix || '-' || to_char(current_date,'YYYY') || '-' || lpad(next_value::text,6,'0');
end; $$;

create or replace function public.protect_posted_journal()
returns trigger language plpgsql set search_path = public as $$
begin
  if old.status in ('posted','reversed') then raise exception 'Posted journal entries are immutable'; end if;
  return new;
end; $$;
create trigger journal_immutable before update or delete on public.journal_entries for each row execute function public.protect_posted_journal();

create or replace function public.prevent_audit_mutation()
returns trigger language plpgsql as $$ begin raise exception 'Audit events are immutable'; end; $$;
create trigger audit_immutable before update or delete on public.audit_events for each row execute function public.prevent_audit_mutation();

create or replace function public.record_stock_movement(
  p_organization_id uuid, p_product_id uuid, p_warehouse_id uuid,
  p_movement_type public.stock_movement_type, p_quantity numeric,
  p_reference text, p_actor_id uuid, p_source_type text default null, p_source_id uuid default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare current_qty numeric(18,3); delta numeric(18,3); movement_id uuid;
begin
  if p_actor_id is distinct from auth.uid() then raise exception 'Actor mismatch'; end if;
  if not public.has_org_role(p_organization_id, array['owner','admin','inventory','sales']::public.app_role[]) then raise exception 'Insufficient inventory permission'; end if;
  if p_quantity <= 0 then raise exception 'Quantity must be positive'; end if;
  select quantity into current_qty from public.stock_balances where organization_id=p_organization_id and product_id=p_product_id and warehouse_id=p_warehouse_id for update;
  current_qty := coalesce(current_qty,0);
  delta := case when p_movement_type in ('opening','purchase','adjustment_in','transfer_in','return_in') then p_quantity else -p_quantity end;
  if current_qty + delta < 0 then raise exception 'Insufficient stock'; end if;
  insert into public.stock_balances(organization_id,product_id,warehouse_id,quantity) values(p_organization_id,p_product_id,p_warehouse_id,current_qty+delta)
  on conflict (organization_id,product_id,warehouse_id) do update set quantity=excluded.quantity,updated_at=now();
  insert into public.stock_movements(organization_id,product_id,warehouse_id,movement_type,quantity,reference,source_type,source_id,actor_id)
  values(p_organization_id,p_product_id,p_warehouse_id,p_movement_type,p_quantity,p_reference,p_source_type,p_source_id,p_actor_id) returning id into movement_id;
  insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,metadata) values(p_organization_id,p_actor_id,'stock.movement','product',p_product_id,jsonb_build_object('movement_type',p_movement_type,'quantity',p_quantity,'warehouse_id',p_warehouse_id));
  return movement_id;
end; $$;
grant execute on function public.record_stock_movement(uuid,uuid,uuid,public.stock_movement_type,numeric,text,uuid,text,uuid) to authenticated;

create or replace function public.bootstrap_organization(p_name text,p_full_name text,p_tin text default null,p_phone text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare org_id uuid; branch_id uuid; current_user_id uuid := auth.uid();
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  select m.organization_id into org_id from public.organization_members m where m.user_id=current_user_id limit 1;
  if org_id is not null then return org_id; end if;
  insert into public.organizations(name,tin,phone,created_by) values(p_name,p_tin,p_phone,current_user_id) returning id into org_id;
  insert into public.branches(organization_id,name,code) values(org_id,'Main Branch','MAIN') returning id into branch_id;
  insert into public.organization_members(organization_id,branch_id,user_id,full_name,role) values(org_id,branch_id,current_user_id,p_full_name,'owner');
  insert into public.warehouses(organization_id,branch_id,name,code) values(org_id,branch_id,'Main Warehouse','MAIN');
  insert into public.accounts(organization_id,code,name,account_type,normal_side,is_system) values
    (org_id,'1000','Cash and Bank','asset','debit',true),(org_id,'1100','Accounts Receivable','asset','debit',true),
    (org_id,'1200','Inventory','asset','debit',true),(org_id,'2000','Accounts Payable','liability','credit',true),
    (org_id,'2100','VAT Payable','liability','credit',true),(org_id,'3000','Owner Equity','equity','credit',true),
    (org_id,'4000','Sales Revenue','revenue','credit',true),(org_id,'5000','Cost of Goods Sold','expense','debit',true),
    (org_id,'6000','Operating Expenses','expense','debit',true);
  insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,metadata) values(org_id,current_user_id,'organization.created','organization',org_id,jsonb_build_object('name',p_name));
  return org_id;
end; $$;
grant execute on function public.bootstrap_organization(text,text,text,text) to authenticated;

create or replace function public.create_sales_invoice(
  p_organization_id uuid,p_branch_id uuid,p_customer_id uuid,p_product_id uuid,p_warehouse_id uuid,
  p_quantity numeric,p_unit_price numeric,p_tax_rate numeric,p_notes text,p_actor_id uuid
) returns text language plpgsql security definer set search_path = public as $$
declare
  invoice_id uuid; invoice_no text; journal_id uuid; journal_no text; product_name text; product_cost numeric(18,2);
  subtotal numeric(18,2); tax_amount numeric(18,2); total_amount numeric(18,2); cost_total numeric(18,2);
  ar_id uuid; revenue_id uuid; vat_id uuid; inventory_id uuid; cogs_id uuid;
begin
  if p_actor_id is distinct from auth.uid() then raise exception 'Actor mismatch'; end if;
  if not public.has_org_role(p_organization_id,array['owner','admin','accountant','sales']::public.app_role[]) then raise exception 'Insufficient sales permission'; end if;
  if p_quantity <= 0 or p_unit_price < 0 or p_tax_rate < 0 or p_tax_rate > 100 then raise exception 'Invalid invoice values'; end if;
  perform 1 from public.customers where id=p_customer_id and organization_id=p_organization_id and is_active;
  if not found then raise exception 'Customer not found'; end if;
  select name,cost_price into product_name,product_cost from public.products where id=p_product_id and organization_id=p_organization_id and is_active;
  if not found then raise exception 'Product not found'; end if;
  subtotal := round(p_quantity*p_unit_price,2); tax_amount := round(subtotal*p_tax_rate/100,2); total_amount := subtotal+tax_amount; cost_total := round(p_quantity*product_cost,2);
  invoice_no := public.next_document_number(p_organization_id,'INV'); journal_no := public.next_document_number(p_organization_id,'JE');
  select id into ar_id from public.accounts where organization_id=p_organization_id and code='1100';
  select id into revenue_id from public.accounts where organization_id=p_organization_id and code='4000';
  select id into vat_id from public.accounts where organization_id=p_organization_id and code='2100';
  select id into inventory_id from public.accounts where organization_id=p_organization_id and code='1200';
  select id into cogs_id from public.accounts where organization_id=p_organization_id and code='5000';
  if ar_id is null or revenue_id is null or vat_id is null or inventory_id is null or cogs_id is null then raise exception 'Required system accounts are missing'; end if;
  insert into public.journal_entries(organization_id,branch_id,entry_number,entry_date,memo,status,source_type,created_by)
  values(p_organization_id,p_branch_id,journal_no,current_date,'Sales invoice '||invoice_no,'draft','sales_invoice',p_actor_id) returning id into journal_id;
  insert into public.journal_lines(organization_id,journal_entry_id,account_id,description,debit,credit) values
    (p_organization_id,journal_id,ar_id,'Customer receivable',total_amount,0),
    (p_organization_id,journal_id,revenue_id,'Sales revenue',0,subtotal),
    (p_organization_id,journal_id,vat_id,'Output VAT',0,tax_amount);
  if cost_total > 0 then
    insert into public.journal_lines(organization_id,journal_entry_id,account_id,description,debit,credit) values
      (p_organization_id,journal_id,cogs_id,'Cost of goods sold',cost_total,0),
      (p_organization_id,journal_id,inventory_id,'Inventory issued',0,cost_total);
  end if;
  if (select round(sum(debit),2) from public.journal_lines where journal_entry_id=journal_id) <> (select round(sum(credit),2) from public.journal_lines where journal_entry_id=journal_id) then raise exception 'Journal is not balanced'; end if;
  insert into public.sales_invoices(organization_id,branch_id,customer_id,invoice_number,status,subtotal,tax_amount,notes,journal_entry_id,created_by,posted_at)
  values(p_organization_id,p_branch_id,p_customer_id,invoice_no,'posted',subtotal,tax_amount,p_notes,journal_id,p_actor_id,now()) returning id into invoice_id;
  insert into public.sales_invoice_items(organization_id,invoice_id,product_id,warehouse_id,description,quantity,unit_price,tax_rate,line_subtotal,line_tax,cost_total)
  values(p_organization_id,invoice_id,p_product_id,p_warehouse_id,product_name,p_quantity,p_unit_price,p_tax_rate,subtotal,tax_amount,cost_total);
  perform public.record_stock_movement(p_organization_id,p_product_id,p_warehouse_id,'sale',p_quantity,invoice_no,p_actor_id,'sales_invoice',invoice_id);
  update public.journal_entries set status='posted',source_id=invoice_id,posted_by=p_actor_id,posted_at=now() where id=journal_id;
  insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,metadata) values(p_organization_id,p_actor_id,'invoice.posted','sales_invoice',invoice_id,jsonb_build_object('invoice_number',invoice_no,'total',total_amount,'journal_entry_id',journal_id));
  return invoice_no;
end; $$;
grant execute on function public.create_sales_invoice(uuid,uuid,uuid,uuid,uuid,numeric,numeric,numeric,text,uuid) to authenticated;

create or replace view public.product_stock_view with (security_invoker=true) as
select p.organization_id,p.id product_id,p.sku,p.name,p.unit_price,p.reorder_level,w.name warehouse_name,coalesce(sb.quantity,0) quantity
from public.products p cross join lateral (select w.* from public.warehouses w where w.organization_id=p.organization_id and w.is_active order by w.created_at limit 1) w
left join public.stock_balances sb on sb.organization_id=p.organization_id and sb.product_id=p.id and sb.warehouse_id=w.id where p.is_active;

create or replace view public.journal_summary_view with (security_invoker=true) as
select je.organization_id,je.id,je.entry_number,je.entry_date,je.memo,je.status,coalesce(sum(jl.debit),0) total_debit,coalesce(sum(jl.credit),0) total_credit
from public.journal_entries je left join public.journal_lines jl on jl.journal_entry_id=je.id group by je.id;

create or replace function public.get_dashboard_snapshot(target_organization_id uuid)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare result jsonb;
begin
  if not public.is_org_member(target_organization_id) then raise exception 'Access denied'; end if;
  select jsonb_build_object(
    'metrics',jsonb_build_object(
      'sales',coalesce((select sum(total) from public.sales_invoices where organization_id=target_organization_id and invoice_date=current_date and status<>'void'),0),
      'expenses',coalesce((select sum(amount) from public.payments where organization_id=target_organization_id and payment_date=current_date and payment_type='payment'),0),
      'cash',coalesce((select sum(case when a.normal_side='debit' then jl.debit-jl.credit else jl.credit-jl.debit end) from public.journal_lines jl join public.accounts a on a.id=jl.account_id where jl.organization_id=target_organization_id and a.code='1000'),0),
      'debt',coalesce((select sum(total-amount_paid) from public.sales_invoices where organization_id=target_organization_id and status in ('posted','partially_paid')),0)
    ),
    'monthlyRevenue',(select jsonb_agg(coalesce(month_total,0) order by month_start) from (select gs month_start,coalesce(sum(si.total),0) month_total from generate_series(date_trunc('month',current_date)-interval '11 months',date_trunc('month',current_date),interval '1 month') gs left join public.sales_invoices si on si.organization_id=target_organization_id and date_trunc('month',si.invoice_date)=gs and si.status<>'void' group by gs) months),
    'recentTransactions',(select coalesce(jsonb_agg(row_data order by occurred_at desc),'[]'::jsonb) from (select jsonb_build_object('id',invoice_number,'description','Sales invoice '||invoice_number,'category','Sales','date',created_at,'amount',total,'type','income') row_data,created_at occurred_at from public.sales_invoices where organization_id=target_organization_id and status<>'void' order by created_at desc limit 8) recent),
    'health',jsonb_build_object('score',86,'cashFlow','strong','expenseControl','good','debtCollection','attention')
  ) into result;
  return result;
end; $$;
grant execute on function public.get_dashboard_snapshot(uuid) to authenticated;
