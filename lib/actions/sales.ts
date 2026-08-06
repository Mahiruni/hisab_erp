"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "../config";
import { can, getCurrentUserContext } from "../data/context";
import { createClient } from "../supabase/server";
import { optionalText, positiveNumber, requiredText } from "../validation";

function requireLiveMode() {
  if (!isSupabaseConfigured()) throw new Error("This action is disabled in demo mode. Configure Supabase first.");
}

async function requireSalesContext() {
  requireLiveMode();
  const context = await getCurrentUserContext({ required: true });
  if (!context || !can(context, "manage_sales")) throw new Error("You do not have permission to manage sales.");
  return context;
}

function salesLines(formData: FormData) {
  const raw = requiredText(formData.get("lines"), "lines", 100_000);
  try {
    const value = JSON.parse(raw) as unknown;
    if (!Array.isArray(value) || value.length < 1 || value.length > 100) throw new Error("invalid");
    return value;
  } catch {
    throw new Error("Add at least one valid sales line.");
  }
}

function successRedirect(tab: string, message: string): never {
  revalidatePath("/");
  revalidatePath("/finance");
  revalidatePath("/inventory");
  revalidatePath("/sales");
  redirect(`/sales?tab=${encodeURIComponent(tab)}&success=${encodeURIComponent(message)}`);
}

export async function createSalesQuotation(formData: FormData) {
  const context = await requireSalesContext();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_sales_quotation", {
    p_organization_id: context.organizationId,
    p_branch_id: context.branchId,
    p_customer_id: requiredText(formData.get("customerId"), "customerId", 80),
    p_quotation_date: requiredText(formData.get("documentDate"), "documentDate", 20),
    p_valid_until: requiredText(formData.get("validUntil"), "validUntil", 20),
    p_notes: optionalText(formData.get("notes"), 1000),
    p_lines: salesLines(formData),
    p_actor_id: context.userId,
  });
  if (error) throw new Error(error.message);
  const number = String((data as { number?: string } | null)?.number || "Quotation");
  successRedirect("quotations", `${number} created`);
}

export async function setSalesQuotationStatus(formData: FormData) {
  const context = await requireSalesContext();
  const supabase = await createClient();
  const status = requiredText(formData.get("status"), "status", 20);
  const { data, error } = await supabase.rpc("set_sales_quotation_status", {
    p_organization_id: context.organizationId,
    p_quotation_id: requiredText(formData.get("quotationId"), "quotationId", 80),
    p_status: status,
    p_actor_id: context.userId,
  });
  if (error) throw new Error(error.message);
  successRedirect("quotations", `${String(data)} marked ${status.replaceAll("_", " ")}`);
}

export async function createSalesOrder(formData: FormData) {
  const context = await requireSalesContext();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_sales_order", {
    p_organization_id: context.organizationId,
    p_branch_id: context.branchId,
    p_customer_id: requiredText(formData.get("customerId"), "customerId", 80),
    p_order_date: requiredText(formData.get("documentDate"), "documentDate", 20),
    p_expected_date: optionalText(formData.get("expectedDate"), 20),
    p_customer_reference: optionalText(formData.get("customerReference"), 120),
    p_notes: optionalText(formData.get("notes"), 1000),
    p_lines: salesLines(formData),
    p_actor_id: context.userId,
  });
  if (error) throw new Error(error.message);
  const number = String((data as { number?: string } | null)?.number || "Sales order");
  successRedirect("orders", `${number} confirmed`);
}

export async function convertSalesQuotationToOrder(formData: FormData) {
  const context = await requireSalesContext();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("convert_sales_quotation_to_order", {
    p_organization_id: context.organizationId,
    p_quotation_id: requiredText(formData.get("quotationId"), "quotationId", 80),
    p_order_date: requiredText(formData.get("orderDate"), "orderDate", 20),
    p_expected_date: optionalText(formData.get("expectedDate"), 20),
    p_actor_id: context.userId,
  });
  if (error) throw new Error(error.message);
  const number = String((data as { number?: string } | null)?.number || "Sales order");
  successRedirect("orders", `${number} created from quotation`);
}

export async function postSalesInvoice(formData: FormData) {
  const context = await requireSalesContext();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("post_sales_invoice_v2", {
    p_organization_id: context.organizationId,
    p_branch_id: context.branchId,
    p_customer_id: requiredText(formData.get("customerId"), "customerId", 80),
    p_invoice_date: requiredText(formData.get("documentDate"), "documentDate", 20),
    p_due_date: optionalText(formData.get("dueDate"), 20),
    p_customer_reference: optionalText(formData.get("customerReference"), 120),
    p_notes: optionalText(formData.get("notes"), 1000),
    p_lines: salesLines(formData),
    p_sales_order_id: null,
    p_quotation_id: null,
    p_actor_id: context.userId,
  });
  if (error) throw new Error(error.message);
  const number = String((data as { number?: string } | null)?.number || "Invoice");
  successRedirect("invoices", `${number} posted`);
}

export async function convertSalesOrderToInvoice(formData: FormData) {
  const context = await requireSalesContext();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("convert_sales_order_to_invoice", {
    p_organization_id: context.organizationId,
    p_sales_order_id: requiredText(formData.get("salesOrderId"), "salesOrderId", 80),
    p_invoice_date: requiredText(formData.get("invoiceDate"), "invoiceDate", 20),
    p_due_date: optionalText(formData.get("dueDate"), 20),
    p_actor_id: context.userId,
  });
  if (error) throw new Error(error.message);
  const number = String((data as { number?: string } | null)?.number || "Invoice");
  successRedirect("invoices", `${number} posted from sales order`);
}

export async function recordSalesReceipt(formData: FormData) {
  const context = await requireSalesContext();
  const supabase = await createClient();
  const invoiceId = optionalText(formData.get("invoiceId"), 80);
  const { data, error } = await supabase.rpc("record_sales_receipt", {
    p_organization_id: context.organizationId,
    p_branch_id: context.branchId,
    p_customer_id: requiredText(formData.get("customerId"), "customerId", 80),
    p_invoice_id: invoiceId,
    p_amount: positiveNumber(formData.get("amount"), "amount"),
    p_method: requiredText(formData.get("method"), "method", 80),
    p_payment_date: requiredText(formData.get("paymentDate"), "paymentDate", 20),
    p_reference: optionalText(formData.get("reference"), 120),
    p_notes: optionalText(formData.get("notes"), 500),
    p_actor_id: context.userId,
  });
  if (error) throw new Error(error.message);
  successRedirect("receipts", `${String(data)} posted`);
}

export async function postSalesReturn(formData: FormData) {
  const context = await requireSalesContext();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("post_sales_return", {
    p_organization_id: context.organizationId,
    p_invoice_id: requiredText(formData.get("invoiceId"), "invoiceId", 80),
    p_invoice_item_id: requiredText(formData.get("invoiceItemId"), "invoiceItemId", 80),
    p_quantity: positiveNumber(formData.get("quantity"), "quantity"),
    p_return_date: requiredText(formData.get("returnDate"), "returnDate", 20),
    p_reason: requiredText(formData.get("reason"), "reason", 500),
    p_actor_id: context.userId,
  });
  if (error) throw new Error(error.message);
  const number = String((data as { number?: string } | null)?.number || "Return");
  successRedirect("returns", `${number} posted as customer credit`);
}
