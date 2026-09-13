import { ApiError } from "../shared/errors.js";
import { audit } from "../shared/audit.js";
import { createDocument, getDocument, listDocuments, Query, updateDocument } from "../shared/database.js";
import { loadConfig } from "../shared/config.js";
import { requireBackendPermission, requireSuperAdmin } from "../shared/rbac.js";
import { createAuthChallenge, createSession, listSessions, requireSession, revokeOtherSessions, revokeSessionById } from "../shared/sessions.js";
import { enforceRateLimit } from "../shared/rateLimit.js";
import { hashPassword, secureToken, verifyPassword } from "../shared/security.js";
import type { AdminRole, AdminSession, Permission } from "../shared/models.js";
import type { HttpRequest, HttpResponse } from "../shared/http.js";
import { json, sessionCookie } from "../shared/http.js";

interface AdminRecord { $id: string; email: string; passwordHash: string; role: AdminRole; enabled: boolean; nexoraState: string; createdAt?: string; lastLoginAt?: string; }
interface RecoveryCode { $id: string; adminId: string; codeHash: string; createdAt: string; usedAt?: string; }
const permissions: Permission[] = ["applications.read", "applications.edit", "applications.status", "customers.read", "customers.reveal", "documents.read", "documents.verify", "documents.reject", "payments.read", "payments.verify", "payments.reject", "support.manage", "sla.manage", "services.manage", "fees.manage", "sources.manage", "admins.manage", "roles.manage", "nexora.manage", "security.manage", "settings.manage", "audit.read", "health.read"];
function requestId(request: HttpRequest): string { return request.headers.get("x-request-id") || "unknown"; }
function cookieName(): string { return loadConfig().sessionCookieName; }
function clean(admin: AdminRecord): Record<string, unknown> { return { id: admin.$id, email: admin.email, role: admin.role, enabled: admin.enabled, nexoraState: admin.nexoraState, createdAt: admin.createdAt, lastLoginAt: admin.lastLoginAt }; }
async function actor(request: HttpRequest): Promise<AdminSession> { return requireSession(request.cookies[cookieName()]); }

export async function listAdmins(request: HttpRequest): Promise<HttpResponse> {
  const session = await actor(request); await requireBackendPermission(session, "admins.manage");
  const admins = await listDocuments<AdminRecord>("admins", [], 100);
  return json(200, { items: admins.items.map(clean), total: admins.total });
}

export async function getAdmin(request: HttpRequest, adminId: string): Promise<HttpResponse> {
  const session = await actor(request); await requireBackendPermission(session, "admins.manage");
  return json(200, clean(await getDocument<AdminRecord>("admins", adminId)));
}

export async function createAdmin(request: HttpRequest): Promise<HttpResponse> {
  const session = await actor(request); requireSuperAdmin(session);
  const body = request.body as { email?: string; password?: string; role?: AdminRole };
  const email = body.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !body.password || body.password.length < 12 || !body.role) throw new ApiError("VALIDATION_ERROR", "Valid email, role, and a 12-character password are required.");
  if (!["SUPER_ADMIN", "OPERATIONS_ADMIN"].includes(body.role)) throw new ApiError("VALIDATION_ERROR", "Unsupported admin role.");
  const existing = await listDocuments<AdminRecord>("admins", [Query.equal("email", email)], 1);
  if (existing.items.length) throw new ApiError("VALIDATION_ERROR", "An admin with this email already exists.", 409);
  const admin = await createDocument("admins", { email, passwordHash: await hashPassword(body.password, process.env.PASSWORD_PEPPER || ""), role: body.role, enabled: true, nexoraState: "NOT_ENROLLED", createdAt: new Date().toISOString() });
  await audit("admin.created", "SUCCESS", requestId(request), session, "admin", admin.$id, { role: body.role });
  return json(201, clean(admin as unknown as AdminRecord));
}

