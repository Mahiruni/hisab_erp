import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "../../../lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "hisab-erp",
    timestamp: new Date().toISOString(),
    databaseConfigured: isSupabaseConfigured(),
    version: process.env.VERCEL_GIT_COMMIT_SHA || "local",
  }, { headers: { "Cache-Control": "no-store" } });
}
