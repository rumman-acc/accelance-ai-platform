"use strict";
/**
 * Strictly no getRepository, appServer here, must be passed as parameter
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllNodesInPath = exports.calculateNodesDepth = exports.getMulterStorage = exports.getUploadPath = exports.getAPIOverrideConfig = exports.aMonthAgo = exports.convertToValidFilename = exports.getAppVersion = exports.getTelemetryFlowObj = exports.getAllValuesFromJson = exports.findMemoryNode = exports.getSessionChatHistory = exports.getMemorySessionId = exports.redactCredentialWithPasswordType = exports.transformToCredentialEntity = exports.getOrCreateStoredSecret = exports.generateAuthSecret = exports.getAuthSecretsDirectory = exports.generateEncryptKey = exports.decryptCredentialData = exports.encryptCredentialData = exports.getEncryptionKey = exports.isFlowValidForStream = exports.findAvailableConfigs = exports.isSameChatId = exports.isSameOverrideConfig = exports.isStartNodeDependOnInput = exports.replaceInputsWithConfig = exports.resolveVariables = exports.getVariableValue = exports.getGlobalVariable = exports.clearSessionMemory = exports.buildFlow = exports.saveUpsertFlowData = exports.getFileName = exports.getEndingNodes = exports.getAllConnectedNodes = exports.getStartingNodes = exports.getStartingNode = exports.constructGraphs = exports.getNodeModulesPackagePath = exports.getUserHome = exports.databaseEntities = exports.REDACTED_CREDENTIAL_VALUE = exports.CURRENT_DATE_TIME_VAR_PREFIX = exports.LOOP_COUNT_VAR_PREFIX = exports.RUNTIME_MESSAGES_LENGTH_VAR_PREFIX = exports.CHAT_HISTORY_VAR_PREFIX = exports.FILE_ATTACHMENT_PREFIX = exports.QUESTION_VAR_PREFIX = void 0;
exports.validateHistorySchema = exports._removeCredentialId = void 0;
exports.generateId = generateId;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logger_1 = __importDefault(require("./logger"));
const uuid_1 = require("uuid");
const lodash_1 = require("lodash");
const accelance_components_1 = require("accelance-components");
const crypto_1 = require("crypto");
const crypto_js_1 = require("crypto-js");
const ChatFlow_1 = require("../database/entities/ChatFlow");
const ChatMessage_1 = require("../database/entities/ChatMessage");
const AgentToolPolicy_1 = require("../database/entities/AgentToolPolicy");
const Credential_1 = require("../database/entities/Credential");
const CredentialAccess_1 = require("../database/entities/CredentialAccess");
const ToolCallAudit_1 = require("../database/entities/ToolCallAudit");
const Tool_1 = require("../database/entities/Tool");
const EnterpriseEntities_1 = require("../enterprise/database/entities/EnterpriseEntities");
const workspace_user_entity_1 = require("../enterprise/database/entities/workspace-user.entity");
const Assistant_1 = require("../database/entities/Assistant");
const Lead_1 = require("../database/entities/Lead");
const Variable_1 = require("../database/entities/Variable");
const DocumentStore_1 = require("../database/entities/DocumentStore");
const DocumentStoreFileChunk_1 = require("../database/entities/DocumentStoreFileChunk");
const CustomMcpServer_1 = require("../database/entities/CustomMcpServer");
const internalAccelanceError_1 = require("../errors/internalAccelanceError");
const http_status_codes_1 = require("http-status-codes");
const client_secrets_manager_1 = require("@aws-sdk/client-secrets-manager");
exports.QUESTION_VAR_PREFIX = 'question';
exports.FILE_ATTACHMENT_PREFIX = 'file_attachment';
exports.CHAT_HISTORY_VAR_PREFIX = 'chat_history';
exports.RUNTIME_MESSAGES_LENGTH_VAR_PREFIX = 'runtime_messages_length';
exports.LOOP_COUNT_VAR_PREFIX = 'loop_count';
exports.CURRENT_DATE_TIME_VAR_PREFIX = 'current_date_time';
exports.REDACTED_CREDENTIAL_VALUE = '_FLOWISE_BLANK_07167752-1a71-43b1-bf8f-4f32252165db';
let secretsManagerClient = null;
const USE_AWS_SECRETS_MANAGER = process.env.SECRETKEY_STORAGE_TYPE === 'aws';
if (USE_AWS_SECRETS_MANAGER) {
    const region = process.env.SECRETKEY_AWS_REGION || 'us-east-1'; // Default region if not provided
    const accessKeyId = process.env.SECRETKEY_AWS_ACCESS_KEY;
    const secretAccessKey = process.env.SECRETKEY_AWS_SECRET_KEY;
    const secretManagerConfig = {
        region: region
    };
    if (accessKeyId && secretAccessKey) {
        secretManagerConfig.credentials = {
            accessKeyId,
            secretAccessKey
        };
    }
    secretsManagerClient = new client_secrets_manager_1.SecretsManagerClient(secretManagerConfig);
}
exports.databaseEntities = {
    ChatFlow: ChatFlow_1.ChatFlow,
    ChatMessage: ChatMessage_1.ChatMessage,
    Tool: Tool_1.Tool,
    Credential: Credential_1.Credential,
    CredentialAccess: CredentialAccess_1.CredentialAccess,
    AgentToolPolicy: AgentToolPolicy_1.AgentToolPolicy,
    ToolCallAudit: ToolCallAudit_1.ToolCallAudit,
    WorkspaceShared: EnterpriseEntities_1.WorkspaceShared,
    WorkspaceUser: workspace_user_entity_1.WorkspaceUser,
    Lead: Lead_1.Lead,
    Assistant: Assistant_1.Assistant,
    Variable: Variable_1.Variable,
    DocumentStore: DocumentStore_1.DocumentStore,
    DocumentStoreFileChunk: DocumentStoreFileChunk_1.DocumentStoreFileChunk,
    CustomMcpServer: CustomMcpServer_1.CustomMcpServer
};
/**
 * Returns the home folder path of the user if
 * none can be found it falls back to the current
 * working directory
 *
 */
const getUserHome = () => {
    let variableName = 'HOME';
    if (process.platform === 'win32') {
        variableName = 'USERPROFILE';
    }
    if (process.env[variableName] === undefined) {
        // If for some reason the variable does not exist
        // fall back to current folder
        return process.cwd();
    }
    return process.env[variableName];
};
exports.getUserHome = getUserHome;
/**
 * Returns the path of node modules package
 * @param {string} packageName
 * @returns {string}
 */
const getNodeModulesPackagePath = (packageName) => {
    const checkPaths = [
        path_1.default.join(__dirname, '..', 'node_modules', packageName),
        path_1.default.join(__dirname, '..', '..', 'node_modules', packageName),
        path_1.default.join(__dirname, '..', '..', '..', 'node_modules', packageName),
        path_1.default.join(__dirname, '..', '..', '..', '..', 'node_modules', packageName),
        path_1.default.join(__dirname, '..', '..', '..', '..', '..', 'node_modules', packageName)
    ];
    for (const checkPath of checkPaths) {
        if (fs_1.default.existsSync(checkPath)) {
            return checkPath;
        }
    }
    return '';
};
exports.getNodeModulesPackagePath = getNodeModulesPackagePath;
/**
 * Construct graph and node dependencies score
 * @param {IReactFlowNode[]} reactFlowNodes
 * @param {IReactFlowEdge[]} reactFlowEdges
 * @param {{ isNonDirected?: boolean, isReversed?: boolean }} options
 */
const constructGraphs = (reactFlowNodes, reactFlowEdges, options) => {
    const nodeDependencies = {};
    const graph = {};
    for (let i = 0; i < reactFlowNodes.length; i += 1) {
        const nodeId = reactFlowNodes[i].id;
        nodeDependencies[nodeId] = 0;
        graph[nodeId] = [];
    }
    if (options && options.isReversed) {
        for (let i = 0; i < reactFlowEdges.length; i += 1) {
            const source = reactFlowEdges[i].source;
            const target = reactFlowEdges[i].target;
            if (Object.prototype.hasOwnProperty.call(graph, target)) {
                graph[target].push(source);
            }
            else {
                graph[target] = [source];
            }
            nodeDependencies[target] += 1;
        }
        return { graph, nodeDependencies };
    }
    for (let i = 0; i < reactFlowEdges.length; i += 1) {
        const source = reactFlowEdges[i].source;
        const target = reactFlowEdges[i].target;
        if (Object.prototype.hasOwnProperty.call(graph, source)) {
            graph[source].push(target);
        }
        else {
            graph[source] = [target];
        }
        if (options && options.isNonDirected) {
            if (Object.prototype.hasOwnProperty.call(graph, target)) {
                graph[target].push(source);
            }
            else {
                graph[target] = [source];
            }
        }
        nodeDependencies[target] += 1;
    }
    return { graph, nodeDependencies };
};
exports.constructGraphs = constructGraphs;
/**
 * Get starting node and check if flow is valid
 * @param {INodeDependencies} nodeDependencies
 */
const getStartingNode = (nodeDependencies) => {
    // Find starting node
    const startingNodeIds = [];
    Object.keys(nodeDependencies).forEach((nodeId) => {
        if (nodeDependencies[nodeId] === 0) {
            startingNodeIds.push(nodeId);
        }
    });
    return { startingNodeIds };
};
exports.getStartingNode = getStartingNode;
/**
 * Get starting nodes and check if flow is valid
 * @param {INodeDependencies} graph
 * @param {string} endNodeId
 */
