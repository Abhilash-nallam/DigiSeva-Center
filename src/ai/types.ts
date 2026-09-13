export type AIIntent =
  | "greeting" | "service_discovery" | "eligibility" | "documents" | "fees"
  | "timeline" | "application" | "payment" | "tracking" | "action_required"
  | "correction" | "renewal" | "complaint" | "insurance" | "loan" | "welfare"
  | "business" | "utility" | "education" | "support" | "general" | "unknown";

export type Jurisdiction = "central" | "state" | "district" | "municipal" | "panchayat" | "department" | "provider";
export type ConfidenceLevel = "high" | "medium" | "low";
export type KnowledgeOrigin = "catalog" | "official" | "unverified";
export type ApplicationStage = "exploring" | "eligibility" | "documents" | "application" | "payment" | "tracking" | "correction" | "renewal" | "complaint" | "support";

export interface ServiceKnowledge {
  id: string;
  name: string;
  aliases: string[];
  tags: string[];
  category: string;
  authority?: string;
  jurisdiction?: Jurisdiction;
  description?: string;
  eligibility?: string[];
  documents?: string[];
  governmentFee?: string;
  digiSevaFee?: string;
  otherCharges?: string[];
  estimatedTime?: string;
  steps?: string[];
  officialPortal?: string;
  stateAvailability?: string[];
  lastVerified?: string;
  source?: SourceReference;
  relatedServices?: string[];
}

export interface ServiceMatch { service: ServiceKnowledge; score: number; reasons: string[]; }
export interface JurisdictionResolution { state?: string; district?: string; type: Jurisdiction; needsState: boolean; }
export interface ConversationContext { state?: string; district?: string; serviceId?: string; serviceType?: string; applicationStage?: ApplicationStage; purpose?: string; applicantType?: string; language?: string; }
export interface SourceReference { source: string; authority: string; jurisdiction: Jurisdiction; checkedAt: string; confidence: ConfidenceLevel; official: boolean; }
export interface KnowledgeResult { service?: ServiceKnowledge; confidence: ConfidenceLevel; source?: SourceReference; notes: string[]; }
export type AIActionType = "START_APPLICATION" | "VIEW_DOCUMENTS" | "CHECK_ELIGIBILITY" | "CHECK_FEES" | "TRACK_APPLICATION" | "OPEN_OFFICIAL_PORTAL" | "CONTACT_SUPPORT" | "UPLOAD_DOCUMENT" | "PAYMENT_HELP";
export interface AIAction { type: AIActionType; label: string; serviceId?: string; available: boolean; }
export interface AIError { code: "SENSITIVE_DATA" | "UNKNOWN_SERVICE" | "VERIFICATION_UNAVAILABLE" | "INVALID_REQUEST"; message: string; }
export interface AIResponse { intent: AIIntent; service?: ServiceMatch; jurisdiction: JurisdictionResolution; answer: string; nextAction?: string; actions: AIAction[]; confidence: ConfidenceLevel; knowledgeOrigin: KnowledgeOrigin; sources: SourceReference[]; error?: AIError; context: ConversationContext; }
