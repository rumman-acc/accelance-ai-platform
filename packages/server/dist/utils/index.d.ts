/**
 * Strictly no getRepository, appServer here, must be passed as parameter
 */
import { IChatFlow, IComponentCredentials, IComponentNodes, ICredentialDataDecrypted, ICredentialReqBody, IDepthQueue, INodeData, INodeDependencies, INodeDirectedGraph, INodeOverrides, IOverrideConfig, IReactFlowEdge, IReactFlowNode, IVariable, IVariableOverride, IncomingInput } from '../Interface';
import { ICommonObject, IDatabaseEntity, IMessage, IFileUpload } from 'accelance-components';
import { Credential } from '../database/entities/Credential';
import { DataSource } from 'typeorm';
import { CachePool } from '../CachePool';
export declare const QUESTION_VAR_PREFIX = "question";
export declare const FILE_ATTACHMENT_PREFIX = "file_attachment";
export declare const CHAT_HISTORY_VAR_PREFIX = "chat_history";
export declare const RUNTIME_MESSAGES_LENGTH_VAR_PREFIX = "runtime_messages_length";
export declare const LOOP_COUNT_VAR_PREFIX = "loop_count";
export declare const CURRENT_DATE_TIME_VAR_PREFIX = "current_date_time";
export declare const REDACTED_CREDENTIAL_VALUE = "_FLOWISE_BLANK_07167752-1a71-43b1-bf8f-4f32252165db";
export declare const databaseEntities: IDatabaseEntity;
/**
 * Returns the home folder path of the user if
 * none can be found it falls back to the current
 * working directory
 *
 */
export declare const getUserHome: () => string;
/**
 * Returns the path of node modules package
 * @param {string} packageName
 * @returns {string}
 */
export declare const getNodeModulesPackagePath: (packageName: string) => string;
/**
 * Construct graph and node dependencies score
 * @param {IReactFlowNode[]} reactFlowNodes
 * @param {IReactFlowEdge[]} reactFlowEdges
 * @param {{ isNonDirected?: boolean, isReversed?: boolean }} options
 */
export declare const constructGraphs: (reactFlowNodes: IReactFlowNode[], reactFlowEdges: IReactFlowEdge[], options?: {
    isNonDirected?: boolean;
    isReversed?: boolean;
}) => {
    graph: INodeDirectedGraph;
    nodeDependencies: INodeDependencies;
};
/**
 * Get starting node and check if flow is valid
 * @param {INodeDependencies} nodeDependencies
 */
export declare const getStartingNode: (nodeDependencies: INodeDependencies) => {
    startingNodeIds: string[];
};
/**
 * Get starting nodes and check if flow is valid
 * @param {INodeDependencies} graph
 * @param {string} endNodeId
 */
export declare const getStartingNodes: (graph: INodeDirectedGraph, endNodeId: string) => {
    startingNodeIds: string[];
    depthQueue: IDepthQueue;
};
/**
 * Get all connected nodes from startnode
 * @param {INodeDependencies} graph
 * @param {string} startNodeId
 */
export declare const getAllConnectedNodes: (graph: INodeDirectedGraph, startNodeId: string) => string[];
/**
 * Get ending node and check if flow is valid
 * @param {INodeDependencies} nodeDependencies
 * @param {INodeDirectedGraph} graph
 * @param {IReactFlowNode[]} allNodes
 */
export declare const getEndingNodes: (nodeDependencies: INodeDependencies, graph: INodeDirectedGraph, allNodes: IReactFlowNode[]) => IReactFlowNode[];
/**
 * Get file name from base64 string
 * @param {string} fileBase64
 */
export declare const getFileName: (fileBase64: string) => string;
/**
 * Save upsert flowData
 * @param {INodeData} nodeData
 * @param {Record<string, any>} upsertHistory
 */
