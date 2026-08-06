-- Atomic quotation and sales-order workflows.

create or replace function public.create_sales_quotation(p_organization_id uuid,p_branch_id uuid,p_customer_id uuid,p_quotation_date date,p_valid_until date,p_notes text,p_lines jsonb,p_actor_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare quotation_id uuid; quotation_no text; line jsonb; v_product_id uuid; v_warehouse_id uuid; v_description text; v_quantity numeric(18,3); v_unit_price numeric(18,2); v_discount_rate numeric(7,4); v_tax_rate numeric(7,4); v_gross numeric(18,2); v_discount numeric(18,2); v_net numeric(18,2); v_tax numeric(18,2); total_gross numeric(18,2):=0; total_discount numeric(18,2):=0; total_tax numeric(18,2):=0;
begin
 if p_actor_id is distinct from auth.uid() then raise exception 'Actor mismatch'; end if;
 if not public.has_org_role(p_organization_id,array['owner','admin','accountant','sales']::public.app_role[]) then raise exception 'Insufficient sales permission'; end if;
 if p_branch_id is not null and not exists(select 1 from public.branches where id=p_branch_id and organization_id=p_organization_id and is_active) then raise exception 'Invalid branch'; end if;
 if not exists(select 1 from public.customers where id=p_customer_id and organization_id=p_organization_id and is_active) then raise exception 'Customer not found'; end if;
 if p_valid_until is null or p_valid_until<coalesce(p_quotation_date,current_date) then raise exception 'Invalid quotation validity date'; end if;
 if jsonb_typeof(p_lines)<>'array' or jsonb_array_length(p_lines)=0 or jsonb_array_length(p_lines)>100 then raise exception 'Quotation requires between 1 and 100 lines'; end if;
 quotation_no:=public.next_document_number(p_organization_id,'QUO');
 insert into public.sales_quotations(organization_id,branch_id,customer_id,quotation_number,quotation_date,valid_until,status,notes,created_by) values(p_organization_id,p_branch_id,p_customer_id,quotation_no,coalesce(p_quotation_date,current_date),p_valid_until,'draft',nullif(trim(p_notes),''),p_actor_id) returning id into quotation_id;
 for line in select value from jsonb_array_elements(p_lines) loop
  v_product_id:=(line->>'productId')::uuid; v_warehouse_id:=nullif(line->>'warehouseId','')::uuid; v_quantity:=coalesce((line->>'quantity')::numeric,0); v_unit_price:=coalesce((line->>'unitPrice')::numeric,0); v_discount_rate:=coalesce((line->>'discountRate')::numeric,0); v_tax_rate:=coalesce((line->>'taxRate')::numeric,0);
  if v_quantity<=0 or v_unit_price<0 or v_discount_rate<0 or v_discount_rate>100 or v_tax_rate<0 or v_tax_rate>100 then raise exception 'Invalid quotation line'; end if;
  select name into v_description from public.products where id=v_product_id and organization_id=p_organization_id and is_active; if not found then raise exception 'Product not found'; end if;
  if v_warehouse_id is not null and not exists(select 1 from public.warehouses where id=v_warehouse_id and organization_id=p_organization_id and is_active) then raise exception 'Warehouse not found'; end if;
  v_gross:=round(v_quantity*v_unit_price,2); v_discount:=round(v_gross*v_discount_rate/100,2); v_net:=v_gross-v_discount; v_tax:=round(v_net*v_tax_rate/100,2);
  insert into public.sales_quotation_items(organization_id,quotation_id,product_id,warehouse_id,description,quantity,unit_price,discount_rate,tax_rate,line_subtotal,line_discount,line_tax) values(p_organization_id,quotation_id,v_product_id,v_warehouse_id,v_description,v_quantity,v_unit_price,v_discount_rate,v_tax_rate,v_gross,v_discount,v_tax);
  total_gross:=total_gross+v_gross; total_discount:=total_discount+v_discount; total_tax:=total_tax+v_tax;
 end loop;
 update public.sales_quotations set subtotal=total_gross,discount_amount=total_discount,tax_amount=total_tax where id=quotation_id;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,metadata) values(p_organization_id,p_actor_id,'sales.quotation.created','sales_quotation',quotation_id,jsonb_build_object('number',quotation_no,'total',total_gross-total_discount+total_tax));
 return jsonb_build_object('id',quotation_id,'number',quotation_no);
