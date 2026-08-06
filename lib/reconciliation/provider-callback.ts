import "server-only";
import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "../supabase/admin";
import { getMpesaCallbackCredential } from "./daraja";

type Provider = "telebirr" | "safaricom_daraja";
type NormalizedProviderEvent = {
  externalAccountReference: string;
  eventId: string;
  status: string;
  transactionId: string | null;
  orderId: string | null;
  transactionTime: string | null;
  amount: number;
  currency: string;
  reference: string | null;
  counterpartyName: string | null;
  counterpartyPhone: string | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function firstString(...values: unknown[]) {
  return values.find((value): value is string => typeof value === "string" && value.trim().length > 0)?.trim() ?? null;
}

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    const number = typeof value === "number" ? value : typeof value === "string" ? Number(value.replace(/,/g, "")) : Number.NaN;
    if (Number.isFinite(number)) return number;
  }
  return 0;
}

function metadataValue(items: unknown, name: string) {
  if (!Array.isArray(items)) return undefined;
  const item = items.find((entry) => String(asRecord(entry).Name || asRecord(entry).name || "").toLowerCase() === name.toLowerCase());
  const record = asRecord(item);
  return record.Value ?? record.value;
}

function normalizeTelebirr(payload: Record<string, unknown>, sourceReference: string): NormalizedProviderEvent {
  const data = asRecord(payload.data);
  const body = asRecord(payload.body);
  const eventId = firstString(payload.eventId, payload.event_id, payload.notifyId, payload.notify_id, data.eventId, data.notifyId, payload.transactionId, payload.transaction_id);
  if (!eventId) throw new Error("Telebirr callback is missing an event identifier.");
  return {
    externalAccountReference: sourceReference,
    eventId,
    status: firstString(payload.status, payload.tradeStatus, payload.trade_status, payload.resultCode, payload.code, data.status, body.status) || "unknown",
    transactionId: firstString(payload.transactionId, payload.transaction_id, payload.tradeNo, payload.trade_no, data.transactionId, body.transactionId),
    orderId: firstString(payload.orderId, payload.order_id, payload.outTradeNo, payload.out_trade_no, data.orderId, body.orderId),
    transactionTime: firstString(payload.transactionTime, payload.transaction_time, payload.completedAt, payload.completed_at, payload.timestamp, data.transactionTime),
    amount: firstNumber(payload.amount, payload.totalAmount, payload.total_amount, payload.transAmount, data.amount, body.amount),
    currency: (firstString(payload.currency, data.currency, body.currency) || "ETB").toUpperCase(),
    reference: firstString(payload.reference, payload.subject, payload.title, payload.orderTitle, payload.order_title, data.reference),
    counterpartyName: firstString(payload.payerName, payload.payer_name, payload.customerName, payload.customer_name, data.payerName),
    counterpartyPhone: firstString(payload.msisdn, payload.phone, payload.phoneNumber, payload.phone_number, data.msisdn),
  };
}

function normalizeMpesa(payload: Record<string, unknown>, sourceReference: string): NormalizedProviderEvent {
  const body = asRecord(payload.Body);
  const callback = asRecord(body.stkCallback);
  const metadata = asRecord(callback.CallbackMetadata);
  const items = metadata.Item;
  const eventId = firstString(
    payload.TransID,
    payload.TransactionID,
    callback.CheckoutRequestID,
    callback.MerchantRequestID,
    payload.ConversationID,
    payload.OriginatorConversationID,
  );
  if (!eventId) throw new Error("M-Pesa callback is missing an event identifier.");
  const resultCode = callback.ResultCode ?? payload.ResultCode ?? payload.ResponseCode;
  return {
    externalAccountReference: sourceReference,
    eventId,
    status: String(resultCode ?? payload.Status ?? "unknown"),
    transactionId: firstString(payload.TransID, metadataValue(items, "MpesaReceiptNumber"), payload.TransactionID),
    orderId: firstString(callback.CheckoutRequestID, callback.MerchantRequestID, payload.BillRefNumber, payload.InvoiceNumber),
    transactionTime: firstString(payload.TransTime, metadataValue(items, "TransactionDate"), payload.TransactionTime),
    amount: firstNumber(payload.TransAmount, metadataValue(items, "Amount"), payload.TransactionAmount),
    currency: (firstString(payload.Currency, payload.CurrencyCode) || "ETB").toUpperCase(),
    reference: firstString(payload.BillRefNumber, payload.InvoiceNumber, callback.CheckoutRequestID, payload.Remarks),
    counterpartyName: firstString(payload.FirstName, payload.CustomerName, payload.ThirdPartyTransID),
    counterpartyPhone: firstString(payload.MSISDN, metadataValue(items, "PhoneNumber"), payload.PhoneNumber),
  };
}

function validToken(received: string | null, expected: string | undefined) {
  if (!received || !expected) return false;
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
}

export async function handleProviderCallback(request: Request, provider: Provider) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || request.headers.get("x-hisab-callback-token");
  const sourceReference = url.searchParams.get("source")?.trim() || "";
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: "Provider callback processing is not configured." }, { status: 503 });
  }
  if (!sourceReference) return Response.json({ error: "Missing reconciliation source reference." }, { status: 400 });

  let expectedToken = provider === "telebirr" ? process.env.TELEBIRR_CALLBACK_TOKEN : process.env.MPESA_CALLBACK_TOKEN;
  if (provider === "safaricom_daraja" && !expectedToken) {
    const credential = await getMpesaCallbackCredential(sourceReference);
    expectedToken = credential?.token;
  }
  if (!expectedToken) return Response.json({ error: "Provider callback processing is not configured." }, { status: 503 });
  if (!validToken(token, expectedToken)) return Response.json({ error: "Invalid callback token." }, { status: 401 });

  let payload: Record<string, unknown>;
  try {
    payload = asRecord(await request.json());
  } catch {
    return Response.json({ error: "Callback body must be valid JSON." }, { status: 400 });
  }

  try {
    const event = provider === "telebirr" ? normalizeTelebirr(payload, sourceReference) : normalizeMpesa(payload, sourceReference);
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("ingest_provider_reconciliation_event", {
      p_provider: provider,
      p_external_account_reference: event.externalAccountReference,
      p_event_id: event.eventId,
      p_event_status: event.status,
      p_provider_transaction_id: event.transactionId,
      p_provider_order_id: event.orderId,
      p_transaction_time: event.transactionTime,
      p_amount: event.amount,
      p_currency: event.currency,
      p_reference: event.reference,
      p_counterparty_name: event.counterpartyName,
      p_counterparty_phone: event.counterpartyPhone,
      p_payload: payload,
      p_signature_valid: true,
    });
    if (error) throw new Error(error.message);
    if (provider === "safaricom_daraja") return Response.json({ ResultCode: 0, ResultDesc: "Accepted", data });
    return Response.json({ code: 0, message: "accepted", data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Provider callback could not be processed.";
    if (provider === "safaricom_daraja") return Response.json({ ResultCode: 1, ResultDesc: message }, { status: 422 });
    return Response.json({ code: 1, message }, { status: 422 });
  }
}
