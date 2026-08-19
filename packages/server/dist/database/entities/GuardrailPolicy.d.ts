import { IGuardrailPolicy } from '../../Interface';
/**
 * Enable/configure state for a policy-type GuardrailCatalogItem, scoped the same way
 * AgentToolPolicy already is: chatflowId='' is the workspace-wide default, a specific chatflowId
 * overrides it for that one agent, most-specific-match-wins, and no matching row means the
 * guardrail is OFF (unlike AgentToolPolicy, which defaults permissive -- there's no "already
 * broken if this ships" risk here since nothing is enforced until an admin opts in).
 */
export declare class GuardrailPolicy implements IGuardrailPolicy {
    id: string;
    workspaceId: string;
    chatflowId: string;
    catalogKey: string;
    enabled: boolean;
    config?: string;
    createdBy?: string;
    createdDate: Date;
    updatedDate: Date;
}
