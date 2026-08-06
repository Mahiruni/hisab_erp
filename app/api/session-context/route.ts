import { NextResponse } from "next/server";
import { getCurrentUserContext } from "../../../lib/data/context";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUserContext();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({ user }, { headers: { "Cache-Control": "private, no-store" } });
}
