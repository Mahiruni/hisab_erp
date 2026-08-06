-- Electronic invoicing foundation for Ethiopian clearance workflows.
-- Provider-neutral: official API endpoints, certificates and credentials are configured later.

create table if not exists public.e_invoice_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  provider text not null default 'manual_portal' check (provider in ('manual_portal','ministry_api','accredited_provider')),
  environment text not null default 'sandbox' check (environment in ('sandbox','production')),
  submission_mode text not null default 'manual_clearance' check (submission_mode in ('manual_clearance','clearance_api','offline_queue')),
  status text not null default 'draft' check (status in ('draft','review','ready','suspended')),
  legal_name text not null,
  taxpayer_tin text not null,
  vat_number text,
  commercial_registration_number text,
  provider_account_reference text,
  certificate_alias text,
  notes text,
  last_verified_at timestamptz,
  verified_by uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.e_invoice_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid references public.e_invoice_profiles(id) on delete set null,
  sales_invoice_id uuid not null unique references public.sales_invoices(id) on delete restrict,
  document_type text not null default 'invoice' check (document_type in ('invoice','credit_note','debit_note')),
  status text not null default 'draft' check (status in ('draft','queued','submitting','accepted','rejected','failed','cancel_pending','cancelled')),
  provider text not null default 'manual_portal',
  environment text not null default 'sandbox',
  submission_mode text not null default 'manual_clearance',
  official_invoice_id text,
  official_receipt_id text,
  verification_url text,
  qr_payload text,
  digital_signature text,
  certificate_serial text,
  provider_request_id text,
  provider_response_id text,
  payload_snapshot jsonb not null default '{}'::jsonb,
  payload_hash text,
  response_snapshot jsonb not null default '{}'::jsonb,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  offline_queued boolean not null default false,
  queued_at timestamptz,
  next_retry_at timestamptz,
  submitted_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  cancellation_requested_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  cancellation_reference text,
  last_error_code text,
  last_error_message text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.e_invoice_events (
  id bigserial primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_id uuid not null references public.e_invoice_documents(id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  actor_id uuid references auth.users(id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists e_invoice_documents_org_status_idx on public.e_invoice_documents(organization_id,status,created_at desc);
create index if not exists e_invoice_documents_retry_idx on public.e_invoice_documents(next_retry_at) where status in ('queued','failed');
create index if not exists e_invoice_documents_created_by_idx on public.e_invoice_documents(created_by);
create index if not exists e_invoice_documents_profile_id_idx on public.e_invoice_documents(profile_id);
create index if not exists e_invoice_events_document_time_idx on public.e_invoice_events(document_id,occurred_at desc);
create index if not exists e_invoice_events_org_time_idx on public.e_invoice_events(organization_id,occurred_at desc);
create index if not exists e_invoice_events_actor_id_idx on public.e_invoice_events(actor_id);
create index if not exists e_invoice_profiles_created_by_idx on public.e_invoice_profiles(created_by);
create index if not exists e_invoice_profiles_verified_by_idx on public.e_invoice_profiles(verified_by);

alter table public.e_invoice_profiles enable row level security;
alter table public.e_invoice_documents enable row level security;
alter table public.e_invoice_events enable row level security;

drop policy if exists e_invoice_profiles_select on public.e_invoice_profiles;
create policy e_invoice_profiles_select on public.e_invoice_profiles for select to authenticated
using ((select public.is_org_member(organization_id)));

drop policy if exists e_invoice_documents_select on public.e_invoice_documents;
create policy e_invoice_documents_select on public.e_invoice_documents for select to authenticated
using ((select public.is_org_member(organization_id)));

drop policy if exists e_invoice_events_select on public.e_invoice_events;
create policy e_invoice_events_select on public.e_invoice_events for select to authenticated
using ((select public.is_org_member(organization_id)));

revoke all on public.e_invoice_profiles, public.e_invoice_documents, public.e_invoice_events from anon;
revoke insert, update, delete on public.e_invoice_profiles, public.e_invoice_documents, public.e_invoice_events from authenticated;
grant select on public.e_invoice_profiles, public.e_invoice_documents, public.e_invoice_events to authenticated;

create or replace function public.compose_e_invoice_payload(p_document_id uuid)
returns jsonb
language sql
stable
security definer
set search_path=''
as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'schemaVersion','hisab.einvoice.v1',
    'documentType',d.document_type,
    'seller',jsonb_build_object(
      'organizationId',o.id,
      'legalName',coalesce(p.legal_name,o.name),
      'tin',coalesce(p.taxpayer_tin,o.tin),
      'vatNumber',coalesce(p.vat_number,o.vat_number),
      'commercialRegistrationNumber',p.commercial_registration_number,
      'countryCode',trim(o.country_code),
      'currency',trim(o.base_currency),
      'branch',jsonb_build_object('id',b.id,'code',b.code,'name',b.name,'address',b.address)
    ),
    'buyer',jsonb_build_object('customerId',c.id,'name',c.name,'tin',c.tin,'email',c.email,'phone',c.phone),
    'invoice',jsonb_build_object(
      'id',i.id,'number',i.invoice_number,'date',i.invoice_date,'dueDate',i.due_date,
      'currency',trim(i.currency),'subtotal',i.subtotal,'discount',i.discount_amount,
      'tax',i.tax_amount,'total',i.total,'customerReference',i.customer_reference,'notes',i.notes
    ),
    'lines',coalesce((
      select jsonb_agg(jsonb_build_object(
        'lineNumber',x.line_number,'productId',x.product_id,'sku',x.sku,
        'description',x.description,'quantity',x.quantity,'unitPrice',x.unit_price,
        'discountRate',x.discount_rate,'discountAmount',x.line_discount,
        'taxRate',x.tax_rate,'taxAmount',x.line_tax,
        'netAmount',x.line_subtotal-x.line_discount,
        'grossAmount',x.line_subtotal-x.line_discount+x.line_tax
      ) order by x.line_number)
      from (
        select row_number() over(order by ii.id) as line_number,
          ii.product_id,pr.sku,ii.description,ii.quantity,ii.unit_price,
          ii.discount_rate,ii.line_discount,ii.tax_rate,ii.line_tax,ii.line_subtotal
        from public.sales_invoice_items ii
        join public.products pr on pr.id=ii.product_id
        where ii.invoice_id=i.id
      ) x
    ),'[]'::jsonb)
  ))
  from public.e_invoice_documents d
  join public.sales_invoices i on i.id=d.sales_invoice_id and i.organization_id=d.organization_id
  join public.organizations o on o.id=d.organization_id
  left join public.e_invoice_profiles p on p.id=d.profile_id
  left join public.branches b on b.id=i.branch_id
  join public.customers c on c.id=i.customer_id
  where d.id=p_document_id
$$;

create or replace function public.create_e_invoice_document_for_sales_invoice()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_profile public.e_invoice_profiles%rowtype;
  v_document_id uuid;
  v_payload jsonb;
  v_status text := 'draft';
begin
  select * into v_profile from public.e_invoice_profiles where organization_id=new.organization_id;
  if found and v_profile.status='ready' then v_status := 'queued'; end if;

  insert into public.e_invoice_documents(
    organization_id,profile_id,sales_invoice_id,status,provider,environment,
    submission_mode,offline_queued,queued_at,created_by
  ) values (
    new.organization_id,v_profile.id,new.id,v_status,
    coalesce(v_profile.provider,'manual_portal'),coalesce(v_profile.environment,'sandbox'),
    coalesce(v_profile.submission_mode,'manual_clearance'),
    coalesce(v_profile.submission_mode='offline_queue',false),
    case when v_status='queued' then now() else null end,new.created_by
  ) on conflict (sales_invoice_id) do nothing returning id into v_document_id;

  if v_document_id is null then return new; end if;
  if v_status='queued' then
    v_payload := public.compose_e_invoice_payload(v_document_id);
    update public.e_invoice_documents set
      payload_snapshot=v_payload,
      payload_hash=encode(digest(v_payload::text,'sha256'),'hex'),
      updated_at=now()
    where id=v_document_id;
  end if;

  insert into public.e_invoice_events(organization_id,document_id,event_type,to_status,actor_id,details)
  values(new.organization_id,v_document_id,
    case when v_status='queued' then 'document.auto_queued' else 'document.created' end,
    v_status,new.created_by,jsonb_build_object('invoiceNumber',new.invoice_number));
  return new;
end
$$;

drop trigger if exists sales_invoice_create_e_invoice_document on public.sales_invoices;
create trigger sales_invoice_create_e_invoice_document
after insert on public.sales_invoices
for each row execute function public.create_e_invoice_document_for_sales_invoice();

create or replace function public.upsert_e_invoice_profile(
  p_organization_id uuid,p_provider text,p_environment text,p_submission_mode text,p_status text,
  p_legal_name text,p_taxpayer_tin text,p_vat_number text,p_commercial_registration_number text,
  p_provider_account_reference text,p_certificate_alias text,p_notes text,p_actor_id uuid
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare v_id uuid;
begin
  if p_actor_id is distinct from auth.uid() then raise exception 'Actor mismatch'; end if;
  if not public.has_org_role(p_organization_id,array['owner','admin']::public.app_role[]) then raise exception 'Owner or administrator permission required'; end if;
  if p_provider not in ('manual_portal','ministry_api','accredited_provider') then raise exception 'Invalid provider'; end if;
  if p_environment not in ('sandbox','production') then raise exception 'Invalid environment'; end if;
  if p_submission_mode not in ('manual_clearance','clearance_api','offline_queue') then raise exception 'Invalid submission mode'; end if;
  if p_status not in ('draft','review','ready','suspended') then raise exception 'Invalid profile status'; end if;
  if length(trim(coalesce(p_legal_name,'')))<2 then raise exception 'Legal name is required'; end if;
  if length(trim(coalesce(p_taxpayer_tin,'')))<6 then raise exception 'A valid taxpayer TIN is required'; end if;

  insert into public.e_invoice_profiles(
    organization_id,provider,environment,submission_mode,status,legal_name,taxpayer_tin,
    vat_number,commercial_registration_number,provider_account_reference,certificate_alias,
    notes,last_verified_at,verified_by,created_by,updated_at
  ) values (
    p_organization_id,p_provider,p_environment,p_submission_mode,p_status,trim(p_legal_name),trim(p_taxpayer_tin),
    nullif(trim(p_vat_number),''),nullif(trim(p_commercial_registration_number),''),
    nullif(trim(p_provider_account_reference),''),nullif(trim(p_certificate_alias),''),nullif(trim(p_notes),''),
    case when p_status='ready' then now() else null end,case when p_status='ready' then p_actor_id else null end,p_actor_id,now()
  ) on conflict (organization_id) do update set
    provider=excluded.provider,environment=excluded.environment,submission_mode=excluded.submission_mode,
    status=excluded.status,legal_name=excluded.legal_name,taxpayer_tin=excluded.taxpayer_tin,
    vat_number=excluded.vat_number,commercial_registration_number=excluded.commercial_registration_number,
    provider_account_reference=excluded.provider_account_reference,certificate_alias=excluded.certificate_alias,
    notes=excluded.notes,last_verified_at=excluded.last_verified_at,verified_by=excluded.verified_by,updated_at=now()
  returning id into v_id;

  insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,metadata)
  values(p_organization_id,p_actor_id,'einvoice.profile.updated','e_invoice_profile',v_id,
    jsonb_build_object('provider',p_provider,'environment',p_environment,'submissionMode',p_submission_mode,'status',p_status));
  return jsonb_build_object('id',v_id,'status',p_status);
end
$$;

create or replace function public.queue_e_invoice_document(p_organization_id uuid,p_document_id uuid,p_offline boolean,p_actor_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare v_document public.e_invoice_documents%rowtype; v_profile public.e_invoice_profiles%rowtype; v_payload jsonb; v_hash text;
begin
  if p_actor_id is distinct from auth.uid() then raise exception 'Actor mismatch'; end if;
  if not public.has_org_role(p_organization_id,array['owner','admin','accountant','sales']::public.app_role[]) then raise exception 'Insufficient electronic-invoice permission'; end if;
  select * into v_document from public.e_invoice_documents where id=p_document_id and organization_id=p_organization_id for update;
  if not found then raise exception 'Electronic invoice document not found'; end if;
  if v_document.status not in ('draft','rejected','failed') then raise exception 'Only draft, rejected or failed documents can be queued'; end if;
  select * into v_profile from public.e_invoice_profiles where organization_id=p_organization_id and status='ready';
  if not found then raise exception 'Complete and approve the electronic-invoice profile first'; end if;

  v_payload := public.compose_e_invoice_payload(v_document.id);
  if v_payload is null then raise exception 'Unable to build electronic-invoice payload'; end if;
  v_hash := encode(digest(v_payload::text,'sha256'),'hex');
  update public.e_invoice_documents set
    profile_id=v_profile.id,status='queued',provider=v_profile.provider,environment=v_profile.environment,
    submission_mode=v_profile.submission_mode,payload_snapshot=v_payload,payload_hash=v_hash,response_snapshot='{}'::jsonb,
    attempt_count=attempt_count+1,offline_queued=coalesce(p_offline,false) or v_profile.submission_mode='offline_queue',
    queued_at=now(),next_retry_at=case when coalesce(p_offline,false) or v_profile.submission_mode='offline_queue' then now()+interval '15 minutes' else null end,
    submitted_at=null,accepted_at=null,rejected_at=null,last_error_code=null,last_error_message=null,updated_at=now()
  where id=v_document.id;

  insert into public.e_invoice_events(organization_id,document_id,event_type,from_status,to_status,actor_id,details)
  values(p_organization_id,v_document.id,'document.queued',v_document.status,'queued',p_actor_id,
    jsonb_build_object('offline',coalesce(p_offline,false),'payloadHash',v_hash,'attempt',v_document.attempt_count+1));
  insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,metadata)
  values(p_organization_id,p_actor_id,'einvoice.document.queued','e_invoice_document',v_document.id,
    jsonb_build_object('payloadHash',v_hash,'offline',coalesce(p_offline,false)));
  return jsonb_build_object('id',v_document.id,'status','queued','payloadHash',v_hash);
end
$$;

create or replace function public.record_e_invoice_clearance(
  p_organization_id uuid,p_document_id uuid,p_official_invoice_id text,p_official_receipt_id text,
  p_qr_payload text,p_verification_url text,p_digital_signature text,p_certificate_serial text,
  p_provider_request_id text,p_provider_response_id text,p_response_snapshot jsonb,p_actor_id uuid
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare v_document public.e_invoice_documents%rowtype;
begin
  if p_actor_id is distinct from auth.uid() then raise exception 'Actor mismatch'; end if;
  if not public.has_org_role(p_organization_id,array['owner','admin','accountant']::public.app_role[]) then raise exception 'Owner, administrator or accountant permission required'; end if;
  select * into v_document from public.e_invoice_documents where id=p_document_id and organization_id=p_organization_id for update;
  if not found then raise exception 'Electronic invoice document not found'; end if;
  if v_document.status not in ('queued','submitting','rejected','failed') then raise exception 'Document is not awaiting clearance'; end if;
  if length(trim(coalesce(p_official_invoice_id,'')))<3 then raise exception 'Official invoice identifier is required'; end if;
  if length(trim(coalesce(p_qr_payload,'')))<3 then raise exception 'Official QR payload is required'; end if;

  update public.e_invoice_documents set
    status='accepted',official_invoice_id=trim(p_official_invoice_id),official_receipt_id=nullif(trim(p_official_receipt_id),''),
    qr_payload=trim(p_qr_payload),verification_url=nullif(trim(p_verification_url),''),digital_signature=nullif(trim(p_digital_signature),''),
    certificate_serial=nullif(trim(p_certificate_serial),''),provider_request_id=nullif(trim(p_provider_request_id),''),
    provider_response_id=nullif(trim(p_provider_response_id),''),response_snapshot=coalesce(p_response_snapshot,'{}'::jsonb),
    submitted_at=coalesce(submitted_at,now()),accepted_at=now(),rejected_at=null,next_retry_at=null,
    last_error_code=null,last_error_message=null,updated_at=now()
  where id=v_document.id;

  insert into public.e_invoice_events(organization_id,document_id,event_type,from_status,to_status,actor_id,details)
  values(p_organization_id,v_document.id,'document.accepted',v_document.status,'accepted',p_actor_id,
    jsonb_build_object('officialInvoiceId',trim(p_official_invoice_id),'providerResponseId',nullif(trim(p_provider_response_id),'')));
  insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,metadata)
  values(p_organization_id,p_actor_id,'einvoice.document.accepted','e_invoice_document',v_document.id,
    jsonb_build_object('officialInvoiceId',trim(p_official_invoice_id),'payloadHash',v_document.payload_hash));
  return jsonb_build_object('id',v_document.id,'status','accepted','officialInvoiceId',trim(p_official_invoice_id));
end
$$;

create or replace function public.record_e_invoice_rejection(
  p_organization_id uuid,p_document_id uuid,p_error_code text,p_error_message text,
  p_provider_response_id text,p_response_snapshot jsonb,p_actor_id uuid
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare v_document public.e_invoice_documents%rowtype;
begin
  if p_actor_id is distinct from auth.uid() then raise exception 'Actor mismatch'; end if;
  if not public.has_org_role(p_organization_id,array['owner','admin','accountant']::public.app_role[]) then raise exception 'Owner, administrator or accountant permission required'; end if;
  select * into v_document from public.e_invoice_documents where id=p_document_id and organization_id=p_organization_id for update;
  if not found then raise exception 'Electronic invoice document not found'; end if;
  if v_document.status not in ('queued','submitting','failed') then raise exception 'Document is not awaiting a response'; end if;
  if length(trim(coalesce(p_error_message,'')))<3 then raise exception 'Rejection reason is required'; end if;

  update public.e_invoice_documents set
    status='rejected',provider_response_id=nullif(trim(p_provider_response_id),''),
    response_snapshot=coalesce(p_response_snapshot,'{}'::jsonb),rejected_at=now(),accepted_at=null,next_retry_at=null,
    last_error_code=nullif(trim(p_error_code),''),last_error_message=trim(p_error_message),updated_at=now()
  where id=v_document.id;
  insert into public.e_invoice_events(organization_id,document_id,event_type,from_status,to_status,actor_id,details)
  values(p_organization_id,v_document.id,'document.rejected',v_document.status,'rejected',p_actor_id,
    jsonb_build_object('errorCode',nullif(trim(p_error_code),''),'message',trim(p_error_message)));
  insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,metadata)
  values(p_organization_id,p_actor_id,'einvoice.document.rejected','e_invoice_document',v_document.id,
    jsonb_build_object('errorCode',nullif(trim(p_error_code),''),'message',trim(p_error_message)));
  return jsonb_build_object('id',v_document.id,'status','rejected');
end
$$;

create or replace function public.request_e_invoice_cancellation(p_organization_id uuid,p_document_id uuid,p_reason text,p_actor_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare v_document public.e_invoice_documents%rowtype;
begin
  if p_actor_id is distinct from auth.uid() then raise exception 'Actor mismatch'; end if;
  if not public.has_org_role(p_organization_id,array['owner','admin','accountant']::public.app_role[]) then raise exception 'Owner, administrator or accountant permission required'; end if;
  select * into v_document from public.e_invoice_documents where id=p_document_id and organization_id=p_organization_id for update;
  if not found then raise exception 'Electronic invoice document not found'; end if;
  if v_document.status<>'accepted' then raise exception 'Only accepted documents can be cancelled'; end if;
  if length(trim(coalesce(p_reason,'')))<5 then raise exception 'Cancellation reason is required'; end if;
  update public.e_invoice_documents set status='cancel_pending',cancellation_reason=trim(p_reason),cancellation_requested_at=now(),updated_at=now() where id=v_document.id;
  insert into public.e_invoice_events(organization_id,document_id,event_type,from_status,to_status,actor_id,details)
  values(p_organization_id,v_document.id,'cancellation.requested','accepted','cancel_pending',p_actor_id,jsonb_build_object('reason',trim(p_reason)));
  insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,metadata)
  values(p_organization_id,p_actor_id,'einvoice.cancellation.requested','e_invoice_document',v_document.id,
    jsonb_build_object('reason',trim(p_reason),'officialInvoiceId',v_document.official_invoice_id));
  return jsonb_build_object('id',v_document.id,'status','cancel_pending');
end
$$;

create or replace function public.record_e_invoice_cancellation(
  p_organization_id uuid,p_document_id uuid,p_cancellation_reference text,p_response_snapshot jsonb,p_actor_id uuid
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare v_document public.e_invoice_documents%rowtype;
begin
  if p_actor_id is distinct from auth.uid() then raise exception 'Actor mismatch'; end if;
  if not public.has_org_role(p_organization_id,array['owner','admin','accountant']::public.app_role[]) then raise exception 'Owner, administrator or accountant permission required'; end if;
  select * into v_document from public.e_invoice_documents where id=p_document_id and organization_id=p_organization_id for update;
  if not found then raise exception 'Electronic invoice document not found'; end if;
  if v_document.status<>'cancel_pending' then raise exception 'Cancellation has not been requested'; end if;
  if length(trim(coalesce(p_cancellation_reference,'')))<3 then raise exception 'Cancellation reference is required'; end if;
  update public.e_invoice_documents set status='cancelled',cancellation_reference=trim(p_cancellation_reference),
    response_snapshot=coalesce(p_response_snapshot,response_snapshot),cancelled_at=now(),updated_at=now() where id=v_document.id;
  insert into public.e_invoice_events(organization_id,document_id,event_type,from_status,to_status,actor_id,details)
  values(p_organization_id,v_document.id,'cancellation.accepted','cancel_pending','cancelled',p_actor_id,
    jsonb_build_object('reference',trim(p_cancellation_reference)));
  insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,metadata)
  values(p_organization_id,p_actor_id,'einvoice.document.cancelled','e_invoice_document',v_document.id,
    jsonb_build_object('reference',trim(p_cancellation_reference),'officialInvoiceId',v_document.official_invoice_id));
  return jsonb_build_object('id',v_document.id,'status','cancelled');
end
$$;

create or replace function public.get_e_invoice_snapshot(target_organization_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare v_result jsonb;
begin
  if not public.is_org_member(target_organization_id) then raise exception 'Access denied'; end if;
  select jsonb_build_object(
    'profile',(
      select jsonb_build_object(
        'id',p.id,'provider',p.provider,'environment',p.environment,'submissionMode',p.submission_mode,
        'status',p.status,'legalName',p.legal_name,'taxpayerTin',p.taxpayer_tin,'vatNumber',p.vat_number,
        'commercialRegistrationNumber',p.commercial_registration_number,
        'providerAccountReference',p.provider_account_reference,'certificateAlias',p.certificate_alias,
        'notes',p.notes,'lastVerifiedAt',p.last_verified_at
      ) from public.e_invoice_profiles p where p.organization_id=target_organization_id
    ),
    'metrics',jsonb_build_object(
      'draft',(select count(*) from public.e_invoice_documents where organization_id=target_organization_id and status='draft'),
      'queued',(select count(*) from public.e_invoice_documents where organization_id=target_organization_id and status in ('queued','submitting')),
      'accepted',(select count(*) from public.e_invoice_documents where organization_id=target_organization_id and status='accepted'),
      'rejected',(select count(*) from public.e_invoice_documents where organization_id=target_organization_id and status in ('rejected','failed')),
      'cancelPending',(select count(*) from public.e_invoice_documents where organization_id=target_organization_id and status='cancel_pending'),
      'cancelled',(select count(*) from public.e_invoice_documents where organization_id=target_organization_id and status='cancelled')
    ),
    'documents',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',d.id,'invoiceId',d.sales_invoice_id,'invoiceNumber',i.invoice_number,'invoiceDate',i.invoice_date,
        'customerName',c.name,'customerTin',c.tin,'total',i.total,'status',d.status,'provider',d.provider,
        'environment',d.environment,'submissionMode',d.submission_mode,'officialInvoiceId',d.official_invoice_id,
        'officialReceiptId',d.official_receipt_id,'verificationUrl',d.verification_url,'qrPayload',d.qr_payload,
        'payloadHash',d.payload_hash,'attemptCount',d.attempt_count,'offlineQueued',d.offline_queued,
        'queuedAt',d.queued_at,'submittedAt',d.submitted_at,'acceptedAt',d.accepted_at,'rejectedAt',d.rejected_at,
        'cancellationRequestedAt',d.cancellation_requested_at,'cancelledAt',d.cancelled_at,
        'cancellationReason',d.cancellation_reason,'cancellationReference',d.cancellation_reference,
        'lastErrorCode',d.last_error_code,'lastErrorMessage',d.last_error_message,
        'lastEvent',(
          select jsonb_build_object('type',e.event_type,'fromStatus',e.from_status,'toStatus',e.to_status,
            'details',e.details,'occurredAt',e.occurred_at)
          from public.e_invoice_events e where e.document_id=d.id order by e.occurred_at desc,e.id desc limit 1
        )
      ) order by i.invoice_date desc,d.created_at desc)
      from (select * from public.e_invoice_documents where organization_id=target_organization_id order by created_at desc limit 100) d
      join public.sales_invoices i on i.id=d.sales_invoice_id
      join public.customers c on c.id=i.customer_id
    ),'[]'::jsonb)
  ) into v_result;
  return v_result;
