import { createHmac } from "node:crypto";
import { ApiError } from "../shared/errors.js";
import { audit } from "../shared/audit.js";
import { createDocument, listDocuments } from "../shared/database.js";
import { loadConfig } from "../shared/config.js";
import { secureToken, constantTimeEqual } from "../shared/security.js";
import type { HttpRequest, HttpResponse } from "../shared/http.js";
import { json } from "../shared/http.js";

const transitions: Record<string, readonly string[]> = { UNINITIATED: ["INITIATED"], INITIATED: ["PENDING", "FAILED", "EXPIRED", "UNKNOWN"], PENDING: ["SUCCESS", "FAILED", "EXPIRED", "UNKNOWN"], UNKNOWN: ["PENDING", "SUCCESS", "FAILED"] };
interface Payment extends Record<string, unknown> {
  paymentId: string;
  applicationRef: string;
  idempotencyKey: string;
  totalPaise: number;
  status: string;
}

export async function createPayment(request: HttpRequest): Promise<HttpResponse> {
  const body = request.body as { applicationId?: string; idempotencyKey?: string };
  if (!body.applicationId || !body.idempotencyKey || body.idempotencyKey.length < 16) throw new ApiError("VALIDATION_ERROR", "Application ID and a strong idempotency key are required.");
  const existing = await listDocuments<Payment>("payments", [], 100);
  const duplicate = existing.items.find((payment) => payment.idempotencyKey === body.idempotencyKey);
  if (duplicate) return json(200, duplicate);
  const config = loadConfig();
  if (!config.payment.provider || !config.payment.baseUrl || !config.payment.key) throw new ApiError("CONFIGURATION_REQUIRED", "Payment provider is not configured.", 503);
  const payment = { paymentId: secureToken(18), applicationRef: body.applicationId, idempotencyKey: body.idempotencyKey, governmentFeePaise: 0, digiSevaFeePaise: 0, otherChargesPaise: 0, totalPaise: 0, currency: "INR", status: "INITIATED", initiatedAt: new Date().toISOString() };
  await createDocument("payments", payment);
  return json(201, payment);
}

export async function webhook(request: HttpRequest): Promise<HttpResponse> {
  const config = loadConfig(); if (!config.payment.webhookSecret) throw new ApiError("CONFIGURATION_REQUIRED", "Payment webhook is not configured.", 503);
  const timestamp = request.headers.get("x-provider-timestamp") || ""; const signature = request.headers.get("x-provider-signature") || ""; const raw = request.rawBody || "";
  if (!timestamp || Math.abs(Date.now() - Number(timestamp)) > 5 * 60 * 1000) throw new ApiError("FORBIDDEN", "Invalid webhook timestamp.", 403);
  const expected = createHmac("sha256", config.payment.webhookSecret).update(`${timestamp}.${raw}`).digest("hex"); if (!constantTimeEqual(expected, signature)) throw new ApiError("FORBIDDEN", "Invalid webhook signature.", 403);
  const body = JSON.parse(raw) as { providerEventId?: string; paymentId?: string; status?: string; amountPaise?: number; currency?: string };
  if (!body.providerEventId || !body.paymentId || body.currency !== "INR") throw new ApiError("VALIDATION_ERROR", "Invalid payment event.");
  const events = await listDocuments<{ providerEventId: string }>("payment_events", [], 100); if (events.items.some((event) => event.providerEventId === body.providerEventId)) return json(200, { accepted: true, duplicate: true });
  const payments = await listDocuments<Payment>("payments", [], 100); const payment = payments.items.find((item) => item.paymentId === body.paymentId); if (!payment || payment.totalPaise !== body.amountPaise || !transitions[payment.status]?.includes(body.status || "")) throw new ApiError("FORBIDDEN", "Payment event failed verification.", 403);
  await createDocument("payment_events", { paymentRef: payment.$id, providerEventId: body.providerEventId, eventType: body.status, signatureVerified: true, payloadHash: secureToken(16), createdAt: new Date().toISOString() });
  await audit("payment.webhook", "SUCCESS", request.headers.get("x-request-id") || "unknown", undefined, "payment", payment.paymentId);
  return json(200, { accepted: true });
}
