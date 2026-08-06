-- Atomic multi-line invoice and receipt workflows.

create or replace function public.post_sales_invoice_v2(p_organization_id uuid,p_branch_id uuid,p_customer_id uuid,p_invoice_date date,p_due_date date,p_customer_reference text,p_notes text,p_lines jsonb,p_sales_order_id uuid,p_quotation_id uuid,p_actor_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare invoice_id uuid; invoice_no text; journal_id uuid; journal_no text; line jsonb; v_product_id uuid; v_warehouse_id uuid; v_description text; v_cost_price numeric(18,2); v_quantity numeric(18,3); v_unit_price numeric(18,2); v_discount_rate numeric(7,4); v_tax_rate numeric(7,4); v_gross numeric(18,2); v_discount numeric(18,2); v_net numeric(18,2); v_tax numeric(18,2); v_cost numeric(18,2); total_gross numeric(18,2):=0; total_discount numeric(18,2):=0; total_net numeric(18,2):=0; total_tax numeric(18,2):=0; total_cost numeric(18,2):=0; ar_id uuid; revenue_id uuid; vat_id uuid; inventory_id uuid; cogs_id uuid; terms_days integer; customer_limit numeric(18,2); current_balance numeric(18,2); effective_due_date date;
begin
 if p_actor_id is distinct from auth.uid() then raise exception 'Actor mismatch'; end if;
 if not public.has_org_role(p_organization_id,array['owner','admin','accountant','sales']::public.app_role[]) then raise exception 'Insufficient sales permission'; end if;
 if p_branch_id is not null and not exists(select 1 from public.branches where id=p_branch_id and organization_id=p_organization_id and is_active) then raise exception 'Invalid branch'; end if;
 select payment_terms_days,credit_limit into terms_days,customer_limit from public.customers where id=p_customer_id and organization_id=p_organization_id and is_active; if not found then raise exception 'Customer not found'; end if;
 if p_sales_order_id is not null and not exists(select 1 from public.sales_orders where id=p_sales_order_id and organization_id=p_organization_id and customer_id=p_customer_id and status='confirmed') then raise exception 'Sales order is not available for invoicing'; end if;
 if p_quotation_id is not null and not exists(select 1 from public.sales_quotations where id=p_quotation_id and organization_id=p_organization_id and customer_id=p_customer_id) then raise exception 'Quotation not found'; end if;
 if jsonb_typeof(p_lines)<>'array' or jsonb_array_length(p_lines)=0 or jsonb_array_length(p_lines)>100 then raise exception 'Invoice requires between 1 and 100 lines'; end if;
 for line in select value from jsonb_array_elements(p_lines) loop
  v_product_id:=(line->>'productId')::uuid; v_warehouse_id:=(line->>'warehouseId')::uuid; v_quantity:=coalesce((line->>'quantity')::numeric,0); v_unit_price:=coalesce((line->>'unitPrice')::numeric,0); v_discount_rate:=coalesce((line->>'discountRate')::numeric,0); v_tax_rate:=coalesce((line->>'taxRate')::numeric,0);
  if v_quantity<=0 or v_unit_price<0 or v_discount_rate<0 or v_discount_rate>100 or v_tax_rate<0 or v_tax_rate>100 then raise exception 'Invalid invoice line'; end if;
  select name,cost_price into v_description,v_cost_price from public.products where id=v_product_id and organization_id=p_organization_id and is_active; if not found then raise exception 'Product not found'; end if;
  if not exists(select 1 from public.warehouses where id=v_warehouse_id and organization_id=p_organization_id and is_active) then raise exception 'Warehouse not found'; end if;
  if coalesce((select quantity from public.stock_balances where organization_id=p_organization_id and product_id=v_product_id and warehouse_id=v_warehouse_id),0)<v_quantity then raise exception 'Insufficient stock for %',v_description; end if;
  v_gross:=round(v_quantity*v_unit_price,2); v_discount:=round(v_gross*v_discount_rate/100,2); v_net:=v_gross-v_discount; v_tax:=round(v_net*v_tax_rate/100,2); v_cost:=round(v_quantity*v_cost_price,2);
  total_gross:=total_gross+v_gross; total_discount:=total_discount+v_discount; total_net:=total_net+v_net; total_tax:=total_tax+v_tax; total_cost:=total_cost+v_cost;
 end loop;
 select coalesce(balance,0) into current_balance from public.customer_sales_balance_view where customer_id=p_customer_id; current_balance:=coalesce(current_balance,0);
 if coalesce(customer_limit,0)>0 and current_balance+total_net+total_tax>customer_limit then raise exception 'Customer credit limit exceeded'; end if;
 effective_due_date:=coalesce(p_due_date,coalesce(p_invoice_date,current_date)+coalesce(terms_days,0)); if effective_due_date<coalesce(p_invoice_date,current_date) then raise exception 'Due date cannot be before invoice date'; end if;
 select id into ar_id from public.accounts where organization_id=p_organization_id and code='1100'; select id into revenue_id from public.accounts where organization_id=p_organization_id and code='4000'; select id into vat_id from public.accounts where organization_id=p_organization_id and code='2100'; select id into inventory_id from public.accounts where organization_id=p_organization_id and code='1200'; select id into cogs_id from public.accounts where organization_id=p_organization_id and code='5000';
 if ar_id is null or revenue_id is null or vat_id is null or inventory_id is null or cogs_id is null then raise exception 'Required system accounts are missing'; end if;
 invoice_no:=public.next_document_number(p_organization_id,'INV'); journal_no:=public.next_document_number(p_organization_id,'JE');
 insert into public.journal_entries(organization_id,branch_id,entry_number,entry_date,memo,status,source_type,created_by) values(p_organization_id,p_branch_id,journal_no,coalesce(p_invoice_date,current_date),'Sales invoice '||invoice_no,'draft','sales_invoice',p_actor_id) returning id into journal_id;
 insert into public.journal_lines(organization_id,journal_entry_id,account_id,description,debit,credit) values(p_organization_id,journal_id,ar_id,'Customer receivable',total_net+total_tax,0),(p_organization_id,journal_id,revenue_id,'Sales revenue',0,total_net);
 if total_tax>0 then insert into public.journal_lines(organization_id,journal_entry_id,account_id,description,debit,credit) values(p_organization_id,journal_id,vat_id,'Output VAT',0,total_tax); end if;
 if total_cost>0 then insert into public.journal_lines(organization_id,journal_entry_id,account_id,description,debit,credit) values(p_organization_id,journal_id,cogs_id,'Cost of goods sold',total_cost,0),(p_organization_id,journal_id,inventory_id,'Inventory issued',0,total_cost); end if;
 insert into public.sales_invoices(organization_id,branch_id,customer_id,invoice_number,invoice_date,due_date,status,subtotal,discount_amount,tax_amount,notes,journal_entry_id,created_by,posted_at,sales_order_id,quotation_id,customer_reference) values(p_organization_id,p_branch_id,p_customer_id,invoice_no,coalesce(p_invoice_date,current_date),effective_due_date,'posted',total_net,total_discount,total_tax,nullif(trim(p_notes),''),journal_id,p_actor_id,now(),p_sales_order_id,p_quotation_id,nullif(trim(p_customer_reference),'')) returning id into invoice_id;
 for line in select value from jsonb_array_elements(p_lines) loop
  v_product_id:=(line->>'productId')::uuid; v_warehouse_id:=(line->>'warehouseId')::uuid; v_quantity:=(line->>'quantity')::numeric; v_unit_price:=(line->>'unitPrice')::numeric; v_discount_rate:=coalesce((line->>'discountRate')::numeric,0); v_tax_rate:=coalesce((line->>'taxRate')::numeric,0);
  select name,cost_price into v_description,v_cost_price from public.products where id=v_product_id and organization_id=p_organization_id;
  v_gross:=round(v_quantity*v_unit_price,2); v_discount:=round(v_gross*v_discount_rate/100,2); v_net:=v_gross-v_discount; v_tax:=round(v_net*v_tax_rate/100,2); v_cost:=round(v_quantity*v_cost_price,2);
  insert into public.sales_invoice_items(organization_id,invoice_id,product_id,warehouse_id,description,quantity,unit_price,discount_rate,tax_rate,line_subtotal,line_discount,line_tax,cost_total) values(p_organization_id,invoice_id,v_product_id,v_warehouse_id,v_description,v_quantity,v_unit_price,v_discount_rate,v_tax_rate,v_gross,v_discount,v_tax,v_cost);
  perform public.record_stock_movement(p_organization_id,v_product_id,v_warehouse_id,'sale',v_quantity,invoice_no,p_actor_id,'sales_invoice',invoice_id);
 end loop;
 update public.journal_entries set status='posted',source_id=invoice_id,posted_by=p_actor_id,posted_at=now() where id=journal_id;
 if p_sales_order_id is not null then update public.sales_orders set status='invoiced',converted_invoice_id=invoice_id,updated_at=now() where id=p_sales_order_id; end if;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,metadata) values(p_organization_id,p_actor_id,'sales.invoice.posted','sales_invoice',invoice_id,jsonb_build_object('number',invoice_no,'total',total_net+total_tax,'discount',total_discount,'journal',journal_id));
 return jsonb_build_object('id',invoice_id,'number',invoice_no);
