create or replace function public.confirm_reconciliation_match(
  p_organization_id uuid,p_transaction_id uuid,p_target_type text,p_target_id uuid,p_cash_amount numeric,
  p_allocation_amount numeric,p_fee_amount numeric,p_withholding_amount numeric,p_match_reason text,p_actor_id uuid
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  t public.reconciliation_transactions%rowtype; s public.reconciliation_sources%rowtype; v_match uuid; v_journal uuid; v_journal_no text;
  v_payment uuid; v_payment_no text; v_target_account uuid; v_ar uuid; v_ap uuid; v_branch uuid; v_remaining numeric;
  v_invoice public.sales_invoices%rowtype; v_bill public.supplier_bills%rowtype; v_customer text; v_supplier text;
  v_fee numeric:=round(coalesce(p_fee_amount,0),2); v_withholding numeric:=round(coalesce(p_withholding_amount,0),2);
  v_cash numeric:=round(coalesce(p_cash_amount,0),2); v_allocation numeric:=round(coalesce(p_allocation_amount,0),2);
begin
  if p_actor_id is distinct from auth.uid() then raise exception 'Actor mismatch'; end if;
  if not public.has_org_role(p_organization_id,array['owner','admin','accountant']::public.app_role[]) then raise exception 'Owner, administrator or accountant permission required'; end if;
  if p_target_type not in ('sales_invoice','supplier_bill','account','suspense') then raise exception 'Invalid reconciliation target'; end if;
  if v_cash<=0 or v_allocation<=0 or v_fee<0 or v_withholding<0 then raise exception 'Invalid reconciliation amounts'; end if;
  select * into t from public.reconciliation_transactions where id=p_transaction_id and organization_id=p_organization_id for update;
  if not found then raise exception 'Reconciliation transaction not found'; end if;
  if t.status in ('ignored','duplicate','disputed') then raise exception 'Transaction is not available for matching'; end if;
  v_remaining:=round(t.cash_amount-t.matched_cash_amount,2);
  if v_cash>v_remaining then raise exception 'Match cash amount exceeds the unreconciled transaction balance'; end if;
  select * into s from public.reconciliation_sources where id=t.source_id and organization_id=p_organization_id and status='ready';
  if not found then raise exception 'Reconciliation source is not active'; end if;
  if v_fee>0 and s.fee_account_id is null then raise exception 'Configure a provider or bank fee account first'; end if;
  if v_withholding>0 and s.withholding_account_id is null then raise exception 'Configure a withholding account first'; end if;
  v_branch:=s.branch_id;
  if t.direction='credit' then
    if abs(v_allocation-(v_cash+v_fee+v_withholding))>0.01 then raise exception 'Incoming allocation must equal cash plus fee and withholding'; end if;
  else
    if abs(v_cash-(v_allocation+v_fee-v_withholding))>0.01 then raise exception 'Outgoing cash must equal allocation plus fee less withholding'; end if;
  end if;
  if p_target_type='sales_invoice' then
    if t.direction<>'credit' then raise exception 'Sales invoices can only be matched to incoming transactions'; end if;
    select * into v_invoice from public.sales_invoices where id=p_target_id and organization_id=p_organization_id and status in ('posted','partially_paid') for update;
    if not found then raise exception 'Open sales invoice not found'; end if;
    if trim(v_invoice.currency)<>trim(t.currency) then raise exception 'Invoice and settlement currencies do not match'; end if;
    if v_allocation>round(v_invoice.total-v_invoice.amount_paid,2) then raise exception 'Allocation exceeds invoice balance'; end if;
    select id into v_ar from public.accounts where organization_id=p_organization_id and code='1100' and is_active;
    if v_ar is null then raise exception 'Accounts receivable control account is missing'; end if;
    v_target_account:=v_ar; v_branch:=coalesce(v_invoice.branch_id,v_branch);
  elsif p_target_type='supplier_bill' then
    if t.direction<>'debit' then raise exception 'Supplier bills can only be matched to outgoing transactions'; end if;
    select * into v_bill from public.supplier_bills where id=p_target_id and organization_id=p_organization_id and status in ('posted','partially_paid') for update;
    if not found then raise exception 'Open supplier bill not found'; end if;
    if v_allocation>round(v_bill.total-v_bill.credited_amount-v_bill.paid_amount,2) then raise exception 'Allocation exceeds supplier bill balance'; end if;
    if trim(t.currency)<>'ETB' then raise exception 'Supplier bills currently post in ETB only'; end if;
    select id into v_ap from public.accounts where organization_id=p_organization_id and code='2000' and is_active;
    if v_ap is null then raise exception 'Accounts payable control account is missing'; end if;
    v_target_account:=v_ap; v_branch:=coalesce(v_bill.branch_id,v_branch);
  elsif p_target_type='suspense' then
    v_target_account:=s.suspense_account_id;
  else
    v_target_account:=p_target_id;
    if not exists(select 1 from public.accounts where id=v_target_account and organization_id=p_organization_id and is_active) then raise exception 'Target account is invalid'; end if;
  end if;
  insert into public.reconciliation_matches(organization_id,transaction_id,target_type,target_id,cash_amount,allocation_amount,fee_amount,withholding_amount,status,confidence,match_reason,created_by)
  values(p_organization_id,t.id,p_target_type,case when p_target_type='suspense' then v_target_account else p_target_id end,v_cash,v_allocation,v_fee,v_withholding,'proposed',case when t.suggested_target_id=p_target_id then t.suggestion_confidence else null end,nullif(trim(p_match_reason),''),p_actor_id) returning id into v_match;
  v_journal_no:=public.next_document_number(p_organization_id,'JE');
  insert into public.journal_entries(organization_id,branch_id,entry_number,entry_date,memo,status,source_type,source_id,created_by)
  values(p_organization_id,v_branch,v_journal_no,t.transaction_date,'Reconciliation '||coalesce(t.provider_transaction_id,t.statement_reference,t.id::text),'draft','reconciliation',v_match,p_actor_id) returning id into v_journal;
  if t.direction='credit' then
    insert into public.journal_lines(organization_id,journal_entry_id,account_id,description,debit,credit)
    values(p_organization_id,v_journal,s.ledger_account_id,'Reconciled cash received',v_cash,0),(p_organization_id,v_journal,v_target_account,'Reconciliation allocation',0,v_allocation);
    if v_fee>0 then insert into public.journal_lines(organization_id,journal_entry_id,account_id,description,debit,credit) values(p_organization_id,v_journal,s.fee_account_id,'Bank or provider fee',v_fee,0); end if;
    if v_withholding>0 then insert into public.journal_lines(organization_id,journal_entry_id,account_id,description,debit,credit) values(p_organization_id,v_journal,s.withholding_account_id,'Withholding receivable',v_withholding,0); end if;
  else
    insert into public.journal_lines(organization_id,journal_entry_id,account_id,description,debit,credit)
    values(p_organization_id,v_journal,v_target_account,'Reconciliation allocation',v_allocation,0),(p_organization_id,v_journal,s.ledger_account_id,'Reconciled cash paid',0,v_cash);
    if v_fee>0 then insert into public.journal_lines(organization_id,journal_entry_id,account_id,description,debit,credit) values(p_organization_id,v_journal,s.fee_account_id,'Bank or provider fee',v_fee,0); end if;
    if v_withholding>0 then insert into public.journal_lines(organization_id,journal_entry_id,account_id,description,debit,credit) values(p_organization_id,v_journal,s.withholding_account_id,'Withholding payable',0,v_withholding); end if;
  end if;
  if round((select sum(debit) from public.journal_lines where journal_entry_id=v_journal),2)<>round((select sum(credit) from public.journal_lines where journal_entry_id=v_journal),2) then raise exception 'Reconciliation journal is not balanced'; end if;
  if p_target_type='sales_invoice' then
    select name into v_customer from public.customers where id=v_invoice.customer_id;
    v_payment_no:=public.next_document_number(p_organization_id,'RCPT');
    insert into public.payments(organization_id,branch_id,customer_id,invoice_id,payment_number,payment_type,amount,tax_amount,method,payment_date,journal_entry_id,created_by,counterparty_name,reference,notes,status)
    values(p_organization_id,v_branch,v_invoice.customer_id,v_invoice.id,v_payment_no,'receipt',v_allocation,0,s.source_type,t.transaction_date,v_journal,p_actor_id,v_customer,coalesce(t.provider_transaction_id,t.statement_reference),concat_ws(' · ','Reconciled',nullif(t.narrative,'')),'posted') returning id into v_payment;
    update public.sales_invoices set amount_paid=amount_paid+v_allocation,status=case when round(amount_paid+v_allocation,2)>=round(total,2) then 'paid'::public.invoice_status else 'partially_paid'::public.invoice_status end where id=v_invoice.id;
  elsif p_target_type='supplier_bill' then
    select name into v_supplier from public.suppliers where id=v_bill.supplier_id;
    v_payment_no:=public.next_document_number(p_organization_id,'PAY');
    insert into public.payments(organization_id,branch_id,payment_number,payment_type,amount,tax_amount,method,payment_date,journal_entry_id,created_by,counterparty_name,reference,notes,status)
    values(p_organization_id,v_branch,v_payment_no,'payment',v_cash,0,s.source_type,t.transaction_date,v_journal,p_actor_id,v_supplier,coalesce(t.provider_transaction_id,t.statement_reference),concat_ws(' · ','Reconciled',nullif(t.narrative,'')),'posted') returning id into v_payment;
    insert into public.supplier_bill_payments(organization_id,supplier_bill_id,payment_id,amount) values(p_organization_id,v_bill.id,v_payment,v_allocation);
    update public.supplier_bills set paid_amount=paid_amount+v_allocation,status=case when round(paid_amount+v_allocation,2)>=round(total-credited_amount,2) then 'paid' else 'partially_paid' end where id=v_bill.id;
  end if;
  update public.journal_entries set status='posted',posted_by=p_actor_id,posted_at=now() where id=v_journal;
  update public.reconciliation_matches set status='confirmed',journal_entry_id=v_journal,payment_id=v_payment,confirmed_by=p_actor_id,confirmed_at=now() where id=v_match;
  update public.reconciliation_transactions set matched_cash_amount=matched_cash_amount+v_cash,status=case when round(matched_cash_amount+v_cash,2)>=round(cash_amount,2) then 'matched' else 'partially_matched' end,updated_at=now() where id=t.id;
  insert into public.reconciliation_events(organization_id,transaction_id,match_id,event_type,actor_id,details) values(p_organization_id,t.id,v_match,'match.confirmed',p_actor_id,jsonb_build_object('targetType',p_target_type,'targetId',p_target_id,'cash',v_cash,'allocation',v_allocation,'journal',v_journal_no,'payment',v_payment_no));
  insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,metadata) values(p_organization_id,p_actor_id,'reconciliation.match.confirmed','reconciliation_match',v_match,jsonb_build_object('transaction',t.id,'targetType',p_target_type,'cash',v_cash,'allocation',v_allocation,'fee',v_fee,'withholding',v_withholding,'journal',v_journal));
  return jsonb_build_object('id',v_match,'journalNumber',v_journal_no,'paymentNumber',v_payment_no,'transactionStatus',case when v_cash>=v_remaining then 'matched' else 'partially_matched' end);
