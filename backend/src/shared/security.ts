import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { generateSecret, verify as verifyTotpToken } from "otplib";

export function secureToken(bytes = 32): string { return randomBytes(bytes).toString("base64url"); }
export function sha256(value: string): string { return createHash("sha256").update(value).digest("hex"); }
export async function hashPassword(password: string, pepper: string): Promise<string> { return bcrypt.hash(`${password}${pepper}`, 12); }
export async function verifyPassword(password: string, pepper: string, digest: string): Promise<boolean> { return bcrypt.compare(`${password}${pepper}`, digest); }
export function generateTotpSecret(): string { return generateSecret(); }
export async function verifyTotp(secret: string, token: string, epochTolerance = 1): Promise<boolean> { return verifyTotpToken({ secret, token, epochTolerance }); }
function encryptionKey(): Buffer { const value = process.env.NEXORA_SECRET_ENCRYPTION_KEY?.trim(); if (!value) throw new Error("CONFIGURATION_REQUIRED: NEXORA_SECRET_ENCRYPTION_KEY"); const key = Buffer.from(value, "base64"); if (key.length !== 32) throw new Error("CONFIGURATION_REQUIRED: NEXORA_SECRET_ENCRYPTION_KEY"); return key; }
export function encryptSecret(value: string): string { const iv = randomBytes(12); const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv); const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]); return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${ciphertext.toString("base64url")}`; }
export function decryptSecret(value: string): string { const [ivValue, tagValue, ciphertextValue] = value.split("."); if (!ivValue || !tagValue || !ciphertextValue) throw new Error("Invalid encrypted secret"); const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivValue, "base64url")); decipher.setAuthTag(Buffer.from(tagValue, "base64url")); return Buffer.concat([decipher.update(Buffer.from(ciphertextValue, "base64url")), decipher.final()]).toString("utf8"); }
export function constantTimeEqual(left: string, right: string): boolean { const a = Buffer.from(left); const b = Buffer.from(right); return a.length === b.length && timingSafeEqual(a, b); }
export function validateUploadName(name: string): string { const normalized = name.normalize("NFKC"); if (!normalized || normalized.includes("\\") || normalized.includes("/") || normalized === "." || normalized === ".." || normalized.includes("\0")) throw new Error("Invalid filename"); return normalized.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 160); }
export function assertUpload(type: string, name: string, size: number): void { const allowed = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]); const extension = name.toLowerCase().split(".").pop(); if (!allowed.has(type) || !extension || !["pdf", "png", "jpg", "jpeg", "webp"].includes(extension) || size <= 0 || size > 5 * 1024 * 1024) throw new Error("Invalid upload"); }
