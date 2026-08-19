"use strict";
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
exports.buildAgentGraph = void 0;
const accelance_components_1 = require("accelance-components");
const lodash_1 = require("lodash");
const langgraph_1 = require("@langchain/langgraph");
const http_status_codes_1 = require("http-status-codes");
const uuid_1 = require("uuid");
const messages_1 = require("@langchain/core/messages");
const utils_1 = require("../utils");
const _1 = require(".");
const internalAccelanceError_1 = require("../errors/internalAccelanceError");
const utils_2 = require("../errors/utils");
const logger_1 = __importDefault(require("./logger"));
const Variable_1 = require("../database/entities/Variable");
const ControllerServiceUtils_1 = require("../enterprise/utils/ControllerServiceUtils");
/**
 * Build Agent Graph
 */
const buildAgentGraph = async ({ agentflow, flowConfig, incomingInput, nodes, edges, initializedNodes, endingNodeIds, startingNodeIds, depthQueue, chatHistory, uploadedFilesContent, appDataSource, componentNodes, sseStreamer, shouldStreamResponse, cachePool, baseURL, signal, orgId, workspaceId, userId }) => {
    try {
        const chatflowid = flowConfig.chatflowid;
        const chatId = flowConfig.chatId;
        const sessionId = flowConfig.sessionId;
        const analytic = agentflow.analytic;
        const uploads = incomingInput.uploads;
        const options = {
            orgId,
            workspaceId,
            userId,
            chatId,
            sessionId,
            chatflowid,
            chatflowId: chatflowid,
            logger: logger_1.default,
            analytic,
            appDataSource,
            databaseEntities: utils_1.databaseEntities,
            cachePool,
            uploads,
            baseURL,
            signal: signal ?? new AbortController()
        };
        let streamResults;
        let finalResult = '';
        let finalSummarization = '';
        let lastWorkerResult = '';
        let agentReasoning = [];
        let isSequential = false;
        let lastMessageRaw = {};
        let finalAction = {};
        let totalSourceDocuments = [];
        let totalUsedTools = [];
        let totalArtifacts = [];
        const workerNodes = initializedNodes.filter((node) => node.data.name === 'worker');
        const supervisorNodes = initializedNodes.filter((node) => node.data.name === 'supervisor');
        const seqAgentNodes = initializedNodes.filter((node) => node.data.category === 'Sequential Agents');
        const mapNameToLabel = {};
        for (const node of [...workerNodes, ...supervisorNodes, ...seqAgentNodes]) {
            if (!Object.prototype.hasOwnProperty.call(mapNameToLabel, node.data.instance.name)) {
                mapNameToLabel[node.data.instance.name] = {
                    label: node.data.instance.label,
                    nodeName: node.data.name
                };
            }
        }
        try {
            if (!seqAgentNodes.length) {
                streamResults = await compileMultiAgentsGraph({
                    agentflow,
                    appDataSource,
                    mapNameToLabel,
                    reactFlowNodes: initializedNodes,
                    workerNodeIds: endingNodeIds,
                    componentNodes,
                    options,
                    startingNodeIds,
                    question: incomingInput.question,
                    prependHistoryMessages: incomingInput.history,
                    chatHistory,
                    overrideConfig: incomingInput?.overrideConfig,
                    threadId: sessionId || chatId,
                    summarization: seqAgentNodes.some((node) => node.data.inputs?.summarization),
                    uploadedFilesContent
                });
            }
            else {
                isSequential = true;
                streamResults = await compileSeqAgentsGraph({
                    depthQueue,
                    agentflow,
                    appDataSource,
                    reactFlowNodes: initializedNodes,
                    reactFlowEdges: edges,
                    componentNodes,
                    options,
                    question: incomingInput.question,
                    prependHistoryMessages: incomingInput.history,
                    chatHistory,
                    overrideConfig: incomingInput?.overrideConfig,
                    threadId: sessionId || chatId,
                    action: incomingInput.action,
                    uploadedFilesContent
                });
            }
            if (streamResults) {
                let isStreamingStarted = false;
                for await (const output of await streamResults) {
                    if (!output?.__end__) {
                        for (const agentName of Object.keys(output)) {
                            if (!mapNameToLabel[agentName])
                                continue;
                            const nodeId = output[agentName]?.messages
                                ? output[agentName].messages[output[agentName].messages.length - 1]?.additional_kwargs?.nodeId
                                : '';
                            const usedTools = output[agentName]?.messages
                                ? output[agentName].messages.map((msg) => msg.additional_kwargs?.usedTools)
                                : [];
                            const sourceDocuments = output[agentName]?.messages
                                ? output[agentName].messages.map((msg) => msg.additional_kwargs?.sourceDocuments)
                                : [];
                            const artifacts = output[agentName]?.messages
                                ? output[agentName].messages.map((msg) => msg.additional_kwargs?.artifacts)
                                : [];
                            const messages = output[agentName]?.messages
                                ? output[agentName].messages.map((msg) => (typeof msg === 'string' ? msg : msg.content))
                                : [];
                            lastMessageRaw = output[agentName]?.messages
                                ? output[agentName].messages[output[agentName].messages.length - 1]
                                : {};
                            const state = (0, lodash_1.omit)(output[agentName], ['messages']);
                            if (usedTools && usedTools.length) {
                                const cleanedTools = usedTools.filter((tool) => tool);
                                if (cleanedTools.length)
                                    totalUsedTools.push(...cleanedTools);
                            }
                            if (sourceDocuments && sourceDocuments.length) {
                                const cleanedDocs = sourceDocuments.filter((documents) => documents);
                                if (cleanedDocs.length)
                                    totalSourceDocuments.push(...cleanedDocs);
                            }
                            if (artifacts && artifacts.length) {
                                const cleanedArtifacts = artifacts.filter((artifact) => artifact);
                                if (cleanedArtifacts.length)
                                    totalArtifacts.push(...cleanedArtifacts);
                            }
                            /*
                             * Check if the next node is a condition node, if yes, then add the agent reasoning of the condition node
                             */
                            if (isSequential) {
                                const inputEdges = edges.filter((edg) => edg.target === nodeId && edg.targetHandle.includes(`${nodeId}-input-sequentialNode`));
                                inputEdges.forEach((edge) => {
                                    const parentNode = initializedNodes.find((nd) => nd.id === edge.source);
                                    if (parentNode) {
                                        if (parentNode.data.name.includes('seqCondition')) {
                                            const newMessages = messages.slice(0, -1);
                                            newMessages.push(mapNameToLabel[agentName].label);
                                            const reasoning = {
                                                agentName: parentNode.data.instance?.label || parentNode.data.type,
                                                messages: newMessages,
                                                nodeName: parentNode.data.name,
                                                nodeId: parentNode.data.id
                                            };
                                            agentReasoning.push(reasoning);
                                        }
                                    }
                                });
                            }
                            const reasoning = {
                                agentName: mapNameToLabel[agentName].label,
                                messages,
                                next: output[agentName]?.next,
                                instructions: output[agentName]?.instructions,
                                usedTools: (0, lodash_1.flatten)(usedTools),
                                sourceDocuments: (0, lodash_1.flatten)(sourceDocuments),
                                artifacts: (0, lodash_1.flatten)(artifacts),
                                state,
                                nodeName: isSequential ? mapNameToLabel[agentName].nodeName : undefined,
                                nodeId
                            };
                            agentReasoning.push(reasoning);
                            finalSummarization = output[agentName]?.summarization ?? '';
                            lastWorkerResult =
                                output[agentName]?.messages?.length &&
                                    output[agentName].messages[output[agentName].messages.length - 1]?.additional_kwargs?.type === 'worker'
                                    ? output[agentName].messages[output[agentName].messages.length - 1].content
                                    : lastWorkerResult;
                            if (shouldStreamResponse) {
                                if (!isStreamingStarted) {
                                    isStreamingStarted = true;
                                    if (sseStreamer) {
                                        sseStreamer.streamStartEvent(chatId, agentReasoning);
                                    }
                                }
                                if (sseStreamer) {
                                    sseStreamer.streamAgentReasoningEvent(chatId, agentReasoning);
                                }
                                // Send loading next agent indicator
                                if (reasoning.next && reasoning.next !== 'FINISH' && reasoning.next !== 'END') {
                                    if (sseStreamer) {
                                        sseStreamer.streamNextAgentEvent(chatId, mapNameToLabel[reasoning.next]?.label || reasoning.next);
                                    }
                                }
                            }
                        }
                    }
                    else {
                        finalResult = output.__end__.messages.length ? output.__end__.messages.pop()?.content : '';
                        if (Array.isArray(finalResult))
                            finalResult = output.__end__.instructions;
                        if (shouldStreamResponse && sseStreamer) {
                            sseStreamer.streamTokenEvent(chatId, finalResult);
                        }
                    }
                }
                /*
                 * For multi agents mode, sometimes finalResult is empty
                 * 1.) Provide lastWorkerResult as final result if available
                 * 2.) Provide summary as final result if available
                 */
                if (!isSequential && !finalResult) {
                    if (lastWorkerResult)
                        finalResult = lastWorkerResult;
                    else if (finalSummarization)
                        finalResult = finalSummarization;
                    if (shouldStreamResponse && sseStreamer) {
                        sseStreamer.streamTokenEvent(chatId, finalResult);
                    }
                }
                /*
                 * For sequential mode, sometimes finalResult is empty
                 * Use last agent message as final result
                 */
                if (isSequential && !finalResult && agentReasoning.length) {
                    const lastMessages = agentReasoning[agentReasoning.length - 1].messages;
                    const lastAgentReasoningMessage = lastMessages[lastMessages.length - 1];
                    // If last message is an AI Message with tool calls, that means the last node was interrupted
                    if (lastMessageRaw.tool_calls && lastMessageRaw.tool_calls.length > 0) {
                        // The last node that got interrupted
                        const node = initializedNodes.find((node) => node.id === lastMessageRaw.additional_kwargs.nodeId);
                        // Find the next tool node that is connected to the interrupted node, to get the approve/reject button text
                        const tooNodeId = edges.find((edge) => edge.target.includes('seqToolNode') &&
                            edge.source === (lastMessageRaw.additional_kwargs && lastMessageRaw.additional_kwargs.nodeId))?.target;
                        const connectedToolNode = initializedNodes.find((node) => node.id === tooNodeId);
                        // Map raw tool calls to used tools, to be shown on interrupted message
                        const mappedToolCalls = lastMessageRaw.tool_calls.map((toolCall) => {
                            return {
                                tool: toolCall.name,
                                toolInput: toolCall.args,
                                toolOutput: ''
                            };
                        });
                        // Emit the interrupt message to the client
                        let approveButtonText = 'Yes';
                        let rejectButtonText = 'No';
                        if (connectedToolNode || node) {
                            if (connectedToolNode) {
                                const result = await connectedToolNode.data.instance.node.seekPermissionMessage(mappedToolCalls);
                                finalResult = result || 'Do you want to proceed?';
                                approveButtonText = connectedToolNode.data.inputs?.approveButtonText || 'Yes';
                                rejectButtonText = connectedToolNode.data.inputs?.rejectButtonText || 'No';
                            }
                            else if (node) {
                                const result = await node.data.instance.agentInterruptToolNode.seekPermissionMessage(mappedToolCalls);
                                finalResult = result || 'Do you want to proceed?';
                                approveButtonText = node.data.inputs?.approveButtonText || 'Yes';
                                rejectButtonText = node.data.inputs?.rejectButtonText || 'No';
                            }
                            finalAction = {
                                id: (0, uuid_1.v4)(),
                                mapping: {
                                    approve: approveButtonText,
                                    reject: rejectButtonText,
                                    toolCalls: lastMessageRaw.tool_calls
                                },
                                elements: [
                                    { type: 'approve-button', label: approveButtonText },
                                    { type: 'reject-button', label: rejectButtonText }
                                ]
                            };
                            if (shouldStreamResponse && sseStreamer) {
                                sseStreamer.streamTokenEvent(chatId, finalResult);
                                sseStreamer.streamActionEvent(chatId, finalAction);
                            }
                        }
                        totalUsedTools.push(...mappedToolCalls);
                    }
                    else if (lastAgentReasoningMessage) {
                        finalResult = lastAgentReasoningMessage;
                        if (shouldStreamResponse && sseStreamer) {
                            sseStreamer.streamTokenEvent(chatId, finalResult);
                        }
                    }
                }
                totalSourceDocuments = (0, lodash_1.uniq)((0, lodash_1.flatten)(totalSourceDocuments));
                totalUsedTools = (0, lodash_1.uniq)((0, lodash_1.flatten)(totalUsedTools));
                totalArtifacts = (0, lodash_1.uniq)((0, lodash_1.flatten)(totalArtifacts));
                if (shouldStreamResponse && sseStreamer) {
                    sseStreamer.streamUsedToolsEvent(chatId, totalUsedTools);
                    sseStreamer.streamSourceDocumentsEvent(chatId, totalSourceDocuments);
                    sseStreamer.streamArtifactsEvent(chatId, totalArtifacts);
                    sseStreamer.streamEndEvent(chatId);
                }
                return {
                    finalResult,
                    finalAction,
                    sourceDocuments: totalSourceDocuments,
                    artifacts: totalArtifacts,
                    usedTools: totalUsedTools,
                    agentReasoning
                };
            }
        }
        catch (e) {
            // clear agent memory because checkpoints were saved during runtime
            await (0, utils_1.clearSessionMemory)(nodes, componentNodes, chatId, appDataSource, orgId, sessionId);
            if ((0, utils_2.getErrorMessage)(e).includes('Aborted')) {
                if (shouldStreamResponse && sseStreamer) {
                    sseStreamer.streamAbortEvent(chatId);
                }
                return { finalResult, agentReasoning };
            }
            throw new Error((0, utils_2.getErrorMessage)(e));
        }
        return streamResults;
    }
    catch (e) {
        logger_1.default.error(`[server]: [${orgId}]: Error:`, e);
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error buildAgentGraph - ${(0, utils_2.getErrorMessage)(e)}`);
    }
};
exports.buildAgentGraph = buildAgentGraph;
const compileMultiAgentsGraph = async (params) => {
    const { agentflow, appDataSource, mapNameToLabel, reactFlowNodes, workerNodeIds, componentNodes, options, prependHistoryMessages = [], chatHistory = [], overrideConfig = {}, threadId, summarization = false, uploadedFilesContent } = params;
    let question = params.question;
    const channels = {
        messages: {
            value: (x, y) => x.concat(y),
            default: () => []
        },
        next: 'initialState',
        instructions: "Solve the user's request.",
        team_members: []
    };
    if (summarization)
        channels.summarization = 'summarize';
    const workflowGraph = new langgraph_1.StateGraph({
        //@ts-ignore
        channels
    });
    const workerNodes = reactFlowNodes.filter((node) => workerNodeIds.includes(node.data.id));
    /*** Get API Config ***/
    const availableVariables = await appDataSource.getRepository(Variable_1.Variable).findBy((0, ControllerServiceUtils_1.getWorkspaceSearchOptions)(agentflow.workspaceId));
    const { nodeOverrides, variableOverrides, apiOverrideStatus } = (0, utils_1.getAPIOverrideConfig)(agentflow);
    let supervisorWorkers = {};
    // Init worker nodes
    for (const workerNode of workerNodes) {
        const nodeInstanceFilePath = componentNodes[workerNode.data.name].filePath;
        const nodeModule = await Promise.resolve(`${nodeInstanceFilePath}`).then(s => __importStar(require(s)));
        const newNodeInstance = new nodeModule.nodeClass();
        let flowNodeData = (0, lodash_1.cloneDeep)(workerNode.data);
        if (overrideConfig && apiOverrideStatus)
            flowNodeData = (0, _1.replaceInputsWithConfig)(flowNodeData, overrideConfig, nodeOverrides, variableOverrides);
        flowNodeData = await (0, _1.resolveVariables)(flowNodeData, reactFlowNodes, question, chatHistory, overrideConfig, uploadedFilesContent, availableVariables, variableOverrides);
        try {
            const workerResult = await newNodeInstance.init(flowNodeData, question, options);
            const parentSupervisor = workerResult.parentSupervisorName;
            if (!parentSupervisor || workerResult.type !== 'worker')
                continue;
            if (Object.prototype.hasOwnProperty.call(supervisorWorkers, parentSupervisor)) {
                supervisorWorkers[parentSupervisor].push(workerResult);
            }
            else {
                supervisorWorkers[parentSupervisor] = [workerResult];
            }
            workflowGraph.addNode(workerResult.name, workerResult.node);
        }
        catch (e) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error initialize worker nodes - ${(0, utils_2.getErrorMessage)(e)}`);
        }
    }
    // Init supervisor nodes
    for (const supervisor in supervisorWorkers) {
        const supervisorInputLabel = mapNameToLabel[supervisor].label;
        const supervisorNode = reactFlowNodes.find((node) => supervisorInputLabel === node.data.inputs?.supervisorName);
        if (!supervisorNode)
            continue;
        const nodeInstanceFilePath = componentNodes[supervisorNode.data.name].filePath;
        const nodeModule = await Promise.resolve(`${nodeInstanceFilePath}`).then(s => __importStar(require(s)));
        const newNodeInstance = new nodeModule.nodeClass();
        let flowNodeData = (0, lodash_1.cloneDeep)(supervisorNode.data);
        if (overrideConfig && apiOverrideStatus)
            flowNodeData = (0, _1.replaceInputsWithConfig)(flowNodeData, overrideConfig, nodeOverrides, variableOverrides);
        flowNodeData = await (0, _1.resolveVariables)(flowNodeData, reactFlowNodes, question, chatHistory, overrideConfig, uploadedFilesContent, availableVariables, variableOverrides);
        if (flowNodeData.inputs)
            flowNodeData.inputs.workerNodes = supervisorWorkers[supervisor];
        try {
            const supervisorResult = await newNodeInstance.init(flowNodeData, question, options);
            if (!supervisorResult.workers?.length)
                continue;
            if (supervisorResult.moderations && supervisorResult.moderations.length > 0) {
                try {
                    for (const moderation of supervisorResult.moderations) {
                        question = await moderation.checkForViolations(question);
                    }
                }
                catch (e) {
                    throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, (0, utils_2.getErrorMessage)(e));
                }
            }
            workflowGraph.addNode(supervisorResult.name, supervisorResult.node);
            for (const worker of supervisorResult.workers) {
                //@ts-ignore
                workflowGraph.addEdge(worker, supervisorResult.name);
            }
            let conditionalEdges = {};
            for (let i = 0; i < supervisorResult.workers.length; i++) {
                conditionalEdges[supervisorResult.workers[i]] = supervisorResult.workers[i];
            }
            //@ts-ignore
            workflowGraph.addConditionalEdges(supervisorResult.name, (x) => x.next, {
                ...conditionalEdges,
                FINISH: langgraph_1.END
            });
            //@ts-ignore
            workflowGraph.addEdge(langgraph_1.START, supervisorResult.name);
            workflowGraph.signal = options.signal;
            // Get memory
            let memory = supervisorResult?.checkpointMemory;
            const graph = workflowGraph.compile({ checkpointer: memory });
            const loggerHandler = new accelance_components_1.ConsoleCallbackHandler(logger_1.default, options?.orgId);
            const callbacks = await (0, accelance_components_1.additionalCallbacks)(flowNodeData, options);
            const config = { configurable: { thread_id: threadId } };
            let prependMessages = [];
            // Only append in the first message
            if (prependHistoryMessages.length === chatHistory.length) {
                for (const message of prependHistoryMessages) {
                    if (message.role === 'apiMessage' || message.type === 'apiMessage') {
                        prependMessages.push(new messages_1.AIMessage({
                            content: message.message || message.content || ''
                        }));
                    }
                    else if (message.role === 'userMessage' || message.type === 'userMessage') {
                        prependMessages.push(new messages_1.HumanMessage({
                            content: message.message || message.content || ''
                        }));
                    }
                }
            }
            // Return stream result as we should only have 1 supervisor
            const finalQuestion = uploadedFilesContent ? `${uploadedFilesContent}\n\n${question}` : question;
            return await graph.stream({
                messages: [...prependMessages, new messages_1.HumanMessage({ content: finalQuestion })]
            }, {
                recursionLimit: supervisorResult?.recursionLimit ?? 100,
                callbacks: [loggerHandler, ...callbacks],
                configurable: config
            });
        }
        catch (e) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error initialize supervisor nodes - ${(0, utils_2.getErrorMessage)(e)}`);
        }
    }
};
const compileSeqAgentsGraph = async (params) => {
    const { depthQueue, agentflow, appDataSource, reactFlowNodes, reactFlowEdges, componentNodes, options, prependHistoryMessages = [], chatHistory = [], overrideConfig = {}, threadId, action, uploadedFilesContent } = params;
    let question = params.question;
    let channels = {
        messages: {
            value: (x, y) => x.concat(y),
            default: () => []
        }
    };
    // Get state
    const seqStateNode = reactFlowNodes.find((node) => node.data.name === 'seqState');
    if (seqStateNode) {
        channels = {
            ...seqStateNode.data.instance.node,
            ...channels
        };
    }
    let seqGraph = new langgraph_1.StateGraph({
        //@ts-ignore
        channels
    });
    /*** Validate Graph ***/
    const startAgentNodes = reactFlowNodes.filter((node) => node.data.name === 'seqStart');
    if (!startAgentNodes.length)
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Start node not found');
    if (startAgentNodes.length > 1)
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Graph should have only one start node');
    const endAgentNodes = reactFlowNodes.filter((node) => node.data.name === 'seqEnd');
    const loopNodes = reactFlowNodes.filter((node) => node.data.name === 'seqLoop');
    if (!endAgentNodes.length && !loopNodes.length) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Graph should have at least one End/Loop node');
    }
    /*** End of Validation ***/
    let flowNodeData;
    let conditionalEdges = {};
    let interruptedRouteMapping = {};
    let conditionalToolNodes = {};
    let bindModel = {};
    let interruptToolNodeNames = [];
    /*** Get API Config ***/
    const availableVariables = await appDataSource.getRepository(Variable_1.Variable).findBy((0, ControllerServiceUtils_1.getWorkspaceSearchOptions)(agentflow.workspaceId));
    const { nodeOverrides, variableOverrides, apiOverrideStatus } = (0, utils_1.getAPIOverrideConfig)(agentflow);
    const initiateNode = async (node) => {
        const nodeInstanceFilePath = componentNodes[node.data.name].filePath;
        const nodeModule = await Promise.resolve(`${nodeInstanceFilePath}`).then(s => __importStar(require(s)));
        const newNodeInstance = new nodeModule.nodeClass();
        flowNodeData = (0, lodash_1.cloneDeep)(node.data);
        if (overrideConfig && apiOverrideStatus)
            flowNodeData = (0, _1.replaceInputsWithConfig)(flowNodeData, overrideConfig, nodeOverrides, variableOverrides);
        flowNodeData = await (0, _1.resolveVariables)(flowNodeData, reactFlowNodes, question, chatHistory, overrideConfig, uploadedFilesContent, availableVariables, variableOverrides);
        const seqAgentNode = await newNodeInstance.init(flowNodeData, question, options);
        return seqAgentNode;
    };
    /*
     *  Two objectives we want to achieve here:
     *  1.) Prepare the mapping of conditional outputs to next nodes. This mapping will ONLY be used to add conditional edges to the Interrupted Agent connected next to Condition/ConditionAgent Node.
     *    For example, if the condition node has 2 outputs 'Yes' and 'No', and 'Yes' leads to 'agentName1' and 'No' leads to 'agentName2', then the mapping should be like:
     *    {
     *      <conditionNodeId>: { 'Yes': 'agentName1', 'No': 'agentName2' }
     *    }
     *  2.) With the interruptedRouteMapping object, avoid adding conditional edges to the Interrupted Agent for the nodes that are already interrupted by tools. It will be separately added from the function - agentInterruptToolFunc
     */
    const processInterruptedRouteMapping = (conditionNodeId) => {
        const conditionEdges = reactFlowEdges.filter((edge) => edge.source === conditionNodeId) ?? [];
        for (const conditionEdge of conditionEdges) {
            const nextNodeId = conditionEdge.target;
            const conditionNodeOutputAnchorId = conditionEdge.sourceHandle;
            const nextNode = reactFlowNodes.find((node) => node.id === nextNodeId);
            if (!nextNode)
                continue;
            const conditionNode = reactFlowNodes.find((node) => node.id === conditionNodeId);
            if (!conditionNode)
                continue;
            const outputAnchors = conditionNode?.data.outputAnchors;
            if (!outputAnchors || !outputAnchors.length || !outputAnchors[0].options)
                continue;
            const conditionOutputAnchorLabel = outputAnchors[0].options.find((option) => option.id === conditionNodeOutputAnchorId)?.label ?? '';
            if (!conditionOutputAnchorLabel)
                continue;
            if (Object.prototype.hasOwnProperty.call(interruptedRouteMapping, conditionNodeId)) {
                interruptedRouteMapping[conditionNodeId] = {
                    ...interruptedRouteMapping[conditionNodeId],
                    [conditionOutputAnchorLabel]: nextNode.data.instance.name
                };
            }
            else {
                interruptedRouteMapping[conditionNodeId] = {
                    [conditionOutputAnchorLabel]: nextNode.data.instance.name
                };
            }
        }
    };
    /*
     *  Prepare Conditional Edges
     *  Example: {
     *    'seqCondition_1': { nodes: { 'Yes': 'agentName1', 'No': 'agentName2' }, func: <condition-function>, disabled: true },
     *    'seqCondition_2': { nodes: { 'Yes': 'agentName3', 'No': 'agentName4' }, func: <condition-function> }
     *  }
     */
    const prepareConditionalEdges = (nodeId, nodeInstance) => {
        const conditionEdges = reactFlowEdges.filter((edge) => edge.target === nodeId && edge.source.includes('seqCondition')) ?? [];
        for (const conditionEdge of conditionEdges) {
            const conditionNodeId = conditionEdge.source;
            const conditionNodeOutputAnchorId = conditionEdge.sourceHandle;
            const conditionNode = reactFlowNodes.find((node) => node.id === conditionNodeId);
            const outputAnchors = conditionNode?.data.outputAnchors;
            if (!outputAnchors || !outputAnchors.length || !outputAnchors[0].options)
                continue;
            const conditionOutputAnchorLabel = outputAnchors[0].options.find((option) => option.id === conditionNodeOutputAnchorId)?.label ?? '';
            if (!conditionOutputAnchorLabel)
                continue;
            if (Object.prototype.hasOwnProperty.call(conditionalEdges, conditionNodeId)) {
                conditionalEdges[conditionNodeId] = {
                    ...conditionalEdges[conditionNodeId],
                    nodes: {
                        ...conditionalEdges[conditionNodeId].nodes,
                        [conditionOutputAnchorLabel]: nodeInstance.name
                    }
                };
            }
            else {
                conditionalEdges[conditionNodeId] = {
                    nodes: { [conditionOutputAnchorLabel]: nodeInstance.name },
                    func: conditionNode.data.instance.node
                };
            }
        }
    };
    /*
     *  Prepare Conditional Tool Edges. This is just for LLMNode -> ToolNode
     *  Example: {
     *    'agent_1': { source: agent, toolNodes: [node] }
     *  }
     */
    const prepareLLMToToolEdges = (predecessorAgent, toolNodeInstance) => {
        if (Object.prototype.hasOwnProperty.call(conditionalToolNodes, predecessorAgent.id)) {
            const toolNodes = conditionalToolNodes[predecessorAgent.id].toolNodes;
            toolNodes.push(toolNodeInstance);
            conditionalToolNodes[predecessorAgent.id] = {
                source: predecessorAgent,
                toolNodes
            };
        }
        else {
            conditionalToolNodes[predecessorAgent.id] = {
                source: predecessorAgent,
                toolNodes: [toolNodeInstance]
            };
        }
    };
    /*** This is to bind the tools to the model of LLMNode, when the LLMNode is predecessor/successor of ToolNode ***/
    const createBindModel = (agent, toolNodeInstance) => {
        const tools = (0, lodash_1.flatten)(toolNodeInstance.node?.tools);
        bindModel[agent.id] = agent.llm.bindTools(tools);
    };
    /*** Start processing every Agent nodes ***/
    for (const agentNodeId of getSortedDepthNodes(depthQueue)) {
        const agentNode = reactFlowNodes.find((node) => node.id === agentNodeId);
        if (!agentNode)
            continue;
        const eligibleSeqNodes = ['seqAgent', 'seqEnd', 'seqLoop', 'seqToolNode', 'seqLLMNode', 'seqCustomFunction', 'seqExecuteFlow'];
        const nodesToAdd = ['seqAgent', 'seqToolNode', 'seqLLMNode', 'seqCustomFunction', 'seqExecuteFlow'];
        if (eligibleSeqNodes.includes(agentNode.data.name)) {
            try {
                const agentInstance = await initiateNode(agentNode);
                if (nodesToAdd.includes(agentNode.data.name)) {
                    // Add node to graph
                    seqGraph.addNode(agentInstance.name, agentInstance.node);
                    /*
                     * If it is an Interrupted Agent, we want to:
                     * 1.) Add conditional edges to the Interrupted Agent via agentInterruptToolFunc
                     * 2.) Add agent to the interruptToolNodeNames list
                     */
                    if (agentInstance.type === 'agent' && agentNode.data.inputs?.interrupt) {
                        interruptToolNodeNames.push(agentInstance.agentInterruptToolNode.name);
                        const nextNodeId = reactFlowEdges.find((edge) => edge.source === agentNode.id)?.target;
                        const nextNode = reactFlowNodes.find((node) => node.id === nextNodeId);
                        let nextNodeSeqAgentName = '';
                        if (nextNodeId && nextNode) {
                            nextNodeSeqAgentName = nextNode.data.instance.name;
                            // If next node is Condition Node, process the interrupted route mapping, see more details from comments of processInterruptedRouteMapping
                            if (nextNode.data.name.includes('seqCondition')) {
                                const conditionNode = nextNodeId;
                                processInterruptedRouteMapping(conditionNode);
                                seqGraph = await agentInstance.agentInterruptToolFunc(seqGraph, undefined, nextNode.data.instance.node, interruptedRouteMapping[conditionNode]);
                            }
                            else {
                                seqGraph = await agentInstance.agentInterruptToolFunc(seqGraph, nextNodeSeqAgentName);
                            }
                        }
                        else {
                            seqGraph = await agentInstance.agentInterruptToolFunc(seqGraph, nextNodeSeqAgentName);
                        }
                    }
                }
                if (agentInstance.predecessorAgents) {
                    const predecessorAgents = agentInstance.predecessorAgents;
                    const edges = [];
                    for (const predecessorAgent of predecessorAgents) {
                        // Add start edge and set entry point
                        if (predecessorAgent.name === langgraph_1.START) {
                            if (agentInstance.moderations && agentInstance.moderations.length > 0) {
                                try {
                                    for (const moderation of agentInstance.moderations) {
                                        question = await moderation.checkForViolations(question);
                                    }
                                }
                                catch (e) {
                                    throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, (0, utils_2.getErrorMessage)(e));
                                }
                            }
                            //@ts-ignore
                            seqGraph.addEdge(langgraph_1.START, agentInstance.name);
                        }
                        else if (predecessorAgent.type === 'condition') {
                            /*
                             * If current node is Condition Node, AND predecessor is an Interrupted Agent
                             * Don't add conditional edges to the Interrupted Agent, as it will be added separately from the function - agentInterruptToolFunc
                             */
                            if (!Object.prototype.hasOwnProperty.call(interruptedRouteMapping, predecessorAgent.id)) {
                                prepareConditionalEdges(agentNode.data.id, agentInstance);
                            }
                        }
                        else if (agentNode.data.name === 'seqToolNode') {
                            // Prepare the conditional edges for LLMNode -> ToolNode AND bind the tools to LLMNode
                            prepareLLMToToolEdges(predecessorAgent, agentInstance);
                            createBindModel(predecessorAgent, agentInstance);
                            // If current ToolNode has interrupt turned on, add the ToolNode name to interruptToolNodeNames
                            if (agentInstance.node.interrupt) {
                                interruptToolNodeNames.push(agentInstance.name);
                            }
                        }
                        else if (predecessorAgent.name) {
                            // In the scenario when ToolNode -> LLMNode, bind the tools to LLMNode
                            if (agentInstance.type === 'llm' && predecessorAgent.type === 'tool') {
                                createBindModel(agentInstance, predecessorAgent);
                            }
                            // Add edge to graph ONLY when predecessor is not an Interrupted Agent
                            if (!predecessorAgent.agentInterruptToolNode) {
                                edges.push(predecessorAgent.name);
                            }
                        }
                    }
                    // Edges can be multiple, in the case of parallel node executions
                    if (edges.length > 1) {
                        //@ts-ignore
                        seqGraph.addEdge(edges, agentInstance.name);
                    }
                    else if (edges.length === 1) {
                        //@ts-ignore
                        seqGraph.addEdge(...edges, agentInstance.name);
                    }
                }
            }
            catch (e) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error initialize agent nodes - ${(0, utils_2.getErrorMessage)(e)}`);
            }
        }
    }
    /*** Add conditional edges to graph for condition nodes ***/
    for (const conditionNodeId in conditionalEdges) {
        const startConditionEdges = reactFlowEdges.filter((edge) => edge.target === conditionNodeId);
        if (!startConditionEdges.length)
            continue;
        for (const startConditionEdge of startConditionEdges) {
            const startConditionNode = reactFlowNodes.find((node) => node.id === startConditionEdge.source);
            if (!startConditionNode)
                continue;
            seqGraph.addConditionalEdges(startConditionNode.data.instance.name, conditionalEdges[conditionNodeId].func, 
            //@ts-ignore
            conditionalEdges[conditionNodeId].nodes);
        }
    }
    /*** Add conditional edges to graph for LLMNode -> ToolNode ***/
    for (const llmSourceNodeId in conditionalToolNodes) {
        const connectedToolNodes = conditionalToolNodes[llmSourceNodeId].toolNodes;
        const sourceNode = conditionalToolNodes[llmSourceNodeId].source;
        const routeMessage = (state) => {
            const messages = state.messages;
            const lastMessage = messages[messages.length - 1];
            if (!lastMessage.tool_calls?.length) {
                return langgraph_1.END;
            }
            for (const toolCall of lastMessage.tool_calls) {
                for (const toolNode of connectedToolNodes) {
                    const tools = toolNode.node?.tools || toolNode.tools;
                    if (tools.some((tool) => tool.name === toolCall.name)) {
                        return toolNode.name;
                    }
                }
            }
            return langgraph_1.END;
        };
        seqGraph.addConditionalEdges(
        //@ts-ignore
        sourceNode.name, routeMessage);
    }
    ;
    seqGraph.signal = options.signal;
    /*** Get memory ***/
    const startNode = reactFlowNodes.find((node) => node.data.name === 'seqStart');
    let memory = startNode?.data.instance?.checkpointMemory;
    try {
        const graph = seqGraph.compile({
            checkpointer: memory,
            interruptBefore: interruptToolNodeNames
        });
        const loggerHandler = new accelance_components_1.ConsoleCallbackHandler(logger_1.default, options?.orgId);
        const callbacks = await (0, accelance_components_1.additionalCallbacks)(flowNodeData, options);
        const config = { configurable: { thread_id: threadId }, bindModel };
        let prependMessages = [];
        // Only append in the first message
        if (prependHistoryMessages.length === chatHistory.length) {
            for (const message of prependHistoryMessages) {
                if (message.role === 'apiMessage' || message.type === 'apiMessage') {
                    prependMessages.push(new messages_1.AIMessage({
                        content: message.message || message.content || ''
                    }));
                }
                else if (message.role === 'userMessage' || message.type === 'userMessage') {
                    prependMessages.push(new messages_1.HumanMessage({
                        content: message.message || message.content || ''
                    }));
                }
            }
        }
        const finalQuestion = uploadedFilesContent ? `${uploadedFilesContent}\n\n${question}` : question;
        let humanMsg = {
            messages: [...prependMessages, new messages_1.HumanMessage({ content: finalQuestion })]
        };
        if (action && action.mapping && question === action.mapping.approve) {
            humanMsg = null;
        }
        else if (action && action.mapping && question === action.mapping.reject) {
            humanMsg = {
                messages: action.mapping.toolCalls.map((toolCall) => {
                    return new messages_1.ToolMessage({
                        name: toolCall.name,
                        content: `Tool ${toolCall.name} call denied by user. Acknowledge that, and DONT perform further actions. Only ask if user have other questions`,
                        tool_call_id: toolCall.id,
                        additional_kwargs: { toolCallsDenied: true }
                    });
                })
            };
        }
        return await graph.stream(humanMsg, {
            callbacks: [loggerHandler, ...callbacks],
            configurable: config
        });
    }
    catch (e) {
        logger_1.default.error(`[${options.orgId}]: Error compile graph`, e);
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error compile graph - ${(0, utils_2.getErrorMessage)(e)}`);
    }
};
const getSortedDepthNodes = (depthQueue) => {
    // Step 1: Convert the object into an array of [key, value] pairs and sort them by the value
    const sortedEntries = Object.entries(depthQueue).sort((a, b) => a[1] - b[1]);
    // Step 2: Group keys by their depth values
    const groupedByDepth = {};
    sortedEntries.forEach(([key, value]) => {
        if (!groupedByDepth[value]) {
            groupedByDepth[value] = [];
        }
        groupedByDepth[value].push(key);
    });
    // Step 3: Create the final sorted array with grouped keys
    const sortedArray = [];
    Object.keys(groupedByDepth)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .forEach((depth) => {
        const items = groupedByDepth[parseInt(depth)];
        sortedArray.push(...items);
    });
    return sortedArray.flat();
};
//# sourceMappingURL=buildAgentGraph.js.map