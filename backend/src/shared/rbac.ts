import { ApiError } from "./errors.js";
import { hasPermission } from "./sessions.js";
import type { AdminRole, AdminSession, Permission } from "./models.js";

const superAdmin = new Set<Permission>([
  "applications.read", "applications.edit", "applications.status", "customers.read", "customers.reveal", "documents.read", "documents.verify", "documents.reject", "payments.read", "payments.verify", "payments.reject", "support.manage", "sla.manage", "services.manage", "fees.manage", "sources.manage", "admins.manage", "roles.manage", "nexora.manage", "security.manage", "settings.manage", "audit.read", "health.read",
]);

export function can(role: AdminRole, permission: Permission, configured: ReadonlySet<Permission> = new Set()): boolean {
  return role === "SUPER_ADMIN" ? superAdmin.has(permission) : configured.has(permission);
}

export function requirePermission(session: AdminSession | null, permission: Permission, configured?: ReadonlySet<Permission>): AdminSession {
  if (!session?.authenticated) throw new ApiError("AUTHENTICATION_REQUIRED", "Authentication is required.", 401);
  if (!can(session.role, permission, configured)) throw new ApiError("FORBIDDEN", "You do not have permission for this action.", 403);
  return session;
}

export async function requireBackendPermission(session: AdminSession | null, permission: Permission): Promise<AdminSession> {
  if (!session?.authenticated) throw new ApiError("AUTHENTICATION_REQUIRED", "Authentication is required.", 401);
  if (session.role === "SUPER_ADMIN") return requirePermission(session, permission);
  if (!(await hasPermission(session.adminId, permission))) throw new ApiError("FORBIDDEN", "You do not have permission for this action.", 403);
  return session;
}

export function requireSuperAdmin(session: AdminSession | null): AdminSession {
  if (!session?.authenticated) throw new ApiError("AUTHENTICATION_REQUIRED", "Authentication is required.", 401);
  if (session.role !== "SUPER_ADMIN") throw new ApiError("FORBIDDEN", "Only a Super Admin can perform this action.", 403);
  return session;
}