export declare const saveUpsertFlowData: (nodeData: INodeData, upsertHistory: Record<string, any>) => ICommonObject[];
type BuildFlowParams = {
    startingNodeIds: string[];
    reactFlowNodes: IReactFlowNode[];
    reactFlowEdges: IReactFlowEdge[];
    graph: INodeDirectedGraph;
    depthQueue: IDepthQueue;
    componentNodes: IComponentNodes;
    question: string;
    chatHistory: IMessage[];
    chatId: string;
    sessionId: string;
    chatflowid: string;
    apiMessageId: string;
    appDataSource: DataSource;
    overrideConfig?: ICommonObject;
    apiOverrideStatus?: boolean;
    nodeOverrides?: INodeOverrides;
    availableVariables?: IVariable[];
    variableOverrides?: IVariableOverride[];
    cachePool?: CachePool;
    isUpsert?: boolean;
    stopNodeId?: string;
    uploads?: IFileUpload[];
    baseURL?: string;
    orgId?: string;
    workspaceId?: string;
    subscriptionId?: string;
    userId?: string;
    usageCacheManager?: any;
    uploadedFilesContent?: string;
    updateStorageUsage?: (orgId: string, workspaceId: string, totalSize: number, usageCacheManager?: any) => void;
    checkStorage?: (orgId: string, subscriptionId: string, usageCacheManager: any) => Promise<any>;
};
/**
 * Build flow from start to end
 * @param {BuildFlowParams} params
 */
export declare const buildFlow: ({ startingNodeIds, reactFlowNodes, reactFlowEdges, graph, depthQueue, componentNodes, question, uploadedFilesContent, chatHistory, apiMessageId, chatId, sessionId, chatflowid, appDataSource, overrideConfig, apiOverrideStatus, nodeOverrides, availableVariables, variableOverrides, cachePool, isUpsert, stopNodeId, uploads, baseURL, orgId, workspaceId, subscriptionId, userId, usageCacheManager, updateStorageUsage, checkStorage }: BuildFlowParams) => Promise<any>;
/**
 * Clear session memories
 * @param {IReactFlowNode[]} reactFlowNodes
 * @param {IComponentNodes} componentNodes
 * @param {string} chatId
 * @param {DataSource} appDataSource
 * @param {string} sessionId
 * @param {string} memoryType
 * @param {string} isClearFromViewMessageDialog
 */
export declare const clearSessionMemory: (reactFlowNodes: IReactFlowNode[], componentNodes: IComponentNodes, chatId: string, appDataSource: DataSource, orgId?: string, sessionId?: string, memoryType?: string, isClearFromViewMessageDialog?: string) => Promise<void>;
export declare const getGlobalVariable: (overrideConfig?: ICommonObject, availableVariables?: IVariable[], variableOverrides?: ICommonObject[]) => Promise<{}>;
/**
 * Get variable value from outputResponses.output
 * @param {string} paramValue
 * @param {IReactFlowNode[]} reactFlowNodes
 * @param {string} question
 * @param {boolean} isAcceptVariable
 * @returns {string}
 */
export declare const getVariableValue: (paramValue: string | object, reactFlowNodes: IReactFlowNode[], question: string, chatHistory: IMessage[], isAcceptVariable?: boolean, flowConfig?: ICommonObject, uploadedFilesContent?: string, availableVariables?: IVariable[], variableOverrides?: ICommonObject[]) => Promise<any>;
/**
 * Loop through each inputs and resolve variable if necessary
 * @param {INodeData} reactFlowNodeData
 * @param {IReactFlowNode[]} reactFlowNodes
 * @param {string} question
 * @returns {INodeData}
 */
export declare const resolveVariables: (reactFlowNodeData: INodeData, reactFlowNodes: IReactFlowNode[], question: string, chatHistory: IMessage[], flowConfig?: ICommonObject, uploadedFilesContent?: string, availableVariables?: IVariable[], variableOverrides?: ICommonObject[]) => Promise<INodeData>;
/**
 * Loop through each inputs and replace their value with override config values
 * @param {INodeData} flowNodeData
 * @param {ICommonObject} overrideConfig
 * @param {INodeOverrides} nodeOverrides
 * @param {IVariableOverride[]} variableOverrides
 * @returns {INodeData}
 */
