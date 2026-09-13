import { createHmac } from "node:crypto";
import { ApiError } from "./errors.js";
import { createDocument, getDocument, Query, listDocuments, updateDocument } from "./database.js";
import { loadConfig } from "./config.js";
import { secureToken } from "./security.js";
import type { AdminAuthChallenge, AdminRole, AdminSession } from "./models.js";

interface SessionRecord { sessionId: string; adminId: string; role: AdminRole; createdAt: string; expiresAt: string; revokedAt?: string; }
interface AdminStatus { $id: string; enabled: boolean; role: AdminRole; }
const CHALLENGE_COLLECTION = "admin_auth_challenges";

function collection(): string { return process.env.APPWRITE_ADMIN_SESSIONS_COLLECTION_ID?.trim() || "admin_sessions"; }
function sign(value: string): string { return createHmac("sha256", loadConfig().sessionSigningSecret).update(value).digest("base64url"); }
function encode(sessionId: string): string { return `${sessionId}.${sign(sessionId)}`; }
function decode(cookie: string): string { const [id, signature] = cookie.split("."); if (!id || !signature || sign(id) !== signature) throw new ApiError("AUTHENTICATION_REQUIRED", "Authentication is required.", 401); return id; }

export async function createSession(adminId: string, role: AdminRole): Promise<{ session: AdminSession; cookie: string }> {
  const now = Date.now();
  const record: SessionRecord = { sessionId: secureToken(24), adminId, role, createdAt: new Date(now).toISOString(), expiresAt: new Date(now + 8 * 60 * 60 * 1000).toISOString() };
  await createDocument(collection(), record as unknown as Record<string, unknown>, record.sessionId);
  return { session: { ...record, authenticated: true }, cookie: encode(record.sessionId) };
}

export async function createAuthChallenge(adminId: string, role: AdminRole): Promise<{ challenge: AdminAuthChallenge; cookie: string }> {
  const now = Date.now();
  const challenge: AdminAuthChallenge = { challengeId: secureToken(24), adminId, role, createdAt: new Date(now).toISOString(), expiresAt: new Date(now + 5 * 60 * 1000).toISOString(), attempts: 0 };
  await createDocument(CHALLENGE_COLLECTION, challenge as unknown as Record<string, unknown>, challenge.challengeId);
  return { challenge, cookie: encode(challenge.challengeId) };
}

export async function requireAuthChallenge(cookie: string | undefined): Promise<AdminAuthChallenge> {
  if (!cookie) throw new ApiError("AUTHENTICATION_REQUIRED", "Authentication challenge is required.", 401);
  const challenge = await getDocument<AdminAuthChallenge>(CHALLENGE_COLLECTION, decode(cookie));
  if (challenge.usedAt || Date.now() >= Date.parse(challenge.expiresAt)) throw new ApiError("AUTHENTICATION_REQUIRED", "Authentication challenge expired.", 401);
  if (challenge.attempts >= 5) throw new ApiError("RATE_LIMITED", "Too many authentication attempts.", 429);
  return challenge;
}

export async function updateAuthChallenge(challengeId: string, data: Partial<AdminAuthChallenge>): Promise<void> { const { updateDocument } = await import("./database.js"); await updateDocument<AdminAuthChallenge>(CHALLENGE_COLLECTION, challengeId, data); }

export async function requireSession(cookie: string | undefined): Promise<AdminSession> {
  if (!cookie) throw new ApiError("AUTHENTICATION_REQUIRED", "Authentication is required.", 401);
  const record = await getDocument<SessionRecord>(collection(), decode(cookie));
  if (record.revokedAt || Date.now() >= Date.parse(record.expiresAt)) throw new ApiError("AUTHENTICATION_REQUIRED", "Session expired.", 401);
  const admin = await getDocument<AdminStatus>("admins", record.adminId);
  if (!admin.enabled) throw new ApiError("AUTHENTICATION_REQUIRED", "Admin account is disabled.", 401);
  return { adminId: record.adminId, sessionId: record.sessionId, role: record.role, createdAt: record.createdAt, expiresAt: record.expiresAt, authenticated: true };
}

export async function revokeSession(cookie: string | undefined): Promise<void> {
  if (!cookie) return;
  const id = decode(cookie);
  await import("./database.js").then(({ updateDocument }) => updateDocument<SessionRecord>(collection(), id, { revokedAt: new Date().toISOString() }));
}

export async function listSessions(adminId: string): Promise<Array<SessionRecord & { $id: string }>> {
  const result = await listDocuments<SessionRecord>(collection(), [Query.equal("adminId", adminId)], 100);
  return result.items;
}

export async function revokeSessionById(adminId: string, sessionId: string): Promise<void> {
  const record = await getDocument<SessionRecord>(collection(), sessionId);
  if (record.adminId !== adminId) throw new ApiError("FORBIDDEN", "Session is outside your scope.", 403);
  await updateDocument<SessionRecord>(collection(), sessionId, { revokedAt: new Date().toISOString() });
}

export async function revokeOtherSessions(adminId: string, currentSessionId: string): Promise<number> {
  const sessions = await listSessions(adminId);
  const active = sessions.filter((item) => item.sessionId !== currentSessionId && !item.revokedAt && Date.now() < Date.parse(item.expiresAt));
  await Promise.all(active.map((item) => updateDocument<SessionRecord>(collection(), item.sessionId, { revokedAt: new Date().toISOString() })));
  return active.length;
}

export async function hasPermission(adminId: string, permission: string): Promise<boolean> {
  const admin = await getDocument<AdminStatus>("admins", adminId);
  if (!admin.enabled) return false;
  const result = await listDocuments<{ permission: string; enabled: boolean }>("admin_permissions", [Query.equal("roleRef", admin.role), Query.equal("permission", permission), Query.equal("enabled", true)], 1);
  return result.items.length > 0;
}
