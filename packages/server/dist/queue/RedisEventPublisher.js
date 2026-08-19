"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisEventPublisher = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const redis_1 = require("../utils/redis");
class RedisEventPublisher {
    constructor() {
        this.connectPromise = null;
        this.redisPublisher = (0, redis_1.createRedisClient)();
        this.setupEventListeners();
    }
    setupEventListeners() {
        this.redisPublisher.on('connect', () => {
            logger_1.default.info(`[RedisEventPublisher] Redis client connecting...`);
        });
        this.redisPublisher.on('ready', () => {
            logger_1.default.info(`[RedisEventPublisher] Redis client ready and connected`);
        });
        this.redisPublisher.on('error', (err) => {
            logger_1.default.error(`[RedisEventPublisher] Redis client error:`, {
                error: err,
                isReady: this.redisPublisher.isReady,
                isOpen: this.redisPublisher.isOpen
            });
        });
        this.redisPublisher.on('end', () => {
            logger_1.default.warn(`[RedisEventPublisher] Redis client connection ended`);
        });
        this.redisPublisher.on('reconnecting', () => {
            logger_1.default.info(`[RedisEventPublisher] Redis client reconnecting...`);
        });
    }
    isConnected() {
        return this.redisPublisher.isReady;
    }
    async connect() {
        if (this.connectPromise === null) {
            this.connectPromise = this.redisPublisher.connect().then(() => undefined);
        }
        await this.connectPromise;
    }
    async safePublish(channel, message) {
        if (!this.redisPublisher.isReady) {
            logger_1.default.warn(`[RedisEventPublisher] Cannot publish to channel ${channel}: Redis client not ready`);
            return;
        }
        try {
            await this.redisPublisher.publish(channel, message);
        }
        catch (error) {
            logger_1.default.error(`[RedisEventPublisher] Error publishing to channel ${channel}:`, { error });
        }
    }
    streamCustomEvent(chatId, eventType, data) {
        this.safePublish(chatId, JSON.stringify({ chatId, eventType, data }));
    }
    streamStartEvent(chatId, data) {
        this.safePublish(chatId, JSON.stringify({ chatId, eventType: 'start', data }));
    }
    streamTokenEvent(chatId, data) {
        this.safePublish(chatId, JSON.stringify({ chatId, eventType: 'token', data }));
    }
    streamThinkingEvent(chatId, data, duration) {
        this.safePublish(chatId, JSON.stringify({
            chatId,
            eventType: 'thinking',
            data,
            duration
        }));
    }
    streamSourceDocumentsEvent(chatId, data) {
        this.safePublish(chatId, JSON.stringify({ chatId, eventType: 'sourceDocuments', data }));
    }
    streamArtifactsEvent(chatId, data) {
        this.safePublish(chatId, JSON.stringify({ chatId, eventType: 'artifacts', data }));
    }
    streamUsedToolsEvent(chatId, data) {
        this.safePublish(chatId, JSON.stringify({ chatId, eventType: 'usedTools', data }));
    }
    streamCalledToolsEvent(chatId, data) {
        this.safePublish(chatId, JSON.stringify({ chatId, eventType: 'calledTools', data }));
    }
    streamFileAnnotationsEvent(chatId, data) {
        this.safePublish(chatId, JSON.stringify({ chatId, eventType: 'fileAnnotations', data }));
    }
    streamToolEvent(chatId, data) {
        this.safePublish(chatId, JSON.stringify({ chatId, eventType: 'tool', data }));
    }
    streamAgentReasoningEvent(chatId, data) {
        this.safePublish(chatId, JSON.stringify({ chatId, eventType: 'agentReasoning', data }));
    }
    streamAgentFlowEvent(chatId, data) {
        this.safePublish(chatId, JSON.stringify({ chatId, eventType: 'agentFlowEvent', data }));
    }
    streamAgentFlowExecutedDataEvent(chatId, data) {
        this.safePublish(chatId, JSON.stringify({ chatId, eventType: 'agentFlowExecutedData', data }));
    }
    streamNextAgentEvent(chatId, data) {
        this.safePublish(chatId, JSON.stringify({ chatId, eventType: 'nextAgent', data }));
    }
    streamNextAgentFlowEvent(chatId, data) {
        this.safePublish(chatId, JSON.stringify({ chatId, eventType: 'nextAgentFlow', data }));
    }
    streamActionEvent(chatId, data) {
        this.safePublish(chatId, JSON.stringify({ chatId, eventType: 'action', data }));
    }
    streamAbortEvent(chatId) {
        this.safePublish(chatId, JSON.stringify({ chatId, eventType: 'abort', data: '[DONE]' }));
    }
    streamEndEvent(_) {
        // placeholder for future use
    }
    streamErrorEvent(chatId, msg) {
        this.safePublish(chatId, JSON.stringify({ chatId, eventType: 'error', data: msg }));
    }
    streamMetadataEvent(chatId, apiResponse) {
        try {
            const metadataJson = {};
            if (apiResponse.chatId) {
                metadataJson['chatId'] = apiResponse.chatId;
            }
            if (apiResponse.chatMessageId) {
                metadataJson['chatMessageId'] = apiResponse.chatMessageId;
            }
            if (apiResponse.question) {
                metadataJson['question'] = apiResponse.question;
            }
            if (apiResponse.sessionId) {
                metadataJson['sessionId'] = apiResponse.sessionId;
            }
            if (apiResponse.memoryType) {
                metadataJson['memoryType'] = apiResponse.memoryType;
            }
            if (apiResponse.action) {
                metadataJson['action'] = typeof apiResponse.action === 'string' ? JSON.parse(apiResponse.action) : apiResponse.action;
            }
            if (Object.keys(metadataJson).length > 0) {
                this.streamCustomEvent(chatId, 'metadata', metadataJson);
            }
        }
        catch (error) {
            logger_1.default.error('[RedisEventPublisher] Error streaming metadata event:', { error });
        }
    }
    streamUsageMetadataEvent(chatId, data) {
        this.safePublish(chatId, JSON.stringify({ chatId, eventType: 'usageMetadata', data }));
    }
    streamTTSStartEvent(chatId, chatMessageId, format) {
        this.safePublish(chatId, JSON.stringify({ chatId, chatMessageId, eventType: 'tts_start', data: { format } }));
    }
    streamTTSDataEvent(chatId, chatMessageId, audioChunk) {
        this.safePublish(chatId, JSON.stringify({ chatId, chatMessageId, eventType: 'tts_data', data: audioChunk }));
    }
    streamTTSEndEvent(chatId, chatMessageId) {
        this.safePublish(chatId, JSON.stringify({ chatId, chatMessageId, eventType: 'tts_end', data: {} }));
    }
    streamTTSAbortEvent(chatId, chatMessageId) {
        this.safePublish(chatId, JSON.stringify({ chatId, chatMessageId, eventType: 'tts_abort', data: {} }));
    }
    async disconnect() {
        if (this.redisPublisher) {
            await this.redisPublisher.quit();
        }
    }
}
exports.RedisEventPublisher = RedisEventPublisher;
//# sourceMappingURL=RedisEventPublisher.js.map