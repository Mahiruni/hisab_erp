-- Serious production controls and guided onboarding for Hisab ERP.
-- All privileged owner/admin operations require an AAL2 Supabase session.

create extension if not exists pg_cron with schema extensions;

create table if not exists public.production_control_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  login_alerts_enabled boolean not null default true,
  financial_alerts_enabled boolean not null default true,
  audit_export_enabled boolean not null default true,
  backup_mode text not null default 'logical_daily' check (backup_mode in ('logical_daily','managed_daily','pitr')),
  backup_retention_days integer not null default 35 check (backup_retention_days between 7 and 3650),
  pitr_enabled boolean not null default false,
  last_backup_at timestamptz,
  last_backup_checksum text,
  last_backup_reference text,
  last_restore_test_at timestamptz,
  restore_test_status text check (restore_test_status is null or restore_test_status in ('passed','failed')),
  restore_test_notes text,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.security_alerts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  category text not null,
  severity text not null default 'warning' check (severity in ('info','warning','critical')),
  title text not null,
  description text,
  actor_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'open' check (status in ('open','acknowledged')),
  acknowledged_by uuid references auth.users(id) on delete set null,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists security_alerts_org_status_time_idx on public.security_alerts(organization_id,status,created_at desc);

create table if not exists public.database_health_checks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  status text not null check (status in ('healthy','warning','critical')),
  checks jsonb not null default '{}'::jsonb,
  checked_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists database_health_checks_org_time_idx on public.database_health_checks(organization_id,created_at desc);

create table if not exists public.onboarding_progress (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress','completed')),
  current_step integer not null default 1 check (current_step between 1 and 8),
  completed_steps jsonb not null default '[]'::jsonb,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.production_control_settings enable row level security;
alter table public.security_alerts enable row level security;
alter table public.database_health_checks enable row level security;
alter table public.onboarding_progress enable row level security;

drop policy if exists production_controls_admin_select on public.production_control_settings;
create policy production_controls_admin_select on public.production_control_settings for select to authenticated
using (public.has_org_role(organization_id,array['owner','admin']::public.app_role[]));

drop policy if exists security_alerts_admin_select on public.security_alerts;
create policy security_alerts_admin_select on public.security_alerts for select to authenticated
using (public.has_org_role(organization_id,array['owner','admin']::public.app_role[]));

drop policy if exists database_health_admin_select on public.database_health_checks;
create policy database_health_admin_select on public.database_health_checks for select to authenticated
using (public.has_org_role(organization_id,array['owner','admin']::public.app_role[]));

drop policy if exists onboarding_progress_member_select on public.onboarding_progress;
create policy onboarding_progress_member_select on public.onboarding_progress for select to authenticated
using (public.is_org_member(organization_id));

revoke all on public.production_control_settings, public.security_alerts, public.database_health_checks, public.onboarding_progress from anon, authenticated;
grant select on public.production_control_settings, public.security_alerts, public.database_health_checks, public.onboarding_progress to authenticated;

-- Owner and administrator permissions become strong-session permissions.
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
        or coalesce((select auth.jwt()->>'aal'),'aal1')='aal2'
      )
  );
$$;
revoke all on function public.has_org_role(uuid,public.app_role[]) from public;
grant execute on function public.has_org_role(uuid,public.app_role[]) to authenticated;

create or replace function public.require_strong_admin(target_org uuid)
returns void language plpgsql stable security definer set search_path='' as $$
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  if not public.has_org_role(target_org,array['owner','admin']::public.app_role[]) then
    raise exception 'Owner or administrator access with MFA verification is required';
  end if;
end;
$$;
revoke all on function public.require_strong_admin(uuid) from public;
grant execute on function public.require_strong_admin(uuid) to authenticated;

create or replace function public.ensure_org_control_defaults()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.production_control_settings(organization_id) values(new.id) on conflict do nothing;
  insert into public.onboarding_progress(organization_id) values(new.id) on conflict do nothing;
  return new;
end;
$$;
drop trigger if exists organizations_control_defaults on public.organizations;
create trigger organizations_control_defaults after insert on public.organizations for each row execute function public.ensure_org_control_defaults();

insert into public.production_control_settings(organization_id) select id from public.organizations on conflict do nothing;
insert into public.onboarding_progress(organization_id) select id from public.organizations on conflict do nothing;

