"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stripProtectedFields_1 = require("./stripProtectedFields");
describe('stripProtectedFields', () => {
    it('removes id from input', () => {
        const result = (0, stripProtectedFields_1.stripProtectedFields)({ id: 'abc-123', name: 'test' });
        expect(result).not.toHaveProperty('id');
        expect(result).toHaveProperty('name', 'test');
    });
    it('removes createdDate from input', () => {
        const result = (0, stripProtectedFields_1.stripProtectedFields)({ createdDate: new Date().toISOString(), name: 'test' });
        expect(result).not.toHaveProperty('createdDate');
    });
    it('removes updatedDate from input', () => {
        const result = (0, stripProtectedFields_1.stripProtectedFields)({ updatedDate: new Date().toISOString(), name: 'test' });
        expect(result).not.toHaveProperty('updatedDate');
    });
    it('removes workspaceId from input', () => {
        const result = (0, stripProtectedFields_1.stripProtectedFields)({ workspaceId: 'ws-999', details: '{}' });
        expect(result).not.toHaveProperty('workspaceId');
        expect(result).toHaveProperty('details', '{}');
    });
    it('removes organizationId from input', () => {
        const result = (0, stripProtectedFields_1.stripProtectedFields)({ organizationId: 'org-456', credential: 'cred-uuid' });
        expect(result).not.toHaveProperty('organizationId');
        expect(result).toHaveProperty('credential', 'cred-uuid');
    });
    it('removes webhookSecret from input', () => {
        const result = (0, stripProtectedFields_1.stripProtectedFields)({ webhookSecret: 'attacker-chosen-secret', name: 'test' });
        expect(result).not.toHaveProperty('webhookSecret');
        expect(result).toHaveProperty('name', 'test');
    });
    it('removes webhookSecretConfigured from input', () => {
        const result = (0, stripProtectedFields_1.stripProtectedFields)({ webhookSecretConfigured: true, name: 'test' });
        expect(result).not.toHaveProperty('webhookSecretConfigured');
        expect(result).toHaveProperty('name', 'test');
    });
    it('removes all protected fields when all are present', () => {
        const body = {
            id: 'abc',
            createdDate: '2026-01-01T00:00:00.000Z',
            updatedDate: '2026-01-02T00:00:00.000Z',
            workspaceId: '11111111-2222-3333-4444-555555555555',
            organizationId: 'org-789',
            webhookSecret: 'some-secret',
            webhookSecretConfigured: true,
            details: '{"name":"my assistant"}',
            credential: 'cred-uuid',
            iconSrc: null
        };
        const result = (0, stripProtectedFields_1.stripProtectedFields)(body);
        for (const field of stripProtectedFields_1.PROTECTED_FIELDS) {
            expect(result).not.toHaveProperty(field);
        }
        expect(result).toEqual({ details: '{"name":"my assistant"}', credential: 'cred-uuid', iconSrc: null });
    });
    it('preserves all non-protected fields', () => {
        const body = { details: '{}', credential: 'cred-1', iconSrc: 'https://example.com/icon.png', type: 'CUSTOM' };
        const result = (0, stripProtectedFields_1.stripProtectedFields)(body);
        expect(result).toEqual(body);
    });
    it('returns an empty object when given an empty object', () => {
        const result = (0, stripProtectedFields_1.stripProtectedFields)({});
        expect(result).toEqual({});
    });
    it('returns an equal shallow copy when no protected fields are present', () => {
        const body = { name: 'tool', description: 'does stuff', color: '#ff0000' };
        const result = (0, stripProtectedFields_1.stripProtectedFields)(body);
        expect(result).toEqual(body);
    });
    it('does not mutate the original input object', () => {
        const original = { id: 'abc', workspaceId: 'ws-1', name: 'assistant' };
        const copy = { ...original };
        (0, stripProtectedFields_1.stripProtectedFields)(original);
        expect(original).toEqual(copy);
    });
});
//# sourceMappingURL=stripProtectedFields.test.js.map