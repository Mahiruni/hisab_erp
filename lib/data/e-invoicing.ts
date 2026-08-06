import { unstable_noStore as noStore } from "next/cache";
import { isSupabaseConfigured } from "../config";
import { createClient } from "../supabase/server";
import { getCurrentUserContext } from "./context";
import { demoEInvoicing } from "./e-invoicing-demo";
import type { EInvoiceSnapshot } from "./e-invoicing-types";

export async function getEInvoiceSnapshot(): Promise<EInvoiceSnapshot> {
  noStore();
  if (!isSupabaseConfigured()) return demoEInvoicing;

  const context = await getCurrentUserContext({ required: true });
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_e_invoice_snapshot", {
    target_organization_id: context!.organizationId,
  });

  if (error || !data) {
    throw new Error(`Unable to load Electronic Invoicing: ${error?.message ?? "Unknown error"}`);
  }

  const snapshot = data as Omit<EInvoiceSnapshot, "mode" | "organizationName">;
  return {
    ...snapshot,
    mode: "live",
    organizationName: context!.organizationName,
  };
}
