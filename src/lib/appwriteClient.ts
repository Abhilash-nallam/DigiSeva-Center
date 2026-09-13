/**
 * Appwrite integration boundary.
 * Public Vite variables contain identifiers only. Appwrite API keys and TOTP
 * secrets must remain inside Appwrite Functions or the private backend.
 */
export interface AppwriteConfig {
  endpoint: string;
  projectId: string;
  databaseId: string;
  applicationsCollectionId: string;
  servicesCollectionId: string;
  paymentsCollectionId: string;
  documentsBucketId: string;
}

export function getAppwriteConfig(): AppwriteConfig | null {
  const values = {
    endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT,
    projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
    databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,
    applicationsCollectionId: import.meta.env.VITE_APPWRITE_APPLICATIONS_COLLECTION_ID,
    servicesCollectionId: import.meta.env.VITE_APPWRITE_SERVICES_COLLECTION_ID,
    paymentsCollectionId: import.meta.env.VITE_APPWRITE_PAYMENTS_COLLECTION_ID,
    documentsBucketId: import.meta.env.VITE_APPWRITE_DOCUMENTS_BUCKET_ID,
  };
  return Object.values(values).every(Boolean) ? values as AppwriteConfig : null;
}

export function isBackendConfigured(): boolean {
  return Boolean(import.meta.env.VITE_API_BASE_URL || getAppwriteConfig());
}

export async function backendRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  if (!baseUrl) throw new Error("DigiSeva backend is not configured.");
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error || `Backend request failed (${response.status}).`);
  }
  return response.json() as Promise<T>;
}
