import { login, logout, session, verifyTotpLogin } from "./auth.js";
import { createEnrollment, callback, cancelEnrollment, getEnrollment, verifyEnrollment, revokeNexora, reEnrollNexora } from "./nexora.js";
import { createPayment, webhook } from "./payments.js";
import { createApplication, getApplication, track } from "./applications.js";
import { upload } from "./documents.js";
import { health } from "./health.js";
import { createAdmin, disableAdmin, enableAdmin, getAdmin, getRole, listAdmins, listAdminSessions, listRoles, patchAdmin, patchRolePermissions, recover, recoveryStatus, regenerateRecoveryCodes, revokeAdminSession, revokeAdminSessions, revokeOtherAdminSessions } from "./admin.js";
import { auditEvents, revokeCurrent, revokeOthers, securityOverview } from "./securityCenter.js";
import { handleError, json, parseJson, type HttpRequest, type HttpResponse, cookieValue } from "../shared/http.js";
import { loadConfig } from "../shared/config.js";

function requestFrom(input: { method: string; path: string; headers: Headers; bodyRaw?: string }): HttpRequest { const cookieHeader = input.headers.get("cookie") || ""; const cookies = Object.fromEntries(cookieHeader.split(";").map((part) => part.trim().split("=")).filter(([key, value]) => key && value)); return { method: input.method, path: input.path, headers: input.headers, rawBody: input.bodyRaw, body: parseJson(input.bodyRaw), cookies }; }

export async function route(request: HttpRequest): Promise<HttpResponse> {
  try {
    if (request.path === "/health" && request.method === "GET") return health();
    if (request.path === "/api/admin/auth/login" && request.method === "POST") return await login(request);
    if (request.path === "/api/admin/auth/verify-totp" && request.method === "POST") return await verifyTotpLogin(request);
    if (request.path === "/api/admin/auth/logout" && request.method === "POST") return await logout(request);
    if (request.path === "/api/admin/auth/session" && request.method === "GET") return await session(request);
    if (request.path === "/api/admin/auth/recovery" && request.method === "POST") return await recover(request);
    if (request.path === "/api/admin/auth/recovery/status" && request.method === "GET") return await recoveryStatus(request);
    if (request.path === "/api/admin/auth/recovery/regenerate" && request.method === "POST") return await regenerateRecoveryCodes(request);
    if (request.path === "/api/admin/auth/sessions" && request.method === "GET") return await listAdminSessions(request);
    if (request.path === "/api/admin/auth/sessions/revoke-others" && request.method === "POST") return await revokeOtherAdminSessions(request);
    if (request.path === "/api/admin/security" && request.method === "GET") return await securityOverview(request);
    if (request.path === "/api/admin/security/revoke-current" && request.method === "POST") return await revokeCurrent(request);
    if (request.path === "/api/admin/security/revoke-others" && request.method === "POST") return await revokeOthers(request);
    if (request.path === "/api/admin/audit" && request.method === "GET") return await auditEvents(request);
    const sessionRoute = request.path.match(/^\/api\/admin\/auth\/sessions\/([^/]+)\/revoke$/); if (sessionRoute && request.method === "POST") return await revokeAdminSession(request, decodeURIComponent(sessionRoute[1]));
    if (request.path === "/api/admin/admins" && request.method === "GET") return await listAdmins(request);
    if (request.path === "/api/admin/admins" && request.method === "POST") return await createAdmin(request);
    const adminRoute = request.path.match(/^\/api\/admin\/admins\/([^/]+)$/); if (adminRoute && request.method === "GET") return await getAdmin(request, decodeURIComponent(adminRoute[1])); if (adminRoute && request.method === "PATCH") return await patchAdmin(request, decodeURIComponent(adminRoute[1]));
    const adminAction = request.path.match(/^\/api\/admin\/admins\/([^/]+)\/(disable|enable|revoke-sessions)$/); if (adminAction && request.method === "POST") { const id = decodeURIComponent(adminAction[1]); if (adminAction[2] === "disable") return await disableAdmin(request, id); if (adminAction[2] === "enable") return await enableAdmin(request, id); return await revokeAdminSessions(request, id); }
    if (request.path === "/api/admin/roles" && request.method === "GET") return await listRoles(request);
    const roleRoute = request.path.match(/^\/api\/admin\/roles\/([^/]+)$/); if (roleRoute && request.method === "GET") return await getRole(request, decodeURIComponent(roleRoute[1]));
    const rolePermissions = request.path.match(/^\/api\/admin\/roles\/([^/]+)\/permissions$/); if (rolePermissions && request.method === "PATCH") return await patchRolePermissions(request, decodeURIComponent(rolePermissions[1]));
    if (request.path === "/api/admin/nexora/enrollments" && request.method === "POST") return await createEnrollment(request);
    if (request.path === "/api/admin/nexora/revoke" && request.method === "POST") return await revokeNexora(request);
    if (request.path === "/api/admin/nexora/re-enroll" && request.method === "POST") return await reEnrollNexora(request);
    if (request.path === "/api/admin/nexora/callback" && request.method === "POST") return await callback(request);
    const enrollment = request.path.match(/^\/api\/admin\/nexora\/enrollments\/([^/]+)$/);
    const enrollmentAction = request.path.match(/^\/api\/admin\/nexora\/enrollments\/([^/]+)\/(verify|cancel)$/);
    if (enrollment && request.method === "GET") return await getEnrollment(request, decodeURIComponent(enrollment[1]));
    if (enrollmentAction && request.method === "POST" && enrollmentAction[2] === "verify") return await verifyEnrollment(request, decodeURIComponent(enrollmentAction[1]));
    if (enrollmentAction && request.method === "POST" && enrollmentAction[2] === "cancel") return await cancelEnrollment(request, decodeURIComponent(enrollmentAction[1]));
    if (request.path === "/api/applications" && request.method === "POST") return await createApplication(request);
    const tracking = request.path.match(/^\/api\/applications\/([^/]+)\/tracking$/); if (tracking && request.method === "POST") return await track(request, decodeURIComponent(tracking[1]));
    const application = request.path.match(/^\/api\/applications\/([^/]+)$/); if (application && request.method === "POST") return await getApplication(request, decodeURIComponent(application[1]));
    if (request.path === "/api/payments" && request.method === "POST") return await createPayment(request);
    if (request.path.match(/^\/api\/payments\/webhooks\/[^/]+$/) && request.method === "POST") return await webhook(request);
    if (request.path === "/api/documents" && request.method === "POST") return await upload(request);
    return json(404, { error: "NOT_FOUND", message: "Route not found." });
  } catch (error) { return handleError(error); }
}

export default async function appwriteEntry({ req, res }: { req: { method: string; path: string; headers: Record<string, string>; bodyRaw?: string }; res: { status: (code: number) => { json: (body: unknown, headers?: Record<string, string>) => unknown } } }) {
  const headers = new Headers(req.headers); const response = await route(requestFrom({ method: req.method, path: req.path, headers, bodyRaw: req.bodyRaw })); return res.status(response.status).json(response.body, response.headers);
}
