"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "../config";
import { can, getCurrentUserContext } from "../data/context";
import { parseStatementFile } from "../reconciliation/statement-parser";
import { createClient } from "../supabase/server";
import { optionalText, positiveNumber, requiredText } from "../validation";

function requireLiveMode() {
  if (!isSupabaseConfigured()) throw new Error("This action is disabled in demo mode. Configure Supabase first.");
}

async function requirePermission(kind: "configure" | "import" | "post") {
  requireLiveMode();
  const context = await getCurrentUserContext({ required: true });
  const allowed = kind === "import"
    ? Boolean(context && (can(context, "manage_finance") || can(context, "manage_sales")))
    : Boolean(context && can(context, "manage_finance"));
  if (!context || !allowed) throw new Error("You do not have permission to manage reconciliation.");
  return context;
}

function optionalUuid(value: FormDataEntryValue | null) {
  const text = optionalText(value, 80);
  return text || null;
}

function optionalNumber(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return null;
  const number = Number(text);
  if (!Number.isFinite(number)) throw new Error("Enter a valid number.");
  return number;
}

function successRedirect(message: string): never {
  revalidatePath("/reconciliation");
  revalidatePath("/finance");
  revalidatePath("/sales");
  revalidatePath("/purchasing");
  redirect(`/reconciliation?success=${encodeURIComponent(message)}`);
}

export async function saveReconciliationSource(formData: FormData) {
  const context = await requirePermission("configure");
  const supabase = await createClient();
  const sourceType = requiredText(formData.get("sourceType"), "sourceType", 20);
  const provider = sourceType === "telebirr" ? "telebirr" : sourceType === "mpesa" ? "safaricom_daraja" : requiredText(formData.get("provider"), "provider", 40);
  const { data, error } = await supabase.rpc("upsert_reconciliation_source", {
    p_organization_id: context.organizationId,
    p_source_id: optionalUuid(formData.get("sourceId")),
    p_branch_id: optionalUuid(formData.get("branchId")),
    p_source_type: sourceType,
    p_provider: provider,
    p_name: requiredText(formData.get("name"), "name", 160),
    p_bank_account_id: optionalUuid(formData.get("bankAccountId")),
    p_ledger_account_id: requiredText(formData.get("ledgerAccountId"), "ledgerAccountId", 80),
    p_fee_account_id: optionalUuid(formData.get("feeAccountId")),
    p_withholding_account_id: optionalUuid(formData.get("withholdingAccountId")),
    p_suspense_account_id: requiredText(formData.get("suspenseAccountId"), "suspenseAccountId", 80),
    p_currency: requiredText(formData.get("currency"), "currency", 3).toUpperCase(),
    p_environment: requiredText(formData.get("environment"), "environment", 20),
    p_status: requiredText(formData.get("status"), "status", 20),
    p_external_account_reference: optionalText(formData.get("externalAccountReference"), 200),
    p_merchant_reference: optionalText(formData.get("merchantReference"), 200),
    p_auto_match: formData.get("autoMatch") === "on",
    p_amount_tolerance: positiveNumber(formData.get("amountTolerance"), "amountTolerance", true),
    p_date_tolerance_days: Math.trunc(positiveNumber(formData.get("dateToleranceDays"), "dateToleranceDays", true)),
    p_notes: optionalText(formData.get("notes"), 1000),
    p_actor_id: context.userId,
  });
  if (error) throw new Error(error.message);
  const id = String((data as { id?: string } | null)?.id || "");
  successRedirect(`${sourceType === "bank" ? "Bank" : sourceType === "telebirr" ? "Telebirr" : "M-Pesa"} reconciliation source saved${id ? ` · ${id.slice(0, 8)}` : ""}`);
}

