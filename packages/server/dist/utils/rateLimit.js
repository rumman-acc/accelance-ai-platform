"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiterManager = void 0;
const express_rate_limit_1 = require("express-rate-limit");
const Interface_1 = require("../Interface");
const async_mutex_1 = require("async-mutex");
const rate_limit_redis_1 = require("rate-limit-redis");
const ioredis_1 = __importDefault(require("ioredis"));
const bullmq_1 = require("bullmq");
const QUEUE_NAME = 'ratelimit';
const QUEUE_EVENT_NAME = 'updateRateLimiter';
class RateLimiterManager {
    constructor() {
        this.rateLimiters = new Map();
        this.rateLimiterMutex = new async_mutex_1.Mutex();
        if (process.env.MODE === Interface_1.MODE.QUEUE) {
            if (process.env.REDIS_URL) {
                this.redisClient = new ioredis_1.default(process.env.REDIS_URL, {
                    keepAlive: process.env.REDIS_KEEP_ALIVE && !isNaN(parseInt(process.env.REDIS_KEEP_ALIVE, 10))
                        ? parseInt(process.env.REDIS_KEEP_ALIVE, 10)
                        : undefined
                });
            }
            else {
                this.redisClient = new ioredis_1.default({
                    host: process.env.REDIS_HOST || 'localhost',
                    port: parseInt(process.env.REDIS_PORT || '6379'),
                    username: process.env.REDIS_USERNAME || undefined,
                    password: process.env.REDIS_PASSWORD || undefined,
                    tls: process.env.REDIS_TLS === 'true'
                        ? {
                            cert: process.env.REDIS_CERT ? Buffer.from(process.env.REDIS_CERT, 'base64') : undefined,
                            key: process.env.REDIS_KEY ? Buffer.from(process.env.REDIS_KEY, 'base64') : undefined,
                            ca: process.env.REDIS_CA ? Buffer.from(process.env.REDIS_CA, 'base64') : undefined
                        }
                        : undefined,
                    keepAlive: process.env.REDIS_KEEP_ALIVE && !isNaN(parseInt(process.env.REDIS_KEEP_ALIVE, 10))
                        ? parseInt(process.env.REDIS_KEEP_ALIVE, 10)
                        : undefined
                });
            }
            this.queueEventsProducer = new bullmq_1.QueueEventsProducer(QUEUE_NAME, { connection: this.getConnection() });
            this.queueEvents = new bullmq_1.QueueEvents(QUEUE_NAME, { connection: this.getConnection() });
        }
    }
    getConnection() {
        let tlsOpts = undefined;
        if (process.env.REDIS_URL && process.env.REDIS_URL.startsWith('rediss://')) {
            tlsOpts = {
                rejectUnauthorized: false
            };
        }
        else if (process.env.REDIS_TLS === 'true') {
            tlsOpts = {
                cert: process.env.REDIS_CERT ? Buffer.from(process.env.REDIS_CERT, 'base64') : undefined,
                key: process.env.REDIS_KEY ? Buffer.from(process.env.REDIS_KEY, 'base64') : undefined,
                ca: process.env.REDIS_CA ? Buffer.from(process.env.REDIS_CA, 'base64') : undefined
            };
        }
        return {
            url: process.env.REDIS_URL || undefined,
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            username: process.env.REDIS_USERNAME || undefined,
            password: process.env.REDIS_PASSWORD || undefined,
            tls: tlsOpts,
            maxRetriesPerRequest: null,
            enableReadyCheck: true,
            keepAlive: process.env.REDIS_KEEP_ALIVE && !isNaN(parseInt(process.env.REDIS_KEEP_ALIVE, 10))
                ? parseInt(process.env.REDIS_KEEP_ALIVE, 10)
                : undefined
        };
    }
    static getInstance() {
        if (!RateLimiterManager.instance) {
            RateLimiterManager.instance = new RateLimiterManager();
        }
        return RateLimiterManager.instance;
    }
    async addRateLimiter(id, duration, limit, message) {
        const release = await this.rateLimiterMutex.acquire();
        try {
            if (process.env.MODE === Interface_1.MODE.QUEUE) {
                this.rateLimiters.set(id, (0, express_rate_limit_1.rateLimit)({
                    windowMs: duration * 1000,
                    max: limit,
                    standardHeaders: true,
                    legacyHeaders: false,
                    message,
                    store: new rate_limit_redis_1.RedisStore({
                        prefix: `rl:${id}`,
                        // @ts-expect-error - Known issue: the `call` function is not present in @types/ioredis
                        sendCommand: (...args) => this.redisClient.call(...args)
                    })
                }));
            }
            else {
                this.rateLimiters.set(id, (0, express_rate_limit_1.rateLimit)({
                    windowMs: duration * 1000,
                    max: limit,
                    message
                }));
            }
        }
        finally {
            release();
        }
    }
    removeRateLimiter(id) {
        this.rateLimiters.delete(id);
    }
    getRateLimiter() {
        return (req, res, next) => {
            const id = req.params.id;
            if (typeof id === 'string' && id.length > 0 && this.rateLimiters.has(id)) {
                return this.rateLimiters.get(id)(req, res, next);
            }
            return next();
        };
    }
    getRateLimiterById(id) {
        return (req, res, next) => {
            if (this.rateLimiters.has(id)) {
                return this.rateLimiters.get(id)(req, res, next);
            }
            return next();
        };
    }
    async updateRateLimiter(chatFlow, isInitialized) {
        if (!chatFlow.apiConfig)
            return;
        const apiConfig = JSON.parse(chatFlow.apiConfig);
        const rateLimit = apiConfig.rateLimit;
        if (!rateLimit)
            return;
        const { limitDuration, limitMax, limitMsg, status } = rateLimit;
        if (!isInitialized && process.env.MODE === Interface_1.MODE.QUEUE && this.queueEventsProducer) {
            await this.queueEventsProducer.publishEvent({
                eventName: QUEUE_EVENT_NAME,
                limitDuration,
                limitMax,
                limitMsg,
                id: chatFlow.id
            });
        }
        else {
            if (status === false) {
                this.removeRateLimiter(chatFlow.id);
            }
            else if (limitMax && limitDuration && limitMsg) {
                await this.addRateLimiter(chatFlow.id, limitDuration, limitMax, limitMsg);
            }
        }
    }
    async initializeRateLimiters(chatflows) {
        await Promise.all(chatflows.map(async (chatFlow) => {
            await this.updateRateLimiter(chatFlow, true);
        }));
        if (process.env.MODE === Interface_1.MODE.QUEUE && this.queueEvents) {
            this.queueEvents.on(QUEUE_EVENT_NAME, async ({ limitDuration, limitMax, limitMsg, id }) => {
                await this.addRateLimiter(id, limitDuration, limitMax, limitMsg);
            });
        }
    }
}
exports.RateLimiterManager = RateLimiterManager;
//# sourceMappingURL=rateLimit.js.map