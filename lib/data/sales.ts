import { unstable_noStore as noStore } from "next/cache";
import { isSupabaseConfigured } from "../config";
import { createClient } from "../supabase/server";
import { getCurrentUserContext } from "./context";
import { demoSales } from "./sales-demo";
import type { SalesSnapshot } from "./sales-types";

export async function getSalesSnapshot(): Promise<SalesSnapshot> {
  noStore();
  if (!isSupabaseConfigured()) return demoSales;

  const context = await getCurrentUserContext({ required: true });
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_sales_snapshot", {
    target_organization_id: context!.organizationId,
  });

  if (error || !data) {
    throw new Error(`Unable to load Sales & Invoicing: ${error?.message ?? "Unknown error"}`);
  }

  const snapshot = data as Omit<SalesSnapshot, "mode" | "organizationName">;
  return {
    ...snapshot,
    mode: "live",
    organizationName: context!.organizationName,
  };
}
