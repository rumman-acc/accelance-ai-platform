"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictionQueue = void 0;
const buildChatflow_1 = require("../utils/buildChatflow");
const RedisEventPublisher_1 = require("./RedisEventPublisher");
const BaseQueue_1 = require("./BaseQueue");
const logger_1 = __importDefault(require("../utils/logger"));
const accelance_components_1 = require("accelance-components");
const utils_1 = require("../utils");
const executeCustomNodeFunction_1 = require("../utils/executeCustomNodeFunction");
class PredictionQueue extends BaseQueue_1.BaseQueue {
    constructor(name, connection, options) {
        super(name, connection);
        this.queueName = name;
        this.componentNodes = options.componentNodes || {};
        this.telemetry = options.telemetry;
        this.cachePool = options.cachePool;
        this.appDataSource = options.appDataSource;
        this.abortControllerPool = options.abortControllerPool;
        this.usageCacheManager = options.usageCacheManager;
        this.redisPublisher = new RedisEventPublisher_1.RedisEventPublisher();
        this.redisPublisher.connect();
    }
    getQueueName() {
        return this.queueName;
    }
    getQueue() {
        return this.queue;
    }
    async processJob(data) {
        if (this.redisPublisher) {
            await this.redisPublisher.connect();
        }
        if (this.appDataSource)
            data.appDataSource = this.appDataSource;
        if (this.telemetry)
            data.telemetry = this.telemetry;
        if (this.cachePool)
            data.cachePool = this.cachePool;
        if (this.usageCacheManager)
            data.usageCacheManager = this.usageCacheManager;
        if (this.componentNodes)
            data.componentNodes = this.componentNodes;
        if (this.redisPublisher)
            data.sseStreamer = this.redisPublisher;
        if (Object.prototype.hasOwnProperty.call(data, 'isAgentFlowGenerator')) {
            logger_1.default.info(`Generating Agentflow...`);
            const { prompt, componentNodes, toolNodes, selectedChatModel, question } = data;
            const options = {
                appDataSource: this.appDataSource,
                databaseEntities: utils_1.databaseEntities,
                logger: logger_1.default
            };
            return await (0, accelance_components_1.generateAgentflowv2)({ prompt, componentNodes, toolNodes, selectedChatModel }, question, options);
        }
        if (Object.prototype.hasOwnProperty.call(data, 'isExecuteCustomFunction')) {
            const executeCustomFunctionData = data;
            logger_1.default.info(`[${executeCustomFunctionData.orgId}]: Executing Custom Function...`);
            return await (0, executeCustomNodeFunction_1.executeCustomNodeFunction)({
                appDataSource: this.appDataSource,
                componentNodes: this.componentNodes,
                data: executeCustomFunctionData.data,
                workspaceId: executeCustomFunctionData.workspaceId,
                orgId: executeCustomFunctionData.orgId,
                canViewVariables: executeCustomFunctionData.canViewVariables
            });
        }
        if (this.abortControllerPool) {
            const abortControllerId = `${data.chatflow.id}_${data.chatId}`;
            const signal = new AbortController();
            this.abortControllerPool.add(abortControllerId, signal);
            data.signal = signal;
        }
        return await (0, buildChatflow_1.executeFlow)(data);
    }
}
exports.PredictionQueue = PredictionQueue;
//# sourceMappingURL=PredictionQueue.js.map