create or replace function public.sync_user_mfa_requirement()
returns trigger language plpgsql security definer set search_path='' as $$
declare target_user uuid:=coalesce(new.user_id,old.user_id); required_value boolean;
begin
  select exists(
    select 1 from public.organization_members m
    where m.user_id=target_user and m.is_active and m.role in ('owner','admin')
  ) into required_value;
  insert into public.user_security_profiles(user_id,mfa_required,updated_at)
  values(target_user,required_value,now())
  on conflict(user_id) do update set mfa_required=excluded.mfa_required,updated_at=now();
  return coalesce(new,old);
end;
$$;
drop trigger if exists organization_members_sync_mfa on public.organization_members;
create trigger organization_members_sync_mfa after insert or update of role,is_active or delete on public.organization_members
for each row execute function public.sync_user_mfa_requirement();

insert into public.user_security_profiles(user_id,mfa_required,updated_at)
select user_id,bool_or(is_active and role in ('owner','admin')),now()
from public.organization_members group by user_id
on conflict(user_id) do update set mfa_required=excluded.mfa_required,updated_at=now();

grant select on public.user_security_profiles to authenticated;

create or replace function public.bootstrap_organization_v2(
  p_name text,p_full_name text,p_business_type text,p_country_code text default 'ET',
  p_currency text default 'ETB',p_timezone text default 'Africa/Addis_Ababa',
  p_branch_name text default 'Main Branch',p_tin text default null,p_phone text default null
) returns uuid language plpgsql security definer set search_path='' as $$
declare org_id uuid; current_user_id uuid:=(select auth.uid());
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if char_length(trim(p_name))<2 then raise exception 'Company name is required'; end if;
  if char_length(trim(p_business_type))<2 then raise exception 'Business type is required'; end if;
  org_id:=public.bootstrap_organization(trim(p_name),trim(p_full_name),nullif(trim(p_tin),''),nullif(trim(p_phone),''));
  update public.organizations set
    industry=trim(p_business_type),country_code=upper(left(trim(p_country_code),2)),
    base_currency=upper(left(trim(p_currency),3)),timezone=trim(p_timezone),updated_at=now()
  where id=org_id and created_by=current_user_id;
  update public.branches set name=left(trim(p_branch_name),160) where organization_id=org_id and code='MAIN';
  update public.organization_members set is_default=true,updated_at=now() where organization_id=org_id and user_id=current_user_id;
  insert into public.production_control_settings(organization_id,updated_by) values(org_id,current_user_id)
  on conflict(organization_id) do update set updated_by=current_user_id,updated_at=now();
  insert into public.onboarding_progress(organization_id,current_step) values(org_id,2)
  on conflict(organization_id) do update set current_step=greatest(public.onboarding_progress.current_step,2),updated_at=now();
  insert into public.auth_audit_events(user_id,organization_id,event_type,severity,metadata)
  values(current_user_id,org_id,'auth.organization.onboarding_started','info',jsonb_build_object('business_type',p_business_type));
  return org_id;
end;
$$;
revoke all on function public.bootstrap_organization_v2(text,text,text,text,text,text,text,text,text) from public;
grant execute on function public.bootstrap_organization_v2(text,text,text,text,text,text,text,text,text) to authenticated;

create or replace function public.update_onboarding_company_profile(
  p_organization_id uuid,p_name text,p_business_type text,p_country_code text,p_currency text,p_timezone text,
  p_tin text,p_vat_number text,p_phone text
) returns void language plpgsql security definer set search_path='' as $$
begin
  perform public.require_strong_admin(p_organization_id);
  update public.organizations set name=left(trim(p_name),160),industry=left(trim(p_business_type),120),
    country_code=upper(left(trim(p_country_code),2)),base_currency=upper(left(trim(p_currency),3)),
    timezone=left(trim(p_timezone),80),tin=nullif(trim(p_tin),''),vat_number=nullif(trim(p_vat_number),''),
    phone=nullif(trim(p_phone),''),updated_at=now()
  where id=p_organization_id;
  insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,metadata)
  values(p_organization_id,(select auth.uid()),'organization.profile.updated','organization',p_organization_id,jsonb_build_object('business_type',p_business_type));
