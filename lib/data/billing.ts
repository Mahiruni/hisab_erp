import { isChapaConfigured } from "../chapa/api";
import { createClient } from "../supabase/server";

export type BillingAccessSnapshot = {
  userId: string;
  planCode: string;
  billingCycle: "monthly" | "annual";
  status: string;
  amountEtb: number;
  currency: string;
  provider: "chapa";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  lastTxRef: string;
  lastPaymentStatus: string;
  updatedAt: string;
};

export type BillingSnapshot = {
  configured: boolean;
  enforcementEnabled: boolean;
  access: BillingAccessSnapshot | null;
};

function billingEnforcementEnabled() {
  return process.env.BILLING_ENFORCEMENT_ENABLED?.trim().toLowerCase() === "true";
}

export function billingGrantsAccess(status: string | null | undefined, currentPeriodEnd?: string | null) {
  if (status !== "active" || !currentPeriodEnd) return false;
  const end = new Date(currentPeriodEnd).getTime();
  return Number.isFinite(end) && end > Date.now();
}

export async function getCurrentBillingSnapshot(): Promise<BillingSnapshot> {
  const configured = isChapaConfigured();
  const enforcementEnabled = billingEnforcementEnabled();
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = typeof claimsData?.claims?.sub === "string" ? claimsData.claims.sub : "";
  if (!userId) return { configured, enforcementEnabled, access: null };

  const { data, error } = await supabase
    .from("hisab_billing_access")
    .select("user_id,plan_code,billing_cycle,status,amount_etb,currency,provider,current_period_start,current_period_end,last_tx_ref,last_payment_status,updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return { configured, enforcementEnabled, access: null };
  return {
    configured,
    enforcementEnabled,
    access: {
      userId: String(data.user_id),
      planCode: String(data.plan_code),
      billingCycle: data.billing_cycle === "annual" ? "annual" : "monthly",
      status: String(data.status),
      amountEtb: Number(data.amount_etb || 0),
      currency: String(data.currency || "ETB"),
      provider: "chapa",
      currentPeriodStart: String(data.current_period_start),
      currentPeriodEnd: String(data.current_period_end),
      lastTxRef: String(data.last_tx_ref),
      lastPaymentStatus: String(data.last_payment_status),
      updatedAt: String(data.updated_at),
    },
  };
}
