/**
 * DigiSeva In-Memory Data Store
 * ─────────────────────────────────────────────────────────────────────────────
 * Development fallback store only. State resets on page reload.
 * Production: replace repository operations with authenticated backend API calls.
 * This store intentionally contains no production persistence or authorization.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type AppStatus =
  | "Application Submitted"
  | "Documents Under Review"
  | "Documents Verified"
  | "Payment Pending"
  | "Payment Verified"
  | "Application Processing"
  | "Additional Info Required"
  | "Submitted to Department"
  | "Completed"
  | "Rejected"
  | "Cancelled"
  | "On Hold";

export type PaymentStatus =
  | "Pending"
  | "Payment Submitted"
  | "Payment Verified"
  | "Payment Rejected"
  | "Pay Later";

export type DocStatus = "uploaded" | "under_review" | "verified" | "rejected" | "reupload_required";

export interface TimelineEntry {
  action: string;
  date: string;
  by: "customer" | "admin";
}

export interface DocRecord {
  id: string;
  name: string;
  status: DocStatus;
  uploadedAt: string;
  fileSize?: string;
}

export interface AppRecord {
  id: string;
  serviceId: string;
  serviceName: string;
  category: string;
  customerName: string;
  customerMobile: string;
  customerEmail: string;
  dob?: string;
  address?: string;
  appliedAt: string;
  governmentFee: string;
  digiSevaFee: string;
  totalAmount: string;
  paymentOption: "pay_now" | "pay_later";
  paymentStatus: PaymentStatus;
  paymentRef?: string;
  status: AppStatus;
  timeline: TimelineEntry[];
  documents: DocRecord[];
  adminNotes: string;
  customerMessage?: string;
}

export interface AdminConfig {
  upiId: string;
  accountName: string;
  paymentInstructions: string;
  qrEnabled: boolean;
  qrDataUrl: string | null;
  authenticatorName: string;
}

export interface ServiceFeeOverride {
  governmentFee: string;
  digiSevaFee: string;
  enabled: boolean;
}

export interface ManagedService {
  id: string;
  title: string;
  badge: string;
  category: string;
  group: string;
  desc: string;
  fee: string;
  digiSevaFee?: string;
  time: string;
  popular: boolean;
  tags: string[];
  docs: string[];
  steps: Array<{ label: string; desc: string }>;
}

export interface ServiceManagementRecord {
  service: ManagedService;
  enabled: boolean;
  custom: boolean;
}

export interface AuditEntry {
  id: string;
  action: string;
  admin: string;
  appId: string;
  timestamp: string;
  details: string;
}

// ── Initial data ──────────────────────────────────────────────────────────────

let _adminConfig: AdminConfig = import.meta.env.DEV ? {
  upiId: "digiseva@upi",
  accountName: "DigiSeva Services Pvt Ltd",
  paymentInstructions:
    "Scan the QR code and pay the exact amount shown. Enter the UPI transaction reference below. Payment is verified by the DigiSeva team.",
  qrEnabled: true,
  qrDataUrl: null,
  authenticatorName: "NEXORA Authenticator",
} : {
  upiId: "",
  accountName: "",
  paymentInstructions: "Payment configuration will be supplied by the production backend.",
  qrEnabled: false,
  qrDataUrl: null,
  authenticatorName: "NEXORA Authenticator",
};

const ts = (d: string) => d;

let _applications: AppRecord[] = import.meta.env.DEV ? [
  {
    id: "DS-2026-000123",
    serviceId: "pan",
    serviceName: "PAN Card",
    category: "identity",
    customerName: "Rajesh Kumar",
    customerMobile: "9876543210",
    customerEmail: "rajesh@example.com",
    dob: "15 Mar 1988",
    address: "42, MG Road, Hyderabad - 500001",
    appliedAt: ts("01 Jul 2026, 10:30 AM"),
    governmentFee: "₹107",
    digiSevaFee: "₹50",
    totalAmount: "₹157",
    paymentOption: "pay_now",
    paymentStatus: "Payment Verified",
    paymentRef: "UPI789456123",
    status: "Completed",
    timeline: [
      { action: "Application submitted by customer", date: ts("01 Jul 2026, 10:30 AM"), by: "customer" },
      { action: "Documents verified by admin", date: ts("03 Jul 2026, 11:00 AM"), by: "admin" },
      { action: "Payment verified (UPI789456123)", date: ts("04 Jul 2026, 09:15 AM"), by: "admin" },
      { action: "Submitted to Income Tax Dept / NSDL", date: ts("06 Jul 2026, 02:00 PM"), by: "admin" },
      { action: "Application completed — PAN dispatched", date: ts("10 Jul 2026, 04:30 PM"), by: "admin" },
    ],
    documents: [
      { id: "d1", name: "Aadhaar Card", status: "verified", uploadedAt: "01 Jul 2026", fileSize: "245 KB" },
      { id: "d2", name: "Passport Photo", status: "verified", uploadedAt: "01 Jul 2026", fileSize: "89 KB" },
      { id: "d3", name: "Address Proof", status: "verified", uploadedAt: "01 Jul 2026", fileSize: "312 KB" },
    ],
    adminNotes: "All documents clear. PAN dispatched via India Post Speed Post (EE987654321IN).",
    customerMessage: "Your PAN card has been dispatched via India Post Speed Post. Tracking: EE987654321IN. Expected delivery: 7–10 working days.",
  },
  {
    id: "DS-2026-000124",
    serviceId: "driving",
    serviceName: "Driving Licence",
    category: "identity",
    customerName: "Priya Sharma",
    customerMobile: "9123456789",
    customerEmail: "priya@example.com",
    dob: "22 Jun 1995",
    address: "15, Jubilee Hills, Hyderabad - 500033",
    appliedAt: ts("05 Jul 2026, 02:15 PM"),
    governmentFee: "₹300",
    digiSevaFee: "₹75",
    totalAmount: "₹375",
    paymentOption: "pay_now",
    paymentStatus: "Payment Verified",
    paymentRef: "UPI456123789",
    status: "Application Processing",
    timeline: [
      { action: "Application submitted by customer", date: ts("05 Jul 2026, 02:15 PM"), by: "customer" },
      { action: "Documents verified by admin", date: ts("07 Jul 2026, 10:00 AM"), by: "admin" },
      { action: "Payment verified (UPI456123789)", date: ts("07 Jul 2026, 11:30 AM"), by: "admin" },
      { action: "File submitted to RTO Hyderabad West", date: ts("08 Jul 2026, 09:00 AM"), by: "admin" },
    ],
    documents: [
      { id: "d4", name: "Age Proof (Aadhaar)", status: "verified", uploadedAt: "05 Jul 2026", fileSize: "256 KB" },
      { id: "d5", name: "Address Proof", status: "verified", uploadedAt: "05 Jul 2026", fileSize: "198 KB" },
      { id: "d6", name: "Medical Certificate Form 1A", status: "verified", uploadedAt: "05 Jul 2026", fileSize: "421 KB" },
    ],
    adminNotes: "All clear. Submitted to RTO.",
    customerMessage: "Your application is being processed at RTO Hyderabad West. Driving test will be scheduled shortly.",
  },
  {
    id: "DS-2026-000125",
    serviceId: "voter",
    serviceName: "Voter ID / e-EPIC",
    category: "identity",
    customerName: "Suresh Reddy",
    customerMobile: "9988776655",
    customerEmail: "suresh@example.com",
    appliedAt: ts("08 Jul 2026, 11:45 AM"),
    governmentFee: "₹0",
    digiSevaFee: "₹30",
    totalAmount: "₹30",
    paymentOption: "pay_later",
    paymentStatus: "Pay Later",
    status: "Documents Under Review",
    timeline: [
      { action: "Application submitted by customer", date: ts("08 Jul 2026, 11:45 AM"), by: "customer" },
    ],
    documents: [
      { id: "d7", name: "Aadhaar Card", status: "under_review", uploadedAt: "08 Jul 2026", fileSize: "220 KB" },
      { id: "d8", name: "Passport Photo", status: "uploaded", uploadedAt: "08 Jul 2026", fileSize: "88 KB" },
      { id: "d9", name: "Address Proof", status: "under_review", uploadedAt: "08 Jul 2026", fileSize: "310 KB" },
    ],
    adminNotes: "Checking address consistency with Aadhaar.",
  },
  {
    id: "DS-2026-000126",
    serviceId: "passport",
    serviceName: "Passport",
    category: "identity",
    customerName: "Kavitha Nair",
    customerMobile: "8765432109",
    customerEmail: "kavitha@example.com",
    dob: "03 Sep 1985",
    address: "23, Gachibowli, Hyderabad - 500032",
    appliedAt: ts("10 Jul 2026, 09:00 AM"),
    governmentFee: "₹1,500",
    digiSevaFee: "₹150",
    totalAmount: "₹1,650",
    paymentOption: "pay_now",
    paymentStatus: "Payment Submitted",
    paymentRef: "UPI123987654",
    status: "Documents Under Review",
    timeline: [
      { action: "Application submitted by customer", date: ts("10 Jul 2026, 09:00 AM"), by: "customer" },
      { action: "UPI payment reference submitted", date: ts("10 Jul 2026, 09:15 AM"), by: "customer" },
    ],
    documents: [
      { id: "d10", name: "Aadhaar Card", status: "uploaded", uploadedAt: "10 Jul 2026", fileSize: "244 KB" },
      { id: "d11", name: "Birth Certificate", status: "uploaded", uploadedAt: "10 Jul 2026", fileSize: "390 KB" },
      { id: "d12", name: "Address Proof", status: "rejected", uploadedAt: "10 Jul 2026", fileSize: "267 KB" },
    ],
    adminNotes: "Address proof is expired (>90 days). Need re-upload. Payment ref pending verification.",
    customerMessage:
      "Please re-upload your address proof. The document submitted appears to be more than 90 days old. A recent utility bill or bank statement is required.",
  },
  {
    id: "DS-2026-000127",
    serviceId: "gst",
    serviceName: "GST Registration",
    category: "finance",
    customerName: "Anitha Enterprises",
    customerMobile: "9012345678",
    customerEmail: "anitha@example.com",
    address: "Unit 5, APIIC IT Park, Visakhapatnam - 530032",
    appliedAt: ts("12 Jul 2026, 03:30 PM"),
    governmentFee: "₹0",
    digiSevaFee: "₹499",
    totalAmount: "₹499",
    paymentOption: "pay_later",
    paymentStatus: "Pay Later",
    status: "Application Submitted",
    timeline: [
      { action: "Application submitted by customer", date: ts("12 Jul 2026, 03:30 PM"), by: "customer" },
    ],
    documents: [
      { id: "d13", name: "PAN Card", status: "uploaded", uploadedAt: "12 Jul 2026", fileSize: "178 KB" },
      { id: "d14", name: "Aadhaar Card", status: "uploaded", uploadedAt: "12 Jul 2026", fileSize: "244 KB" },
    ],
    adminNotes: "",
  },
] : [];

let _auditLog: AuditEntry[] = import.meta.env.DEV ? [
  { id: "al1", action: "Status Changed", admin: "Admin", appId: "DS-2026-000123", timestamp: "10 Jul 2026, 04:30 PM", details: "Application Processing → Completed" },
  { id: "al2", action: "Payment Verified", admin: "Admin", appId: "DS-2026-000123", timestamp: "04 Jul 2026, 09:15 AM", details: "Payment ref UPI789456123 verified" },
  { id: "al3", action: "Document Rejected", admin: "Admin", appId: "DS-2026-000126", timestamp: "10 Jul 2026, 10:30 AM", details: "Address Proof rejected — expired document (>90 days)" },
  { id: "al4", action: "Customer Message Sent", admin: "Admin", appId: "DS-2026-000126", timestamp: "10 Jul 2026, 10:35 AM", details: "Notified customer to re-upload address proof" },
] : [];

let _serviceFeeOverrides: Record<string, ServiceFeeOverride> = {};
let _managedServices: Record<string, ServiceManagementRecord> = {};
let _appCounter = 128;

function readServiceManagement(): Record<string, ServiceManagementRecord> {
  if (!import.meta.env.DEV) return {};
  try {
    return JSON.parse(localStorage.getItem("ds_service_management_v1") ?? "{}") as Record<string, ServiceManagementRecord>;
  } catch {
    return {};
  }
}

function persistServiceManagement(): void {
  if (import.meta.env.DEV) localStorage.setItem("ds_service_management_v1", JSON.stringify(_managedServices));
}

// ── Admin Config API ──────────────────────────────────────────────────────────

export function getAdminConfig(): AdminConfig {
  return { ..._adminConfig };
}

export function updateAdminConfig(updates: Partial<AdminConfig>): AdminConfig {
  _adminConfig = { ..._adminConfig, ...updates };
  return { ..._adminConfig };
}

// ── Applications API ──────────────────────────────────────────────────────────

export function getApplications(): AppRecord[] {
  return [..._applications];
}

export function getApplicationById(id: string, mobile?: string): AppRecord | null {
  const app = _applications.find((a) => a.id === id);
  if (!app) return null;
  if (mobile && mobile.trim() && app.customerMobile !== mobile.trim()) return null;
  return { ...app };
}

export function updateApplication(id: string, updates: Partial<AppRecord>): AppRecord | null {
  const idx = _applications.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  _applications[idx] = { ..._applications[idx], ...updates };
  return { ..._applications[idx] };
}

export function addTimelineEntry(id: string, entry: TimelineEntry): void {
  const idx = _applications.findIndex((a) => a.id === id);
  if (idx === -1) return;
  _applications[idx] = {
    ..._applications[idx],
    timeline: [..._applications[idx].timeline, entry],
  };
}

export function createApplication(data: Omit<AppRecord, "id" | "timeline" | "status" | "appliedAt">): AppRecord {
  const id = `DS-${new Date().getFullYear()}-${String(_appCounter++).padStart(6, "0")}`;
  const now = new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const app: AppRecord = {
    ...data,
    id,
    appliedAt: now,
    status: "Application Submitted",
    timeline: [{ action: "Application submitted by customer", date: now, by: "customer" }],
  };
  _applications = [app, ..._applications];
  return app;
}

// ── Service Fee Overrides ─────────────────────────────────────────────────────

export function getServiceFeeOverride(serviceId: string): ServiceFeeOverride | null {
  return _serviceFeeOverrides[serviceId] ?? null;
}

export function setServiceFeeOverride(serviceId: string, data: ServiceFeeOverride): void {
  _serviceFeeOverrides[serviceId] = data;
}

export function registerServiceCatalog(services: ManagedService[]): void {
  const saved = readServiceManagement();
  _managedServices = { ...saved };
  for (const service of services) {
    if (!_managedServices[service.id]) _managedServices[service.id] = { service, enabled: true, custom: false };
    else _managedServices[service.id] = { ..._managedServices[service.id], service };
  }
  persistServiceManagement();
}

export function getManagedServices(): ServiceManagementRecord[] {
  return Object.values(_managedServices);
}

export function setServiceEnabled(serviceId: string, enabled: boolean): void {
  const record = _managedServices[serviceId];
  if (!record) return;
  _managedServices[serviceId] = { ...record, enabled };
  persistServiceManagement();
}

export function addManagedService(service: ManagedService): void {
  _managedServices[service.id] = { service, enabled: true, custom: true };
  persistServiceManagement();
}

export function removeManagedService(serviceId: string): void {
  if (!_managedServices[serviceId]) return;
  if (_managedServices[serviceId].custom) delete _managedServices[serviceId];
  else _managedServices[serviceId] = { ..._managedServices[serviceId], enabled: false };
  persistServiceManagement();
}

// ── Audit Log ─────────────────────────────────────────────────────────────────

export function getAuditLog(): AuditEntry[] {
  return [..._auditLog];
}

export function addAuditEntry(entry: Omit<AuditEntry, "id">): void {
  _auditLog = [{ id: `al${Date.now()}`, ...entry }, ..._auditLog];
}

// Auth functions moved to src/lib/adminAuth.ts — use that module for all auth.
