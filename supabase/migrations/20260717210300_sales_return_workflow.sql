-- Atomic customer return, credit and stock reversal workflow.

create or replace function public.post_sales_return(p_organization_id uuid,p_invoice_id uuid,p_invoice_item_id uuid,p_quantity numeric,p_return_date date,p_reason text,p_actor_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare inv public.sales_invoices%rowtype; item public.sales_invoice_items%rowtype; returned_qty numeric(18,3); return_id uuid; return_no text; journal_id uuid; journal_no text; return_subtotal numeric(18,2); return_tax numeric(18,2); return_cost numeric(18,2); net_unit numeric; tax_unit numeric; cost_unit numeric; ar_id uuid; returns_id uuid; vat_id uuid; inventory_id uuid; cogs_id uuid; net_total numeric(18,2);
begin
 if p_actor_id is distinct from auth.uid() then raise exception 'Actor mismatch'; end if;
 if not public.has_org_role(p_organization_id,array['owner','admin','accountant','sales']::public.app_role[]) then raise exception 'Insufficient sales permission'; end if;
 if p_quantity<=0 or nullif(trim(p_reason),'') is null then raise exception 'Quantity and reason are required'; end if;
 select * into inv from public.sales_invoices where id=p_invoice_id and organization_id=p_organization_id and status<>'void' for update; if not found then raise exception 'Invoice not found'; end if;
 select * into item from public.sales_invoice_items where id=p_invoice_item_id and invoice_id=inv.id and organization_id=p_organization_id; if not found then raise exception 'Invoice item not found'; end if;
 select coalesce(sum(sri.quantity),0) into returned_qty from public.sales_return_items sri join public.sales_returns sr on sr.id=sri.sales_return_id and sr.status='posted' where sri.invoice_item_id=item.id;
 if returned_qty+p_quantity>item.quantity then raise exception 'Return quantity exceeds quantity sold'; end if;
 net_unit:=item.line_subtotal/nullif(item.quantity,0)-item.line_discount/nullif(item.quantity,0); tax_unit:=item.line_tax/nullif(item.quantity,0); cost_unit:=item.cost_total/nullif(item.quantity,0);
 return_subtotal:=round(net_unit*p_quantity,2); return_tax:=round(tax_unit*p_quantity,2); return_cost:=round(cost_unit*p_quantity,2);
 select id into ar_id from public.accounts where organization_id=p_organization_id and code='1100'; select id into returns_id from public.accounts where organization_id=p_organization_id and code='4050'; select id into vat_id from public.accounts where organization_id=p_organization_id and code='2100'; select id into inventory_id from public.accounts where organization_id=p_organization_id and code='1200'; select id into cogs_id from public.accounts where organization_id=p_organization_id and code='5000';
 if ar_id is null or returns_id is null or vat_id is null or inventory_id is null or cogs_id is null then raise exception 'Required system accounts are missing'; end if;
 return_no:=public.next_document_number(p_organization_id,'RET'); journal_no:=public.next_document_number(p_organization_id,'JE');
 insert into public.journal_entries(organization_id,branch_id,entry_number,entry_date,memo,status,source_type,created_by) values(p_organization_id,inv.branch_id,journal_no,coalesce(p_return_date,current_date),'Sales return '||return_no,'draft','sales_return',p_actor_id) returning id into journal_id;
 insert into public.journal_lines(organization_id,journal_entry_id,account_id,description,debit,credit) values(p_organization_id,journal_id,returns_id,'Sales return',return_subtotal,0),(p_organization_id,journal_id,ar_id,'Customer credit',0,return_subtotal+return_tax);
 if return_tax>0 then insert into public.journal_lines(organization_id,journal_entry_id,account_id,description,debit,credit) values(p_organization_id,journal_id,vat_id,'Output VAT reversal',return_tax,0); end if;
 if return_cost>0 then insert into public.journal_lines(organization_id,journal_entry_id,account_id,description,debit,credit) values(p_organization_id,journal_id,inventory_id,'Inventory returned',return_cost,0),(p_organization_id,journal_id,cogs_id,'COGS reversal',0,return_cost); end if;
 insert into public.sales_returns(organization_id,branch_id,customer_id,invoice_id,return_number,return_date,status,resolution,subtotal,tax_amount,cost_total,reason,journal_entry_id,created_by) values(p_organization_id,inv.branch_id,inv.customer_id,inv.id,return_no,coalesce(p_return_date,current_date),'posted','customer_credit',return_subtotal,return_tax,return_cost,trim(p_reason),journal_id,p_actor_id) returning id into return_id;
 insert into public.sales_return_items(organization_id,sales_return_id,invoice_item_id,product_id,warehouse_id,description,quantity,unit_price,tax_rate,line_subtotal,line_tax,cost_total) values(p_organization_id,return_id,item.id,item.product_id,item.warehouse_id,item.description,p_quantity,item.unit_price,item.tax_rate,return_subtotal,return_tax,return_cost);
 perform public.record_stock_movement(p_organization_id,item.product_id,item.warehouse_id,'return_in',p_quantity,return_no,p_actor_id,'sales_return',return_id);
 update public.journal_entries set status='posted',source_id=return_id,posted_by=p_actor_id,posted_at=now() where id=journal_id;
 select total-returned_amount into net_total from public.sales_invoice_balance_view where id=inv.id;
 update public.sales_invoices set status=case when amount_paid>=net_total then 'paid'::public.invoice_status when amount_paid>0 then 'partially_paid'::public.invoice_status else 'posted'::public.invoice_status end where id=inv.id;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,metadata) values(p_organization_id,p_actor_id,'sales.return.posted','sales_return',return_id,jsonb_build_object('number',return_no,'invoice',inv.invoice_number,'total',return_subtotal+return_tax,'journal',journal_id));
 return jsonb_build_object('id',return_id,'number',return_no);
end; $$;
