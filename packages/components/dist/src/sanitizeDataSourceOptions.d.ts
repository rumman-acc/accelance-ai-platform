import { ICommonObject } from './Interface';
/** TypeORM DataSource options that can load and execute arbitrary local JavaScript files. */
declare const BLOCKED_DATASOURCE_KEYS: readonly ["entities", "subscribers", "migrations", "extra"];
/** Connection options that must be set by the node, not via additionalConfig. */
declare const RESERVED_CONNECTION_KEYS: readonly ["database", "type", "url", "host", "port", "username", "password"];
export type BlockedDataSourceKey = (typeof BLOCKED_DATASOURCE_KEYS)[number];
export type ReservedConnectionKey = (typeof RESERVED_CONNECTION_KEYS)[number];
/**
 * Rejects user-supplied TypeORM DataSource options that can lead to arbitrary code execution
 * when passed to `new DataSource(options).initialize()`.
 */
export declare function sanitizeDataSourceOptions(config: ICommonObject): ICommonObject;
/**
 * Rejects user-supplied connection fields that must not override node-controlled settings.
 */
export declare function rejectReservedDataSourceKeys(config: ICommonObject): void;
/**
 * Merges sanitized user options under protected node-controlled DataSource options.
 */
export declare function mergeDataSourceOptions<T extends ICommonObject>(protectedOptions: T, userOptions: ICommonObject): T;
export {};
