"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apiKey_1 = require("./apiKey");
describe('Api Key', () => {
    it('should be able to generate a new api key', () => {
        const apiKey = (0, apiKey_1.generateAPIKey)();
        expect(typeof apiKey === 'string').toEqual(true);
    });
    describe('generateSecretHash', () => {
        it('should return a string in hash.salt format', () => {
            const apiKey = 'test-api-key';
            const stored = (0, apiKey_1.generateSecretHash)(apiKey);
            expect(typeof stored).toBe('string');
            const parts = stored.split('.');
            expect(parts).toHaveLength(2);
            expect(parts[0]).toMatch(/^[0-9a-f]+$/);
            expect(parts[1]).toMatch(/^[0-9a-f]+$/);
        });
        it('should produce different hashes for the same key (different salt)', () => {
            const apiKey = 'test-api-key';
            const stored1 = (0, apiKey_1.generateSecretHash)(apiKey);
            const stored2 = (0, apiKey_1.generateSecretHash)(apiKey);
            expect(stored1).not.toBe(stored2);
            expect((0, apiKey_1.compareKeys)(stored1, apiKey)).toBe(true);
            expect((0, apiKey_1.compareKeys)(stored2, apiKey)).toBe(true);
        });
    });
    describe('compareKeys', () => {
        it('should return true when supplied key matches stored hash', () => {
            const apiKey = (0, apiKey_1.generateAPIKey)();
            const storedKey = (0, apiKey_1.generateSecretHash)(apiKey);
            expect((0, apiKey_1.compareKeys)(storedKey, apiKey)).toBe(true);
        });
        it('should return false when supplied key does not match stored hash', () => {
            const apiKey = (0, apiKey_1.generateAPIKey)();
            const storedKey = (0, apiKey_1.generateSecretHash)(apiKey);
            expect((0, apiKey_1.compareKeys)(storedKey, 'wrong-key')).toBe(false);
        });
    });
});
//# sourceMappingURL=apiKey.test.js.map