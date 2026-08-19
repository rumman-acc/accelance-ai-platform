import { DataSource } from 'typeorm';
import { ScheduleRecord, ScheduleTriggerType } from '../../database/entities/ScheduleRecord';
import { ScheduleTriggerLog, ScheduleTriggerStatus } from '../../database/entities/ScheduleTriggerLog';
import { ScheduleInputMode } from '../../Interface';
export { validateCronExpression, computeNextRunAt, validateVisualPickerFields, buildCronFromVisualPicker, resolveScheduleCron, isScheduleInputValid, canScheduleEnable } from './utils';
export type { VisualPickerInput } from './utils';
export interface CreateScheduleInput {
    triggerType: ScheduleTriggerType;
    targetId: string;
    nodeId?: string;
    cronExpression: string;
    timezone?: string;
    enabled?: boolean;
    scheduleInputMode: ScheduleInputMode;
    defaultInput?: string;
    defaultForm?: string;
    endDate?: Date;
    workspaceId: string;
}
export interface UpdateScheduleInput {
    cronExpression?: string;
    timezone?: string;
    enabled?: boolean;
    scheduleInputMode?: ScheduleInputMode;
    defaultInput?: string;
    defaultForm?: string;
    endDate?: Date | null;
}
/**
 * A fallback cron expression used when the provided one is invalid,
 * to prevent the schedule from being deleted and to allow users
 * to fix the cron expression without losing the schedule record.
 * The beat will skip execution if it detects this fallback expression, and will log an error for visibility.
 */
export declare const FALLBACK_CRON_EXPRESSION = "0 0 * * *";
export declare const FALLBACK_TIMEZONE = "UTC";
export interface GetTriggerLogsFilter {
    /** Optional status filter (single value or array) */
    status?: ScheduleTriggerStatus | ScheduleTriggerStatus[];
    /** 1-based page */
    page?: number;
    /** Page size; defaults to 20, clamped to [1, 100] */
    limit?: number;
}
declare const _default: {
    validateCronExpression: (expression: string, timezone?: string, minIntervalSeconds?: number) => {
        valid: boolean;
        error?: string;
    };
    validateVisualPickerFields: (input: import("./utils").VisualPickerInput) => {
        valid: boolean;
        error?: string;
    };
    buildCronFromVisualPicker: (input: import("./utils").VisualPickerInput) => string;
    resolveScheduleCron: (inputs: Record<string, any>) => {
        valid: boolean;
        cronExpression?: string;
        error?: string;
    };
    createOrUpdateSchedule: (input: CreateScheduleInput) => Promise<ScheduleRecord>;
    deleteScheduleForTarget: (targetId: string, triggerType: ScheduleTriggerType, workspaceId: string) => Promise<ScheduleRecord | void>;
    getEnabledSchedulesBatch: (skip?: number, take?: number) => Promise<ScheduleRecord[]>;
    updateScheduleAfterRun: (appDataSource: DataSource, scheduleRecordId: string, cronExpression: string, timezone?: string) => Promise<void>;
    computeNextRunAt: (cronExpression: string, timezone?: string, after?: Date) => Date | null;
    createTriggerLog: (data: {
        appDataSource: DataSource;
        scheduleRecordId: string;
        triggerType: ScheduleTriggerType;
        targetId: string;
        status: ScheduleTriggerStatus;
        scheduledAt: Date;
        workspaceId: string;
        executionId?: string;
        error?: string;
        elapsedTimeMs?: number;
    }) => Promise<ScheduleTriggerLog>;
    updateTriggerLog: (appDataSource: DataSource, logId: string, update: {
        status: ScheduleTriggerStatus;
        error?: string;
        elapsedTimeMs?: number;
        executionId?: string;
    }) => Promise<void>;
    getScheduleStatus: (targetId: string, workspaceId: string) => Promise<{
        record: ScheduleRecord | null;
        canEnable: boolean;
        reason?: string;
    }>;
    toggleScheduleEnabled: (targetId: string, workspaceId: string, enabled: boolean) => Promise<ScheduleRecord>;
    getTriggerLogs: (targetId: string, workspaceId: string, filter?: GetTriggerLogsFilter) => Promise<{
        data: ScheduleTriggerLog[];
        total: number;
        page: number;
        limit: number;
    }>;
    deleteTriggerLogs: (targetId: string, workspaceId: string, logIds: string[]) => Promise<{
        success: boolean;
        deletedLogs: number;
        deletedExecutions: number;
    }>;
    isScheduleInputValid: (mode: ScheduleInputMode, defaultInput?: string, scheduleFormInputTypes?: any[]) => boolean;
    canScheduleEnable: (inputs: Record<string, any>) => boolean;
};
export default _default;
