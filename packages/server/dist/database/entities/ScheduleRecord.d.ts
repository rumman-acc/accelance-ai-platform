import { IScheduleRecord, ScheduleInputMode } from '../../Interface';
export declare enum ScheduleTriggerType {
    AGENTFLOW = "AGENTFLOW"
}
export declare class ScheduleRecord implements IScheduleRecord {
    id: string;
    /** Discriminator: which entity type is being scheduled */
    triggerType: ScheduleTriggerType;
    /** FK to the target entity (ChatFlow.id for AGENTFLOW) */
    targetId: string;
    /** Node ID within the flow (for traceability) */
    nodeId?: string;
    /** Standard 5 or 6 field cron expression */
    cronExpression: string;
    /** IANA timezone string, e.g. "UTC" or "America/New_York" */
    timezone: string;
    /** Whether the schedule is active */
    enabled: boolean;
    scheduleInputMode: ScheduleInputMode;
    /** Optional static text sent as question when the flow fires (scheduleInputMode='text') */
    defaultInput?: string;
    /** Optional JSON-serialized Record<string, any> passed as incomingInput.form (scheduleInputMode='form') */
    defaultForm?: string;
    lastRunAt?: Date;
    nextRunAt?: Date;
    /** Optional date/time after which the schedule will no longer fire */
    endDate?: Date;
    workspaceId: string;
    createdDate: Date;
    updatedDate: Date;
}
