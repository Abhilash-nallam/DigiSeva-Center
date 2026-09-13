export type AdminRole = "SUPER_ADMIN" | "OPERATIONS_ADMIN";

export type Permission =
  | "applications.read"
  | "customers.read"
  | "documents.read"
  | "documents.review"
  | "payments.read"
  | "payments.verify"
  | "services.manage"
  | "knowledge.manage"
  | "sources.manage"
  | "admins.manage"
  | "security.manage"
  | "settings.manage"
  | "audit.read"
  | "health.read";

export const ROLE_PERMISSIONS: Record<AdminRole, readonly Permission[]> = {
  SUPER_ADMIN: [
    "applications.read", "customers.read", "documents.read", "documents.review",
    "payments.read", "payments.verify", "services.manage", "knowledge.manage",
    "sources.manage", "admins.manage", "security.manage", "settings.manage",
    "audit.read", "health.read",
  ],
  OPERATIONS_ADMIN: [
    "applications.read", "customers.read", "documents.read", "documents.review",
    "payments.read", "payments.verify", "audit.read",
  ],
};

export interface AdminIdentity {
  id: string;
  email: string;
  role: AdminRole;
  enabled: boolean;
}

export interface MoneyBreakdown {
  governmentFeePaise: number;
  digiSevaFeePaise: number;
  otherChargesPaise: number;
  totalPaise: number;
  currency: "INR";
}

export type PaymentLifecycle = "UNINITIATED" | "INITIATED" | "PENDING" | "SUCCESS" | "FAILED" | "EXPIRED" | "REFUNDED" | "DISPUTED" | "UNKNOWN";

export interface PaymentRecord extends MoneyBreakdown {
  paymentId: string;
  applicationId: string;
  paymentMethod: "UPI";
  status: PaymentLifecycle;
  providerTransactionId?: string;
  providerReference?: string;
  initiatedAt: string;
  paidAt?: string;
  verifiedAt?: string;
  failureReason?: string;
  reconciliationStatus: PaymentLifecycle;
}

export interface BackendHealthStatus {
  database: "Healthy" | "Degraded" | "Unavailable";
  storage: "Healthy" | "Degraded" | "Unavailable";
  functions: "Healthy" | "Degraded" | "Unavailable";
  authentication: "Healthy" | "Degraded" | "Unavailable";
  nexora2fa: "Healthy" | "Degraded" | "Unavailable";
  email: "Healthy" | "Degraded" | "Unavailable";
  otp: "Healthy" | "Degraded" | "Unavailable";
  paymentProvider: "Healthy" | "Degraded" | "Unavailable";
  ai: "Healthy" | "Degraded" | "Unavailable";
  backups: "Healthy" | "Degraded" | "Unavailable";
}