end; $$;

create or replace function public.convert_sales_order_to_invoice(p_organization_id uuid,p_sales_order_id uuid,p_invoice_date date,p_due_date date,p_actor_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare o public.sales_orders%rowtype; lines jsonb;
begin
 if p_actor_id is distinct from auth.uid() then raise exception 'Actor mismatch'; end if;
 select * into o from public.sales_orders where id=p_sales_order_id and organization_id=p_organization_id for update; if not found then raise exception 'Sales order not found'; end if;
 if o.status<>'confirmed' then raise exception 'Sales order is not available for invoicing'; end if;
 select jsonb_agg(jsonb_build_object('productId',product_id,'warehouseId',warehouse_id,'quantity',quantity,'unitPrice',unit_price,'discountRate',discount_rate,'taxRate',tax_rate) order by created_at) into lines from public.sales_order_items where sales_order_id=o.id;
 if lines is null then raise exception 'Sales order has no lines'; end if;
 return public.post_sales_invoice_v2(p_organization_id,o.branch_id,o.customer_id,p_invoice_date,p_due_date,o.customer_reference,o.notes,lines,o.id,o.quotation_id,p_actor_id);
end; $$;

create or replace function public.record_sales_receipt(p_organization_id uuid,p_branch_id uuid,p_customer_id uuid,p_invoice_id uuid,p_amount numeric,p_method text,p_payment_date date,p_reference text,p_notes text,p_actor_id uuid) returns text language plpgsql security definer set search_path='' as $$
declare cash_id uuid; ar_id uuid; customer_name text; outstanding numeric(18,2); payment_no text; net_total numeric(18,2); paid numeric(18,2);
begin
 if p_actor_id is distinct from auth.uid() then raise exception 'Actor mismatch'; end if;
 if not public.has_org_role(p_organization_id,array['owner','admin','accountant','sales']::public.app_role[]) then raise exception 'Insufficient sales permission'; end if;
 if p_amount<=0 then raise exception 'Receipt amount must be positive'; end if;
 select name into customer_name from public.customers where id=p_customer_id and organization_id=p_organization_id and is_active; if not found then raise exception 'Customer not found'; end if;
 select id into cash_id from public.accounts where organization_id=p_organization_id and code='1000'; select id into ar_id from public.accounts where organization_id=p_organization_id and code='1100'; if cash_id is null or ar_id is null then raise exception 'Cash or receivable account is missing'; end if;
 if p_invoice_id is not null then select outstanding_amount into outstanding from public.sales_invoice_balance_view where id=p_invoice_id and organization_id=p_organization_id and customer_id=p_customer_id and status in ('posted','partially_paid'); if not found then raise exception 'Open invoice not found'; end if; if p_amount>outstanding then raise exception 'Receipt exceeds invoice balance'; end if; end if;
 payment_no:=public.record_finance_payment(p_organization_id,p_branch_id,'receipt',p_amount,0,p_method,coalesce(p_payment_date,current_date),cash_id,ar_id,null,p_customer_id,p_invoice_id,customer_name,p_reference,p_notes,p_actor_id);
 if p_invoice_id is not null then select total-returned_amount,amount_paid into net_total,paid from public.sales_invoice_balance_view where id=p_invoice_id; update public.sales_invoices set status=case when paid>=net_total then 'paid'::public.invoice_status when paid>0 then 'partially_paid'::public.invoice_status else 'posted'::public.invoice_status end where id=p_invoice_id; end if;
 return payment_no;
end; $$;
