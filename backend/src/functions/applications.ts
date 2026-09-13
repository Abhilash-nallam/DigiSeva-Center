import { createHash } from "node:crypto";
import { ApiError } from "../shared/errors.js";
import { audit } from "../shared/audit.js";
import { createDocument, listDocuments, Query } from "../shared/database.js";
import { sha256 } from "../shared/security.js";
import type { HttpRequest, HttpResponse } from "../shared/http.js";
import { json } from "../shared/http.js";

interface Application { $id: string; applicationId: string; serviceId: string; serviceVersion: number; customerRef: string; status: string; paymentStatus: string; jurisdiction: string; customerMobileHash: string; }

function ownership(body: unknown, application: Application): void { const mobile = (body as { mobile?: string }).mobile?.trim(); if (!mobile || sha256(mobile) !== application.customerMobileHash) throw new ApiError("NOT_FOUND", "Application not found.", 404); }

export async function createApplication(request: HttpRequest): Promise<HttpResponse> {
  const body = request.body as { serviceId?: string; serviceVersion?: number; jurisdiction?: string; customer?: { name?: string; mobile?: string; email?: string }; documents?: string[] };
  if (!body.serviceId || !body.jurisdiction || !body.customer?.name || !body.customer.mobile || !body.customer.email || !body.documents?.length) throw new ApiError("VALIDATION_ERROR", "Required application details are missing.");
  const services = await listDocuments<{ serviceId: string; version: number; active: boolean; governmentFeePaise: number; digiSevaFeePaise: number; otherChargesPaise?: number }>("services", [Query.equal("serviceId", body.serviceId), Query.equal("active", true)], 1);
  const service = services.items[0]; if (!service || (body.serviceVersion && body.serviceVersion !== service.version)) throw new ApiError("VALIDATION_ERROR", "The selected service version is unavailable.");
  const customerRef = sha256(body.customer.mobile); const applicationId = `DS-${new Date().getUTCFullYear()}-${createHash("sha256").update(`${customerRef}:${Date.now()}:${body.serviceId}`).digest("hex").slice(0, 12).toUpperCase()}`;
  const now = new Date().toISOString(); const application = await createDocument("applications", { applicationId, serviceId: service.serviceId, serviceVersion: service.version, customerRef, customerMobileHash: customerRef, status: "SUBMITTED", paymentStatus: "UNINITIATED", jurisdiction: body.jurisdiction, createdAt: now, updatedAt: now, completedAt: null, governmentFeePaise: service.governmentFeePaise, digiSevaFeePaise: service.digiSevaFeePaise, otherChargesPaise: service.otherChargesPaise || 0 });
  await createDocument("application_events", { applicationRef: application.$id, type: "SUBMITTED", actorRef: customerRef, payload: {}, createdAt: now });
  await audit("application.created", "SUCCESS", request.headers.get("x-request-id") || "unknown", undefined, "application", application.$id);
  return json(201, { applicationId, status: application.status });
}

export async function track(request: HttpRequest, applicationId: string): Promise<HttpResponse> {
  const apps = await listDocuments<Application>("applications", [Query.equal("applicationId", applicationId)], 1); const application = apps.items[0]; if (!application) throw new ApiError("NOT_FOUND", "Application not found.", 404); ownership(request.body, application); return json(200, { found: true, application });
}

export async function getApplication(request: HttpRequest, applicationId: string): Promise<HttpResponse> {
  const apps = await listDocuments<Application>("applications", [Query.equal("applicationId", applicationId)], 1); const application = apps.items[0]; if (!application) throw new ApiError("NOT_FOUND", "Application not found.", 404); ownership(request.body, application); return json(200, { application });
}
