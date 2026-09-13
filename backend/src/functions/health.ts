import { integrationState } from "../shared/config.js";
import type { HttpResponse } from "../shared/http.js";
import { json } from "../shared/http.js";

export function health(): HttpResponse {
  return json(200, { database: integrationState([process.env.APPWRITE_ENDPOINT, process.env.APPWRITE_API_KEY, process.env.APPWRITE_DATABASE_ID]), storage: integrationState([process.env.APPWRITE_ENDPOINT, process.env.APPWRITE_API_KEY, process.env.APPWRITE_DOCUMENTS_BUCKET_ID]), nexora: integrationState([process.env.NEXORA_BASE_URL, process.env.NEXORA_SERVICE_TOKEN]), paymentProvider: integrationState([process.env.PAYMENT_PROVIDER, process.env.PAYMENT_PROVIDER_KEY, process.env.PAYMENT_WEBHOOK_SECRET]), notifications: integrationState([process.env.NOTIFICATION_PROVIDER, process.env.NOTIFICATION_PROVIDER_TOKEN]), malwareScanner: integrationState([process.env.MALWARE_SCANNER_URL, process.env.MALWARE_SCANNER_TOKEN]), checkedAt: new Date().toISOString() });
}
