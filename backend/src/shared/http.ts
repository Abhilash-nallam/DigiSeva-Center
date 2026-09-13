import { randomUUID } from "node:crypto";
import { ApiError, safeError } from "./errors.js";

export interface HttpRequest { method: string; path: string; headers: Headers; body?: unknown; rawBody?: string; cookies: Record<string, string>; }
export interface HttpResponse { status: number; headers?: Record<string, string>; body: unknown; }

export function json(status: number, body: unknown, headers: Record<string, string> = {}): HttpResponse { return { status, headers: { "Content-Type": "application/json", "X-Request-Id": randomUUID(), ...headers }, body }; }
export function parseJson(raw: string | undefined): unknown { if (!raw) return {}; try { return JSON.parse(raw); } catch { throw new ApiError("VALIDATION_ERROR", "Invalid JSON request.", 400); } }
export function handleError(error: unknown): HttpResponse { const result = safeError(error); return json(error instanceof ApiError ? error.status : 500, result); }
export function cookieValue(header: string | undefined, name: string): string | undefined { return header?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1); }
export function sessionCookie(name: string, value: string, maxAge = 28800): string { return `${name}=${value}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=Lax`; }
export function expiredCookie(name: string): string { return `${name}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`; }
