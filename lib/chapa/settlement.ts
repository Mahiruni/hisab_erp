import "server-only";

import { getBillingPlan, getPlanAmountEtb, isBillingCycle } from "../billing/catalog";
import { createAdminClient } from "../supabase/admin";
import { verifyChapaTransaction } from "./api";

type UnknownRecord = Record<string, unknown>;

export type ChapaSettlementState = "success" | "pending" | "failed" | "cancelled" | "refunded" | "reversed";

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? value as UnknownRecord : {};
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : value === null || value === undefined ? "" : String(value).trim();
}

function numberValue(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(text(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeStatus(value: unknown): ChapaSettlementState {
  const status = text(value).toLowerCase();
  if (status === "success" || status === "successful" || status === "paid") return "success";
  if (status === "failed" || status === "failure") return "failed";
  if (status === "cancelled" || status === "canceled") return "cancelled";
  if (status === "refunded") return "refunded";
  if (status === "reversed") return "reversed";
  return "pending";
}

export function isValidHisabTxRef(value: string) {
  return /^hisab-[0-9]{10,16}-[a-f0-9]{12}$/i.test(value);
}

export async function verifyAndApplyChapaPayment(txRef: string) {
  if (!isValidHisabTxRef(txRef)) throw new Error("Invalid Hisab payment reference.");

  const admin = createAdminClient();
  const attemptResult = await admin
    .from("hisab_billing_payment_attempts")
    .select("tx_ref,user_id,plan_code,billing_cycle,amount_etb,currency,status,chapa_reference,mode,payment_method")
    .eq("tx_ref", txRef)
    .maybeSingle();
  if (attemptResult.error) throw new Error(attemptResult.error.message);
  if (!attemptResult.data) throw new Error("Unknown Hisab payment reference.");

  const attempt = attemptResult.data;
  if (attempt.status === "success") return { state: "success" as const, attempt };

  const plan = getBillingPlan(attempt.plan_code);
  const billingCycle = isBillingCycle(attempt.billing_cycle) ? attempt.billing_cycle : null;
  if (!plan || !billingCycle) throw new Error("The stored Hisab payment plan is invalid.");

  const response = await verifyChapaTransaction(txRef);
  const data = asRecord(response.data);
  const verifiedTxRef = text(data.tx_ref || data.txRef || data.reference_id);
  const status = normalizeStatus(data.status || response.status);
  const currency = text(data.currency).toUpperCase();
  const amount = numberValue(data.amount);
  const expectedAmount = getPlanAmountEtb(plan, billingCycle);

  if (verifiedTxRef !== txRef) throw new Error("Chapa returned a different transaction reference.");
  if (currency !== "ETB") throw new Error("Chapa returned an unexpected currency.");
  if (amount === null || Math.abs(amount - expectedAmount) > 0.009) throw new Error("Chapa returned an unexpected payment amount.");

  if (status === "pending") {
    const pending = await admin.from("hisab_billing_payment_attempts").update({
      status: "pending",
      chapa_reference: text(data.reference) || null,
      mode: text(data.mode) || null,
      payment_method: text(data.payment_method || data.paymentMethod) || null,
      updated_at: new Date().toISOString(),
    }).eq("tx_ref", txRef);
    if (pending.error) throw new Error(pending.error.message);
    return { state: "pending" as const, attempt: { ...attempt, status: "pending" } };
  }

  const applied = await admin.rpc("hisab_apply_chapa_transaction", {
    p_tx_ref: txRef,
    p_status: status,
    p_chapa_reference: text(data.reference) || null,
    p_mode: text(data.mode) || null,
    p_payment_method: text(data.payment_method || data.paymentMethod) || null,
  });
  if (applied.error) throw new Error(applied.error.message);

  return { state: status, disposition: applied.data };
}
