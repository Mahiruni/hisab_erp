create table if not exists public.reconciliation_sources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  source_type text not null check (source_type in ('bank','telebirr','mpesa')),
  provider text not null check (provider in ('manual_csv','bank_statement','telebirr','safaricom_daraja')),
  name text not null,
  bank_account_id uuid references public.bank_accounts(id) on delete set null,
  ledger_account_id uuid not null references public.accounts(id) on delete restrict,
  fee_account_id uuid references public.accounts(id) on delete restrict,
  withholding_account_id uuid references public.accounts(id) on delete restrict,
  suspense_account_id uuid not null references public.accounts(id) on delete restrict,
  currency char(3) not null default 'ETB',
  environment text not null default 'sandbox' check (environment in ('sandbox','production')),
  status text not null default 'draft' check (status in ('draft','ready','suspended')),
  external_account_reference text,
  merchant_reference text,
  auto_match boolean not null default true,
  amount_tolerance numeric(18,4) not null default 0.01 check (amount_tolerance >= 0),
  date_tolerance_days integer not null default 5 check (date_tolerance_days between 0 and 31),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table if not exists public.reconciliation_import_batches (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  source_id uuid not null references public.reconciliation_sources(id) on delete restrict,
  batch_type text not null check (batch_type in ('statement','provider_callback','api_sync','manual')),
  original_filename text, file_hash text, period_start date, period_end date, opening_balance numeric(18,2), closing_balance numeric(18,2),
  status text not null default 'imported' check (status in ('imported','processing','completed','failed')),
  row_count integer not null default 0 check (row_count >= 0), imported_count integer not null default 0 check (imported_count >= 0),
  duplicate_count integer not null default 0 check (duplicate_count >= 0), total_credit numeric(18,2) not null default 0,
  total_debit numeric(18,2) not null default 0, error_message text, created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), completed_at timestamptz
);

create table if not exists public.reconciliation_transactions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  source_id uuid not null references public.reconciliation_sources(id) on delete restrict,
  batch_id uuid references public.reconciliation_import_batches(id) on delete set null,
  source_channel text not null check (source_channel in ('csv','callback','api','manual')),
  direction text not null check (direction in ('credit','debit')), transaction_date date not null, transaction_time timestamptz, value_date date,
  provider_transaction_id text, provider_order_id text, statement_reference text, counterparty_name text, counterparty_phone text,
  counterparty_account_masked text, narrative text, currency char(3) not null default 'ETB', cash_amount numeric(18,2) not null check (cash_amount > 0),
  fee_amount numeric(18,2) not null default 0 check (fee_amount >= 0), withholding_amount numeric(18,2) not null default 0 check (withholding_amount >= 0),
  matched_cash_amount numeric(18,2) not null default 0 check (matched_cash_amount >= 0),
  status text not null default 'unmatched' check (status in ('unmatched','suggested','partially_matched','matched','ignored','duplicate','disputed')),
  idempotency_key text not null, payload_hash text, raw_payload jsonb not null default '{}'::jsonb,
  suggested_target_type text check (suggested_target_type is null or suggested_target_type in ('sales_invoice','supplier_bill','account','suspense')),
  suggested_target_id uuid, suggestion_confidence numeric(5,4) check (suggestion_confidence is null or suggestion_confidence between 0 and 1),
  suggestion_reason text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (organization_id, source_id, idempotency_key), check (matched_cash_amount <= cash_amount)
);

