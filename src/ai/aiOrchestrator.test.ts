import assert from "node:assert/strict";
import { createServiceKnowledge, orchestrate } from "./aiOrchestrator";
import { verifySource } from "./sourceVerifier";
import type { ServiceKnowledge } from "./types";

const catalog: ServiceKnowledge[] = [
  { id: "pan", name: "PAN Card", aliases: ["pan card", "permanent account number"], tags: ["pan", "tax id", "reprint"], category: "identity", jurisdiction: "central", documents: ["Identity proof"], governmentFee: "₹107", digiSevaFee: "₹50", estimatedTime: "15 days" },
  { id: "passport", name: "Passport", aliases: ["passport renewal"], tags: ["passport", "travel", "renewal"], category: "identity", jurisdiction: "central", documents: ["Address proof"], governmentFee: "₹1,500", digiSevaFee: "₹150", estimatedTime: "3-7 weeks" },
  { id: "driving", name: "Driving Licence", aliases: ["dl", "driving license"], tags: ["driving licence", "dl renewal"], category: "transport", jurisdiction: "state", documents: ["Age proof"], governmentFee: "₹200-500", digiSevaFee: "₹75", estimatedTime: "30 days" },
  { id: "vahan", name: "Vehicle Registration", aliases: ["vehicle rc"], tags: ["rc", "vehicle"], category: "transport", jurisdiction: "state", documents: ["Insurance"], governmentFee: "Varies", digiSevaFee: "₹50", estimatedTime: "7 days" },
  { id: "rtps", name: "Caste / Income Certificate", aliases: ["caste certificate", "income certificate"], tags: ["caste", "income", "certificate"], category: "certificates", jurisdiction: "state", documents: ["Address proof"], governmentFee: "₹20-100", digiSevaFee: "₹30", estimatedTime: "7-15 days" },
  { id: "scholarship", name: "National Scholarship", aliases: ["scholarship"], tags: ["student", "education"], category: "education", jurisdiction: "central", documents: ["Mark sheet"], governmentFee: "Free", digiSevaFee: "₹30", estimatedTime: "3-6 months" },
  { id: "pmkisan", name: "PM-KISAN", aliases: ["pm kisan"], tags: ["farmer", "agriculture"], category: "welfare", jurisdiction: "state", documents: ["Land records"], governmentFee: "Free", digiSevaFee: "₹30", estimatedTime: "4 months" },
];

const cases: Array<[string, string]> = [
  ["PAN card", "pan"], ["I need pan", "pan"], ["my pan is lost", "pan"], ["passport expired", "passport"], ["DL renewal", "driving"], ["bike RC lost", "vahan"], ["caste certificate Telangana", "rtps"], ["scholarship", "scholarship"], ["PM Kisan", "pmkisan"], ["what documents for passport", "passport"],
];
for (const [message, expected] of cases) assert.equal(orchestrate(message, catalog).service?.service.id, expected, message);
assert.equal(orchestrate("track my application", catalog).intent, "tracking");
assert.equal(orchestrate("payment failed", catalog).intent, "payment");
assert.equal(orchestrate("can I apply for passport", catalog).intent, "eligibility");
assert.equal(orchestrate("need a certificate", catalog).confidence, "low");
assert.equal(orchestrate("నాకు పాన్ కావాలి", catalog).context.language, "Telugu");
assert.equal(orchestrate("मुझे पासपोर्ट चाहिए", catalog).context.language, "Hindi");
assert.equal(orchestrate("tell me something", catalog).confidence, "low");
assert.equal(orchestrate("share my OTP", catalog).error?.code, "SENSITIVE_DATA");
assert.equal(orchestrate("caste certificate", catalog).jurisdiction.needsState, true);
assert.equal(orchestrate("income certificate Telangana", catalog).jurisdiction.state, "Telangana");

const passport = orchestrate("I need passport renewal", catalog);
const passportDocuments = orchestrate("What documents?", catalog, passport.context);
assert.equal(passportDocuments.service?.service.id, "passport");
assert.match(passportDocuments.answer, /couldn't verify|not be treated as official/i);
assert.equal(passportDocuments.knowledgeOrigin, "catalog");
assert.equal(orchestrate("How much?", catalog, passport.context).service?.service.id, "passport");
assert.equal(orchestrate("How long?", catalog, passport.context).service?.service.id, "passport");
const telangana = orchestrate("I'm from Telangana", catalog);
const caste = orchestrate("I need caste certificate", catalog, telangana.context);
assert.equal(caste.jurisdiction.state, "Telangana");
assert.equal(orchestrate("What documents?", catalog, caste.context).jurisdiction.state, "Telangana");
const pan = orchestrate("I need PAN", catalog);
const switched = orchestrate("Actually I need DL renewal", catalog, pan.context);
assert.equal(switched.service?.service.id, "driving");
assert.equal(orchestrate("What documents?", catalog, switched.context).service?.service.id, "driving");
assert.match(orchestrate("What documents?", catalog).answer, /Which service/);
const driving = orchestrate("I need driving licence", catalog);
assert.match(orchestrate("What documents?", catalog, driving.context).answer, /new, learner, permanent, renewal, or duplicate/i);
assert.match(orchestrate("What documents for DL renewal?", catalog).answer, /I couldn't verify|authoritative/i);
assert.match(orchestrate("Are you the government?", catalog).answer, /independent digital service assistance platform/i);
assert.match(orchestrate("Is my application approved?", catalog).answer, /couldn't retrieve the latest application status/i);
assert.equal(verifySource(catalog[0]).verified, false);
assert.equal(verifySource(catalog[0]).confidence, "low");

console.log(`AI orchestration tests passed: ${cases.length + 10}`);
