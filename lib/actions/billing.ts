"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { getBillingPlan, getPlanAmountEtb, isBillingCycle } from "../billing/catalog";
import { initializeChapaPayment } from "../chapa/api";
import { appConfig } from "../config";
import { createAdminClient } from "../supabase/admin";
import { createClient } from "../supabase/server";

function checkoutError(message: string, planCode = "growth", billingCycle = "annual"): never {
  redirect(`/checkout?plan=${encodeURIComponent(planCode)}&billing=${encodeURIComponent(billingCycle)}&error=${encodeURIComponent(message)}`);
}

async function authenticatedBillingIdentity() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : "";
  const email = typeof data?.claims?.email === "string" ? data.claims.email : null;
  if (!userId) redirect(`/auth/login?next=${encodeURIComponent("/pricing")}`);
  return { userId, email };
}

export async function createChapaCheckout(formData: FormData) {
  const rawPlan = typeof formData.get("plan") === "string" ? String(formData.get("plan")) : "";
  const rawBilling = typeof formData.get("billing") === "string" ? String(formData.get("billing")) : "";
  const plan = getBillingPlan(rawPlan);
  const billingCycle = isBillingCycle(rawBilling) ? rawBilling : "annual";
  if (!plan) checkoutError("Choose a valid HisabERP plan.", rawPlan, billingCycle);

  const { userId, email } = await authenticatedBillingIdentity();
  const amountEtb = getPlanAmountEtb(plan, billingCycle);
  const txRef = `hisab-${Date.now()}-${randomUUID().replaceAll("-", "").slice(0, 12)}`;
  const admin = createAdminClient();

  const created = await admin.from("hisab_billing_payment_attempts").insert({
    tx_ref: txRef,
    user_id: userId,
    plan_code: plan.code,
    billing_cycle: billingCycle,
    amount_etb: amountEtb,
    currency: "ETB",
    status: "creating",
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });
  if (created.error) checkoutError("Secure Chapa checkout could not be reserved. Please try again.", plan.code, billingCycle);

  let checkoutUrl = "";
  try {
    const initialized = await initializeChapaPayment({
      txRef,
      amountEtb,
      email,
      userId,
      planCode: plan.code,
      planName: plan.name,
      billingCycle,
      callbackUrl: `${appConfig.appUrl}/api/chapa/callback?tx_ref=${encodeURIComponent(txRef)}`,
      returnUrl: `${appConfig.appUrl}/billing/success?tx_ref=${encodeURIComponent(txRef)}`,
    });
    checkoutUrl = initialized.checkoutUrl;

    const updated = await admin.from("hisab_billing_payment_attempts").update({
      status: "open",
      checkout_url: checkoutUrl,
      updated_at: new Date().toISOString(),
    }).eq("tx_ref", txRef).eq("user_id", userId);
    if (updated.error) throw new Error(updated.error.message);
  } catch (error) {
    await admin.from("hisab_billing_payment_attempts").update({
      status: "failed",
      updated_at: new Date().toISOString(),
    }).eq("tx_ref", txRef).eq("user_id", userId);
    checkoutError(error instanceof Error ? error.message : "Chapa checkout could not start.", plan.code, billingCycle);
  }

  redirect(checkoutUrl);
}
