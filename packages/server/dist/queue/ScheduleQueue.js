"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleQueue = void 0;
const BaseQueue_1 = require("./BaseQueue");
const ScheduleRecord_1 = require("../database/entities/ScheduleRecord");
const logger_1 = __importDefault(require("../utils/logger"));
const RedisEventPublisher_1 = require("./RedisEventPublisher");
const ScheduleExecutor_1 = require("../schedule/ScheduleExecutor");
class ScheduleQueue extends BaseQueue_1.BaseQueue {
    constructor(name, connection, options) {
        super(name, connection);
        this.queueName = name;
        this.componentNodes = options.componentNodes || {};
        this.telemetry = options.telemetry;
        this.cachePool = options.cachePool;
        this.appDataSource = options.appDataSource;
        this.usageCacheManager = options.usageCacheManager;
        this.identityManager = options.identityManager;
        this.redisPublisher = new RedisEventPublisher_1.RedisEventPublisher(); // sseStreamer for agentflow execution results
        this.redisPublisher.connect();
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
        const { scheduleRecordId } = data;
        const ctx = {
            appDataSource: this.appDataSource,
            componentNodes: this.componentNodes,
            telemetry: this.telemetry,
            cachePool: this.cachePool,
            usageCacheManager: this.usageCacheManager,
            sseStreamer: this.redisPublisher,
            identityManager: this.identityManager
        };
        return (0, ScheduleExecutor_1.executeScheduleJob)(ctx, scheduleRecordId, {
            onRecordNotFoundOrDisabled: async () => {
                await this.removeJobScheduler(scheduleRecordId);
            },
            onRecordExpiredOrInvalid: async (record) => {
                record.enabled = false;
                await this.appDataSource.getRepository(ScheduleRecord_1.ScheduleRecord).save(record);
                await this.removeJobScheduler(scheduleRecordId);
            }
        });
    }
    /**
     * Add a repeatable scheduled job using BullMQ's repeat options.
     * BullMQ deduplicates repeatable jobs by jobId pattern — safe to call on every startup.
     */
    async upsertJobScheduler(record) {
        const timezone = record.timezone ?? 'UTC';
        const jobData = {
            scheduleRecordId: record.id,
            targetId: record.targetId,
            cronExpression: record.cronExpression,
            timezone: timezone,
            defaultInput: record.defaultInput ?? undefined,
            workspaceId: record.workspaceId,
            scheduledAt: new Date().toISOString()
        };
        const repeatOptions = {
            pattern: record.cronExpression,
            tz: timezone
        };
        await this.queue.upsertJobScheduler(`schedule:${record.id}`, repeatOptions, {
            name: `schedule:${record.id}`,
            data: jobData
        });
        logger_1.default.debug(`[ScheduleQueue]: Registered repeatable job for schedule ${record.id} (${record.cronExpression})`);
    }
    /**
     * Remove a repeatable scheduled job from the queue.
     */
    async removeJobScheduler(scheduleRecordId) {
        try {
            await this.queue.removeJobScheduler(`schedule:${scheduleRecordId}`);
            logger_1.default.debug(`[ScheduleQueue]: Removed repeatable job for schedule ${scheduleRecordId}`);
        }
        catch (error) {
            logger_1.default.warn(`[ScheduleQueue]: Could not remove repeatable job for schedule ${scheduleRecordId}: ${error}`);
        }
    }
}
exports.ScheduleQueue = ScheduleQueue;
//# sourceMappingURL=ScheduleQueue.js.map