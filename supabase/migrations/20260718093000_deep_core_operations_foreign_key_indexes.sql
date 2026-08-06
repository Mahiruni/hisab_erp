-- Ensure every foreign key in the deep operational modules is the leading column of an index.
do $$
declare r record; index_name text;
begin
  for r in
    with target_tables as (
      select unnest(array[
        'suppliers','purchase_requests','purchase_request_items','supplier_quotes','supplier_quote_items','purchase_orders','purchase_order_items','goods_receipts','goods_receipt_items','supplier_bills','supplier_bill_items','supplier_bill_payments','purchase_returns','purchase_return_items',
        'stock_transfers','stock_transfer_items','stock_counts','stock_count_items','inventory_adjustments','inventory_lots','inventory_serials',
        'employees','attendance_entries','leave_requests','salary_structures','payroll_runs','payroll_items'
      ]) table_name
    )
    select c.conrelid,cl.relname table_name,c.conname,c.conkey[1] attnum,a.attname column_name
    from pg_constraint c
    join pg_class cl on cl.oid=c.conrelid
    join pg_namespace n on n.oid=cl.relnamespace and n.nspname='public'
    join target_tables t on t.table_name=cl.relname
    join pg_attribute a on a.attrelid=c.conrelid and a.attnum=c.conkey[1]
    where c.contype='f'
      and not exists (
        select 1 from pg_index i
        where i.indrelid=c.conrelid
          and (i.indkey::smallint[])[array_lower(i.indkey::smallint[],1)] = c.conkey[1]
      )
  loop
    index_name:=left('idx_'||r.table_name||'_'||r.column_name,54)||'_'||substr(md5(r.conname),1,7);
    execute format('create index if not exists %I on public.%I (%I)',index_name,r.table_name,r.column_name);
  end loop;
end $$;