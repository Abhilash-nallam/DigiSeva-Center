import { detectIntent, detectLanguage } from "./intents";
import { updateConversationContext } from "./conversationContext";
import { getKnowledgeOrigin, retrieveKnowledge } from "./knowledge";
import { buildResponse } from "./responseBuilder";
import { matchServices } from "./serviceMatcher";
import { resolveJurisdiction } from "./stateResolver";
import { detectSensitiveRequest, sanitizeContext } from "./security";
import { requiresVerification, verifySource } from "./sourceVerifier";
import type { AIResponse, ConversationContext, ServiceKnowledge } from "./types";

export function createServiceKnowledge(catalog: readonly { id: string; title: string; tags: string[]; category: string; badge: string; desc: string; fee: string; digiSevaFee?: string; time: string; docs: string[]; steps: readonly { label: string }[] }[]): ServiceKnowledge[] {
  return catalog.map((service) => ({ id: service.id, name: service.title, aliases: [], tags: service.tags, category: service.category, authority: service.badge, description: service.desc, documents: service.docs, governmentFee: service.fee, digiSevaFee: service.digiSevaFee, estimatedTime: service.time, steps: service.steps.map((step) => step.label), jurisdiction: service.category === "utility" ? "provider" : ["certificates", "transport", "welfare", "business"].includes(service.category) ? "state" : "central" }));
}

export function orchestrate(message: string, catalog: ServiceKnowledge[], context: ConversationContext = {}): AIResponse {
  const safeMessage = message.trim();
  const securityError = detectSensitiveRequest(safeMessage);
  const language = detectLanguage(safeMessage);
  const detection = detectIntent(safeMessage);
  const applicantType = safeMessage.match(/\b(student|farmer|senior citizen|widow|business owner|employer|tenant|property owner)\b/i)?.[1];
  const purpose = safeMessage.match(/\b(?:for|to)\s+(scholarship|employment|admission|renewal|travel|business|education)\b/i)?.[1];
  const nextContext = updateConversationContext(sanitizeContext(context), { language, applicationStage: detection.stage, applicantType, purpose });
  if (securityError) return { intent: detection.intent, jurisdiction: { type: "central", needsState: false }, answer: securityError.message, actions: [], confidence: "high", knowledgeOrigin: "unverified", sources: [], error: securityError, context: nextContext };
  if (/\b(are you|is digiseva)\b.*\b(government|official)\b/i.test(safeMessage)) return { intent: "general", jurisdiction: { type: "central", needsState: false }, answer: "DigiSeva is an independent digital service assistance platform, not a government department or official government portal.", actions: [], confidence: "high", knowledgeOrigin: "unverified", sources: [], context: nextContext };
  if (/\b(is my application approved|has my application been approved|application approved)\b/i.test(safeMessage)) return { intent: "tracking", jurisdiction: { type: "central", needsState: false }, answer: "I couldn't retrieve the latest application status. Enter your Application ID and registered mobile number in Track Application.", nextAction: "Open Track Application and enter both details.", actions: [{ type: "TRACK_APPLICATION", label: "Track Application", available: true }], confidence: "low", knowledgeOrigin: "unverified", sources: [], context: nextContext };
  if (detection.intent === "greeting") return { intent: detection.intent, jurisdiction: { type: "central", needsState: false }, answer: "Namaste! Tell me what you want to apply for, update or track, and I will guide you.", actions: [], confidence: "high", knowledgeOrigin: "unverified", sources: [], context: nextContext };
  const matches = matchServices(safeMessage, catalog, context.serviceId);
  const contextualService = context.serviceId ? catalog.find((service) => service.id === context.serviceId) : undefined;
  const match = matches[0] ?? (contextualService ? { service: contextualService, score: 4, reasons: ["conversation context"] } : undefined);
  const jurisdiction = resolveJurisdiction(safeMessage, context, Boolean(match && match.service.jurisdiction === "state"));
  const knowledge = retrieveKnowledge(match?.service);
  const verification = requiresVerification(detection.intent) ? verifySource(match?.service) : { confidence: knowledge.confidence, verified: false };
  const result = buildResponse(detection.intent, match, { ...knowledge, confidence: verification.confidence, source: verification.source }, jurisdiction, context.applicationStage, safeMessage);
  const finalContext = updateConversationContext(nextContext, { state: jurisdiction.state, district: jurisdiction.district, serviceId: match?.service.id, serviceType: match?.service.category });
  return { intent: detection.intent, service: match, jurisdiction, answer: result.answer, nextAction: result.nextAction, actions: result.actions, confidence: result.confidence, knowledgeOrigin: getKnowledgeOrigin(match?.service), sources: verification.source ? [verification.source] : [], context: finalContext };
}
