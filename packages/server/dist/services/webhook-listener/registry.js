"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWebhookListenerRegistry = exports.initWebhookListenerRegistry = exports.RedisWebhookListenerRegistry = exports.InMemoryWebhookListenerRegistry = void 0;
const uuid_1 = require("uuid");
const Interface_1 = require("../../Interface");
const logger_1 = __importDefault(require("../../utils/logger"));
const redis_1 = require("../../utils/redis");
/**
 * Single-replica, in-memory registry. Used in MAIN mode where there is no cross-replica concern
 * and Redis is not necessarily configured.
 */
class InMemoryWebhookListenerRegistry {
    constructor(sseStreamer, ttlMs = 120_000) {
        this.replicaId = `main-${(0, uuid_1.v4)()}`;
        this.listeners = new Map();
        this.sseStreamer = sseStreamer;
        this.ttlMs = ttlMs;
    }
    getReplicaId() {
        return this.replicaId;
    }
    async register(chatflowid) {
        const listenerId = `wh-listener-${(0, uuid_1.v4)()}`;
        this.scheduleEviction(chatflowid, listenerId);
        return listenerId;
    }
    async heartbeat(chatflowid, listenerId) {
        this.scheduleEviction(chatflowid, listenerId);
    }
    async unregister(chatflowid, listenerId) {
        const inner = this.listeners.get(chatflowid);
        if (!inner)
            return;
        const handle = inner.get(listenerId);
        if (handle)
            clearTimeout(handle);
        inner.delete(listenerId);
        if (inner.size === 0)
            this.listeners.delete(chatflowid);
    }
    async getActiveListeners(chatflowid) {
        const inner = this.listeners.get(chatflowid);
        if (!inner || inner.size === 0)
            return [];
        return Array.from(inner.keys()).map((listenerId) => ({ listenerId, replicaId: this.replicaId }));
    }
    async bindExecution(chatflowid, executionChatId) {
        const listeners = await this.getActiveListeners(chatflowid);
        for (const { listenerId } of listeners) {
            this.sseStreamer.addObserver(executionChatId, listenerId);
        }
    }
    scheduleEviction(chatflowid, listenerId) {
        let inner = this.listeners.get(chatflowid);
        if (!inner) {
            inner = new Map();
            this.listeners.set(chatflowid, inner);
        }
        const existing = inner.get(listenerId);
        if (existing)
            clearTimeout(existing);
        const handle = setTimeout(() => {
            this.unregister(chatflowid, listenerId).catch(() => { });
        }, this.ttlMs);
        inner.set(listenerId, handle);
    }
}
exports.InMemoryWebhookListenerRegistry = InMemoryWebhookListenerRegistry;
/**
 * Redis-backed registry. Listeners are kept in a per-flow hash with a refreshing TTL. Each
 * replica boots subscribed to its own control channel; when a webhook fires on replica A and
 * finds a listener on replica B, A publishes to B's channel telling it to observe events for
 * the in-flight executionChatId on its local SSE client.
 */
