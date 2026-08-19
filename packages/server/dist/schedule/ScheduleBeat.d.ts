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
export declare class ScheduleBeat {
    private static instance;
    private isQueueMode;
    /** Map of scheduleRecordId → node-cron ScheduledTask (non-queue mode only) */
    private cronJobs;
    private constructor();
    static getInstance(): ScheduleBeat;
    /**
     * Initialize scheduling. Must be called after the DB is initialized.
     *
     * NOTE: In non-queue mode, schedules are executed via in-process cron jobs without
     * any distributed locking or leader election. If the API is deployed with
     * multiple replicas and all of them call ScheduleBeat.init(), each replica
     * will run the same schedules, causing duplicate executions. For High Availability (HA) / multi-
     * replica deployments, configure MODE.QUEUE and use the queue-based scheduler.
     */
    init(): Promise<void>;
    /**
     * Call this after a schedule is created/updated/deleted to resync.
     * Mode-agnostic — delegates to _removeJob / _upsertJob which dispatch
     * to BullMQ (queue mode) or node-cron (non-queue mode).
     */
    onScheduleChanged(scheduleRecordId: string, action: 'upsert' | 'delete'): Promise<void>;
    /**
     * Stop all scheduling activity (called on graceful shutdown).
     */
    shutdown(): Promise<void>;
    /**
     * Register (or re-register) a schedule job via the active backend.
     */
    private _upsertJob;
    /**
     * Remove a schedule job from the active backend.
     */
    private _removeJob;
    /**
     * Get the ScheduleQueue instance (queue mode only). Returns undefined with a warning if unavailable.
     */
    private _getScheduleQueue;
    /**
     * Loads all enabled schedules in batches and registers them via the active backend.
     */
    private _syncAllJobs;
    /**
     * Register (or re-register) a node-cron job for a schedule record.
     *
     * `node-cron` does not support the `L` (last day of month) token, while BullMQ /
     * cron-parser does. To keep both backends in sync we expand `L` → `28-31` for
     * node-cron's parser and add a runtime DOM filter so candidate days only
     * actually fire when they really are the last day of the current month.
     */
    private _upsertCronJob;
    /**
     * Stop and remove a node-cron job for a schedule record.
     */
    private _removeCronJob;
    /**
     * Callback fired by node-cron. Delegates to the shared ScheduleExecutor
     * with Beat-specific cleanup callbacks.
     */
    private _onCronFire;
}
