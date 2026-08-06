revoke all on table public.operational_records from public,anon,authenticated;
revoke all on table public.operational_record_events from public,anon,authenticated;
grant select on table public.operational_records to authenticated;
grant select on table public.operational_record_events to authenticated;