create table if not exists public.reconciliation_matches (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  transaction_id uuid not null references public.reconciliation_transactions(id) on delete restrict,
  target_type text not null check (target_type in ('sales_invoice','supplier_bill','account','suspense')), target_id uuid,
  cash_amount numeric(18,2) not null check (cash_amount > 0), allocation_amount numeric(18,2) not null check (allocation_amount > 0),
  fee_amount numeric(18,2) not null default 0 check (fee_amount >= 0), withholding_amount numeric(18,2) not null default 0 check (withholding_amount >= 0),
  status text not null default 'confirmed' check (status in ('proposed','confirmed','reversed')), confidence numeric(5,4) check (confidence is null or confidence between 0 and 1),
  match_reason text, journal_entry_id uuid references public.journal_entries(id) on delete restrict, payment_id uuid references public.payments(id) on delete restrict,
  created_by uuid references auth.users(id) on delete set null, confirmed_by uuid references auth.users(id) on delete set null, confirmed_at timestamptz,
  reversed_by uuid references auth.users(id) on delete set null, reversed_at timestamptz,
  reversal_journal_entry_id uuid references public.journal_entries(id) on delete restrict, created_at timestamptz not null default now()
);

create table if not exists public.reconciliation_provider_events (
  id bigint generated always as identity primary key, organization_id uuid not null references public.organizations(id) on delete cascade,
  source_id uuid not null references public.reconciliation_sources(id) on delete restrict,
  provider text not null check (provider in ('telebirr','safaricom_daraja')), provider_event_id text not null,
  event_status text not null default 'received' check (event_status in ('received','processed','ignored','rejected','failed')),
  signature_valid boolean, payload jsonb not null default '{}'::jsonb, payload_hash text not null,
  transaction_id uuid references public.reconciliation_transactions(id) on delete set null, error_message text,
  received_at timestamptz not null default now(), processed_at timestamptz, unique (organization_id, provider, provider_event_id)
);

create table if not exists public.reconciliation_events (
  id bigint generated always as identity primary key, organization_id uuid not null references public.organizations(id) on delete cascade,
  transaction_id uuid references public.reconciliation_transactions(id) on delete cascade,
  match_id uuid references public.reconciliation_matches(id) on delete cascade, event_type text not null,
  actor_id uuid references auth.users(id) on delete set null, details jsonb not null default '{}'::jsonb, occurred_at timestamptz not null default now()
);

create index if not exists reconciliation_sources_org_status_idx on public.reconciliation_sources(organization_id,status,source_type);
create index if not exists reconciliation_sources_external_ref_idx on public.reconciliation_sources(provider,external_account_reference) where external_account_reference is not null;
create index if not exists reconciliation_sources_bank_account_id_idx on public.reconciliation_sources(bank_account_id) where bank_account_id is not null;
create index if not exists reconciliation_sources_branch_id_idx on public.reconciliation_sources(branch_id) where branch_id is not null;
create index if not exists reconciliation_sources_created_by_idx on public.reconciliation_sources(created_by) where created_by is not null;
create index if not exists reconciliation_sources_fee_account_id_idx on public.reconciliation_sources(fee_account_id) where fee_account_id is not null;
create index if not exists reconciliation_sources_ledger_account_id_idx on public.reconciliation_sources(ledger_account_id);
create index if not exists reconciliation_sources_suspense_account_id_idx on public.reconciliation_sources(suspense_account_id);
create index if not exists reconciliation_sources_withholding_account_id_idx on public.reconciliation_sources(withholding_account_id) where withholding_account_id is not null;
create index if not exists reconciliation_batches_org_created_idx on public.reconciliation_import_batches(organization_id,created_at desc);
create index if not exists reconciliation_batches_created_by_idx on public.reconciliation_import_batches(created_by) where created_by is not null;
create index if not exists reconciliation_batches_source_id_idx on public.reconciliation_import_batches(source_id);
create index if not exists reconciliation_transactions_org_status_date_idx on public.reconciliation_transactions(organization_id,status,transaction_date desc);
create index if not exists reconciliation_transactions_source_date_idx on public.reconciliation_transactions(source_id,transaction_date desc);
create index if not exists reconciliation_transactions_provider_id_idx on public.reconciliation_transactions(provider_transaction_id) where provider_transaction_id is not null;
create index if not exists reconciliation_transactions_suggestion_idx on public.reconciliation_transactions(organization_id,suggested_target_type,suggested_target_id) where suggested_target_id is not null;
create index if not exists reconciliation_transactions_batch_id_idx on public.reconciliation_transactions(batch_id) where batch_id is not null;
create index if not exists reconciliation_matches_transaction_idx on public.reconciliation_matches(transaction_id,status);
create index if not exists reconciliation_matches_target_idx on public.reconciliation_matches(organization_id,target_type,target_id,status);
create index if not exists reconciliation_matches_confirmed_by_idx on public.reconciliation_matches(confirmed_by) where confirmed_by is not null;
create index if not exists reconciliation_matches_created_by_idx on public.reconciliation_matches(created_by) where created_by is not null;
create index if not exists reconciliation_matches_journal_entry_id_idx on public.reconciliation_matches(journal_entry_id) where journal_entry_id is not null;
create index if not exists reconciliation_matches_payment_id_idx on public.reconciliation_matches(payment_id) where payment_id is not null;
create index if not exists reconciliation_matches_reversal_journal_id_idx on public.reconciliation_matches(reversal_journal_entry_id) where reversal_journal_entry_id is not null;
create index if not exists reconciliation_matches_reversed_by_idx on public.reconciliation_matches(reversed_by) where reversed_by is not null;
create index if not exists reconciliation_provider_events_source_received_idx on public.reconciliation_provider_events(source_id,received_at desc);
create index if not exists reconciliation_provider_events_transaction_id_idx on public.reconciliation_provider_events(transaction_id) where transaction_id is not null;
create index if not exists reconciliation_events_transaction_idx on public.reconciliation_events(transaction_id,occurred_at desc);
create index if not exists reconciliation_events_actor_id_idx on public.reconciliation_events(actor_id) where actor_id is not null;
create index if not exists reconciliation_events_match_id_idx on public.reconciliation_events(match_id) where match_id is not null;
create index if not exists reconciliation_events_org_time_idx on public.reconciliation_events(organization_id,occurred_at desc);

