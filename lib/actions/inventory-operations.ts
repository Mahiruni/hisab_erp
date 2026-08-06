"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "../config";
import { can, getCurrentUserContext } from "../data/context";
import { createClient } from "../supabase/server";
import { optionalText, positiveNumber, requiredText } from "../validation";

type RpcResult = { id?: string; number?: string; value?: number; adjustments?: number; serials?: number };
function result(value: unknown): RpcResult { return value && typeof value === "object" ? value as RpcResult : {}; }
function lines(formData: FormData, name = "linesJson") { const parsed: unknown = JSON.parse(requiredText(formData.get(name), name, 100_000)); if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > 1000) throw new Error("At least one valid line is required."); return parsed; }
async function requireInventory() { if (!isSupabaseConfigured()) throw new Error("Inventory actions are disabled in demo mode."); const context = await getCurrentUserContext({ required: true }); if (!context || !can(context, "manage_inventory")) throw new Error("You do not have permission to manage inventory."); return context; }
async function rpc(name: string, args: Record<string, unknown>) { const supabase = await createClient(); const { data, error } = await supabase.rpc(name, args); if (error) throw new Error(error.message); return result(data); }
function done(tab: string, code: "recordCreated" | "recordUpdated" | "moneyRecorded", record: string, amount?: number) { const params = new URLSearchParams({ tab, successCode: code, record }); if (amount !== undefined) params.set("amount", String(amount)); redirect(`/inventory?${params.toString()}`); }

export async function createStockTransferAction(formData: FormData) {
  const context = await requireInventory();
  const data = await rpc("create_stock_transfer", { p_organization_id: context.organizationId, p_branch_id: context.branchId, p_source_warehouse_id: requiredText(formData.get("sourceWarehouseId"), "sourceWarehouseId", 80), p_destination_warehouse_id: requiredText(formData.get("destinationWarehouseId"), "destinationWarehouseId", 80), p_transfer_date: requiredText(formData.get("transferDate"), "transferDate", 10), p_notes: optionalText(formData.get("notes"), 1000), p_lines: lines(formData), p_actor_id: context.userId });
  revalidatePath("/inventory"); done("transfers", "recordCreated", data.number || "Stock transfer");
}
export async function completeStockTransferAction(formData: FormData) {
  const context = await requireInventory();
  const data = await rpc("complete_stock_transfer", { p_organization_id: context.organizationId, p_stock_transfer_id: requiredText(formData.get("stockTransferId"), "stockTransferId", 80), p_actor_id: context.userId });
  revalidatePath("/inventory"); done("transfers", "recordUpdated", data.number || "Stock transfer");
}
export async function createStockCountAction(formData: FormData) {
  const context = await requireInventory();
  const data = await rpc("create_stock_count", { p_organization_id: context.organizationId, p_branch_id: context.branchId, p_warehouse_id: requiredText(formData.get("warehouseId"), "warehouseId", 80), p_count_date: requiredText(formData.get("countDate"), "countDate", 10), p_notes: optionalText(formData.get("notes"), 1000), p_actor_id: context.userId });
  revalidatePath("/inventory"); done("counts", "recordCreated", data.number || "Stock count");
}
export async function submitStockCountAction(formData: FormData) {
  const context = await requireInventory();
  const data = await rpc("submit_stock_count", { p_organization_id: context.organizationId, p_stock_count_id: requiredText(formData.get("stockCountId"), "stockCountId", 80), p_lines: lines(formData), p_actor_id: context.userId });
  revalidatePath("/inventory"); done("counts", "recordUpdated", data.number || "Stock count");
}
export async function postStockCountAction(formData: FormData) {
  const context = await requireInventory();
  const data = await rpc("post_stock_count", { p_organization_id: context.organizationId, p_stock_count_id: requiredText(formData.get("stockCountId"), "stockCountId", 80), p_actor_id: context.userId });
  revalidatePath("/inventory"); revalidatePath("/finance"); done("counts", "recordUpdated", `${data.number || "Stock count"} · ${Number(data.adjustments || 0)} adjustments`);
}
export async function postInventoryAdjustmentAction(formData: FormData) {
  const context = await requireInventory();
  const data = await rpc("post_inventory_adjustment", { p_organization_id: context.organizationId, p_branch_id: context.branchId, p_warehouse_id: requiredText(formData.get("warehouseId"), "warehouseId", 80), p_product_id: requiredText(formData.get("productId"), "productId", 80), p_adjustment_type: requiredText(formData.get("adjustmentType"), "adjustmentType", 20), p_quantity: positiveNumber(formData.get("quantity"), "quantity"), p_adjustment_date: requiredText(formData.get("adjustmentDate"), "adjustmentDate", 10), p_reason: requiredText(formData.get("reason"), "reason", 500), p_source_count_id: null, p_actor_id: context.userId });
  revalidatePath("/inventory"); revalidatePath("/finance"); done("adjustments", "moneyRecorded", data.number || "Inventory adjustment", Number(data.value || 0));
}
export async function registerInventoryTrackingAction(formData: FormData) {
  const context = await requireInventory();
  const serialNumbers = optionalText(formData.get("serialNumbers"), 20_000)?.split(/[\n,]+/).map((value) => value.trim()).filter(Boolean) || [];
  const data = await rpc("register_inventory_tracking", { p_organization_id: context.organizationId, p_product_id: requiredText(formData.get("productId"), "productId", 80), p_warehouse_id: requiredText(formData.get("warehouseId"), "warehouseId", 80), p_lot_number: optionalText(formData.get("lotNumber"), 120), p_manufacture_date: optionalText(formData.get("manufactureDate"), 10), p_expiry_date: optionalText(formData.get("expiryDate"), 10), p_quantity: positiveNumber(formData.get("quantity") || "0", "quantity", true), p_serial_numbers: serialNumbers, p_actor_id: context.userId });
  revalidatePath("/inventory"); done("tracking", "recordCreated", `${data.number || "Tracking record"} · ${Number(data.serials || 0)} serials`);
}