"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RECORD_MANAGER_NAMESPACE_MAX_LENGTH = exports.RECORD_MANAGER_TABLE_NAME_MAX_LENGTH = void 0;
exports.sanitizeRecordManagerTableName = sanitizeRecordManagerTableName;
exports.sanitizeRecordManagerNamespace = sanitizeRecordManagerNamespace;
exports.RECORD_MANAGER_TABLE_NAME_MAX_LENGTH = 128;
exports.RECORD_MANAGER_NAMESPACE_MAX_LENGTH = 128;
/**
 * Validates record manager table names used in SQL identifiers.
 */
function sanitizeRecordManagerTableName(tableName) {
    tableName = tableName.trim().toLowerCase().replace(/\s+/g, '_');
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
        throw new Error('Invalid table name');
    }
    if (tableName.length > exports.RECORD_MANAGER_TABLE_NAME_MAX_LENGTH) {
        throw new Error(`Invalid table name: must be at most ${exports.RECORD_MANAGER_TABLE_NAME_MAX_LENGTH} characters`);
    }
    return tableName;
}
/**
 * Validates record manager namespace values stored in the database.
 */
function sanitizeRecordManagerNamespace(namespace) {
    const trimmed = namespace.trim();
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(trimmed)) {
        throw new Error('Invalid namespace');
    }
    if (trimmed.length > exports.RECORD_MANAGER_NAMESPACE_MAX_LENGTH) {
        throw new Error(`Invalid namespace: must be at most ${exports.RECORD_MANAGER_NAMESPACE_MAX_LENGTH} characters`);
    }
    return trimmed;
}
//# sourceMappingURL=recordManagerSecurity.js.map