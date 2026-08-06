-- Remove inherited anonymous execution from privileged SECURITY DEFINER RPCs.
-- Re-grant only the authenticated entry points that perform their own auth.uid() checks.

alter function public.prevent_audit_mutation() set search_path = public;
alter function public.prevent_auth_audit_mutation() set search_path = public;

revoke execute on function public.bootstrap_organization(text,text,text,text) from public, anon;
revoke execute on function public.create_sales_invoice(uuid,uuid,uuid,uuid,uuid,numeric,numeric,numeric,text,uuid) from public, anon;
revoke execute on function public.get_dashboard_snapshot(uuid) from public, anon;
revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;
revoke execute on function public.has_org_role(uuid,public.app_role[]) from public, anon;
revoke execute on function public.is_org_member(uuid) from public, anon;
revoke execute on function public.next_document_number(uuid,text) from public, anon, authenticated;
revoke execute on function public.record_auth_audit(text,uuid,text,inet,text,jsonb) from public, anon;
revoke execute on function public.record_stock_movement(uuid,uuid,uuid,public.stock_movement_type,numeric,text,uuid,text,uuid) from public, anon;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
revoke execute on function public.set_active_organization(uuid) from public, anon;

grant execute on function public.bootstrap_organization(text,text,text,text) to authenticated;
grant execute on function public.create_sales_invoice(uuid,uuid,uuid,uuid,uuid,numeric,numeric,numeric,text,uuid) to authenticated;
grant execute on function public.get_dashboard_snapshot(uuid) to authenticated;
grant execute on function public.has_org_role(uuid,public.app_role[]) to authenticated;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.record_auth_audit(text,uuid,text,inet,text,jsonb) to authenticated;
grant execute on function public.record_stock_movement(uuid,uuid,uuid,public.stock_movement_type,numeric,text,uuid,text,uuid) to authenticated;
grant execute on function public.set_active_organization(uuid) to authenticated;
