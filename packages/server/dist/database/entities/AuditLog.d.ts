import { IAuditLog } from '../../Interface';
/**
 * Append-only. Only written to when the 'audit_log' GuardrailPolicy is enabled for the
 * workspace (checked by services/audit-log itself, not by callers) -- covers guardrail/tool-policy
 * changes and chatflow deletion in this first pass, not every action platform-wide yet.
 */
export declare class AuditLog implements IAuditLog {
    id: string;
    workspaceId: string;
    userId?: string;
    action: string;
    targetType: string;
    targetId?: string;
    metadata?: string;
    createdDate: Date;
}
