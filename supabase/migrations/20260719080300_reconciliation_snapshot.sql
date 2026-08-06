create or replace function public.get_reconciliation_snapshot(target_organization_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_result jsonb;
begin
  if not public.is_org_member(target_organization_id) then raise exception 'Access denied'; end if;
  select jsonb_build_object(
    'organizationName',(select name from public.organizations where id=target_organization_id),
    'metrics',jsonb_build_object(
      'unmatched',(select count(*) from public.reconciliation_transactions where organization_id=target_organization_id and status='unmatched'),
      'suggested',(select count(*) from public.reconciliation_transactions where organization_id=target_organization_id and status='suggested'),
      'partiallyMatched',(select count(*) from public.reconciliation_transactions where organization_id=target_organization_id and status='partially_matched'),
      'matched',(select count(*) from public.reconciliation_transactions where organization_id=target_organization_id and status='matched'),
      'disputed',(select count(*) from public.reconciliation_transactions where organization_id=target_organization_id and status='disputed'),
      'unreconciledCredits',coalesce((select sum(cash_amount-matched_cash_amount) from public.reconciliation_transactions where organization_id=target_organization_id and direction='credit' and status not in ('matched','ignored','duplicate')),0),
      'unreconciledDebits',coalesce((select sum(cash_amount-matched_cash_amount) from public.reconciliation_transactions where organization_id=target_organization_id and direction='debit' and status not in ('matched','ignored','duplicate')),0)
    ),
    'sources',coalesce((select jsonb_agg(jsonb_build_object(
      'id',s.id,'branchId',s.branch_id,'sourceType',s.source_type,'provider',s.provider,'name',s.name,
      'bankAccountId',s.bank_account_id,'ledgerAccountId',s.ledger_account_id,'ledgerAccountName',la.code||' · '||la.name,
      'feeAccountId',s.fee_account_id,'feeAccountName',case when fa.id is null then null else fa.code||' · '||fa.name end,
      'withholdingAccountId',s.withholding_account_id,'withholdingAccountName',case when wa.id is null then null else wa.code||' · '||wa.name end,
      'suspenseAccountId',s.suspense_account_id,'suspenseAccountName',sa.code||' · '||sa.name,
      'currency',trim(s.currency),'environment',s.environment,'status',s.status,'externalAccountReference',s.external_account_reference,
      'merchantReference',s.merchant_reference,'autoMatch',s.auto_match,'amountTolerance',s.amount_tolerance,'dateToleranceDays',s.date_tolerance_days,
      'notes',s.notes,'transactionCount',(select count(*) from public.reconciliation_transactions t where t.source_id=s.id),
      'unmatchedCount',(select count(*) from public.reconciliation_transactions t where t.source_id=s.id and t.status in ('unmatched','suggested','partially_matched'))
    ) order by s.created_at) from public.reconciliation_sources s join public.accounts la on la.id=s.ledger_account_id join public.accounts sa on sa.id=s.suspense_account_id left join public.accounts fa on fa.id=s.fee_account_id left join public.accounts wa on wa.id=s.withholding_account_id where s.organization_id=target_organization_id),'[]'::jsonb),
    'transactions',coalesce((select jsonb_agg(jsonb_build_object(
      'id',t.id,'sourceId',t.source_id,'sourceName',s.name,'sourceType',s.source_type,'provider',s.provider,'sourceChannel',t.source_channel,
      'direction',t.direction,'transactionDate',t.transaction_date,'transactionTime',t.transaction_time,'valueDate',t.value_date,
      'providerTransactionId',t.provider_transaction_id,'providerOrderId',t.provider_order_id,'statementReference',t.statement_reference,
      'counterpartyName',t.counterparty_name,'counterpartyPhone',t.counterparty_phone,'counterpartyAccountMasked',t.counterparty_account_masked,
      'narrative',t.narrative,'currency',trim(t.currency),'cashAmount',t.cash_amount,'feeAmount',t.fee_amount,'withholdingAmount',t.withholding_amount,
      'matchedCashAmount',t.matched_cash_amount,'remainingCashAmount',t.cash_amount-t.matched_cash_amount,'status',t.status,
      'suggestedTargetType',t.suggested_target_type,'suggestedTargetId',t.suggested_target_id,
      'suggestedTargetLabel',case when t.suggested_target_type='sales_invoice' then (select i.invoice_number||' · '||c.name from public.sales_invoice_balance_view i join public.customers c on c.id=i.customer_id where i.id=t.suggested_target_id) when t.suggested_target_type='supplier_bill' then (select b.bill_number||' · '||sp.name from public.supplier_bills b join public.suppliers sp on sp.id=b.supplier_id where b.id=t.suggested_target_id) else null end,
      'suggestionConfidence',t.suggestion_confidence,'suggestionReason',t.suggestion_reason,
      'lastEvent',(select jsonb_build_object('type',e.event_type,'details',e.details,'occurredAt',e.occurred_at) from public.reconciliation_events e where e.transaction_id=t.id order by e.occurred_at desc,e.id desc limit 1),
      'matches',coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'targetType',m.target_type,'targetId',m.target_id,'cashAmount',m.cash_amount,'allocationAmount',m.allocation_amount,'feeAmount',m.fee_amount,'withholdingAmount',m.withholding_amount,'status',m.status,'matchReason',m.match_reason,'journalEntryId',m.journal_entry_id,'paymentId',m.payment_id,'confirmedAt',m.confirmed_at,'reversedAt',m.reversed_at) order by m.created_at desc) from public.reconciliation_matches m where m.transaction_id=t.id),'[]'::jsonb)
    ) order by t.transaction_date desc,t.created_at desc) from (select * from public.reconciliation_transactions where organization_id=target_organization_id order by transaction_date desc,created_at desc limit 250) t join public.reconciliation_sources s on s.id=t.source_id),'[]'::jsonb),
    'batches',coalesce((select jsonb_agg(jsonb_build_object('id',b.id,'sourceId',b.source_id,'sourceName',s.name,'batchType',b.batch_type,'filename',b.original_filename,'periodStart',b.period_start,'periodEnd',b.period_end,'status',b.status,'rowCount',b.row_count,'importedCount',b.imported_count,'duplicateCount',b.duplicate_count,'totalCredit',b.total_credit,'totalDebit',b.total_debit,'errorMessage',b.error_message,'createdAt',b.created_at,'completedAt',b.completed_at) order by b.created_at desc) from (select * from public.reconciliation_import_batches where organization_id=target_organization_id order by created_at desc limit 30) b join public.reconciliation_sources s on s.id=b.source_id),'[]'::jsonb),
    'providerEvents',coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'sourceId',e.source_id,'sourceName',s.name,'provider',e.provider,'providerEventId',e.provider_event_id,'status',e.event_status,'signatureValid',e.signature_valid,'transactionId',e.transaction_id,'errorMessage',e.error_message,'receivedAt',e.received_at,'processedAt',e.processed_at) order by e.received_at desc) from (select * from public.reconciliation_provider_events where organization_id=target_organization_id order by received_at desc limit 30) e join public.reconciliation_sources s on s.id=e.source_id),'[]'::jsonb),
    'accounts',coalesce((select jsonb_agg(jsonb_build_object('id',id,'code',code,'name',name,'type',account_type,'subtype',account_subtype,'currency',trim(currency)) order by code) from public.accounts where organization_id=target_organization_id and is_active),'[]'::jsonb),
    'bankAccounts',coalesce((select jsonb_agg(jsonb_build_object('id',id,'accountId',account_id,'name',name,'bankName',bank_name,'accountNumberMasked',account_number_masked,'currency',trim(currency)) order by name) from public.bank_accounts where organization_id=target_organization_id and is_active),'[]'::jsonb),
    'branches',coalesce((select jsonb_agg(jsonb_build_object('id',id,'code',code,'name',name) order by code) from public.branches where organization_id=target_organization_id and is_active),'[]'::jsonb),
    'openInvoices',coalesce((select jsonb_agg(jsonb_build_object('id',i.id,'number',i.invoice_number,'date',i.invoice_date,'dueDate',i.due_date,'customerId',i.customer_id,'customerName',c.name,'customerPhone',c.phone,'customerReference',i.customer_reference,'currency',trim(si.currency),'outstanding',i.outstanding_amount) order by i.invoice_date desc) from (select * from public.sales_invoice_balance_view where organization_id=target_organization_id and status in ('posted','partially_paid') and outstanding_amount>0 order by invoice_date desc limit 150) i join public.sales_invoices si on si.id=i.id join public.customers c on c.id=i.customer_id),'[]'::jsonb),
    'openSupplierBills',coalesce((select jsonb_agg(jsonb_build_object('id',b.id,'number',b.bill_number,'supplierInvoiceNumber',b.supplier_invoice_number,'date',b.bill_date,'dueDate',b.due_date,'supplierId',b.supplier_id,'supplierName',sp.name,'outstanding',b.total-b.credited_amount-b.paid_amount) order by b.bill_date desc) from (select * from public.supplier_bills where organization_id=target_organization_id and status in ('posted','partially_paid') and total-credited_amount-paid_amount>0 order by bill_date desc limit 150) b join public.suppliers sp on sp.id=b.supplier_id),'[]'::jsonb)
  ) into v_result;
  return v_result;
end $$;

revoke all on function public.get_reconciliation_snapshot(uuid) from public,anon;
grant execute on function public.get_reconciliation_snapshot(uuid) to authenticated;
