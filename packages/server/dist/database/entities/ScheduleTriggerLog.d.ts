import { IScheduleTriggerLog } from '../../Interface';
import { ScheduleTriggerType } from './ScheduleRecord';
export declare enum ScheduleTriggerStatus {
    QUEUED = "QUEUED",
    RUNNING = "RUNNING",
    SUCCEEDED = "SUCCEEDED",
    FAILED = "FAILED",
    SKIPPED = "SKIPPED"
}
export declare class ScheduleTriggerLog implements IScheduleTriggerLog {
    id: string;
    scheduleRecordId: string;
    triggerType: ScheduleTriggerType;
    targetId: string;
    /** Resulting execution/chatMessage ID (for agentflow triggers) */
    executionId?: string;
    status: ScheduleTriggerStatus;
    error?: string;
    elapsedTimeMs?: number;
    scheduledAt: Date;
    workspaceId: string;
    createdDate: Date;
}
