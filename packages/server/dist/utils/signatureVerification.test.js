"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const signatureVerification_1 = require("./signatureVerification");
const SECRET = 'test-secret-abc123';
const BODY = Buffer.from('{"event":"push"}');
function sign(secret, body) {
    return (0, crypto_1.createHmac)('sha256', secret).update(new Uint8Array(body)).digest('hex');
}
describe('verifyWebhookSignature', () => {
    it('returns true for a valid signature', () => {
        expect((0, signatureVerification_1.verifyWebhookSignature)(SECRET, BODY, sign(SECRET, BODY))).toBe(true);
    });
    it('returns false for a wrong secret', () => {
        expect((0, signatureVerification_1.verifyWebhookSignature)('wrong-secret', BODY, sign(SECRET, BODY))).toBe(false);
    });
    it('returns false for a tampered body', () => {
        const tamperedBody = Buffer.from('{"event":"delete"}');
        expect((0, signatureVerification_1.verifyWebhookSignature)(SECRET, tamperedBody, sign(SECRET, BODY))).toBe(false);
    });
    it('returns false for an empty signature string', () => {
        expect((0, signatureVerification_1.verifyWebhookSignature)(SECRET, BODY, '')).toBe(false);
    });
    it('returns false for a non-hex signature string', () => {
        expect((0, signatureVerification_1.verifyWebhookSignature)(SECRET, BODY, 'not-hex!!')).toBe(false);
    });
    it('returns false for a signature that is too short', () => {
        const truncated = sign(SECRET, BODY).slice(0, 10);
        expect((0, signatureVerification_1.verifyWebhookSignature)(SECRET, BODY, truncated)).toBe(false);
    });
    it('returns false for a signature that is too long', () => {
        const padded = sign(SECRET, BODY) + 'aabb';
        expect((0, signatureVerification_1.verifyWebhookSignature)(SECRET, BODY, padded)).toBe(false);
    });
    it('returns true for an empty body when signed correctly', () => {
        const emptyBody = Buffer.from('');
        expect((0, signatureVerification_1.verifyWebhookSignature)(SECRET, emptyBody, sign(SECRET, emptyBody))).toBe(true);
    });
    describe('sha256= prefix', () => {
        it('returns true for a valid sha256=<hex> signature', () => {
            const sig = 'sha256=' + sign(SECRET, BODY);
            expect((0, signatureVerification_1.verifyWebhookSignature)(SECRET, BODY, sig)).toBe(true);
        });
        it('returns false for sha256= with wrong secret', () => {
            const sig = 'sha256=' + sign('wrong-secret', BODY);
            expect((0, signatureVerification_1.verifyWebhookSignature)(SECRET, BODY, sig)).toBe(false);
        });
        it('returns false for sha256= with tampered body', () => {
            const sig = 'sha256=' + sign(SECRET, Buffer.from('{"event":"delete"}'));
            expect((0, signatureVerification_1.verifyWebhookSignature)(SECRET, BODY, sig)).toBe(false);
        });
    });
    describe('sha1= prefix', () => {
        function signSha1(secret, body) {
            return (0, crypto_1.createHmac)('sha1', secret).update(new Uint8Array(body)).digest('hex');
        }
        it('returns true for a valid sha1=<hex> signature', () => {
            const sig = 'sha1=' + signSha1(SECRET, BODY);
            expect((0, signatureVerification_1.verifyWebhookSignature)(SECRET, BODY, sig)).toBe(true);
        });
        it('returns false for sha1= with wrong secret', () => {
            const sig = 'sha1=' + signSha1('wrong-secret', BODY);
            expect((0, signatureVerification_1.verifyWebhookSignature)(SECRET, BODY, sig)).toBe(false);
        });
        it('returns false for sha1= with tampered body', () => {
            const sig = 'sha1=' + signSha1(SECRET, Buffer.from('{"event":"delete"}'));
            expect((0, signatureVerification_1.verifyWebhookSignature)(SECRET, BODY, sig)).toBe(false);
        });
    });
});
describe('verifyPlainToken', () => {
    it('returns true when provided token matches secret', () => {
        expect((0, signatureVerification_1.verifyPlainToken)(SECRET, SECRET)).toBe(true);
    });
    it('returns false when provided token does not match secret', () => {
        expect((0, signatureVerification_1.verifyPlainToken)(SECRET, 'wrong-token')).toBe(false);
    });
    it('returns false when lengths differ (shorter provided)', () => {
        expect((0, signatureVerification_1.verifyPlainToken)(SECRET, SECRET.slice(0, -1))).toBe(false);
    });
    it('returns false when lengths differ (longer provided)', () => {
        expect((0, signatureVerification_1.verifyPlainToken)(SECRET, SECRET + 'x')).toBe(false);
    });
});
//# sourceMappingURL=signatureVerification.test.js.map