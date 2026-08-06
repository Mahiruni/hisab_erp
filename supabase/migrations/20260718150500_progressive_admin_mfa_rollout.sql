-- Preserve current production access until the new authenticator UI is deployed.
-- Once an owner/admin enrolls a verified factor, every privileged database call
-- requires an AAL2 JWT. The Next.js workspace requires AAL2 immediately after
-- the production UI release, so this is a compatibility bridge rather than a
-- permanent application bypass.

create or replace function public.has_org_role(target_org uuid, allowed public.app_role[])
returns boolean language sql stable security definer set search_path='' as $$
  select exists(
    select 1
    from public.organization_members m
    where m.organization_id=target_org
      and m.user_id=(select auth.uid())
      and m.is_active
      and m.role=any(allowed)
      and (
        m.role not in ('owner','admin')
        or not exists(
          select 1 from auth.mfa_factors f
          where f.user_id=(select auth.uid()) and f.status='verified'
        )
        or coalesce((select auth.jwt()->>'aal'),'aal1')='aal2'
      )
  );
$$;
revoke all on function public.has_org_role(uuid,public.app_role[]) from public, anon;
grant execute on function public.has_org_role(uuid,public.app_role[]) to authenticated;