end; $$;

create or replace function public.set_sales_quotation_status(p_organization_id uuid,p_quotation_id uuid,p_status text,p_actor_id uuid) returns text language plpgsql security definer set search_path='' as $$
declare quotation_no text; current_status text;
begin
 if p_actor_id is distinct from auth.uid() then raise exception 'Actor mismatch'; end if;
 if not public.has_org_role(p_organization_id,array['owner','admin','accountant','sales']::public.app_role[]) then raise exception 'Insufficient sales permission'; end if;
 if p_status not in ('draft','sent','accepted','rejected','expired') then raise exception 'Invalid quotation status'; end if;
 select quotation_number,status into quotation_no,current_status from public.sales_quotations where id=p_quotation_id and organization_id=p_organization_id for update; if not found then raise exception 'Quotation not found'; end if;
 if current_status='converted' then raise exception 'Converted quotations cannot be changed'; end if;
 update public.sales_quotations set status=p_status,updated_at=now() where id=p_quotation_id;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,metadata) values(p_organization_id,p_actor_id,'sales.quotation.status_changed','sales_quotation',p_quotation_id,jsonb_build_object('number',quotation_no,'from',current_status,'to',p_status));
 return quotation_no;
end; $$;

create or replace function public.create_sales_order(p_organization_id uuid,p_branch_id uuid,p_customer_id uuid,p_order_date date,p_expected_date date,p_customer_reference text,p_notes text,p_lines jsonb,p_actor_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare order_id uuid; order_no text; line jsonb; v_product_id uuid; v_warehouse_id uuid; v_description text; v_quantity numeric(18,3); v_unit_price numeric(18,2); v_discount_rate numeric(7,4); v_tax_rate numeric(7,4); v_gross numeric(18,2); v_discount numeric(18,2); v_net numeric(18,2); v_tax numeric(18,2); total_gross numeric(18,2):=0; total_discount numeric(18,2):=0; total_tax numeric(18,2):=0;
begin
 if p_actor_id is distinct from auth.uid() then raise exception 'Actor mismatch'; end if;
 if not public.has_org_role(p_organization_id,array['owner','admin','accountant','sales']::public.app_role[]) then raise exception 'Insufficient sales permission'; end if;
 if p_branch_id is not null and not exists(select 1 from public.branches where id=p_branch_id and organization_id=p_organization_id and is_active) then raise exception 'Invalid branch'; end if;
 if not exists(select 1 from public.customers where id=p_customer_id and organization_id=p_organization_id and is_active) then raise exception 'Customer not found'; end if;
 if p_expected_date is not null and p_expected_date<coalesce(p_order_date,current_date) then raise exception 'Invalid expected date'; end if;
 if jsonb_typeof(p_lines)<>'array' or jsonb_array_length(p_lines)=0 or jsonb_array_length(p_lines)>100 then raise exception 'Order requires between 1 and 100 lines'; end if;
 order_no:=public.next_document_number(p_organization_id,'SO');
 insert into public.sales_orders(organization_id,branch_id,customer_id,order_number,order_date,expected_date,status,customer_reference,notes,created_by) values(p_organization_id,p_branch_id,p_customer_id,order_no,coalesce(p_order_date,current_date),p_expected_date,'confirmed',nullif(trim(p_customer_reference),''),nullif(trim(p_notes),''),p_actor_id) returning id into order_id;
 for line in select value from jsonb_array_elements(p_lines) loop
  v_product_id:=(line->>'productId')::uuid; v_warehouse_id:=(line->>'warehouseId')::uuid; v_quantity:=coalesce((line->>'quantity')::numeric,0); v_unit_price:=coalesce((line->>'unitPrice')::numeric,0); v_discount_rate:=coalesce((line->>'discountRate')::numeric,0); v_tax_rate:=coalesce((line->>'taxRate')::numeric,0);
  if v_quantity<=0 or v_unit_price<0 or v_discount_rate<0 or v_discount_rate>100 or v_tax_rate<0 or v_tax_rate>100 then raise exception 'Invalid order line'; end if;
  select name into v_description from public.products where id=v_product_id and organization_id=p_organization_id and is_active; if not found then raise exception 'Product not found'; end if;
  if not exists(select 1 from public.warehouses where id=v_warehouse_id and organization_id=p_organization_id and is_active) then raise exception 'Warehouse not found'; end if;
  v_gross:=round(v_quantity*v_unit_price,2); v_discount:=round(v_gross*v_discount_rate/100,2); v_net:=v_gross-v_discount; v_tax:=round(v_net*v_tax_rate/100,2);
  insert into public.sales_order_items(organization_id,sales_order_id,product_id,warehouse_id,description,quantity,unit_price,discount_rate,tax_rate,line_subtotal,line_discount,line_tax) values(p_organization_id,order_id,v_product_id,v_warehouse_id,v_description,v_quantity,v_unit_price,v_discount_rate,v_tax_rate,v_gross,v_discount,v_tax);
  total_gross:=total_gross+v_gross; total_discount:=total_discount+v_discount; total_tax:=total_tax+v_tax;
 end loop;
 update public.sales_orders set subtotal=total_gross,discount_amount=total_discount,tax_amount=total_tax where id=order_id;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,metadata) values(p_organization_id,p_actor_id,'sales.order.created','sales_order',order_id,jsonb_build_object('number',order_no,'total',total_gross-total_discount+total_tax));
 return jsonb_build_object('id',order_id,'number',order_no);