export async function patchAdmin(request: HttpRequest, adminId: string): Promise<HttpResponse> {
  const session = await actor(request); requireSuperAdmin(session);
  const target = await getDocument<AdminRecord>("admins", adminId); const body = request.body as { role?: AdminRole; password?: string };
  if (target.role === "SUPER_ADMIN" && target.$id !== session.adminId && body.role === "OPERATIONS_ADMIN") throw new ApiError("FORBIDDEN", "Super Admin authority cannot be reduced by another account.", 403);
  if (body.role && !["SUPER_ADMIN", "OPERATIONS_ADMIN"].includes(body.role)) throw new ApiError("VALIDATION_ERROR", "Unsupported admin role.");
  if (body.password !== undefined && body.password.length < 12) throw new ApiError("VALIDATION_ERROR", "Password must contain at least 12 characters.");
  const update: Partial<AdminRecord> = {}; if (body.role) update.role = body.role; if (body.password) update.passwordHash = await hashPassword(body.password, process.env.PASSWORD_PEPPER || "");
  const changed = await updateDocument<AdminRecord>("admins", adminId, update); await audit("admin.updated", "SUCCESS", requestId(request), session, "admin", adminId, { roleChanged: Boolean(body.role), passwordChanged: Boolean(body.password) });
  return json(200, clean(changed));
}

async function setEnabled(request: HttpRequest, adminId: string, enabled: boolean): Promise<HttpResponse> {
  const session = await actor(request); requireSuperAdmin(session); if (adminId === session.adminId && !enabled) throw new ApiError("VALIDATION_ERROR", "You cannot disable your current account.");
  const changed = await updateDocument<AdminRecord>("admins", adminId, { enabled });
  await audit(`admin.${enabled ? "enabled" : "disabled"}`, "SUCCESS", requestId(request), session, "admin", adminId);
  return json(200, clean(changed));
}
export async function disableAdmin(request: HttpRequest, adminId: string): Promise<HttpResponse> { return setEnabled(request, adminId, false); }
export async function enableAdmin(request: HttpRequest, adminId: string): Promise<HttpResponse> { return setEnabled(request, adminId, true); }

export async function revokeAdminSessions(request: HttpRequest, adminId: string): Promise<HttpResponse> {
  const session = await actor(request); requireSuperAdmin(session); const sessions = await listSessions(adminId); await Promise.all(sessions.filter((item) => !item.revokedAt).map((item) => revokeSessionById(adminId, item.sessionId)));
  await audit("session.revoke_all", "SUCCESS", requestId(request), session, "admin", adminId); return json(200, { revoked: sessions.length });
}

export async function listRoles(request: HttpRequest): Promise<HttpResponse> { const session = await actor(request); requireSuperAdmin(session); const roles = await listDocuments<{ $id: string; name: string; description: string; enabled: boolean }>("admin_roles", [], 100); return json(200, { items: roles.items }); }
export async function getRole(request: HttpRequest, roleId: string): Promise<HttpResponse> { const session = await actor(request); requireSuperAdmin(session); const role = await getDocument<{ $id: string; name: string; description: string; enabled: boolean }>("admin_roles", roleId); const permissionsResult = await listDocuments<{ permission: Permission; enabled: boolean }>("admin_permissions", [Query.equal("roleRef", role.name)], 100); return json(200, { ...role, permissions: permissionsResult.items }); }
export async function patchRolePermissions(request: HttpRequest, roleId: string): Promise<HttpResponse> {
  const session = await actor(request); requireSuperAdmin(session); const role = await getDocument<{ $id: string; name: string }>("admin_roles", roleId); if (role.name !== "OPERATIONS_ADMIN") throw new ApiError("FORBIDDEN", "Only Operations Admin permissions are configurable.", 403);
  const requested = (request.body as { permissions?: Array<{ permission: Permission; enabled: boolean }> }).permissions;
  if (!Array.isArray(requested) || requested.some((item) => !permissions.includes(item.permission))) throw new ApiError("VALIDATION_ERROR", "Invalid permission set.");
  for (const permission of requested) { const existing = await listDocuments<{ $id: string }>("admin_permissions", [Query.equal("roleRef", role.name), Query.equal("permission", permission.permission)], 1); if (existing.items[0]) await updateDocument("admin_permissions", existing.items[0].$id, { enabled: permission.enabled, updatedBy: session.adminId, updatedAt: new Date().toISOString() }); else await createDocument("admin_permissions", { roleRef: role.name, permission: permission.permission, enabled: permission.enabled, updatedBy: session.adminId, updatedAt: new Date().toISOString() }); }
  await audit("role.permissions.updated", "SUCCESS", requestId(request), session, "admin_role", roleId, { count: requested.length }); return json(200, { updated: true });
}