export async function importReconciliationStatement(formData: FormData) {
  const context = await requirePermission("import");
  const sourceId = requiredText(formData.get("sourceId"), "sourceId", 80);
  const file = formData.get("statementFile");
  if (!(file instanceof File)) throw new Error("Choose a statement file.");
  const supabase = await createClient();
  const { data: source, error: sourceError } = await supabase.from("reconciliation_sources").select("currency,status").eq("organization_id", context.organizationId).eq("id", sourceId).maybeSingle();
  if (sourceError || !source) throw new Error(sourceError?.message || "Reconciliation source not found.");
  if (source.status !== "ready") throw new Error("Activate the reconciliation source before importing statements.");
  const parsed = await parseStatementFile(file, String(source.currency || "ETB").trim());
  const { data, error } = await supabase.rpc("import_reconciliation_batch", {
    p_organization_id: context.organizationId,
    p_source_id: sourceId,
    p_filename: parsed.filename,
    p_file_hash: parsed.fileHash,
    p_period_start: optionalText(formData.get("periodStart"), 10),
    p_period_end: optionalText(formData.get("periodEnd"), 10),
    p_opening_balance: optionalNumber(formData.get("openingBalance")),
    p_closing_balance: optionalNumber(formData.get("closingBalance")),
    p_rows: parsed.rows,
    p_actor_id: context.userId,
  });
  if (error) throw new Error(error.message);
  const result = data as { imported?: number; duplicates?: number } | null;
  successRedirect(`Statement imported · ${result?.imported ?? parsed.rows.length} new · ${result?.duplicates ?? 0} duplicates`);
}

export async function runReconciliationMatching(formData: FormData) {
  const context = await requirePermission("import");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("run_reconciliation_matching", {
    p_organization_id: context.organizationId,
    p_source_id: requiredText(formData.get("sourceId"), "sourceId", 80),
    p_actor_id: context.userId,
  });
  if (error) throw new Error(error.message);
  successRedirect(`Matching complete · ${Number((data as { suggested?: number } | null)?.suggested || 0)} suggestions`);
}

export async function confirmReconciliationMatch(formData: FormData) {
  const context = await requirePermission("post");
  const targetType = requiredText(formData.get("targetType"), "targetType", 30);
  const targetId = targetType === "suspense" ? null : optionalUuid(formData.get("targetId"));
  if (targetType !== "suspense" && !targetId) throw new Error("Select the invoice, supplier bill or ledger account to match.");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("confirm_reconciliation_match", {
    p_organization_id: context.organizationId,
    p_transaction_id: requiredText(formData.get("transactionId"), "transactionId", 80),
    p_target_type: targetType,
    p_target_id: targetId,
    p_cash_amount: positiveNumber(formData.get("cashAmount"), "cashAmount"),
    p_allocation_amount: positiveNumber(formData.get("allocationAmount"), "allocationAmount"),
    p_fee_amount: positiveNumber(formData.get("feeAmount"), "feeAmount", true),
    p_withholding_amount: positiveNumber(formData.get("withholdingAmount"), "withholdingAmount", true),
    p_match_reason: optionalText(formData.get("matchReason"), 1000),
    p_actor_id: context.userId,
  });
  if (error) throw new Error(error.message);
  const result = data as { journalNumber?: string; paymentNumber?: string } | null;
  successRedirect(`Match posted · ${result?.journalNumber || "journal created"}${result?.paymentNumber ? ` · ${result.paymentNumber}` : ""}`);
}

export async function reverseReconciliationMatch(formData: FormData) {
  const context = await requirePermission("post");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reverse_reconciliation_match", {
    p_organization_id: context.organizationId,
    p_match_id: requiredText(formData.get("matchId"), "matchId", 80),
    p_reason: requiredText(formData.get("reason"), "reason", 1000),
    p_actor_id: context.userId,
  });
  if (error) throw new Error(error.message);
  successRedirect(`Match reversed · ${String((data as { journalNumber?: string } | null)?.journalNumber || "reversal posted")}`);
}

export async function setReconciliationTransactionState(formData: FormData) {
  const context = await requirePermission("post");
  const status = requiredText(formData.get("status"), "status", 20);
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_reconciliation_transaction_state", {
    p_organization_id: context.organizationId,
    p_transaction_id: requiredText(formData.get("transactionId"), "transactionId", 80),
    p_status: status,
    p_reason: optionalText(formData.get("reason"), 1000),
    p_actor_id: context.userId,
  });
  if (error) throw new Error(error.message);
  successRedirect(`Transaction marked ${status.replaceAll("_", " ")}`);
}
