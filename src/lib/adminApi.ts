const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "");

export type ApiState = "ok" | "configuration" | "unauthorized" | "forbidden" | "error";
export interface ApiResult<T> { state: ApiState; data?: T; message?: string; }

export async function adminRequest<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  if (!API_BASE_URL) return { state: "configuration", message: "CONFIGURATION_REQUIRED: Admin API is not configured." };
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, { ...init, credentials: "include", headers: { "Content-Type": "application/json", ...(init.headers || {}) } });
    const data = await response.json().catch(() => ({})) as T & { error?: string; message?: string };
    if (response.ok) return { state: "ok", data };
    if (response.status === 401) return { state: "unauthorized", message: data.message || data.error };
    if (response.status === 403) return { state: "forbidden", message: data.message || data.error };
    if (response.status === 503 && data.error === "CONFIGURATION_REQUIRED") return { state: "configuration", message: data.message || data.error };
    return { state: "error", message: data.message || data.error || "The admin API request failed." };
  } catch { return { state: "error", message: "The admin API is unavailable." }; }
}

export interface SecurityOverview { nexora: { state: string }; account: { enabled: boolean }; currentSession: { id: string; createdAt: string; expiresAt: string }; activeSessions: Array<{ id: string; createdAt: string; expiresAt: string; current: boolean }>; recoveryCodes: { remaining: number }; recentFailedLogins: Array<{ timestamp: string; resourceId: string; result: string }>; recentSecurityEvents: Array<{ id: string; action: string; result: string; timestamp: string; resourceType: string }>; }
export interface EnrollmentStatus { enrollmentId: string; state: string; expiresAt: string; }
export const securityApi = {
  overview: () => adminRequest<SecurityOverview>("/api/admin/security"),
  sessions: () => adminRequest<{ items: SecurityOverview["activeSessions"] }>("/api/admin/auth/sessions"),
  revokeCurrent: () => adminRequest<{ revoked: boolean }>("/api/admin/security/revoke-current", { method: "POST" }),
  revokeOthers: () => adminRequest<{ revoked: number }>("/api/admin/security/revoke-others", { method: "POST" }),
  audit: () => adminRequest<{ items: SecurityOverview["recentSecurityEvents"] }>("/api/admin/audit"),
  enrollment: (adminId?: string) => adminRequest<{ protocol: string; version: number; enrollmentId: string; expiresAt: string; nonce: string; token: string; tenant: string; callback: string }>("/api/admin/nexora/enrollments", { method: "POST", body: JSON.stringify({ adminId }) }),
  enrollmentStatus: (id: string) => adminRequest<EnrollmentStatus>(`/api/admin/nexora/enrollments/${encodeURIComponent(id)}`),
  verifyEnrollment: (id: string, token: string) => adminRequest<{ state: string; recoveryCodes?: string[] }>(`/api/admin/nexora/enrollments/${encodeURIComponent(id)}/verify`, { method: "POST", body: JSON.stringify({ token }) }),
  revokeNexora: (adminId?: string) => adminRequest<{ state: string }>("/api/admin/nexora/revoke", { method: "POST", body: JSON.stringify({ adminId }) }),
};

export interface AdminSummary { id: string; email: string; role: string; enabled: boolean; nexoraState: string; }
export const adminManagementApi = {
  list: () => adminRequest<{ items: AdminSummary[]; total: number }>("/api/admin/admins"),
  create: (body: { email: string; password: string; role: string }) => adminRequest<AdminSummary>("/api/admin/admins", { method: "POST", body: JSON.stringify(body) }),
  disable: (id: string) => adminRequest<AdminSummary>(`/api/admin/admins/${encodeURIComponent(id)}/disable`, { method: "POST" }),
  enable: (id: string) => adminRequest<AdminSummary>(`/api/admin/admins/${encodeURIComponent(id)}/enable`, { method: "POST" }),
};
