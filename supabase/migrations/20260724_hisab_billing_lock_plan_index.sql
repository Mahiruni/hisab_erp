begin;

create index if not exists hisab_billing_checkout_locks_plan_code_idx
  on public.hisab_billing_checkout_locks(plan_code);

commit;
