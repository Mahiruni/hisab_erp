-- Allow signed-in ERP users to read organization-scoped stock balances through
-- the Supabase Data API. Row Level Security remains the authorization boundary;
-- the existing stock_select policy limits rows with is_org_member(organization_id).

grant select on table public.stock_balances to authenticated;
