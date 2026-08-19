import { AgentToolPolicy, AgentToolPolicyEffect } from '../../database/entities/AgentToolPolicy';
declare const _default: {
    evaluate: (workspaceId: string, chatflowId: string, toolNodeName: string) => Promise<AgentToolPolicyEffect>;
    listPolicies: (workspaceId: string, chatflowId?: string) => Promise<AgentToolPolicy[]>;
    upsertPolicy: (workspaceId: string, chatflowId: string | undefined, toolNodeName: string, effect: AgentToolPolicyEffect, createdBy?: string) => Promise<AgentToolPolicy>;
    deletePolicy: (id: string, workspaceId: string) => Promise<import("typeorm").DeleteResult>;
};
export default _default;
