create table if not exists public.mpesa_daraja_connection_checks (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  environment text not null check (environment in ('sandbox','production')),
  success boolean not null,
  http_status integer,
  response_code text,
  message text,
  checked_by uuid references auth.users(id) on delete set null,
  checked_at timestamptz not null default now()
);

create index if not exists mpesa_daraja_checks_org_time_idx on public.mpesa_daraja_connection_checks(organization_id,checked_at desc);
create index if not exists mpesa_daraja_checks_checked_by_idx on public.mpesa_daraja_connection_checks(checked_by) where checked_by is not null;

alter table public.mpesa_daraja_connection_checks enable row level security;
drop policy if exists mpesa_daraja_checks_admin_select on public.mpesa_daraja_connection_checks;
create policy mpesa_daraja_checks_admin_select on public.mpesa_daraja_connection_checks for select to authenticated
using (public.has_org_role(organization_id,array['owner','admin']::public.app_role[]));

revoke all on public.mpesa_daraja_connection_checks from anon,authenticated;
grant select on public.mpesa_daraja_connection_checks to authenticated;
revoke all on sequence public.mpesa_daraja_connection_checks_id_seq from anon,authenticated;

create or replace function public.save_mpesa_daraja_credentials(
  p_organization_id uuid,p_consumer_key text,p_consumer_secret text,p_environment text,p_actor_id uuid
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  v_key_name text := 'hisab_mpesa_consumer_key:' || p_organization_id::text;
  v_secret_name text := 'hisab_mpesa_consumer_secret:' || p_organization_id::text;
  v_environment_name text := 'hisab_mpesa_environment:' || p_organization_id::text;
  v_callback_name text := 'hisab_mpesa_callback_token:' || p_organization_id::text;
  v_id uuid; v_callback_token text;
begin
  if p_actor_id is distinct from auth.uid() then raise exception 'Actor mismatch'; end if;
  perform public.require_strong_admin(p_organization_id);
  if p_environment not in ('sandbox','production') then raise exception 'Invalid Daraja environment'; end if;
  if length(trim(coalesce(p_consumer_key,''))) < 20 or length(trim(p_consumer_key)) > 300 then raise exception 'Consumer key is invalid'; end if;
  if length(trim(coalesce(p_consumer_secret,''))) < 20 or length(trim(p_consumer_secret)) > 300 then raise exception 'Consumer secret is invalid'; end if;

  select id into v_id from vault.decrypted_secrets where name=v_key_name;
  if v_id is null then perform vault.create_secret(trim(p_consumer_key),v_key_name,'HisabERP organization-scoped Safaricom Daraja consumer key');
  else perform vault.update_secret(v_id,trim(p_consumer_key),v_key_name,'HisabERP organization-scoped Safaricom Daraja consumer key'); end if;

  v_id:=null; select id into v_id from vault.decrypted_secrets where name=v_secret_name;
  if v_id is null then perform vault.create_secret(trim(p_consumer_secret),v_secret_name,'HisabERP organization-scoped Safaricom Daraja consumer secret');
  else perform vault.update_secret(v_id,trim(p_consumer_secret),v_secret_name,'HisabERP organization-scoped Safaricom Daraja consumer secret'); end if;

  v_id:=null; select id into v_id from vault.decrypted_secrets where name=v_environment_name;
  if v_id is null then perform vault.create_secret(p_environment,v_environment_name,'HisabERP organization-scoped Daraja environment');
  else perform vault.update_secret(v_id,p_environment,v_environment_name,'HisabERP organization-scoped Daraja environment'); end if;

  select decrypted_secret into v_callback_token from vault.decrypted_secrets where name=v_callback_name;
  if v_callback_token is null then
    v_callback_token:=encode(extensions.gen_random_bytes(32),'hex');
    perform vault.create_secret(v_callback_token,v_callback_name,'HisabERP organization-scoped M-Pesa callback authentication token');
  end if;

  insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,metadata)
  values(p_organization_id,p_actor_id,'integration.mpesa.credentials.saved','organization',p_organization_id,
    jsonb_build_object('provider','safaricom_daraja','environment',p_environment,'key_suffix',right(trim(p_consumer_key),4)));
  return jsonb_build_object('configured',true,'environment',p_environment,'keySuffix',right(trim(p_consumer_key),4),'callbackTokenPresent',true);
end $$;
revoke all on function public.save_mpesa_daraja_credentials(uuid,text,text,text,uuid) from public,anon;
grant execute on function public.save_mpesa_daraja_credentials(uuid,text,text,text,uuid) to authenticated;

