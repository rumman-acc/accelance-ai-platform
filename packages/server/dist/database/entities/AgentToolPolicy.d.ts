import { IAgentToolPolicy } from '../../Interface';
export declare enum AgentToolPolicyEffect {
    ALLOW = "allow",
    DENY = "deny"
}
/**
 * Least-privilege allowlist: may this agent (or the workspace by default) invoke this tool node
 * type at all? Keyed on toolNodeName (e.g. "gmail", "customMCP", "agentAsTool") -- coarse by
 * design. For composite tool nodes like AgentAsTool, this restricts whether the node type may
 * run at all, not which specific downstream target (e.g. which agentflow) it calls -- see
 * AgentToolPolicyService for the matching rule.
 */
export declare class AgentToolPolicy implements IAgentToolPolicy {
    id: string;
    workspaceId: string;
    chatflowId: string;
    toolNodeName: string;
    effect: AgentToolPolicyEffect;
    createdBy?: string;
    createdDate: Date;
    updatedDate: Date;
}
