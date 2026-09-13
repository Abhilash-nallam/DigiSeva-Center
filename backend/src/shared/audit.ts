import { createDocument } from "./database.js";
import type { AdminSession } from "./models.js";

export async function audit(action: string, result: "SUCCESS" | "FAILURE", requestId: string, actor?: AdminSession, resourceType?: string, resourceId?: string, metadata: Record<string, unknown> = {}): Promise<void> {
  await createDocument("audit_logs", { actorRef: actor?.adminId || "system", actorRole: actor?.role || "SYSTEM", action, resourceType: resourceType || "system", resourceId: resourceId || "", timestamp: new Date().toISOString(), result, metadata, requestId });
}
