-- Row-level security
alter table public.organizations enable row level security;
alter table public.branches enable row level security;
alter table public.organization_members enable row level security;
alter table public.document_counters enable row level security;
alter table public.customers enable row level security;
alter table public.warehouses enable row level security;
alter table public.products enable row level security;
alter table public.stock_balances enable row level security;
alter table public.stock_movements enable row level security;
alter table public.accounts enable row level security;
alter table public.journal_entries enable row level security;
alter table public.journal_lines enable row level security;
alter table public.sales_invoices enable row level security;
alter table public.sales_invoice_items enable row level security;
alter table public.payments enable row level security;
alter table public.audit_events enable row level security;
alter table public.approval_requests enable row level security;

create policy org_select on public.organizations for select using (public.is_org_member(id));
create policy member_select on public.organization_members for select using (public.is_org_member(organization_id));
create policy member_manage on public.organization_members for all using (public.has_org_role(organization_id,array['owner','admin']::public.app_role[])) with check (public.has_org_role(organization_id,array['owner','admin']::public.app_role[]));

-- Shared tenant policies. Writes are deliberately role-scoped.
create policy branch_select on public.branches for select using (public.is_org_member(organization_id));
create policy branch_manage on public.branches for all using (public.has_org_role(organization_id,array['owner','admin']::public.app_role[])) with check (public.has_org_role(organization_id,array['owner','admin']::public.app_role[]));
create policy customer_select on public.customers for select using (public.is_org_member(organization_id));
create policy customer_write on public.customers for all using (public.has_org_role(organization_id,array['owner','admin','accountant','sales']::public.app_role[])) with check (public.has_org_role(organization_id,array['owner','admin','accountant','sales']::public.app_role[]));
create policy warehouse_select on public.warehouses for select using (public.is_org_member(organization_id));
create policy warehouse_write on public.warehouses for all using (public.has_org_role(organization_id,array['owner','admin','inventory']::public.app_role[])) with check (public.has_org_role(organization_id,array['owner','admin','inventory']::public.app_role[]));
create policy product_select on public.products for select using (public.is_org_member(organization_id));
create policy product_write on public.products for all using (public.has_org_role(organization_id,array['owner','admin','inventory']::public.app_role[])) with check (public.has_org_role(organization_id,array['owner','admin','inventory']::public.app_role[]));
create policy stock_select on public.stock_balances for select using (public.is_org_member(organization_id));
create policy movement_select on public.stock_movements for select using (public.is_org_member(organization_id));
create policy account_select on public.accounts for select using (public.is_org_member(organization_id));
create policy account_write on public.accounts for all using (public.has_org_role(organization_id,array['owner','admin','accountant']::public.app_role[])) with check (public.has_org_role(organization_id,array['owner','admin','accountant']::public.app_role[]));
create policy journal_select on public.journal_entries for select using (public.is_org_member(organization_id));
create policy journal_write on public.journal_entries for insert with check (public.has_org_role(organization_id,array['owner','admin','accountant']::public.app_role[]));
create policy line_select on public.journal_lines for select using (public.is_org_member(organization_id));
create policy line_write on public.journal_lines for insert with check (public.has_org_role(organization_id,array['owner','admin','accountant']::public.app_role[]));
create policy invoice_select on public.sales_invoices for select using (public.is_org_member(organization_id));
create policy invoice_item_select on public.sales_invoice_items for select using (public.is_org_member(organization_id));
create policy payment_select on public.payments for select using (public.is_org_member(organization_id));
create policy payment_write on public.payments for insert with check (public.has_org_role(organization_id,array['owner','admin','accountant','sales']::public.app_role[]));
create policy audit_select on public.audit_events for select using (public.has_org_role(organization_id,array['owner','admin','accountant']::public.app_role[]));
create policy audit_insert on public.audit_events for insert with check (public.is_org_member(organization_id) and actor_id=auth.uid());
create policy approval_select on public.approval_requests for select using (public.is_org_member(organization_id));
create policy approval_write on public.approval_requests for insert with check (public.is_org_member(organization_id) and requested_by=auth.uid());
create policy approval_decide on public.approval_requests for update using (public.has_org_role(organization_id,array['owner','admin']::public.app_role[]));

-- Counters and stock writes occur only through security-definer functions.
revoke all on public.document_counters, public.stock_balances from anon, authenticated;
grant select on public.product_stock_view, public.journal_summary_view to authenticated;

-- Optional automatic organization bootstrap from sign-up metadata.
create or replace function public.handle_new_auth_user() returns trigger language plpgsql security definer set search_path=public as $$
declare org_name text; full_name text;
begin
  org_name := nullif(trim(new.raw_user_meta_data->>'organization_name'),'');
  full_name := coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''),split_part(new.email,'@',1));
  if org_name is not null then perform public.bootstrap_organization(org_name,full_name,null,null); end if;
  return new;
exception when others then
  -- Never block account creation; the user can finish setup at /onboarding.
  return new;
end; $$;
-- Supabase auth triggers execute without an end-user auth.uid(), so automatic bootstrap
-- is intentionally not installed. The authenticated /onboarding RPC is the source of truth.

comment on table public.audit_events is 'Append-only security and business audit trail.';
comment on function public.create_sales_invoice is 'Atomically posts invoice, balanced accounting journal, COGS and stock movement.';
