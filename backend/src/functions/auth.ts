import { ApiError } from "../shared/errors.js";
import { audit } from "../shared/audit.js";
import { listDocuments } from "../shared/database.js";
import { enforceRateLimit } from "../shared/rateLimit.js";
import { createAuthChallenge, createSession, requireAuthChallenge, requireSession, revokeSession, updateAuthChallenge } from "../shared/sessions.js";
import { decryptSecret, verifyPassword, verifyTotp } from "../shared/security.js";
import type { AdminRole } from "../shared/models.js";
import type { HttpRequest, HttpResponse } from "../shared/http.js";
import { expiredCookie, json, sessionCookie } from "../shared/http.js";

interface AdminRecord { $id: string; email: string; passwordHash: string; role: AdminRole; enabled: boolean; nexoraState: string; nexoraSecretEncrypted?: string; }

export async function login(request: HttpRequest): Promise<HttpResponse> {
  enforceRateLimit(`admin-login:${request.headers.get("x-forwarded-for") || "unknown"}`, 5, 15 * 60 * 1000);
  const body = request.body as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase();
  if (!email || !body.password) throw new ApiError("VALIDATION_ERROR", "Email and password are required.");
  const admins = await listDocuments<AdminRecord>("admins", [], 100);
  const admin = admins.items.find((item) => item.email.toLowerCase() === email);
  const valid = Boolean(admin && admin.enabled && await verifyPassword(body.password, process.env.PASSWORD_PEPPER || "", admin.passwordHash));
  if (!valid) { await audit("admin.login", "FAILURE", request.headers.get("x-request-id") || "unknown", undefined, "admin", email); throw new ApiError("AUTHENTICATION_REQUIRED", "Invalid credentials.", 401); }
  if (admin.nexoraState !== "ACTIVE" || !admin.nexoraSecretEncrypted) throw new ApiError("CONFIGURATION_REQUIRED", "NEXORA authentication is not active for this account.", 503);
  const result = await createAuthChallenge(admin.$id, admin.role);
  await audit("admin.login", "SUCCESS", request.headers.get("x-request-id") || "unknown", undefined, "admin", admin.$id);
  return json(200, { challengeRequired: true, expiresAt: result.challenge.expiresAt }, { "Set-Cookie": sessionCookie("ds_admin_challenge", result.cookie, 300) });
}

export async function verifyTotpLogin(request: HttpRequest): Promise<HttpResponse> {
  const challenge = await requireAuthChallenge(request.cookies.ds_admin_challenge);
  enforceRateLimit(`admin-totp:${challenge.adminId}`, 5, 5 * 60 * 1000);
  const token = (request.body as { token?: string }).token?.trim();
  if (!/^\d{6}$/.test(token || "")) throw new ApiError("VALIDATION_ERROR", "A six-digit authenticator code is required.");
  const admins = await listDocuments<AdminRecord>("admins", [], 100);
  const admin = admins.items.find((item) => item.$id === challenge.adminId);
  if (!admin || !admin.enabled || admin.nexoraState !== "ACTIVE" || !admin.nexoraSecretEncrypted) throw new ApiError("AUTHENTICATION_REQUIRED", "Authentication is unavailable.", 401);
  await updateAuthChallenge(challenge.challengeId, { attempts: challenge.attempts + 1 });
  const valid = await verifyTotp(decryptSecret(admin.nexoraSecretEncrypted), token);
  if (!valid) { await audit("admin.totp", "FAILURE", request.headers.get("x-request-id") || "unknown", undefined, "admin", admin.$id); throw new ApiError("AUTHENTICATION_REQUIRED", "Invalid authenticator code.", 401); }
  await updateAuthChallenge(challenge.challengeId, { usedAt: new Date().toISOString() });
  const result = await createSession(admin.$id, admin.role);
  await audit("admin.totp", "SUCCESS", request.headers.get("x-request-id") || "unknown", { ...result.session }, "admin", admin.$id);
  await audit("session.created", "SUCCESS", request.headers.get("x-request-id") || "unknown", result.session, "session", result.session.sessionId);
  return json(200, { authenticated: true, adminId: admin.$id, role: admin.role }, { "Set-Cookie": sessionCookie(process.env.SESSION_COOKIE_NAME || "ds_admin_session", result.cookie) });
}

export async function session(request: HttpRequest): Promise<HttpResponse> { const value = await requireSession(request.cookies[process.env.SESSION_COOKIE_NAME || "ds_admin_session"]); return json(200, value); }
export async function logout(request: HttpRequest): Promise<HttpResponse> { await revokeSession(request.cookies[process.env.SESSION_COOKIE_NAME || "ds_admin_session"]); return json(204, null, { "Set-Cookie": expiredCookie(process.env.SESSION_COOKIE_NAME || "ds_admin_session") }); }