export declare const replaceInputsWithConfig: (flowNodeData: INodeData, overrideConfig: ICommonObject, nodeOverrides: INodeOverrides, variableOverrides: IVariableOverride[]) => INodeData;
/**
 * Rebuild flow if LLMChain has dependency on other chains
 * User Question => Prompt_0 => LLMChain_0 => Prompt-1 => LLMChain_1
 * @param {IReactFlowNode[]} startingNodes
 * @returns {boolean}
 */
export declare const isStartNodeDependOnInput: (startingNodes: IReactFlowNode[], nodes: IReactFlowNode[]) => boolean;
/**
 * Rebuild flow if new override config is provided
 * @param {boolean} isInternal
 * @param {ICommonObject} existingOverrideConfig
 * @param {ICommonObject} newOverrideConfig
 * @returns {boolean}
 */
export declare const isSameOverrideConfig: (isInternal: boolean, existingOverrideConfig?: ICommonObject, newOverrideConfig?: ICommonObject) => boolean;
/**
 * @param {string} existingChatId
 * @param {string} newChatId
 * @returns {boolean}
 */
export declare const isSameChatId: (existingChatId?: string, newChatId?: string) => boolean;
/**
 * Find all available input params config
 * @param {IReactFlowNode[]} reactFlowNodes
 * @param {IComponentCredentials} componentCredentials
 * @returns {IOverrideConfig[]}
 */
export declare const findAvailableConfigs: (reactFlowNodes: IReactFlowNode[], componentCredentials: IComponentCredentials) => IOverrideConfig[];
/**
 * Check to see if flow valid for stream
 * TODO: perform check from component level. i.e: set streaming on component, and check here
 * @param {IReactFlowNode[]} reactFlowNodes
 * @param {INodeData} endingNodeData
 * @returns {boolean}
 */
export declare const isFlowValidForStream: (reactFlowNodes: IReactFlowNode[], endingNodeData: INodeData) => boolean;
/**
 * Returns the encryption key
 * @returns {Promise<string>}
 */
export declare const getEncryptionKey: () => Promise<string>;
/**
 * Encrypt credential data
 * @param {ICredentialDataDecrypted} plainDataObj
 * @returns {Promise<string>}
 */
export declare const encryptCredentialData: (plainDataObj: ICredentialDataDecrypted) => Promise<string>;
/**
 * Decrypt credential data
 * @param {string} encryptedData
 * @param {string} componentCredentialName
 * @param {IComponentCredentials} componentCredentials
 * @returns {Promise<ICredentialDataDecrypted>}
 */
export declare const decryptCredentialData: (encryptedData: string, componentCredentialName?: string, componentCredentials?: IComponentCredentials) => Promise<ICredentialDataDecrypted>;
/**
 * Generate an encryption key
 * @returns {string}
 */
export declare const generateEncryptKey: () => string;
/**
 * Returns the directory where auth secrets are stored (same as encryption key directory).
 * Used for file-based storage of TOKEN_HASH_SECRET, EXPRESS_SESSION_SECRET, JWT_*, etc.
 */
export declare const getAuthSecretsDirectory: () => string;
/**
 * Generate a 32-byte auth secret (OWASP recommendation).
 * Used for auth secrets only; encryption key remains 24 bytes.
 */
export declare const generateAuthSecret: () => string;
export interface GetOrCreateStoredSecretOptions {
    envKey: string;
    fileName: string;
    awsSecretIdSuffix: string;
    /** When generating a new secret, use this value instead of random (e.g. 'Accelance' for JWT_ISSUER/JWT_AUDIENCE) */
    defaultValueForNew?: string;
    /** If env is set to this value, treat as unset (backwards compat for weak defaults) */
    weakDefault?: string;
}
/**
 * Resolve an auth secret: env (backwards compat) → AWS Secrets Manager → filesystem (read or generate+write).
 * Used by initAuthSecrets() for each of the six auth secrets.
 */
export declare const getOrCreateStoredSecret: (options: GetOrCreateStoredSecretOptions) => Promise<string>;
/**
 * Transform ICredentialBody from req to Credential entity
 * @param {ICredentialReqBody} body
 * @returns {Credential}
 */