class RedisWebhookListenerRegistry {
    constructor(sseStreamer, redisEventSubscriber, ttlSeconds = 120) {
        this.replicaId = `replica-${(0, uuid_1.v4)()}`;
        this.listenerKey = (chatflowid) => `wh-listener:${chatflowid}`;
        this.bindChannel = (replicaId) => `wh-listener-bind:${replicaId}`;
        this.sseStreamer = sseStreamer;
        this.redisEventSubscriber = redisEventSubscriber;
        this.ttlSeconds = ttlSeconds;
        this.publisher = (0, redis_1.createRedisClient)();
        this.subscriber = (0, redis_1.createRedisClient)();
    }
    getReplicaId() {
        return this.replicaId;
    }
    async connect() {
        await Promise.all([this.publisher.connect(), this.subscriber.connect()]);
        await this.subscriber.subscribe(this.bindChannel(this.replicaId), async (message) => {
            try {
                const parsed = JSON.parse(message);
                if (!parsed.executionChatId || !parsed.listenerId)
                    return;
                // Only attach if the listener actually lives on this replica (sanity check —
                // dispatcher already routed by replicaId, but the local SSE client is the
                // ground truth).
                if (!this.sseStreamer.hasClient(parsed.listenerId)) {
                    logger_1.default.warn(`[WebhookListenerRegistry] Bind dropped: listener ${parsed.listenerId} not on this replica (${this.replicaId}). ` +
                        `Likely caused by ALB routing without sticky sessions, or by a webhook firing between register and stream.`);
                    return;
                }
                this.sseStreamer.addObserver(parsed.executionChatId, parsed.listenerId);
                // Subscribe to the execution channel so the worker's published events land
                // on this replica and get fanned out to the local listener client.
                await this.redisEventSubscriber.subscribe(parsed.executionChatId);
            }
            catch (err) {
                logger_1.default.error('[WebhookListenerRegistry] Failed to handle bind notification', { error: err });
            }
        });
        logger_1.default.info(`[WebhookListenerRegistry] Connected to Redis (replicaId=${this.replicaId})`);
    }
    async register(_chatflowid) {
        return `wh-listener-${(0, uuid_1.v4)()}`;
    }
    async heartbeat(chatflowid, listenerId) {
        // Re-set the field (idempotent) and bump the key's TTL so individual listeners staying
        // connected keep the whole hash alive.
        await this.publisher.hSet(this.listenerKey(chatflowid), listenerId, this.replicaId);
        await this.publisher.expire(this.listenerKey(chatflowid), this.ttlSeconds);
    }
    async unregister(chatflowid, listenerId) {
        await this.publisher.hDel(this.listenerKey(chatflowid), listenerId);
    }
    async getActiveListeners(chatflowid) {
        const raw = await this.publisher.hGetAll(this.listenerKey(chatflowid));
        return Object.entries(raw).map(([listenerId, replicaId]) => ({ listenerId, replicaId: String(replicaId) }));
    }
    async bindExecution(chatflowid, executionChatId) {
        const listeners = await this.getActiveListeners(chatflowid);
        if (listeners.length === 0)
            return;
        for (const { listenerId, replicaId } of listeners) {
            if (replicaId === this.replicaId) {
                // Listener lives on this replica — attach the observer immediately, no pub/sub hop.
                this.sseStreamer.addObserver(executionChatId, listenerId);
                await this.redisEventSubscriber.subscribe(executionChatId);
            }
            else {
                await this.publisher.publish(this.bindChannel(replicaId), JSON.stringify({ executionChatId, listenerId }));
            }
        }
    }
    async dispose() {
        try {
            await this.subscriber.unsubscribe();
        }
        catch {
            /* ignore */
        }
        await Promise.allSettled([this.publisher.quit(), this.subscriber.quit()]);
    }
}
exports.RedisWebhookListenerRegistry = RedisWebhookListenerRegistry;
let registry = null;
/**
 * Build the right registry implementation for the current MODE. Called once during App init.
 * Queue mode: Redis-backed, requires a connected RedisEventSubscriber. Otherwise: in-memory.
 */
const initWebhookListenerRegistry = async (sseStreamer, redisEventSubscriber) => {
    if (process.env.MODE === Interface_1.MODE.QUEUE && redisEventSubscriber) {
        const r = new RedisWebhookListenerRegistry(sseStreamer, redisEventSubscriber);
        await r.connect();
        registry = r;
    }
    else {
        registry = new InMemoryWebhookListenerRegistry(sseStreamer);
    }
    return registry;
};
exports.initWebhookListenerRegistry = initWebhookListenerRegistry;
const getWebhookListenerRegistry = () => {
    if (!registry) {
        throw new Error('WebhookListenerRegistry has not been initialized');
    }
    return registry;
};
exports.getWebhookListenerRegistry = getWebhookListenerRegistry;
//# sourceMappingURL=registry.js.map