end;
$$;
revoke all on function public.update_onboarding_company_profile(uuid,text,text,text,text,text,text,text,text) from public;
grant execute on function public.update_onboarding_company_profile(uuid,text,text,text,text,text,text,text,text) to authenticated;

create or replace function public.create_onboarding_branch(
  p_organization_id uuid,p_name text,p_code text,p_address text,p_create_warehouse boolean default true
) returns uuid language plpgsql security definer set search_path='' as $$
declare branch_id uuid; clean_code text:=upper(regexp_replace(trim(p_code),'[^A-Za-z0-9_-]','','g'));
begin
  perform public.require_strong_admin(p_organization_id);
  if char_length(trim(p_name))<2 or char_length(clean_code)<2 then raise exception 'Branch name and code are required'; end if;
  insert into public.branches(organization_id,name,code,address) values(p_organization_id,left(trim(p_name),160),left(clean_code,24),nullif(trim(p_address),'')) returning id into branch_id;
  if p_create_warehouse then
    insert into public.warehouses(organization_id,branch_id,name,code)
    values(p_organization_id,branch_id,left(trim(p_name)||' Warehouse',160),left(clean_code||'-WH',24));
  end if;
  insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,metadata)
  values(p_organization_id,(select auth.uid()),'branch.created','branch',branch_id,jsonb_build_object('code',clean_code));
  return branch_id;
end;
$$;
revoke all on function public.create_onboarding_branch(uuid,text,text,text,boolean) from public;
grant execute on function public.create_onboarding_branch(uuid,text,text,text,boolean) to authenticated;

create or replace function public.import_onboarding_customers(p_organization_id uuid,p_rows jsonb)
returns integer language plpgsql security definer set search_path='' as $$
declare item jsonb; inserted_count integer:=0; actor uuid:=(select auth.uid()); customer_name text;
begin
  perform public.require_strong_admin(p_organization_id);
  if jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows)>1000 then raise exception 'Import must contain at most 1000 rows'; end if;
  for item in select value from jsonb_array_elements(p_rows) loop
    customer_name:=trim(coalesce(item->>'name',''));
    if char_length(customer_name)>=2 and not exists(select 1 from public.customers c where c.organization_id=p_organization_id and lower(c.name)=lower(customer_name)) then
      insert into public.customers(organization_id,name,email,phone,tin,credit_limit,payment_terms_days,created_by)
      values(p_organization_id,left(customer_name,160),nullif(left(trim(item->>'email'),254),''),nullif(left(trim(item->>'phone'),40),''),nullif(left(trim(item->>'tin'),30),''),
        greatest(coalesce(nullif(item->>'credit_limit','')::numeric,0),0),greatest(coalesce(nullif(item->>'payment_terms_days','')::integer,0),0),actor);
      inserted_count:=inserted_count+1;
    end if;
  end loop;
  insert into public.audit_events(organization_id,actor_id,action,entity_type,metadata)
  values(p_organization_id,actor,'onboarding.customers.imported','customer_import',jsonb_build_object('count',inserted_count));
  return inserted_count;
end;
$$;
revoke all on function public.import_onboarding_customers(uuid,jsonb) from public;
grant execute on function public.import_onboarding_customers(uuid,jsonb) to authenticated;

create or replace function public.import_onboarding_suppliers(p_organization_id uuid,p_rows jsonb)
returns integer language plpgsql security definer set search_path='' as $$
declare item jsonb; inserted_count integer:=0; actor uuid:=(select auth.uid()); supplier_name text;
begin
  perform public.require_strong_admin(p_organization_id);
  if jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows)>1000 then raise exception 'Import must contain at most 1000 rows'; end if;
  for item in select value from jsonb_array_elements(p_rows) loop
    supplier_name:=trim(coalesce(item->>'name',''));
    if char_length(supplier_name)>=2 then
      insert into public.suppliers(organization_id,name,email,phone,tin,payment_terms_days,credit_limit,created_by)
      values(p_organization_id,left(supplier_name,160),nullif(left(trim(item->>'email'),254),''),nullif(left(trim(item->>'phone'),40),''),nullif(left(trim(item->>'tin'),30),''),
        greatest(coalesce(nullif(item->>'payment_terms_days','')::integer,0),0),greatest(coalesce(nullif(item->>'credit_limit','')::numeric,0),0),actor)
      on conflict(organization_id,name) do update set email=coalesce(excluded.email,public.suppliers.email),phone=coalesce(excluded.phone,public.suppliers.phone),tin=coalesce(excluded.tin,public.suppliers.tin),updated_at=now();
      inserted_count:=inserted_count+1;
    end if;
  end loop;
  insert into public.audit_events(organization_id,actor_id,action,entity_type,metadata)
  values(p_organization_id,actor,'onboarding.suppliers.imported','supplier_import',jsonb_build_object('count',inserted_count));
  return inserted_count;