alter table public.reconciliation_sources enable row level security;
alter table public.reconciliation_import_batches enable row level security;
alter table public.reconciliation_transactions enable row level security;
alter table public.reconciliation_matches enable row level security;
alter table public.reconciliation_provider_events enable row level security;
alter table public.reconciliation_events enable row level security;

drop policy if exists reconciliation_sources_select on public.reconciliation_sources;
create policy reconciliation_sources_select on public.reconciliation_sources for select to authenticated using ((select public.is_org_member(organization_id)));
drop policy if exists reconciliation_batches_select on public.reconciliation_import_batches;
create policy reconciliation_batches_select on public.reconciliation_import_batches for select to authenticated using ((select public.is_org_member(organization_id)));
drop policy if exists reconciliation_transactions_select on public.reconciliation_transactions;
create policy reconciliation_transactions_select on public.reconciliation_transactions for select to authenticated using ((select public.is_org_member(organization_id)));
drop policy if exists reconciliation_matches_select on public.reconciliation_matches;
create policy reconciliation_matches_select on public.reconciliation_matches for select to authenticated using ((select public.is_org_member(organization_id)));
drop policy if exists reconciliation_provider_events_select on public.reconciliation_provider_events;
create policy reconciliation_provider_events_select on public.reconciliation_provider_events for select to authenticated using ((select public.is_org_member(organization_id)));
drop policy if exists reconciliation_events_select on public.reconciliation_events;
create policy reconciliation_events_select on public.reconciliation_events for select to authenticated using ((select public.is_org_member(organization_id)));

grant select on public.reconciliation_sources, public.reconciliation_import_batches, public.reconciliation_transactions, public.reconciliation_matches, public.reconciliation_provider_events, public.reconciliation_events to authenticated;
revoke insert, update, delete, truncate on public.reconciliation_sources, public.reconciliation_import_batches, public.reconciliation_transactions, public.reconciliation_matches, public.reconciliation_provider_events, public.reconciliation_events from anon, authenticated;
revoke all on sequence public.reconciliation_provider_events_id_seq from anon, authenticated;
revoke all on sequence public.reconciliation_events_id_seq from anon, authenticated;
