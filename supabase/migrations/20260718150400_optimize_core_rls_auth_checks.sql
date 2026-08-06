drop policy if exists audit_insert on public.audit_events;
create policy audit_insert on public.audit_events for insert to authenticated
with check (public.is_org_member(organization_id) and actor_id=(select auth.uid()));

drop policy if exists approval_write on public.approval_requests;
create policy approval_write on public.approval_requests for insert to authenticated
with check (public.is_org_member(organization_id) and requested_by=(select auth.uid()));
