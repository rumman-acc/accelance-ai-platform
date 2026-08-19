import { IToolCallAudit } from '../../Interface';
export declare enum ToolCallDecision {
    ALLOWED = "allowed",
    DENIED = "denied"
}
/**
 * One row per tool invocation attempt, written by wrapToolWithPolicy() (accelance-components'
 * toolPolicy.ts) at both enforcement chokepoints. Not linked to a specific Execution row yet --
 * that would need an executionId threaded through the options bag the same way Phase 0 threaded
 * userId; left for a follow-up rather than expanding this pass further.
 */
export declare class ToolCallAudit implements IToolCallAudit {
    id: string;
    workspaceId: string;
    chatflowId: string;
    userId?: string;
    toolNodeName: string;
    credentialId?: string;
    decision: ToolCallDecision;
    reason?: string;
    createdDate: Date;
}
