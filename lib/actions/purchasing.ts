"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "../config";
import { can, getCurrentUserContext } from "../data/context";
import { createClient } from "../supabase/server";
import { optionalText, positiveNumber, requiredText } from "../validation";

type RpcResult = { id?: string; number?: string; total?: number; amount?: number; status?: string };

function requireLive() {
  if (!isSupabaseConfigured()) throw new Error("Purchasing actions are disabled in demo mode.");
}
async function requirePurchasing() {
  requireLive();
  const context = await getCurrentUserContext({ required: true });
  if (!context || !can(context, "manage_purchasing")) throw new Error("You do not have permission to manage purchasing.");
  return context;
}
function lines(formData: FormData, name = "linesJson") {
  const raw = requiredText(formData.get(name), name, 100_000);
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > 100) throw new Error("At least one valid line is required.");
  return parsed;
}
function result(value: unknown): RpcResult {
  return value && typeof value === "object" ? value as RpcResult : {};
}
function done(tab: string, code: "recordCreated" | "recordUpdated" | "moneyRecorded", record: string, amount?: number) {
  const params = new URLSearchParams({ tab, successCode: code, record });
  if (amount !== undefined) params.set("amount", String(amount));
  redirect(`/purchasing?${params.toString()}`);
}
async function rpc(name: string, args: Record<string, unknown>) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw new Error(error.message);
  return result(data);
}

export async function createSupplierAction(formData: FormData) {
  const context = await requirePurchasing();
  const data = await rpc("create_supplier", {
    p_organization_id: context.organizationId,
    p_branch_id: context.branchId,
    p_name: requiredText(formData.get("name"), "name", 180),
    p_email: optionalText(formData.get("email"), 180),
    p_phone: optionalText(formData.get("phone"), 80),
    p_tin: optionalText(formData.get("tin"), 80),
    p_payment_terms_days: Math.round(positiveNumber(formData.get("paymentTermsDays") || "0", "paymentTermsDays", true)),
    p_credit_limit: positiveNumber(formData.get("creditLimit") || "0", "creditLimit", true),
    p_bank_details: optionalText(formData.get("bankDetails"), 500),
    p_actor_id: context.userId,
  });
  revalidatePath("/purchasing");
  done("suppliers", "recordCreated", data.number || "Supplier");
}

export async function createPurchaseRequestAction(formData: FormData) {
  const context = await requirePurchasing();
  const data = await rpc("create_purchase_request", {
    p_organization_id: context.organizationId,
    p_branch_id: context.branchId,
    p_request_date: requiredText(formData.get("requestDate"), "requestDate", 10),
    p_needed_by: optionalText(formData.get("neededBy"), 10),
    p_department: optionalText(formData.get("department"), 120),
    p_requested_by_name: optionalText(formData.get("requestedByName"), 160) || context.fullName,
    p_notes: optionalText(formData.get("notes"), 1000),
    p_lines: lines(formData),
    p_actor_id: context.userId,
  });
  revalidatePath("/purchasing");
  done("requests", "recordCreated", data.number || "Purchase request");
}

export async function setPurchaseRequestStatusAction(formData: FormData) {
  const context = await requirePurchasing();
  const data = await rpc("set_purchase_request_status", {
    p_organization_id: context.organizationId,
    p_request_id: requiredText(formData.get("requestId"), "requestId", 80),
    p_status: requiredText(formData.get("status"), "status", 20),
    p_actor_id: context.userId,
  });
  revalidatePath("/purchasing");
  done("requests", "recordUpdated", data.number || "Purchase request");
}

export async function createSupplierQuoteAction(formData: FormData) {
  const context = await requirePurchasing();
  const data = await rpc("create_supplier_quote", {
    p_organization_id: context.organizationId,
    p_purchase_request_id: requiredText(formData.get("purchaseRequestId"), "purchaseRequestId", 80),
    p_supplier_id: requiredText(formData.get("supplierId"), "supplierId", 80),
    p_supplier_reference: optionalText(formData.get("supplierReference"), 120),
    p_quote_date: requiredText(formData.get("quoteDate"), "quoteDate", 10),
    p_valid_until: optionalText(formData.get("validUntil"), 10),
    p_notes: optionalText(formData.get("notes"), 1000),
    p_lines: lines(formData),
    p_actor_id: context.userId,
  });
  revalidatePath("/purchasing");
  done("quotes", "moneyRecorded", data.number || "Supplier quote", Number(data.total || 0));
}