end; $$;

create or replace function public.convert_sales_quotation_to_order(p_organization_id uuid,p_quotation_id uuid,p_order_date date,p_expected_date date,p_actor_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare q public.sales_quotations%rowtype; order_id uuid; order_no text;
begin
 if p_actor_id is distinct from auth.uid() then raise exception 'Actor mismatch'; end if;
 if not public.has_org_role(p_organization_id,array['owner','admin','accountant','sales']::public.app_role[]) then raise exception 'Insufficient sales permission'; end if;
 select * into q from public.sales_quotations where id=p_quotation_id and organization_id=p_organization_id for update; if not found then raise exception 'Quotation not found'; end if;
 if q.status in ('rejected','expired','converted') then raise exception 'Quotation cannot be converted'; end if;
 if p_expected_date is not null and p_expected_date<coalesce(p_order_date,current_date) then raise exception 'Invalid expected date'; end if;
 order_no:=public.next_document_number(p_organization_id,'SO');
 insert into public.sales_orders(organization_id,branch_id,customer_id,quotation_id,order_number,order_date,expected_date,status,subtotal,discount_amount,tax_amount,currency,notes,created_by) values(q.organization_id,q.branch_id,q.customer_id,q.id,order_no,coalesce(p_order_date,current_date),p_expected_date,'confirmed',q.subtotal,q.discount_amount,q.tax_amount,q.currency,q.notes,p_actor_id) returning id into order_id;
 insert into public.sales_order_items(organization_id,sales_order_id,product_id,warehouse_id,description,quantity,unit_price,discount_rate,tax_rate,line_subtotal,line_discount,line_tax)
 select organization_id,order_id,product_id,coalesce(warehouse_id,(select id from public.warehouses w where w.organization_id=p_organization_id and w.is_active order by created_at limit 1)),description,quantity,unit_price,discount_rate,tax_rate,line_subtotal,line_discount,line_tax from public.sales_quotation_items where quotation_id=q.id;
 if not found then raise exception 'Quotation has no lines'; end if;
 update public.sales_quotations set status='converted',converted_order_id=order_id,updated_at=now() where id=q.id;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,metadata) values(p_organization_id,p_actor_id,'sales.quotation.converted','sales_order',order_id,jsonb_build_object('quotation',q.quotation_number,'order',order_no));
 return jsonb_build_object('id',order_id,'number',order_no);
end; $$;
