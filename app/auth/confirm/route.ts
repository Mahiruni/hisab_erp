import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { safeNextPath } from "../../../lib/validation";

const allowedTypes = new Set<EmailOtpType>(["email", "recovery", "signup", "invite", "magiclink", "email_change"]);

function failureRedirect(request: NextRequest) {
  return NextResponse.redirect(new URL("/auth/invalid-link", request.url));
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const providerError = params.get("error_description") || params.get("error");
  if (providerError) return failureRedirect(request);

  const rawType = params.get("type") as EmailOtpType | null;
  const tokenHash = params.get("token_hash");
  const code = params.get("code");
  const defaultNext = rawType === "recovery" ? "/auth/reset-password" : "/onboarding";
  const next = safeNextPath(params.get("next") || defaultNext);
  const supabase = await createClient();

  if (tokenHash && rawType && allowedTypes.has(rawType)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: rawType });
    if (!error) return NextResponse.redirect(new URL(next, request.url));
    return failureRedirect(request);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  }

  return failureRedirect(request);
}