end
$$;

revoke all on function public.compose_e_invoice_payload(uuid) from public, anon, authenticated;
revoke all on function public.create_e_invoice_document_for_sales_invoice() from public, anon, authenticated;
revoke all on function public.upsert_e_invoice_profile(uuid,text,text,text,text,text,text,text,text,text,text,text,uuid) from public, anon;
revoke all on function public.queue_e_invoice_document(uuid,uuid,boolean,uuid) from public, anon;
revoke all on function public.record_e_invoice_clearance(uuid,uuid,text,text,text,text,text,text,text,text,jsonb,uuid) from public, anon;
revoke all on function public.record_e_invoice_rejection(uuid,uuid,text,text,text,jsonb,uuid) from public, anon;
revoke all on function public.request_e_invoice_cancellation(uuid,uuid,text,uuid) from public, anon;
revoke all on function public.record_e_invoice_cancellation(uuid,uuid,text,jsonb,uuid) from public, anon;
revoke all on function public.get_e_invoice_snapshot(uuid) from public, anon;

grant execute on function public.upsert_e_invoice_profile(uuid,text,text,text,text,text,text,text,text,text,text,text,uuid) to authenticated;
grant execute on function public.queue_e_invoice_document(uuid,uuid,boolean,uuid) to authenticated;
grant execute on function public.record_e_invoice_clearance(uuid,uuid,text,text,text,text,text,text,text,text,jsonb,uuid) to authenticated;
grant execute on function public.record_e_invoice_rejection(uuid,uuid,text,text,text,jsonb,uuid) to authenticated;
grant execute on function public.request_e_invoice_cancellation(uuid,uuid,text,uuid) to authenticated;
grant execute on function public.record_e_invoice_cancellation(uuid,uuid,text,jsonb,uuid) to authenticated;
grant execute on function public.get_e_invoice_snapshot(uuid) to authenticated;
