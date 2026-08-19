"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpsertQueue = void 0;
const BaseQueue_1 = require("./BaseQueue");
const upsertVector_1 = require("../utils/upsertVector");
const documentstore_1 = require("../services/documentstore");
const logger_1 = __importDefault(require("../utils/logger"));
class UpsertQueue extends BaseQueue_1.BaseQueue {
    constructor(name, connection, options) {
        super(name, connection);
        this.queueName = name;
        this.componentNodes = options.componentNodes || {};
        this.telemetry = options.telemetry;
        this.cachePool = options.cachePool;
        this.appDataSource = options.appDataSource;
        this.usageCacheManager = options.usageCacheManager;
    }
    getQueueName() {
        return this.queueName;
    }
    getQueue() {
        return this.queue;
    }
    async processJob(data) {
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
        // document-store/loader/preview
        if (Object.prototype.hasOwnProperty.call(data, 'isPreviewOnly')) {
            logger_1.default.info('Previewing loader...');
            return await (0, documentstore_1.previewChunks)(data);
        }
        // document-store/loader/process/:loaderId
        if (Object.prototype.hasOwnProperty.call(data, 'isProcessWithoutUpsert')) {
            logger_1.default.info('Processing loader...');
            return await (0, documentstore_1.processLoader)(data);
        }
        // document-store/vectorstore/insert/:loaderId
        if (Object.prototype.hasOwnProperty.call(data, 'isVectorStoreInsert')) {
            logger_1.default.info('Inserting vector store...');
            return await (0, documentstore_1.insertIntoVectorStore)(data);
        }
        // document-store/upsert/:storeId
        if (Object.prototype.hasOwnProperty.call(data, 'storeId')) {
            logger_1.default.info('Upserting to vector store via document loader...');
            return await (0, documentstore_1.executeDocStoreUpsert)(data);
        }
        // upsert-vector/:chatflowid
        logger_1.default.info('Upserting to vector store via chatflow...');
        return await (0, upsertVector_1.executeUpsert)(data);
    }
}
exports.UpsertQueue = UpsertQueue;
//# sourceMappingURL=UpsertQueue.js.map