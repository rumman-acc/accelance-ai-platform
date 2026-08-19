"use strict";
/**
 * ScheduleBeat
 *
 * Responsible for keeping BullMQ repeatable jobs (or in-process timers)
 * in sync with the ScheduleRecord table.
 *
 * Queue mode    : delegates scheduling to BullMQ repeat jobs via ScheduleQueue.
 * Non-queue mode: uses node-cron to register per-schedule cron jobs in-process.
 *
 * Either way, ScheduleBeat.init() must be called once after the DB is ready.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleBeat = void 0;
const getRunningExpressApp_1 = require("../utils/getRunningExpressApp");
const ScheduleRecord_1 = require("../database/entities/ScheduleRecord");
const QueueManager_1 = require("../queue/QueueManager");
const ScheduleExecutor_1 = require("./ScheduleExecutor");
const schedule_1 = __importDefault(require("../services/schedule"));
const utils_1 = require("../services/schedule/utils");
const Interface_1 = require("../Interface");
const logger_1 = __importDefault(require("../utils/logger"));
const node_cron_1 = __importDefault(require("node-cron"));
// ---------------------------------------------------------------------------
class ScheduleBeat {
    constructor() {
        /** Map of scheduleRecordId → node-cron ScheduledTask (non-queue mode only) */
        this.cronJobs = new Map();
        this.isQueueMode = process.env.MODE === Interface_1.MODE.QUEUE;
    }
    static getInstance() {
        if (!ScheduleBeat.instance) {
            ScheduleBeat.instance = new ScheduleBeat();
        }
        return ScheduleBeat.instance;
    }
    /**
     * Initialize scheduling. Must be called after the DB is initialized.
     *
     * NOTE: In non-queue mode, schedules are executed via in-process cron jobs without
     * any distributed locking or leader election. If the API is deployed with
     * multiple replicas and all of them call ScheduleBeat.init(), each replica
     * will run the same schedules, causing duplicate executions. For High Availability (HA) / multi-
     * replica deployments, configure MODE.QUEUE and use the queue-based scheduler.
     */
    async init() {
        logger_1.default.info(`[ScheduleBeat]: Initializing in ${this.isQueueMode ? 'queue' : 'non-queue'} mode`);
        if (!this.isQueueMode) {
            logger_1.default.warn('[ScheduleBeat]: Running in non-queue mode with node-cron and no distributed locking. ' +
                'If multiple API replicas are running, schedules will be executed once per replica. ' +
                'For High Availability (HA) deployments, enable queue mode (MODE.QUEUE) to avoid duplicate executions.');
        }
        await this._syncAllJobs();
    }
    /**
     * Call this after a schedule is created/updated/deleted to resync.
     * Mode-agnostic — delegates to _removeJob / _upsertJob which dispatch
     * to BullMQ (queue mode) or node-cron (non-queue mode).
     */
    async onScheduleChanged(scheduleRecordId, action) {
        try {
            if (action === 'delete') {
                await this._removeJob(scheduleRecordId);
                return;
            }
            const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
            const scheduleRecord = await appServer.AppDataSource.getRepository(ScheduleRecord_1.ScheduleRecord).findOneBy({ id: scheduleRecordId });
            if (!scheduleRecord || !scheduleRecord.enabled) {
                await this._removeJob(scheduleRecordId);
            }
            else {
                await this._upsertJob(scheduleRecord);
            }
        }
        catch (error) {
            logger_1.default.error(`[ScheduleBeat]: onScheduleChanged error: ${error}`);
        }
    }
    /**
     * Stop all scheduling activity (called on graceful shutdown).
     */
    async shutdown() {
        for (const [, task] of this.cronJobs) {
            task.stop();
        }
        this.cronJobs.clear();
    }
    // ─── Mode-agnostic job management ───────────────────────────────────────
    /**
     * Register (or re-register) a schedule job via the active backend.
     */
    async _upsertJob(record) {
        if (this.isQueueMode) {
            const scheduleQueue = this._getScheduleQueue();
            if (!scheduleQueue)
                return;
            await scheduleQueue.upsertJobScheduler(record);
        }
        else {
            this._upsertCronJob(record);
        }
    }
    /**
     * Remove a schedule job from the active backend.
     */
    async _removeJob(scheduleRecordId) {
        if (this.isQueueMode) {
            const scheduleQueue = this._getScheduleQueue();
            if (!scheduleQueue)
                return;
            await scheduleQueue.removeJobScheduler(scheduleRecordId);
        }
        else {
            this._removeCronJob(scheduleRecordId);
        }
    }
    /**
     * Get the ScheduleQueue instance (queue mode only). Returns undefined with a warning if unavailable.
     */
    _getScheduleQueue() {
        const scheduleQueue = QueueManager_1.QueueManager.getInstance().getQueue('schedule');
        if (!scheduleQueue) {
            logger_1.default.warn('[ScheduleBeat]: ScheduleQueue not available');
        }
        return scheduleQueue;
    }
    /**
     * Loads all enabled schedules in batches and registers them via the active backend.
     */
    async _syncAllJobs() {
        // In non-queue mode, stop existing cron jobs first
        if (!this.isQueueMode) {
            for (const [, task] of this.cronJobs) {
                task.stop();
            }
            this.cronJobs.clear();
        }
        let skip = 0;
        let totalSynced = 0;
        let batch;
        do {
            batch = await schedule_1.default.getEnabledSchedulesBatch(skip);
            for (const record of batch) {
                await this._upsertJob(record);
            }
            totalSynced += batch.length;
            skip += batch.length;
        } while (batch.length > 0);
        logger_1.default.info(`[ScheduleBeat]: Synced ${totalSynced} schedule(s)`);
    }
    /**
     * Register (or re-register) a node-cron job for a schedule record.
     *
     * `node-cron` does not support the `L` (last day of month) token, while BullMQ /
     * cron-parser does. To keep both backends in sync we expand `L` → `28-31` for
     * node-cron's parser and add a runtime DOM filter so candidate days only
     * actually fire when they really are the last day of the current month.
     */
    _upsertCronJob(record) {
        this._removeCronJob(record.id);
        const tz = record.timezone ?? 'UTC';
        const { expression: nodeCronExpression, hasL } = (0, utils_1.expandCronLForNodeCron)(record.cronExpression);
        if (!node_cron_1.default.validate(nodeCronExpression)) {
            logger_1.default.warn(`[ScheduleBeat]: Invalid cron expression for schedule ${record.id}: "${record.cronExpression}", skipping`);
            return;
        }
        const task = node_cron_1.default.schedule(nodeCronExpression, () => {
            // When the original expression used `L`, only fire on a real match
            // (i.e. today's DOM in `tz` actually satisfies the original DOM field).
            if (hasL && !(0, utils_1.cronDomMatchesNow)(record.cronExpression, new Date(), tz)) {
                logger_1.default.debug(`[ScheduleBeat]: Skipping cron fire for schedule ${record.id} because today does not match original DOM field with L token`);
                return;
            }
            this._onCronFire(record.id).catch((err) => {
                logger_1.default.error(`[ScheduleBeat]: Error firing schedule ${record.id}: ${err}`);
            });
        }, { timezone: tz });
        this.cronJobs.set(record.id, task);
        logger_1.default.debug(`[ScheduleBeat]: Registered cron job for schedule ${record.id} ` +
            `(${record.cronExpression}${hasL ? ` → ${nodeCronExpression}` : ''} ${tz})`);
    }
    /**
     * Stop and remove a node-cron job for a schedule record.
     */
    _removeCronJob(scheduleRecordId) {
        const existing = this.cronJobs.get(scheduleRecordId);
        if (existing) {
            existing.stop();
            this.cronJobs.delete(scheduleRecordId);
            logger_1.default.debug(`[ScheduleBeat]: Removed cron job for schedule ${scheduleRecordId}`);
        }
    }
    /**
     * Callback fired by node-cron. Delegates to the shared ScheduleExecutor
     * with Beat-specific cleanup callbacks.
     */
    async _onCronFire(scheduleRecordId) {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const ctx = {
            appDataSource: appServer.AppDataSource,
            componentNodes: appServer.nodesPool.componentNodes,
            telemetry: appServer.telemetry,
            cachePool: appServer.cachePool,
            usageCacheManager: appServer.usageCacheManager,
            sseStreamer: appServer.sseStreamer,
            identityManager: appServer.identityManager
        };
        await (0, ScheduleExecutor_1.executeScheduleJob)(ctx, scheduleRecordId, {
            onRecordNotFoundOrDisabled: () => {
                this._removeCronJob(scheduleRecordId);
            },
            onRecordExpiredOrInvalid: async (record) => {
                record.enabled = false;
                await appServer.AppDataSource.getRepository(ScheduleRecord_1.ScheduleRecord).save(record);
                this._removeCronJob(record.id);
            }
        });
    }
}
exports.ScheduleBeat = ScheduleBeat;
//# sourceMappingURL=ScheduleBeat.js.map