end;
$$;
revoke all on function public.import_onboarding_suppliers(uuid,jsonb) from public;
grant execute on function public.import_onboarding_suppliers(uuid,jsonb) to authenticated;

create or replace function public.import_onboarding_products(p_organization_id uuid,p_warehouse_id uuid,p_rows jsonb)
returns integer language plpgsql security definer set search_path='' as $$
declare item jsonb; inserted_count integer:=0; actor uuid:=(select auth.uid()); product_id uuid; clean_sku text; opening_qty numeric;
begin
  perform public.require_strong_admin(p_organization_id);
  perform 1 from public.warehouses where id=p_warehouse_id and organization_id=p_organization_id and is_active;
  if not found then raise exception 'Warehouse not found'; end if;
  if jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows)>1000 then raise exception 'Import must contain at most 1000 rows'; end if;
  for item in select value from jsonb_array_elements(p_rows) loop
    clean_sku:=upper(trim(coalesce(item->>'sku','')));
    if char_length(clean_sku)>=1 and char_length(trim(coalesce(item->>'name','')))>=2 then
      insert into public.products(organization_id,sku,name,unit,unit_price,cost_price,reorder_level,created_by)
      values(p_organization_id,left(clean_sku,60),left(trim(item->>'name'),180),coalesce(nullif(left(trim(item->>'unit'),30),''),'unit'),
        greatest(coalesce(nullif(item->>'unit_price','')::numeric,0),0),greatest(coalesce(nullif(item->>'cost_price','')::numeric,0),0),greatest(coalesce(nullif(item->>'reorder_level','')::numeric,0),0),actor)
      on conflict(organization_id,sku) do update set name=excluded.name,unit=excluded.unit,unit_price=excluded.unit_price,cost_price=excluded.cost_price,reorder_level=excluded.reorder_level,updated_at=now()
      returning id into product_id;
      opening_qty:=greatest(coalesce(nullif(item->>'opening_quantity','')::numeric,0),0);
      if opening_qty>0 and not exists(select 1 from public.stock_balances where organization_id=p_organization_id and product_id=product_id and warehouse_id=p_warehouse_id and quantity>0) then
        perform public.record_stock_movement(p_organization_id,product_id,p_warehouse_id,'opening',opening_qty,'Onboarding opening stock',actor,'onboarding',null);
      end if;
      inserted_count:=inserted_count+1;
    end if;
  end loop;
  insert into public.audit_events(organization_id,actor_id,action,entity_type,metadata)
  values(p_organization_id,actor,'onboarding.products.imported','product_import',jsonb_build_object('count',inserted_count,'warehouse_id',p_warehouse_id));
  return inserted_count;
end;
$$;
revoke all on function public.import_onboarding_products(uuid,uuid,jsonb) from public;
grant execute on function public.import_onboarding_products(uuid,uuid,jsonb) to authenticated;

