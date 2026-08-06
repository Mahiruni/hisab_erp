"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "../config";
import { can, getCurrentUserContext } from "../data/context";
import { createClient } from "../supabase/server";
import { optionalEmail, optionalText, positiveNumber, requiredText } from "../validation";

function requireLiveMode() {
  if (!isSupabaseConfigured()) throw new Error("This action is disabled in demo mode. Configure Supabase first.");
}

export async function createCustomer(formData: FormData) {
  requireLiveMode();
  const context = await getCurrentUserContext({ required: true });
  if (!can(context!, "manage_sales")) throw new Error("You do not have permission to manage customers.");
  const payload = {
    organization_id: context!.organizationId,
    branch_id: context!.branchId,
    name: requiredText(formData.get("name"), "name", 160),
    email: optionalEmail(formData.get("email")),
    phone: optionalText(formData.get("phone"), 40),
    tin: optionalText(formData.get("tin"), 30),
    credit_limit: positiveNumber(formData.get("creditLimit") || "0", "creditLimit", true),
    created_by: context!.userId,
  };
  const supabase = await createClient();
  const { error } = await supabase.from("customers").insert(payload);
  if (error) throw new Error(error.message);
  await supabase.from("audit_events").insert({ organization_id: context!.organizationId, actor_id: context!.userId, action: "customer.created", entity_type: "customer", metadata: { name: payload.name } });
  revalidatePath("/customers");
  redirect("/customers?created=1");
}

export async function createProduct(formData: FormData) {
  requireLiveMode();
  const context = await getCurrentUserContext({ required: true });
  if (!can(context!, "manage_inventory")) throw new Error("You do not have permission to manage inventory.");
  const supabase = await createClient();
  const warehouseId = requiredText(formData.get("warehouseId"), "warehouseId", 80);
  const product = {
    organization_id: context!.organizationId,
    sku: requiredText(formData.get("sku"), "sku", 60).toUpperCase(),
    name: requiredText(formData.get("name"), "name", 180),
    unit_price: positiveNumber(formData.get("unitPrice"), "unitPrice", true),
    cost_price: positiveNumber(formData.get("costPrice") || "0", "costPrice", true),
    reorder_level: positiveNumber(formData.get("reorderLevel") || "0", "reorderLevel", true),
    created_by: context!.userId,
  };
  const { data, error } = await supabase.from("products").insert(product).select("id").single();
  if (error) throw new Error(error.message);
  const openingQuantity = positiveNumber(formData.get("openingQuantity") || "0", "openingQuantity", true);
  if (openingQuantity > 0) {
    const { error: movementError } = await supabase.rpc("record_stock_movement", { p_organization_id: context!.organizationId, p_product_id: data.id, p_warehouse_id: warehouseId, p_movement_type: "opening", p_quantity: openingQuantity, p_reference: "Opening balance", p_actor_id: context!.userId });
    if (movementError) throw new Error(movementError.message);
  }
  revalidatePath("/inventory");
  redirect("/inventory?created=1");
}

export async function createInvoice(formData: FormData) {
  requireLiveMode();
  const context = await getCurrentUserContext({ required: true });
  if (!can(context!, "manage_sales")) throw new Error("You do not have permission to create invoices.");
  const payload = {
    p_organization_id: context!.organizationId,
    p_branch_id: context!.branchId,
    p_customer_id: requiredText(formData.get("customerId"), "customerId", 80),
    p_product_id: requiredText(formData.get("productId"), "productId", 80),
    p_warehouse_id: requiredText(formData.get("warehouseId"), "warehouseId", 80),
    p_quantity: positiveNumber(formData.get("quantity"), "quantity"),
    p_unit_price: positiveNumber(formData.get("unitPrice"), "unitPrice", true),
    p_tax_rate: positiveNumber(formData.get("taxRate") || "15", "taxRate", true),
    p_notes: optionalText(formData.get("notes"), 500),
    p_actor_id: context!.userId,
  };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_sales_invoice", payload);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/inventory");
  redirect(`/sales/invoices/new?created=${encodeURIComponent(String(data))}`);
}

export async function bootstrapOrganization(formData: FormData) {
  requireLiveMode();
  const context = await getCurrentUserContext();
  if (context) redirect("/");
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/auth/login");
  const { error } = await supabase.rpc("bootstrap_organization", {
    p_name: requiredText(formData.get("organizationName"), "organizationName", 160),
    p_full_name: requiredText(formData.get("fullName"), "fullName", 120),
    p_tin: optionalText(formData.get("tin"), 30),
    p_phone: optionalText(formData.get("phone"), 40),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/");
  redirect("/");
}
