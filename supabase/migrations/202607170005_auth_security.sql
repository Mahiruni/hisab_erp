-- Additive authentication and multi-business security foundation.
-- This migration never drops or rewrites existing ERP data.

create extension if not exists pgcrypto;

alter table public.organizations add column if not exists industry text;
alter table public.organizations add column if not exists country_code char(2) not null default 'ET';
alter table public.organization_members add column if not exists is_default boolean not null default false;
alter table public.organization_members add column if not exists updated_at timestamptz not null default now();
create index if not exists organization_members_user_active_idx on public.organization_members(user_id, is_active, created_at);
create unique index if not exists organization_members_one_default_per_user on public.organization_members(user_id) where is_default and is_active;

create table if not exists public.user_security_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  failed_login_count integer not null default 0 check (failed_login_count >= 0),
  locked_until timestamptz,
  password_changed_at timestamptz,
  mfa_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.auth_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  auth_session_id uuid,
  device_name text,
  ip_address inet,
  user_agent text,
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create unique index if not exists auth_sessions_auth_session_unique on public.auth_sessions(auth_session_id) where auth_session_id is not null;
create index if not exists auth_sessions_user_active_idx on public.auth_sessions(user_id, revoked_at, last_seen_at desc);

create table if not exists public.login_attempts (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  identifier_hash text not null,
  succeeded boolean not null,
  failure_reason text,
  ip_address inet,
  user_agent text,
  occurred_at timestamptz not null default now()
);
create index if not exists login_attempts_identifier_time_idx on public.login_attempts(identifier_hash, occurred_at desc);
create index if not exists login_attempts_user_time_idx on public.login_attempts(user_id, occurred_at desc);

create table if not exists public.auth_audit_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  event_type text not null,
  severity text not null default 'info' check (severity in ('info','warning','critical')),
  ip_address inet,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);
create index if not exists auth_audit_user_time_idx on public.auth_audit_events(user_id, occurred_at desc);
create index if not exists auth_audit_org_time_idx on public.auth_audit_events(organization_id, occurred_at desc);

create table if not exists public.recovery_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code_hash text not null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, code_hash)
);
create index if not exists recovery_codes_user_unused_idx on public.recovery_codes(user_id, used_at);

create table if not exists public.business_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email_normalized text not null,
  role public.app_role not null default 'staff',
  token_hash text not null unique,
  invited_by uuid not null references auth.users(id),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists business_invitations_org_email_idx on public.business_invitations(organization_id, email_normalized);
create index if not exists business_invitations_expiry_idx on public.business_invitations(expires_at) where accepted_at is null and revoked_at is null;

alter table public.user_security_profiles enable row level security;
alter table public.auth_sessions enable row level security;
alter table public.login_attempts enable row level security;
alter table public.auth_audit_events enable row level security;
alter table public.recovery_codes enable row level security;
alter table public.business_invitations enable row level security;

create policy "security_profile_self_select" on public.user_security_profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "auth_sessions_self_select" on public.auth_sessions for select to authenticated using ((select auth.uid()) = user_id);
create policy "auth_sessions_self_update" on public.auth_sessions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "recovery_codes_self_select" on public.recovery_codes for select to authenticated using ((select auth.uid()) = user_id);
create policy "invitation_org_select" on public.business_invitations for select to authenticated using (public.is_org_member(organization_id));
create policy "invitation_org_manage" on public.business_invitations for all to authenticated using (public.has_org_role(organization_id,array['owner','admin']::public.app_role[])) with check (public.has_org_role(organization_id,array['owner','admin']::public.app_role[]));
create policy "auth_audit_self_or_admin_select" on public.auth_audit_events for select to authenticated using ((select auth.uid()) = user_id or (organization_id is not null and public.has_org_role(organization_id,array['owner','admin']::public.app_role[])));

revoke all on public.login_attempts from anon, authenticated;
revoke insert, update, delete on public.auth_audit_events from anon, authenticated;
revoke insert, update, delete on public.user_security_profiles from anon, authenticated;
revoke insert, update, delete on public.recovery_codes from anon, authenticated;

create or replace function public.record_auth_audit(
  p_event_type text,
  p_organization_id uuid default null,
  p_severity text default 'info',
  p_ip_address inet default null,
  p_user_agent text default null,
  p_metadata jsonb default '{}'::jsonb
) returns bigint language plpgsql security definer set search_path=public as $$
declare event_id bigint; current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if p_organization_id is not null and not public.is_org_member(p_organization_id) then raise exception 'Access denied'; end if;
  if p_event_type !~ '^auth\.[a-z0-9_.-]{1,96}$' then raise exception 'Invalid event type'; end if;
  if p_severity not in ('info','warning','critical') then raise exception 'Invalid severity'; end if;
  insert into public.auth_audit_events(user_id,organization_id,event_type,severity,ip_address,user_agent,metadata)
  values(current_user_id,p_organization_id,p_event_type,p_severity,p_ip_address,left(p_user_agent,500),coalesce(p_metadata,'{}'::jsonb)) returning id into event_id;
  return event_id;
end $$;
revoke all on function public.record_auth_audit(text,uuid,text,inet,text,jsonb) from public;
grant execute on function public.record_auth_audit(text,uuid,text,inet,text,jsonb) to authenticated;

create or replace function public.set_active_organization(target_organization_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.is_org_member(target_organization_id) then raise exception 'Access denied'; end if;
  update public.organization_members set is_default=false, updated_at=now() where user_id=(select auth.uid()) and is_default;
  update public.organization_members set is_default=true, updated_at=now() where user_id=(select auth.uid()) and organization_id=target_organization_id and is_active;
end $$;
revoke all on function public.set_active_organization(uuid) from public;
grant execute on function public.set_active_organization(uuid) to authenticated;

create or replace function public.prevent_auth_audit_mutation()
returns trigger language plpgsql as $$ begin raise exception 'Authentication audit events are immutable'; end $$;
drop trigger if exists auth_audit_immutable on public.auth_audit_events;
create trigger auth_audit_immutable before update or delete on public.auth_audit_events for each row execute function public.prevent_auth_audit_mutation();

comment on table public.auth_sessions is 'Application-side device and session registry; never stores refresh tokens.';
comment on table public.login_attempts is 'Server-written authentication attempt history using normalized identifier hashes.';
comment on table public.recovery_codes is 'Single-use MFA recovery codes stored only as cryptographic hashes.';
