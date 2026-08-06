"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUserContext } from "../data/context";
import { validateMpesaDarajaConnection } from "../reconciliation/daraja";
import { createClient } from "../supabase/server";
import { requiredText } from "../validation";

async function requireStrongOwner() {
  const context = await getCurrentUserContext({ required: true });
  if (!context || !["owner", "admin"].includes(context.role) || context.aal !== "aal2") {
    throw new Error("Owner or administrator access with MFA verification is required.");
  }
  return context;
}

function reconciliationRedirect(message?: string): never {
  revalidatePath("/reconciliation");
  redirect(message ? `/reconciliation?success=${encodeURIComponent(message)}#mpesa-daraja` : "/reconciliation#mpesa-daraja");
}

export async function saveMpesaDarajaCredentials(formData: FormData) {
  const context = await requireStrongOwner();
  const environment = requiredText(formData.get("environment"), "environment", 20);
  if (environment !== "sandbox" && environment !== "production") throw new Error("Choose sandbox or production.");
  const consumerKey = requiredText(formData.get("consumerKey"), "consumerKey", 300);
  const consumerSecret = requiredText(formData.get("consumerSecret"), "consumerSecret", 300);
  if (consumerKey.length < 20 || consumerSecret.length < 20) throw new Error("Enter the complete Daraja Consumer Key and Consumer Secret.");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_mpesa_daraja_credentials", {
    p_organization_id: context.organizationId,
    p_consumer_key: consumerKey,
    p_consumer_secret: consumerSecret,
    p_environment: environment,
    p_actor_id: context.userId,
  });
  if (error) throw new Error(error.message);
  const suffix = String((data as { keySuffix?: string } | null)?.keySuffix || "");
  reconciliationRedirect(`M-Pesa Daraja credentials encrypted${suffix ? ` · key ending ${suffix}` : ""}`);
}

export async function validateMpesaDarajaCredentials() {
  const context = await requireStrongOwner();
  const result = await validateMpesaDarajaConnection(context.organizationId);
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_mpesa_daraja_connection_check", {
    p_organization_id: context.organizationId,
    p_environment: result.environment,
    p_success: result.success,
    p_http_status: result.httpStatus,
    p_response_code: result.responseCode,
    p_message: result.message,
    p_actor_id: context.userId,
  });
  if (error) throw new Error(error.message);
  reconciliationRedirect(result.success ? `Daraja OAuth verified · token lifetime ${result.expiresIn ?? "provider default"} seconds` : undefined);
}
