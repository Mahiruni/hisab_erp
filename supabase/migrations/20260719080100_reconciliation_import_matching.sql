create or replace function public.upsert_reconciliation_source(
  p_organization_id uuid,p_source_id uuid,p_branch_id uuid,p_source_type text,p_provider text,p_name text,
  p_bank_account_id uuid,p_ledger_account_id uuid,p_fee_account_id uuid,p_withholding_account_id uuid,p_suspense_account_id uuid,
  p_currency text,p_environment text,p_status text,p_external_account_reference text,p_merchant_reference text,
  p_auto_match boolean,p_amount_tolerance numeric,p_date_tolerance_days integer,p_notes text,p_actor_id uuid
) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_id uuid; v_currency text:=upper(trim(coalesce(p_currency,'ETB')));
begin
  if p_actor_id is distinct from auth.uid() then raise exception 'Actor mismatch'; end if;
  if not public.has_org_role(p_organization_id,array['owner','admin','accountant']::public.app_role[]) then raise exception 'Insufficient reconciliation configuration permission'; end if;
  if p_source_type not in ('bank','telebirr','mpesa') then raise exception 'Invalid reconciliation source type'; end if;
  if p_provider not in ('manual_csv','bank_statement','telebirr','safaricom_daraja') then raise exception 'Invalid reconciliation provider'; end if;
  if (p_source_type='telebirr' and p_provider<>'telebirr') or (p_source_type='mpesa' and p_provider<>'safaricom_daraja') then raise exception 'Provider does not match source type'; end if;
  if length(trim(coalesce(p_name,'')))<2 then raise exception 'Source name is required'; end if;
  if length(v_currency)<>3 then raise exception 'Currency must use a three-letter code'; end if;
  if p_environment not in ('sandbox','production') or p_status not in ('draft','ready','suspended') then raise exception 'Invalid source state'; end if;
  if coalesce(p_amount_tolerance,0)<0 or coalesce(p_date_tolerance_days,0) not between 0 and 31 then raise exception 'Invalid matching tolerance'; end if;
  if p_branch_id is not null and not exists(select 1 from public.branches where id=p_branch_id and organization_id=p_organization_id and is_active) then raise exception 'Invalid branch'; end if;
  if p_bank_account_id is not null and not exists(select 1 from public.bank_accounts where id=p_bank_account_id and organization_id=p_organization_id and is_active) then raise exception 'Invalid bank account'; end if;
  if not exists(select 1 from public.accounts where id=p_ledger_account_id and organization_id=p_organization_id and is_active and account_type='asset' and trim(currency)=v_currency) then raise exception 'Ledger account must be an active asset account in the source currency'; end if;
  if p_fee_account_id is not null and not exists(select 1 from public.accounts where id=p_fee_account_id and organization_id=p_organization_id and is_active) then raise exception 'Invalid fee account'; end if;
  if p_withholding_account_id is not null and not exists(select 1 from public.accounts where id=p_withholding_account_id and organization_id=p_organization_id and is_active) then raise exception 'Invalid withholding account'; end if;
  if not exists(select 1 from public.accounts where id=p_suspense_account_id and organization_id=p_organization_id and is_active) then raise exception 'Invalid suspense account'; end if;
  if p_status='ready' and p_source_type in ('telebirr','mpesa') and length(trim(coalesce(p_external_account_reference,'')))<2 then raise exception 'Provider account or shortcode reference is required before activation'; end if;

  insert into public.reconciliation_sources(id,organization_id,branch_id,source_type,provider,name,bank_account_id,ledger_account_id,fee_account_id,withholding_account_id,suspense_account_id,currency,environment,status,external_account_reference,merchant_reference,auto_match,amount_tolerance,date_tolerance_days,notes,created_by,updated_at)
  values(coalesce(p_source_id,gen_random_uuid()),p_organization_id,p_branch_id,p_source_type,p_provider,trim(p_name),p_bank_account_id,p_ledger_account_id,p_fee_account_id,p_withholding_account_id,p_suspense_account_id,v_currency,p_environment,p_status,nullif(trim(p_external_account_reference),''),nullif(trim(p_merchant_reference),''),coalesce(p_auto_match,true),coalesce(p_amount_tolerance,0.01),coalesce(p_date_tolerance_days,5),nullif(trim(p_notes),''),p_actor_id,now())
  on conflict (id) do update set branch_id=excluded.branch_id,source_type=excluded.source_type,provider=excluded.provider,name=excluded.name,bank_account_id=excluded.bank_account_id,ledger_account_id=excluded.ledger_account_id,fee_account_id=excluded.fee_account_id,withholding_account_id=excluded.withholding_account_id,suspense_account_id=excluded.suspense_account_id,currency=excluded.currency,environment=excluded.environment,status=excluded.status,external_account_reference=excluded.external_account_reference,merchant_reference=excluded.merchant_reference,auto_match=excluded.auto_match,amount_tolerance=excluded.amount_tolerance,date_tolerance_days=excluded.date_tolerance_days,notes=excluded.notes,updated_at=now()
  where reconciliation_sources.organization_id=p_organization_id returning id into v_id;
  if v_id is null then raise exception 'Reconciliation source not found in this organization'; end if;
  insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,metadata) values(p_organization_id,p_actor_id,'reconciliation.source.saved','reconciliation_source',v_id,jsonb_build_object('type',p_source_type,'provider',p_provider,'status',p_status,'environment',p_environment));
  return jsonb_build_object('id',v_id,'status',p_status);