const getStartingNodes = (graph, endNodeId) => {
    const depthQueue = {
        [endNodeId]: 0
    };
    // Assuming that this is a directed acyclic graph, there will be no infinite loop problem.
    const walkGraph = (nodeId) => {
        const depth = depthQueue[nodeId];
        graph[nodeId].flatMap((id) => {
            depthQueue[id] = Math.max(depthQueue[id] ?? 0, depth + 1);
            walkGraph(id);
        });
    };
    walkGraph(endNodeId);
    const maxDepth = Math.max(...Object.values(depthQueue));
    const depthQueueReversed = {};
    for (const nodeId in depthQueue) {
        if (Object.prototype.hasOwnProperty.call(depthQueue, nodeId)) {
            depthQueueReversed[nodeId] = Math.abs(depthQueue[nodeId] - maxDepth);
        }
    }
    const startingNodeIds = Object.entries(depthQueueReversed)
        .filter(([_, depth]) => depth === 0)
        .map(([id, _]) => id);
    return { startingNodeIds, depthQueue: depthQueueReversed };
};
exports.getStartingNodes = getStartingNodes;
/**
 * Get all connected nodes from startnode
 * @param {INodeDependencies} graph
 * @param {string} startNodeId
 */
const getAllConnectedNodes = (graph, startNodeId) => {
    const visited = new Set();
    const queue = [[startNodeId]];
    while (queue.length > 0) {
        const [currentNode] = queue.shift();
        if (visited.has(currentNode)) {
            continue;
        }
        visited.add(currentNode);
        for (const neighbor of graph[currentNode]) {
            if (!visited.has(neighbor)) {
                queue.push([neighbor]);
            }
        }
    }
    return [...visited];
};
exports.getAllConnectedNodes = getAllConnectedNodes;
/**
 * Get ending node and check if flow is valid
 * @param {INodeDependencies} nodeDependencies
 * @param {INodeDirectedGraph} graph
 * @param {IReactFlowNode[]} allNodes
 */
