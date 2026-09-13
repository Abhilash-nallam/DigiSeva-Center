import { ApiError } from "../shared/errors.js";
import { audit } from "../shared/audit.js";
import { getDocument, listDocuments, Query, updateDocument } from "../shared/database.js";
import { loadConfig } from "../shared/config.js";
import { requireBackendPermission } from "../shared/rbac.js";
import { listSessions, requireSession, revokeOtherSessions, revokeSessionById } from "../shared/sessions.js";
import type { AdminSession } from "../shared/models.js";
import type { HttpRequest, HttpResponse } from "../shared/http.js";
import { json } from "../shared/http.js";

interface AdminRecord { $id: string; nexoraState: string; enabled: boolean; }
interface RecoveryCode { adminId: string; usedAt?: string; }
interface AuditRecord { $id: string; action: string; result: string; actorRef: string; actorRole: string; resourceType: string; resourceId: string; timestamp: string; metadata: Record<string, unknown>; }
function requestId(request: HttpRequest): string { return request.headers.get("x-request-id") || "unknown"; }
async function actor(request: HttpRequest): Promise<AdminSession> { return requireSession(request.cookies[loadConfig().sessionCookieName]); }

export async function securityOverview(request: HttpRequest): Promise<HttpResponse> {
  const session = await actor(request); await requireBackendPermission(session, "security.manage");
  const admin = await getDocument<AdminRecord>("admins", session.adminId); const sessions = await listSessions(session.adminId); const codes = await listDocuments<RecoveryCode>("admin_recovery_codes", [Query.equal("adminId", session.adminId)], 100); const events = await listDocuments<AuditRecord>("audit_logs", [Query.equal("actorRef", session.adminId)], 20);
  const failed = await listDocuments<AuditRecord>("audit_logs", [Query.equal("action", "admin.login"), Query.equal("result", "FAILURE")], 20);
  return json(200, { nexora: { state: admin.nexoraState }, account: { enabled: admin.enabled }, currentSession: { id: session.sessionId, createdAt: session.createdAt, expiresAt: session.expiresAt }, activeSessions: sessions.filter((item) => !item.revokedAt && Date.now() < Date.parse(item.expiresAt)).map((item) => ({ id: item.sessionId, createdAt: item.createdAt, expiresAt: item.expiresAt, current: item.sessionId === session.sessionId })), recoveryCodes: { remaining: codes.items.filter((item) => !item.usedAt).length }, recentFailedLogins: failed.items.map((item) => ({ timestamp: item.timestamp, resourceId: item.resourceId, result: item.result })), recentSecurityEvents: events.items.map((item) => ({ id: item.$id, action: item.action, result: item.result, timestamp: item.timestamp, resourceType: item.resourceType })) });
}

export async function auditEvents(request: HttpRequest): Promise<HttpResponse> { const session = await actor(request); await requireBackendPermission(session, "audit.read"); const events = await listDocuments<AuditRecord>("audit_logs", [], 100); return json(200, { items: events.items.map((item) => ({ id: item.$id, action: item.action, result: item.result, actorRef: item.actorRef, actorRole: item.actorRole, resourceType: item.resourceType, resourceId: item.resourceId, timestamp: item.timestamp, metadata: item.metadata })) }); }
export async function revokeCurrent(request: HttpRequest): Promise<HttpResponse> { const session = await actor(request); await revokeSessionById(session.adminId, session.sessionId); await audit("session.revoked", "SUCCESS", requestId(request), session, "session", session.sessionId); return json(200, { revoked: true }); }
export async function revokeOthers(request: HttpRequest): Promise<HttpResponse> { const session = await actor(request); const count = await revokeOtherSessions(session.adminId, session.sessionId); await audit("session.revoke_others", "SUCCESS", requestId(request), session, "admin", session.adminId); return json(200, { revoked: count }); }