create or replace function public.get_mpesa_daraja_status(p_organization_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare
  v_prefix text := p_organization_id::text; v_key text; v_secret text; v_environment text; v_callback text;
  v_latest public.mpesa_daraja_connection_checks%rowtype;
begin
  perform public.require_strong_admin(p_organization_id);
  select decrypted_secret into v_key from vault.decrypted_secrets where name='hisab_mpesa_consumer_key:'||v_prefix;
  select decrypted_secret into v_secret from vault.decrypted_secrets where name='hisab_mpesa_consumer_secret:'||v_prefix;
  select decrypted_secret into v_environment from vault.decrypted_secrets where name='hisab_mpesa_environment:'||v_prefix;
  select decrypted_secret into v_callback from vault.decrypted_secrets where name='hisab_mpesa_callback_token:'||v_prefix;
  select * into v_latest from public.mpesa_daraja_connection_checks where organization_id=p_organization_id order by checked_at desc limit 1;
  return jsonb_build_object('configured',v_key is not null and v_secret is not null,'environment',coalesce(v_environment,'sandbox'),
    'keySuffix',case when v_key is null then null else right(v_key,4) end,'callbackTokenPresent',v_callback is not null,
    'lastCheck',case when v_latest.id is null then null else jsonb_build_object('success',v_latest.success,'httpStatus',v_latest.http_status,
      'responseCode',v_latest.response_code,'message',v_latest.message,'checkedAt',v_latest.checked_at) end);
end $$;
revoke all on function public.get_mpesa_daraja_status(uuid) from public,anon;
grant execute on function public.get_mpesa_daraja_status(uuid) to authenticated;

create or replace function public.get_mpesa_daraja_credentials(p_organization_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare
  v_role text:=current_setting('request.jwt.claim.role',true); v_prefix text:=p_organization_id::text;
  v_key text; v_secret text; v_environment text; v_callback text;
begin
  if v_role<>'service_role' then raise exception 'Service role required'; end if;
  select decrypted_secret into v_key from vault.decrypted_secrets where name='hisab_mpesa_consumer_key:'||v_prefix;
  select decrypted_secret into v_secret from vault.decrypted_secrets where name='hisab_mpesa_consumer_secret:'||v_prefix;
  select decrypted_secret into v_environment from vault.decrypted_secrets where name='hisab_mpesa_environment:'||v_prefix;
  select decrypted_secret into v_callback from vault.decrypted_secrets where name='hisab_mpesa_callback_token:'||v_prefix;
  if v_key is null or v_secret is null then raise exception 'M-Pesa Daraja credentials are not configured'; end if;
  return jsonb_build_object('consumerKey',v_key,'consumerSecret',v_secret,'environment',coalesce(v_environment,'sandbox'),'callbackToken',v_callback);
end $$;
revoke all on function public.get_mpesa_daraja_credentials(uuid) from public,anon,authenticated;
grant execute on function public.get_mpesa_daraja_credentials(uuid) to service_role;

create or replace function public.record_mpesa_daraja_connection_check(
  p_organization_id uuid,p_environment text,p_success boolean,p_http_status integer,p_response_code text,p_message text,p_actor_id uuid
) returns bigint language plpgsql security definer set search_path='' as $$
declare v_id bigint;
begin
  if p_actor_id is distinct from auth.uid() then raise exception 'Actor mismatch'; end if;
  perform public.require_strong_admin(p_organization_id);
  if p_environment not in ('sandbox','production') then raise exception 'Invalid Daraja environment'; end if;
  insert into public.mpesa_daraja_connection_checks(organization_id,environment,success,http_status,response_code,message,checked_by)
  values(p_organization_id,p_environment,p_success,p_http_status,left(nullif(trim(p_response_code),''),120),left(nullif(trim(p_message),''),500),p_actor_id)
  returning id into v_id;
  insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,metadata)
  values(p_organization_id,p_actor_id,'integration.mpesa.connection.checked','organization',p_organization_id,
    jsonb_build_object('provider','safaricom_daraja','environment',p_environment,'success',p_success,'http_status',p_http_status,'response_code',p_response_code));
  return v_id;
end $$;
revoke all on function public.record_mpesa_daraja_connection_check(uuid,text,boolean,integer,text,text,uuid) from public,anon;
grant execute on function public.record_mpesa_daraja_connection_check(uuid,text,boolean,integer,text,text,uuid) to authenticated;