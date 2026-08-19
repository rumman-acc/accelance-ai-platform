import { Execution } from '../../database/entities/Execution';
import { ExecutionState } from '../../Interface';
export interface ExecutionFilters {
    id?: string;
    agentflowId?: string;
    agentflowName?: string;
    sessionId?: string;
    state?: ExecutionState;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
    workspaceId?: string;
}
declare const _default: {
    getExecutionById: (executionId: string, workspaceId?: string) => Promise<Execution | null>;
    getAllExecutions: (filters?: ExecutionFilters) => Promise<{
        data: Execution[];
        total: number;
    }>;
    deleteExecutions: (executionIds: string[], workspaceId?: string) => Promise<{
        success: boolean;
        deletedCount: number;
    }>;
    getPublicExecutionById: (executionId: string) => Promise<Execution | null>;
    updateExecution: (executionId: string, data: Partial<Execution>, workspaceId?: string) => Promise<Execution | null>;
};
export default _default;
