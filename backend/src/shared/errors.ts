export type ErrorCode = "AUTHENTICATION_REQUIRED" | "FORBIDDEN" | "NOT_FOUND" | "VALIDATION_ERROR" | "RATE_LIMITED" | "CONFIGURATION_REQUIRED" | "SERVICE_UNAVAILABLE" | "PAYMENT_PENDING" | "PAYMENT_FAILED";

export class ApiError extends Error {
  constructor(public readonly code: ErrorCode, message: string, public readonly status = 400) {
    super(message);
    this.name = "ApiError";
  }
}

export function safeError(error: unknown): { error: ErrorCode | "INTERNAL_ERROR"; message: string } {
  if (error instanceof ApiError) return { error: error.code, message: error.message };
  return { error: "INTERNAL_ERROR", message: "The service could not complete this request." };
}
