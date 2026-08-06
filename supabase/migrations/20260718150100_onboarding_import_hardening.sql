-- Keep product master import and opening-stock posting separately retryable.

drop function if exists public.import_onboarding_products(uuid,uuid,jsonb);

create or replace function public.sync_user_mfa_requirement()
returns trigger language plpgsql security definer set search_path='' as $$
declare target_user uuid; required_value boolean;
begin
  if tg_op='DELETE' then target_user:=old.user_id; else target_user:=new.user_id; end if;
  select exists(select 1 from public.organization_members m where m.user_id=target_user and m.is_active and m.role in ('owner','admin')) into required_value;
  insert into public.user_security_profiles(user_id,mfa_required,updated_at) values(target_user,required_value,now())
  on conflict(user_id) do update set mfa_required=excluded.mfa_required,updated_at=now();
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;

create or replace function public.import_onboarding_products(p_organization_id uuid,p_rows jsonb)
returns integer language plpgsql security definer set search_path='' as $$
declare item jsonb; imported integer:=0; actor uuid:=(select auth.uid()); clean_sku text;
begin
  perform public.require_strong_admin(p_organization_id);
  if jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows)>1000 then raise exception 'Import must contain at most 1000 rows'; end if;
  for item in select value from jsonb_array_elements(p_rows) loop
    clean_sku:=upper(trim(coalesce(item->>'sku','')));
    if char_length(clean_sku)>=1 and char_length(trim(coalesce(item->>'name','')))>=2 then
      insert into public.products(organization_id,sku,name,unit,unit_price,cost_price,reorder_level,created_by)
      values(p_organization_id,left(clean_sku,60),left(trim(item->>'name'),180),coalesce(nullif(left(trim(item->>'unit'),30),''),'unit'),
        greatest(coalesce(nullif(item->>'unit_price','')::numeric,0),0),greatest(coalesce(nullif(item->>'cost_price','')::numeric,0),0),greatest(coalesce(nullif(item->>'reorder_level','')::numeric,0),0),actor)
      on conflict(organization_id,sku) do update set name=excluded.name,unit=excluded.unit,unit_price=excluded.unit_price,cost_price=excluded.cost_price,reorder_level=excluded.reorder_level,updated_at=now();
      imported:=imported+1;
    end if;
  end loop;
  insert into public.audit_events(organization_id,actor_id,action,entity_type,metadata)
  values(p_organization_id,actor,'onboarding.products.imported','product_import',jsonb_build_object('count',imported));
  return imported;
end;
$$;
revoke all on function public.import_onboarding_products(uuid,jsonb) from public;
grant execute on function public.import_onboarding_products(uuid,jsonb) to authenticated;

create or replace function public.import_onboarding_opening_stock(p_organization_id uuid,p_warehouse_id uuid,p_rows jsonb)
returns integer language plpgsql security definer set search_path='' as $$
declare item jsonb; posted integer:=0; actor uuid:=(select auth.uid()); v_product_id uuid; quantity_value numeric; clean_sku text;
begin
  perform public.require_strong_admin(p_organization_id);
  perform 1 from public.warehouses where id=p_warehouse_id and organization_id=p_organization_id and is_active;
  if not found then raise exception 'Warehouse not found'; end if;
  if jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows)>1000 then raise exception 'Import must contain at most 1000 rows'; end if;
  for item in select value from jsonb_array_elements(p_rows) loop
    clean_sku:=upper(trim(coalesce(item->>'sku','')));
    quantity_value:=greatest(coalesce(nullif(item->>'opening_quantity','')::numeric,0),0);
    select p.id into v_product_id from public.products p where p.organization_id=p_organization_id and p.sku=clean_sku and p.is_active;
    if v_product_id is not null and quantity_value>0 and not exists(
      select 1 from public.stock_balances sb
      where sb.organization_id=p_organization_id and sb.product_id=v_product_id and sb.warehouse_id=p_warehouse_id and sb.quantity>0
    ) then
      perform public.record_stock_movement(p_organization_id,v_product_id,p_warehouse_id,'opening',quantity_value,'Onboarding opening stock',actor,'onboarding',null);
      posted:=posted+1;
    end if;
  end loop;
  return posted;
end;
$$;
revoke all on function public.import_onboarding_opening_stock(uuid,uuid,jsonb) from public;
grant execute on function public.import_onboarding_opening_stock(uuid,uuid,jsonb) to authenticated;