const getEndingNodes = (nodeDependencies, graph, allNodes) => {
    const endingNodeIds = [];
    Object.keys(graph).forEach((nodeId) => {
        if (Object.keys(nodeDependencies).length === 1) {
            endingNodeIds.push(nodeId);
        }
        else if (!graph[nodeId].length && nodeDependencies[nodeId] > 0) {
            endingNodeIds.push(nodeId);
        }
    });
    let endingNodes = allNodes.filter((nd) => endingNodeIds.includes(nd.id));
    // If there are multiple endingnodes, the failed ones will be automatically ignored.
    // And only ensure that at least one can pass the verification.
    const verifiedEndingNodes = [];
    let error = null;
    for (const endingNode of endingNodes) {
        const endingNodeData = endingNode.data;
        if (!endingNodeData) {
            error = new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Ending node ${endingNode.id} data not found`);
            continue;
        }
        const isEndingNode = endingNodeData?.outputs?.output === 'EndingNode';
        if (!isEndingNode) {
            if (endingNodeData &&
                endingNodeData.category !== 'Chains' &&
                endingNodeData.category !== 'Agents' &&
                endingNodeData.category !== 'Engine' &&
                endingNodeData.category !== 'Multi Agents' &&
                endingNodeData.category !== 'Sequential Agents') {
                error = new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Ending node must be either a Chain or Agent or Engine`);
                continue;
            }
        }
        verifiedEndingNodes.push(endingNode);
    }
    if (verifiedEndingNodes.length > 0) {
        return verifiedEndingNodes;
    }
    if (endingNodes.length === 0 || error === null) {
        error = new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Ending nodes not found`);
    }
    throw error;
};
exports.getEndingNodes = getEndingNodes;
/**
 * Get file name from base64 string
 * @param {string} fileBase64
 */
const getFileName = (fileBase64) => {
    let fileNames = [];
    if (fileBase64.startsWith('FILE-STORAGE::')) {
        const names = fileBase64.substring(14);
        if (names.includes('[') && names.includes(']')) {
            const files = JSON.parse(names);
            return files.join(', ');
        }
        else {
            return fileBase64.substring(14);
        }
    }
    if (fileBase64.startsWith('[') && fileBase64.endsWith(']')) {
        const files = JSON.parse(fileBase64);
        for (const file of files) {
            const splitDataURI = file.split(',');
            const filename = splitDataURI[splitDataURI.length - 1].split(':')[1];
            fileNames.push(filename);
        }
        return fileNames.join(', ');
    }
    else {
        const splitDataURI = fileBase64.split(',');
        const filename = splitDataURI[splitDataURI.length - 1].split(':')[1];
        return filename;
    }
};
exports.getFileName = getFileName;
/**
 * Save upsert flowData
 * @param {INodeData} nodeData
 * @param {Record<string, any>} upsertHistory
 */
const saveUpsertFlowData = (nodeData, upsertHistory) => {
    const existingUpsertFlowData = upsertHistory['flowData'] ?? [];
    const paramValues = [];
    for (const input in nodeData.inputs) {
        const inputParam = nodeData.inputParams.find((inp) => inp.name === input);
        if (!inputParam)
            continue;
        let paramValue = {};
        if (!nodeData.inputs[input]) {
            continue;
        }
        if (typeof nodeData.inputs[input] === 'string' &&
            nodeData.inputs[input].startsWith('{{') &&
            nodeData.inputs[input].endsWith('}}')) {
            continue;
        }
        // Get file name instead of the base64 string
        if (nodeData.category === 'Document Loaders' && nodeData.inputParams.find((inp) => inp.name === input)?.type === 'file') {
            paramValue = {
                label: inputParam?.label,
                name: inputParam?.name,
                type: inputParam?.type,
                value: (0, exports.getFileName)(nodeData.inputs[input])
            };
            paramValues.push(paramValue);
            continue;
        }
        paramValue = {
            label: inputParam?.label,
            name: inputParam?.name,
            type: inputParam?.type,
            value: nodeData.inputs[input]
        };
        paramValues.push(paramValue);
    }
    const newFlowData = {
        label: nodeData.label,
        name: nodeData.name,
        category: nodeData.category,
        id: nodeData.id,
        paramValues
    };
    existingUpsertFlowData.push(newFlowData);
    return existingUpsertFlowData;
};
exports.saveUpsertFlowData = saveUpsertFlowData;
/**
 * Check if doc loader should be bypassed, ONLY if doc loader is connected to a vector store
 * Reason being we dont want to load the doc loader again whenever we are building the flow, because it was already done during upserting
 * EXCEPT if the vector store is a memory vector store
 * TODO: Remove this logic when we remove doc loader nodes from the canvas
 * @param {IReactFlowNode} reactFlowNode
 * @param {IReactFlowNode[]} reactFlowNodes
 * @param {IReactFlowEdge[]} reactFlowEdges
 * @returns {boolean}
 */
const checkIfDocLoaderShouldBeIgnored = (reactFlowNode, reactFlowNodes, reactFlowEdges) => {
    let outputId = '';
    if (reactFlowNode.data.outputAnchors.length) {
        if (Object.keys(reactFlowNode.data.outputs || {}).length) {
            const output = reactFlowNode.data.outputs?.output;
            const node = reactFlowNode.data.outputAnchors[0].options?.find((anchor) => anchor.name === output);
            if (node)
                outputId = node.id;
        }
        else {
            outputId = reactFlowNode.data.outputAnchors[0].id;
        }
    }
    const targetNodeId = reactFlowEdges.find((edge) => edge.sourceHandle === outputId)?.target;
    if (targetNodeId) {
        const targetNodeCategory = reactFlowNodes.find((nd) => nd.id === targetNodeId)?.data.category || '';
        const targetNodeName = reactFlowNodes.find((nd) => nd.id === targetNodeId)?.data.name || '';
        if (targetNodeCategory === 'Vector Stores' && targetNodeName !== 'memoryVectorStore') {
            return true;
        }
    }
    return false;
};
/**
 * Build flow from start to end
 * @param {BuildFlowParams} params
 */
const buildFlow = async ({ startingNodeIds, reactFlowNodes, reactFlowEdges, graph, depthQueue, componentNodes, question, uploadedFilesContent, chatHistory, apiMessageId, chatId, sessionId, chatflowid, appDataSource, overrideConfig, apiOverrideStatus = false, nodeOverrides = {}, availableVariables = [], variableOverrides = [], cachePool, isUpsert, stopNodeId, uploads, baseURL, orgId, workspaceId, subscriptionId, userId, usageCacheManager, updateStorageUsage, checkStorage }) => {
    const flowNodes = (0, lodash_1.cloneDeep)(reactFlowNodes);
    let upsertHistory = {};
    // Create a Queue and add our initial node in it
    const nodeQueue = [];
    const exploredNode = {};
    const dynamicVariables = {};
    let ignoreNodeIds = [];
    // In the case of infinite loop, only max 3 loops will be executed
    const maxLoop = 3;
    for (let i = 0; i < startingNodeIds.length; i += 1) {
        nodeQueue.push({ nodeId: startingNodeIds[i], depth: 0 });
        exploredNode[startingNodeIds[i]] = { remainingLoop: maxLoop, lastSeenDepth: 0 };
    }
    const initializedNodes = new Set();
    const reversedGraph = (0, exports.constructGraphs)(reactFlowNodes, reactFlowEdges, { isReversed: true }).graph;
    const flowData = {
        chatflowid,
        chatflowId: chatflowid,
        chatId,
        sessionId,
        chatHistory,
        apiMessageId
    };
    while (nodeQueue.length) {
        const { nodeId, depth } = nodeQueue.shift();
        const reactFlowNode = flowNodes.find((nd) => nd.id === nodeId);
        const nodeIndex = flowNodes.findIndex((nd) => nd.id === nodeId);
        if (!reactFlowNode || reactFlowNode === undefined || nodeIndex < 0)
            continue;
        try {
            const nodeInstanceFilePath = componentNodes[reactFlowNode.data.name].filePath;
            const nodeModule = await Promise.resolve(`${nodeInstanceFilePath}`).then(s => __importStar(require(s)));
            const newNodeInstance = new nodeModule.nodeClass();
            let flowNodeData = (0, lodash_1.cloneDeep)(reactFlowNode.data);
            // Only override the config if its status is true
            if (overrideConfig && apiOverrideStatus) {
                flowNodeData = (0, exports.replaceInputsWithConfig)(flowNodeData, overrideConfig, nodeOverrides, variableOverrides);
            }
            if (isUpsert)
                upsertHistory['flowData'] = (0, exports.saveUpsertFlowData)(flowNodeData, upsertHistory);
            const reactFlowNodeData = await (0, exports.resolveVariables)(flowNodeData, flowNodes, question, chatHistory, flowData, uploadedFilesContent, availableVariables, variableOverrides);
            if (isUpsert && stopNodeId && nodeId === stopNodeId) {
                logger_1.default.debug(`[server]: [${orgId}]: Upserting ${reactFlowNode.data.label} (${reactFlowNode.data.id})`);
                const indexResult = await newNodeInstance.vectorStoreMethods['upsert'].call(newNodeInstance, reactFlowNodeData, {
                    orgId,
                    workspaceId,
                    subscriptionId,
                    chatId,
                    sessionId,
                    chatflowid,
                    chatHistory,
                    apiMessageId,
                    logger: logger_1.default,
                    appDataSource,
                    databaseEntities: exports.databaseEntities,
                    cachePool,
                    usageCacheManager,
                    dynamicVariables,
                    uploads,
                    baseURL
                });
                if (indexResult)
                    upsertHistory['result'] = indexResult;
                logger_1.default.debug(`[server]: [${orgId}]: Finished upserting ${reactFlowNode.data.label} (${reactFlowNode.data.id})`);
                break;
            }
            else if (!isUpsert &&
                reactFlowNode.data.category === 'Document Loaders' &&
                checkIfDocLoaderShouldBeIgnored(reactFlowNode, reactFlowNodes, reactFlowEdges)) {
                initializedNodes.add(nodeId);
            }
            else {
                logger_1.default.debug(`[server]: [${orgId}]: Initializing ${reactFlowNode.data.label} (${reactFlowNode.data.id})`);
                const finalQuestion = uploadedFilesContent ? `${uploadedFilesContent}\n\n${question}` : question;
                let outputResult = await newNodeInstance.init(reactFlowNodeData, finalQuestion, {
                    orgId,
                    workspaceId,
                    subscriptionId,
                    userId,
                    chatId,
                    sessionId,
                    chatflowid,
                    chatHistory,
                    logger: logger_1.default,
                    appDataSource,
                    databaseEntities: exports.databaseEntities,
                    cachePool,
                    usageCacheManager,
                    isUpsert,
                    dynamicVariables,
                    uploads,
                    baseURL,
                    componentNodes,
                    updateStorageUsage,
                    checkStorage
                });
                if (reactFlowNode.data.category === 'Tools') {
                    outputResult = (0, accelance_components_1.wrapToolWithPolicy)(outputResult, {
                        workspaceId: workspaceId,
                        chatflowId: chatflowid,
                        toolNodeName: reactFlowNode.data.name,
                        userId,
                        credentialId: reactFlowNodeData.credential
                    }, { appDataSource, databaseEntities: exports.databaseEntities });
                }
                // Save dynamic variables
                if (reactFlowNode.data.name === 'setVariable') {
                    const dynamicVars = outputResult?.dynamicVariables ?? {};
                    for (const variableKey in dynamicVars) {
                        dynamicVariables[variableKey] = dynamicVars[variableKey];
                    }
                    outputResult = outputResult?.output;
                }
                // Determine which nodes to route next when it comes to ifElse
                if (reactFlowNode.data.name === 'ifElseFunction' && typeof outputResult === 'object') {
                    let sourceHandle = '';
                    if (outputResult.type === true) {
                        // sourceHandle = `${nodeId}-output-returnFalse-string|number|boolean|json|array`
                        sourceHandle = reactFlowNode.data.outputAnchors.flatMap((n) => n.options).find((n) => n?.name === 'returnFalse')?.id;
                    }
                    else if (outputResult.type === false) {
                        // sourceHandle = `${nodeId}-output-returnTrue-string|number|boolean|json|array`
                        sourceHandle = reactFlowNode.data.outputAnchors.flatMap((n) => n.options).find((n) => n?.name === 'returnTrue')?.id;
                    }
                    const ifElseEdge = reactFlowEdges.find((edg) => edg.source === nodeId && edg.sourceHandle === sourceHandle);
                    if (ifElseEdge) {
                        const { graph } = (0, exports.constructGraphs)(reactFlowNodes, reactFlowEdges.filter((edg) => !(edg.source === nodeId && edg.sourceHandle === sourceHandle)), { isNonDirected: true });
                        ignoreNodeIds.push(ifElseEdge.target, ...(0, exports.getAllConnectedNodes)(graph, ifElseEdge.target));
                        ignoreNodeIds = [...new Set(ignoreNodeIds)];
                    }
                    outputResult = outputResult?.output;
                }
                flowNodes[nodeIndex].data.instance = outputResult;
                logger_1.default.debug(`[server]: [${orgId}]: Finished initializing ${reactFlowNode.data.label} (${reactFlowNode.data.id})`);
                initializedNodes.add(reactFlowNode.data.id);
            }
        }
        catch (e) {
            logger_1.default.error(`[server]: [${orgId}]:`, e);
            throw new Error(e);
        }
        let neighbourNodeIds = graph[nodeId];
        const nextDepth = depth + 1;
        // Find other nodes that are on the same depth level
        const sameDepthNodeIds = Object.keys(depthQueue).filter((key) => depthQueue[key] === nextDepth);
        for (const id of sameDepthNodeIds) {
            if (neighbourNodeIds.includes(id))
                continue;
            neighbourNodeIds.push(id);
        }
        neighbourNodeIds = neighbourNodeIds.filter((neigh) => !ignoreNodeIds.includes(neigh));
        for (let i = 0; i < neighbourNodeIds.length; i += 1) {
            const neighNodeId = neighbourNodeIds[i];
            if (ignoreNodeIds.includes(neighNodeId))
                continue;
            if (initializedNodes.has(neighNodeId))
                continue;
            if (reversedGraph[neighNodeId].some((dependId) => !initializedNodes.has(dependId)))
                continue;
            // If nodeId has been seen, cycle detected
            if (Object.prototype.hasOwnProperty.call(exploredNode, neighNodeId)) {
                const { remainingLoop, lastSeenDepth } = exploredNode[neighNodeId];
                if (lastSeenDepth === nextDepth)
                    continue;
                if (remainingLoop === 0) {
                    break;
                }
                const remainingLoopMinusOne = remainingLoop - 1;
                exploredNode[neighNodeId] = { remainingLoop: remainingLoopMinusOne, lastSeenDepth: nextDepth };
                nodeQueue.push({ nodeId: neighNodeId, depth: nextDepth });
            }
            else {
                exploredNode[neighNodeId] = { remainingLoop: maxLoop, lastSeenDepth: nextDepth };
                nodeQueue.push({ nodeId: neighNodeId, depth: nextDepth });
            }
        }
        // Move end node to last
        if (!neighbourNodeIds.length) {
            const index = flowNodes.findIndex((nd) => nd.data.id === nodeId);
            flowNodes.push(flowNodes.splice(index, 1)[0]);
        }
    }
    return isUpsert ? upsertHistory : flowNodes;
};
exports.buildFlow = buildFlow;
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
const clearSessionMemory = async (reactFlowNodes, componentNodes, chatId, appDataSource, orgId, sessionId, memoryType, isClearFromViewMessageDialog) => {
    for (const node of reactFlowNodes) {
        if (node.data.category !== 'Memory' && node.data.type !== 'OpenAIAssistant')
            continue;
        // Only clear specific session memory from View Message Dialog UI
        if (isClearFromViewMessageDialog && memoryType && node.data.label !== memoryType)
            continue;
        const nodeInstanceFilePath = componentNodes[node.data.name].filePath;
        const nodeModule = await Promise.resolve(`${nodeInstanceFilePath}`).then(s => __importStar(require(s)));
        const newNodeInstance = new nodeModule.nodeClass();
        const options = { orgId, chatId, appDataSource, databaseEntities: exports.databaseEntities, logger: logger_1.default };
        // SessionId always take priority first because it is the sessionId used for 3rd party memory node
        if (sessionId && node.data.inputs) {
            if (node.data.type === 'OpenAIAssistant') {
                await newNodeInstance.clearChatMessages(node.data, options, { type: 'threadId', id: sessionId });
            }
            else {
                node.data.inputs.sessionId = sessionId;
                const initializedInstance = await newNodeInstance.init(node.data, '', options);
                await initializedInstance.clearChatMessages(sessionId);
            }
        }
        else if (chatId && node.data.inputs) {
            if (node.data.type === 'OpenAIAssistant') {
                await newNodeInstance.clearChatMessages(node.data, options, { type: 'chatId', id: chatId });
            }
            else {
                node.data.inputs.sessionId = chatId;
                const initializedInstance = await newNodeInstance.init(node.data, '', options);
                await initializedInstance.clearChatMessages(chatId);
            }
        }
    }
};
exports.clearSessionMemory = clearSessionMemory;
const getGlobalVariable = async (overrideConfig, availableVariables = [], variableOverrides = []) => {
    // override variables defined in overrideConfig
    // nodeData.inputs.vars is an Object, check each property and override the variable
    if (overrideConfig?.vars && variableOverrides) {
        for (const propertyName of Object.getOwnPropertyNames(overrideConfig.vars)) {
            // Check if this variable is enabled for override
            const override = variableOverrides.find((v) => v.name === propertyName);
            if (!override?.enabled) {
                continue; // Skip this variable if it's not enabled for override
            }
            const foundVar = availableVariables.find((v) => v.name === propertyName);
            if (foundVar) {
                // even if the variable was defined as runtime, we override it with static value
                foundVar.type = 'static';
                foundVar.value = overrideConfig.vars[propertyName];
            }
            else {
                // add it the variables, if not found locally in the db
                availableVariables.push({
                    name: propertyName,
                    type: 'static',
                    value: overrideConfig.vars[propertyName],
                    id: '',
                    updatedDate: new Date(),
                    createdDate: new Date(),
                    workspaceId: ''
                });
            }
        }
    }
    let vars = {};
    if (availableVariables.length) {
        for (const item of availableVariables) {
            let value = item.value;
            // read from .env file
            if (item.type === 'runtime') {
                value = process.env[item.name] ?? '';
            }
            Object.defineProperty(vars, item.name, {
                enumerable: true,
                configurable: true,
                writable: true,
                value: value
            });
        }
    }
    return vars;
};
exports.getGlobalVariable = getGlobalVariable;
/**
 * Get variable value from outputResponses.output
 * @param {string} paramValue
 * @param {IReactFlowNode[]} reactFlowNodes
 * @param {string} question
 * @param {boolean} isAcceptVariable
 * @returns {string}
 */
const getVariableValue = async (paramValue, reactFlowNodes, question, chatHistory, isAcceptVariable = false, flowConfig, uploadedFilesContent, availableVariables = [], variableOverrides = []) => {
    const isObject = typeof paramValue === 'object';
    const initialValue = (isObject ? JSON.stringify(paramValue) : paramValue) ?? '';
    let returnVal = initialValue;
    const variableStack = [];
    const variableDict = {};
    let startIdx = 0;
    const endIdx = initialValue.length - 1;
    while (startIdx < endIdx) {
        const substr = initialValue.substring(startIdx, startIdx + 2);
        // Store the opening double curly bracket
        if (substr === '{{') {
            variableStack.push({ substr, startIdx: startIdx + 2 });
        }
        // Found the complete variable
        if (substr === '}}' && variableStack.length > 0 && variableStack[variableStack.length - 1].substr === '{{') {
            const variableStartIdx = variableStack[variableStack.length - 1].startIdx;
            const variableEndIdx = startIdx;
            const variableFullPath = initialValue.substring(variableStartIdx, variableEndIdx);
            /**
             * Apply string transformation to convert special chars:
             * FROM: hello i am ben\n\n\thow are you?
             * TO: hello i am benFLOWISE_NEWLINEFLOWISE_NEWLINEFLOWISE_TABhow are you?
             */
            if (isAcceptVariable && variableFullPath === exports.QUESTION_VAR_PREFIX) {
                variableDict[`{{${variableFullPath}}}`] = (0, accelance_components_1.handleEscapeCharacters)(question, false);
            }
            if (isAcceptVariable && variableFullPath === exports.FILE_ATTACHMENT_PREFIX) {
                variableDict[`{{${variableFullPath}}}`] = (0, accelance_components_1.handleEscapeCharacters)(uploadedFilesContent, false);
            }
            if (isAcceptVariable && variableFullPath === exports.CHAT_HISTORY_VAR_PREFIX) {
                variableDict[`{{${variableFullPath}}}`] = (0, accelance_components_1.handleEscapeCharacters)((0, accelance_components_1.convertChatHistoryToText)(chatHistory), false);
            }
            if (variableFullPath.startsWith('$vars.')) {
                const vars = await (0, exports.getGlobalVariable)(flowConfig, availableVariables, variableOverrides);
                const variableValue = (0, lodash_1.get)(vars, variableFullPath.replace('$vars.', ''));
                if (variableValue != null) {
                    variableDict[`{{${variableFullPath}}}`] = variableValue;
                    returnVal = returnVal.split(`{{${variableFullPath}}}`).join(variableValue);
                }
            }
            if (variableFullPath.startsWith('$flow.') && flowConfig) {
                const variableValue = (0, lodash_1.get)(flowConfig, variableFullPath.replace('$flow.', ''));
                if (variableValue != null) {
                    variableDict[`{{${variableFullPath}}}`] = variableValue;
                    returnVal = returnVal.split(`{{${variableFullPath}}}`).join(variableValue);
                }
            }
            // Resolve values with following case.
            // 1: <variableNodeId>.data.instance
            // 2: <variableNodeId>.data.instance.pathtokey
            const variableFullPathParts = variableFullPath.split('.');
            const variableNodeId = variableFullPathParts[0];
            const executedNode = reactFlowNodes.find((nd) => nd.id === variableNodeId);
            if (executedNode) {
                let variableValue = (0, lodash_1.get)(executedNode.data, 'instance');
                // Handle path such as `<variableNodeId>.data.instance.key`
                if (variableFullPathParts.length > 3) {
                    let variableObj = null;
                    switch (typeof variableValue) {
                        case 'string': {
                            const unEscapedVariableValue = (0, accelance_components_1.handleEscapeCharacters)(variableValue, true);
                            if (unEscapedVariableValue.startsWith('{') && unEscapedVariableValue.endsWith('}')) {
                                try {
                                    variableObj = JSON.parse(unEscapedVariableValue);
                                }
                                catch (e) {
                                    // ignore
                                }
                            }
                            break;
                        }
                        case 'object': {
                            variableObj = variableValue;
                            break;
                        }
                        default:
                            break;
                    }
                    if (variableObj) {
                        variableObj = (0, lodash_1.get)(variableObj, variableFullPathParts.slice(3));
                        variableValue = (0, accelance_components_1.handleEscapeCharacters)(typeof variableObj === 'object' ? JSON.stringify(variableObj) : variableObj, false);
                    }
                }
                if (isAcceptVariable) {
                    variableDict[`{{${variableFullPath}}}`] = variableValue;
                }
                else {
                    returnVal = variableValue;
                }
            }
            variableStack.pop();
        }
        startIdx += 1;
    }
    if (isAcceptVariable) {
        const variablePaths = Object.keys(variableDict);
        variablePaths.sort(); // Sort by length of variable path because longer path could possibly contains nested variable
        variablePaths.forEach((path) => {
            let variableValue = variableDict[path];
            // Replace all occurrence
            if (typeof variableValue === 'object') {
                // Just get the id of variableValue object if it is agentflow node, to avoid circular JSON error
                if (Object.prototype.hasOwnProperty.call(variableValue, 'predecessorAgents')) {
                    const nodeId = variableValue['id'];
                    variableValue = { id: nodeId };
                }
                const stringifiedValue = JSON.stringify(JSON.stringify(variableValue));
                if (stringifiedValue.startsWith('"') && stringifiedValue.endsWith('"')) {
                    // get rid of the double quotes
                    returnVal = returnVal.split(path).join(stringifiedValue.substring(1, stringifiedValue.length - 1));
                }
                else {
                    returnVal = returnVal.split(path).join(JSON.stringify(variableValue).replace(/"/g, '\\"'));
                }
            }
            else {
                returnVal = returnVal.split(path).join(variableValue);
            }
        });
        return returnVal;
    }
    return isObject ? JSON.parse(returnVal) : returnVal;
};
exports.getVariableValue = getVariableValue;
/**
 * Loop through each inputs and resolve variable if necessary
 * @param {INodeData} reactFlowNodeData
 * @param {IReactFlowNode[]} reactFlowNodes
 * @param {string} question
 * @returns {INodeData}
 */
const resolveVariables = async (reactFlowNodeData, reactFlowNodes, question, chatHistory, flowConfig, uploadedFilesContent, availableVariables = [], variableOverrides = []) => {
    let flowNodeData = (0, lodash_1.cloneDeep)(reactFlowNodeData);
    const getParamValues = async (paramsObj) => {
        for (const key in paramsObj) {
            const paramValue = paramsObj[key];
            if (Array.isArray(paramValue)) {
                const resolvedInstances = [];
                for (const param of paramValue) {
                    const resolvedInstance = await (0, exports.getVariableValue)(param, reactFlowNodes, question, chatHistory, undefined, flowConfig, uploadedFilesContent, availableVariables, variableOverrides);
                    resolvedInstances.push(resolvedInstance);
                }
                paramsObj[key] = resolvedInstances;
            }
            else {
                const isAcceptVariable = reactFlowNodeData.inputParams.find((param) => param.name === key)?.acceptVariable ?? false;
                const resolvedInstance = await (0, exports.getVariableValue)(paramValue, reactFlowNodes, question, chatHistory, isAcceptVariable, flowConfig, uploadedFilesContent, availableVariables, variableOverrides);
                paramsObj[key] = resolvedInstance;
            }
        }
    };
    const paramsObj = flowNodeData['inputs'] ?? {};
    await getParamValues(paramsObj);
    return flowNodeData;
};
exports.resolveVariables = resolveVariables;
/**
 * Loop through each inputs and replace their value with override config values
 * @param {INodeData} flowNodeData
 * @param {ICommonObject} overrideConfig
 * @param {INodeOverrides} nodeOverrides
 * @param {IVariableOverride[]} variableOverrides
 * @returns {INodeData}
 */
const replaceInputsWithConfig = (flowNodeData, overrideConfig, nodeOverrides, variableOverrides) => {
    const types = 'inputs';
    const isParameterEnabled = (nodeType, paramName) => {
        if (!nodeOverrides[nodeType])
            return false;
        const parameter = nodeOverrides[nodeType].find((param) => param.name === paramName);
        return parameter?.enabled ?? false;
    };
    const getParamValues = (inputsObj) => {
        for (const config in overrideConfig) {
            /**
             * Several conditions:
             * 1. If config is 'analytics', always allow it
             * 2. If config is 'vars', check its object and filter out the variables that are not enabled for override
             * 3. If typeof config's value is an array, check if the parameter is enabled and apply directly
             * 4. If typeof config's value is an object, check if the node id is in the overrideConfig object and if the parameter (systemMessagePrompt) is enabled
             * Example:
             * "systemMessagePrompt": {
             *  "chatPromptTemplate_0": "You are an assistant"
             * }
             * 5. If typeof config's value is a string, check if the parameter is enabled
             * Example:
             * "systemMessagePrompt": "You are an assistant"
             */
            if (config === 'analytics') {
                // pass
            }
            else if (config === 'vars') {
                if (typeof overrideConfig[config] === 'object') {
                    const filteredVars = {};
                    const vars = overrideConfig[config];
                    for (const variable in vars) {
                        const override = variableOverrides.find((v) => v.name === variable);
                        if (!override?.enabled) {
                            continue; // Skip this variable if it's not enabled for override
                        }
                        filteredVars[variable] = vars[variable];
                    }
                    overrideConfig[config] = filteredVars;
                }
            }
            else if (Array.isArray(overrideConfig[config])) {
                // Handle arrays as direct parameter values
                if (isParameterEnabled(flowNodeData.label, config)) {
                    // If existing value is also an array, concatenate; otherwise replace
                    const existingValue = inputsObj[config];
                    if (Array.isArray(existingValue)) {
                        inputsObj[config] = [...new Set([...existingValue, ...overrideConfig[config]])];
                    }
                    else {
                        inputsObj[config] = overrideConfig[config];
                    }
                }
                continue;
            }
            else if (overrideConfig[config] && typeof overrideConfig[config] === 'object') {
                const nodeIds = Object.keys(overrideConfig[config]);
                if (nodeIds.includes(flowNodeData.id)) {
                    // Check if this parameter is enabled
                    if (isParameterEnabled(flowNodeData.label, config)) {
                        const existingValue = inputsObj[config];
                        const overrideValue = overrideConfig[config][flowNodeData.id];
                        // Merge objects instead of completely overriding
                        if (typeof existingValue === 'object' &&
                            typeof overrideValue === 'object' &&
                            !Array.isArray(existingValue) &&
                            !Array.isArray(overrideValue) &&
                            existingValue !== null &&
                            overrideValue !== null) {
                            inputsObj[config] = Object.assign({}, existingValue, overrideValue);
                        }
                        else if (typeof existingValue === 'string' && existingValue.startsWith('{') && existingValue.endsWith('}')) {
                            try {
                                const parsedExisting = JSON.parse(existingValue);
                                if (typeof overrideValue === 'object' && !Array.isArray(overrideValue)) {
                                    inputsObj[config] = Object.assign({}, parsedExisting, overrideValue);
                                }
                                else {
                                    inputsObj[config] = overrideValue;
                                }
                            }
                            catch (e) {
                                inputsObj[config] = overrideValue;
                            }
                        }
                        else {
                            inputsObj[config] = overrideValue;
                        }
                    }
                    continue;
                }
                else if (nodeIds.some((nodeId) => nodeId.includes(flowNodeData.name))) {
                    /*
                     * "systemMessagePrompt": {
                     *   "chatPromptTemplate_0": "You are an assistant" <---- continue for loop if current node is chatPromptTemplate_1
                     * }
                     */
                    continue;
                }
            }
            else {
                if (!isParameterEnabled(flowNodeData.label, config)) {
                    // Only proceed if the parameter is enabled
                    continue;
                }
            }
            let paramValue = inputsObj[config];
            const overrideConfigValue = overrideConfig[config];
            if (overrideConfigValue) {
                if (typeof overrideConfigValue === 'object') {
                    // Handle arrays specifically - concatenate instead of replace
                    if (Array.isArray(overrideConfigValue) && Array.isArray(paramValue)) {
                        paramValue = [...new Set([...paramValue, ...overrideConfigValue])];
                    }
                    else if (Array.isArray(overrideConfigValue)) {
                        paramValue = overrideConfigValue;
                    }
                    else {
                        switch (typeof paramValue) {
                            case 'string':
                                if (paramValue.startsWith('{') && paramValue.endsWith('}')) {
                                    try {
                                        paramValue = Object.assign({}, JSON.parse(paramValue), overrideConfigValue);
                                        break;
                                    }
                                    catch (e) {
                                        // ignore
                                    }
                                }
                                paramValue = overrideConfigValue;
                                break;
                            case 'object':
                                // Make sure we're not dealing with arrays here
                                if (!Array.isArray(paramValue)) {
                                    paramValue = Object.assign({}, paramValue, overrideConfigValue);
                                }
                                else {
                                    paramValue = overrideConfigValue;
                                }
                                break;
                            default:
                                paramValue = overrideConfigValue;
                                break;
                        }
                    }
                }
                else {
                    paramValue = overrideConfigValue;
                }
            }
            // Check if boolean
            if (paramValue === 'true')
                paramValue = true;
            else if (paramValue === 'false')
                paramValue = false;
            inputsObj[config] = paramValue;
        }
    };
    const inputsObj = flowNodeData[types] ?? {};
    getParamValues(inputsObj);
    return flowNodeData;
};
exports.replaceInputsWithConfig = replaceInputsWithConfig;
/**
 * Rebuild flow if LLMChain has dependency on other chains
 * User Question => Prompt_0 => LLMChain_0 => Prompt-1 => LLMChain_1
 * @param {IReactFlowNode[]} startingNodes
 * @returns {boolean}
 */
const isStartNodeDependOnInput = (startingNodes, nodes) => {
    for (const node of startingNodes) {
        if (node.data.category === 'Cache')
            return true;
        for (const inputName in node.data.inputs) {
            const inputVariables = (0, accelance_components_1.getInputVariables)(node.data.inputs[inputName]);
            if (inputVariables.length > 0)
                return true;
        }
    }
    const whitelistNodeNames = ['vectorStoreToDocument', 'autoGPT', 'chatPromptTemplate', 'promptTemplate']; //If these nodes are found, chatflow cannot be reused
    for (const node of nodes) {
        if (node.data.name === 'chatPromptTemplate' || node.data.name === 'promptTemplate') {
            let promptValues = {};
            const promptValuesRaw = node.data.inputs?.promptValues;
            if (promptValuesRaw) {
                try {
                    promptValues = typeof promptValuesRaw === 'object' ? promptValuesRaw : JSON.parse(promptValuesRaw);
                }
                catch (exception) {
                    console.error(exception);
                }
            }
            if ((0, exports.getAllValuesFromJson)(promptValues).includes(`{{${exports.QUESTION_VAR_PREFIX}}}`))
                return true;
        }
        else if (whitelistNodeNames.includes(node.data.name))
            return true;
    }
    return false;
};
exports.isStartNodeDependOnInput = isStartNodeDependOnInput;
/**
 * Rebuild flow if new override config is provided
 * @param {boolean} isInternal
 * @param {ICommonObject} existingOverrideConfig
 * @param {ICommonObject} newOverrideConfig
 * @returns {boolean}
 */
const isSameOverrideConfig = (isInternal, existingOverrideConfig, newOverrideConfig) => {
    if (isInternal) {
        if (existingOverrideConfig && Object.keys(existingOverrideConfig).length)
            return false;
        return true;
    }
    // If existing and new overrideconfig are the same
    if (existingOverrideConfig &&
        Object.keys(existingOverrideConfig).length &&
        newOverrideConfig &&
        Object.keys(newOverrideConfig).length &&
        (0, lodash_1.isEqual)(existingOverrideConfig, newOverrideConfig)) {
        return true;
    }
    // If there is no existing and new overrideconfig
    if (!existingOverrideConfig && !newOverrideConfig)
        return true;
    return false;
};
exports.isSameOverrideConfig = isSameOverrideConfig;
/**
 * @param {string} existingChatId
 * @param {string} newChatId
 * @returns {boolean}
 */
const isSameChatId = (existingChatId, newChatId) => {
    if ((0, lodash_1.isEqual)(existingChatId, newChatId)) {
        return true;
    }
    if (!existingChatId && !newChatId)
        return true;
    return false;
};
exports.isSameChatId = isSameChatId;
/**
 * Find all available input params config
 * @param {IReactFlowNode[]} reactFlowNodes
 * @param {IComponentCredentials} componentCredentials
 * @returns {IOverrideConfig[]}
 */
const findAvailableConfigs = (reactFlowNodes, componentCredentials) => {
    const configs = [];
    for (const flowNode of reactFlowNodes) {
        for (const inputParam of flowNode.data.inputParams) {
            let obj;
            if (inputParam.type === 'file') {
                obj = {
                    node: flowNode.data.label,
                    nodeId: flowNode.data.id,
                    label: inputParam.label,
                    name: 'files',
                    type: inputParam.fileType ?? inputParam.type
                };
            }
            else if (inputParam.type === 'options') {
                obj = {
                    node: flowNode.data.label,
                    nodeId: flowNode.data.id,
                    label: inputParam.label,
                    name: inputParam.name,
                    type: inputParam.options
                        ? inputParam.options
                            ?.map((option) => {
                            return option.name;
                        })
                            .join(', ')
                        : 'string'
                };
            }
            else if (inputParam.type === 'credential') {
                // get component credential inputs
                for (const name of inputParam.credentialNames ?? []) {
                    if (Object.prototype.hasOwnProperty.call(componentCredentials, name)) {
                        const inputs = componentCredentials[name]?.inputs ?? [];
                        for (const input of inputs) {
                            obj = {
                                node: flowNode.data.label,
                                nodeId: flowNode.data.id,
                                label: input.label,
                                name: input.name,
                                type: input.type === 'password' ? 'string' : input.type
                            };
                            configs.push(obj);
                        }
                    }
                }
                continue;
            }
            else if (inputParam.type === 'array') {
                const arrayItem = inputParam.array;
                if (Array.isArray(arrayItem)) {
                    const arrayItemSchema = {};
                    // Build object schema representing the structure of each array item
                    for (const item of arrayItem) {
                        let itemType = item.type;
                        if (itemType === 'options') {
                            const availableOptions = item.options?.map((option) => option.name).join(', ');
                            itemType = `(${availableOptions})`;
                        }
                        else if (itemType === 'file') {
                            itemType = item.fileType ?? item.type;
                        }
                        arrayItemSchema[item.name] = itemType;
                    }
                    obj = {
                        node: flowNode.data.label,
                        nodeId: flowNode.data.id,
                        label: inputParam.label,
                        name: inputParam.name,
                        type: inputParam.type,
                        schema: arrayItemSchema
                    };
                }
            }
            else if (inputParam.loadConfig) {
                const configData = flowNode?.data?.inputs?.[`${inputParam.name}Config`];
                if (configData) {
                    // Parse config data to extract schema
                    let parsedConfig = {};
                    try {
                        parsedConfig = typeof configData === 'string' ? JSON.parse(configData) : configData;
                    }
                    catch (e) {
                        // If parsing fails, treat as empty object
                        parsedConfig = {};
                    }
                    // Generate schema from config structure
                    const configSchema = {};
                    parsedConfig = (0, exports._removeCredentialId)(parsedConfig);
                    for (const key in parsedConfig) {
                        if (key === inputParam.name)
                            continue;
                        const value = parsedConfig[key];
                        let fieldType = 'string'; // default type
                        if (typeof value === 'boolean') {
                            fieldType = 'boolean';
                        }
                        else if (typeof value === 'number') {
                            fieldType = 'number';
                        }
                        else if (Array.isArray(value)) {
                            fieldType = 'array';
                        }
                        else if (typeof value === 'object' && value !== null) {
                            fieldType = 'object';
                        }
                        configSchema[key] = fieldType;
                    }
                    obj = {
                        node: flowNode.data.label,
                        nodeId: flowNode.data.id,
                        label: `${inputParam.label} Config`,
                        name: `${inputParam.name}Config`,
                        type: `json`,
                        schema: configSchema
                    };
                }
            }
            else {
                obj = {
                    node: flowNode.data.label,
                    nodeId: flowNode.data.id,
                    label: inputParam.label,
                    name: inputParam.name,
                    type: inputParam.type === 'password' ? 'string' : inputParam.type
                };
            }
            if (obj && !configs.some((config) => JSON.stringify(config) === JSON.stringify(obj))) {
                configs.push(obj);
            }
        }
    }
    return configs;
};
exports.findAvailableConfigs = findAvailableConfigs;
/**
 * Check to see if flow valid for stream
 * TODO: perform check from component level. i.e: set streaming on component, and check here
 * @param {IReactFlowNode[]} reactFlowNodes
 * @param {INodeData} endingNodeData
 * @returns {boolean}
 */
const isFlowValidForStream = (reactFlowNodes, endingNodeData) => {
    /** Deprecated, add streaming input param to the component instead **/
    const streamAvailableLLMs = {
        'Chat Models': [
            'azureChatOpenAI',
            'chatOpenAI',
            'chatOpenAI_LlamaIndex',
            'chatOpenAICustom',
            'chatAnthropic',
            'chatAnthropic_LlamaIndex',
            'chatOllama',
            'chatOllama_LlamaIndex',
            'awsChatBedrock',
            'chatMistralAI',
            'chatMistral_LlamaIndex',
            'chatAlibabaTongyi',
            'groqChat',
            'chatGroq_LlamaIndex',
            'chatCohere',
            'chatGoogleGenerativeAI',
            'chatTogetherAI',
            'chatTogetherAI_LlamaIndex',
            'chatFireworks',
            'ChatSambanova',
            'chatBaiduWenxin',
            'chatCometAPI'
        ],
        LLMs: ['azureOpenAI', 'openAI', 'ollama']
    };
    let isChatOrLLMsExist = false;
    for (const flowNode of reactFlowNodes) {
        const data = flowNode.data;
        if (data.category === 'Chat Models' || data.category === 'LLMs') {
            if (data.inputs?.streaming === false || data.inputs?.streaming === 'false') {
                return false;
            }
            if (data.inputs?.streaming === true || data.inputs?.streaming === 'true') {
                isChatOrLLMsExist = true; // passed, proceed to next check
            }
            /** Deprecated, add streaming input param to the component instead **/
            if (!Object.prototype.hasOwnProperty.call(data.inputs, 'streaming') && !data.inputs?.streaming) {
                isChatOrLLMsExist = true;
                const validLLMs = streamAvailableLLMs[data.category];
                if (!validLLMs.includes(data.name))
                    return false;
            }
        }
    }
    let isValidChainOrAgent = false;
    if (endingNodeData.category === 'Chains') {
        // Chains that are not available to stream
        const blacklistChains = ['openApiChain', 'vectaraQAChain'];
        isValidChainOrAgent = !blacklistChains.includes(endingNodeData.name);
    }
    else if (endingNodeData.category === 'Agents') {
        // Agent that are available to stream
        const whitelistAgents = ['csvAgent', 'airtableAgent', 'toolAgent', 'conversationalRetrievalToolAgent', 'openAIToolAgentLlamaIndex'];
        isValidChainOrAgent = whitelistAgents.includes(endingNodeData.name);
        // If agent is openAIAssistant, streaming is enabled
        if (endingNodeData.name === 'openAIAssistant')
            return true;
    }
    else if (endingNodeData.category === 'Engine') {
        // Engines that are available to stream
        const whitelistEngine = ['contextChatEngine', 'simpleChatEngine', 'queryEngine', 'subQuestionQueryEngine'];
        isValidChainOrAgent = whitelistEngine.includes(endingNodeData.name);
    }
    // If no output parser, flow is available to stream
    let isOutputParserExist = false;
    for (const flowNode of reactFlowNodes) {
        const data = flowNode.data;
        if (data.category.includes('Output Parser')) {
            isOutputParserExist = true;
        }
    }
    return isChatOrLLMsExist && isValidChainOrAgent && !isOutputParserExist;
};
exports.isFlowValidForStream = isFlowValidForStream;
/**
 * Returns the encryption key
 * @returns {Promise<string>}
 */
const getEncryptionKey = async () => {
    if (process.env.SECRETKEY_OVERWRITE !== undefined && process.env.SECRETKEY_OVERWRITE !== '') {
        return process.env.SECRETKEY_OVERWRITE;
    }
    if (USE_AWS_SECRETS_MANAGER && secretsManagerClient) {
        const secretId = process.env.SECRETKEY_AWS_NAME || 'FlowiseEncryptionKey';
        try {
            const command = new client_secrets_manager_1.GetSecretValueCommand({ SecretId: secretId });
            const response = await secretsManagerClient.send(command);
            if (response.SecretString) {
                return response.SecretString;
            }
        }
        catch (error) {
            if (error.name === 'ResourceNotFoundException') {
                // Secret doesn't exist, create it
                const newKey = (0, exports.generateEncryptKey)();
                const createCommand = new client_secrets_manager_1.CreateSecretCommand({
                    Name: secretId,
                    SecretString: newKey
                });
                await secretsManagerClient.send(createCommand);
                return newKey;
            }
            throw error;
        }
    }
    try {
        return await fs_1.default.promises.readFile((0, accelance_components_1.getEncryptionKeyPath)(), 'utf8');
    }
    catch (error) {
        const encryptKey = (0, exports.generateEncryptKey)();
        const defaultLocation = process.env.SECRETKEY_PATH
            ? path_1.default.join(process.env.SECRETKEY_PATH, 'encryption.key')
            : path_1.default.join((0, exports.getUserHome)(), '.accelance', 'encryption.key');
        const defaultDir = path_1.default.dirname(defaultLocation);
        if (!fs_1.default.existsSync(defaultDir)) {
            fs_1.default.mkdirSync(defaultDir, { recursive: true });
        }
        await fs_1.default.promises.writeFile(defaultLocation, encryptKey);
        return encryptKey;
    }
};
exports.getEncryptionKey = getEncryptionKey;
/**
 * Encrypt credential data
 * @param {ICredentialDataDecrypted} plainDataObj
 * @returns {Promise<string>}
 */
const encryptCredentialData = async (plainDataObj) => {
    const encryptKey = await (0, exports.getEncryptionKey)();
    return crypto_js_1.AES.encrypt(JSON.stringify(plainDataObj), encryptKey).toString();
};
exports.encryptCredentialData = encryptCredentialData;
/**
 * Decrypt credential data
 * @param {string} encryptedData
 * @param {string} componentCredentialName
 * @param {IComponentCredentials} componentCredentials
 * @returns {Promise<ICredentialDataDecrypted>}
 */
const decryptCredentialData = async (encryptedData, componentCredentialName, componentCredentials) => {
    let decryptedDataStr;
    if (USE_AWS_SECRETS_MANAGER && secretsManagerClient) {
        try {
            if (encryptedData.startsWith('FlowiseCredential_')) {
                const command = new client_secrets_manager_1.GetSecretValueCommand({ SecretId: encryptedData });
                const response = await secretsManagerClient.send(command);
                if (response.SecretString) {
                    const secretObj = JSON.parse(response.SecretString);
                    decryptedDataStr = JSON.stringify(secretObj);
                }
                else {
                    throw new Error('Failed to retrieve secret value.');
                }
            }
            else {
                const encryptKey = await (0, exports.getEncryptionKey)();
                const decryptedData = crypto_js_1.AES.decrypt(encryptedData, encryptKey);
                decryptedDataStr = decryptedData.toString(crypto_js_1.enc.Utf8);
            }
        }
        catch (error) {
            console.error(error);
            throw new Error('Failed to decrypt credential data.');
        }
    }
    else {
        // Fallback to existing code
        const encryptKey = await (0, exports.getEncryptionKey)();
        const decryptedData = crypto_js_1.AES.decrypt(encryptedData, encryptKey);
        decryptedDataStr = decryptedData.toString(crypto_js_1.enc.Utf8);
    }
    if (!decryptedDataStr)
        return {};
    try {
        if (componentCredentialName && componentCredentials) {
            const plainDataObj = JSON.parse(decryptedDataStr);
            return (0, exports.redactCredentialWithPasswordType)(componentCredentialName, plainDataObj, componentCredentials);
        }
        return JSON.parse(decryptedDataStr);
    }
    catch (e) {
        console.error(e);
        return {};
    }
};
exports.decryptCredentialData = decryptCredentialData;
/**
 * Generate an encryption key
 * @returns {string}
 */
const generateEncryptKey = () => {
    return (0, crypto_1.randomBytes)(24).toString('base64');
};
exports.generateEncryptKey = generateEncryptKey;
/**
 * Returns the directory where auth secrets are stored (same as encryption key directory).
 * Used for file-based storage of TOKEN_HASH_SECRET, EXPRESS_SESSION_SECRET, JWT_*, etc.
 */
const getAuthSecretsDirectory = () => {
    return process.env.SECRETKEY_PATH ? process.env.SECRETKEY_PATH : path_1.default.join((0, exports.getUserHome)(), '.accelance');
};
exports.getAuthSecretsDirectory = getAuthSecretsDirectory;
/**
 * Generate a 32-byte auth secret (OWASP recommendation).
 * Used for auth secrets only; encryption key remains 24 bytes.
 */
const generateAuthSecret = () => {
    return (0, crypto_1.randomBytes)(32).toString('base64');
};
exports.generateAuthSecret = generateAuthSecret;
/**
 * Resolve an auth secret: env (backwards compat) → AWS Secrets Manager → filesystem (read or generate+write).
 * Used by initAuthSecrets() for each of the six auth secrets.
 */
const getOrCreateStoredSecret = async (options) => {
    const { envKey, fileName, awsSecretIdSuffix, defaultValueForNew, weakDefault } = options;
    const envVal = process.env[envKey];
    const useEnv = envVal && envVal.trim() !== '' && (weakDefault === undefined || envVal !== weakDefault);
    if (useEnv) {
        return envVal.trim();
    }
    if (USE_AWS_SECRETS_MANAGER && secretsManagerClient) {
        const prefix = process.env.SECRETKEY_AWS_AUTH_PREFIX || 'Flowise';
        const secretId = prefix + awsSecretIdSuffix;
        try {
            const command = new client_secrets_manager_1.GetSecretValueCommand({ SecretId: secretId });
            const response = await secretsManagerClient.send(command);
            if (response.SecretString) {
                return response.SecretString;
            }
        }
        catch (error) {
            if (error.name === 'ResourceNotFoundException') {
                const newValue = defaultValueForNew !== undefined ? defaultValueForNew : (0, exports.generateAuthSecret)();
                const createCommand = new client_secrets_manager_1.CreateSecretCommand({
                    Name: secretId,
                    SecretString: newValue
                });
                await secretsManagerClient.send(createCommand);
                return newValue;
            }
            throw error;
        }
    }
    const dir = (0, exports.getAuthSecretsDirectory)();
    const filePath = path_1.default.join(dir, fileName);
    try {
        return await fs_1.default.promises.readFile(filePath, 'utf8');
    }
    catch {
        const value = defaultValueForNew !== undefined ? defaultValueForNew : (0, exports.generateAuthSecret)();
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        await fs_1.default.promises.writeFile(filePath, value);
        return value;
    }
};
exports.getOrCreateStoredSecret = getOrCreateStoredSecret;
/**
 * Transform ICredentialBody from req to Credential entity
 * @param {ICredentialReqBody} body
 * @returns {Credential}
 */
const transformToCredentialEntity = async (body) => {
    const credentialBody = {
        name: body.name,
        credentialName: body.credentialName
    };
    if (body.plainDataObj) {
        const encryptedData = await (0, exports.encryptCredentialData)(body.plainDataObj);
        credentialBody.encryptedData = encryptedData;
    }
    const newCredential = new Credential_1.Credential();
    Object.assign(newCredential, credentialBody);
    if (body.workspaceId) {
        newCredential.workspaceId = body.workspaceId;
    }
    if (body.createdBy) {
        newCredential.createdBy = body.createdBy;
    }
    return newCredential;
};
exports.transformToCredentialEntity = transformToCredentialEntity;
/**
 * Redact values that are of password type to avoid sending back to client
 * @param {string} componentCredentialName
 * @param {ICredentialDataDecrypted} decryptedCredentialObj
 * @param {IComponentCredentials} componentCredentials
 * @returns {ICredentialDataDecrypted}
 */
const maskUrlPassword = (value) => {
    try {
        const url = new URL(value);
        if (!url.password)
            return null;
        url.password = 'FLOWISE_MASKED';
        return url.toString().replace('FLOWISE_MASKED', '\u2022\u2022\u2022\u2022\u2022\u2022');
    }
    catch {
        return null;
    }
};
const redactCredentialWithPasswordType = (componentCredentialName, decryptedCredentialObj, componentCredentials) => {
    const plainDataObj = (0, lodash_1.cloneDeep)(decryptedCredentialObj);
    for (const cred in plainDataObj) {
        const inputs = componentCredentials[componentCredentialName].inputs;
        const inputParam = inputs?.find((inp) => inp.name === cred && (inp.type === 'password' || inp.type === 'url'));
        if (!inputParam)
            continue;
        if (inputParam.type === 'url') {
            const maskedUrl = typeof plainDataObj[cred] === 'string' ? maskUrlPassword(plainDataObj[cred]) : null;
            // Only redact if there was actually a password to mask; otherwise keep URL as-is
            if (maskedUrl !== null) {
                plainDataObj[cred] = maskedUrl;
            }
        }
        else {
            plainDataObj[cred] = exports.REDACTED_CREDENTIAL_VALUE;
        }
    }
    return plainDataObj;
};
exports.redactCredentialWithPasswordType = redactCredentialWithPasswordType;
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
const getMemorySessionId = (memoryNode, incomingInput, chatId, isInternal) => {
    if (!isInternal) {
        // Provided in API body - incomingInput.overrideConfig: { sessionId: 'abc' }
        if (incomingInput.overrideConfig?.sessionId) {
            return incomingInput.overrideConfig?.sessionId;
        }
        // Provided in API body - incomingInput.chatId
        if (incomingInput.chatId) {
            return incomingInput.chatId;
        }
    }
    // Hard-coded sessionId in UI
    if (memoryNode && memoryNode.data.inputs?.sessionId) {
        return memoryNode.data.inputs.sessionId;
    }
    // Default chatId
    return chatId;
};
exports.getMemorySessionId = getMemorySessionId;
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
const getSessionChatHistory = async (chatflowid, sessionId, memoryNode, componentNodes, appDataSource, databaseEntities, logger, prependMessages) => {
    const nodeInstanceFilePath = componentNodes[memoryNode.data.name].filePath;
    const nodeModule = await Promise.resolve(`${nodeInstanceFilePath}`).then(s => __importStar(require(s)));
    const newNodeInstance = new nodeModule.nodeClass();
    // Replace memory's sessionId/chatId
    if (memoryNode.data.inputs) {
        memoryNode.data.inputs.sessionId = sessionId;
    }
    const initializedInstance = await newNodeInstance.init(memoryNode.data, '', {
        chatflowid,
        appDataSource,
        databaseEntities,
        logger
    });
    return (await initializedInstance.getChatMessages(sessionId, undefined, prependMessages));
};
exports.getSessionChatHistory = getSessionChatHistory;
/**
 * Method that find memory that is connected within chatflow
 * In a chatflow, there should only be 1 memory node
 * @param {IReactFlowNode[]} nodes
 * @param {IReactFlowEdge[]} edges
 * @returns {IReactFlowNode | undefined}
 */
const findMemoryNode = (nodes, edges) => {
    const memoryNodes = nodes.filter((node) => node.data.category === 'Memory');
    const memoryNodeIds = memoryNodes.map((mem) => mem.data.id);
    for (const edge of edges) {
        if (memoryNodeIds.includes(edge.source)) {
            const memoryNode = nodes.find((node) => node.data.id === edge.source);
            return memoryNode;
        }
    }
    return undefined;
};
exports.findMemoryNode = findMemoryNode;
/**
 * Get all values from a JSON object
 * @param {any} obj
 * @returns {any[]}
 */
const getAllValuesFromJson = (obj) => {
    const values = [];
    function extractValues(data) {
        if (typeof data === 'object' && data !== null) {
            if (Array.isArray(data)) {
                for (const item of data) {
                    extractValues(item);
                }
            }
            else {
                for (const key in data) {
                    extractValues(data[key]);
                }
            }
        }
        else {
            values.push(data);
        }
    }
    extractValues(obj);
    return values;
};
exports.getAllValuesFromJson = getAllValuesFromJson;
/**
 * Get only essential flow data items for telemetry
 * @param {IReactFlowNode[]} nodes
 * @param {IReactFlowEdge[]} edges
 */
const getTelemetryFlowObj = (nodes, edges) => {
    const nodeData = nodes.map((node) => node.id);
    const edgeData = edges.map((edge) => ({ source: edge.source, target: edge.target }));
    return { nodes: nodeData, edges: edgeData };
};
exports.getTelemetryFlowObj = getTelemetryFlowObj;
/**
 * Get app current version
 */
const getAppVersion = async () => {
    const getPackageJsonPath = () => {
        const checkPaths = [
            path_1.default.join(__dirname, '..', 'package.json'),
            path_1.default.join(__dirname, '..', '..', 'package.json'),
            path_1.default.join(__dirname, '..', '..', '..', 'package.json'),
            path_1.default.join(__dirname, '..', '..', '..', '..', 'package.json'),
            path_1.default.join(__dirname, '..', '..', '..', '..', '..', 'package.json')
        ];
        for (const checkPath of checkPaths) {
            if (fs_1.default.existsSync(checkPath)) {
                return checkPath;
            }
        }
        return '';
    };
    const packagejsonPath = getPackageJsonPath();
    if (!packagejsonPath)
        return '';
    try {
        const content = await fs_1.default.promises.readFile(packagejsonPath, 'utf8');
        const parsedContent = JSON.parse(content);
        return parsedContent.version;
    }
    catch (error) {
        return '';
    }
};
exports.getAppVersion = getAppVersion;
const convertToValidFilename = (word) => {
    return word
        .replace(/[/|\\:*?"<>]/g, ' ')
        .replace(' ', '')
        .toLowerCase();
};
exports.convertToValidFilename = convertToValidFilename;
const aMonthAgo = () => {
    const date = new Date();
    date.setMonth(new Date().getMonth() - 1);
    return date;
};
exports.aMonthAgo = aMonthAgo;
const getAPIOverrideConfig = (chatflow) => {
    try {
        const apiConfig = chatflow.apiConfig ? JSON.parse(chatflow.apiConfig) : {};
        const nodeOverrides = apiConfig.overrideConfig && apiConfig.overrideConfig.nodes ? apiConfig.overrideConfig.nodes : {};
        const variableOverrides = apiConfig.overrideConfig && apiConfig.overrideConfig.variables ? apiConfig.overrideConfig.variables : [];
        const apiOverrideStatus = apiConfig.overrideConfig && apiConfig.overrideConfig.status ? apiConfig.overrideConfig.status : false;
        return { nodeOverrides, variableOverrides, apiOverrideStatus };
    }
    catch (error) {
        return { nodeOverrides: {}, variableOverrides: [], apiOverrideStatus: false };
    }
};
exports.getAPIOverrideConfig = getAPIOverrideConfig;
const getUploadPath = () => {
    return process.env.BLOB_STORAGE_PATH
        ? path_1.default.join(process.env.BLOB_STORAGE_PATH, 'uploads')
        : path_1.default.join((0, exports.getUserHome)(), '.accelance', 'uploads');
};
exports.getUploadPath = getUploadPath;
function generateId() {
    return (0, uuid_1.v4)();
}
const getMulterStorage = () => {
    const provider = accelance_components_1.StorageProviderFactory.getProvider();
    return provider.getMulterStorage();
};
exports.getMulterStorage = getMulterStorage;
/**
 * Calculate depth of each node from starting nodes
 * @param {INodeDirectedGraph} graph
 * @param {string[]} startingNodeIds
 * @returns {Record<string, number>} Map of nodeId to its depth
 */
const calculateNodesDepth = (graph, startingNodeIds) => {
    const depths = {};
    const visited = new Set();
    // Initialize all nodes with depth -1 (unvisited)
    for (const nodeId in graph) {
        depths[nodeId] = -1;
    }
    // BFS queue with [nodeId, depth]
    const queue = startingNodeIds.map((id) => [id, 0]);
    // Set starting nodes depth to 0
    startingNodeIds.forEach((id) => {
        depths[id] = 0;
    });
    while (queue.length > 0) {
        const [currentNode, currentDepth] = queue.shift();
        if (visited.has(currentNode))
            continue;
        visited.add(currentNode);
        // Process all neighbors
        for (const neighbor of graph[currentNode]) {
            if (!visited.has(neighbor)) {
                // Update depth if unvisited or found shorter path
                if (depths[neighbor] === -1 || depths[neighbor] > currentDepth + 1) {
                    depths[neighbor] = currentDepth + 1;
                }
                queue.push([neighbor, currentDepth + 1]);
            }
        }
    }
    return depths;
};
exports.calculateNodesDepth = calculateNodesDepth;
/**
 * Helper function to get all nodes in a path starting from a node
 * @param {INodeDirectedGraph} graph
 * @param {string} startNode
 * @returns {string[]}
 */
const getAllNodesInPath = (startNode, graph) => {
    const nodes = new Set();
    const queue = [startNode];
    while (queue.length > 0) {
        const current = queue.shift();
        if (nodes.has(current))
            continue;
        nodes.add(current);
        if (graph[current]) {
            queue.push(...graph[current]);
        }
    }
    return Array.from(nodes);
};
exports.getAllNodesInPath = getAllNodesInPath;
const _removeCredentialId = (obj) => {
    if (!obj || typeof obj !== 'object')
        return obj;
    if (Array.isArray(obj)) {
        return obj.map((item) => (0, exports._removeCredentialId)(item));
    }
    const newObj = {};
    for (const [key, value] of Object.entries(obj)) {
        if (key === 'FLOWISE_CREDENTIAL_ID')
            continue;
        newObj[key] = (0, exports._removeCredentialId)(value);
    }
    return newObj;
};
exports._removeCredentialId = _removeCredentialId;
/**
 * Validates that history items follow the expected schema
 * @param {any[]} history - Array of history items to validate
 * @returns {boolean} - True if all items are valid, false otherwise
 */
const validateHistorySchema = (history) => {
    if (!Array.isArray(history)) {
        return false;
    }
    return history.every((item) => {
        // Check if item is an object
        if (typeof item !== 'object' || item === null) {
            return false;
        }
        // Check if role exists and is valid
        if (typeof item.role !== 'string' || !['apiMessage', 'userMessage'].includes(item.role)) {
            return false;
        }
        // Check if content exists and is a string
        if (typeof item.content !== 'string') {
            return false;
        }
        return true;
    });
};
exports.validateHistorySchema = validateHistorySchema;
//# sourceMappingURL=index.js.map