import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { verifyAndApplyChapaPayment } from "../../../../lib/chapa/settlement";
import { parseVerifiedChapaWebhook } from "../../../../lib/chapa/webhook";
import { createAdminClient } from "../../../../lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rawPayload = await request.text();
  let event: ReturnType<typeof parseVerifiedChapaWebhook>;
  try {
    event = parseVerifiedChapaWebhook(rawPayload, request.headers);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid webhook." }, { status: 400 });
  }

  const txRef = event.tx_ref!.trim();
  const eventType = typeof event.event === "string" ? event.event : "chapa.transaction";
  const mode = typeof event.mode === "string" ? event.mode : null;
  const eventKey = createHash("sha256")
    .update(`${eventType}:${txRef}:${String(event.reference || "")}:${String(event.status || "")}:${rawPayload}`)
    .digest("hex");
  const admin = createAdminClient();

  const inserted = await admin.from("hisab_billing_webhook_events").insert({
    event_key: eventKey,
    event_type: eventType,
    tx_ref: txRef,
    mode,
    status: "processing",
    payload: event,
  });
  if (inserted.error?.code === "23505") return NextResponse.json({ received: true, duplicate: true });
  if (inserted.error) return NextResponse.json({ error: "Webhook ledger is unavailable." }, { status: 503 });

  try {
    const result = await verifyAndApplyChapaPayment(txRef);
    const completed = await admin.from("hisab_billing_webhook_events").update({
      status: "processed",
      processed_at: new Date().toISOString(),
      error_message: null,
      updated_at: new Date().toISOString(),
    }).eq("event_key", eventKey);
    if (completed.error) throw new Error(completed.error.message);
    return NextResponse.json({ received: true, state: result.state });
  } catch (error) {
    await admin.from("hisab_billing_webhook_events").update({
      status: "failed",
      error_message: (error instanceof Error ? error.message : "Webhook processing failed.").slice(0, 1000),
      updated_at: new Date().toISOString(),
    }).eq("event_key", eventKey);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
