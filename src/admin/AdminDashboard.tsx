/**
 * DigiSeva — Admin Dashboard
 * ─────────────────────────────────────────────────────────────────────────────
 * Production requirements:
 *   • Auth: connect adminAuth.ts adapters to real backend API
 *   • Data: replace store.ts with real database via API
 *   • Sessions: use HttpOnly cookies managed by the backend
 *   • Documents: connect to private object storage (S3-compatible)
 *   • Routes: integrate with react-router or equivalent
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useCallback } from "react";
import QRCode from "qrcode";
import {
  LayoutDashboard, FileText, Settings, LogOut, QrCode, Eye,
  Check, X, AlertCircle, Clock, Search, RefreshCw, ChevronLeft,
  Building, CreditCard, Shield, Users, Download, Activity,
  CheckCircle, ShieldCheck, Pencil, Save, FileCheck, TrendingUp,
  KeyRound, Smartphone, ArrowLeft, Bell, ChevronDown, ChevronRight, Info,
  ArrowUpRight, Plus, Trash2, CalendarDays,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import {
  getApplications, getAdminConfig, updateAdminConfig, updateApplication,
  addTimelineEntry, addAuditEntry, getAuditLog, getServiceFeeOverride, setServiceFeeOverride,
  getManagedServices, setServiceEnabled, addManagedService, removeManagedService,
  type AppRecord, type AppStatus, type DocStatus, type AdminConfig, type AuditEntry, type ManagedService,
} from "../data/store";
import { adminAuth } from "../lib/adminAuth";
import { adminManagementApi, securityApi, type AdminSummary, type SecurityOverview } from "../lib/adminApi";

// ── Design tokens ─────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  "Application Submitted":    "bg-blue-100 text-blue-800",
  "Documents Under Review":   "bg-amber-100 text-amber-800",
  "Documents Verified":       "bg-sky-100 text-sky-800",
  "Payment Pending":          "bg-orange-100 text-orange-800",
  "Payment Verified":         "bg-teal-100 text-teal-800",
  "Application Processing":   "bg-purple-100 text-purple-800",
  "Additional Info Required": "bg-rose-100 text-rose-800",
  "Submitted to Department":  "bg-indigo-100 text-indigo-800",
  "Completed":                "bg-green-100 text-green-800",
  "Rejected":                 "bg-red-100 text-red-800",
  "Cancelled":                "bg-slate-100 text-slate-700",
  "On Hold":                  "bg-gray-100 text-gray-700",
};

const PAY_COLOR: Record<string, string> = {
  "Pending":           "bg-gray-100 text-gray-700",
  "Payment Submitted": "bg-amber-100 text-amber-800",
  "Payment Verified":  "bg-green-100 text-green-800",
  "Payment Rejected":  "bg-red-100 text-red-800",
  "Pay Later":         "bg-orange-100 text-orange-800",
};

const DOC_COLOR: Record<string, string> = {
  uploaded:          "bg-blue-50 text-blue-700 border-blue-200",
  under_review:      "bg-amber-50 text-amber-700 border-amber-200",
  verified:          "bg-green-50 text-green-700 border-green-200",
  rejected:          "bg-red-50 text-red-700 border-red-200",
  reupload_required: "bg-rose-50 text-rose-700 border-rose-200",
};

const CHART_COLORS = ["#2563EB","#10B981","#F59E0B","#8B5CF6","#EF4444","#64748B","#06B6D4","#EC4899"];

function parseAppDate(value: string): Date | null {
  const match = value.match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4}),\s+(\d{1,2}):(\d{2})\s+(AM|PM)/i);
  if (!match) return null;
  const [, day, month, year, hour, minute, meridiem] = match;
  const date = new Date(`${day} ${month} ${year} ${hour}:${minute} ${meridiem}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

type Section = "dashboard" | "applications" | "documents" | "payments" | "services" | "customers" | "qr" | "logs" | "security" | "settings" | "admins" | "nexora";

// ── Shared components ─────────────────────────────────────────────────────────
function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${className}`}>{children}</span>;
}

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Sora', sans-serif" }}>{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string | number; sub?: string; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/70">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}><Icon size={16} /></div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

function EmptyState({ icon: Icon, title, body }: { icon: React.ElementType; title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4"><Icon size={22} className="text-slate-400" /></div>
      <p className="font-bold text-slate-700 mb-1">{title}</p>
      <p className="text-sm text-slate-400 max-w-xs">{body}</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function AdminDashboard({ onExit }: { onExit: () => void }) {
  const [authStep, setAuthStep] = useState<"credentials" | "otp" | "authenticated">(() =>
    adminAuth.isAuthenticated() ? "authenticated" : "credentials"
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [section, setSection] = useState<Section>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [applications, setApplications] = useState<AppRecord[]>([]);
  const [selectedApp, setSelectedApp] = useState<AppRecord | null>(null);
  const [appSearch, setAppSearch] = useState("");
  const [appStatusFilter, setAppStatusFilter] = useState("all");
  const [appPayFilter, setAppPayFilter] = useState("all");
  const [adminConfig, setAdminConfig] = useState<AdminConfig>(getAdminConfig());
  const [configDraft, setConfigDraft] = useState<AdminConfig>(getAdminConfig());
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [editingNotes, setEditingNotes] = useState(false);
  const [draftNotes, setDraftNotes] = useState("");
  const [draftMsg, setDraftMsg] = useState("");
  const [draftStatus, setDraftStatus] = useState<AppStatus | "">("");
  const [configSaved, setConfigSaved] = useState(false);
  const [serviceDrafts, setServiceDrafts] = useState<Record<string, { governmentFee: string; digiSevaFee: string; enabled: boolean }>>({});
  const [managedServices, setManagedServices] = useState(getManagedServices());
  const [serviceSearch, setServiceSearch] = useState("");
  const [showAddService, setShowAddService] = useState(false);
  const [newService, setNewService] = useState({ id: "", title: "", category: "citizen", group: "Citizen Services", fee: "₹0", digiSevaFee: "₹50", desc: "", time: "7 days" });
  const [revenueRange, setRevenueRange] = useState<"day" | "week" | "month" | "custom">("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [toast, setToast] = useState("");
  const [page, setPage] = useState(1);
  const [securityData, setSecurityData] = useState<SecurityOverview | null>(null);
  const [securityState, setSecurityState] = useState<"loading" | "ready" | "configuration" | "unauthorized" | "forbidden" | "error">("loading");
  const [securityMessage, setSecurityMessage] = useState("");
  const [enrollment, setEnrollment] = useState<{ enrollmentId: string; expiresAt: string; state?: string } | null>(null);
  const [enrollmentQrToken, setEnrollmentQrToken] = useState("");
  const [enrollmentQrDataUrl, setEnrollmentQrDataUrl] = useState<string | null>(null);
  const [enrollmentOtp, setEnrollmentOtp] = useState("");
  const [admins, setAdmins] = useState<AdminSummary[]>([]);
  const [adminForm, setAdminForm] = useState({ email: "", password: "", role: "OPERATIONS_ADMIN" });
  const [adminFormState, setAdminFormState] = useState<{loading:boolean;message?:string}>({loading:false});
  const [roles, setRoles] = useState<Array<{ $id: string; name: string; description: string; enabled: boolean }>>([]);
  const [rolePermissions, setRolePermissions] = useState<Record<string, Array<{ permission: string; enabled: boolean }>>>({});
  const [adminsState, setAdminsState] = useState<"loading" | "ready" | "configuration" | "unauthorized" | "forbidden" | "error">("loading");
  const [adminsMessage, setAdminsMessage] = useState("");
  const PAGE_SIZE = 10;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }, []);

  const refreshApps = useCallback(() => {
    setApplications(getApplications());
  }, []);

  useEffect(() => {
    if (authStep === "authenticated") {
      refreshApps();
      setAuditLog(getAuditLog());
      setManagedServices(getManagedServices());
    }
  }, [authStep, refreshApps]);

  useEffect(() => {
    if (authStep === "credentials") void adminAuth.restoreSession().then((result) => { if (result.success) setAuthStep("authenticated"); });
  }, [authStep]);

  useEffect(() => {
    if (authStep !== "authenticated" || section !== "security") return;
    setSecurityState("loading");
    void securityApi.overview().then((result) => {
      setSecurityMessage(result.message || "");
      setSecurityState(result.state === "ok" ? "ready" : result.state);
      if (result.data) setSecurityData(result.data);
    });
  }, [authStep, section]);

  useEffect(() => {
    if (authStep !== "authenticated" || section !== "admins") return;
    setAdminsState("loading");
    void adminManagementApi.list().then((result) => { setAdminsMessage(result.message || ""); setAdminsState(result.state === "ok" ? "ready" : result.state); if (result.data) setAdmins(result.data.items); });
  }, [authStep, section]);

  useEffect(() => {
    if (authStep !== "authenticated" || section !== "admins") return;
    void adminManagementApi.roles().then((result) => { if (result.state === "ok" && result.data) setRoles(result.data.items); });
  }, [authStep, section]);

  // ── Auth ──────────────────────────────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginErr("");
    const result = await adminAuth.login(username, password);
    setLoginLoading(false);
    if (result.success) {
      setAuthStep("otp");
    } else {
      setLoginErr(result.error ?? "Login failed. Please check your credentials.");
    }
  }

  async function handleOTP(e: React.FormEvent) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginErr("");
    const result = await adminAuth.verifyTotp(otp);
    setLoginLoading(false);
    if (result.success) {
      adminAuth.saveSession();
      setAuthStep("authenticated");
    } else {
      setLoginErr(result.error ?? "Invalid authenticator code.");
    }
  }

  async function handleGenerateEnrollment() {
    const result = await securityApi.enrollment();
    if (!result.data) {
      setToast(result.message || "CONFIGURATION_REQUIRED");
      return;
    }
    const payload = {
      protocol: result.data.protocol,
      version: result.data.version,
      tenant: result.data.tenant,
      enrollmentId: result.data.enrollmentId,
      nonce: result.data.nonce,
      token: result.data.token,
      callback: result.data.callback,
      expiresAt: result.data.expiresAt,
    };
    try {
      const dataUrl = await QRCode.toDataURL(JSON.stringify(payload));
      setEnrollmentQrDataUrl(dataUrl);
    } catch {
      setEnrollmentQrDataUrl(null);
    }
    setEnrollment({ enrollmentId: result.data.enrollmentId, expiresAt: result.data.expiresAt, state: "PENDING" });
    setEnrollmentQrToken(result.data.token);
  }

  async function handleRegenerateRecoveryCodes() {
    const password = window.prompt("Confirm password to regenerate recovery codes:");
    if (!password) return;
    const result = await securityApi.regenerateRecoveryCodes(password);
    if (result.state === "ok" && result.data) {
      setToast("Recovery codes regenerated.");
      setSecurityData((current) => current ? { ...current, recoveryCodes: { remaining: result.data!.remaining } } : current);
    } else {
      setToast(result.message || "Re-authentication failed.");
    }
  }

  function handleLogout() {
    adminAuth.clearSession();
    onExit();
  }

  // ── Application actions ──────────────────────────────────────────────────────
  function commitStatusChange() {
    if (!selectedApp || !draftStatus) return;
    const now = new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    updateApplication(selectedApp.id, { status: draftStatus });
    addTimelineEntry(selectedApp.id, { action: `Status changed to: ${draftStatus}`, date: now, by: "admin" });
    addAuditEntry({ action: "Status Changed", admin: "Admin", appId: selectedApp.id, timestamp: now, details: `${selectedApp.status} → ${draftStatus}` });
    setAuditLog(getAuditLog());
    refreshApps();
    setSelectedApp({ ...selectedApp, status: draftStatus });
    setDraftStatus("");
    showToast("Status updated.");
  }

  function commitPaymentAction(app: AppRecord, action: "verify" | "reject") {
    const now = new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    const newStatus = action === "verify" ? "Payment Verified" : "Payment Rejected";
    updateApplication(app.id, { paymentStatus: newStatus as AppRecord["paymentStatus"] });
    addTimelineEntry(app.id, { action: `Payment ${action === "verify" ? "verified" : "rejected"} by admin`, date: now, by: "admin" });
    addAuditEntry({ action: `Payment ${action === "verify" ? "Verified" : "Rejected"}`, admin: "Admin", appId: app.id, timestamp: now, details: `Ref: ${app.paymentRef ?? "N/A"}` });
    setAuditLog(getAuditLog());
    refreshApps();
    if (selectedApp?.id === app.id) setSelectedApp({ ...selectedApp, paymentStatus: newStatus as AppRecord["paymentStatus"] });
    showToast(`Payment ${action === "verify" ? "verified" : "rejected"}.`);
  }

  function commitDocStatus(docId: string, newStatus: DocStatus) {
    if (!selectedApp) return;
    const now = new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    const updatedDocs = selectedApp.documents.map((d) => d.id === docId ? { ...d, status: newStatus } : d);
    updateApplication(selectedApp.id, { documents: updatedDocs });
    addAuditEntry({ action: "Document Status Changed", admin: "Admin", appId: selectedApp.id, timestamp: now, details: `${docId} → ${newStatus}` });
    setAuditLog(getAuditLog());
    refreshApps();
    setSelectedApp({ ...selectedApp, documents: updatedDocs });
    showToast("Document status updated.");
  }

  function saveNotes() {
    if (!selectedApp) return;
    updateApplication(selectedApp.id, {
      adminNotes: draftNotes,
      customerMessage: draftMsg.trim() || undefined,
    });
    addAuditEntry({ action: "Notes Updated", admin: "Admin", appId: selectedApp.id, timestamp: new Date().toLocaleString("en-IN"), details: "Internal note and/or customer message updated" });
    setAuditLog(getAuditLog());
    setSelectedApp({ ...selectedApp, adminNotes: draftNotes, customerMessage: draftMsg.trim() || undefined });
    refreshApps();
    setEditingNotes(false);
    showToast("Notes saved.");
  }

  function saveConfig() {
    updateAdminConfig(configDraft);
    setAdminConfig(getAdminConfig());
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 2500);
    addAuditEntry({ action: "Config Updated", admin: "Admin", appId: "—", timestamp: new Date().toLocaleString("en-IN"), details: `UPI: ${configDraft.upiId}` });
    setAuditLog(getAuditLog());
    showToast("Settings saved.");
  }

  function openApplication(app: AppRecord) {
    setSelectedApp(app);
    setDraftNotes(app.adminNotes);
    setDraftMsg(app.customerMessage ?? "");
    setDraftStatus("");
    setEditingNotes(false);
  }

  function saveServiceOverride(serviceId: string, serviceName: string) {
    const draft = serviceDrafts[serviceId];
    if (!draft || !draft.governmentFee.trim() || !draft.digiSevaFee.trim()) {
      showToast("Enter both fee values before saving.");
      return;
    }
    setServiceFeeOverride(serviceId, draft);
    addAuditEntry({ action: "Service Updated", admin: "Admin", appId: "—", timestamp: new Date().toLocaleString("en-IN"), details: `${serviceName}: ${draft.governmentFee} + ${draft.digiSevaFee} (${draft.enabled ? "active" : "paused"})` });
    setAuditLog(getAuditLog());
    showToast(`${serviceName} settings saved.`);
  }

  function toggleService(serviceId: string, enabled: boolean) {
    setServiceEnabled(serviceId, enabled);
    setManagedServices(getManagedServices());
    addAuditEntry({ action: enabled ? "Service Restored" : "Service Disabled", admin: "Admin", appId: "—", timestamp: new Date().toLocaleString("en-IN"), details: serviceId });
    setAuditLog(getAuditLog());
    showToast(enabled ? "Service restored for customers." : "Service removed from customer catalog.");
  }

  function addService() {
    const id = newService.id.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
    if (!id || !newService.title.trim() || managedServices.some((record) => record.service.id === id)) {
      showToast("Enter a unique service ID and title.");
      return;
    }
    const service: ManagedService = { ...newService, id, title: newService.title.trim(), badge: "DigiSeva", desc: newService.desc.trim() || "Service application support through DigiSeva.", popular: false, tags: [id, newService.title.toLowerCase()], docs: [], steps: [{ label: "Application Details", desc: "Provide the required information." }, { label: "Documents", desc: "Upload supporting documents." }, { label: "Review & Submit", desc: "Confirm and submit the request." }] };
    addManagedService(service);
    setManagedServices(getManagedServices());
    setShowAddService(false);
    setNewService({ id: "", title: "", category: "citizen", group: "Citizen Services", fee: "₹0", digiSevaFee: "₹50", desc: "", time: "7 days" });
    addAuditEntry({ action: "Service Added", admin: "Admin", appId: "—", timestamp: new Date().toLocaleString("en-IN"), details: service.title });
    setAuditLog(getAuditLog());
    showToast("Service added to the customer catalog.");
  }

  // ── Derived data ─────────────────────────────────────────────────────────────
  const filteredApps = applications.filter((a) => {
    const q = appSearch.toLowerCase();
    const matchQ = !q || a.id.toLowerCase().includes(q) || a.customerName.toLowerCase().includes(q)
      || a.serviceName.toLowerCase().includes(q) || a.customerMobile.includes(q);
    const matchS = appStatusFilter === "all" || a.status === appStatusFilter;
    const matchP = appPayFilter === "all" || a.paymentStatus === appPayFilter;
    return matchQ && matchS && matchP;
  });

  const paginated = filteredApps.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filteredApps.length / PAGE_SIZE);
  useEffect(() => {
    setPage((current) => Math.min(current, Math.max(1, Math.ceil(filteredApps.length / PAGE_SIZE))));
  }, [filteredApps.length]);
  const payPendingApps = applications.filter((a) => a.paymentStatus === "Payment Submitted");
  const allDocs = applications.flatMap((a) => a.documents.map((d) => ({ ...d, app: a })));

  const now = new Date();
  const revenueStart = revenueRange === "day" ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
    : revenueRange === "week" ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    : revenueRange === "month" ? new Date(now.getFullYear(), now.getMonth(), 1)
    : customStart ? new Date(`${customStart}T00:00:00`) : new Date(0);
  const revenueEnd = revenueRange === "custom" && customEnd ? new Date(`${customEnd}T23:59:59`) : now;
  const revenueApps = applications.filter((a) => {
    const date = parseAppDate(a.appliedAt);
    return a.paymentStatus === "Payment Verified" && date && date >= revenueStart && date <= revenueEnd;
  });
  const totalRevenue = revenueApps
    .reduce((sum, a) => sum + (parseInt(a.totalAmount.replace(/[₹,]/g, ""), 10) || 0), 0);

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => ["Application Submitted","Documents Under Review","Payment Pending"].includes(a.status)).length,
    completed: applications.filter((a) => a.status === "Completed").length,
    payPending: payPendingApps.length,
    rejected: applications.filter((a) => a.status === "Rejected").length,
    revenue: `₹${totalRevenue.toLocaleString("en-IN")}`,
  };

  const statusChartData = Object.keys(STATUS_COLOR).map((s) => ({
    name: s.replace("Application ", "").replace("Documents ", "Docs ").replace("Submitted to Department", "→ Dept").slice(0, 12),
    count: applications.filter((a) => a.status === s).length,
  })).filter((d) => d.count > 0);

  const payChartData = [
    { name: "Pay Now",   value: applications.filter((a) => a.paymentOption === "pay_now").length },
    { name: "Pay Later", value: applications.filter((a) => a.paymentOption === "pay_later").length },
  ].filter((d) => d.value > 0);

  const customers: Array<{ name: string; mobile: string; email: string; apps: number; lastApp: string }> = Object.values(
    applications.reduce<Record<string, { name: string; mobile: string; email: string; apps: number; lastApp: string }>>((acc, a) => {
      if (!acc[a.customerMobile]) {
        acc[a.customerMobile] = { name: a.customerName, mobile: a.customerMobile, email: a.customerEmail, apps: 0, lastApp: "" };
      }
      acc[a.customerMobile].apps++;
      acc[a.customerMobile].lastApp = a.serviceName;
      return acc;
    }, {})
  );

  // ── Nav items ─────────────────────────────────────────────────────────────────
  const NAV: { key: Section; icon: React.ElementType; label: string; badge?: number }[] = [
    { key: "dashboard",    icon: LayoutDashboard, label: "Dashboard" },
    { key: "applications", icon: FileText,        label: "Applications", badge: stats.pending },
    { key: "documents",    icon: FileCheck,       label: "Documents",    badge: allDocs.filter((d) => d.status === "under_review").length || undefined },
    { key: "payments",     icon: CreditCard,      label: "Payments",     badge: stats.payPending || undefined },
    { key: "services",     icon: Building,        label: "Services" },
    { key: "customers",    icon: Users,           label: "Customers" },
    { key: "qr",           icon: QrCode,          label: "QR / Payment" },
    { key: "logs",         icon: Activity,        label: "Audit Log" },
    { key: "security",     icon: ShieldCheck,     label: "Security" },
    { key: "nexora",       icon: Smartphone,      label: "NEXORA Authenticator" },
    { key: "admins",       icon: Users,           label: "Admin Management" },
    { key: "settings",     icon: Settings,        label: "Settings" },
  ];

  function navClick(key: Section) {
    setSection(key);
    setSelectedApp(null);
    setAppSearch("");
    setPage(1);
  }

  // ── Login ─────────────────────────────────────────────────────────────────────
  if (authStep === "credentials") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2.5 justify-center mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Shield size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white" style={{ fontFamily: "'Sora', sans-serif" }}>DigiSeva Admin</span>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-7">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Administrator Login</h2>
            <p className="text-sm text-slate-500 mb-6">Restricted access — authorised personnel only.</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">Admin Email</label>
                <input type="email" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus required
                  autoComplete="email"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all" />
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                  autoComplete="current-password"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all" />
              </div>

              {loginErr && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2.5 border border-red-100">
                  <AlertCircle size={14} className="flex-shrink-0" />{loginErr}
                </div>
              )}

              <button type="submit" disabled={loginLoading}
                className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-xl hover:bg-blue-700 transition-all text-sm disabled:opacity-60 flex items-center justify-center gap-2">
                {loginLoading ? <RefreshCw size={14} className="animate-spin" /> : null}
                {loginLoading ? "Signing in…" : "Continue →"}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-100">
              <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                <Info size={10} className="inline mr-1 -mt-0.5" />
                Admin access requires backend integration. Contact your system administrator for credentials.
              </p>
            </div>
          </div>

          <button onClick={onExit} className="flex items-center gap-1.5 text-slate-500 hover:text-white text-xs mx-auto mt-5 transition-colors">
            <ArrowLeft size={12} />Back to DigiSeva
          </button>
        </div>
      </div>
    );
  }

  // ── 2FA ───────────────────────────────────────────────────────────────────────
  if (authStep === "otp") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2.5 justify-center mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <KeyRound size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white" style={{ fontFamily: "'Sora', sans-serif" }}>Two-Factor Auth</span>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-7">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <Smartphone size={24} className="text-blue-600" />
            </div>
            <h2 className="text-base font-bold text-slate-900 text-center mb-1">Authenticator Code</h2>
            <p className="text-xs text-slate-500 text-center mb-6 leading-relaxed">
              Open your NEXORA Authenticator app and enter the current 6-digit time-based code for DigiSeva Admin.
            </p>

            <form onSubmit={handleOTP} className="space-y-4">
              <input type="text" inputMode="numeric" maxLength={6} value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                autoFocus placeholder="000000"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-2xl font-mono tracking-[0.6em] text-center focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all" />

              {loginErr && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2 border border-red-100">
                  <AlertCircle size={13} className="flex-shrink-0" />{loginErr}
                </div>
              )}

              <button type="submit" disabled={otp.length !== 6 || loginLoading}
                className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-xl hover:bg-blue-700 transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                {loginLoading ? <RefreshCw size={14} className="animate-spin" /> : null}
                {loginLoading ? "Verifying…" : "Verify & Sign In"}
              </button>
            </form>
          </div>

          <button onClick={() => { setAuthStep("credentials"); setLoginErr(""); setOtp(""); }}
            className="flex items-center gap-1.5 text-slate-500 hover:text-white text-xs mx-auto mt-5 transition-colors">
            <ArrowLeft size={12} />Back
          </button>
        </div>
      </div>
    );
  }

  // ── Main shell ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      {toast && (
        <div className="fixed top-4 right-4 z-[200] bg-slate-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2"
          style={{ animation: "fadeInDown 0.2s ease" }}>
          <CheckCircle size={14} className="text-green-400" />{toast}
        </div>
      )}
      <style>{`@keyframes fadeInDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Topbar */}
      <header className="bg-slate-950 border-b border-slate-800 h-14 flex items-center px-4 gap-3 flex-shrink-0 z-50 sticky top-0">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
          <LayoutDashboard size={16} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <Shield size={13} className="text-white" />
          </div>
          <span className="text-white font-bold text-sm hidden sm:block" style={{ fontFamily: "'Sora', sans-serif" }}>DigiSeva Admin</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-all relative hidden sm:block">
            <Bell size={15} />
            {stats.payPending > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full" />}
          </button>
          <div className="flex items-center gap-1.5 border border-slate-700 rounded-lg px-2.5 py-1.5">
            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-[9px]">A</div>
            <span className="text-slate-300 text-xs hidden sm:inline">Admin</span>
            <ChevronDown size={10} className="text-slate-500" />
          </div>
          <button onClick={handleLogout} className="text-slate-400 hover:text-white text-[11px] font-medium flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-all ml-1">
            <LogOut size={13} />Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Sidebar */}
        <aside className={`bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0 transition-all duration-200 overflow-hidden md:static md:translate-x-0 fixed inset-y-14 left-0 z-[70] ${sidebarOpen ? "w-52 translate-x-0" : "w-14 -translate-x-full md:translate-x-0"}`}>
          <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
            {NAV.map(({ key, icon: Icon, label, badge }) => (
              <button key={key} onClick={() => navClick(key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${section === key ? "bg-blue-600 text-white shadow-md shadow-blue-900/40" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
                <Icon size={16} className="flex-shrink-0" />
                {sidebarOpen && (
                  <>
                    <span className="flex-1 text-left truncate">{label}</span>
                    {badge ? <span className="bg-white/20 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{badge}</span> : null}
                  </>
                )}
              </button>
            ))}
          </nav>
          {sidebarOpen && (
            <div className="p-3 border-t border-slate-800">
              <button onClick={onExit} className="w-full flex items-center gap-2 text-slate-500 hover:text-white text-[11px] py-2 px-3 rounded-lg hover:bg-slate-800 transition-all">
                <ChevronLeft size={12} />Back to Site
              </button>
            </div>
          )}
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 overflow-y-auto">

          {/* DASHBOARD */}
          {section === "dashboard" && (
            <div className="p-4 sm:p-6 max-w-6xl">
              <SectionHeader title="Dashboard" subtitle={`${applications.length} total applications`}
                action={<button onClick={refreshApps} className="text-slate-400 hover:text-slate-700 transition-colors"><RefreshCw size={15} /></button>} />

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-7">
                <StatCard label="Total" value={stats.total} icon={FileText} color="text-blue-600 bg-blue-100" />
                <StatCard label="Pending" value={stats.pending} icon={Clock} color="text-amber-600 bg-amber-100" />
                <StatCard label="Completed" value={stats.completed} icon={CheckCircle} color="text-green-600 bg-green-100" />
                <StatCard label="Pay Pending" value={stats.payPending} icon={CreditCard} color="text-purple-600 bg-purple-100" />
                <StatCard label="Rejected" value={stats.rejected} icon={X} color="text-red-600 bg-red-100" />
                <StatCard label="Revenue" value={stats.revenue} icon={TrendingUp} color="text-teal-600 bg-teal-100" sub="Verified payments" />
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 mb-7">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div><h3 className="font-bold text-slate-800 text-sm">Revenue</h3><p className="text-xs text-slate-400">Verified payments received in the selected period</p></div>
                  <div className="flex gap-1.5 flex-wrap">
                    {(["day", "week", "month", "custom"] as const).map((range) => <button key={range} onClick={() => setRevenueRange(range)} className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize ${revenueRange === range ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{range}</button>)}
                  </div>
                </div>
                {revenueRange === "custom" && <div className="flex flex-wrap items-center gap-2 mb-4"><CalendarDays size={14} className="text-slate-400" /><input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs" /><span className="text-xs text-slate-400">to</span><input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs" /></div>}
                <div className="flex items-end gap-4"><p className="text-3xl font-black text-slate-900">₹{totalRevenue.toLocaleString("en-IN")}</p><p className="text-xs text-slate-400 mb-1">{revenueApps.length} verified payment{revenueApps.length === 1 ? "" : "s"}</p></div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-7">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
                  <h3 className="font-bold text-slate-800 text-sm mb-4">Status Distribution</h3>
                  {statusChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={statusChartData} barSize={14}>
                        <XAxis dataKey="name" tick={{ fontSize: 8 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                        <Bar dataKey="count" fill="#2563EB" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <EmptyState icon={Activity} title="No data" body="No applications yet." />}
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
                  <h3 className="font-bold text-slate-800 text-sm mb-4">Payment Options</h3>
                  {payChartData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={175}>
                        <PieChart>
                          <Pie data={payChartData} cx="50%" cy="50%" innerRadius={48} outerRadius={68} paddingAngle={3} dataKey="value">
                            {payChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-1">
                        {payChartData.map((item, i) => <div key={item.name} className="flex items-center gap-1.5 text-xs text-slate-600"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />{item.name} <strong className="text-slate-800">{Math.round((item.value / applications.length) * 100)}%</strong></div>)}
                      </div>
                    </>
                  ) : <EmptyState icon={CreditCard} title="No data" body="No payment data yet." />}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="font-bold text-slate-900 text-sm">Recent Applications</h2>
                  <button onClick={() => navClick("applications")} className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-0.5">
                    View all <ArrowUpRight size={11} />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-slate-100 bg-slate-50">
                      {["ID","Service","Customer","Status","Payment","Applied"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {applications.slice(0,5).map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50 cursor-pointer transition-colors"
                          onClick={() => { openApplication(app); setSection("applications"); setAppSearch(""); setPage(1); }}>
                          <td className="px-4 py-3 font-mono text-[11px] text-blue-700 font-semibold">{app.id}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{app.serviceName}</td>
                          <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{app.customerName}</td>
                          <td className="px-4 py-3"><Badge className={STATUS_COLOR[app.status] ?? "bg-slate-100 text-slate-700"}>{app.status}</Badge></td>
                          <td className="px-4 py-3"><Badge className={PAY_COLOR[app.paymentStatus] ?? "bg-slate-100 text-slate-700"}>{app.paymentStatus}</Badge></td>
                          <td className="px-4 py-3 text-[11px] text-slate-400 whitespace-nowrap">{app.appliedAt}</td>
                        </tr>
                      ))}
                      {applications.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-slate-400 text-sm">No applications yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* APPLICATIONS LIST */}
          {section === "applications" && !selectedApp && (
            <div className="p-6">
              <SectionHeader title="Applications" subtitle={`${filteredApps.length} results`}
                action={<button onClick={refreshApps} className="text-slate-400 hover:text-slate-700 transition-colors"><RefreshCw size={15} /></button>} />

              <div className="flex flex-wrap gap-2 mb-4">
                <div className="relative flex-1 min-w-[220px]">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Search by ID, name, service, mobile…" value={appSearch}
                    onChange={(e) => { setAppSearch(e.target.value); setPage(1); }}
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                </div>
                <select value={appStatusFilter} onChange={(e) => { setAppStatusFilter(e.target.value); setPage(1); }}
                  className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                  <option value="all">All Status</option>
                  {Object.keys(STATUS_COLOR).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={appPayFilter} onChange={(e) => { setAppPayFilter(e.target.value); setPage(1); }}
                  className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                  <option value="all">All Payments</option>
                  {Object.keys(PAY_COLOR).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-slate-100 bg-slate-50">
                      {["ID","Service","Customer","Mobile","Status","Payment","Amount","Applied"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginated.length === 0 && <tr><td colSpan={8} className="text-center py-10 text-slate-400 text-sm">No applications found.</td></tr>}
                      {paginated.map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50 cursor-pointer transition-colors"
                          onClick={() => openApplication(app)}>
                          <td className="px-4 py-3 font-mono text-[11px] text-blue-700 font-semibold">{app.id}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{app.serviceName}</td>
                          <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{app.customerName}</td>
                          <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{app.customerMobile}</td>
                          <td className="px-4 py-3"><Badge className={STATUS_COLOR[app.status] ?? "bg-slate-100 text-slate-700"}>{app.status}</Badge></td>
                          <td className="px-4 py-3"><Badge className={PAY_COLOR[app.paymentStatus] ?? "bg-slate-100 text-slate-700"}>{app.paymentStatus}</Badge></td>
                          <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{app.totalAmount}</td>
                          <td className="px-4 py-3 text-[11px] text-slate-400 whitespace-nowrap">{app.appliedAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
                    <p className="text-xs text-slate-500">Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE,filteredApps.length)} of {filteredApps.length}</p>
                    <div className="flex gap-1.5">
                      <button onClick={() => setPage((p) => Math.max(1,p-1))} disabled={page === 1} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs disabled:opacity-40 hover:bg-slate-50">Prev</button>
                      <button onClick={() => setPage((p) => Math.min(totalPages,p+1))} disabled={page >= totalPages} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs disabled:opacity-40 hover:bg-slate-50">Next</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* APPLICATION DETAIL */}
          {section === "applications" && selectedApp && (
            <div className="p-4 sm:p-6 max-w-5xl">
              <button onClick={() => setSelectedApp(null)} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm mb-5 transition-colors">
                <ChevronLeft size={14} />Back to Applications
              </button>
              <div className="flex flex-wrap items-start gap-4 mb-5">
                <div>
                  <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Sora', sans-serif" }}>{selectedApp.serviceName}</h1>
                  <p className="font-mono text-xs text-blue-600 mt-0.5">{selectedApp.id}</p>
                </div>
                <div className="ml-auto flex gap-2 flex-wrap">
                  <Badge className={STATUS_COLOR[selectedApp.status] ?? "bg-slate-100 text-slate-700"}>{selectedApp.status}</Badge>
                  <Badge className={PAY_COLOR[selectedApp.paymentStatus] ?? "bg-slate-100 text-slate-700"}>{selectedApp.paymentStatus}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 space-y-5">
                  {/* Applicant */}
                  <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
                    <h3 className="font-bold text-slate-800 text-sm mb-4">Applicant Details</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {([["Name", selectedApp.customerName],["Mobile", selectedApp.customerMobile],["Email", selectedApp.customerEmail],["DOB", selectedApp.dob ?? "—"],["Applied", selectedApp.appliedAt],["Address", selectedApp.address ?? "—"]] as [string,string][]).map(([k,v]) => (
                        <div key={k} className={k === "Address" || k === "Applied" ? "col-span-2" : ""}>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{k}</p>
                          <p className="text-sm font-semibold text-slate-800">{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment */}
                  <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
                    <h3 className="font-bold text-slate-800 text-sm mb-4">Payment</h3>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {([["Gov Fee", selectedApp.governmentFee],["DigiSeva Fee", selectedApp.digiSevaFee],["Total", selectedApp.totalAmount]] as [string,string][]).map(([k,v]) => (
                        <div key={k}>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{k}</p>
                          <p className="text-base font-bold text-slate-900">{v}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Option</p>
                        <p className="text-sm font-semibold text-slate-700">{selectedApp.paymentOption === "pay_now" ? "Pay Now" : "Pay Later"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">UPI Ref</p>
                        <p className="font-mono text-sm text-slate-700">{selectedApp.paymentRef ?? "—"}</p>
                      </div>
                      {selectedApp.paymentStatus === "Payment Submitted" && (
                        <div className="flex gap-2 ml-auto">
                          <button onClick={() => commitPaymentAction(selectedApp, "verify")} className="flex items-center gap-1.5 bg-green-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-green-700 transition-all">
                            <Check size={12} />Verify
                          </button>
                          <button onClick={() => commitPaymentAction(selectedApp, "reject")} className="flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-red-700 transition-all">
                            <X size={12} />Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
                    <h3 className="font-bold text-slate-800 text-sm mb-4">Documents</h3>
                    <div className="space-y-2">
                      {selectedApp.documents.map((doc) => (
                        <div key={doc.id} className={`flex items-center justify-between rounded-xl px-4 py-3 border ${DOC_COLOR[doc.status] ?? "bg-slate-50 text-slate-700 border-slate-200"}`}>
                          <div className="flex items-center gap-2.5">
                            <FileCheck size={13} />
                            <div>
                              <p className="text-sm font-semibold">{doc.name}</p>
                              <p className="text-[10px] opacity-70">{doc.fileSize ?? ""} · {doc.uploadedAt}</p>
                            </div>
                          </div>
                          <select className="text-[10px] border border-current/20 rounded-lg px-1.5 py-1 bg-white/70 focus:outline-none cursor-pointer"
                            value={doc.status} onChange={(e) => commitDocStatus(doc.id, e.target.value as DocStatus)}>
                            {(["uploaded","under_review","verified","rejected","reupload_required"] as DocStatus[]).map((s) => (
                              <option key={s} value={s}>{s.replace(/_/g," ")}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                      {selectedApp.documents.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No documents uploaded yet.</p>}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
                    <h3 className="font-bold text-slate-800 text-sm mb-4">Activity Timeline</h3>
                    <div className="space-y-3">
                      {selectedApp.timeline.map((entry, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${entry.by === "admin" ? "bg-blue-600" : "bg-slate-300"}`}>
                              {entry.by === "admin" ? <ShieldCheck size={10} className="text-white" /> : <Users size={10} className="text-white" />}
                            </div>
                            {i < selectedApp.timeline.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 my-1 min-h-[16px]" />}
                          </div>
                          <div className="pb-2 min-w-0">
                            <p className="text-sm text-slate-800 font-medium leading-snug">{entry.action}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{entry.date} · {entry.by === "admin" ? "Admin" : "Customer"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right column */}
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
                    <h3 className="font-bold text-slate-800 text-sm mb-3">Change Status</h3>
                    <select value={draftStatus} onChange={(e) => setDraftStatus(e.target.value as AppStatus)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 mb-3">
                      <option value="">Select new status…</option>
                      {(Object.keys(STATUS_COLOR) as AppStatus[]).map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={commitStatusChange} disabled={!draftStatus}
                      className="w-full bg-blue-600 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-40">
                      Update Status
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-slate-800 text-sm">Admin Notes</h3>
                      <span className="text-[9px] bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-full font-black">INTERNAL ONLY</span>
                    </div>
                    {editingNotes ? (
                      <>
                        <p className="text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Internal note (never shown to customer):</p>
                        <textarea value={draftNotes} onChange={(e) => setDraftNotes(e.target.value)} rows={3}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none mb-3" />
                        <p className="text-[10px] font-bold text-blue-600 mb-1.5 uppercase tracking-wide">Customer message (visible in tracking):</p>
                        <textarea value={draftMsg} onChange={(e) => setDraftMsg(e.target.value)} rows={2}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none mb-3"
                          placeholder="Leave blank to keep existing message" />
                        <div className="flex gap-2">
                          <button onClick={saveNotes} className="flex-1 bg-blue-600 text-white text-xs font-bold py-2 rounded-xl hover:bg-blue-700 transition-all"><Save size={11} className="inline mr-1" />Save</button>
                          <button onClick={() => { setEditingNotes(false); setDraftNotes(selectedApp.adminNotes); }} className="px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-slate-700 leading-relaxed mb-3 min-h-[2rem]">
                          {selectedApp.adminNotes || <span className="text-slate-400 italic">No notes.</span>}
                        </p>
                        {selectedApp.customerMessage && (
                          <div className="bg-blue-50 rounded-xl px-3 py-2.5 border border-blue-100 mb-3">
                            <p className="text-[10px] font-bold text-blue-600 mb-1 uppercase tracking-wide">Customer message:</p>
                            <p className="text-xs text-slate-700 leading-relaxed">{selectedApp.customerMessage}</p>
                          </div>
                        )}
                        <button onClick={() => setEditingNotes(true)} className="w-full text-xs border border-slate-200 text-slate-600 py-2 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5">
                          <Pencil size={11} />Edit Notes & Message
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DOCUMENTS */}
          {section === "documents" && (
            <div className="p-4 sm:p-6 max-w-5xl">
              <SectionHeader title="Document Management" subtitle="All uploaded documents across applications" />
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-slate-100 bg-slate-50">
                      {["Document","Application","Customer","Uploaded","Status","Actions"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {allDocs.length === 0 && <tr><td colSpan={6}><EmptyState icon={FileCheck} title="No documents" body="Documents will appear here once customers upload them." /></td></tr>}
                      {allDocs.map((doc) => (
                        <tr key={`${doc.app.id}-${doc.id}`} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-800">{doc.name}</td>
                          <td className="px-4 py-3 font-mono text-[11px] text-blue-700">{doc.app.id}</td>
                          <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{doc.app.customerName}</td>
                          <td className="px-4 py-3 text-[11px] text-slate-400 whitespace-nowrap">{doc.uploadedAt}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${DOC_COLOR[doc.status] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                              {doc.status.replace(/_/g," ")}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1.5">
                              <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Preview"><Eye size={13} /></button>
                              <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" title="Download"><Download size={13} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
                <Info size={11} />Document preview and download require private object storage integration (S3-compatible). Not implemented in prototype.
              </p>
            </div>
          )}

          {/* PAYMENTS */}
          {section === "payments" && (
            <div className="p-4 sm:p-6 max-w-4xl">
              <SectionHeader title="Payment Verification" subtitle={`${payPendingApps.length} payment${payPendingApps.length !== 1 ? "s" : ""} awaiting verification`} />
              {payPendingApps.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-12 text-center">
                  <CheckCircle size={36} className="text-green-400 mx-auto mb-3" />
                  <p className="font-bold text-slate-700">No pending payments</p>
                  <p className="text-sm text-slate-400 mt-1">All submitted payments have been processed.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payPendingApps.map((app) => (
                    <div key={app.id} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-xs text-blue-600 mb-0.5">{app.id}</p>
                          <p className="font-bold text-slate-900">{app.serviceName} — {app.customerName}</p>
                          <p className="text-sm text-slate-500">{app.customerMobile} · Applied {app.appliedAt}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-slate-900">{app.totalAmount}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">UPI: {app.paymentRef}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4 flex-wrap">
                        <button onClick={() => commitPaymentAction(app, "verify")} className="flex items-center gap-1.5 bg-green-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-green-700 transition-all">
                          <Check size={12} />Verify Payment
                        </button>
                        <button onClick={() => commitPaymentAction(app, "reject")} className="flex items-center gap-1.5 border border-red-200 text-red-600 text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-red-50 transition-all">
                          <X size={12} />Reject
                        </button>
                        <button onClick={() => { openApplication(app); setSection("applications"); setAppSearch(""); setPage(1); }}
                          className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-all ml-auto">
                          <Eye size={12} />View Application
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SERVICES */}
          {section === "services" && (
            <div className="p-4 sm:p-6 max-w-5xl">
              <SectionHeader title="Service Management" subtitle={`${managedServices.length} services in the catalog`}
                action={<button onClick={() => setShowAddService(!showAddService)} className="flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl hover:bg-blue-700"><Plus size={14} />Add Service</button>} />
              <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 mb-5 text-sm text-blue-900 flex items-start gap-2">
                <Info size={14} className="flex-shrink-0 mt-0.5 text-blue-600" />
                Changes apply to new applications in this browser session. Production persistence still requires the authenticated backend.
              </div>
              {showAddService && <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-5 mb-5">
                <h3 className="font-bold text-slate-800 text-sm mb-4">Add customer service</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(["id", "title", "category", "group", "fee", "digiSevaFee", "time", "desc"] as const).map((field) => <input key={field} value={newService[field]} onChange={(e) => setNewService({ ...newService, [field]: e.target.value })} placeholder={field === "digiSevaFee" ? "DigiSeva fee" : field[0].toUpperCase() + field.slice(1)} className={`${field === "desc" ? "sm:col-span-2 lg:col-span-3" : ""} border border-slate-200 rounded-xl px-3 py-2.5 text-sm`} />)}
                </div>
                <div className="flex gap-2 mt-4"><button onClick={addService} className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl">Create Service</button><button onClick={() => setShowAddService(false)} className="border border-slate-200 text-slate-600 text-xs font-bold px-4 py-2 rounded-xl">Cancel</button></div>
              </div>}
              <div className="relative mb-4"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={serviceSearch} onChange={(e) => setServiceSearch(e.target.value)} placeholder="Search all services..." className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm" /></div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-slate-100 bg-slate-50">
                      {["Service","Category","Gov Fee","DigiSeva Fee","Total","Status"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {managedServices.filter((record) => !serviceSearch.trim() || `${record.service.title} ${record.service.category} ${record.service.id}`.toLowerCase().includes(serviceSearch.toLowerCase())).map((record) => {
                        const service = record.service;
                        const override = getServiceFeeOverride(service.id);
                        const draft = serviceDrafts[service.id] ?? { governmentFee: override?.governmentFee ?? (service.fee === "Free" ? "₹0" : service.fee), digiSevaFee: override?.digiSevaFee ?? service.digiSevaFee ?? "₹50", enabled: record.enabled };
                        const gNum = parseInt(draft.governmentFee.replace(/[₹,]/g,""), 10) || 0;
                        const dNum = parseInt(draft.digiSevaFee.replace(/[₹,]/g,""), 10) || 0;
                        return (
                          <tr key={service.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-semibold text-slate-800">{service.title}<span className="block text-[10px] text-slate-400 font-mono">{service.id}</span></td>
                            <td className="px-4 py-3 text-slate-500 capitalize">{service.category}</td>
                            <td className="px-4 py-3"><input aria-label={`${service.title} government fee`} value={draft.governmentFee} onChange={(e) => setServiceDrafts({ ...serviceDrafts, [service.id]: { ...draft, governmentFee: e.target.value } })} className="w-24 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono" /></td>
                            <td className="px-4 py-3"><input aria-label={`${service.title} DigiSeva fee`} value={draft.digiSevaFee} onChange={(e) => setServiceDrafts({ ...serviceDrafts, [service.id]: { ...draft, digiSevaFee: e.target.value } })} className="w-24 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono font-bold" /></td>
                            <td className="px-4 py-3 font-mono font-bold text-blue-700">₹{(gNum+dNum).toLocaleString("en-IN")}</td>
                            <td className="px-4 py-3"><div className="flex items-center gap-2"><button onClick={() => toggleService(service.id, !record.enabled)} className={`text-[10px] font-bold px-2 py-1 rounded-full ${record.enabled ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>{record.enabled ? "Active" : "Removed"}</button><button onClick={() => saveServiceOverride(service.id, service.title)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Save service settings"><Save size={13} /></button>{record.custom && <button onClick={() => { removeManagedService(service.id); setManagedServices(getManagedServices()); addAuditEntry({ action: "Service Deleted", admin: "Admin", appId: "—", timestamp: new Date().toLocaleString("en-IN"), details: service.title }); setAuditLog(getAuditLog()); showToast("Custom service deleted."); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Delete custom service"><Trash2 size={13} /></button>}</div></td>
                          </tr>
                        );
                      })}
                      {managedServices.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-slate-400 text-sm">No services configured.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* CUSTOMERS */}
          {section === "customers" && (
            <div className="p-4 sm:p-6 max-w-5xl">
              <SectionHeader title="Customers" subtitle={`${customers.length} unique customer${customers.length !== 1 ? "s" : ""}`} />
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-slate-100 bg-slate-50">
                      {["Name","Mobile","Email","Applications","Last Service"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {customers.length === 0 && <tr><td colSpan={5}><EmptyState icon={Users} title="No customers yet" body="Customer records appear when applications are submitted." /></td></tr>}
                      {customers.map((c) => (
                        <tr key={c.mobile} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 font-bold text-xs flex items-center justify-center flex-shrink-0">{c.name[0]}</div>
                              <span className="font-semibold text-slate-800">{c.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-slate-600">{c.mobile}</td>
                          <td className="px-4 py-3 text-slate-600 text-xs">{c.email}</td>
                          <td className="px-4 py-3 text-center font-bold text-slate-800">{c.apps}</td>
                          <td className="px-4 py-3 text-slate-500 text-xs">{c.lastApp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
                <Info size={11} />Sensitive customer documents are not shown here. View individual application records for document details.
              </p>
            </div>
          )}

          {/* QR SETTINGS */}
          {section === "qr" && (
            <div className="p-4 sm:p-6 max-w-2xl">
              <SectionHeader title="QR / Payment Settings" subtitle="Configure UPI QR code shown to customers" />
              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-5 text-sm text-amber-900 flex items-start gap-2">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5 text-amber-600" />
                Use UPI QR code method only. Do not integrate payment gateways (Razorpay, Stripe, PhonePe, etc.) without proper backend and regulatory compliance.
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 space-y-5">
                {([["UPI ID", "upiId", "text"], ["Account Name", "accountName", "text"], ["Payment Instructions", "paymentInstructions", "textarea"]] as [string,string,string][]).map(([label, field, type]) => (
                  <div key={field}>
                    <label className="block text-[11px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">{label}</label>
                    {type === "textarea" ? (
                      <textarea value={(configDraft as any)[field]} onChange={(e) => setConfigDraft({ ...configDraft, [field]: e.target.value })} rows={3}
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none" />
                    ) : (
                      <input type="text" value={(configDraft as any)[field]}
                        onChange={(e) => setConfigDraft({ ...configDraft, [field]: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-mono" />
                    )}
                  </div>
                ))}

                <div className="flex items-center gap-3">
                  <button type="button" aria-pressed={configDraft.qrEnabled} aria-label="Toggle QR code payment" onClick={() => setConfigDraft({ ...configDraft, qrEnabled: !configDraft.qrEnabled })}
                    className={`w-11 h-6 rounded-full transition-all relative flex-shrink-0 ${configDraft.qrEnabled ? "bg-blue-600" : "bg-slate-300"}`}>
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${configDraft.qrEnabled ? "left-5" : "left-0.5"}`} />
                  </button>
                  <span className="text-sm text-slate-700 font-semibold">QR code payment enabled</span>
                </div>

                {configDraft.qrEnabled && (
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">Upload Payment QR</label>
                    <input type="file" accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 2 * 1024 * 1024) { setToast("QR image must be 2 MB or smaller."); return; }
                        const reader = new FileReader();
                        reader.onload = () => setConfigDraft({ ...configDraft, qrDataUrl: String(reader.result) });
                        reader.readAsDataURL(file);
                      }}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-slate-50 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-xs file:font-bold file:text-blue-700" />
                    <p className="text-[11px] text-slate-400 mt-1.5">PNG, JPEG or WebP · maximum 2 MB. Production storage should move this file to configured object storage.</p>
                  </div>
                )}

                <button onClick={saveConfig} className="flex items-center gap-2 bg-blue-600 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-all text-sm">
                  {configSaved ? <><CheckCircle size={14} />Saved!</> : <><Save size={14} />Save Settings</>}
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 mt-5">
                <p className="font-bold text-slate-700 text-sm mb-4">Customer Preview</p>
                <div className="bg-slate-50 rounded-xl p-5 flex flex-col items-center gap-3 text-center border border-dashed border-slate-200">
                  <div className="w-36 h-36 bg-white rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                    {configDraft.qrDataUrl ? <img src={configDraft.qrDataUrl} alt="Configured payment QR preview" className="w-full h-full object-contain" /> : <><QrCode size={36} className="text-slate-400 mb-1" /><p className="text-[10px] text-slate-400">No QR set</p></>}
                  </div>
                  <p className="font-bold text-slate-800">{configDraft.upiId}</p>
                  <p className="text-xs text-slate-500">{configDraft.accountName}</p>
                  <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">{configDraft.paymentInstructions}</p>
                </div>
              </div>
            </div>
          )}

          {/* AUDIT LOG */}
          {section === "logs" && (
            <div className="p-4 sm:p-6 max-w-5xl">
              <SectionHeader title="Audit Log" subtitle="Complete record of all admin actions" />
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-slate-100 bg-slate-50">
                      {["Timestamp","Action","Application","Admin","Details"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {auditLog.length === 0 && <tr><td colSpan={5}><EmptyState icon={Activity} title="No audit entries" body="Actions performed in the admin panel will be recorded here." /></td></tr>}
                      {auditLog.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-[11px] text-slate-400 whitespace-nowrap">{entry.timestamp}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{entry.action}</td>
                          <td className="px-4 py-3 font-mono text-[11px] text-blue-700">{entry.appId}</td>
                          <td className="px-4 py-3 text-slate-600">{entry.admin}</td>
                          <td className="px-4 py-3 text-slate-500 text-xs max-w-xs truncate">{entry.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECURITY */}
          {section === "security" && (
            <div className="p-4 sm:p-6 max-w-3xl">
              <SectionHeader title="Security" subtitle="Authentication and access control checklist" />
              {securityState === "loading" && <div className="bg-white rounded-2xl border border-slate-200 p-6 text-sm text-slate-500">Loading backend security status...</div>}
              {securityState !== "loading" && securityState !== "ready" && <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-900">{securityMessage || securityState.toUpperCase()}</div>}
              {securityData && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                {([["NEXORA", securityData.nexora.state], ["Account", securityData.account.enabled ? "ENABLED" : "DISABLED"], ["Recovery codes", String(securityData.recoveryCodes.remaining)], ["Active sessions", String(securityData.activeSessions.length)]] as [string,string][]).map(([label, value]) => <div key={label} className="bg-white rounded-2xl border border-slate-200 p-4"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p><p className="font-bold text-slate-800 mt-1">{value}</p></div>)}
                <div className="sm:col-span-2 flex gap-2"><button onClick={() => void securityApi.revokeOthers().then(() => securityApi.overview().then((result) => result.data && setSecurityData(result.data)))} className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700">Revoke other sessions</button><button onClick={() => void securityApi.revokeCurrent()} className="border border-red-200 rounded-xl px-3 py-2 text-xs font-bold text-red-700">Revoke current session</button><button onClick={() => void handleRegenerateRecoveryCodes()} className="border border-blue-200 rounded-xl px-3 py-2 text-xs font-bold text-blue-700">Regenerate Recovery Codes</button></div>
              </div>}
              <div className="space-y-4">
                {([
                  ["Admin Authentication", "Backend API", "Password verification and challenge issuance are server-side.", true],
                  ["Two-Factor Auth (TOTP)", "Backend API", "NEXORA verification is server-side; activation still requires configured NEXORA service.", true],
                  ["Session Management", "HttpOnly cookie", "Sessions are persisted server-side and revocable through the Security Center API.", true],
                  ["Password Security", "Server-side", "bcrypt hashing and peppered verification are kept outside the frontend.", true],
                  ["Document Privacy", "Architecture ready", "Documents must be served via private signed URLs. Connect to S3-compatible storage.", false],
                  ["Rate Limiting", "Auth protected", "Login, TOTP, and recovery attempts are rate limited server-side.", true],
                  ["Audit Logging", "Backend persistence", "Authentication, session, admin, role, and NEXORA security actions are audited server-side.", true],
                  ["Admin Notes Separation", "Implemented", "Admin notes (internal) and customer messages are strictly separated in the data model.", true],
                ] as [string,string,string,boolean][]).map(([title, status, detail, ready]) => (
                  <div key={title} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 flex items-start gap-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${ready ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"}`}>
                      {ready ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-bold text-slate-800 text-sm">{title}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ready ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{status}</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === "nexora" && (
            <div className="p-4 sm:p-6 max-w-3xl">
              <SectionHeader title="NEXORA Authenticator" subtitle="Server-controlled enrollment and verification" />
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                <div className="flex items-center justify-between"><span className="text-sm font-bold text-slate-700">Enrollment state</span><span className="text-xs font-black px-2 py-1 rounded-full bg-slate-100 text-slate-700">{enrollment?.state || "NOT_ENROLLED"}</span></div>
                {!enrollment && <button onClick={() => void handleGenerateEnrollment()} className="flex items-center gap-2 bg-blue-600 text-white rounded-xl px-4 py-2.5 text-sm font-bold"><QrCode size={15} />Generate Enrollment QR</button>}
                {enrollment && <>
                  <p className="text-xs text-slate-500">Expires {new Date(enrollment.expiresAt).toLocaleString()}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                      <p className="text-xs font-bold text-slate-700 mb-2">Approved NEXORA payload</p>
                      <div className="flex items-center justify-center min-h-[180px] rounded-xl bg-white border border-slate-200">
                        {enrollmentQrDataUrl ? <img src={enrollmentQrDataUrl} alt="NEXORA enrollment QR" className="w-44 h-44 object-contain" /> : <span className="text-xs text-slate-500">QR unavailable</span>}
                      </div>
                      <p className="text-[11px] text-slate-500 break-all mt-2">Enrollment ID: {enrollment.enrollmentId}</p>
                      <p className="text-[11px] text-slate-500 break-all">Token: {enrollmentQrToken ? "opaque token held for enrollment" : "not available"}</p>
                      <p className="text-[11px] text-slate-400 mt-2">Raw TOTP secrets are never included.</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                      <p className="text-xs font-black uppercase">Scan instructions</p>
                      <p className="text-xs text-slate-600">Open the NEXORA Authenticator, scan the QR image, then verify the code shown below.</p>
                      <div className="flex gap-2"><input value={enrollmentOtp} onChange={(event) => setEnrollmentOtp(event.target.value)} placeholder="6-digit TOTP" inputMode="numeric" maxLength={6} className="border border-slate-200 rounded-xl px-3 py-2 text-sm" /><button onClick={() => void securityApi.verifyEnrollment(enrollment.enrollmentId, enrollmentOtp).then((result) => { if (result.data) { setEnrollment({ ...enrollment, state: result.data.state }); setEnrollmentOtp(""); } else setToast(result.message || "Verification failed."); })} className="bg-green-600 text-white rounded-xl px-4 py-2 text-sm font-bold">Verify</button></div>
                      <button onClick={() => void securityApi.enrollmentStatus(enrollment.enrollmentId).then((result) => result.data && setEnrollment({ ...enrollment, state: result.data.state, expiresAt: result.data.expiresAt }))} className="text-xs font-bold text-blue-700">Refresh enrollment state</button>
                      <div className="text-xs text-slate-500">State: {enrollment.state || "PENDING"}</div>
                    </div>
                  </div>
                </>}
              </div>
            </div>
          )}

          {section === "admins" && (
            <div className="p-4 sm:p-6 max-w-5xl">
              <SectionHeader title="Admin Management" subtitle="Backend-managed administrator accounts" />
              <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} className="border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="Email" />
                  <input value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} className="border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="Password (12+ chars)" type="password" />
                  <select value={adminForm.role} onChange={(e) => setAdminForm({ ...adminForm, role: e.target.value })} className="border border-slate-200 rounded-xl px-3 py-2 text-sm">
                    <option value="OPERATIONS_ADMIN">OPERATIONS_ADMIN</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  </select>
                  <button onClick={() => void adminManagementApi.create(adminForm).then((result) => { if (result.state === "ok") { setAdminsMessage("Admin created."); setAdminForm({ email: "", password: "", role: "OPERATIONS_ADMIN" }); return adminManagementApi.list(); } else { setAdminsMessage(result.message || "Create admin failed."); return Promise.resolve(); } }).then((result) => { if (result?.state === "ok" && result.data) setAdmins(result.data.items); })} className="bg-blue-600 text-white rounded-xl px-4 py-2 text-sm font-bold">Create Admin</button>
                </div>
              </div>
              {adminsState === "loading" && <div className="text-sm text-slate-500">Loading administrators...</div>}
              {adminsState !== "loading" && adminsState !== "ready" && <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">{adminsMessage || adminsState.toUpperCase()}</div>}
              {adminsState === "ready" && <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden"><table className="w-full text-sm"><thead><tr className="bg-slate-50 border-b border-slate-100"><th className="text-left px-4 py-3">Email</th><th className="text-left px-4 py-3">Role</th><th className="text-left px-4 py-3">NEXORA</th><th className="text-left px-4 py-3">Status</th><th className="text-left px-4 py-3">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{admins.map((admin) => <tr key={admin.id}><td className="px-4 py-3">{admin.email}</td><td className="px-4 py-3"><select value={admin.role} onChange={(e) => void adminManagementApi.update(admin.id, { role: e.target.value }).then((res) => { if (res.state === "ok") adminManagementApi.list().then((result) => result.data && setAdmins(result.data.items)); })} className="border border-slate-200 rounded-lg px-2 py-1">
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option><option value="OPERATIONS_ADMIN">OPERATIONS_ADMIN</option></select></td><td className="px-4 py-3">{admin.nexoraState}</td><td className="px-4 py-3">{admin.enabled ? "ENABLED" : "DISABLED"}</td><td className="px-4 py-3"><button onClick={() => void (admin.enabled ? adminManagementApi.disable(admin.id) : adminManagementApi.enable(admin.id)).then(() => adminManagementApi.list().then((result) => result.data && setAdmins(result.data.items)))} className="text-xs font-bold text-blue-700">{admin.enabled ? "Disable" : "Enable"}</button></td></tr>)}</tbody></table></div>}
            </div>
          )}

          {/* SETTINGS */}
          {section === "settings" && (
            <div className="p-4 sm:p-6 max-w-2xl">
              <SectionHeader title="Settings" subtitle="Mandatory admin authentication and platform controls" />
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-4">
                <div className="flex items-start gap-3"><ShieldCheck size={18} className="text-blue-600 mt-0.5" /><div><p className="font-bold text-blue-900 text-sm">NEXORA Authenticator is mandatory</p><p className="text-xs text-blue-800 mt-1 leading-relaxed">Every admin sign-in requires a current time-based one-time password after email and password verification. The secret and validation must remain server-side in production.</p></div></div>
              </div>
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
                  <h3 className="font-bold text-slate-800 text-sm mb-4">Platform Information</h3>
                  <div className="space-y-2">
                    {([["Platform","DigiSeva Admin"],["Version","Production frontend foundation"],["Data Mode","Backend API required for persistence"],["Auth Mode","Email + password + NEXORA TOTP"],["Authenticator","NEXORA Authenticator"],["Admin Session","Secure server session after backend integration"]] as [string,string][]).map(([k,v]) => (
                      <div key={k} className="flex justify-between text-sm py-2 border-b border-slate-100 last:border-0">
                        <span className="text-slate-500 font-medium">{k}</span>
                        <span className="text-slate-800 font-semibold">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
                  <h3 className="font-bold text-slate-800 text-sm mb-2">Backend Requirements</h3>
                  <p className="text-xs text-slate-500 mb-4 leading-relaxed">The following backend infrastructure is required for production deployment:</p>
                  <div className="space-y-1.5">
                    {["REST API / GraphQL backend (Node.js / Python / Go)","PostgreSQL / MySQL database","S3-compatible object storage for documents","Redis for sessions and rate limiting","SMTP / SMS / WhatsApp notification service","Real TOTP 2FA (server-side secret storage)","Secure httpOnly cookie-based sessions","CI/CD pipeline + environment secrets management"].map((item) => (
                      <div key={item} className="flex items-start gap-2 text-xs text-slate-600">
                        <ChevronRight size={12} className="text-slate-400 flex-shrink-0 mt-0.5" />{item}
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 text-sm font-semibold hover:text-red-700 transition-colors pt-2">
                  <LogOut size={15} />Sign out of Admin
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
