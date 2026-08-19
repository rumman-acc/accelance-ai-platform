"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidateByPrefix = exports.setCached = exports.getCached = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = __importDefault(require("./logger"));
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
let client; // undefined = not yet initialized, null = unavailable
const getClient = () => {
    if (client !== undefined)
        return client;
    if (!process.env.REDIS_URL) {
        client = null;
        return client;
    }
    try {
        client = new ioredis_1.default(process.env.REDIS_URL, {
            lazyConnect: true,
            maxRetriesPerRequest: 1,
            retryStrategy: () => null // don't keep retrying a dead connection forever
        });
        client.on('error', (err) => {
            logger_1.default.warn(`[redisCache] connection error, caching degraded: ${err.message}`);
        });
    }
    catch (error) {
        logger_1.default.warn(`[redisCache] failed to initialize client, caching disabled: ${error}`);
        client = null;
    }
    return client;
};
const getCached = async (key) => {
    const redis = getClient();
    if (!redis)
        return undefined;
    try {
        const raw = await redis.get(key);
        return raw ? JSON.parse(raw) : undefined;
    }
    catch (error) {
        logger_1.default.warn(`[redisCache] getCached(${key}) failed: ${error}`);
        return undefined;
    }
};
exports.getCached = getCached;
const setCached = async (key, value, ttlSeconds) => {
    const redis = getClient();
    if (!redis)
        return;
    try {
        await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    }
    catch (error) {
        logger_1.default.warn(`[redisCache] setCached(${key}) failed: ${error}`);
    }
};
exports.setCached = setCached;
/** Invalidates every cached key under a prefix — used after writes so list caches
 * (which vary by page/limit/type/etc.) don't serve stale data until their TTL expires. */
const invalidateByPrefix = async (prefix) => {
    const redis = getClient();
    if (!redis)
        return;
    try {
        const keys = await redis.keys(`${prefix}*`);
        if (keys.length)
            await redis.del(...keys);
    }
    catch (error) {
        logger_1.default.warn(`[redisCache] invalidateByPrefix(${prefix}) failed: ${error}`);
    }
};
exports.invalidateByPrefix = invalidateByPrefix;
//# sourceMappingURL=redisCache.js.map