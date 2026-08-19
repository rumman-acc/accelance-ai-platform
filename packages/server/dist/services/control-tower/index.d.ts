export interface ControlTowerStats {
    totalAgents: number;
    healthy: number;
    needsAttention: number;
    runningNow: number;
    awaitingApproval: number;
}
export type AgentHealthStatus = 'healthy' | 'needsAttention' | 'runningNow';
declare const _default: {
    getStats: (workspaceId?: string) => Promise<ControlTowerStats>;
    getAgentIdsByStatus: (status: AgentHealthStatus, workspaceId?: string) => Promise<string[]>;
};
export default _default;
