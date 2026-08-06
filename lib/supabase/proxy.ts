import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { appConfig, isSupabaseConfigured } from "../config";

const publicPageRoutes = new Set([
  "/", "/request-demo", "/product-tour", "/ethiopia", "/industries", "/pricing", "/customer-stories", "/trust", "/integrations", "/migration", "/compare", "/help-center", "/resources", "/about",
  "/auth/login", "/auth/phone-login", "/auth/sign-up", "/auth/verify-phone", "/auth/email-login", "/auth/email-sign-up", "/auth/verify-email", "/auth/forgot-password", "/auth/magic-link", "/auth/reset-password", "/auth/invalid-link", "/auth/callback", "/auth/confirm",
]);

const publicAssetRoutes = new Set(["/manifest.webmanifest", "/robots.txt", "/sitemap.xml", "/release.json"]);
const publicPagePrefixes = ["/product/", "/industries/", "/compare/", "/help-center/", "/resources/"];
const authenticatedMarketingRoutes = new Set(["/request-demo", "/product-tour", "/ethiopia", "/industries", "/pricing", "/customer-stories", "/trust", "/integrations", "/migration", "/compare", "/help-center", "/resources", "/about"]);
const publicApiRoutes = new Set(["/api/health", "/api/reconciliation/telebirr/callback", "/api/reconciliation/mpesa/callback", "/api/chapa/callback", "/api/chapa/webhook"]);
const billingBypassPrefixes = ["/billing", "/checkout", "/onboarding", "/account", "/auth"];
const billingEnforcementEnabled = process.env.BILLING_ENFORCEMENT_ENABLED?.trim().toLowerCase() === "true";

export function isPublicPath(path: string) {
  return publicPageRoutes.has(path) || publicAssetRoutes.has(path) || publicPagePrefixes.some((prefix) => path.startsWith(prefix)) || publicApiRoutes.has(path);
}

export function isCacheablePublicPath(path: string) {
  return publicAssetRoutes.has(path) || path === "/" || authenticatedMarketingRoutes.has(path) || publicPagePrefixes.some((prefix) => path.startsWith(prefix));
}

function hasSupabaseSessionCookie(request: NextRequest) {
  return request.cookies.getAll().some(({ name }) => /^sb-.+-auth-token(?:\.\d+)?$/.test(name));
}

function loginRedirect(request: NextRequest) {
  const url = request.nextUrl.clone();
  const destination = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  url.pathname = "/auth/login";
  url.search = "";
  url.searchParams.set("next", destination);
  return NextResponse.redirect(url);
}

function billingRedirect(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/billing";
  url.search = "";
  url.searchParams.set("notice", "Choose or renew a verified HisabERP paid-access period to continue.");
  url.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(url);
}

export async function updateSession(request: NextRequest, requestHeaders: Headers) {
  const path = request.nextUrl.pathname;
  const publicPath = isPublicPath(path);
  const cacheablePublicPath = isCacheablePublicPath(path);
  requestHeaders.set("x-hisab-public-path", publicPath ? "1" : "0");
  requestHeaders.set("x-hisab-cacheable-public-path", cacheablePublicPath ? "1" : "0");

  if (!isSupabaseConfigured()) {
    if (publicPath) return NextResponse.next({ request: { headers: requestHeaders } });
    if (path.startsWith("/api/")) return NextResponse.json({ error: "Authentication is not configured." }, { status: 503 });
    return loginRedirect(request);
  }

  if (cacheablePublicPath && path !== "/") return NextResponse.next({ request: { headers: requestHeaders } });
  if (path === "/" && !hasSupabaseSessionCookie(request)) return NextResponse.next({ request: { headers: requestHeaders } });
  if (publicApiRoutes.has(path)) return NextResponse.next({ request: { headers: requestHeaders } });

  const pendingCookies: Array<{ name: string; value: string; options: Parameters<NextResponse["cookies"]["set"]>[2] }> = [];
  const supabase = createServerClient(appConfig.supabaseUrl, appConfig.supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) => pendingCookies.push({ name, value, options }));
      },
    },
  });

  const withCookies = (response: NextResponse) => {
    pendingCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
    return response;
  };

  const { data } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : "";
  const isAuthenticated = Boolean(userId);

  if (!isAuthenticated && !publicPath) {
    if (path.startsWith("/api/")) return withCookies(NextResponse.json({ error: "Authentication required." }, { status: 401 }));
    return withCookies(loginRedirect(request));
  }

  const billingBypass = billingBypassPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
  const paidWorkspacePath = path === "/" || (!publicPath && !billingBypass);
  if (isAuthenticated && billingEnforcementEnabled && paidWorkspacePath) {
    const access = await supabase.from("hisab_billing_access").select("status,current_period_end").eq("user_id", userId).maybeSingle();
    const end = access.data?.current_period_end ? new Date(String(access.data.current_period_end)).getTime() : 0;
    const grantsAccess = access.data?.status === "active" && Number.isFinite(end) && end > Date.now();
    if (!grantsAccess) {
      if (path.startsWith("/api/")) return withCookies(NextResponse.json({ error: "Active paid access required." }, { status: 402 }));
      return withCookies(billingRedirect(request));
    }
  }

  if (path === "/") {
    if (!isAuthenticated) return withCookies(NextResponse.next({ request: { headers: requestHeaders } }));
    const url = request.nextUrl.clone();
    url.pathname = "/workspace-home";
    return withCookies(NextResponse.rewrite(url, { request: { headers: requestHeaders } }));
  }

  const authenticatedRecoveryPage = path === "/auth/reset-password";
  const authenticatedPreview = request.nextUrl.searchParams.get("preview") === "1";
  const authenticatedMarketingPath = authenticatedMarketingRoutes.has(path) || publicPagePrefixes.some((prefix) => path.startsWith(prefix));
  if (isAuthenticated && publicPageRoutes.has(path) && path !== "/" && !authenticatedMarketingPath && path !== "/auth/callback" && path !== "/auth/confirm" && !authenticatedRecoveryPage && !authenticatedPreview) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return withCookies(NextResponse.redirect(url));
  }

  return withCookies(NextResponse.next({ request: { headers: requestHeaders } }));
}
