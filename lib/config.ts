function normalizeUrl(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) return "";
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.replace(/\/+$/, "");
}

function isLocalUrl(value: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(value);
}

function enabledWhenTrue(value?: string) {
  return value?.trim().toLowerCase() === "true";
}

const configuredAppUrl = normalizeUrl(process.env.NEXT_PUBLIC_APP_URL);
const vercelProductionUrl = normalizeUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL);
const vercelDeploymentUrl = normalizeUrl(process.env.VERCEL_URL);

function resolveAppUrl() {
  if (configuredAppUrl && (!isLocalUrl(configuredAppUrl) || !vercelProductionUrl)) {
    return configuredAppUrl;
  }
  return vercelProductionUrl || vercelDeploymentUrl || configuredAppUrl || "http://localhost:3000";
}

export const appConfig = {
  name: "Hisab ERP",
  defaultLocale: "en" as const,
  supportedLocales: ["en", "am", "ti"] as const,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "",
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "",
  appUrl: resolveAppUrl(),
  authProviders: {
    google: process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH?.trim().toLowerCase() !== "false",
    apple: enabledWhenTrue(process.env.NEXT_PUBLIC_ENABLE_APPLE_AUTH),
    phone: enabledWhenTrue(process.env.NEXT_PUBLIC_ENABLE_PHONE_AUTH),
  },
};

export function isSupabaseConfigured() {
  return Boolean(appConfig.supabaseUrl && appConfig.supabaseKey);
}
