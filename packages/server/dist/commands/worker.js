"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../utils/logger"));
const QueueManager_1 = require("../queue/QueueManager");
const base_1 = require("./base");
const DataSource_1 = require("../DataSource");
const telemetry_1 = require("../utils/telemetry");
const NodesPool_1 = require("../NodesPool");
const CachePool_1 = require("../CachePool");
const bullmq_1 = require("bullmq");
const AbortControllerPool_1 = require("../AbortControllerPool");
const UsageCacheManager_1 = require("../UsageCacheManager");
const IdentityManager_1 = require("../IdentityManager");
class Worker extends base_1.BaseCommand {
    async run() {
        logger_1.default.info('Starting Accelance Worker...');
        const { appDataSource, telemetry, componentNodes, cachePool, abortControllerPool, usageCacheManager, identityManager } = await this.prepareData();
        const queueManager = QueueManager_1.QueueManager.getInstance();
        queueManager.setupAllQueues({
            componentNodes,
            telemetry,
            cachePool,
            appDataSource,
            abortControllerPool,
            usageCacheManager,
            identityManager
        });
        /** Prediction */
        const predictionQueue = queueManager.getQueue('prediction');
        const predictionWorker = predictionQueue.createWorker();
        this.predictionWorkerId = predictionWorker.id;
        logger_1.default.info(`Prediction Worker ${this.predictionWorkerId} created`);
        const predictionQueueName = predictionQueue.getQueueName();
        const queueEvents = new bullmq_1.QueueEvents(predictionQueueName, { connection: queueManager.getConnection() });
        queueEvents.on('abort', async ({ id }) => {
            abortControllerPool.abort(id);
        });
        /** Upsertion */
        const upsertionQueue = queueManager.getQueue('upsert');
        const upsertionWorker = upsertionQueue.createWorker();
        this.upsertionWorkerId = upsertionWorker.id;
        logger_1.default.info(`Upsertion Worker ${this.upsertionWorkerId} created`);
        /** Schedule */
        const scheduleQueue = queueManager.getQueue('schedule');
        const scheduleWorker = scheduleQueue.createWorker();
        this.scheduleWorkerId = scheduleWorker.id;
        logger_1.default.info(`Schedule Worker ${this.scheduleWorkerId} created`);
        // Keep the process running
        process.stdin.resume();
    }
    async prepareData() {
        // Init database
        const appDataSource = (0, DataSource_1.getDataSource)();
        await appDataSource.initialize();
        await appDataSource.runMigrations({ transaction: 'each' });
        // Initialize abortcontroller pool
        const abortControllerPool = new AbortControllerPool_1.AbortControllerPool();
        // Init telemetry
        const telemetry = new telemetry_1.Telemetry();
        // Initialize nodes pool
        const nodesPool = new NodesPool_1.NodesPool();
        await nodesPool.initialize();
        // Initialize cache pool
        const cachePool = new CachePool_1.CachePool();
        // Initialize usage cache manager
        const usageCacheManager = await UsageCacheManager_1.UsageCacheManager.getInstance();
        // Initialize identity manager
        const identityManager = await IdentityManager_1.IdentityManager.getInstance();
        return {
            appDataSource,
            telemetry,
            componentNodes: nodesPool.componentNodes,
            cachePool,
            abortControllerPool,
            usageCacheManager,
            identityManager
        };
    }
    async catch(error) {
        if (error.stack)
            logger_1.default.error(error.stack);
        await new Promise((resolve) => {
            setTimeout(resolve, 1000);
        });
        await this.failExit();
    }
    async stopProcess() {
        try {
            const queueManager = QueueManager_1.QueueManager.getInstance();
            const predictionWorker = queueManager.getQueue('prediction').getWorker();
            logger_1.default.info(`Shutting down Accelance Prediction Worker ${this.predictionWorkerId}...`);
            await predictionWorker.close();
            const upsertWorker = queueManager.getQueue('upsert').getWorker();
            logger_1.default.info(`Shutting down Accelance Upsertion Worker ${this.upsertionWorkerId}...`);
            await upsertWorker.close();
            const scheduleWorker = queueManager.getQueue('schedule').getWorker();
            logger_1.default.info(`Shutting down Accelance Schedule Worker ${this.scheduleWorkerId}...`);
            await scheduleWorker.close();
        }
        catch (error) {
            logger_1.default.error('There was an error shutting down Accelance Worker...', error);
            await this.failExit();
        }
        await this.gracefullyExit();
    }
}
exports.default = Worker;
//# sourceMappingURL=worker.js.map