import { ICommonObject, IMessage } from 'accelance-components';
import { IncomingAgentflowInput, INodeData, IExecuteFlowParams, IFlowConfig, IAgentflowExecutedData, IComponentNodes, IVariableOverride } from '../Interface';
import { Variable } from '../database/entities/Variable';
interface IExecuteAgentFlowParams extends Omit<IExecuteFlowParams, 'incomingInput'> {
    incomingInput: IncomingAgentflowInput;
}
export declare const resolveVariables: (reactFlowNodeData: INodeData, question: string, form: Record<string, any>, flowConfig: IFlowConfig | undefined, availableVariables: Variable[], variableOverrides: IVariableOverride[], uploadedFilesContent: string, chatHistory: IMessage[], componentNodes: IComponentNodes, agentFlowExecutedData?: IAgentflowExecutedData[], iterationContext?: ICommonObject, loopCounts?: Map<string, number>, webhook?: Record<string, any>) => Promise<INodeData>;
export declare const executeAgentFlow: ({ componentNodes, incomingInput, chatflow, chatId, evaluationRunId, appDataSource, telemetry, usageCacheManager, cachePool, sseStreamer, baseURL, isInternal, uploadedFilesContent, fileUploads, signal: abortController, isRecursive, parentExecutionId, iterationContext, isTool, chatType, orgId, workspaceId, subscriptionId, productId, userId }: IExecuteAgentFlowParams) => Promise<ICommonObject>;
/**
 * Utility function to check if an object is not empty, null, or undefined
 */
export declare const isObjectNotEmpty: (obj: any) => boolean;
export {};