export declare const transformToCredentialEntity: (body: ICredentialReqBody) => Promise<Credential>;
export declare const redactCredentialWithPasswordType: (componentCredentialName: string, decryptedCredentialObj: ICredentialDataDecrypted, componentCredentials: IComponentCredentials) => ICredentialDataDecrypted;
/**
 * Get sessionId
 * Hierarchy of sessionId (top down)
 * API/Embed:
 * (1) Provided in API body - incomingInput.overrideConfig: { sessionId: 'abc' }
 * (2) Provided in API body - incomingInput.chatId
 *
 * API/Embed + UI:
 * (3) Hard-coded sessionId in UI
 * (4) Not specified on UI nor API, default to chatId
 * @param {IReactFlowNode | undefined} memoryNode
 * @param {IncomingInput} incomingInput
 * @param {string} chatId
 * @param {boolean} isInternal
 * @returns {string}
 */
export declare const getMemorySessionId: (memoryNode: IReactFlowNode | undefined, incomingInput: IncomingInput, chatId: string, isInternal: boolean) => string;
/**
 * Get chat messages from sessionId
 * @param {IReactFlowNode} memoryNode
 * @param {string} sessionId
 * @param {IReactFlowNode} memoryNode
 * @param {IComponentNodes} componentNodes
 * @param {DataSource} appDataSource
 * @param {IDatabaseEntity} databaseEntities
 * @param {any} logger
 * @returns {IMessage[]}
 */
export declare const getSessionChatHistory: (chatflowid: string, sessionId: string, memoryNode: IReactFlowNode, componentNodes: IComponentNodes, appDataSource: DataSource, databaseEntities: IDatabaseEntity, logger: any, prependMessages?: IMessage[]) => Promise<IMessage[]>;
/**
 * Method that find memory that is connected within chatflow
 * In a chatflow, there should only be 1 memory node
 * @param {IReactFlowNode[]} nodes
 * @param {IReactFlowEdge[]} edges
 * @returns {IReactFlowNode | undefined}
 */
export declare const findMemoryNode: (nodes: IReactFlowNode[], edges: IReactFlowEdge[]) => IReactFlowNode | undefined;
/**
 * Get all values from a JSON object
 * @param {any} obj
 * @returns {any[]}
 */
export declare const getAllValuesFromJson: (obj: any) => any[];
/**
 * Get only essential flow data items for telemetry
 * @param {IReactFlowNode[]} nodes
 * @param {IReactFlowEdge[]} edges
 */
export declare const getTelemetryFlowObj: (nodes: IReactFlowNode[], edges: IReactFlowEdge[]) => {
    nodes: string[];
    edges: {
        source: string;
        target: string;
    }[];
};
/**
 * Get app current version
 */
export declare const getAppVersion: () => Promise<any>;
export declare const convertToValidFilename: (word: string) => string;
export declare const aMonthAgo: () => Date;
export declare const getAPIOverrideConfig: (chatflow: IChatFlow) => {
    nodeOverrides: INodeOverrides;
    variableOverrides: IVariableOverride[];
    apiOverrideStatus: boolean;
};
export declare const getUploadPath: () => string;
export declare function generateId(): string;
export declare const getMulterStorage: () => any;
/**
 * Calculate depth of each node from starting nodes
 * @param {INodeDirectedGraph} graph
 * @param {string[]} startingNodeIds
 * @returns {Record<string, number>} Map of nodeId to its depth
 */
export declare const calculateNodesDepth: (graph: INodeDirectedGraph, startingNodeIds: string[]) => Record<string, number>;
/**
 * Helper function to get all nodes in a path starting from a node
 * @param {INodeDirectedGraph} graph
 * @param {string} startNode
 * @returns {string[]}
 */
export declare const getAllNodesInPath: (startNode: string, graph: INodeDirectedGraph) => string[];
export declare const _removeCredentialId: (obj: any) => any;
/**
 * Validates that history items follow the expected schema
 * @param {any[]} history - Array of history items to validate
 * @returns {boolean} - True if all items are valid, false otherwise
 */
export declare const validateHistorySchema: (history: any[]) => boolean;
export {};
