import "server-only";

const CHAPA_API_BASE = "https://api.chapa.co/v1";

type UnknownRecord = Record<string, unknown>;

export type ChapaInitializeResponse = {
  status?: string;
  message?: string;
  data?: {
    checkout_url?: string;
  } | null;
};

export type ChapaVerificationResponse = {
  status?: string;
  message?: string;
  data?: UnknownRecord | null;
};

function chapaSecretKey() {
  const value = process.env.CHAPA_SECRET_KEY?.trim();
  if (!value) throw new Error("Chapa billing is not configured.");
  return value;
}

export function isChapaConfigured() {
  return Boolean(process.env.CHAPA_SECRET_KEY?.trim() && process.env.CHAPA_WEBHOOK_SECRET?.trim());
}

async function chapaRequest<T>(path: string, options: { method?: "GET" | "POST"; body?: UnknownRecord } = {}) {
  const method = options.method || "GET";
  const response = await fetch(`${CHAPA_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${chapaSecretKey()}`,
      Accept: "application/json",
      ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
    },
    body: method === "POST" ? JSON.stringify(options.body || {}) : undefined,
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null) as T | { message?: string } | null;
  if (!response.ok) {
    const message = payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
      ? payload.message
      : "Chapa could not complete the request.";
    throw new Error(message);
  }
  return payload as T;
}

export async function initializeChapaPayment(input: {
  txRef: string;
  amountEtb: number;
  email: string | null;
  userId: string;
  planCode: string;
  planName: string;
  billingCycle: "monthly" | "annual";
  callbackUrl: string;
  returnUrl: string;
}) {
  const response = await chapaRequest<ChapaInitializeResponse>("/transaction/initialize", {
    method: "POST",
    body: {
      amount: input.amountEtb.toFixed(2),
      currency: "ETB",
      tx_ref: input.txRef,
      callback_url: input.callbackUrl,
      return_url: input.returnUrl,
      ...(input.email ? { email: input.email } : {}),
      customization: {
        title: `HisabERP ${input.planName}`,
        description: `${input.billingCycle === "annual" ? "Annual" : "Monthly"} HisabERP access`,
      },
      meta: {
        hisab_user_id: input.userId,
        plan_code: input.planCode,
        billing_cycle: input.billingCycle,
      },
    },
  });

  const checkoutUrl = response.data?.checkout_url?.trim();
  if (response.status?.toLowerCase() !== "success" || !checkoutUrl) {
    throw new Error(response.message || "Chapa did not return a secure checkout link.");
  }
  return { checkoutUrl, response };
}

export async function verifyChapaTransaction(txRef: string) {
  return chapaRequest<ChapaVerificationResponse>(`/transaction/verify/${encodeURIComponent(txRef)}`);
}