end $$;

create or replace function public.reverse_reconciliation_match(p_organization_id uuid,p_match_id uuid,p_reason text,p_actor_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare m public.reconciliation_matches%rowtype; t public.reconciliation_transactions%rowtype; v_rev uuid; v_no text; v_invoice public.sales_invoices%rowtype; v_bill public.supplier_bills%rowtype;
begin
  if p_actor_id is distinct from auth.uid() then raise exception 'Actor mismatch'; end if;
  if not public.has_org_role(p_organization_id,array['owner','admin','accountant']::public.app_role[]) then raise exception 'Owner, administrator or accountant permission required'; end if;
  if length(trim(coalesce(p_reason,'')))<5 then raise exception 'Reversal reason is required'; end if;
  select * into m from public.reconciliation_matches where id=p_match_id and organization_id=p_organization_id and status='confirmed' for update;
  if not found then raise exception 'Confirmed reconciliation match not found'; end if;
  select * into t from public.reconciliation_transactions where id=m.transaction_id for update;
  v_no:=public.next_document_number(p_organization_id,'JE');
  insert into public.journal_entries(organization_id,branch_id,entry_number,entry_date,memo,status,source_type,source_id,created_by)
  select p_organization_id,je.branch_id,v_no,current_date,'Reversal: '||trim(p_reason),'draft','reconciliation_reversal',m.id,p_actor_id from public.journal_entries je where je.id=m.journal_entry_id returning id into v_rev;
  if v_rev is null then raise exception 'Original reconciliation journal not found'; end if;
  insert into public.journal_lines(organization_id,journal_entry_id,account_id,description,debit,credit)
  select p_organization_id,v_rev,account_id,'Reversal: '||coalesce(description,''),credit,debit from public.journal_lines where journal_entry_id=m.journal_entry_id;
  update public.journal_entries set status='posted',posted_by=p_actor_id,posted_at=now() where id=v_rev;
  if m.target_type='sales_invoice' then
    select * into v_invoice from public.sales_invoices where id=m.target_id for update;
    update public.sales_invoices set amount_paid=greatest(amount_paid-m.allocation_amount,0),status=case when greatest(amount_paid-m.allocation_amount,0)=0 then 'posted'::public.invoice_status else 'partially_paid'::public.invoice_status end where id=v_invoice.id;
  elsif m.target_type='supplier_bill' then
    select * into v_bill from public.supplier_bills where id=m.target_id for update;
    update public.supplier_bills set paid_amount=greatest(paid_amount-m.allocation_amount,0),status=case when greatest(paid_amount-m.allocation_amount,0)=0 then 'posted' else 'partially_paid' end where id=v_bill.id;
  end if;
  if m.payment_id is not null then update public.payments set status='reversed',notes=concat_ws(' · ',notes,'Reversed: '||trim(p_reason)) where id=m.payment_id; end if;
  update public.reconciliation_matches set status='reversed',reversed_by=p_actor_id,reversed_at=now(),reversal_journal_entry_id=v_rev where id=m.id;
  update public.reconciliation_transactions set matched_cash_amount=greatest(matched_cash_amount-m.cash_amount,0),status=case when greatest(matched_cash_amount-m.cash_amount,0)=0 then 'unmatched' else 'partially_matched' end,updated_at=now() where id=t.id;
  insert into public.reconciliation_events(organization_id,transaction_id,match_id,event_type,actor_id,details) values(p_organization_id,t.id,m.id,'match.reversed',p_actor_id,jsonb_build_object('reason',trim(p_reason),'reversalJournal',v_no));
  insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,metadata) values(p_organization_id,p_actor_id,'reconciliation.match.reversed','reconciliation_match',m.id,jsonb_build_object('reason',trim(p_reason),'reversalJournal',v_rev));
  return jsonb_build_object('id',m.id,'status','reversed','journalNumber',v_no);
