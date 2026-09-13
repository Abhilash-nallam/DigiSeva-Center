import { createHash } from "node:crypto";
import { ApiError } from "../shared/errors.js";
import { createDocument, listDocuments } from "../shared/database.js";
import { createAppwrite, ID } from "../shared/database.js";
import { assertUpload, validateUploadName, sha256 } from "../shared/security.js";
import type { HttpRequest, HttpResponse } from "../shared/http.js";
import { json } from "../shared/http.js";

export async function upload(request: HttpRequest): Promise<HttpResponse> {
  const body = request.body as { applicationId?: string; mobile?: string; type?: string; filename?: string; mimeType?: string; contentBase64?: string };
  if (!body.applicationId || !body.mobile || !body.type || !body.filename || !body.mimeType || !body.contentBase64) throw new ApiError("VALIDATION_ERROR", "Document upload fields are required.");
  const applications = await listDocuments<{ applicationId: string; customerRef: string; customerMobileHash: string }>("applications", [], 100); const application = applications.items.find((item) => item.applicationId === body.applicationId && item.customerMobileHash === sha256(body.mobile!)); if (!application) throw new ApiError("NOT_FOUND", "Application not found.", 404);
  const filename = validateUploadName(body.filename); const content = Buffer.from(body.contentBase64, "base64"); assertUpload(body.mimeType, filename, content.byteLength);
  const config = createAppwrite(); const file = await config.storage.createFile(config.config.appwrite.documentsBucketId, ID.unique(), new File([content], filename, { type: body.mimeType }));
  const checksum = createHash("sha256").update(content).digest("hex"); const document = await createDocument("application_documents", { applicationRef: application.$id, customerRef: application.customerRef, type: body.type, storageId: file.$id, originalFilename: filename, mimeType: body.mimeType, size: content.byteLength, checksum, status: config.config.malwareScanner.url ? "under_review" : "reupload_required", uploadedAt: new Date().toISOString(), scanState: config.config.malwareScanner.url ? "QUEUED" : "CONFIGURATION_REQUIRED" });
  return json(201, { documentId: document.$id, status: document.status, scanState: document.scanState });
}
