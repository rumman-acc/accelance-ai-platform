"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROTECTED_FIELDS = void 0;
exports.stripProtectedFields = stripProtectedFields;
/**
 * Fields that are managed exclusively by the server and must never be
 * overwritten by user-supplied request bodies.
 */
exports.PROTECTED_FIELDS = [
    'id',
    'createdDate',
    'updatedDate',
    'runDate',
    'workspaceId',
    'organizationId',
    'webhookSecret',
    'webhookSecretConfigured'
];
/**
 * Returns a shallow copy of `body` with all server-managed fields removed.
 * Use this before assigning a request body to a database entity to prevent
 * mass assignment of fields such as `workspaceId`, `id`, and timestamps.
 *
 * @example
 * Object.assign(entity, stripProtectedFields(req.body))
 */
function stripProtectedFields(body) {
    const sanitized = { ...body };
    for (const field of exports.PROTECTED_FIELDS) {
        delete sanitized[field];
    }
    return sanitized;
}
//# sourceMappingURL=stripProtectedFields.js.map