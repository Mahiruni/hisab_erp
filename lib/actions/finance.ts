"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "../config";
import { can, getCurrentUserContext } from "../data/context";
import { createClient } from "../supabase/server";
import { optionalText, positiveNumber, requiredText } from "../validation";

function requireLiveMode() {
  if (!isSupabaseConfigured()) throw new Error("Finance write actions are disabled in demo mode. Configure Supabase first.");
}

async function requireFinanceContext() {
  requireLiveMode();
  const context = await getCurrentUserContext({ required: true });
  if (!context || !can(context, "manage_finance")) throw new Error("You do not have permission to manage finance and accounting.");
  return context;
}

function redirectWithSuccess(tab: string, value: string) {
  redirect(`/finance?tab=${encodeURIComponent(tab)}&success=${encodeURIComponent(value)}`);
}

export async function createFinanceAccount(formData: FormData) {
  const context = await requireFinanceContext();
  const accountType = requiredText(formData.get("accountType"), "accountType", 20);
  const normalSide = requiredText(formData.get("normalSide"), "normalSide", 10);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_finance_account", {
    p_organization_id: context.organizationId,
    p_code: requiredText(formData.get("code"), "code", 24),
    p_name: requiredText(formData.get("name"), "name", 160),
    p_account_type: accountType,
    p_normal_side: normalSide,
    p_account_subtype: optionalText(formData.get("accountSubtype"), 40),
    p_currency: requiredText(formData.get("currency") || "ETB", "currency", 3),
    p_bank_name: optionalText(formData.get("bankName"), 120),
    p_account_number_masked: optionalText(formData.get("accountNumberMasked"), 40),
    p_actor_id: context.userId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/finance");
  redirectWithSuccess("accounts", `Account ${String(data)} created`);
}

export async function postManualJournal(formData: FormData) {
  const context = await requireFinanceContext();
  const amount = positiveNumber(formData.get("amount"), "amount");
  const memo = requiredText(formData.get("memo"), "memo", 300);
  const debitAccountId = requiredText(formData.get("debitAccountId"), "debitAccountId", 80);
  const creditAccountId = requiredText(formData.get("creditAccountId"), "creditAccountId", 80);
  if (debitAccountId === creditAccountId) throw new Error("Debit and credit accounts must be different.");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("post_manual_journal", {
    p_organization_id: context.organizationId,
    p_branch_id: context.branchId,
    p_entry_date: requiredText(formData.get("entryDate"), "entryDate", 10),
    p_memo: memo,
    p_lines: [
      { accountId: debitAccountId, description: memo, debit: amount, credit: 0 },
      { accountId: creditAccountId, description: memo, debit: 0, credit: amount },
    ],
    p_actor_id: context.userId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/finance");
  revalidatePath("/finance/journals");
  revalidatePath("/");
  redirectWithSuccess("journal", `Journal ${String(data)} posted`);
}

export async function recordFinancePayment(formData: FormData) {
  const context = await requireFinanceContext();
  const taxAmount = positiveNumber(formData.get("taxAmount") || "0", "taxAmount", true);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("record_finance_payment", {
    p_organization_id: context.organizationId,
    p_branch_id: context.branchId,
    p_payment_type: requiredText(formData.get("paymentType"), "paymentType", 12),
    p_amount: positiveNumber(formData.get("amount"), "amount"),
    p_tax_amount: taxAmount,
    p_method: requiredText(formData.get("method"), "method", 60),
    p_payment_date: requiredText(formData.get("paymentDate"), "paymentDate", 10),
    p_cash_account_id: requiredText(formData.get("cashAccountId"), "cashAccountId", 80),
    p_counter_account_id: requiredText(formData.get("counterAccountId"), "counterAccountId", 80),
    p_tax_account_id: taxAmount > 0 ? requiredText(formData.get("taxAccountId"), "taxAccountId", 80) : null,
    p_customer_id: optionalText(formData.get("customerId"), 80),
    p_invoice_id: optionalText(formData.get("invoiceId"), 80),
    p_counterparty_name: optionalText(formData.get("counterpartyName"), 160),
    p_reference: optionalText(formData.get("reference"), 100),
    p_notes: optionalText(formData.get("notes"), 500),
    p_actor_id: context.userId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/finance");
  revalidatePath("/");
  redirectWithSuccess("payments", `${String(data)} posted`);
}

export async function registerFixedAsset(formData: FormData) {
  const context = await requireFinanceContext();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("register_fixed_asset", {
    p_organization_id: context.organizationId,
    p_branch_id: context.branchId,
    p_name: requiredText(formData.get("name"), "name", 160),
    p_category: requiredText(formData.get("category"), "category", 80),
    p_acquisition_date: requiredText(formData.get("acquisitionDate"), "acquisitionDate", 10),
    p_in_service_date: requiredText(formData.get("inServiceDate"), "inServiceDate", 10),
    p_cost: positiveNumber(formData.get("cost"), "cost"),
    p_salvage_value: positiveNumber(formData.get("salvageValue") || "0", "salvageValue", true),
    p_useful_life_months: Math.round(positiveNumber(formData.get("usefulLifeMonths"), "usefulLifeMonths")),
    p_asset_account_id: requiredText(formData.get("assetAccountId"), "assetAccountId", 80),
    p_accumulated_depreciation_account_id: requiredText(formData.get("accumulatedDepreciationAccountId"), "accumulatedDepreciationAccountId", 80),
    p_depreciation_expense_account_id: requiredText(formData.get("depreciationExpenseAccountId"), "depreciationExpenseAccountId", 80),
    p_funding_account_id: requiredText(formData.get("fundingAccountId"), "fundingAccountId", 80),
    p_actor_id: context.userId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/finance");
  revalidatePath("/");
  redirectWithSuccess("assets", `Asset ${String(data)} registered`);
}

export async function postAssetDepreciation(formData: FormData) {
  const context = await requireFinanceContext();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("post_asset_depreciation", {
    p_organization_id: context.organizationId,
    p_asset_id: requiredText(formData.get("assetId"), "assetId", 80),
    p_depreciation_date: requiredText(formData.get("depreciationDate"), "depreciationDate", 10),
    p_actor_id: context.userId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/finance");
  revalidatePath("/");
  redirectWithSuccess("assets", `Depreciation ${String(data)} posted`);
}

export async function setAccountingPeriodStatus(formData: FormData) {
  const context = await requireFinanceContext();
  const status = requiredText(formData.get("status"), "status", 20);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("set_accounting_period_status", {
    p_organization_id: context.organizationId,
    p_period_id: requiredText(formData.get("periodId"), "periodId", 80),
    p_status: status,
    p_actor_id: context.userId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/finance");
  redirectWithSuccess("closing", `${String(data)} is now ${status.replace("_", " ")}`);
}