-- Read model and RPC permission hardening for Sales & Invoicing.

create or replace function public.get_sales_snapshot(target_organization_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb; month_start date:=date_trunc('month',current_date)::date;
begin
 if not public.is_org_member(target_organization_id) then raise exception 'Access denied'; end if;
 select jsonb_build_object(
  'metrics',jsonb_build_object(
   'activeQuotations',(select count(*) from public.sales_quotations where organization_id=target_organization_id and status in ('draft','sent','accepted')),
   'openOrders',(select count(*) from public.sales_orders where organization_id=target_organization_id and status='confirmed'),
   'invoicedThisMonth',coalesce((select sum(total) from public.sales_invoices where organization_id=target_organization_id and invoice_date>=month_start and status<>'void'),0),
   'receivedThisMonth',coalesce((select sum(amount) from public.payments where organization_id=target_organization_id and payment_type='receipt' and status='posted' and payment_date>=month_start),0),
   'returnsThisMonth',coalesce((select sum(total) from public.sales_returns where organization_id=target_organization_id and status='posted' and return_date>=month_start),0),
   'outstanding',coalesce((select sum(outstanding_amount) from public.sales_invoice_balance_view where organization_id=target_organization_id and status<>'void'),0)
  ),
  'quotations',coalesce((select jsonb_agg(jsonb_build_object('id',q.id,'number',q.quotation_number,'date',q.quotation_date,'validUntil',q.valid_until,'status',q.status,'customerId',q.customer_id,'customerName',c.name,'subtotal',q.subtotal,'discount',q.discount_amount,'tax',q.tax_amount,'total',q.total,'notes',q.notes) order by q.quotation_date desc,q.created_at desc) from (select * from public.sales_quotations where organization_id=target_organization_id order by quotation_date desc,created_at desc limit 50) q join public.customers c on c.id=q.customer_id),'[]'::jsonb),
  'orders',coalesce((select jsonb_agg(jsonb_build_object('id',o.id,'number',o.order_number,'date',o.order_date,'expectedDate',o.expected_date,'status',o.status,'customerId',o.customer_id,'customerName',c.name,'quotationId',o.quotation_id,'subtotal',o.subtotal,'discount',o.discount_amount,'tax',o.tax_amount,'total',o.total,'customerReference',o.customer_reference) order by o.order_date desc,o.created_at desc) from (select * from public.sales_orders where organization_id=target_organization_id order by order_date desc,created_at desc limit 50) o join public.customers c on c.id=o.customer_id),'[]'::jsonb),
  'invoices',coalesce((select jsonb_agg(jsonb_build_object('id',i.id,'number',i.invoice_number,'date',i.invoice_date,'dueDate',i.due_date,'status',i.status,'customerId',i.customer_id,'customerName',c.name,'orderId',i.sales_order_id,'subtotal',i.subtotal,'discount',i.discount_amount,'tax',i.tax_amount,'total',i.total,'paid',i.amount_paid,'returned',i.returned_amount,'outstanding',i.outstanding_amount,'credit',i.customer_credit,'items',(select coalesce(jsonb_agg(jsonb_build_object('id',ii.id,'productId',ii.product_id,'description',ii.description,'warehouseId',ii.warehouse_id,'quantity',ii.quantity,'unitPrice',ii.unit_price,'taxRate',ii.tax_rate,'lineTotal',ii.line_subtotal-ii.line_discount+ii.line_tax,'returnedQuantity',coalesce(rr.quantity,0),'returnableQuantity',greatest(ii.quantity-coalesce(rr.quantity,0),0)) order by ii.id),'[]'::jsonb) from public.sales_invoice_items ii left join (select sri.invoice_item_id,sum(sri.quantity) quantity from public.sales_return_items sri join public.sales_returns sr on sr.id=sri.sales_return_id and sr.status='posted' group by sri.invoice_item_id) rr on rr.invoice_item_id=ii.id where ii.invoice_id=i.id)) order by i.invoice_date desc) from (select * from public.sales_invoice_balance_view where organization_id=target_organization_id order by invoice_date desc limit 50) i join public.customers c on c.id=i.customer_id),'[]'::jsonb),
  'receipts',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'number',p.payment_number,'date',p.payment_date,'customerId',p.customer_id,'customerName',coalesce(c.name,p.counterparty_name),'invoiceId',p.invoice_id,'amount',p.amount,'method',p.method,'reference',p.reference,'status',p.status) order by p.payment_date desc,p.created_at desc) from (select * from public.payments where organization_id=target_organization_id and payment_type='receipt' order by payment_date desc,created_at desc limit 50) p left join public.customers c on c.id=p.customer_id),'[]'::jsonb),
  'returns',coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'number',r.return_number,'date',r.return_date,'invoiceId',r.invoice_id,'invoiceNumber',i.invoice_number,'customerId',r.customer_id,'customerName',c.name,'subtotal',r.subtotal,'tax',r.tax_amount,'total',r.total,'reason',r.reason,'status',r.status) order by r.return_date desc,r.created_at desc) from (select * from public.sales_returns where organization_id=target_organization_id order by return_date desc,created_at desc limit 50) r join public.sales_invoices i on i.id=r.invoice_id join public.customers c on c.id=r.customer_id),'[]'::jsonb),
  'customers',coalesce((select jsonb_agg(jsonb_build_object('id',b.customer_id,'name',b.name,'email',b.email,'phone',b.phone,'tin',b.tin,'creditLimit',b.credit_limit,'paymentTermsDays',b.payment_terms_days,'invoiced',b.invoiced,'received',b.received,'returned',b.returned,'balance',b.balance,'availableCredit',b.available_credit) order by b.name) from public.customer_sales_balance_view b where b.organization_id=target_organization_id),'[]'::jsonb),
  'products',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'sku',p.sku,'name',p.name,'unitPrice',p.unit_price,'warehouseId',w.id,'warehouseName',w.name,'quantity',coalesce(sb.quantity,0)) order by p.name,w.name) from public.products p join public.warehouses w on w.organization_id=p.organization_id and w.is_active left join public.stock_balances sb on sb.organization_id=p.organization_id and sb.product_id=p.id and sb.warehouse_id=w.id where p.organization_id=target_organization_id and p.is_active),'[]'::jsonb)
 ) into result;
 return result;
