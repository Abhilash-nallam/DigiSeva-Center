import type { ConversationContext } from "./types";

export function updateConversationContext(current: ConversationContext, update: ConversationContext): ConversationContext {
  return { ...current, ...Object.fromEntries(Object.entries(update).filter(([, value]) => value !== undefined && value !== "")) };
}
