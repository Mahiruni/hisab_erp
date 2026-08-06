-- Remove PostgreSQL's default PUBLIC function execution from the exposed schema.
-- Authenticated users retain access to RPCs; trigger functions remain trigger-only.

revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;

revoke execute on function public.ensure_org_control_defaults() from authenticated;
revoke execute on function public.sync_user_mfa_requirement() from authenticated;
revoke execute on function public.capture_auth_security_alert() from authenticated;
revoke execute on function public.capture_financial_security_alert() from authenticated;
revoke execute on function public.handle_new_auth_user() from authenticated;
