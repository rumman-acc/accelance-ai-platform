import { AxiosInstance } from 'axios'

/**
 * Wrap an axios instance with in-flight request deduplication and a short TTL cache.
 *
 * For cacheable requests (GETs and POST /node-load-method/*):
 * 1. If a cached response exists and hasn't expired, return it immediately.
 * 2. If an identical request is already in-flight, share the existing promise.
 * 3. Otherwise, make the request, cache the response, and return it.
 *
 * Errors are never cached — only successful responses are stored.
 * Non-cacheable requests (mutations, non-load-method POSTs) always pass through.
 */
export interface DeduplicatedClient extends AxiosInstance {
    /** Clear all cached responses. Call after mutations that invalidate metadata. */
    clearCache(): void
}
export declare function withDeduplication(client: AxiosInstance, getCacheTtlMs?: number, loadMethodCacheTtlMs?: number): DeduplicatedClient