create or replace function public.post_onboarding_opening_balance(
  p_organization_id uuid,p_branch_id uuid,p_entry_date date,p_debit_account_id uuid,p_credit_account_id uuid,p_amount numeric,p_notes text
) returns text language plpgsql security definer set search_path='' as $$
declare actor uuid:=(select auth.uid()); journal_id uuid; journal_no text;
begin
  if not public.has_org_role(p_organization_id,array['owner','admin','accountant']::public.app_role[]) then raise exception 'Finance permission with MFA is required'; end if;
  if p_amount<=0 or p_debit_account_id=p_credit_account_id then raise exception 'Invalid opening balance'; end if;
  perform 1 from public.accounts where id=p_debit_account_id and organization_id=p_organization_id and is_active;
  if not found then raise exception 'Debit account not found'; end if;
  perform 1 from public.accounts where id=p_credit_account_id and organization_id=p_organization_id and is_active;
  if not found then raise exception 'Credit account not found'; end if;
  journal_no:=public.next_document_number(p_organization_id,'JE');
  insert into public.journal_entries(organization_id,branch_id,entry_number,entry_date,memo,status,source_type,created_by)
  values(p_organization_id,p_branch_id,journal_no,p_entry_date,'Opening balance · '||coalesce(nullif(trim(p_notes),''),'Company setup'),'draft','opening_balance',actor) returning id into journal_id;
  insert into public.journal_lines(organization_id,journal_entry_id,account_id,description,debit,credit) values
    (p_organization_id,journal_id,p_debit_account_id,'Opening balance',p_amount,0),
    (p_organization_id,journal_id,p_credit_account_id,'Opening balance',0,p_amount);
  update public.journal_entries set status='posted',posted_by=actor,posted_at=now() where id=journal_id;
  insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,metadata)
  values(p_organization_id,actor,'opening_balance.posted','journal_entry',journal_id,jsonb_build_object('entry_number',journal_no,'amount',p_amount));
  return journal_no;
end;
$$;
revoke all on function public.post_onboarding_opening_balance(uuid,uuid,date,uuid,uuid,numeric,text) from public;
grant execute on function public.post_onboarding_opening_balance(uuid,uuid,date,uuid,uuid,numeric,text) to authenticated;

create or replace function public.get_onboarding_snapshot(p_organization_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; completed jsonb; completed_count integer; business_type text;
begin
  if not public.is_org_member(p_organization_id) then raise exception 'Access denied'; end if;
  select lower(coalesce(industry,'')) into business_type from public.organizations where id=p_organization_id;
  completed:=jsonb_build_array(
    jsonb_build_object('key','company','complete',exists(select 1 from public.organizations where id=p_organization_id and nullif(industry,'') is not null and nullif(base_currency,'') is not null and nullif(timezone,'') is not null)),
    jsonb_build_object('key','branches','complete',exists(select 1 from public.branches where organization_id=p_organization_id and is_active)),
    jsonb_build_object('key','contacts','complete',exists(select 1 from public.customers where organization_id=p_organization_id) or exists(select 1 from public.suppliers where organization_id=p_organization_id)),
    jsonb_build_object('key','products','complete',exists(select 1 from public.products where organization_id=p_organization_id) and (business_type like '%service%' or exists(select 1 from public.stock_balances where organization_id=p_organization_id and quantity>0))),
    jsonb_build_object('key','taxes','complete',(select count(*)>=8 from public.accounts where organization_id=p_organization_id) and exists(select 1 from public.tax_codes where organization_id=p_organization_id and is_active)),
    jsonb_build_object('key','opening','complete',exists(select 1 from public.journal_entries where organization_id=p_organization_id and source_type='opening_balance' and status='posted')),
    jsonb_build_object('key','invoice','complete',exists(select 1 from public.sales_invoices where organization_id=p_organization_id and status<>'void')),
    jsonb_build_object('key','security','complete',not exists(select 1 from public.organization_members m where m.organization_id=p_organization_id and m.is_active and m.role in ('owner','admin') and not exists(select 1 from auth.mfa_factors f where f.user_id=m.user_id and f.status='verified')))
  );
  select count(*) into completed_count from jsonb_array_elements(completed) e where (e->>'complete')::boolean;
  update public.onboarding_progress set status=case when completed_count=8 then 'completed' else 'in_progress' end,
    current_step=least(8,completed_count+1),completed_steps=completed,completed_at=case when completed_count=8 then coalesce(completed_at,now()) else null end,updated_at=now()
  where organization_id=p_organization_id;
  select jsonb_build_object(
    'organization',(select to_jsonb(o) from (select id,name,industry,country_code,base_currency,timezone,tin,vat_number,phone from public.organizations where id=p_organization_id) o),
    'progress',jsonb_build_object('completed',completed_count,'total',8,'percent',completed_count*12.5,'steps',completed),
    'counts',jsonb_build_object(
      'branches',(select count(*) from public.branches where organization_id=p_organization_id and is_active),
      'customers',(select count(*) from public.customers where organization_id=p_organization_id),
      'suppliers',(select count(*) from public.suppliers where organization_id=p_organization_id),
      'products',(select count(*) from public.products where organization_id=p_organization_id),
      'openingStock',(select count(*) from public.stock_balances where organization_id=p_organization_id and quantity>0),
      'taxCodes',(select count(*) from public.tax_codes where organization_id=p_organization_id and is_active),
      'openingBalances',(select count(*) from public.journal_entries where organization_id=p_organization_id and source_type='opening_balance' and status='posted'),
      'invoices',(select count(*) from public.sales_invoices where organization_id=p_organization_id and status<>'void')
    ),
    'branches',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'code',code) order by created_at),'[]'::jsonb) from public.branches where organization_id=p_organization_id and is_active),
    'warehouses',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'code',code) order by created_at),'[]'::jsonb) from public.warehouses where organization_id=p_organization_id and is_active),
    'accounts',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'code',code,'name',name,'type',account_type) order by code),'[]'::jsonb) from public.accounts where organization_id=p_organization_id and is_active)
  ) into result;
  return result;
