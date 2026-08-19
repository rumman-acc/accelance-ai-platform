"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyWebhookSignature = verifyWebhookSignature;
exports.verifyPlainToken = verifyPlainToken;
const crypto_1 = require("crypto");
/**
 * Verifies that `providedHex` is the HMAC of `rawBody` keyed with `secret`.
 * Uses constant-time comparison to prevent timing attacks.
 *
 * Automatically detects the algorithm from a leading "<algo>=" prefix:
 *   - "sha256=<hex>" → HMAC-SHA256 (GitHub X-Hub-Signature-256, Slack, Bitbucket)
 *   - "sha1=<hex>"   → HMAC-SHA1   (GitHub X-Hub-Signature legacy)
 *   - no prefix      → HMAC-SHA256 (default)
 *
 * @param secret      The webhook secret stored on the chatflow
 * @param rawBody     The raw request body bytes
 * @param providedHex The hex digest (optionally prefixed) from the signature request header
 * @returns true if the signature is valid, false otherwise
 */
function verifyWebhookSignature(secret, rawBody, providedHex) {
    let algo = 'sha256';
    let hex = providedHex;
    if (providedHex.includes('=')) {
        const [prefix, ...rest] = providedHex.split('=');
        hex = rest.join('=');
        if (prefix === 'sha1')
            algo = 'sha1';
    }
    const expected = (0, crypto_1.createHmac)(algo, secret).update(new Uint8Array(rawBody)).digest();
    let provided;
    try {
        provided = Buffer.from(hex, 'hex');
    }
    catch {
        return false;
    }
    if (provided.length !== expected.length)
        return false;
    return (0, crypto_1.timingSafeEqual)(new Uint8Array(provided), new Uint8Array(expected));
}
/**
 * Verifies a plain-token signature by doing a constant-time string comparison
 * between the stored secret and the value provided in the request header.
 * Used for GitLab-style webhooks that send the raw secret directly in a header.
 *
 * @param secret   The webhook secret stored on the chatflow
 * @param provided The raw value from the signature request header
 * @returns true if the values match, false otherwise
 */
function verifyPlainToken(secret, provided) {
    const secretBuf = Buffer.from(secret);
    const providedBuf = Buffer.from(provided);
    if (secretBuf.length !== providedBuf.length)
        return false;
    return (0, crypto_1.timingSafeEqual)(new Uint8Array(secretBuf), new Uint8Array(providedBuf));
}
//# sourceMappingURL=signatureVerification.js.map