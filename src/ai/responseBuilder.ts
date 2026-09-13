import type { AIAction, AIIntent, ConfidenceLevel, JurisdictionResolution, KnowledgeResult, ServiceMatch } from "./types";

function actions(service: ServiceMatch | undefined, intent: AIIntent): AIAction[] {
  const serviceId = service?.service.id;
  if (intent === "tracking") return [{ type: "TRACK_APPLICATION", label: "Track Application", available: true }];
  if (intent === "payment") return [{ type: "PAYMENT_HELP", label: "Payment Help", available: true }];
  if (!serviceId) return [{ type: "CONTACT_SUPPORT", label: "Contact Support", available: true }];
  return [{ type: "START_APPLICATION", label: "Start Application", serviceId, available: true }, { type: "VIEW_DOCUMENTS", label: "View Documents", serviceId, available: true }, { type: "CHECK_ELIGIBILITY", label: "Check Eligibility", serviceId, available: true }];
}

export function buildResponse(intent: AIIntent, match: ServiceMatch | undefined, knowledge: KnowledgeResult, jurisdiction: JurisdictionResolution, previousStage?: string, currentMessage = ""): { answer: string; nextAction?: string; actions: AIAction[]; confidence: ConfidenceLevel } {
  if (jurisdiction.needsState) return { answer: "Which state are you applying from?", nextAction: "Provide your state so I can give the correct authority and procedure.", actions: [], confidence: "low" };
  if (!match || !knowledge.service) {
    const followUp = intent === "documents" ? "Sure. Which service are you applying for documents?" : intent === "fees" ? "Sure. Which service do you want the fee for?" : intent === "timeline" ? "Sure. Which service do you want the processing time for?" : intent === "application" ? "Sure. Which service would you like to apply for?" : intent === "eligibility" ? "Sure. Which service would you like to check eligibility for?" : "I couldn't identify a DigiSeva service from that request. Please tell me the service or goal, such as PAN card, passport renewal, income certificate, PM-KISAN or electricity connection.";
    return { answer: followUp, actions: actions(undefined, intent), confidence: "low" };
  }
  const service = knowledge.service;
  if (intent === "tracking") return { answer: "To protect your application, tracking requires both your Application ID and registered mobile number. I can show the latest available status after both details are entered in Track Application.", nextAction: "Open Track Application and enter both details.", actions: actions(match, intent), confidence: "low" };
  if (intent === "payment") return { answer: "Use the DigiSeva QR / UPI instructions or Pay Later option shown in the payment step. Never share an OTP, UPI PIN, CVV or bank password in chat.", nextAction: "Open the payment step or contact DigiSeva support for a failed payment.", actions: actions(match, intent), confidence: "medium" };
  if (intent === "documents") {
    if (service.id === "driving" && previousStage !== "renewal" && previousStage !== "correction" && !/renew|expired|duplicate|lost|learner|permanent|fresh|new/i.test(currentMessage)) return { answer: "Are you applying for a new, learner, permanent, renewal, or duplicate Driving Licence? The document checklist depends on that choice and your state.", nextAction: "Tell me the licence type or workflow.", actions: [], confidence: "low" };
    if (knowledge.confidence === "low") return { answer: `I couldn't verify the current document requirements for ${service.name} from an authoritative source yet. The active DigiSeva catalog has a checklist, but it should not be treated as official. Check the responsible authority's current checklist or contact DigiSeva support.`, nextAction: "Check the official checklist before submission.", actions: actions(match, intent), confidence: "low" };
    const source = knowledge.source?.official && knowledge.source.source ? `\n\nOfficial source: ${knowledge.source.source}` : "";
    return { answer: `Official source documents for ${service.name}:${source}\n${(service.documents ?? []).map((document) => `- ${document}`).join("\n") || "- No verified checklist is available."}`, nextAction: "Check the official checklist before submission.", actions: actions(match, intent), confidence: knowledge.confidence };
  }
  const fee = knowledge.confidence === "low" ? "Government: I couldn't verify the current fee from an authoritative source.\nDigiSeva: Not configured" : `Government: ${service.governmentFee ?? "Not configured"}\nDigiSeva: ${service.digiSevaFee ?? "Not configured"}`;
  const detail = intent === "fees" ? `Fees for ${service.name}:\n${fee}` : intent === "timeline" ? `Estimated time for ${service.name}: ${service.estimatedTime ?? "Not configured"}. Government processing is not guaranteed.` : `${service.description ?? service.name}\n\nDocuments:\n${(service.documents ?? []).map((document) => `- ${document}`).join("\n") || "- Check the official checklist."}\n\nFees:\n${fee}\n\nEstimated time: ${service.estimatedTime ?? "Not configured"}`;
  const caveat = knowledge.confidence === "low" ? "\n\nI couldn't verify that requirement from an authoritative source yet. Check the official authority or contact DigiSeva support." : "\n\nFinal eligibility and approval depend on the competent authority.";
  const source = knowledge.source?.official && knowledge.source.source ? `\n\nOfficial source: ${knowledge.source.source}` : "";
  return { answer: detail + caveat + source, nextAction: `Open ${service.name} details when you are ready.`, actions: actions(match, intent), confidence: knowledge.confidence };
}