end;
$$;
revoke all on function public.get_onboarding_snapshot(uuid) from public;
grant execute on function public.get_onboarding_snapshot(uuid) to authenticated;

create or replace function public.update_production_controls(
  p_organization_id uuid,p_login_alerts boolean,p_financial_alerts boolean,p_audit_export boolean,
  p_backup_mode text,p_backup_retention_days integer
) returns void language plpgsql security definer set search_path='' as $$
begin
  perform public.require_strong_admin(p_organization_id);
  if p_backup_mode not in ('logical_daily','managed_daily','pitr') then raise exception 'Invalid backup mode'; end if;
  insert into public.production_control_settings(organization_id,login_alerts_enabled,financial_alerts_enabled,audit_export_enabled,backup_mode,backup_retention_days,updated_by)
  values(p_organization_id,p_login_alerts,p_financial_alerts,p_audit_export,p_backup_mode,p_backup_retention_days,(select auth.uid()))
  on conflict(organization_id) do update set login_alerts_enabled=excluded.login_alerts_enabled,financial_alerts_enabled=excluded.financial_alerts_enabled,
    audit_export_enabled=excluded.audit_export_enabled,backup_mode=excluded.backup_mode,backup_retention_days=excluded.backup_retention_days,updated_by=excluded.updated_by,updated_at=now();
  insert into public.auth_audit_events(user_id,organization_id,event_type,severity,metadata)
  values((select auth.uid()),p_organization_id,'auth.production_controls.updated','warning',jsonb_build_object('backup_mode',p_backup_mode));
end;
$$;
revoke all on function public.update_production_controls(uuid,boolean,boolean,boolean,text,integer) from public;
grant execute on function public.update_production_controls(uuid,boolean,boolean,boolean,text,integer) to authenticated;

