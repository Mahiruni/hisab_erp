import { unstable_noStore as noStore } from "next/cache";
import { isSupabaseConfigured } from "../config";
import { createClient } from "../supabase/server";
import { getCurrentUserContext } from "./context";
import { demoCustomers, demoDashboard, demoFinance, demoJournals, demoProducts } from "./demo";
import type { CustomerRecord, DashboardSnapshot, FinanceSnapshot, JournalRecord, ProductRecord } from "./types";

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  noStore();
  if (!isSupabaseConfigured()) return demoDashboard;
  const context = await getCurrentUserContext();
  if (!context) return demoDashboard;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_dashboard_snapshot", { target_organization_id: context.organizationId });
  if (error || !data) throw new Error(`Unable to load dashboard: ${error?.message ?? "Unknown error"}`);
  const snapshot = data as Omit<DashboardSnapshot, "mode" | "userName" | "organizationName">;
  return { ...snapshot, mode: "live", userName: context.fullName.split(" ")[0], organizationName: context.organizationName };
}

export async function getFinanceSnapshot(): Promise<FinanceSnapshot> {
  noStore();
  if (!isSupabaseConfigured()) return demoFinance;
  const context = await getCurrentUserContext({ required: true });
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_finance_snapshot", { target_organization_id: context!.organizationId });
  if (error || !data) throw new Error(`Unable to load finance workspace: ${error?.message ?? "Unknown error"}`);
  const snapshot = data as Omit<FinanceSnapshot, "mode" | "organizationName">;
  return { ...snapshot, mode: "live", organizationName: context!.organizationName };
}

export async function listCustomers(): Promise<{ mode: "demo" | "live"; records: CustomerRecord[] }> {
  noStore();
  if (!isSupabaseConfigured()) return { mode: "demo", records: demoCustomers };
  const context = await getCurrentUserContext({ required: true });
  const supabase = await createClient();
  const { data, error } = await supabase.from("customers").select("id,name,email,phone,tin,credit_limit").eq("organization_id", context!.organizationId).order("name");
  if (error) throw new Error(error.message);
  return { mode: "live", records: (data ?? []).map((row: any) => ({ id: String(row.id), name: row.name, email: row.email, phone: row.phone, tin: row.tin, creditLimit: Number(row.credit_limit) })) };
}

export async function listProducts(): Promise<{ mode: "demo" | "live"; records: ProductRecord[]; warehouseId: string | null }> {
  noStore();
  if (!isSupabaseConfigured()) return { mode: "demo", records: demoProducts, warehouseId: null };
  const context = await getCurrentUserContext({ required: true });
  const supabase = await createClient();
  const { data: warehouses } = await supabase.from("warehouses").select("id").eq("organization_id", context!.organizationId).order("created_at").limit(1);
  const warehouseId = warehouses?.[0]?.id ? String(warehouses[0].id) : null;
  const { data, error } = await supabase.from("product_stock_view").select("product_id,sku,name,quantity,reorder_level,unit_price,warehouse_name").eq("organization_id", context!.organizationId).order("name");
  if (error) throw new Error(error.message);
  return {
    mode: "live",
    warehouseId,
    records: (data ?? []).map((row: any) => ({ id: String(row.product_id), sku: row.sku, name: row.name, quantity: Number(row.quantity), reorderLevel: Number(row.reorder_level), unitPrice: Number(row.unit_price), warehouseName: row.warehouse_name })),
  };
}

export async function listJournals(): Promise<{ mode: "demo" | "live"; records: JournalRecord[] }> {
  noStore();
  if (!isSupabaseConfigured()) return { mode: "demo", records: demoJournals };
  const context = await getCurrentUserContext({ required: true });
  const supabase = await createClient();
  const { data, error } = await supabase.from("journal_summary_view").select("id,entry_number,entry_date,memo,status,total_debit,total_credit").eq("organization_id", context!.organizationId).order("entry_date", { ascending: false }).limit(100);
  if (error) throw new Error(error.message);
  return { mode: "live", records: (data ?? []).map((row: any) => ({ id: String(row.id), number: row.entry_number, date: row.entry_date, memo: row.memo, status: row.status, debit: Number(row.total_debit), credit: Number(row.total_credit) })) };
}