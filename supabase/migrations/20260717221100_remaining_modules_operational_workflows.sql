create or replace function public.operational_module_can_manage(target_org uuid, target_module text)
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select case
    when target_module in ('security-approvals-audit','human-resources-payroll','integrations-automation')
      then public.has_org_role(target_org,array['owner','admin']::public.app_role[])
    when target_module in ('purchasing-expenses','reports-analytics','localization-compliance','fixed-assets','budgeting-projects')
      then public.has_org_role(target_org,array['owner','admin','accountant']::public.app_role[])
    when target_module='inventory-warehouse'
      then public.has_org_role(target_org,array['owner','admin','inventory']::public.app_role[])
    when target_module='customers-suppliers'
      then public.has_org_role(target_org,array['owner','admin','accountant','sales']::public.app_role[])
    else false
  end;
$$;
revoke all on function public.operational_module_can_manage(uuid,text) from public,anon,authenticated;

create or replace function public.create_operational_record(
  p_organization_id uuid,
  p_branch_id uuid,
  p_module_slug text,
  p_record_type text,
  p_title text,
  p_description text,
  p_counterparty text,
  p_owner_name text,
  p_status text,
  p_priority text,
  p_amount numeric,
  p_due_date date,
  p_metadata jsonb,
  p_actor_id uuid
) returns text
language plpgsql
security definer
set search_path to ''
as $$
declare record_id uuid; declare record_no text; declare prefix text;
begin
  if p_actor_id is distinct from auth.uid() then raise exception 'Actor mismatch'; end if;
  if not public.operational_module_can_manage(p_organization_id,p_module_slug) then raise exception 'Insufficient module permission'; end if;
  if p_branch_id is not null and not exists(select 1 from public.branches b where b.id=p_branch_id and b.organization_id=p_organization_id and b.is_active) then raise exception 'Invalid branch'; end if;
  if nullif(trim(p_title),'') is null then raise exception 'Title is required'; end if;
  if nullif(trim(p_record_type),'') is null then raise exception 'Record type is required'; end if;
  if coalesce(p_amount,0) < 0 then raise exception 'Amount cannot be negative'; end if;
  if coalesce(p_priority,'normal') not in ('low','normal','high','critical') then raise exception 'Invalid priority'; end if;

  prefix := case p_module_slug
    when 'purchasing-expenses' then 'PUR' when 'inventory-warehouse' then 'WH'
    when 'customers-suppliers' then 'CRM' when 'security-approvals-audit' then 'CTL'
    when 'reports-analytics' then 'RPT' when 'localization-compliance' then 'CMP'
    when 'human-resources-payroll' then 'HR' when 'fixed-assets' then 'AST'
    when 'budgeting-projects' then 'PRJ' when 'integrations-automation' then 'INT'
    else 'OPS' end;
  record_no := public.next_document_number(p_organization_id,prefix);

  insert into public.operational_records(
    organization_id,branch_id,module_slug,record_type,record_number,title,description,counterparty,
    owner_name,status,priority,amount,due_date,metadata,created_by
  ) values (
    p_organization_id,p_branch_id,p_module_slug,trim(p_record_type),record_no,trim(p_title),
    nullif(trim(coalesce(p_description,'')),''),nullif(trim(coalesce(p_counterparty,'')),''),
    nullif(trim(coalesce(p_owner_name,'')),''),coalesce(nullif(trim(p_status),''),'draft'),
    coalesce(p_priority,'normal'),round(coalesce(p_amount,0),2),p_due_date,coalesce(p_metadata,'{}'::jsonb),p_actor_id
  ) returning id into record_id;

  insert into public.operational_record_events(organization_id,record_id,event_type,new_status,message,created_by)
  values (p_organization_id,record_id,'created',coalesce(nullif(trim(p_status),''),'draft'),'Created '||record_no||' · '||trim(p_title),p_actor_id);

  insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,metadata)
  values (p_organization_id,p_actor_id,'operational.record.created',p_module_slug,record_id,
    jsonb_build_object('record_number',record_no,'record_type',p_record_type,'status',p_status,'amount',coalesce(p_amount,0)));
  return record_no;
end;
$$;

