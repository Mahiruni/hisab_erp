import { handleProviderCallback } from "../../../../../lib/reconciliation/provider-callback";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleProviderCallback(request, "safaricom_daraja");
}
