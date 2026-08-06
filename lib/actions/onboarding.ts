"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUserContext } from "../data/context";
import { rowsFromCsvUpload } from "../onboarding/csv";
import { createClient } from "../supabase/server";
import { optionalText, positiveNumber, requiredText } from "../validation";

function errorMessage(reason: unknown) {
  return reason instanceof Error ? reason.message : "The setup action could not be completed.";
}

function finish(message: string) {
  revalidatePath("/onboarding");
  redirect(`/onboarding?success=${encodeURIComponent(message)}`);
}

function fail(reason: unknown) {
  redirect(`/onboarding?error=${encodeURIComponent(errorMessage(reason))}`);
}

async function requireStrongSetupAdmin() {
  const context = await getCurrentUserContext({ required: true });
  if (!context || !context.mfaRequired || context.aal !== "aal2") throw new Error("Verify administrator MFA before changing company setup.");
  return context;
}

export async function bootstrapGuidedOrganization(formData: FormData) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("bootstrap_organization_v2", {
      p_name: requiredText(formData.get("organizationName"), "organization name", 160),
      p_full_name: requiredText(formData.get("fullName"), "full name", 120),
      p_business_type: requiredText(formData.get("businessType"), "business type", 120),
      p_country_code: requiredText(formData.get("countryCode") || "ET", "country", 2),
      p_currency: requiredText(formData.get("currency") || "ETB", "currency", 3),
      p_timezone: requiredText(formData.get("timezone") || "Africa/Addis_Ababa", "timezone", 80),
      p_branch_name: requiredText(formData.get("branchName") || "Main Branch", "branch name", 160),
      p_tin: optionalText(formData.get("tin"), 30),
      p_phone: optionalText(formData.get("phone"), 40),
    });
    if (error) throw new Error(error.message);
  } catch (reason) { fail(reason); }
  finish("Company workspace created. Secure the owner account with MFA to continue setup.");
}

export async function updateCompanyProfileAction(formData: FormData) {
  try {
    const context = await requireStrongSetupAdmin();
    const supabase = await createClient();
    const { error } = await supabase.rpc("update_onboarding_company_profile", {
      p_organization_id: context.organizationId,
      p_name: requiredText(formData.get("organizationName"), "organization name", 160),
      p_business_type: requiredText(formData.get("businessType"), "business type", 120),
      p_country_code: requiredText(formData.get("countryCode"), "country", 2),
      p_currency: requiredText(formData.get("currency"), "currency", 3),
      p_timezone: requiredText(formData.get("timezone"), "timezone", 80),
      p_tin: optionalText(formData.get("tin"), 30),
      p_vat_number: optionalText(formData.get("vatNumber"), 30),
      p_phone: optionalText(formData.get("phone"), 40),
    });
    if (error) throw new Error(error.message);
  } catch (reason) { fail(reason); }
  finish("Company profile updated");
}

export async function createOnboardingBranchAction(formData: FormData) {
  try {
    const context = await requireStrongSetupAdmin();
    const supabase = await createClient();
    const { error } = await supabase.rpc("create_onboarding_branch", {
      p_organization_id: context.organizationId,
      p_name: requiredText(formData.get("name"), "branch name", 160),
      p_code: requiredText(formData.get("code"), "branch code", 24),
      p_address: optionalText(formData.get("address"), 240),
      p_create_warehouse: formData.get("createWarehouse") === "on",
    });
    if (error) throw new Error(error.message);
  } catch (reason) { fail(reason); }
  finish("Branch created");
}

export async function importCustomersAction(formData: FormData) {
  let imported = 0;
  try {
    const context = await requireStrongSetupAdmin();
    const rows = await rowsFromCsvUpload(formData.get("file"), ["name"]);
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("import_onboarding_customers", { p_organization_id: context.organizationId, p_rows: rows });
    if (error) throw new Error(error.message);
    imported = Number(data || 0);
  } catch (reason) { fail(reason); }
  finish(`${imported} customer record${imported === 1 ? "" : "s"} imported`);
}

export async function importSuppliersAction(formData: FormData) {
  let imported = 0;
  try {
    const context = await requireStrongSetupAdmin();
    const rows = await rowsFromCsvUpload(formData.get("file"), ["name"]);
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("import_onboarding_suppliers", { p_organization_id: context.organizationId, p_rows: rows });
    if (error) throw new Error(error.message);
    imported = Number(data || 0);
  } catch (reason) { fail(reason); }
  finish(`${imported} supplier record${imported === 1 ? "" : "s"} imported`);
}

export async function importProductsAction(formData: FormData) {
  let imported = 0;
  let stockPosted = 0;
  try {
    const context = await requireStrongSetupAdmin();
    const warehouseId = requiredText(formData.get("warehouseId"), "warehouse", 80);
    const rows = await rowsFromCsvUpload(formData.get("file"), ["sku", "name"]);
    const supabase = await createClient();
    const products = await supabase.rpc("import_onboarding_products", { p_organization_id: context.organizationId, p_rows: rows });
    if (products.error) throw new Error(products.error.message);
    imported = Number(products.data || 0);
    const opening = await supabase.rpc("import_onboarding_opening_stock", { p_organization_id: context.organizationId, p_warehouse_id: warehouseId, p_rows: rows });
    if (opening.error) throw new Error(opening.error.message);
    stockPosted = Number(opening.data || 0);
  } catch (reason) { fail(reason); }
  finish(`${imported} products imported and ${stockPosted} opening-stock balances posted`);
}

export async function postOpeningBalanceAction(formData: FormData) {
  let document = "";
  try {
    const context = await requireStrongSetupAdmin();
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("post_onboarding_opening_balance", {
      p_organization_id: context.organizationId,
      p_branch_id: requiredText(formData.get("branchId"), "branch", 80),
      p_entry_date: requiredText(formData.get("entryDate"), "entry date", 10),
      p_debit_account_id: requiredText(formData.get("debitAccountId"), "debit account", 80),
      p_credit_account_id: requiredText(formData.get("creditAccountId"), "credit account", 80),
      p_amount: positiveNumber(formData.get("amount"), "amount"),
      p_notes: optionalText(formData.get("notes"), 300),
    });
    if (error) throw new Error(error.message);
    document = String(data);
  } catch (reason) { fail(reason); }
  finish(`Opening balance ${document} posted`);
}