end $$;

create or replace function public.set_reconciliation_transaction_state(p_organization_id uuid,p_transaction_id uuid,p_status text,p_reason text,p_actor_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare t public.reconciliation_transactions%rowtype;
begin
  if p_actor_id is distinct from auth.uid() then raise exception 'Actor mismatch'; end if;
  if not public.has_org_role(p_organization_id,array['owner','admin','accountant']::public.app_role[]) then raise exception 'Insufficient reconciliation permission'; end if;
  if p_status not in ('ignored','disputed','unmatched') then raise exception 'Invalid manual transaction state'; end if;
  select * into t from public.reconciliation_transactions where id=p_transaction_id and organization_id=p_organization_id for update;
  if not found then raise exception 'Reconciliation transaction not found'; end if;
  if t.matched_cash_amount>0 then raise exception 'Reverse confirmed matches before changing this transaction state'; end if;
  if p_status in ('ignored','disputed') and length(trim(coalesce(p_reason,'')))<3 then raise exception 'Reason is required'; end if;
  update public.reconciliation_transactions set status=p_status,suggested_target_type=case when p_status='unmatched' then suggested_target_type else null end,suggested_target_id=case when p_status='unmatched' then suggested_target_id else null end,suggestion_confidence=case when p_status='unmatched' then suggestion_confidence else null end,suggestion_reason=case when p_status='unmatched' then suggestion_reason else null end,updated_at=now() where id=t.id;
  insert into public.reconciliation_events(organization_id,transaction_id,event_type,actor_id,details) values(p_organization_id,t.id,'transaction.'||p_status,p_actor_id,jsonb_build_object('reason',nullif(trim(p_reason),'')));
  return jsonb_build_object('id',t.id,'status',p_status);
end $$;

revoke all on function public.confirm_reconciliation_match(uuid,uuid,text,uuid,numeric,numeric,numeric,numeric,text,uuid) from public,anon;
revoke all on function public.reverse_reconciliation_match(uuid,uuid,text,uuid) from public,anon;
revoke all on function public.set_reconciliation_transaction_state(uuid,uuid,text,text,uuid) from public,anon;
grant execute on function public.confirm_reconciliation_match(uuid,uuid,text,uuid,numeric,numeric,numeric,numeric,text,uuid) to authenticated;
grant execute on function public.reverse_reconciliation_match(uuid,uuid,text,uuid) to authenticated;
grant execute on function public.set_reconciliation_transaction_state(uuid,uuid,text,text,uuid) to authenticated;
