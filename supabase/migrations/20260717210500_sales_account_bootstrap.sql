-- New organizations receive the complete Finance + Sales chart of accounts.

create or replace function public.bootstrap_organization(p_name text,p_full_name text,p_tin text default null,p_phone text default null) returns uuid language plpgsql security definer set search_path='' as $$
declare org_id uuid; branch_id uuid; current_user_id uuid:=auth.uid();
begin
 if current_user_id is null then raise exception 'Authentication required'; end if;
 select m.organization_id into org_id from public.organization_members m where m.user_id=current_user_id limit 1;
 if org_id is not null then return org_id; end if;
 insert into public.organizations(name,tin,phone,created_by) values(p_name,p_tin,p_phone,current_user_id) returning id into org_id;
 insert into public.branches(organization_id,name,code) values(org_id,'Main Branch','MAIN') returning id into branch_id;
 insert into public.organization_members(organization_id,branch_id,user_id,full_name,role) values(org_id,branch_id,current_user_id,p_full_name,'owner');
 insert into public.warehouses(organization_id,branch_id,name,code) values(org_id,branch_id,'Main Warehouse','MAIN');
 insert into public.accounts(organization_id,code,name,account_type,normal_side,is_system,account_subtype,currency,allow_manual_posting) values
 (org_id,'1000','Cash on Hand','asset','debit',true,'cash','ETB',true),(org_id,'1010','Bank Accounts','asset','debit',true,'bank','ETB',true),(org_id,'1100','Accounts Receivable','asset','debit',true,'receivable','ETB',false),(org_id,'1200','Inventory','asset','debit',true,'inventory','ETB',false),(org_id,'1300','Input VAT Recoverable','asset','debit',true,'tax','ETB',true),(org_id,'1500','Property, Plant & Equipment','asset','debit',true,'fixed_asset','ETB',true),(org_id,'1510','Accumulated Depreciation','asset','credit',true,'contra_asset','ETB',true),(org_id,'2000','Accounts Payable','liability','credit',true,'payable','ETB',true),(org_id,'2100','Output VAT Payable','liability','credit',true,'tax','ETB',true),(org_id,'2200','Other Taxes Payable','liability','credit',true,'tax','ETB',true),(org_id,'3000','Owner Equity','equity','credit',true,'equity','ETB',true),(org_id,'4000','Sales Revenue','revenue','credit',true,'sales','ETB',true),(org_id,'4050','Sales Returns and Allowances','revenue','debit',true,'sales_return','ETB',false),(org_id,'5000','Cost of Goods Sold','expense','debit',true,'cogs','ETB',true),(org_id,'6000','Operating Expenses','expense','debit',true,'operating_expense','ETB',true),(org_id,'6100','Depreciation Expense','expense','debit',true,'depreciation','ETB',true);
 insert into public.tax_codes(organization_id,code,name,rate,tax_type,account_id,created_by) select org_id,'VAT15-OUT','VAT 15% Output',15,'output',a.id,current_user_id from public.accounts a where a.organization_id=org_id and a.code='2100';
 insert into public.tax_codes(organization_id,code,name,rate,tax_type,account_id,created_by) select org_id,'VAT15-IN','VAT 15% Input',15,'input',a.id,current_user_id from public.accounts a where a.organization_id=org_id and a.code='1300';
 insert into public.accounting_periods(organization_id,name,start_date,end_date,status,created_by) select org_id,to_char(gs,'Mon YYYY'),gs::date,(gs+interval '1 month - 1 day')::date,'open',current_user_id from generate_series(date_trunc('year',current_date),date_trunc('year',current_date)+interval '11 months',interval '1 month') gs;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,metadata) values(org_id,current_user_id,'organization.created','organization',org_id,jsonb_build_object('name',p_name));
 return org_id;
end; $$;
