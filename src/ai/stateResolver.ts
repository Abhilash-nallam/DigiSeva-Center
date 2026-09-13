import type { ConversationContext, JurisdictionResolution } from "./types";

export const INDIAN_STATES_AND_UTS = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry", "Chandigarh", "Andaman and Nicobar Islands", "Dadra and Nagar Haveli and Daman and Diu", "Lakshadweep"
] as const;

const aliases: Record<string, string> = { ap: "Andhra Pradesh", ts: "Telangana", telangana: "Telangana", karnataka: "Karnataka", tamilnadu: "Tamil Nadu", "tamil nadu": "Tamil Nadu" };

export function resolveJurisdiction(message: string, context: ConversationContext, serviceRequiresState: boolean): JurisdictionResolution {
  const normalized = message.toLowerCase();
  const found = INDIAN_STATES_AND_UTS.find((state) => normalized.includes(state.toLowerCase())) ?? Object.entries(aliases).find(([alias]) => normalized.includes(alias))?.[1] ?? context.state;
  const district = message.match(/\b(?:district|dist\.?)[\s:]+([a-z][a-z -]+)/i)?.[1]?.trim();
  return { state: found, district: district ?? context.district, type: serviceRequiresState ? "state" : "central", needsState: serviceRequiresState && !found };
}
