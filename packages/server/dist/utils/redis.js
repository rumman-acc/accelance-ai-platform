"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRedisClient = exports.buildRedisClientOptions = void 0;
const redis_1 = require("redis");
const buildRedisClientOptions = () => {
    const keepAliveRaw = process.env.REDIS_KEEP_ALIVE;
    const keepAliveMs = keepAliveRaw && !isNaN(parseInt(keepAliveRaw, 10)) ? parseInt(keepAliveRaw, 10) : undefined;
    if (process.env.REDIS_URL) {
        return {
            url: process.env.REDIS_URL,
            socket: { keepAlive: keepAliveMs },
            pingInterval: keepAliveMs
        };
    }
    return {
        username: process.env.REDIS_USERNAME || undefined,
        password: process.env.REDIS_PASSWORD || undefined,
        socket: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            tls: process.env.REDIS_TLS === 'true',
            cert: process.env.REDIS_CERT ? Buffer.from(process.env.REDIS_CERT, 'base64') : undefined,
            key: process.env.REDIS_KEY ? Buffer.from(process.env.REDIS_KEY, 'base64') : undefined,
            ca: process.env.REDIS_CA ? Buffer.from(process.env.REDIS_CA, 'base64') : undefined,
            keepAlive: keepAliveMs
        },
        pingInterval: keepAliveMs
    };
};
exports.buildRedisClientOptions = buildRedisClientOptions;
/**
 * Convenience wrapper that returns a fresh, **un-connected** node-redis client built
 * with the standard env-driven options. Callers still own the connection lifecycle
 * (`.connect()`, `.quit()`, error listeners).
 */
const createRedisClient = () => (0, redis_1.createClient)((0, exports.buildRedisClientOptions)());
exports.createRedisClient = createRedisClient;
//# sourceMappingURL=redis.js.map