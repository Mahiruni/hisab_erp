import { NextResponse, type NextRequest } from "next/server";
import { isValidHisabTxRef, verifyAndApplyChapaPayment } from "../../../../lib/chapa/settlement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function txRefFromRequest(request: NextRequest) {
  const queryValue = request.nextUrl.searchParams.get("tx_ref") || request.nextUrl.searchParams.get("trx_ref");
  if (queryValue) return queryValue.trim();

  if (request.method === "POST") {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await request.json().catch(() => null) as Record<string, unknown> | null;
      const value = body?.tx_ref ?? body?.trx_ref;
      return typeof value === "string" ? value.trim() : "";
    }
    const form = await request.formData().catch(() => null);
    const value = form?.get("tx_ref") ?? form?.get("trx_ref");
    return typeof value === "string" ? value.trim() : "";
  }
  return "";
}

async function handle(request: NextRequest) {
  const txRef = await txRefFromRequest(request);
  if (!isValidHisabTxRef(txRef)) return NextResponse.json({ error: "Invalid transaction reference." }, { status: 400 });

  try {
    const result = await verifyAndApplyChapaPayment(txRef);
    return NextResponse.json({ received: true, state: result.state }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Payment verification failed." }, { status: 502 });
  }
}

export const GET = handle;
export const POST = handle;
