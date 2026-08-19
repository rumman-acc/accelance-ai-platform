export declare const RECORD_MANAGER_TABLE_NAME_MAX_LENGTH = 128
export declare const RECORD_MANAGER_NAMESPACE_MAX_LENGTH = 128
/**
 * Validates record manager table names used in SQL identifiers.
 */
export declare function sanitizeRecordManagerTableName(tableName: string): string
/**
 * Validates record manager namespace values stored in the database.
 */
export declare function sanitizeRecordManagerNamespace(namespace: string): string
