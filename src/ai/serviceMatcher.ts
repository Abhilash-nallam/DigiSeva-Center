import type { ServiceKnowledge, ServiceMatch } from "./types";

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
const tokens = (value: string) => normalize(value).split(" ").filter((token) => token.length > 1);

export function matchServices(message: string, services: ServiceKnowledge[], contextServiceId?: string): ServiceMatch[] {
  const original = message.toLowerCase();
  const languageTerms = [
    /కుల|जाति/iu.test(original) ? "caste" : "",
    /ఆదాయం|आय/iu.test(original) ? "income" : "",
    /పాస్పోర్ట్|पासपोर्ट/iu.test(original) ? "passport" : "",
    /దరఖాస్తు|आवेदन/iu.test(original) ? "application" : "",
  ].filter(Boolean);
  const query = normalize(`${message} ${languageTerms.join(" ")}`);
  const queryTokens = new Set(tokens(query));
  const hasExplicitRequest = /\b(actually|instead|i need|i want|looking for)\b/i.test(message);
  const useContext = Boolean(contextServiceId) && !hasExplicitRequest && !/\b(unknown|unclear|something else|don't know)\b/i.test(message);
  if (/^(what documents|what documents do i need|what documents are required|documents required|can i apply)$/i.test(normalize(message))) return [];
  return services.map((service) => {
    const fields = [service.name, ...service.aliases, ...service.tags].map(normalize);
    let score = useContext && contextServiceId === service.id ? 4 : 0;
    const reasons: string[] = [];
    if (fields.some((field) => field && query.includes(field))) { score += 5; reasons.push("phrase match"); }
    for (const token of queryTokens) {
      if (fields.some((field) => field.split(" ").some((part) => part === token))) { score += 1.5; reasons.push("token match"); }
    }
    if ((/lost|duplicate/.test(query) && /rc|registration/.test(query) && service.id === "vahan") || (/lost|duplicate/.test(query) && /rc/.test(query) && service.id === "rc_transfer")) { score += 3; reasons.push("replacement context"); }
    if (/passport/.test(query) && /expired|renew/.test(query) && service.id === "passport") { score += 3; reasons.push("renewal context"); }
    return { service, score, reasons: Array.from(new Set(reasons)) };
  }).filter((match) => match.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);
}