end $$;

create or replace function public.run_reconciliation_matching(p_organization_id uuid,p_source_id uuid,p_actor_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare t public.reconciliation_transactions%rowtype; s public.reconciliation_sources%rowtype; v_target uuid; v_conf numeric; v_reason text; v_count integer:=0; v_role text;
begin
  v_role:=current_setting('request.jwt.claim.role',true);
  if v_role<>'service_role' then
    if p_actor_id is distinct from auth.uid() then raise exception 'Actor mismatch'; end if;
    if not public.has_org_role(p_organization_id,array['owner','admin','accountant','sales','manager']::public.app_role[]) then raise exception 'Insufficient reconciliation permission'; end if;
  end if;
  select * into s from public.reconciliation_sources where id=p_source_id and organization_id=p_organization_id;
  if not found then raise exception 'Reconciliation source not found'; end if;
  if not s.auto_match then return jsonb_build_object('suggested',0); end if;
  for t in select * from public.reconciliation_transactions where organization_id=p_organization_id and source_id=p_source_id and status in ('unmatched','suggested') order by transaction_date,id for update loop
    v_target:=null; v_conf:=null; v_reason:=null;
    if t.direction='credit' then
      select q.id,q.confidence,q.reason into v_target,v_conf,v_reason from (
        select i.id,
          case when upper(coalesce(t.statement_reference,'')||' '||coalesce(t.provider_order_id,'')||' '||coalesce(t.narrative,'')) like '%'||upper(i.invoice_number)||'%' then 0.9900
            when nullif(trim(i.customer_reference),'') is not null and upper(coalesce(t.statement_reference,'')||' '||coalesce(t.provider_order_id,'')||' '||coalesce(t.narrative,'')) like '%'||upper(i.customer_reference)||'%' then 0.9700
            when abs(i.outstanding_amount-(t.cash_amount+t.fee_amount+t.withholding_amount))<=s.amount_tolerance and (nullif(regexp_replace(coalesce(c.phone,''),'\D','','g'),'')=nullif(regexp_replace(coalesce(t.counterparty_phone,''),'\D','','g'),'') or upper(coalesce(t.counterparty_name,'')) like '%'||upper(c.name)||'%' or upper(c.name) like '%'||upper(coalesce(t.counterparty_name,''))||'%') then 0.9200 else 0.7800 end confidence,
          case when upper(coalesce(t.statement_reference,'')||' '||coalesce(t.provider_order_id,'')||' '||coalesce(t.narrative,'')) like '%'||upper(i.invoice_number)||'%' then 'Invoice number found in transaction reference'
            when nullif(trim(i.customer_reference),'') is not null and upper(coalesce(t.statement_reference,'')||' '||coalesce(t.provider_order_id,'')||' '||coalesce(t.narrative,'')) like '%'||upper(i.customer_reference)||'%' then 'Customer reference found in transaction'
            when abs(i.outstanding_amount-(t.cash_amount+t.fee_amount+t.withholding_amount))<=s.amount_tolerance then 'Amount and customer identity match' else 'Unique open invoice amount match' end reason
        from public.sales_invoice_balance_view i join public.customers c on c.id=i.customer_id
        where i.organization_id=p_organization_id and i.status in ('posted','partially_paid') and i.outstanding_amount>0
          and trim(coalesce((select currency from public.sales_invoices si where si.id=i.id),'ETB'))=trim(t.currency)
          and abs(i.outstanding_amount-(t.cash_amount+t.fee_amount+t.withholding_amount))<=greatest(s.amount_tolerance,0.01)
          and abs(i.invoice_date-t.transaction_date)<=s.date_tolerance_days order by confidence desc,i.invoice_date desc limit 1
      ) q;
      if v_target is not null then update public.reconciliation_transactions set status='suggested',suggested_target_type='sales_invoice',suggested_target_id=v_target,suggestion_confidence=v_conf,suggestion_reason=v_reason,updated_at=now() where id=t.id; v_count:=v_count+1; end if;
    else
      select q.id,q.confidence,q.reason into v_target,v_conf,v_reason from (
        select b.id,
          case when upper(coalesce(t.statement_reference,'')||' '||coalesce(t.provider_order_id,'')||' '||coalesce(t.narrative,'')) like '%'||upper(b.bill_number)||'%' then 0.9900
            when nullif(trim(b.supplier_invoice_number),'') is not null and upper(coalesce(t.statement_reference,'')||' '||coalesce(t.provider_order_id,'')||' '||coalesce(t.narrative,'')) like '%'||upper(b.supplier_invoice_number)||'%' then 0.9700
            when abs((b.total-b.credited_amount-b.paid_amount)-greatest(t.cash_amount-t.fee_amount+t.withholding_amount,0))<=s.amount_tolerance and upper(coalesce(t.counterparty_name,'')) like '%'||upper(sp.name)||'%' then 0.9200 else 0.7800 end confidence,
          case when upper(coalesce(t.statement_reference,'')||' '||coalesce(t.provider_order_id,'')||' '||coalesce(t.narrative,'')) like '%'||upper(b.bill_number)||'%' then 'Supplier bill number found in transaction reference'
            when nullif(trim(b.supplier_invoice_number),'') is not null and upper(coalesce(t.statement_reference,'')||' '||coalesce(t.provider_order_id,'')||' '||coalesce(t.narrative,'')) like '%'||upper(b.supplier_invoice_number)||'%' then 'Supplier invoice reference found in transaction'
            when upper(coalesce(t.counterparty_name,'')) like '%'||upper(sp.name)||'%' then 'Amount and supplier identity match' else 'Unique open supplier bill amount match' end reason
        from public.supplier_bills b join public.suppliers sp on sp.id=b.supplier_id
        where b.organization_id=p_organization_id and b.status in ('posted','partially_paid') and b.total-b.credited_amount-b.paid_amount>0
          and abs((b.total-b.credited_amount-b.paid_amount)-greatest(t.cash_amount-t.fee_amount+t.withholding_amount,0))<=greatest(s.amount_tolerance,0.01)
          and abs(b.bill_date-t.transaction_date)<=s.date_tolerance_days order by confidence desc,b.bill_date desc limit 1
      ) q;
      if v_target is not null then update public.reconciliation_transactions set status='suggested',suggested_target_type='supplier_bill',suggested_target_id=v_target,suggestion_confidence=v_conf,suggestion_reason=v_reason,updated_at=now() where id=t.id; v_count:=v_count+1; end if;
    end if;
  end loop;
  return jsonb_build_object('suggested',v_count);
end $$;

create or replace function public.import_reconciliation_batch(p_organization_id uuid,p_source_id uuid,p_filename text,p_file_hash text,p_period_start date,p_period_end date,p_opening_balance numeric,p_closing_balance numeric,p_rows jsonb,p_actor_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.reconciliation_sources%rowtype; v_batch uuid; r jsonb; v_key text; v_inserted integer:=0; v_duplicates integer:=0; v_credit numeric:=0; v_debit numeric:=0; v_amount numeric; v_direction text; v_row_count integer; v_transaction_id uuid;
begin
  if p_actor_id is distinct from auth.uid() then raise exception 'Actor mismatch'; end if;
  if not public.has_org_role(p_organization_id,array['owner','admin','accountant','sales','manager']::public.app_role[]) then raise exception 'Insufficient reconciliation import permission'; end if;
  select * into s from public.reconciliation_sources where id=p_source_id and organization_id=p_organization_id and status='ready';
  if not found then raise exception 'Activate the reconciliation source before importing'; end if;
  if jsonb_typeof(p_rows)<>'array' then raise exception 'Statement rows must be an array'; end if;
  v_row_count:=jsonb_array_length(p_rows);
  if v_row_count=0 or v_row_count>5000 then raise exception 'A statement import must contain between 1 and 5000 rows'; end if;
  if nullif(trim(p_file_hash),'') is not null and exists(select 1 from public.reconciliation_import_batches where organization_id=p_organization_id and source_id=p_source_id and file_hash=p_file_hash and status='completed') then raise exception 'This statement file was already imported'; end if;
  insert into public.reconciliation_import_batches(organization_id,source_id,batch_type,original_filename,file_hash,period_start,period_end,opening_balance,closing_balance,status,row_count,created_by)
  values(p_organization_id,p_source_id,'statement',nullif(trim(p_filename),''),nullif(trim(p_file_hash),''),p_period_start,p_period_end,p_opening_balance,p_closing_balance,'processing',v_row_count,p_actor_id) returning id into v_batch;
  for r in select value from jsonb_array_elements(p_rows) loop
    v_direction:=lower(coalesce(r->>'direction','')); v_amount:=round(coalesce((r->>'cashAmount')::numeric,0),2);
    if v_direction not in ('credit','debit') or v_amount<=0 then raise exception 'Every statement row requires a direction and positive cash amount'; end if;
    if upper(trim(coalesce(r->>'currency',s.currency::text)))<>trim(s.currency) then raise exception 'Statement currency does not match the source currency'; end if;
    v_key:=nullif(trim(r->>'idempotencyKey'),'');
    if v_key is null then v_key:=encode(digest(concat_ws('|',p_source_id::text,r->>'providerTransactionId',r->>'transactionDate',v_direction,v_amount::text,r->>'statementReference',r->>'narrative'),'sha256'),'hex'); end if;
    v_transaction_id:=null;
    insert into public.reconciliation_transactions(organization_id,source_id,batch_id,source_channel,direction,transaction_date,transaction_time,value_date,provider_transaction_id,provider_order_id,statement_reference,counterparty_name,counterparty_phone,counterparty_account_masked,narrative,currency,cash_amount,fee_amount,withholding_amount,idempotency_key,payload_hash,raw_payload)
    values(p_organization_id,p_source_id,v_batch,'csv',v_direction,(r->>'transactionDate')::date,nullif(r->>'transactionTime','')::timestamptz,nullif(r->>'valueDate','')::date,nullif(trim(r->>'providerTransactionId'),''),nullif(trim(r->>'providerOrderId'),''),nullif(trim(r->>'statementReference'),''),nullif(trim(r->>'counterpartyName'),''),nullif(trim(r->>'counterpartyPhone'),''),nullif(trim(r->>'counterpartyAccountMasked'),''),nullif(trim(r->>'narrative'),''),upper(trim(coalesce(r->>'currency',s.currency::text))),v_amount,round(coalesce((r->>'feeAmount')::numeric,0),2),round(coalesce((r->>'withholdingAmount')::numeric,0),2),v_key,encode(digest(coalesce(r->'raw',r)::text,'sha256'),'hex'),coalesce(r->'raw',r))
    on conflict (organization_id,source_id,idempotency_key) do nothing returning id into v_transaction_id;
    if v_transaction_id is null then v_duplicates:=v_duplicates+1; else v_inserted:=v_inserted+1; if v_direction='credit' then v_credit:=v_credit+v_amount; else v_debit:=v_debit+v_amount; end if; insert into public.reconciliation_events(organization_id,transaction_id,event_type,actor_id,details) values(p_organization_id,v_transaction_id,'transaction.imported',p_actor_id,jsonb_build_object('batchId',v_batch,'file',p_filename)); end if;
  end loop;
  update public.reconciliation_import_batches set status='completed',imported_count=v_inserted,duplicate_count=v_duplicates,total_credit=v_credit,total_debit=v_debit,completed_at=now() where id=v_batch;
  perform public.run_reconciliation_matching(p_organization_id,p_source_id,p_actor_id);
  insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,metadata) values(p_organization_id,p_actor_id,'reconciliation.statement.imported','reconciliation_batch',v_batch,jsonb_build_object('rows',v_row_count,'imported',v_inserted,'duplicates',v_duplicates,'credits',v_credit,'debits',v_debit));
  return jsonb_build_object('id',v_batch,'rows',v_row_count,'imported',v_inserted,'duplicates',v_duplicates,'credits',v_credit,'debits',v_debit);
exception when others then if v_batch is not null then update public.reconciliation_import_batches set status='failed',error_message=sqlerrm,completed_at=now() where id=v_batch; end if; raise;
end $$;

create or replace function public.ingest_provider_reconciliation_event(p_provider text,p_external_account_reference text,p_event_id text,p_event_status text,p_provider_transaction_id text,p_provider_order_id text,p_transaction_time timestamptz,p_amount numeric,p_currency text,p_reference text,p_counterparty_name text,p_counterparty_phone text,p_payload jsonb,p_signature_valid boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.reconciliation_sources%rowtype; v_event bigint; v_tx uuid; v_hash text; v_key text; v_status text:=lower(trim(coalesce(p_event_status,'')));
begin
  if current_setting('request.jwt.claim.role',true)<>'service_role' then raise exception 'Service role required'; end if;
  if p_provider not in ('telebirr','safaricom_daraja') then raise exception 'Unsupported provider'; end if;
  select * into s from public.reconciliation_sources where provider=p_provider and external_account_reference=trim(p_external_account_reference) and status='ready' order by created_at desc limit 1;
  if not found then raise exception 'Active provider reconciliation source not found'; end if;
  v_hash:=encode(digest(coalesce(p_payload,'{}'::jsonb)::text,'sha256'),'hex');
  insert into public.reconciliation_provider_events(organization_id,source_id,provider,provider_event_id,event_status,signature_valid,payload,payload_hash)
  values(s.organization_id,s.id,p_provider,trim(p_event_id),'received',p_signature_valid,coalesce(p_payload,'{}'::jsonb),v_hash)
  on conflict (organization_id,provider,provider_event_id) do update set signature_valid=coalesce(excluded.signature_valid,reconciliation_provider_events.signature_valid) returning id,transaction_id into v_event,v_tx;
  if v_tx is not null then return jsonb_build_object('eventId',v_event,'transactionId',v_tx,'duplicate',true); end if;
  if p_signature_valid is false then update public.reconciliation_provider_events set event_status='rejected',error_message='Callback token or signature validation failed',processed_at=now() where id=v_event; raise exception 'Provider callback validation failed'; end if;
  if v_status not in ('success','successful','completed','paid','0') or coalesce(p_amount,0)<=0 then update public.reconciliation_provider_events set event_status='ignored',processed_at=now() where id=v_event; return jsonb_build_object('eventId',v_event,'ignored',true); end if;
  if upper(trim(coalesce(p_currency,s.currency::text)))<>trim(s.currency) then raise exception 'Provider currency does not match source currency'; end if;
  v_key:=coalesce(nullif(trim(p_provider_transaction_id),''),trim(p_event_id));
  insert into public.reconciliation_transactions(organization_id,source_id,source_channel,direction,transaction_date,transaction_time,value_date,provider_transaction_id,provider_order_id,statement_reference,counterparty_name,counterparty_phone,narrative,currency,cash_amount,idempotency_key,payload_hash,raw_payload)
  values(s.organization_id,s.id,'callback','credit',coalesce(p_transaction_time::date,current_date),p_transaction_time,p_transaction_time::date,nullif(trim(p_provider_transaction_id),''),nullif(trim(p_provider_order_id),''),nullif(trim(p_reference),''),nullif(trim(p_counterparty_name),''),nullif(trim(p_counterparty_phone),''),concat_ws(' ',p_provider,p_reference),trim(s.currency),round(p_amount,2),v_key,v_hash,coalesce(p_payload,'{}'::jsonb))
  on conflict (organization_id,source_id,idempotency_key) do update set updated_at=now() returning id into v_tx;
  update public.reconciliation_provider_events set event_status='processed',transaction_id=v_tx,processed_at=now() where id=v_event;
  insert into public.reconciliation_events(organization_id,transaction_id,event_type,details) values(s.organization_id,v_tx,'provider.callback.received',jsonb_build_object('provider',p_provider,'eventId',p_event_id));
  perform public.run_reconciliation_matching(s.organization_id,s.id,null);
  return jsonb_build_object('eventId',v_event,'transactionId',v_tx,'duplicate',false);
end $$;

revoke all on function public.upsert_reconciliation_source(uuid,uuid,uuid,text,text,text,uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,boolean,numeric,integer,text,uuid) from public,anon;
revoke all on function public.run_reconciliation_matching(uuid,uuid,uuid) from public,anon;
revoke all on function public.import_reconciliation_batch(uuid,uuid,text,text,date,date,numeric,numeric,jsonb,uuid) from public,anon;
revoke all on function public.ingest_provider_reconciliation_event(text,text,text,text,text,text,timestamptz,numeric,text,text,text,text,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.upsert_reconciliation_source(uuid,uuid,uuid,text,text,text,uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,boolean,numeric,integer,text,uuid) to authenticated;
grant execute on function public.run_reconciliation_matching(uuid,uuid,uuid) to authenticated,service_role;
grant execute on function public.import_reconciliation_batch(uuid,uuid,text,text,date,date,numeric,numeric,jsonb,uuid) to authenticated;
grant execute on function public.ingest_provider_reconciliation_event(text,text,text,text,text,text,timestamptz,numeric,text,text,text,text,jsonb,boolean) to service_role;
