import { createHash } from "node:crypto";
import { ApiError } from "../shared/errors.js";
import { audit } from "../shared/audit.js";
import { createDocument, getDocument, listDocuments, Query, updateDocument } from "../shared/database.js";
import { requireSession } from "../shared/sessions.js";
import { listSessions, revokeSessionById } from "../shared/sessions.js";
import { requireSuperAdmin } from "../shared/rbac.js";
import { encryptSecret, generateTotpSecret, secureToken, sha256, verifyTotp } from "../shared/security.js";
import { loadConfig } from "../shared/config.js";
import { hashPassword } from "../shared/security.js";
import type { HttpRequest, HttpResponse } from "../shared/http.js";
import { json } from "../shared/http.js";

const COLLECTION = "nexora_enrollments";
interface Enrollment { enrollmentId: string; targetAdmin: string; nonceHash: string; tokenHash: string; state: string; expiresAt: string; usedAt?: string; secretEncrypted?: string; }
interface AdminRecord { $id: string; role: string; enabled: boolean; nexoraState: string; nexoraSecretEncrypted?: string; }

function requestId(request: HttpRequest): string { return request.headers.get("x-request-id") || "unknown"; }
function assertNotExpired(record: Enrollment): void { if (Date.now() >= Date.parse(record.expiresAt) && !["EXPIRED", "CANCELLED", "ACTIVE"].includes(record.state)) throw new ApiError("AUTHENTICATION_REQUIRED", "Enrollment expired.", 410); }

export async function createEnrollment(request: HttpRequest): Promise<HttpResponse> {
  const session = await requireSession(request.cookies[loadConfig().sessionCookieName]);
  if (session.role !== "SUPER_ADMIN") throw new ApiError("FORBIDDEN", "Only a Super Admin can enroll an authenticator.", 403);
  const config = loadConfig();
  if (!config.nexora.baseUrl || !config.nexora.serviceToken || !config.nexora.tenant || !config.nexora.callbackId) throw new ApiError("CONFIGURATION_REQUIRED", "NEXORA is not configured.", 503);
  const targetAdmin = (request.body as { adminId?: string }).adminId || session.adminId;
  const admin = await getDocument<AdminRecord>("admins", targetAdmin);
  if (!admin.enabled) throw new ApiError("FORBIDDEN", "The target admin is disabled.", 403);
  const enrollmentId = secureToken(18); const nonce = secureToken(24); const token = secureToken(32); const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  await createDocument(COLLECTION, { enrollmentId, targetAdmin, nonceHash: sha256(nonce), tokenHash: sha256(token), state: "PENDING", expiresAt });
  await audit("nexora.enrollment.created", "SUCCESS", requestId(request), session, "nexora_enrollment", enrollmentId, { targetAdmin });
  return json(201, { protocol: "nexora-digiseva", version: 1, tenant: config.nexora.tenant, enrollmentId, nonce, token, expiresAt, callback: config.nexora.callbackId });
}

export async function callback(request: HttpRequest): Promise<HttpResponse> {
  const config = loadConfig();
  if (!config.nexora.serviceToken || request.headers.get("x-nexora-service-token") !== config.nexora.serviceToken) throw new ApiError("AUTHENTICATION_REQUIRED", "NEXORA authentication failed.", 401);
  const body = request.body as { enrollmentId?: string; nonce?: string; token?: string; state?: string; version?: number; totpSecret?: string };
  if (body.version !== 1 || !body.enrollmentId || !body.nonce || !body.token || !["SCANNED", "CONFIRMED"].includes(body.state || "")) throw new ApiError("VALIDATION_ERROR", "Invalid NEXORA callback.");
  const record = await getDocument<Enrollment>(COLLECTION, body.enrollmentId);
  if (record.usedAt || Date.now() >= Date.parse(record.expiresAt) || !["PENDING", "SCANNED"].includes(record.state) || sha256(body.nonce) !== record.nonceHash || sha256(body.token) !== record.tokenHash) throw new ApiError("FORBIDDEN", "Invalid or replayed enrollment.", 403);
  const nextState = body.state === "SCANNED" ? "SCANNED" : "CONFIRMED";
  const update: Partial<Enrollment> = { state: nextState };
  if (nextState === "CONFIRMED") { if (!body.totpSecret) throw new ApiError("VALIDATION_ERROR", "NEXORA did not provide server-side TOTP material."); update.secretEncrypted = encryptSecret(body.totpSecret); update.usedAt = new Date().toISOString(); }
  await updateDocument<Enrollment>(COLLECTION, body.enrollmentId, update);
  await audit(`nexora.callback.${nextState.toLowerCase()}`, "SUCCESS", requestId(request), undefined, "nexora_enrollment", body.enrollmentId);
  return json(200, { state: nextState });
}

