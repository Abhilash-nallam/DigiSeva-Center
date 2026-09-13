import type { ConfidenceLevel, ServiceKnowledge, SourceReference } from "./types";

export function requiresVerification(intent: string): boolean {
  return ["eligibility", "documents", "fees", "timeline", "application", "renewal", "welfare"].includes(intent);
}

export function verifySource(service: ServiceKnowledge | undefined): { source?: SourceReference; confidence: ConfidenceLevel; verified: boolean } {
  if (!service?.source) return { confidence: "low", verified: false };
  return { source: service.source, confidence: service.source.official ? "high" : "low", verified: service.source.official };
}
