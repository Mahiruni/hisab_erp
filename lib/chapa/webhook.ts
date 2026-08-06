import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

function webhookSecret() {
  const value = process.env.CHAPA_WEBHOOK_SECRET?.trim();
  if (!value) throw new Error("Chapa webhook verification is not configured.");
  return value;
}

function constantTimeHexEquals(expectedHex: string, receivedHex: string) {
  if (!/^[a-f0-9]+$/i.test(receivedHex) || expectedHex.length !== receivedHex.length) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const received = Buffer.from(receivedHex, "hex");
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export function verifyChapaWebhookSignature(payload: string, headers: Headers) {
  const secret = webhookSecret();
  const payloadDigest = createHmac("sha256", secret).update(payload, "utf8").digest("hex");
  const secretDigest = createHmac("sha256", secret).update(secret, "utf8").digest("hex");
  const xSignature = headers.get("x-chapa-signature")?.trim() || "";
  const signature = headers.get("chapa-signature")?.trim() || "";

  const valid = (xSignature && constantTimeHexEquals(payloadDigest, xSignature))
    || (signature && (constantTimeHexEquals(secretDigest, signature) || constantTimeHexEquals(payloadDigest, signature)));
  if (!valid) throw new Error("Chapa webhook signature is invalid.");
}

export type ChapaWebhookPayload = Record<string, unknown> & {
  event?: string;
  tx_ref?: string;
  reference?: string;
  status?: string;
  mode?: string;
};

export function parseVerifiedChapaWebhook(payload: string, headers: Headers) {
  verifyChapaWebhookSignature(payload, headers);
  const event = JSON.parse(payload) as ChapaWebhookPayload;
  if (!event || typeof event !== "object" || typeof event.tx_ref !== "string" || !event.tx_ref.trim()) {
    throw new Error("Chapa webhook payload is invalid.");
  }
  return event;
}
