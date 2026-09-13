import type { AIError } from "./types";

const sensitivePattern = /\b(aadhaar|aadhar|pan number|otp|one[- ]time password|upi pin|atm pin|cvv|card number|bank password|bank login|password|authentication secret)\b/i;

export function detectSensitiveRequest(message: string): AIError | undefined {
  if (!sensitivePattern.test(message)) return undefined;
  return { code: "SENSITIVE_DATA", message: "Please do not share Aadhaar, PAN, OTP, password, PIN, CVV, card or bank credentials in chat. Enter sensitive information only in the secure DigiSeva form or official portal." };
}

export function sanitizeContext<T extends Record<string, unknown>>(context: T): Partial<T> {
  const blocked = /aadhaar|aadhar|pan|otp|password|pin|cvv|card|bank|credential|secret/i;
  return Object.fromEntries(Object.entries(context).filter(([key]) => !blocked.test(key))) as Partial<T>;
}
