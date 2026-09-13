export type AdminRole = "SUPER_ADMIN" | "OPERATIONS_ADMIN";
export type Permission = "applications.read" | "applications.edit" | "applications.status" | "customers.read" | "customers.reveal" | "documents.read" | "documents.verify" | "documents.reject" | "payments.read" | "payments.verify" | "payments.reject" | "support.manage" | "sla.manage" | "services.manage" | "fees.manage" | "sources.manage" | "admins.manage" | "roles.manage" | "nexora.manage" | "security.manage" | "settings.manage" | "audit.read" | "health.read";
export type PaymentStatus = "UNINITIATED" | "INITIATED" | "PENDING" | "SUCCESS" | "FAILED" | "EXPIRED" | "REFUNDED" | "DISPUTED" | "UNKNOWN";
export type ApplicationStatus = "SUBMITTED" | "DOCUMENTS_REVIEW" | "PAYMENT_PENDING" | "PROCESSING" | "COMPLETED" | "REJECTED" | "CANCELLED";
export interface AdminSession { adminId: string; sessionId: string; role: AdminRole; createdAt: string; expiresAt: string; authenticated: true; }
export interface AdminAuthChallenge { challengeId: string; adminId: string; role: AdminRole; createdAt: string; expiresAt: string; attempts: number; usedAt?: string; lastAcceptedStep?: number; }
export interface MoneyBreakdown { governmentFeePaise: number; digiSevaFeePaise: number; otherChargesPaise: number; totalPaise: number; currency: "INR"; }
