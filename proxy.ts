import { NextResponse, type NextRequest } from "next/server";
import { isCacheablePublicPath, updateSession } from "./lib/supabase/proxy";
import { rateLimit } from "./lib/security/rate-limit";

function contentSecurityPolicy(nonce: string | null, relaxedScripts: boolean) {
  const extraConnect = process.env.CSP_CONNECT_SRC?.split(",").map((value) => value.trim()).filter(Boolean).join(" ") ?? "";
  const scriptPolicy = relaxedScripts ? "'self' 'unsafe-inline'" : `'self' 'nonce-${nonce}' 'strict-dynamic'`;
  return [
    "default-src 'self'",
    `script-src ${scriptPolicy}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.googleusercontent.com https://www.ethiotelecom.et",
    "font-src 'self' data:",
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co ${extraConnect}`.trim(),
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

function securityHeaders(response: NextResponse, csp: string, nonce: string | null) {
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Permissions-Policy", "camera=(self), microphone=(), geolocation=()");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  if (nonce) response.headers.set("x-nonce", nonce);
  else response.headers.delete("x-nonce");
  return response;
}

function hasSupabaseSessionCookie(request: NextRequest) {
  return request.cookies.getAll().some(({ name }) => /^sb-.+-auth-token(?:\.\d+)?$/.test(name));
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isLegacy = path.startsWith("/legacy");
  const cacheablePublic = isCacheablePublicPath(path) && !(path === "/" && hasSupabaseSessionCookie(request));
  const relaxedScripts = isLegacy || cacheablePublic;
  const nonce = relaxedScripts ? null : crypto.randomUUID().replaceAll("-", "");
  const csp = contentSecurityPolicy(nonce, relaxedScripts);
  const isSensitive = path.startsWith("/auth/") || path.startsWith("/api/");

  if (isSensitive) {
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const key = `${forwarded || "unknown"}:${path}`;
    const result = rateLimit(key, path.startsWith("/auth/") ? 12 : 60);
    if (!result.allowed) {
      const response = NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
      response.headers.set("Retry-After", String(Math.ceil((result.resetAt - Date.now()) / 1000)));
      return securityHeaders(response, csp, nonce);
    }
  }

  // Anonymous marketing and metadata requests bypass session middleware entirely.
  // They use a static CSP without a per-request nonce so Vercel can cache the
  // rendered response at the CDN instead of forcing dynamic rendering.
  if (cacheablePublic && request.method === "GET") {
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=86400");
    return securityHeaders(response, csp, null);
  }

  const requestHeaders = new Headers(request.headers);
  if (nonce) requestHeaders.set("x-nonce", nonce);
  else requestHeaders.delete("x-nonce");
  requestHeaders.set("Content-Security-Policy", csp);
  const response = await updateSession(request, requestHeaders);

  return securityHeaders(response, csp, nonce);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2|css|js|mjs|map|webmanifest)$).*)",
  ],
};
