/**
 * DigiSeva — Admin Authentication Boundary
 * ─────────────────────────────────────────────────────────────────────────────
 * All admin auth logic flows through this module.
 * The UI never performs credential checks directly.
 *
 * PRODUCTION REQUIREMENTS (not yet implemented — needs backend):
 *   • POST /api/admin/auth/login  → returns httpOnly session cookie
 *   • POST /api/admin/auth/verify-totp  → validates real TOTP token
 *   • POST /api/admin/auth/logout  → clears server session
 *   • Passwords must be hashed (bcrypt/argon2) server-side
 *   • TOTP secret stored encrypted on server, never in frontend
 *   • Sessions managed via server-side store (Redis / DB)
 *   • Secure cookies + CSRF protection required
 *   • Rate limiting + brute-force protection on login endpoints
 *
 * The backend owns credentials, TOTP, and the session. The browser only sends
 * requests with credentials included so the HttpOnly cookie remains opaque.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface AuthResult {
  success: boolean;
  error?: string;
  adminId?: string;
  role?: "SUPER_ADMIN" | "OPERATIONS_ADMIN";
}

export interface AdminSession {
  adminId: string;
  expiresAt: number;
  role?: "SUPER_ADMIN" | "OPERATIONS_ADMIN";
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "");

async function requestAuth(path: string, body?: object, method = "POST"): Promise<AuthResult> {
  if (!API_BASE_URL) return { success: false, error: "Admin authentication backend is not configured." };
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json().catch(() => ({})) as { error?: string; message?: string };
    return { success: response.ok, error: data.message || data.error, adminId: (data as { adminId?: string }).adminId, role: (data as { role?: "SUPER_ADMIN" | "OPERATIONS_ADMIN" }).role };
  } catch {
    return { success: false, error: "Authentication service is unavailable." };
  }
}

async function _adapter_login(email: string, password: string): Promise<AuthResult> {
  if (!API_BASE_URL) return { success: false, error: "CONFIGURATION_REQUIRED: Admin authentication backend is not configured." };
  return requestAuth("/api/admin/auth/login", { email: email.trim(), password });
}

async function _adapter_verifyTotp(otp: string): Promise<AuthResult> {
  if (!API_BASE_URL) return { success: false, error: "CONFIGURATION_REQUIRED: Admin authentication backend is not configured." };
  return requestAuth("/api/admin/auth/verify-totp", { token: otp });
}

// ── Session management ────────────────────────────────────────────────────────
let authenticated = false;
let session: AdminSession | null = null;

export function getAdminSession(): AdminSession | null {
  return authenticated ? session : null;
}

export function saveAdminSession(adminId = "admin"): void {
  authenticated = true;
  session = { adminId, expiresAt: Date.now() + 8 * 60 * 60 * 1000 };
}

export async function restoreAdminSession(): Promise<AuthResult> {
  if (!API_BASE_URL) return { success: false, error: "CONFIGURATION_REQUIRED: Admin authentication backend is not configured." };
  const result = await requestAuth("/api/admin/auth/session", undefined, "GET");
  if (result.success) saveAdminSession(result.adminId || "admin");
  return result;
}

export function clearAdminSession(): void {
  authenticated = false;
  session = null;
  if (API_BASE_URL) void requestAuth("/api/admin/auth/logout");
}

export function isAdminAuthenticated(): boolean {
  return getAdminSession() !== null;
}

// ── Public API ────────────────────────────────────────────────────────────────

export const adminAuth = {
  login: _adapter_login,
  verifyTotp: _adapter_verifyTotp,
  getSession: getAdminSession,
  saveSession: saveAdminSession,
  restoreSession: restoreAdminSession,
  clearSession: clearAdminSession,
  isAuthenticated: isAdminAuthenticated,
};
