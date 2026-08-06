-- Cover Finance & Accounting Phase 1 foreign keys used by joins and maintenance.

create index if not exists accounting_periods_locked_by_idx
  on public.accounting_periods(locked_by) where locked_by is not null;
create index if not exists accounting_periods_created_by_idx
  on public.accounting_periods(created_by) where created_by is not null;
create index if not exists tax_codes_account_id_idx
  on public.tax_codes(account_id) where account_id is not null;
create index if not exists tax_codes_created_by_idx
  on public.tax_codes(created_by) where created_by is not null;
create index if not exists bank_accounts_account_id_idx
  on public.bank_accounts(account_id);
create index if not exists bank_accounts_created_by_idx
  on public.bank_accounts(created_by) where created_by is not null;
create index if not exists fixed_assets_branch_id_idx
  on public.fixed_assets(branch_id) where branch_id is not null;
create index if not exists fixed_assets_asset_account_id_idx
  on public.fixed_assets(asset_account_id);
create index if not exists fixed_assets_accumulated_account_id_idx
  on public.fixed_assets(accumulated_depreciation_account_id);
create index if not exists fixed_assets_depreciation_expense_id_idx
  on public.fixed_assets(depreciation_expense_account_id);
create index if not exists fixed_assets_acquisition_journal_id_idx
  on public.fixed_assets(acquisition_journal_entry_id) where acquisition_journal_entry_id is not null;
create index if not exists fixed_assets_created_by_idx
  on public.fixed_assets(created_by) where created_by is not null;
create index if not exists asset_depreciation_runs_journal_id_idx
  on public.asset_depreciation_runs(journal_entry_id);
create index if not exists asset_depreciation_runs_created_by_idx
  on public.asset_depreciation_runs(created_by) where created_by is not null;