export async function getEnrollment(request: HttpRequest, enrollmentId: string): Promise<HttpResponse> {
  const session = await requireSession(request.cookies[loadConfig().sessionCookieName]);
  const record = await getDocument<Enrollment>(COLLECTION, enrollmentId);
  if (record.targetAdmin !== session.adminId && session.role !== "SUPER_ADMIN") throw new ApiError("FORBIDDEN", "You do not have access to this enrollment.", 403);
  if (Date.now() >= Date.parse(record.expiresAt) && !["EXPIRED", "CANCELLED", "ACTIVE"].includes(record.state)) { await updateDocument<Enrollment>(COLLECTION, enrollmentId, { state: "EXPIRED" }); record.state = "EXPIRED"; }
  return json(200, { enrollmentId: record.enrollmentId, state: record.state, expiresAt: record.expiresAt });
}

export async function verifyEnrollment(request: HttpRequest, enrollmentId: string): Promise<HttpResponse> {
  const session = await requireSession(request.cookies[loadConfig().sessionCookieName]);
  const record = await getDocument<Enrollment>(COLLECTION, enrollmentId);
  if (record.targetAdmin !== session.adminId && session.role !== "SUPER_ADMIN") throw new ApiError("FORBIDDEN", "You do not have access to this enrollment.", 403);
  assertNotExpired(record);
  if (record.state !== "CONFIRMED" || !record.secretEncrypted) throw new ApiError("VALIDATION_ERROR", "Enrollment is not ready for verification.");
  const token = (request.body as { token?: string }).token?.trim();
  if (!/^\d{6}$/.test(token || "") || !(await verifyTotp((await import("../shared/security.js")).decryptSecret(record.secretEncrypted), token || ""))) throw new ApiError("AUTHENTICATION_REQUIRED", "Invalid authenticator code.", 401);
  await updateDocument<Enrollment>(COLLECTION, enrollmentId, { state: "ACTIVE" });
  await updateDocument<AdminRecord>("admins", record.targetAdmin, { nexoraState: "ACTIVE", nexoraSecretEncrypted: record.secretEncrypted });
  const recoveryCodes = Array.from({ length: 8 }, () => `${secureToken(6)}-${secureToken(6)}`.toUpperCase());
  for (const code of recoveryCodes) await createDocument("admin_recovery_codes", { adminId: record.targetAdmin, codeHash: await hashPassword(code, process.env.PASSWORD_PEPPER || ""), createdAt: new Date().toISOString() });
  await audit("nexora.enrollment.activated", "SUCCESS", requestId(request), session, "admin", record.targetAdmin);
  return json(200, { state: "ACTIVE", recoveryCodes });
}

export async function cancelEnrollment(request: HttpRequest, enrollmentId: string): Promise<HttpResponse> {
  const session = await requireSession(request.cookies[loadConfig().sessionCookieName]);
  if (session.role !== "SUPER_ADMIN") throw new ApiError("FORBIDDEN", "Only a Super Admin can cancel enrollment.", 403);
  const record = await getDocument<Enrollment>(COLLECTION, enrollmentId);
  if (["ACTIVE", "CANCELLED"].includes(record.state)) throw new ApiError("VALIDATION_ERROR", "Enrollment cannot be cancelled.");
  await updateDocument<Enrollment>(COLLECTION, enrollmentId, { state: "CANCELLED", usedAt: new Date().toISOString() });
  await audit("nexora.enrollment.cancelled", "SUCCESS", requestId(request), session, "nexora_enrollment", enrollmentId);
  return json(200, { state: "CANCELLED" });
}

export async function revokeNexora(request: HttpRequest): Promise<HttpResponse> {
  const session = await requireSession(request.cookies[loadConfig().sessionCookieName]); requireSuperAdmin(session);
  const targetAdmin = (request.body as { adminId?: string }).adminId || session.adminId;
  await updateDocument<AdminRecord>("admins", targetAdmin, { nexoraState: "NOT_ENROLLED", nexoraSecretEncrypted: "" });
  const sessions = await listSessions(targetAdmin); await Promise.all(sessions.filter((item) => !item.revokedAt).map((item) => revokeSessionById(targetAdmin, item.sessionId)));
  await audit("nexora.revoked", "SUCCESS", requestId(request), session, "admin", targetAdmin); return json(200, { state: "NOT_ENROLLED", sessionsRevoked: sessions.length });
}

export async function reEnrollNexora(request: HttpRequest): Promise<HttpResponse> {
  const session = await requireSession(request.cookies[loadConfig().sessionCookieName]); requireSuperAdmin(session);
  const targetAdmin = (request.body as { adminId?: string }).adminId || session.adminId;
  await updateDocument<AdminRecord>("admins", targetAdmin, { nexoraState: "NOT_ENROLLED", nexoraSecretEncrypted: "" });
  await audit("nexora.re_enroll.started", "SUCCESS", requestId(request), session, "admin", targetAdmin);
  return createEnrollment({ ...request, body: { adminId: targetAdmin } });
}
