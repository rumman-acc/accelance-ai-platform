import { AxiosInstance } from 'axios';
import { Execution, ExecutionListParams, ExecutionListResponse } from '../../core/types';

export declare function createExecutionsApi(client: AxiosInstance): {
    /**
     * List executions with optional filters and pagination.
     * When agentflowId is provided this returns a scoped view (M1).
     * Without agentflowId it returns the full cross-agent list (M2).
     */
    getAllExecutions: (params: ExecutionListParams) => Promise<ExecutionListResponse>;
    getExecutionById: (executionId: string) => Promise<Execution>;
    deleteExecutions: (executionIds: string[]) => Promise<void>;
    updateExecution: (executionId: string, payload: {
        isPublic: boolean;
    }) => Promise<Execution>;
};
export type ExecutionsApi = ReturnType<typeof createExecutionsApi>;