create or replace function public.acknowledge_security_alert(p_organization_id uuid,p_alert_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
  perform public.require_strong_admin(p_organization_id);
  update public.security_alerts set status='acknowledged',acknowledged_by=(select auth.uid()),acknowledged_at=now()
  where id=p_alert_id and organization_id=p_organization_id;
end;
$$;
revoke all on function public.acknowledge_security_alert(uuid,uuid) from public;
grant execute on function public.acknowledge_security_alert(uuid,uuid) to authenticated;

create or replace function public.record_backup_evidence(
  p_organization_id uuid,p_completed_at timestamptz,p_checksum text,p_reference text
) returns void language plpgsql security definer set search_path='' as $$
begin
  perform public.require_strong_admin(p_organization_id);
  update public.production_control_settings set last_backup_at=p_completed_at,last_backup_checksum=left(trim(p_checksum),160),last_backup_reference=left(trim(p_reference),500),updated_by=(select auth.uid()),updated_at=now()
  where organization_id=p_organization_id;
  insert into public.auth_audit_events(user_id,organization_id,event_type,severity,metadata)
  values((select auth.uid()),p_organization_id,'auth.backup.evidence_recorded','info',jsonb_build_object('completed_at',p_completed_at,'reference',p_reference));
end;
$$;
revoke all on function public.record_backup_evidence(uuid,timestamptz,text,text) from public;
grant execute on function public.record_backup_evidence(uuid,timestamptz,text,text) to authenticated;

create or replace function public.record_restore_test(
  p_organization_id uuid,p_completed_at timestamptz,p_status text,p_notes text
) returns void language plpgsql security definer set search_path='' as $$
begin
  perform public.require_strong_admin(p_organization_id);
  if p_status not in ('passed','failed') then raise exception 'Invalid restore status'; end if;
  update public.production_control_settings set last_restore_test_at=p_completed_at,restore_test_status=p_status,restore_test_notes=left(trim(p_notes),2000),updated_by=(select auth.uid()),updated_at=now()
  where organization_id=p_organization_id;
  insert into public.auth_audit_events(user_id,organization_id,event_type,severity,metadata)
  values((select auth.uid()),p_organization_id,'auth.restore_test.recorded',case when p_status='passed' then 'info' else 'critical' end,jsonb_build_object('status',p_status,'completed_at',p_completed_at));
end;
$$;
revoke all on function public.record_restore_test(uuid,timestamptz,text,text) from public;
grant execute on function public.record_restore_test(uuid,timestamptz,text,text) to authenticated;

create or replace function public.capture_auth_security_alert()
returns trigger language plpgsql security definer set search_path='' as $$
declare org_id uuid; enabled boolean;
begin
  org_id:=coalesce(new.organization_id,(select m.organization_id from public.organization_members m where m.user_id=new.user_id and m.is_active order by m.is_default desc,m.created_at limit 1));
  if org_id is null then return new; end if;
  select login_alerts_enabled into enabled from public.production_control_settings where organization_id=org_id;
  if coalesce(enabled,true) and new.event_type in ('auth.sign_in.succeeded','auth.password.changed','auth.mfa.enrolled','auth.mfa.verified','auth.mfa.challenge_failed') then
    insert into public.security_alerts(organization_id,category,severity,title,description,actor_id,metadata)
    values(org_id,'authentication',case when new.event_type='auth.mfa.challenge_failed' then 'critical' else new.severity end,
      replace(initcap(replace(new.event_type,'auth.','')),'.',' '),'Authentication activity recorded',new.user_id,new.metadata);
  end if;
  return new;
end;
$$;
drop trigger if exists auth_audit_security_alert on public.auth_audit_events;
create trigger auth_audit_security_alert after insert on public.auth_audit_events for each row execute function public.capture_auth_security_alert();

create or replace function public.capture_financial_security_alert()
returns trigger language plpgsql security definer set search_path='' as $$
declare enabled boolean;
begin
  select financial_alerts_enabled into enabled from public.production_control_settings where organization_id=new.organization_id;
  if coalesce(enabled,true) and new.action ~ '^(invoice|journal|payment|payroll|supplier|stock|period|asset|opening_balance)\.' then
    insert into public.security_alerts(organization_id,category,severity,title,description,actor_id,metadata)
    values(new.organization_id,'financial_action',case when new.action in ('period.locked','payroll.paid') then 'warning' else 'info' end,
      replace(initcap(replace(new.action,'.',' ')),'.',' '),new.entity_type,new.actor_id,new.metadata||jsonb_build_object('entity_id',new.entity_id));
  end if;
  return new;
end;
$$;
drop trigger if exists financial_audit_security_alert on public.audit_events;
create trigger financial_audit_security_alert after insert on public.audit_events for each row execute function public.capture_financial_security_alert();

create or replace function public.run_database_health_checks(p_target_organization_id uuid default null)
returns integer language plpgsql security definer set search_path='' as $$
declare org record; negative_stock integer; unbalanced_journals integer; missing_rls integer; admins_without_mfa integer; backup_stale boolean; restore_overdue boolean; health_status text; checks_json jsonb; processed integer:=0; caller uuid:=(select auth.uid());
begin
  if caller is not null then
    if p_target_organization_id is null then raise exception 'Organization is required'; end if;
    perform public.require_strong_admin(p_target_organization_id);
  end if;
  for org in select id from public.organizations where p_target_organization_id is null or id=p_target_organization_id loop
    insert into public.production_control_settings(organization_id) values(org.id) on conflict do nothing;
    select count(*) into negative_stock from public.stock_balances where organization_id=org.id and quantity<0;
    select count(*) into unbalanced_journals from (
      select je.id from public.journal_entries je join public.journal_lines jl on jl.journal_entry_id=je.id
      where je.organization_id=org.id and je.status='posted' group by je.id having round(sum(jl.debit),2)<>round(sum(jl.credit),2)
    ) q;
    select count(*) into missing_rls from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relkind='r' and not c.relrowsecurity;
    select count(*) into admins_without_mfa from public.organization_members m
      where m.organization_id=org.id and m.is_active and m.role in ('owner','admin')
      and not exists(select 1 from auth.mfa_factors f where f.user_id=m.user_id and f.status='verified');
    select last_backup_at is null or last_backup_at<now()-interval '36 hours',
      last_restore_test_at is null or last_restore_test_at<now()-interval '120 days'
    into backup_stale,restore_overdue from public.production_control_settings where organization_id=org.id;
    health_status:=case when negative_stock>0 or unbalanced_journals>0 or missing_rls>0 then 'critical'
      when admins_without_mfa>0 or backup_stale or restore_overdue then 'warning' else 'healthy' end;
    checks_json:=jsonb_build_object('negativeStock',negative_stock,'unbalancedPostedJournals',unbalanced_journals,'publicTablesWithoutRls',missing_rls,
      'adminsWithoutMfa',admins_without_mfa,'backupStale',backup_stale,'restoreTestOverdue',restore_overdue);
    insert into public.database_health_checks(organization_id,status,checks,checked_by) values(org.id,health_status,checks_json,caller);
    if health_status<>'healthy' and not exists(select 1 from public.security_alerts where organization_id=org.id and category='database_health' and status='open' and created_at>now()-interval '12 hours') then
      insert into public.security_alerts(organization_id,category,severity,title,description,actor_id,metadata)
      values(org.id,'database_health',case when health_status='critical' then 'critical' else 'warning' end,'Database health requires attention','Review the latest production health check.',caller,checks_json);
    end if;
    processed:=processed+1;
  end loop;
  return processed;
end;
$$;
revoke all on function public.run_database_health_checks(uuid) from public;
grant execute on function public.run_database_health_checks(uuid) to authenticated;

create or replace function public.get_production_controls_snapshot(p_organization_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
  perform public.require_strong_admin(p_organization_id);
  insert into public.production_control_settings(organization_id) values(p_organization_id) on conflict do nothing;
  select jsonb_build_object(
    'settings',(select to_jsonb(s) from public.production_control_settings s where s.organization_id=p_organization_id),
    'mfa',jsonb_build_object(
      'requiredAdmins',(select count(*) from public.organization_members where organization_id=p_organization_id and is_active and role in ('owner','admin')),
      'verifiedAdmins',(select count(distinct m.user_id) from public.organization_members m join auth.mfa_factors f on f.user_id=m.user_id and f.status='verified' where m.organization_id=p_organization_id and m.is_active and m.role in ('owner','admin'))
    ),
    'alerts',(select coalesce(jsonb_agg(to_jsonb(a) order by a.created_at desc),'[]'::jsonb) from (select * from public.security_alerts where organization_id=p_organization_id order by created_at desc limit 50) a),
    'health',(select to_jsonb(h) from public.database_health_checks h where h.organization_id=p_organization_id order by h.created_at desc limit 1),
    'auditCounts',jsonb_build_object(
      'business',(select count(*) from public.audit_events where organization_id=p_organization_id),
      'authentication',(select count(*) from public.auth_audit_events where organization_id=p_organization_id)
    )
  ) into result;
  return result;
end;
$$;
revoke all on function public.get_production_controls_snapshot(uuid) from public;
grant execute on function public.get_production_controls_snapshot(uuid) to authenticated;

-- Daily health checks run at 02:15 UTC. The job is safe to recreate.
do $$
declare existing_job bigint;
begin
  select jobid into existing_job from cron.job where jobname='hisab_daily_database_health' limit 1;
  if existing_job is not null then perform cron.unschedule(existing_job); end if;
  perform cron.schedule('hisab_daily_database_health','15 2 * * *','select public.run_database_health_checks(null::uuid);');
exception when undefined_table then
  raise notice 'pg_cron is unavailable; schedule database health externally';
end $$;

select public.run_database_health_checks(null::uuid);
