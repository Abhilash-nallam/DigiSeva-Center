export type IntegrationState = "CONNECTED" | "CONFIGURATION_REQUIRED" | "DEGRADED" | "DISABLED";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`CONFIGURATION_REQUIRED: ${name}`);
  return value;
}

export function loadConfig() {
  return {
    appwrite: {
      endpoint: required("APPWRITE_ENDPOINT"),
      projectId: required("APPWRITE_PROJECT_ID"),
      apiKey: required("APPWRITE_API_KEY"),
      databaseId: required("APPWRITE_DATABASE_ID"),
      documentsBucketId: required("APPWRITE_DOCUMENTS_BUCKET_ID"),
    },
    sessionCookieName: process.env.SESSION_COOKIE_NAME?.trim() || "ds_admin_session",
    sessionSigningSecret: required("SESSION_SIGNING_SECRET"),
    passwordPepper: required("PASSWORD_PEPPER"),
    allowedOrigins: (process.env.ALLOWED_ORIGINS || "").split(",").map((value) => value.trim()).filter(Boolean),
    nexora: { baseUrl: process.env.NEXORA_BASE_URL?.trim(), serviceToken: process.env.NEXORA_SERVICE_TOKEN?.trim(), tenant: process.env.NEXORA_TENANT?.trim(), callbackId: process.env.NEXORA_CALLBACK_ID?.trim() },
    payment: { provider: process.env.PAYMENT_PROVIDER?.trim(), baseUrl: process.env.PAYMENT_PROVIDER_BASE_URL?.trim(), key: process.env.PAYMENT_PROVIDER_KEY?.trim(), webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET?.trim() },
    notifications: { provider: process.env.NOTIFICATION_PROVIDER?.trim(), url: process.env.NOTIFICATION_PROVIDER_URL?.trim(), token: process.env.NOTIFICATION_PROVIDER_TOKEN?.trim() },
    malwareScanner: { url: process.env.MALWARE_SCANNER_URL?.trim(), token: process.env.MALWARE_SCANNER_TOKEN?.trim() },
  };
}

export function integrationState(values: Array<string | undefined>): IntegrationState {
  return values.every(Boolean) ? "CONNECTED" : "CONFIGURATION_REQUIRED";
}
