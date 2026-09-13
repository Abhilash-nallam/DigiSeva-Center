import type { AIIntent, ApplicationStage } from "./types";

export function detectLanguage(message: string): string {
  if (/[\u0C00-\u0C7F]/.test(message)) return "Telugu";
  if (/[\u0900-\u097F]/.test(message)) return "Hindi";
  return "English";
}

export function detectIntent(message: string): { intent: AIIntent; stage?: ApplicationStage } {
  const value = message.toLowerCase();
  if (/^(hi|hello|hey|namaste|నమస్కారం|नमस्ते)\b/.test(value)) return { intent: "greeting" };
  if (/\b(track|status|application id|where is my application|tracking)\b/.test(value)) return { intent: "tracking", stage: "tracking" };
  if (/\b(payment|paid|upi|qr|pay later|refund|transaction)\b/.test(value)) return { intent: "payment", stage: "payment" };
  if (/\b(reject|rejected|stuck|complaint|problem|issue|missing document)\b/.test(value)) return { intent: /reject|missing/.test(value) ? "correction" : "complaint", stage: "correction" };
  if (/\b(renew|renewal|expired|reprint|lost|duplicate)\b/.test(value)) return { intent: "renewal", stage: "renewal" };
  if (/\b(document|documents|proof|papers|upload|photo|signature)\b/.test(value)) return { intent: "documents", stage: "documents" };
  if (/\b(fee|fees|cost|price|charge|amount|how much)\b/.test(value)) return { intent: "fees" };
  if (/\b(time|timeline|long|days|weeks|when)\b/.test(value)) return { intent: "timeline", stage: "application" };
  if (/\b(eligible|eligibility|qualify|qualification|can i apply)\b/.test(value)) return { intent: "eligibility", stage: "eligibility" };
  if (/\b(how do i apply|where do i apply|what next|apply|application|process|procedure|steps?|where)\b/.test(value)) return { intent: "application", stage: "application" };
  if (/\b(insurance|policy|premium|coverage|claim)\b/.test(value)) return { intent: "insurance" };
  if (/\b(loan|emi|lender|interest rate)\b/.test(value)) return { intent: "loan" };
  if (/\b(scholarship|student|education|fee reimbursement)\b/.test(value)) return { intent: "education" };
  if (/\b(pm[- ]?kisan|pension|welfare|scheme|benefit)\b/.test(value)) return { intent: "welfare" };
  if (/\b(gst|udyam|msme|fssai|trade licence|business)\b/.test(value)) return { intent: "business" };
  if (/\b(electricity|water|gas|lpg|utility|bill)\b/.test(value)) return { intent: "utility" };
  if (/\b(help|support|contact)\b/.test(value)) return { intent: "support", stage: "support" };
  return { intent: "service_discovery" };
}
