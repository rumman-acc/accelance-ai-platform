"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisEventSubscriber = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const redis_1 = require("../utils/redis");
class RedisEventSubscriber {
    constructor(sseStreamer) {
        this.subscribedChannels = new Set();
        this.cleanupInterval = null;
        this.redisSubscriber = (0, redis_1.createRedisClient)();
        this.sseStreamer = sseStreamer;
        this.setupEventListeners();
    }
    setupEventListeners() {
        this.redisSubscriber.on('connect', () => {
            logger_1.default.info(`[RedisEventSubscriber] Redis client connecting...`);
        });
        this.redisSubscriber.on('ready', () => {
            logger_1.default.info(`[RedisEventSubscriber] Redis client ready and connected (active channel subscriptions: ${this.subscribedChannels.size})`);
        });
        this.redisSubscriber.on('error', (err) => {
            logger_1.default.error(`[RedisEventSubscriber] Redis client error:`, {
                error: err,
                isReady: this.redisSubscriber.isReady,
                isOpen: this.redisSubscriber.isOpen,
                subscribedChannelsCount: this.subscribedChannels.size
            });
        });
        this.redisSubscriber.on('end', () => {
            logger_1.default.warn(`[RedisEventSubscriber] Redis client connection ended`);
        });
        this.redisSubscriber.on('reconnecting', () => {
            logger_1.default.info(`[RedisEventSubscriber] Redis client reconnecting...`);
        });
    }
    async connect() {
        await this.redisSubscriber.connect();
    }
    async subscribe(channel) {
        // Subscribe to the Redis channel for job events
        if (!this.redisSubscriber) {
            throw new Error('Redis subscriber not connected.');
        }
        // Check if already subscribed
        if (this.subscribedChannels.has(channel)) {
            return; // Prevent duplicate subscription
        }
        await this.redisSubscriber.subscribe(channel, (message) => {
            this.handleEvent(message);
        });
        // Mark the channel as subscribed
        this.subscribedChannels.add(channel);
    }
    async unsubscribe(channel) {
        if (!this.redisSubscriber)
            return;
        if (!this.subscribedChannels.has(channel))
            return;
        try {
            await this.redisSubscriber.unsubscribe(channel);
            logger_1.default.debug(`[RedisEventSubscriber] Unsubscribed from channel: ${channel}. Active subscriptions: ${this.subscribedChannels.size}`);
        }
        catch (error) {
            logger_1.default.error(`[RedisEventSubscriber] Error unsubscribing from channel ${channel}:`, { error });
        }
        finally {
            this.subscribedChannels.delete(channel);
        }
    }
    getSubscriptionCount() {
        return this.subscribedChannels.size;
    }
    startPeriodicCleanup(intervalMs = 60_000) {
        this.cleanupInterval = setInterval(() => {
            const staleChannels = Array.from(this.subscribedChannels).filter((channel) => !this.sseStreamer.hasClientOrObserver(channel));
            if (staleChannels.length > 0) {
                for (const channel of staleChannels) {
                    this.unsubscribe(channel);
                }
                logger_1.default.info(`[RedisEventSubscriber] Periodic cleanup: removed ${staleChannels.length} stale subscriptions. Remaining: ${this.subscribedChannels.size}`);
            }
        }, intervalMs);
    }
    handleEvent(message) {
        let event;
        try {
            event = JSON.parse(message);
        }
        catch (err) {
            logger_1.default.error(`[RedisEventSubscriber] Failed to parse pub/sub message:`, { error: err, rawMessage: message });
            return;
        }
        const { eventType, chatId, chatMessageId, data, duration } = event;
        if (!eventType || !chatId) {
            logger_1.default.warn(`[RedisEventSubscriber] Invalid event shape (missing eventType or chatId):`, { event });
            return;
        }
        const chatMessageIdStr = chatMessageId ?? '';
        const dataObj = data ?? {};
        try {
            switch (eventType) {
                case 'start':
                    this.sseStreamer.streamStartEvent(chatId, data);
                    break;
                case 'token':
                    this.sseStreamer.streamTokenEvent(chatId, data);
                    break;
                case 'thinking':
                    this.sseStreamer.streamThinkingEvent(chatId, typeof data === 'string' ? data : String(data ?? ''), duration);
                    break;
                case 'sourceDocuments':
                    this.sseStreamer.streamSourceDocumentsEvent(chatId, data);
                    break;
                case 'artifacts':
                    this.sseStreamer.streamArtifactsEvent(chatId, data);
                    break;
                case 'usedTools':
                    this.sseStreamer.streamUsedToolsEvent(chatId, data);
                    break;
                case 'calledTools':
                    this.sseStreamer.streamCalledToolsEvent(chatId, data);
                    break;
                case 'fileAnnotations':
                    this.sseStreamer.streamFileAnnotationsEvent(chatId, data);
                    break;
                case 'tool':
                    this.sseStreamer.streamToolEvent(chatId, data);
                    break;
                case 'agentReasoning':
                    this.sseStreamer.streamAgentReasoningEvent(chatId, data);
                    break;
                case 'nextAgent':
                    this.sseStreamer.streamNextAgentEvent(chatId, data);
                    break;
                case 'agentFlowEvent':
                    this.sseStreamer.streamAgentFlowEvent(chatId, data);
                    break;
                case 'agentFlowExecutedData':
                    this.sseStreamer.streamAgentFlowExecutedDataEvent(chatId, data);
                    break;
                case 'nextAgentFlow':
                    this.sseStreamer.streamNextAgentFlowEvent(chatId, data);
                    break;
                case 'action':
                    this.sseStreamer.streamActionEvent(chatId, data);
                    break;
                case 'abort':
                    this.sseStreamer.streamAbortEvent(chatId);
                    break;
                case 'error':
                    this.sseStreamer.streamErrorEvent(chatId, typeof data === 'string' ? data : String(data ?? ''));
                    break;
                case 'metadata':
                    this.sseStreamer.streamMetadataEvent(chatId, data);
                    break;
                case 'usageMetadata':
                    this.sseStreamer.streamUsageMetadataEvent(chatId, data);
                    break;
                case 'tts_start':
                    this.sseStreamer.streamTTSStartEvent(chatId, chatMessageIdStr, dataObj.format ?? '');
                    break;
                case 'tts_data':
                    this.sseStreamer.streamTTSDataEvent(chatId, chatMessageIdStr, data);
                    break;
                case 'tts_end':
                    this.sseStreamer.streamTTSEndEvent(chatId, chatMessageIdStr);
                    break;
                case 'tts_abort':
                    this.sseStreamer.streamTTSAbortEvent(chatId, chatMessageIdStr);
                    break;
                default:
                    logger_1.default.debug(`[RedisEventSubscriber] Unknown event type: ${eventType}`);
            }
        }
        catch (err) {
            logger_1.default.error(`[RedisEventSubscriber] Error handling pub/sub event:`, { error: err, eventType, chatId });
            if (chatId) {
                this.sseStreamer.streamErrorEvent(chatId, err instanceof Error ? err.message : 'Failed to process stream event');
            }
        }
    }
    async disconnect() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        if (this.redisSubscriber) {
            await this.redisSubscriber.quit();
        }
    }
}
exports.RedisEventSubscriber = RedisEventSubscriber;
//# sourceMappingURL=RedisEventSubscriber.js.map