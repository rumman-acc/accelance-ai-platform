import { IExecution, ExecutionState } from '../../Interface';
import { ChatFlow } from './ChatFlow';
export declare class Execution implements IExecution {
    id: string;
    executionData: string;
    state: ExecutionState;
    agentflowId: string;
    sessionId: string;
    action?: string;
    isPublic?: boolean;
    createdDate: Date;
    updatedDate: Date;
    stoppedDate: Date;
    agentflow: ChatFlow;
    workspaceId: string;
    userId?: string;
}
