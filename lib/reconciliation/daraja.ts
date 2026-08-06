import "server-only";

import { createAdminClient } from "../supabase/admin";
import { createClient } from "../supabase/server";

export type DarajaEnvironment = "sandbox" | "production";
export type MpesaDarajaStatus = {
  configured: boolean;
  environment: DarajaEnvironment;
  keySuffix: string | null;
  callbackTokenPresent: boolean;
  lastCheck: null | {
    success: boolean;
    httpStatus: number | null;
    responseCode: string | null;
    message: string | null;
    checkedAt: string;
  };
};

type DarajaCredentials = {
  consumerKey: string;
  consumerSecret: string;
  environment: DarajaEnvironment;
  callbackToken: string | null;
};

export type DarajaConnectionResult = {
  success: boolean;
  environment: DarajaEnvironment;
  httpStatus: number | null;
  responseCode: string | null;
  message: string;
  expiresIn: number | null;
};

const OAUTH_ENDPOINTS: Record<DarajaEnvironment, string> = {
  sandbox: "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
  production: "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function firstString(...values: unknown[]) {
  return values.find((value): value is string => typeof value === "string" && value.trim().length > 0)?.trim() ?? null;
}

function normalizeStatus(value: unknown): MpesaDarajaStatus {
  const record = asRecord(value);
  const lastCheck = asRecord(record.lastCheck);
  return {
    configured: record.configured === true,
    environment: record.environment === "production" ? "production" : "sandbox",
    keySuffix: firstString(record.keySuffix),
    callbackTokenPresent: record.callbackTokenPresent === true,
    lastCheck: Object.keys(lastCheck).length ? {
      success: lastCheck.success === true,
      httpStatus: typeof lastCheck.httpStatus === "number" ? lastCheck.httpStatus : null,
      responseCode: firstString(lastCheck.responseCode),
      message: firstString(lastCheck.message),
      checkedAt: firstString(lastCheck.checkedAt) || new Date(0).toISOString(),
    } : null,
  };
}

export async function getMpesaDarajaStatus(organizationId: string): Promise<MpesaDarajaStatus> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_mpesa_daraja_status", { p_organization_id: organizationId });
  if (error) {
    return { configured: false, environment: "sandbox", keySuffix: null, callbackTokenPresent: false, lastCheck: null };
  }
  return normalizeStatus(data);
}

async function getDarajaCredentials(organizationId: string): Promise<DarajaCredentials> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("get_mpesa_daraja_credentials", { p_organization_id: organizationId });
  if (error) throw new Error(error.message);
  const record = asRecord(data);
  const consumerKey = firstString(record.consumerKey);
  const consumerSecret = firstString(record.consumerSecret);
  if (!consumerKey || !consumerSecret) throw new Error("M-Pesa Daraja credentials are not configured.");
  return {
    consumerKey,
    consumerSecret,
    environment: record.environment === "production" ? "production" : "sandbox",
    callbackToken: firstString(record.callbackToken),
  };
}

export async function validateMpesaDarajaConnection(organizationId: string): Promise<DarajaConnectionResult> {
  const credentials = await getDarajaCredentials(organizationId);
  const authorization = Buffer.from(`${credentials.consumerKey}:${credentials.consumerSecret}`, "utf8").toString("base64");
  let response: Response;
  try {
    response = await fetch(OAUTH_ENDPOINTS[credentials.environment], {
      method: "GET",
      headers: { Accept: "application/json", Authorization: `Basic ${authorization}` },
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
  } catch {
    return {
      success: false,
      environment: credentials.environment,
      httpStatus: null,
      responseCode: "network_error",
      message: "The Safaricom Daraja OAuth endpoint could not be reached.",
      expiresIn: null,
    };
  }

  let payload: Record<string, unknown> = {};
  try { payload = asRecord(await response.json()); } catch { payload = {}; }
  const accessToken = firstString(payload.access_token, payload.accessToken);
  const expiresInValue = Number(payload.expires_in ?? payload.expiresIn);
  const expiresIn = Number.isFinite(expiresInValue) ? expiresInValue : null;
  const responseCode = firstString(payload.errorCode, payload.error, payload.code, payload.requestId);
  const providerMessage = firstString(payload.errorMessage, payload.error_description, payload.message);
  const success = response.ok && Boolean(accessToken);
  return {
    success,
    environment: credentials.environment,
    httpStatus: response.status,
    responseCode: success ? "oauth_token_issued" : responseCode || "oauth_rejected",
    message: success ? "Safaricom issued a Daraja OAuth access token." : providerMessage || "Safaricom rejected the Daraja credentials.",
    expiresIn: success ? expiresIn : null,
  };
}

export async function getMpesaCallbackCredential(sourceReference: string) {
  const admin = createAdminClient();
  const { data: source, error } = await admin
    .from("reconciliation_sources")
    .select("organization_id")
    .eq("provider", "safaricom_daraja")
    .eq("external_account_reference", sourceReference)
    .eq("status", "ready")
    .maybeSingle();
  if (error || !source?.organization_id) return null;
  try {
    const credentials = await getDarajaCredentials(String(source.organization_id));
    return credentials.callbackToken ? { organizationId: String(source.organization_id), token: credentials.callbackToken } : null;
  } catch {
    return null;
  }
}