end; $$;

revoke all on function public.create_sales_quotation(uuid,uuid,uuid,date,date,text,jsonb,uuid) from public,anon;
revoke all on function public.set_sales_quotation_status(uuid,uuid,text,uuid) from public,anon;
revoke all on function public.create_sales_order(uuid,uuid,uuid,date,date,text,text,jsonb,uuid) from public,anon;
revoke all on function public.convert_sales_quotation_to_order(uuid,uuid,date,date,uuid) from public,anon;
revoke all on function public.post_sales_invoice_v2(uuid,uuid,uuid,date,date,text,text,jsonb,uuid,uuid,uuid) from public,anon;
revoke all on function public.convert_sales_order_to_invoice(uuid,uuid,date,date,uuid) from public,anon;
revoke all on function public.record_sales_receipt(uuid,uuid,uuid,uuid,numeric,text,date,text,text,uuid) from public,anon;
revoke all on function public.post_sales_return(uuid,uuid,uuid,numeric,date,text,uuid) from public,anon;
revoke all on function public.get_sales_snapshot(uuid) from public,anon;
grant execute on function public.create_sales_quotation(uuid,uuid,uuid,date,date,text,jsonb,uuid) to authenticated;
grant execute on function public.set_sales_quotation_status(uuid,uuid,text,uuid) to authenticated;
grant execute on function public.create_sales_order(uuid,uuid,uuid,date,date,text,text,jsonb,uuid) to authenticated;
grant execute on function public.convert_sales_quotation_to_order(uuid,uuid,date,date,uuid) to authenticated;
grant execute on function public.post_sales_invoice_v2(uuid,uuid,uuid,date,date,text,text,jsonb,uuid,uuid,uuid) to authenticated;
grant execute on function public.convert_sales_order_to_invoice(uuid,uuid,date,date,uuid) to authenticated;
grant execute on function public.record_sales_receipt(uuid,uuid,uuid,uuid,numeric,text,date,text,text,uuid) to authenticated;
grant execute on function public.post_sales_return(uuid,uuid,uuid,numeric,date,text,uuid) to authenticated;
grant execute on function public.get_sales_snapshot(uuid) to authenticated;