export async function listAdminSessions(request: HttpRequest): Promise<HttpResponse> { const session = await actor(request); const sessions = await listSessions(session.adminId); return json(200, { items: sessions.map((item) => ({ id: item.sessionId, createdAt: item.createdAt, expiresAt: item.expiresAt, current: item.sessionId === session.sessionId, revoked: Boolean(item.revokedAt) })) }); }
export async function revokeAdminSession(request: HttpRequest, sessionId: string): Promise<HttpResponse> { const session = await actor(request); await revokeSessionById(session.adminId, sessionId); await audit("session.revoked", "SUCCESS", requestId(request), session, "session", sessionId); return json(200, { revoked: true }); }
export async function revokeOtherAdminSessions(request: HttpRequest): Promise<HttpResponse> { const session = await actor(request); const count = await revokeOtherSessions(session.adminId, session.sessionId); await audit("session.revoke_others", "SUCCESS", requestId(request), session, "admin", session.adminId); return json(200, { revoked: count }); }

export async function recover(request: HttpRequest): Promise<HttpResponse> {
  const body = request.body as { email?: string; code?: string }; const email = body.email?.trim().toLowerCase(); const code = body.code?.trim(); if (!email || !code) throw new ApiError("VALIDATION_ERROR", "Email and recovery code are required.");
  enforceRateLimit(`admin-recovery:${request.headers.get("x-forwarded-for") || "unknown"}`, 5, 15 * 60 * 1000);
  const admins = await listDocuments<AdminRecord>("admins", [Query.equal("email", email), Query.equal("enabled", true)], 1); const admin = admins.items[0]; if (!admin) throw new ApiError("AUTHENTICATION_REQUIRED", "Invalid recovery credentials.", 401);
  const codes = await listDocuments<RecoveryCode>("admin_recovery_codes", [Query.equal("adminId", admin.$id)], 100); const unused = codes.items.filter((item) => !item.usedAt); let matched: RecoveryCode | undefined;
  for (const candidate of unused) { if (await verifyPassword(code, process.env.PASSWORD_PEPPER || "", candidate.codeHash)) { matched = candidate; break; } }
  if (!matched) { await audit("recovery_code.use", "FAILURE", requestId(request), undefined, "admin", admin.$id); throw new ApiError("AUTHENTICATION_REQUIRED", "Invalid recovery credentials.", 401); }
  await updateDocument<RecoveryCode>("admin_recovery_codes", matched.$id, { usedAt: new Date().toISOString() }); const result = await createSession(admin.$id, admin.role); await audit("recovery_code.use", "SUCCESS", requestId(request), undefined, "admin", admin.$id); return json(200, { authenticated: true, adminId: admin.$id, role: admin.role }, { "Set-Cookie": sessionCookie(cookieName(), result.cookie) });
}

export async function recoveryStatus(request: HttpRequest): Promise<HttpResponse> { const session = await actor(request); const codes = await listDocuments<RecoveryCode>("admin_recovery_codes", [Query.equal("adminId", session.adminId)], 100); return json(200, { remaining: codes.items.filter((item) => !item.usedAt).length }); }

export async function regenerateRecoveryCodes(request: HttpRequest): Promise<HttpResponse> {
  const session = await actor(request);
  const body = request.body as { password?: string; adminId?: string };
  const targetAdmin = body.adminId || session.adminId;
  if (targetAdmin !== session.adminId && session.role !== "SUPER_ADMIN") throw new ApiError("FORBIDDEN", "You do not have access to regenerate these recovery codes.", 403);
  const admin = await getDocument<AdminRecord>("admins", targetAdmin);
  if (!admin.enabled) throw new ApiError("AUTHENTICATION_REQUIRED", "Admin account is disabled.", 401);
  if (!body.password || !(await verifyPassword(body.password, process.env.PASSWORD_PEPPER || "", admin.passwordHash))) {
    await audit("recovery_code.regenerate", "FAILURE", requestId(request), session, "admin", targetAdmin);
    throw new ApiError("AUTHENTICATION_REQUIRED", "Re-authentication failed.", 401);
  }
  const codes = await listDocuments<RecoveryCode>("admin_recovery_codes", [Query.equal("adminId", targetAdmin)], 100);
  await Promise.all(codes.items.map((code) => updateDocument<RecoveryCode>("admin_recovery_codes", code.$id, { usedAt: new Date().toISOString() })));
  const recoveryCodes = Array.from({ length: 8 }, () => `${secureToken(6)}-${secureToken(6)}`.toUpperCase());
 110  await Promise.all(
111    recoveryCodes.map(async (code) =>
112      createDocument("admin_recovery_codes", {
113        adminId: targetAdmin,
114        codeHash: await hashPassword(code, process.env.PASSWORD_PEPPER || ""),
115        createdAt: new Date().toISOString(),
116      }),
117    ),
118  );