create or replace function public.update_operational_record_status(
  p_organization_id uuid,p_record_id uuid,p_status text,p_update_note text,p_actor_id uuid
) returns text
language plpgsql
security definer
set search_path to ''
as $$
declare old_status text; declare module_name text; declare record_no text;
begin
  if p_actor_id is distinct from auth.uid() then raise exception 'Actor mismatch'; end if;
  select module_slug,status,record_number into module_name,old_status,record_no
  from public.operational_records where id=p_record_id and organization_id=p_organization_id for update;
  if not found then raise exception 'Operational record not found'; end if;
  if not public.operational_module_can_manage(p_organization_id,module_name) then raise exception 'Insufficient module permission'; end if;
  if nullif(trim(p_status),'') is null then raise exception 'Status is required'; end if;

  update public.operational_records set status=trim(p_status),
    metadata=metadata || jsonb_build_object('lastUpdateNote',nullif(trim(coalesce(p_update_note,'')),'')),updated_at=now()
  where id=p_record_id;

  insert into public.operational_record_events(organization_id,record_id,event_type,previous_status,new_status,message,created_by)
  values (p_organization_id,p_record_id,'status_changed',old_status,trim(p_status),
    coalesce(nullif(trim(coalesce(p_update_note,'')),''),record_no||' updated from '||old_status||' to '||trim(p_status)),p_actor_id);

  insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,metadata)
  values (p_organization_id,p_actor_id,'operational.record.status_changed',module_name,p_record_id,
    jsonb_build_object('record_number',record_no,'from',old_status,'to',trim(p_status),'note',p_update_note));
  return record_no;
end;
$$;

create or replace function public.get_operational_module_snapshot(target_organization_id uuid,target_module_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare result jsonb;
begin
  if not public.is_org_member(target_organization_id) then raise exception 'Access denied'; end if;
  select jsonb_build_object(
    'metrics',jsonb_build_object(
      'total',count(*),
      'active',count(*) filter (where lower(status) not in ('completed','approved','paid','closed','cancelled','rejected','connected','posted','reconciled','processed','disposed')),
      'completed',count(*) filter (where lower(status) in ('completed','approved','paid','closed','connected','posted','reconciled','processed','disposed')),
      'atRisk',count(*) filter (where due_date < current_date and lower(status) not in ('completed','approved','paid','closed','cancelled','rejected','connected','posted','reconciled','processed','disposed')),
      'value',coalesce(sum(amount),0)
    ),
    'records',coalesce((select jsonb_agg(jsonb_build_object(
      'id',r.id,'number',r.record_number,'type',r.record_type,'title',r.title,'description',r.description,
      'counterparty',r.counterparty,'owner',r.owner_name,'status',r.status,'priority',r.priority,'amount',r.amount,
      'dueDate',r.due_date,'metadata',r.metadata,'createdAt',r.created_at,'updatedAt',r.updated_at
    ) order by r.updated_at desc) from (select * from public.operational_records where organization_id=target_organization_id and module_slug=target_module_slug order by updated_at desc limit 100) r),'[]'::jsonb),
    'activity',coalesce((select jsonb_agg(jsonb_build_object(
      'id',e.id,'recordId',e.record_id,'recordNumber',r.record_number,'eventType',e.event_type,
      'previousStatus',e.previous_status,'newStatus',e.new_status,'message',e.message,'createdAt',e.created_at
    ) order by e.created_at desc) from public.operational_record_events e join public.operational_records r on r.id=e.record_id
    where e.organization_id=target_organization_id and r.module_slug=target_module_slug limit 40),'[]'::jsonb)
  ) into result from public.operational_records where organization_id=target_organization_id and module_slug=target_module_slug;
  return result;
end;
$$;

revoke all on function public.create_operational_record(uuid,uuid,text,text,text,text,text,text,text,text,numeric,date,jsonb,uuid) from public,anon;
revoke all on function public.update_operational_record_status(uuid,uuid,text,text,uuid) from public,anon;
revoke all on function public.get_operational_module_snapshot(uuid,text) from public,anon;
grant execute on function public.create_operational_record(uuid,uuid,text,text,text,text,text,text,text,text,numeric,date,jsonb,uuid) to authenticated;
grant execute on function public.update_operational_record_status(uuid,uuid,text,text,uuid) to authenticated;
grant execute on function public.get_operational_module_snapshot(uuid,text) to authenticated;
