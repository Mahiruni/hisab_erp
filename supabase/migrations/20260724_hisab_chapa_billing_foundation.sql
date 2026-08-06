begin;

do $$
declare
  fn record;
begin
  for fn in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('hisab_claim_checkout_lock', 'hisab_attach_checkout_lock', 'hisab_claim_stripe_webhook_event')
  loop
    execute format('drop function if exists %s cascade', fn.signature);
  end loop;
end $$;

drop table if exists public.hisab_billing_checkout_locks cascade;
drop table if exists public.hisab_billing_checkout_sessions cascade;
drop table if exists public.hisab_billing_customers cascade;
drop table if exists public.hisab_billing_subscriptions cascade;
drop table if exists public.hisab_billing_webhook_events cascade;

comment on table public.hisab_billing_plans is 'Read-only HisabERP paid-access catalogue. Chapa amounts are validated again on the server.';

create table public.hisab_billing_payment_attempts (
  tx_ref text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_code text not null references public.hisab_billing_plans(code),
  billing_cycle text not null check (billing_cycle in ('monthly','annual')),
  amount_etb numeric(14,2) not null check (amount_etb > 0),
  currency text not null default 'ETB' check (currency = 'ETB'),
  status text not null default 'creating' check (status in ('creating','open','pending','success','failed','cancelled','refunded','reversed')),
  checkout_url text,
  chapa_reference text,
  mode text,
  payment_method text,
  verified_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index hisab_billing_payment_attempts_user_created_idx on public.hisab_billing_payment_attempts(user_id, created_at desc);
create index hisab_billing_payment_attempts_plan_idx on public.hisab_billing_payment_attempts(plan_code);
comment on table public.hisab_billing_payment_attempts is 'Server-created Chapa payment attempts. Success is accepted only after server-side Chapa verification.';

create table public.hisab_billing_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan_code text not null references public.hisab_billing_plans(code),
  billing_cycle text not null check (billing_cycle in ('monthly','annual')),
  amount_etb numeric(14,2) not null check (amount_etb > 0),
  currency text not null default 'ETB' check (currency = 'ETB'),
  provider text not null default 'chapa' check (provider = 'chapa'),
  status text not null check (status in ('active','expired','revoked')),
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  last_tx_ref text not null references public.hisab_billing_payment_attempts(tx_ref),
  last_payment_status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (current_period_end > current_period_start)
);
create index hisab_billing_access_plan_idx on public.hisab_billing_access(plan_code);
comment on table public.hisab_billing_access is 'Authoritative HisabERP access period created only from a verified Chapa transaction.';

create table public.hisab_billing_webhook_events (
  event_key text primary key,
  event_type text not null,
  tx_ref text,
  mode text,
  status text not null default 'processing' check (status in ('processing','processed','failed')),
  attempts integer not null default 1 check (attempts > 0),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  error_message text,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  updated_at timestamptz not null default now()
);
comment on table public.hisab_billing_webhook_events is 'Private idempotency and audit ledger for authenticated Chapa webhook delivery.';

alter table public.hisab_billing_payment_attempts enable row level security;
alter table public.hisab_billing_access enable row level security;
alter table public.hisab_billing_webhook_events enable row level security;

revoke all on public.hisab_billing_payment_attempts from anon, authenticated;
revoke all on public.hisab_billing_access from anon, authenticated;
revoke all on public.hisab_billing_webhook_events from anon, authenticated;
grant select on public.hisab_billing_payment_attempts to authenticated;
grant select on public.hisab_billing_access to authenticated;

create policy "Users can read their own Chapa payment attempts"
on public.hisab_billing_payment_attempts for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read their own Hisab paid access"
on public.hisab_billing_access for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "No client access to Chapa webhook ledger"
on public.hisab_billing_webhook_events for all
to anon, authenticated
using (false)
with check (false);

create or replace function public.hisab_apply_chapa_transaction(
  p_tx_ref text,
  p_status text,
  p_chapa_reference text default null,
  p_mode text default null,
  p_payment_method text default null
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_attempt public.hisab_billing_payment_attempts%rowtype;
  v_existing public.hisab_billing_access%rowtype;
  v_now timestamptz := now();
  v_start timestamptz;
  v_end timestamptz;
begin
  if p_status not in ('success','failed','cancelled','refunded','reversed') then
    raise exception 'Unsupported Chapa transaction status';
  end if;

  select * into v_attempt
  from public.hisab_billing_payment_attempts
  where tx_ref = p_tx_ref
  for update;
  if not found then raise exception 'Unknown Chapa transaction reference'; end if;
  if v_attempt.status = 'success' and p_status = 'success' then return 'duplicate'; end if;

  update public.hisab_billing_payment_attempts
  set status = p_status,
      chapa_reference = coalesce(p_chapa_reference, chapa_reference),
      mode = coalesce(p_mode, mode),
      payment_method = coalesce(p_payment_method, payment_method),
      verified_at = v_now,
      updated_at = v_now
  where tx_ref = p_tx_ref;

  if p_status = 'success' then
    select * into v_existing from public.hisab_billing_access where user_id = v_attempt.user_id for update;
    v_start := case when found and v_existing.status = 'active' and v_existing.current_period_end > v_now then v_existing.current_period_end else v_now end;
    v_end := case when v_attempt.billing_cycle = 'annual' then v_start + interval '1 year' else v_start + interval '1 month' end;

    insert into public.hisab_billing_access (
      user_id, plan_code, billing_cycle, amount_etb, currency, provider, status,
      current_period_start, current_period_end, last_tx_ref, last_payment_status,
      created_at, updated_at
    ) values (
      v_attempt.user_id, v_attempt.plan_code, v_attempt.billing_cycle,
      v_attempt.amount_etb, 'ETB', 'chapa', 'active',
      case when found then v_existing.current_period_start else v_now end,
      v_end, p_tx_ref, 'success', v_now, v_now
    )
    on conflict (user_id) do update set
      plan_code = excluded.plan_code,
      billing_cycle = excluded.billing_cycle,
      amount_etb = excluded.amount_etb,
      currency = 'ETB',
      provider = 'chapa',
      status = 'active',
      current_period_start = case when public.hisab_billing_access.status = 'active' and public.hisab_billing_access.current_period_end > v_now then public.hisab_billing_access.current_period_start else v_now end,
      current_period_end = excluded.current_period_end,
      last_tx_ref = excluded.last_tx_ref,
      last_payment_status = 'success',
      updated_at = v_now;
    return 'activated';
  end if;

  if p_status in ('refunded','reversed') then
    update public.hisab_billing_access
    set status = 'revoked', last_payment_status = p_status, updated_at = v_now
    where user_id = v_attempt.user_id and last_tx_ref = p_tx_ref;
    return 'revoked';
  end if;

  return p_status;
end;
$$;

revoke all on function public.hisab_apply_chapa_transaction(text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.hisab_apply_chapa_transaction(text,text,text,text,text) to service_role;

commit;
