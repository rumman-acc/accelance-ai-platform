import { createClient } from 'redis';
export declare const buildRedisClientOptions: () => Parameters<typeof createClient>[0];
/**
 * Convenience wrapper that returns a fresh, **un-connected** node-redis client built
 * with the standard env-driven options. Callers still own the connection lifecycle
 * (`.connect()`, `.quit()`, error listeners).
 */
export declare const createRedisClient: () => ReturnType<typeof createClient>;
