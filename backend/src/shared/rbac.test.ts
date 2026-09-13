import assert from "node:assert/strict";
import { can, requirePermission, requireSuperAdmin } from "./rbac.js";
import type { AdminSession } from "./models.js";

const superSession: AdminSession = { adminId: "super", sessionId: "s", role: "SUPER_ADMIN", createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 1000).toISOString(), authenticated: true };
const operationsSession: AdminSession = { ...superSession, adminId: "ops", role: "OPERATIONS_ADMIN" };
assert.equal(can("SUPER_ADMIN", "roles.manage"), true);
assert.equal(can("OPERATIONS_ADMIN", "roles.manage"), false);
assert.equal(can("OPERATIONS_ADMIN", "applications.read", new Set(["applications.read"])), true);
assert.throws(() => requirePermission(operationsSession, "roles.manage", new Set()), /permission/);
assert.equal(requireSuperAdmin(superSession).adminId, "super");
assert.throws(() => requireSuperAdmin(operationsSession), /Super Admin/);
console.log("RBAC authorization tests passed");