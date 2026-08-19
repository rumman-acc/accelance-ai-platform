import { IServerSideEventStreamer } from 'accelance-components';
import { IChatFlow, IComponentNodes, IDepthQueue, IReactFlowNode, IReactFlowEdge, IMessage, IncomingInput, IFlowConfig } from '../Interface';
import { DataSource } from 'typeorm';
import { CachePool } from '../CachePool';
/**
 * Build Agent Graph
 */
export declare const buildAgentGraph: ({ agentflow, flowConfig, incomingInput, nodes, edges, initializedNodes, endingNodeIds, startingNodeIds, depthQueue, chatHistory, uploadedFilesContent, appDataSource, componentNodes, sseStreamer, shouldStreamResponse, cachePool, baseURL, signal, orgId, workspaceId, userId }: {
    agentflow: IChatFlow;
    flowConfig: IFlowConfig;
    incomingInput: IncomingInput;
    nodes: IReactFlowNode[];
    edges: IReactFlowEdge[];
    initializedNodes: IReactFlowNode[];
    endingNodeIds: string[];
    startingNodeIds: string[];
    depthQueue: IDepthQueue;
    chatHistory: IMessage[];
    uploadedFilesContent: string;
    appDataSource: DataSource;
    componentNodes: IComponentNodes;
    sseStreamer: IServerSideEventStreamer;
    shouldStreamResponse: boolean;
    cachePool: CachePool;
    baseURL: string;
    signal?: AbortController;
    orgId: string;
    workspaceId?: string;
    userId?: string;
}) => Promise<any>;
