import { NextResponse, type NextRequest } from "next/server";
import { isValidHisabTxRef, verifyAndApplyChapaPayment } from "../../../../lib/chapa/settlement";
import { billingGrantsAccess } from "../../../../lib/data/billing";
import { createClient } from "../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const txRef = request.nextUrl.searchParams.get("tx_ref")?.trim() || "";
  if (!isValidHisabTxRef(txRef)) return NextResponse.json({ error: "Invalid transaction reference." }, { status: 400 });

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = typeof claimsData?.claims?.sub === "string" ? claimsData.claims.sub : "";
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  let attempt = await supabase
    .from("hisab_billing_payment_attempts")
    .select("status,plan_code,billing_cycle,amount_etb,currency,chapa_reference,verified_at")
    .eq("tx_ref", txRef)
    .eq("user_id", userId)
    .maybeSingle();
  if (attempt.error) return NextResponse.json({ error: "Payment status is unavailable." }, { status: 503 });
  if (!attempt.data) return NextResponse.json({ error: "Payment reference not found." }, { status: 404 });

  if (["creating", "open", "pending"].includes(String(attempt.data.status))) {
    await verifyAndApplyChapaPayment(txRef).catch(() => undefined);
    attempt = await supabase
      .from("hisab_billing_payment_attempts")
      .select("status,plan_code,billing_cycle,amount_etb,currency,chapa_reference,verified_at")
      .eq("tx_ref", txRef)
      .eq("user_id", userId)
      .maybeSingle();
  }

  const access = await supabase
    .from("hisab_billing_access")
    .select("status,plan_code,billing_cycle,current_period_start,current_period_end,last_payment_status,last_tx_ref")
    .eq("user_id", userId)
    .maybeSingle();
  if (access.error) return NextResponse.json({ error: "Paid access status is unavailable." }, { status: 503 });

  const grantsAccess = billingGrantsAccess(access.data?.status, access.data?.current_period_end);
  const paymentStatus = String(attempt.data?.status || "pending");
  const failed = ["failed", "cancelled", "refunded", "reversed"].includes(paymentStatus);
  const state = grantsAccess && paymentStatus === "success"
    ? "verified"
    : paymentStatus === "success"
      ? "activating"
      : failed
        ? "failed"
        : "processing";

  return NextResponse.json({ state, payment: attempt.data, access: access.data }, { headers: { "Cache-Control": "no-store" } });
}
