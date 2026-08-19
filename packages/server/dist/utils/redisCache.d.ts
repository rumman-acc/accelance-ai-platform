export declare const getCached: <T = any>(key: string) => Promise<T | undefined>;
export declare const setCached: (key: string, value: any, ttlSeconds: number) => Promise<void>;
/** Invalidates every cached key under a prefix — used after writes so list caches
 * (which vary by page/limit/type/etc.) don't serve stale data until their TTL expires. */
export declare const invalidateByPrefix: (prefix: string) => Promise<void>;
