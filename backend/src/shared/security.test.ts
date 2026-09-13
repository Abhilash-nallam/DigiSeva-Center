import assert from "node:assert/strict";
import { assertUpload, constantTimeEqual, secureToken, sha256, validateUploadName } from "./security.js";

const token = secureToken();
assert.ok(token.length > 20);
assert.equal(constantTimeEqual("same", "same"), true);
assert.equal(constantTimeEqual("same", "different"), false);
assert.equal(sha256("DigiSeva").length, 64);
assert.equal(validateUploadName("proof.pdf"), "proof.pdf");
assert.throws(() => validateUploadName("../proof.pdf"));
assert.doesNotThrow(() => assertUpload("application/pdf", "proof.pdf", 100));
assert.throws(() => assertUpload("application/x-msdownload", "proof.exe", 100));
assert.throws(() => assertUpload("application/pdf", "proof.pdf", 6 * 1024 * 1024));
console.log("Backend security primitive tests passed");
