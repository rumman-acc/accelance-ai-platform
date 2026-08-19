/**
 * Data Retention Policy guardrail: for every workspace with the policy enabled, deletes chat
 * messages / executions / tool-call-audit rows older than the configured window. Runs once daily
 * via node-cron directly (not the ScheduleRecord/ScheduleBeat system, which is for user-created
 * flow schedules, not this kind of system-level compliance job) -- simplest correct choice for a
 * single, always-on job.
 */
export declare const runRetentionCleanup: () => Promise<void>;
export declare const startRetentionCleanupJob: () => void;
