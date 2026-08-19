/**
 * ScheduleExecutor
 *
 * Shared execution logic for scheduled agentflow jobs. Used by both
 * ScheduleBeat (non-queue / node-cron mode) and ScheduleQueue (BullMQ mode)
 * so that validation, execution, logging, and post-run updates live in one place.
 */
import { DataSource } from 'typeorm';
import { IComponentNodes } from '../Interface';
import { IServerSideEventStreamer } from 'accelance-components';
import { ScheduleRecord } from '../database/entities/ScheduleRecord';
import { Telemetry } from '../utils/telemetry';
import { CachePool } from '../CachePool';
import { UsageCacheManager } from '../UsageCacheManager';
import { IdentityManager } from '../IdentityManager';
/**
 * Runtime dependencies required to execute a scheduled agentflow.
 * Both queue and non-queue modes supply these from their own context.
 */
export interface ScheduleExecutionContext {
    appDataSource: DataSource;
    componentNodes: IComponentNodes;
    telemetry: Telemetry;
    cachePool: CachePool;
    usageCacheManager: UsageCacheManager;
    sseStreamer: IServerSideEventStreamer;
    identityManager: IdentityManager;
}
/**
 * Optional hooks for mode-specific side-effects during validation.
 * These let each mode handle cleanup its own way (e.g. removing a cron job
 * vs. removing a BullMQ job scheduler) without polluting the shared logic.
 */
export interface ScheduleExecutionCallbacks {
    /** Called when the schedule record is not found or is disabled. */
    onRecordNotFoundOrDisabled?: (scheduleRecordId: string) => Promise<void> | void;
    /** Called when the schedule has passed its endDate or has invalid input. */
    onRecordExpiredOrInvalid?: (record: ScheduleRecord) => Promise<void> | void;
}
/**
 * Validate and execute a single scheduled agentflow job.
 *
 * Pipeline:
 *  1. Load ScheduleRecord from DB
 *  2. Check enabled / endDate / defaultInput / nextRunAt  →  SKIPPED if invalid
 *  3. Create RUNNING trigger log
 *  4. Load ChatFlow, build input, execute agentflow
 *  5. Update trigger log (SUCCEEDED / FAILED)
 *  6. Update schedule after run (lastRunAt, nextRunAt)
 *
 * @returns The agentflow execution result, or `undefined` if skipped.
 */
export declare function executeScheduleJob(ctx: ScheduleExecutionContext, scheduleRecordId: string, callbacks?: ScheduleExecutionCallbacks): Promise<any>;