export async function convertSupplierQuoteAction(formData: FormData) {
  const context = await requirePurchasing();
  const data = await rpc("convert_supplier_quote_to_order", {
    p_organization_id: context.organizationId,
    p_supplier_quote_id: requiredText(formData.get("supplierQuoteId"), "supplierQuoteId", 80),
    p_order_date: requiredText(formData.get("orderDate"), "orderDate", 10),
    p_expected_date: optionalText(formData.get("expectedDate"), 10),
    p_actor_id: context.userId,
  });
  revalidatePath("/purchasing");
  done("orders", "moneyRecorded", data.number || "Purchase order", Number(data.total || 0));
}

export async function recordGoodsReceiptAction(formData: FormData) {
  const context = await requirePurchasing();
  const data = await rpc("record_goods_receipt", {
    p_organization_id: context.organizationId,
    p_purchase_order_id: requiredText(formData.get("purchaseOrderId"), "purchaseOrderId", 80),
    p_receipt_date: requiredText(formData.get("receiptDate"), "receiptDate", 10),
    p_supplier_delivery_reference: optionalText(formData.get("supplierDeliveryReference"), 120),
    p_notes: optionalText(formData.get("notes"), 1000),
    p_lines: lines(formData),
    p_actor_id: context.userId,
  });
  revalidatePath("/purchasing"); revalidatePath("/inventory");
  done("receipts", "recordCreated", data.number || "Goods receipt");
}

export async function postSupplierBillAction(formData: FormData) {
  const context = await requirePurchasing();
  const data = await rpc("post_supplier_bill", {
    p_organization_id: context.organizationId,
    p_purchase_order_id: requiredText(formData.get("purchaseOrderId"), "purchaseOrderId", 80),
    p_goods_receipt_id: optionalText(formData.get("goodsReceiptId"), 80),
    p_supplier_invoice_number: optionalText(formData.get("supplierInvoiceNumber"), 120),
    p_bill_date: requiredText(formData.get("billDate"), "billDate", 10),
    p_due_date: requiredText(formData.get("dueDate"), "dueDate", 10),
    p_notes: optionalText(formData.get("notes"), 1000),
    p_lines: lines(formData),
    p_actor_id: context.userId,
  });
  revalidatePath("/purchasing"); revalidatePath("/finance");
  done("bills", "moneyRecorded", data.number || "Supplier bill", Number(data.total || 0));
}

export async function recordSupplierPaymentAction(formData: FormData) {
  const context = await requirePurchasing();
  const amount = positiveNumber(formData.get("amount"), "amount");
  const data = await rpc("record_supplier_payment", {
    p_organization_id: context.organizationId,
    p_supplier_bill_id: requiredText(formData.get("supplierBillId"), "supplierBillId", 80),
    p_amount: amount,
    p_method: requiredText(formData.get("method") || "cash", "method", 60),
    p_payment_date: requiredText(formData.get("paymentDate"), "paymentDate", 10),
    p_reference: optionalText(formData.get("reference"), 120),
    p_notes: optionalText(formData.get("notes"), 1000),
    p_actor_id: context.userId,
  });
  revalidatePath("/purchasing"); revalidatePath("/finance");
  done("bills", "moneyRecorded", data.number || "Supplier payment", Number(data.amount || amount));
}

export async function postPurchaseReturnAction(formData: FormData) {
  const context = await requirePurchasing();
  const data = await rpc("post_purchase_return", {
    p_organization_id: context.organizationId,
    p_purchase_order_id: requiredText(formData.get("purchaseOrderId"), "purchaseOrderId", 80),
    p_supplier_bill_id: requiredText(formData.get("supplierBillId"), "supplierBillId", 80),
    p_return_date: requiredText(formData.get("returnDate"), "returnDate", 10),
    p_reason: requiredText(formData.get("reason"), "reason", 500),
    p_lines: lines(formData),
    p_actor_id: context.userId,
  });
  revalidatePath("/purchasing"); revalidatePath("/inventory"); revalidatePath("/finance");
  done("returns", "moneyRecorded", data.number || "Purchase return", Number(data.total || 0));
}