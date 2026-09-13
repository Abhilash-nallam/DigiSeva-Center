/**
 * DigiSeva API boundary.
 *
 * Development currently reads the single in-memory application store so the
 * customer tracking surface and Admin surface share one dataset. Production
 * must replace these adapters with authenticated HTTP calls to the DigiSeva
 * backend. There is intentionally NO legacy mock-data fallback.
 */
import { getApplicationById } from "../data/store";
import { backendRequest } from "../lib/appwriteClient";
import type { Application, ApplicationStatus, TrackRequest, TrackResponse, ApplicationDocument, TimelineEvent } from "../types";

const SIMULATED_DELAY_MS = 350;
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function mapStoreStatus(s: string): ApplicationStatus {
  const map: Record<string, ApplicationStatus> = {
    "Application Submitted": "Pending",
    "Documents Under Review": "Pending",
    "Documents Verified": "Verified",
    "Payment Pending": "Pending",
    "Payment Verified": "Verified",
    "Application Processing": "Processing",
    "Additional Info Required": "Pending",
    "Submitted to Department": "Government Review",
    "Completed": "Completed",
    "Rejected": "Rejected",
    "Cancelled": "Cancelled",
    "On Hold": "Pending",
  };
  return map[s] ?? "Pending";
}

function mapDocStatus(s: string): "uploaded" | "pending" | "rejected" {
  if (s === "verified" || s === "uploaded") return "uploaded";
  if (s === "rejected" || s === "reupload_required") return "rejected";
  return "pending";
}

function toApplication(storeApp: NonNullable<ReturnType<typeof getApplicationById>>): Application {
  return {
    id: storeApp.id,
    service: storeApp.serviceName,
    category: storeApp.category,
    appliedDate: storeApp.appliedAt,
    expectedCompletion: "As per department timeline",
    status: mapStoreStatus(storeApp.status),
    fee: storeApp.totalAmount,
    receiptNo: storeApp.id,
    remarks: storeApp.customerMessage,
    applicant: {
      name: storeApp.customerName,
      mobile: storeApp.customerMobile,
      email: storeApp.customerEmail,
      dob: storeApp.dob,
      address: storeApp.address,
    },
    timeline: storeApp.timeline.map((t, i) => ({
      stage: `step_${i}`,
      label: t.action,
      description: t.action,
      date: t.date,
      completed: true,
      active: i === storeApp.timeline.length - 1,
    })),
    documents: storeApp.documents.map((d) => ({
      name: d.name,
      status: mapDocStatus(d.status),
      uploadedAt: d.uploadedAt,
      fileSize: d.fileSize,
    })),
  };
}

/**
 * Customer tracking.
 * Production backend MUST enforce both applicationId and full registered
 * mobile verification server-side. The client check is only UX validation.
 */
export async function getApplication(req: TrackRequest): Promise<TrackResponse> {
  await delay(SIMULATED_DELAY_MS);
  const id = req.applicationId.trim().toUpperCase();
  const mobile = req.mobile.trim();
  if (!id || !mobile) return { found: false, error: "Application ID and registered mobile number are required." };

  if (!import.meta.env.DEV || import.meta.env.VITE_API_BASE_URL) {
    try {
      return await backendRequest<TrackResponse>(`/api/applications/${encodeURIComponent(id)}/tracking`, {
        method: "POST",
        body: JSON.stringify({ mobile }),
      });
    } catch (error) {
      return { found: false, error: error instanceof Error ? error.message : "Application service is unavailable." };
    }
  }

  const storeApp = getApplicationById(id, mobile);
  if (!storeApp) return { found: false, error: "No application found with these details." };
  return { found: true, application: toApplication(storeApp) };
}

export async function getTimeline(applicationId: string, mobile: string): Promise<TimelineEvent[]> {
  if (!import.meta.env.DEV || import.meta.env.VITE_API_BASE_URL) {
    const response = await backendRequest<{ timeline: TimelineEvent[] }>(`/api/applications/${encodeURIComponent(applicationId.trim().toUpperCase())}/timeline`, {
      method: "POST",
      body: JSON.stringify({ mobile: mobile.trim() }),
    });
    return response.timeline;
  }
  const app = getApplicationById(applicationId.trim().toUpperCase(), mobile);
  return app ? toApplication(app).timeline : [];
}

export async function getDocuments(applicationId: string, mobile: string): Promise<ApplicationDocument[]> {
  if (!import.meta.env.DEV || import.meta.env.VITE_API_BASE_URL) {
    const response = await backendRequest<{ documents: ApplicationDocument[] }>(`/api/applications/${encodeURIComponent(applicationId.trim().toUpperCase())}/documents`, {
      method: "POST",
      body: JSON.stringify({ mobile: mobile.trim() }),
    });
    return response.documents;
  }
  const app = getApplicationById(applicationId.trim().toUpperCase(), mobile);
  return app ? toApplication(app).documents : [];
}

/** Receipt boundary. The URL must be a short-lived, authorized backend URL. */
export async function getReceipt(applicationId: string, mobile: string): Promise<{ receiptNo: string; url: string }> {
  if (!import.meta.env.DEV || import.meta.env.VITE_API_BASE_URL) {
    return backendRequest<{ receiptNo: string; url: string }>(`/api/applications/${encodeURIComponent(applicationId.trim().toUpperCase())}/receipt`, {
      method: "POST",
      body: JSON.stringify({ mobile: mobile.trim() }),
    });
  }
  const app = getApplicationById(applicationId.trim().toUpperCase(), mobile);
  return app ? { receiptNo: app.id, url: "" } : { receiptNo: "", url: "" };
}

/** Refresh status from the server; this endpoint never mutates application state. */
export async function updateStatus(applicationId: string, mobile: string): Promise<Application | null> {
  if (!import.meta.env.DEV || import.meta.env.VITE_API_BASE_URL) {
    return backendRequest<Application>(`/api/applications/${encodeURIComponent(applicationId.trim().toUpperCase())}/status`, {
      method: "POST",
      body: JSON.stringify({ mobile: mobile.trim() }),
    });
  }
  const app = getApplicationById(applicationId.trim().toUpperCase(), mobile);
  return app ? toApplication(app) : null;
}
