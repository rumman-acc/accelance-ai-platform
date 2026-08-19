"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsageCacheManager = void 0;
const keyv_1 = require("keyv");
const redis_1 = __importDefault(require("@keyv/redis"));
const cache_manager_1 = require("cache-manager");
const Interface_1 = require("./Interface");
const constants_1 = require("./utils/constants");
const StripeManager_1 = require("./StripeManager");
const DISABLED_QUOTAS = {
    [constants_1.LICENSE_QUOTAS.PREDICTIONS_LIMIT]: 0,
    [constants_1.LICENSE_QUOTAS.STORAGE_LIMIT]: 0, // in MB
    [constants_1.LICENSE_QUOTAS.FLOWS_LIMIT]: 0,
    [constants_1.LICENSE_QUOTAS.USERS_LIMIT]: 0,
    [constants_1.LICENSE_QUOTAS.ADDITIONAL_SEATS_LIMIT]: 0
};
const UNLIMITED_QUOTAS = {
    [constants_1.LICENSE_QUOTAS.PREDICTIONS_LIMIT]: -1,
    [constants_1.LICENSE_QUOTAS.STORAGE_LIMIT]: -1,
    [constants_1.LICENSE_QUOTAS.FLOWS_LIMIT]: -1,
    [constants_1.LICENSE_QUOTAS.USERS_LIMIT]: -1,
    [constants_1.LICENSE_QUOTAS.ADDITIONAL_SEATS_LIMIT]: -1
};
class UsageCacheManager {
    static async getInstance() {
        if (!UsageCacheManager.instance) {
            UsageCacheManager.instance = new UsageCacheManager();
            await UsageCacheManager.instance.initialize();
        }
        return UsageCacheManager.instance;
    }
    async initialize() {
        if (process.env.MODE === Interface_1.MODE.QUEUE) {
            let redisConfig;
            if (process.env.REDIS_URL) {
                redisConfig = {
                    url: process.env.REDIS_URL,
                    socket: {
                        keepAlive: process.env.REDIS_KEEP_ALIVE && !isNaN(parseInt(process.env.REDIS_KEEP_ALIVE, 10))
                            ? parseInt(process.env.REDIS_KEEP_ALIVE, 10)
                            : undefined
                    },
                    pingInterval: process.env.REDIS_KEEP_ALIVE && !isNaN(parseInt(process.env.REDIS_KEEP_ALIVE, 10))
                        ? parseInt(process.env.REDIS_KEEP_ALIVE, 10)
                        : undefined
                };
            }
            else {
                redisConfig = {
                    username: process.env.REDIS_USERNAME || undefined,
                    password: process.env.REDIS_PASSWORD || undefined,
                    socket: {
                        host: process.env.REDIS_HOST || 'localhost',
                        port: parseInt(process.env.REDIS_PORT || '6379'),
                        tls: process.env.REDIS_TLS === 'true',
                        cert: process.env.REDIS_CERT ? Buffer.from(process.env.REDIS_CERT, 'base64') : undefined,
                        key: process.env.REDIS_KEY ? Buffer.from(process.env.REDIS_KEY, 'base64') : undefined,
                        ca: process.env.REDIS_CA ? Buffer.from(process.env.REDIS_CA, 'base64') : undefined,
                        keepAlive: process.env.REDIS_KEEP_ALIVE && !isNaN(parseInt(process.env.REDIS_KEEP_ALIVE, 10))
                            ? parseInt(process.env.REDIS_KEEP_ALIVE, 10)
                            : undefined
                    },
                    pingInterval: process.env.REDIS_KEEP_ALIVE && !isNaN(parseInt(process.env.REDIS_KEEP_ALIVE, 10))
                        ? parseInt(process.env.REDIS_KEEP_ALIVE, 10)
                        : undefined
                };
            }
            this.cache = (0, cache_manager_1.createCache)({
                stores: [
                    new keyv_1.Keyv({
                        store: new redis_1.default(redisConfig)
                    })
                ]
            });
        }
        else {
            this.cache = (0, cache_manager_1.createCache)();
        }
    }
    async getSubscriptionDetails(subscriptionId, withoutCache = false) {
        const stripeManager = await StripeManager_1.StripeManager.getInstance();
        if (!stripeManager || !subscriptionId) {
            return UNLIMITED_QUOTAS;
        }
        // Skip cache if withoutCache is true
        if (!withoutCache) {
            const subscriptionData = await this.getSubscriptionDataFromCache(subscriptionId);
            if (subscriptionData?.subsriptionDetails) {
                return subscriptionData.subsriptionDetails;
            }
        }
        // If not in cache, retrieve from Stripe
        const subscription = await stripeManager.getStripe().subscriptions.retrieve(subscriptionId);
        // Update subscription data cache
        await this.updateSubscriptionDataToCache(subscriptionId, { subsriptionDetails: stripeManager.getSubscriptionObject(subscription) });
        return stripeManager.getSubscriptionObject(subscription);
    }
    async getQuotas(subscriptionId, withoutCache = false) {
        const stripeManager = await StripeManager_1.StripeManager.getInstance();
        if (!stripeManager || !subscriptionId) {
            return UNLIMITED_QUOTAS;
        }
        // Skip cache if withoutCache is true
        if (!withoutCache) {
            const subscriptionData = await this.getSubscriptionDataFromCache(subscriptionId);
            if (subscriptionData?.quotas) {
                return subscriptionData.quotas;
            }
        }
        // If not in cache, retrieve from Stripe
        const subscription = await stripeManager.getStripe().subscriptions.retrieve(subscriptionId);
        const items = subscription.items.data;
        if (items.length === 0) {
            return DISABLED_QUOTAS;
        }
        const productId = items[0].price.product;
        const product = await stripeManager.getStripe().products.retrieve(productId);
        const productMetadata = product.metadata;
        if (!productMetadata || Object.keys(productMetadata).length === 0) {
            return DISABLED_QUOTAS;
        }
        const quotas = {};
        for (const key in productMetadata) {
            if (key.startsWith('quota:')) {
                quotas[key] = parseInt(productMetadata[key]);
            }
        }
        const additionalSeatsItem = subscription.items.data.find((item) => item.price.product === process.env.ADDITIONAL_SEAT_ID);
        quotas[constants_1.LICENSE_QUOTAS.ADDITIONAL_SEATS_LIMIT] = additionalSeatsItem?.quantity || 0;
        // Update subscription data cache with quotas
        await this.updateSubscriptionDataToCache(subscriptionId, {
            quotas,
            subsriptionDetails: stripeManager.getSubscriptionObject(subscription)
        });
        return quotas;
    }
    async getSubscriptionDataFromCache(subscriptionId) {
        const cacheKey = `subscription:${subscriptionId}`;
        return await this.get(cacheKey);
    }
    async updateSubscriptionDataToCache(subscriptionId, data) {
        const cacheKey = `subscription:${subscriptionId}`;
        const existingData = (await this.getSubscriptionDataFromCache(subscriptionId)) || {};
        const updatedData = { ...existingData, ...data };
        this.set(cacheKey, updatedData, 3600000); // Cache for 1 hour
    }
    async get(key) {
        if (!this.cache)
            await this.initialize();
        const value = await this.cache.get(key);
        return value;
    }
    async getTTL(key) {
        if (!this.cache)
            await this.initialize();
        const value = await this.cache.ttl(key);
        return value;
    }
    async mget(keys) {
        if (this.cache) {
            const values = await this.cache.mget(keys);
            return values;
        }
        else {
            return [];
        }
    }
    set(key, value, ttl) {
        if (this.cache) {
            this.cache.set(key, value, ttl);
        }
    }
    mset(keys) {
        if (this.cache) {
            this.cache.mset(keys);
        }
    }
    async del(key) {
        await this.cache.del(key);
    }
    async mdel(keys) {
        await this.cache.mdel(keys);
    }
    async clear() {
        await this.cache.clear();
    }
    async wrap(key, fn, ttl) {
        return this.cache.wrap(key, fn, ttl);
    }
}
exports.UsageCacheManager = UsageCacheManager;
//# sourceMappingURL=UsageCacheManager.js.map