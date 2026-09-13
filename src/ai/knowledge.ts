import type { KnowledgeOrigin, KnowledgeResult, ServiceKnowledge } from "./types";

export function getKnowledgeOrigin(service: ServiceKnowledge | undefined): KnowledgeOrigin {
  if (service?.source?.official) return "official";
  if (service) return "catalog";
  return "unverified";
}

export function retrieveKnowledge(service: ServiceKnowledge | undefined): KnowledgeResult {
  if (!service) return { confidence: "low", notes: ["No matching service was found in the active DigiSeva catalog."] };
  return { service, confidence: service.source?.official ? "high" : "low", source: service.source, notes: [getKnowledgeOrigin(service) === "official" ? "Details are from an official source." : "Details are from the DigiSeva catalog and are not official verification."] };
}
