"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "../config";
import { can, getCurrentUserContext } from "../data/context";
import { createClient } from "../supabase/server";
import { optionalText, requiredText } from "../validation";

function requireLiveMode() {
  if (!isSupabaseConfigured()) throw new Error("This action is disabled in demo mode. Configure Supabase first.");
}

async function requireContext(permission: "configure" | "queue" | "clearance") {
  requireLiveMode();
  const context = await getCurrentUserContext({ required: true });
  const allowed = permission === "configure"
    ? Boolean(context && can(context, "manage_users"))
    : permission === "queue"
      ? Boolean(context && can(context, "manage_sales"))
      : Boolean(context && can(context, "manage_finance"));
  if (!context || !allowed) throw new Error("You do not have permission to manage electronic invoicing.");
  return context;
}

function optionalJson(value: FormDataEntryValue | null, maxLength = 50_000) {
  const text = optionalText(value, maxLength);
  if (!text) return {};
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") throw new Error("invalid");
    return parsed;
  } catch {
    throw new Error("Response evidence must be a valid JSON object.");
  }
}

function successRedirect(message: string): never {
  revalidatePath("/e-invoicing");
  revalidatePath("/sales");
  redirect(`/e-invoicing?success=${encodeURIComponent(message)}`);
}

export async function saveEInvoiceProfile(formData: FormData) {
  const context = await requireContext("configure");
  const supabase = await createClient();
  const status = requiredText(formData.get("status"), "status", 20);
  const { error } = await supabase.rpc("upsert_e_invoice_profile", {
    p_organization_id: context.organizationId,
    p_provider: requiredText(formData.get("provider"), "provider", 40),
    p_environment: requiredText(formData.get("environment"), "environment", 20),
    p_submission_mode: requiredText(formData.get("submissionMode"), "submissionMode", 30),
    p_status: status,
    p_legal_name: requiredText(formData.get("legalName"), "legalName", 200),
    p_taxpayer_tin: requiredText(formData.get("taxpayerTin"), "taxpayerTin", 80),
    p_vat_number: optionalText(formData.get("vatNumber"), 80),
    p_commercial_registration_number: optionalText(formData.get("commercialRegistrationNumber"), 120),
    p_provider_account_reference: optionalText(formData.get("providerAccountReference"), 160),
    p_certificate_alias: optionalText(formData.get("certificateAlias"), 160),
    p_notes: optionalText(formData.get("notes"), 1000),
    p_actor_id: context.userId,
  });
  if (error) throw new Error(error.message);
  successRedirect(status === "ready" ? "Electronic-invoice profile approved and ready" : "Electronic-invoice profile saved");
}

export async function queueEInvoiceDocument(formData: FormData) {
  const context = await requireContext("queue");
  const supabase = await createClient();
  const offline = formData.get("offline") === "true";
  const { data, error } = await supabase.rpc("queue_e_invoice_document", {
    p_organization_id: context.organizationId,
    p_document_id: requiredText(formData.get("documentId"), "documentId", 80),
    p_offline: offline,
    p_actor_id: context.userId,
  });
  if (error) throw new Error(error.message);
  const payloadHash = String((data as { payloadHash?: string } | null)?.payloadHash || "");
  successRedirect(`${offline ? "Offline queue" : "Clearance queue"} prepared${payloadHash ? ` · ${payloadHash.slice(0, 12)}` : ""}`);
}

export async function recordEInvoiceClearance(formData: FormData) {
  const context = await requireContext("clearance");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("record_e_invoice_clearance", {
    p_organization_id: context.organizationId,
    p_document_id: requiredText(formData.get("documentId"), "documentId", 80),
    p_official_invoice_id: requiredText(formData.get("officialInvoiceId"), "officialInvoiceId", 200),
    p_official_receipt_id: optionalText(formData.get("officialReceiptId"), 200),
    p_qr_payload: requiredText(formData.get("qrPayload"), "qrPayload", 10_000),
    p_verification_url: optionalText(formData.get("verificationUrl"), 2_000),
    p_digital_signature: optionalText(formData.get("digitalSignature"), 20_000),
    p_certificate_serial: optionalText(formData.get("certificateSerial"), 500),
    p_provider_request_id: optionalText(formData.get("providerRequestId"), 500),
    p_provider_response_id: optionalText(formData.get("providerResponseId"), 500),
    p_response_snapshot: optionalJson(formData.get("responseSnapshot")),
    p_actor_id: context.userId,
  });
  if (error) throw new Error(error.message);
  const officialId = String((data as { officialInvoiceId?: string } | null)?.officialInvoiceId || "Invoice");
  successRedirect(`${officialId} recorded as government-cleared`);
}

export async function recordEInvoiceRejection(formData: FormData) {
  const context = await requireContext("clearance");
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_e_invoice_rejection", {
    p_organization_id: context.organizationId,
    p_document_id: requiredText(formData.get("documentId"), "documentId", 80),
    p_error_code: optionalText(formData.get("errorCode"), 200),
    p_error_message: requiredText(formData.get("errorMessage"), "errorMessage", 2000),
    p_provider_response_id: optionalText(formData.get("providerResponseId"), 500),
    p_response_snapshot: optionalJson(formData.get("responseSnapshot")),
    p_actor_id: context.userId,
  });
  if (error) throw new Error(error.message);
  successRedirect("Government or provider rejection recorded");
}

export async function requestEInvoiceCancellation(formData: FormData) {
  const context = await requireContext("clearance");
  const supabase = await createClient();
  const { error } = await supabase.rpc("request_e_invoice_cancellation", {
    p_organization_id: context.organizationId,
    p_document_id: requiredText(formData.get("documentId"), "documentId", 80),
    p_reason: requiredText(formData.get("reason"), "reason", 1000),
    p_actor_id: context.userId,
  });
  if (error) throw new Error(error.message);
  successRedirect("Cancellation request prepared and recorded");
}

export async function recordEInvoiceCancellation(formData: FormData) {
  const context = await requireContext("clearance");
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_e_invoice_cancellation", {
    p_organization_id: context.organizationId,
    p_document_id: requiredText(formData.get("documentId"), "documentId", 80),
    p_cancellation_reference: requiredText(formData.get("cancellationReference"), "cancellationReference", 500),
    p_response_snapshot: optionalJson(formData.get("responseSnapshot")),
    p_actor_id: context.userId,
  });
  if (error) throw new Error(error.message);
  successRedirect("Official cancellation recorded");
}
