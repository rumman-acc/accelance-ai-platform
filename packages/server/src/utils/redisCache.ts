import Redis from 'ioredis'
import logger from './logger'

/**
 * Standalone response cache for expensive/slow read endpoints, independent of MODE.
 *
 * CachePool.ts already wires up Redis, but only when MODE=queue — that ties Redis
 * availability to the queue/worker architecture switch, which is a much bigger
 * operational change (a separate worker process, different execution semantics)
 * than "cache a few slow list endpoints". This uses the same REDIS_URL directly,
 * any time it's set, regardless of MODE.
 *
 * Caching here is strictly best-effort: every call swallows its own errors and
 * falls through to undefined/no-op so a Redis outage degrades performance, never
 * correctness. Callers must always be able to compute the answer without this.
 */

let client: Redis | null | undefined // undefined = not yet initialized, null = unavailable

const getClient = (): Redis | null => {
    if (client !== undefined) return client

    if (!process.env.REDIS_URL) {
        client = null
        return client
    }

    try {
        client = new Redis(process.env.REDIS_URL, {
            lazyConnect: true,
            maxRetriesPerRequest: 1,
            retryStrategy: () => null // don't keep retrying a dead connection forever
        })
        client.on('error', (err) => {
            logger.warn(`[redisCache] connection error, caching degraded: ${err.message}`)
        })
    } catch (error) {
        logger.warn(`[redisCache] failed to initialize client, caching disabled: ${error}`)
        client = null
    }

    return client
}

export const getCached = async <T = any>(key: string): Promise<T | undefined> => {
    const redis = getClient()
    if (!redis) return undefined
    try {
        const raw = await redis.get(key)
        return raw ? (JSON.parse(raw) as T) : undefined
    } catch (error) {
        logger.warn(`[redisCache] getCached(${key}) failed: ${error}`)
        return undefined
    }
}

export const setCached = async (key: string, value: any, ttlSeconds: number): Promise<void> => {
    const redis = getClient()
    if (!redis) return
    try {
        await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds)
    } catch (error) {
        logger.warn(`[redisCache] setCached(${key}) failed: ${error}`)
    }
}

/** Invalidates every cached key under a prefix — used after writes so list caches
 * (which vary by page/limit/type/etc.) don't serve stale data until their TTL expires. */
export const invalidateByPrefix = async (prefix: string): Promise<void> => {
    const redis = getClient()
    if (!redis) return
    try {
        const keys = await redis.keys(`${prefix}*`)
        if (keys.length) await redis.del(...keys)
    } catch (error) {
        logger.warn(`[redisCache] invalidateByPrefix(${prefix}) failed: ${error}`)
    }
}
