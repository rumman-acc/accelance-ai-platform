'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.sanitizeDataSourceOptions = sanitizeDataSourceOptions
exports.rejectReservedDataSourceKeys = rejectReservedDataSourceKeys
exports.mergeDataSourceOptions = mergeDataSourceOptions
/** TypeORM DataSource options that can load and execute arbitrary local JavaScript files. */
const BLOCKED_DATASOURCE_KEYS = ['entities', 'subscribers', 'migrations', 'extra']
/** Connection options that must be set by the node, not via additionalConfig. */
const RESERVED_CONNECTION_KEYS = ['database', 'type', 'url', 'host', 'port', 'username', 'password']
/**
 * Rejects user-supplied TypeORM DataSource options that can lead to arbitrary code execution
 * when passed to `new DataSource(options).initialize()`.
 */
function sanitizeDataSourceOptions(config) {
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
        return {}
    }
    for (const key of BLOCKED_DATASOURCE_KEYS) {
        if (key in config) {
            throw new Error(`Disallowed TypeORM DataSource option: ${key}`)
        }
    }
    return { ...config }
}
/**
 * Rejects user-supplied connection fields that must not override node-controlled settings.
 */
function rejectReservedDataSourceKeys(config) {
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
        return
    }
    for (const key of RESERVED_CONNECTION_KEYS) {
        if (key in config) {
            throw new Error(`Disallowed TypeORM DataSource option: ${key}`)
        }
    }
}
/**
 * Merges sanitized user options under protected node-controlled DataSource options.
 */
function mergeDataSourceOptions(protectedOptions, userOptions) {
    const sanitized = sanitizeDataSourceOptions(userOptions)
    rejectReservedDataSourceKeys(sanitized)
    return { ...sanitized, ...protectedOptions }
}
//# sourceMappingURL=sanitizeDataSourceOptions.js.map
