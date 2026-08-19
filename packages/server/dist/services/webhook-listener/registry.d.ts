import type { SSEStreamer } from '../../utils/SSEStreamer';
import type { RedisEventSubscriber } from '../../queue/RedisEventSubscriber';
export type WebhookListenerEntry = {
    listenerId: string;
    replicaId: string;
};
export interface IWebhookListenerRegistry {
    /** Register a new listener for a flow. Returns the generated listenerId. */
    register(chatflowid: string): Promise<string>;
    /** Refresh TTL on the listener so it stays alive past the inactivity window. */
    heartbeat(chatflowid: string, listenerId: string): Promise<void>;
    /** Drop a listener immediately (called on SSE disconnect). */
    unregister(chatflowid: string, listenerId: string): Promise<void>;
    /** Look up everyone listening to this flow right now. */
    getActiveListeners(chatflowid: string): Promise<WebhookListenerEntry[]>;
    /**
     * Bind an in-flight execution chatId to every listener of a flow. The webhook handler
     * calls this right before invoking the flow so events emitted under `executionChatId` are
     * observed by every listener — locally on this replica AND across replicas via pub/sub.
     */
    bindExecution(chatflowid: string, executionChatId: string): Promise<void>;
    /** Get the id used to identify this replica in cross-replica messages. */
    getReplicaId(): string;
    /** Optional shutdown hook (queue mode tears down Redis subscribers). */
    dispose?(): Promise<void>;
}
/**
 * Single-replica, in-memory registry. Used in MAIN mode where there is no cross-replica concern
 * and Redis is not necessarily configured.
 */
export declare class InMemoryWebhookListenerRegistry implements IWebhookListenerRegistry {
    private readonly replicaId;
    private readonly listeners;
    private readonly ttlMs;
    private readonly sseStreamer;
    constructor(sseStreamer: SSEStreamer, ttlMs?: number);
    getReplicaId(): string;
    register(chatflowid: string): Promise<string>;
    heartbeat(chatflowid: string, listenerId: string): Promise<void>;
    unregister(chatflowid: string, listenerId: string): Promise<void>;
    getActiveListeners(chatflowid: string): Promise<WebhookListenerEntry[]>;
    bindExecution(chatflowid: string, executionChatId: string): Promise<void>;
    private scheduleEviction;
}
/**
 * Redis-backed registry. Listeners are kept in a per-flow hash with a refreshing TTL. Each
 * replica boots subscribed to its own control channel; when a webhook fires on replica A and
 * finds a listener on replica B, A publishes to B's channel telling it to observe events for
 * the in-flight executionChatId on its local SSE client.
 */
export declare class RedisWebhookListenerRegistry implements IWebhookListenerRegistry {
    private readonly replicaId;
    private readonly publisher;
    private readonly subscriber;
    private readonly sseStreamer;
    private readonly redisEventSubscriber;
    private readonly ttlSeconds;
    private readonly listenerKey;
    private readonly bindChannel;
    constructor(sseStreamer: SSEStreamer, redisEventSubscriber: RedisEventSubscriber, ttlSeconds?: number);
    getReplicaId(): string;
    connect(): Promise<void>;
    register(_chatflowid: string): Promise<string>;
    heartbeat(chatflowid: string, listenerId: string): Promise<void>;
    unregister(chatflowid: string, listenerId: string): Promise<void>;
    getActiveListeners(chatflowid: string): Promise<WebhookListenerEntry[]>;
    bindExecution(chatflowid: string, executionChatId: string): Promise<void>;
    dispose(): Promise<void>;
}
/**
 * Build the right registry implementation for the current MODE. Called once during App init.
 * Queue mode: Redis-backed, requires a connected RedisEventSubscriber. Otherwise: in-memory.
 */
export declare const initWebhookListenerRegistry: (sseStreamer: SSEStreamer, redisEventSubscriber?: RedisEventSubscriber) => Promise<IWebhookListenerRegistry>;
export declare const getWebhookListenerRegistry: () => IWebhookListenerRegistry;
