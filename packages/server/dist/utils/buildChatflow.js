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
exports.generateTTSForResponseStream = exports.shouldAutoPlayTTS = exports.utilBuildChatflow = exports.executeFlow = void 0;
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
const lodash_1 = require("lodash");
const accelance_components_1 = require("accelance-components");
const http_status_codes_1 = require("http-status-codes");
const Interface_1 = require("../Interface");
const internalAccelanceError_1 = require("../errors/internalAccelanceError");
const _1 = require(".");
const ChatFlow_1 = require("../database/entities/ChatFlow");
const ChatMessage_1 = require("../database/entities/ChatMessage");
const Variable_1 = require("../database/entities/Variable");
const getRunningExpressApp_1 = require("../utils/getRunningExpressApp");
const utils_1 = require("../utils");
const fileValidation_1 = require("./fileValidation");
const validateKey_1 = require("./validateKey");
const logger_1 = __importDefault(require("./logger"));
const addChatMesage_1 = require("./addChatMesage");
const quotaUsage_1 = require("./quotaUsage");
const buildAgentGraph_1 = require("./buildAgentGraph");
const utils_2 = require("../errors/utils");
const Interface_Metrics_1 = require("../Interface.Metrics");
const ControllerServiceUtils_1 = require("../enterprise/utils/ControllerServiceUtils");
const constants_1 = require("./constants");
const buildAgentflow_1 = require("./buildAgentflow");
const workspace_entity_1 = require("../enterprise/database/entities/workspace.entity");
const organization_entity_1 = require("../enterprise/database/entities/organization.entity");
const organizationAnalytics_1 = require("../enterprise/utils/organizationAnalytics");
const preflightGuardrails_1 = require("./preflightGuardrails");
const shouldAutoPlayTTS = (textToSpeechConfig) => {
    if (!textToSpeechConfig)
        return false;
    try {
        const config = typeof textToSpeechConfig === 'string' ? JSON.parse(textToSpeechConfig) : textToSpeechConfig;
        for (const providerKey in config) {
            const provider = config[providerKey];
            if (provider && provider.status === true && provider.autoPlay === true) {
                return true;
            }
        }
        return false;
    }
    catch (error) {
        logger_1.default.error(`Error parsing textToSpeechConfig: ${(0, utils_2.getErrorMessage)(error)}`);
        return false;
    }
};
exports.shouldAutoPlayTTS = shouldAutoPlayTTS;
const generateTTSForResponseStream = async (responseText, textToSpeechConfig, options, chatId, chatMessageId, sseStreamer, abortController) => {
    try {
        if (!textToSpeechConfig)
            return;
        const config = typeof textToSpeechConfig === 'string' ? JSON.parse(textToSpeechConfig) : textToSpeechConfig;
        let activeProviderConfig = null;
        for (const providerKey in config) {
            const provider = config[providerKey];
            if (provider && provider.status === true) {
                activeProviderConfig = {
                    name: providerKey,
                    credentialId: provider.credentialId,
                    voice: provider.voice,
                    model: provider.model
                };
                break;
            }
        }
        if (!activeProviderConfig)
            return;
        await (0, accelance_components_1.convertTextToSpeechStream)(responseText, activeProviderConfig, options, abortController || new AbortController(), (format) => {
            sseStreamer.streamTTSStartEvent(chatId, chatMessageId, format);
        }, (chunk) => {
            const audioBase64 = chunk.toString('base64');
            sseStreamer.streamTTSDataEvent(chatId, chatMessageId, audioBase64);
        }, () => {
            sseStreamer.streamTTSEndEvent(chatId, chatMessageId);
        });
    }
    catch (error) {
        logger_1.default.error(`[server]: TTS streaming failed: ${(0, utils_2.getErrorMessage)(error)}`);
        sseStreamer.streamTTSEndEvent(chatId, chatMessageId);
    }
};
exports.generateTTSForResponseStream = generateTTSForResponseStream;
const initEndingNode = async ({ endingNodeIds, componentNodes, reactFlowNodes, incomingInput, flowConfig, uploadedFilesContent, availableVariables, apiOverrideStatus, nodeOverrides, variableOverrides }) => {
    const question = incomingInput.question;
    const chatHistory = flowConfig.chatHistory;
    const sessionId = flowConfig.sessionId;
    const nodeToExecute = endingNodeIds.length === 1
        ? reactFlowNodes.find((node) => endingNodeIds[0] === node.id)
        : reactFlowNodes[reactFlowNodes.length - 1];
    if (!nodeToExecute) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Node not found`);
    }
    if (incomingInput.overrideConfig && apiOverrideStatus) {
        nodeToExecute.data = (0, utils_1.replaceInputsWithConfig)(nodeToExecute.data, incomingInput.overrideConfig, nodeOverrides, variableOverrides);
    }
    const reactFlowNodeData = await (0, utils_1.resolveVariables)(nodeToExecute.data, reactFlowNodes, question, chatHistory, flowConfig, uploadedFilesContent, availableVariables, variableOverrides);
    logger_1.default.debug(`[server]: Running ${reactFlowNodeData.label} (${reactFlowNodeData.id})`);
    const nodeInstanceFilePath = componentNodes[reactFlowNodeData.name].filePath;
    const nodeModule = await Promise.resolve(`${nodeInstanceFilePath}`).then(s => __importStar(require(s)));
    const nodeInstance = new nodeModule.nodeClass({ sessionId });
    return { endingNodeData: reactFlowNodeData, endingNodeInstance: nodeInstance };
};
/*
 * Get chat history from memory node
 * This is used to fill in the {{chat_history}} variable if it is used in the Format Prompt Value
 */
const getChatHistory = async ({ endingNodes, nodes, chatflowid, appDataSource, componentNodes, incomingInput, chatId, isInternal, isAgentFlow }) => {
    const prependMessages = incomingInput.history ?? [];
    let chatHistory = [];
    if (isAgentFlow) {
        const startNode = nodes.find((node) => node.data.name === 'seqStart');
        if (!startNode?.data?.inputs?.agentMemory)
            return prependMessages;
        const memoryNodeId = startNode.data.inputs.agentMemory.split('.')[0].replace('{{', '');
        const memoryNode = nodes.find((node) => node.data.id === memoryNodeId);
        if (memoryNode) {
            chatHistory = await (0, utils_1.getSessionChatHistory)(chatflowid, (0, utils_1.getMemorySessionId)(memoryNode, incomingInput, chatId, isInternal), memoryNode, componentNodes, appDataSource, _1.databaseEntities, logger_1.default, prependMessages);
        }
        return chatHistory;
    }
    /* In case there are multiple ending nodes, get the memory from the last available ending node
     * By right, in each flow, there should only be one memory node
     */
    for (const endingNode of endingNodes) {
        const endingNodeData = endingNode.data;
        if (!endingNodeData.inputs?.memory)
            continue;
        const memoryNodeId = endingNodeData.inputs?.memory.split('.')[0].replace('{{', '');
        const memoryNode = nodes.find((node) => node.data.id === memoryNodeId);
        if (!memoryNode)
            continue;
        chatHistory = await (0, utils_1.getSessionChatHistory)(chatflowid, (0, utils_1.getMemorySessionId)(memoryNode, incomingInput, chatId, isInternal), memoryNode, componentNodes, appDataSource, _1.databaseEntities, logger_1.default, prependMessages);
    }
    return chatHistory;
};
/**
 * Show output of setVariable nodes
 * @param reactFlowNodes
 * @returns {Record<string, unknown>}
 */
const getSetVariableNodesOutput = (reactFlowNodes) => {
    const flowVariables = {};
    for (const node of reactFlowNodes) {
        if (node.data.name === 'setVariable' && (node.data.inputs?.showOutput === true || node.data.inputs?.showOutput === 'true')) {
            const outputResult = node.data.instance;
            const variableKey = node.data.inputs?.variableName;
            flowVariables[variableKey] = outputResult;
        }
    }
    return flowVariables;
};
/*
 * Function to traverse the flow graph and execute the nodes
 */
const executeFlow = async ({ componentNodes, incomingInput, chatflow, chatId, isEvaluation, evaluationRunId, appDataSource, telemetry, cachePool, usageCacheManager, sseStreamer, baseURL, isInternal, files, signal, isTool, chatType, orgId, workspaceId, subscriptionId, productId, userId }) => {
    // Ensure incomingInput has all required properties with default values
    incomingInput = {
        history: [],
        streaming: false,
        ...incomingInput
    };
    let question = incomingInput.question || ''; // Ensure question is never undefined
    let overrideConfig = incomingInput.overrideConfig ?? {};
    const uploads = incomingInput.uploads;
    const prependMessages = incomingInput.history ?? [];
    const streaming = incomingInput.streaming ?? false;
    const userMessageDateTime = new Date();
    const chatflowid = chatflow.id;
    /* Process file uploads from the chat
     * - Images
     * - Files
     * - Audio
     */
    let fileUploads = [];
    let uploadedFilesContent = '';
    if (uploads) {
        fileUploads = uploads;
        for (let i = 0; i < fileUploads.length; i += 1) {
            await (0, quotaUsage_1.checkStorage)(orgId, subscriptionId, usageCacheManager);
            const upload = fileUploads[i];
            // if upload in an image, a rag file, or audio
            if ((upload.type === 'file' || upload.type === 'file:rag' || upload.type === 'audio') && upload.data) {
                const filename = upload.name;
                const splitDataURI = upload.data.split(',');
                const bf = Buffer.from(splitDataURI.pop() || '', 'base64');
                const mime = splitDataURI[0].split(':')[1].split(';')[0];
                // Validate file extension, MIME type, and content to prevent security vulnerabilities
                (0, fileValidation_1.validateFileMimeTypeAndExtensionMatch)(filename, mime);
                const { totalSize } = await (0, accelance_components_1.addSingleFileToStorage)(mime, bf, filename, orgId, chatflowid, chatId);
                await (0, quotaUsage_1.updateStorageUsage)(orgId, workspaceId, totalSize, usageCacheManager);
                upload.type = 'stored-file';
                // Omit upload.data since we don't store the content in database
                fileUploads[i] = (0, lodash_1.omit)(upload, ['data']);
            }
            if (upload.type === 'url' && upload.data) {
                const filename = upload.name;
                const urlData = upload.data;
                fileUploads[i] = { data: urlData, name: filename, type: 'url', mime: upload.mime ?? 'image/png' };
            }
            // Run Speech to Text conversion
            if (upload.mime === 'audio/webm' || upload.mime === 'audio/mp4' || upload.mime === 'audio/ogg') {
                logger_1.default.debug(`[server]: [${orgId}]: Attempting a speech to text conversion...`);
                let speechToTextConfig = {};
                if (chatflow.speechToText) {
                    const speechToTextProviders = JSON.parse(chatflow.speechToText);
                    for (const provider in speechToTextProviders) {
                        const providerObj = speechToTextProviders[provider];
                        if (providerObj.status) {
                            speechToTextConfig = providerObj;
                            speechToTextConfig['name'] = provider;
                            break;
                        }
                    }
                }
                if (speechToTextConfig) {
                    const options = {
                        orgId,
                        chatId,
                        chatflowid,
                        appDataSource,
                        databaseEntities: _1.databaseEntities
                    };
                    const speechToTextResult = await (0, accelance_components_1.convertSpeechToText)(upload, speechToTextConfig, options);
                    logger_1.default.debug(`[server]: [${orgId}]: Speech to text result: ${speechToTextResult}`);
                    if (speechToTextResult) {
                        incomingInput.question = speechToTextResult;
                        question = speechToTextResult;
                    }
                }
            }
            if (upload.type === 'file:full' && upload.data) {
                upload.type = 'stored-file:full';
                // Omit upload.data since we don't store the content in database
                uploadedFilesContent += `<doc name='${upload.name}'>${upload.data}</doc>\n\n`;
                fileUploads[i] = (0, lodash_1.omit)(upload, ['data']);
            }
        }
    }
    // Process form data body with files
    if (files?.length) {
        overrideConfig = { ...incomingInput };
        for (const file of files) {
            await (0, quotaUsage_1.checkStorage)(orgId, subscriptionId, usageCacheManager);
            const fileNames = [];
            const fileBuffer = await (0, accelance_components_1.getFileFromUpload)(file.path ?? file.key);
            // Address file name with special characters: https://github.com/expressjs/multer/issues/1104
            file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
            // Validate file extension, MIME type, and content to prevent security vulnerabilities
            (0, fileValidation_1.validateFileMimeTypeAndExtensionMatch)(file.originalname, file.mimetype);
            const { path: storagePath, totalSize } = await (0, accelance_components_1.addArrayFilesToStorage)(file.mimetype, fileBuffer, file.originalname, fileNames, orgId, chatflowid);
            await (0, quotaUsage_1.updateStorageUsage)(orgId, workspaceId, totalSize, usageCacheManager);
            const fileInputFieldFromMimeType = (0, accelance_components_1.mapMimeTypeToInputField)(file.mimetype);
            const fileExtension = path.extname(file.originalname);
            const fileInputFieldFromExt = (0, accelance_components_1.mapExtToInputField)(fileExtension);
            let fileInputField = 'txtFile';
            if (fileInputFieldFromExt !== 'txtFile') {
                fileInputField = fileInputFieldFromExt;
            }
            else if (fileInputFieldFromMimeType !== 'txtFile') {
                fileInputField = fileInputFieldFromExt;
            }
            if (overrideConfig[fileInputField]) {
                const existingFileInputField = overrideConfig[fileInputField].replace('FILE-STORAGE::', '');
                const existingFileInputFieldArray = JSON.parse(existingFileInputField);
                const newFileInputField = storagePath.replace('FILE-STORAGE::', '');
                const newFileInputFieldArray = JSON.parse(newFileInputField);
                const updatedFieldArray = existingFileInputFieldArray.concat(newFileInputFieldArray);
                overrideConfig[fileInputField] = `FILE-STORAGE::${JSON.stringify(updatedFieldArray)}`;
            }
            else {
                overrideConfig[fileInputField] = storagePath;
            }
            await (0, accelance_components_1.removeSpecificFileFromUpload)(file.path ?? file.key);
        }
        if (overrideConfig.vars && typeof overrideConfig.vars === 'string') {
            overrideConfig.vars = JSON.parse(overrideConfig.vars);
        }
        incomingInput = {
            ...incomingInput,
            overrideConfig,
            chatId
        };
    }
    const isAgentFlowV2 = chatflow.type === 'AGENTFLOW';
    if (isAgentFlowV2) {
        return (0, buildAgentflow_1.executeAgentFlow)({
            componentNodes,
            incomingInput,
            chatflow,
            chatId,
            evaluationRunId,
            appDataSource,
            telemetry,
            cachePool,
            usageCacheManager,
            sseStreamer,
            baseURL,
            isInternal,
            chatType,
            uploadedFilesContent,
            fileUploads,
            signal,
            isTool,
            orgId,
            workspaceId,
            subscriptionId,
            productId,
            userId
        });
    }
    /*** Get chatflows and prepare data  ***/
    const flowData = chatflow.flowData;
    const parsedFlowData = JSON.parse(flowData);
    const nodes = parsedFlowData.nodes;
    const edges = parsedFlowData.edges;
    const apiMessageId = (0, uuid_1.v4)();
    /*** Get session ID ***/
    const memoryNode = (0, utils_1.findMemoryNode)(nodes, edges);
    const memoryType = memoryNode?.data.label || '';
    let sessionId = (0, utils_1.getMemorySessionId)(memoryNode, incomingInput, chatId, isInternal);
    /*** Get Ending Node with Directed Graph  ***/
    const { graph, nodeDependencies } = (0, utils_1.constructGraphs)(nodes, edges);
    const directedGraph = graph;
    const endingNodes = (0, utils_1.getEndingNodes)(nodeDependencies, directedGraph, nodes);
    /*** Get Starting Nodes with Reversed Graph ***/
    const constructedObj = (0, utils_1.constructGraphs)(nodes, edges, { isReversed: true });
    const nonDirectedGraph = constructedObj.graph;
    let startingNodeIds = [];
    let depthQueue = {};
    const endingNodeIds = endingNodes.map((n) => n.id);
    for (const endingNodeId of endingNodeIds) {
        const resx = (0, utils_1.getStartingNodes)(nonDirectedGraph, endingNodeId);
        startingNodeIds.push(...resx.startingNodeIds);
        depthQueue = Object.assign(depthQueue, resx.depthQueue);
    }
    startingNodeIds = [...new Set(startingNodeIds)];
    const isAgentFlow = endingNodes.filter((node) => node.data.category === 'Multi Agents' || node.data.category === 'Sequential Agents').length > 0;
    /*** Get Chat History ***/
    const chatHistory = await getChatHistory({
        endingNodes,
        nodes,
        chatflowid,
        appDataSource,
        componentNodes,
        incomingInput,
        chatId,
        isInternal,
        isAgentFlow
    });
    /*** Get API Config ***/
    const availableVariables = await appDataSource.getRepository(Variable_1.Variable).findBy((0, ControllerServiceUtils_1.getWorkspaceSearchOptions)(workspaceId));
    const { nodeOverrides, variableOverrides, apiOverrideStatus } = (0, utils_1.getAPIOverrideConfig)(chatflow);
    const flowConfig = {
        chatflowid,
        chatflowId: chatflow.id,
        chatId,
        sessionId,
        chatHistory,
        apiMessageId
    };
    logger_1.default.debug(`[server]: [${orgId}]: Start building flow ${chatflowid}`);
    /*** BFS to traverse from Starting Nodes to Ending Node ***/
    const reactFlowNodes = await (0, utils_1.buildFlow)({
        startingNodeIds,
        reactFlowNodes: nodes,
        reactFlowEdges: edges,
        apiMessageId,
        graph,
        depthQueue,
        componentNodes,
        question,
        uploadedFilesContent,
        chatHistory,
        chatId,
        sessionId,
        chatflowid,
        appDataSource,
        overrideConfig,
        apiOverrideStatus,
        nodeOverrides,
        availableVariables,
        variableOverrides,
        cachePool,
        usageCacheManager,
        isUpsert: false,
        uploads,
        baseURL,
        orgId,
        workspaceId,
        subscriptionId,
        userId,
        updateStorageUsage: quotaUsage_1.updateStorageUsage,
        checkStorage: quotaUsage_1.checkStorage
    });
    const setVariableNodesOutput = getSetVariableNodesOutput(reactFlowNodes);
    if (isAgentFlow) {
        const agentflow = chatflow;
        const streamResults = await (0, buildAgentGraph_1.buildAgentGraph)({
            agentflow,
            flowConfig,
            incomingInput,
            nodes,
            edges,
            initializedNodes: reactFlowNodes,
            endingNodeIds,
            startingNodeIds,
            depthQueue,
            chatHistory,
            uploadedFilesContent,
            appDataSource,
            componentNodes,
            sseStreamer,
            shouldStreamResponse: true, // agentflow is always streamed
            cachePool,
            baseURL,
            signal,
            orgId,
            workspaceId,
            userId
        });
        if (streamResults) {
            const { finalResult, finalAction, sourceDocuments, artifacts, usedTools, agentReasoning } = streamResults;
            const userMessage = {
                role: 'userMessage',
                content: incomingInput.question,
                chatflowid: agentflow.id,
                chatType: chatType || (isEvaluation ? Interface_1.ChatType.EVALUATION : isInternal ? Interface_1.ChatType.INTERNAL : Interface_1.ChatType.EXTERNAL),
                chatId,
                memoryType,
                sessionId,
                createdDate: userMessageDateTime,
                fileUploads: uploads ? JSON.stringify(fileUploads) : undefined,
                leadEmail: incomingInput.leadEmail
            };
            await (0, addChatMesage_1.utilAddChatMessage)(userMessage, appDataSource);
            const apiMessage = {
                id: apiMessageId,
                role: 'apiMessage',
                content: finalResult,
                chatflowid: agentflow.id,
                chatType: chatType || (isEvaluation ? Interface_1.ChatType.EVALUATION : isInternal ? Interface_1.ChatType.INTERNAL : Interface_1.ChatType.EXTERNAL),
                chatId,
                memoryType,
                sessionId
            };
            if (sourceDocuments?.length)
                apiMessage.sourceDocuments = JSON.stringify(sourceDocuments);
            if (artifacts?.length)
                apiMessage.artifacts = JSON.stringify(artifacts);
            if (usedTools?.length)
                apiMessage.usedTools = JSON.stringify(usedTools);
            if (agentReasoning?.length)
                apiMessage.agentReasoning = JSON.stringify(agentReasoning);
            if (finalAction && Object.keys(finalAction).length)
                apiMessage.action = JSON.stringify(finalAction);
            if (agentflow.followUpPrompts) {
                const followUpPromptsConfig = JSON.parse(agentflow.followUpPrompts);
                const generatedFollowUpPrompts = await (0, accelance_components_1.generateFollowUpPrompts)(followUpPromptsConfig, apiMessage.content, {
                    chatId,
                    chatflowid: agentflow.id,
                    appDataSource,
                    databaseEntities: _1.databaseEntities
                });
                if (generatedFollowUpPrompts?.questions) {
                    apiMessage.followUpPrompts = JSON.stringify(generatedFollowUpPrompts.questions);
                }
            }
            const chatMessage = await (0, addChatMesage_1.utilAddChatMessage)(apiMessage, appDataSource);
            await telemetry.sendTelemetry('agentflow_prediction_sent', {
                version: await (0, utils_1.getAppVersion)(),
                agentflowId: agentflow.id,
                chatId,
                type: isEvaluation ? Interface_1.ChatType.EVALUATION : isInternal ? Interface_1.ChatType.INTERNAL : Interface_1.ChatType.EXTERNAL,
                flowGraph: (0, utils_1.getTelemetryFlowObj)(nodes, edges)
            }, orgId);
            // Find the previous chat message with the same action id and remove the action
            if (incomingInput.action && Object.keys(incomingInput.action).length) {
                let query = await appDataSource
                    .getRepository(ChatMessage_1.ChatMessage)
                    .createQueryBuilder('chat_message')
                    .where('chat_message.chatId = :chatId', { chatId })
                    .orWhere('chat_message.sessionId = :sessionId', { sessionId })
                    .orderBy('chat_message.createdDate', 'DESC')
                    .getMany();
                for (const result of query) {
                    if (result.action) {
                        try {
                            const action = JSON.parse(result.action);
                            if (action.id === incomingInput.action.id) {
                                const newChatMessage = new ChatMessage_1.ChatMessage();
                                Object.assign(newChatMessage, result);
                                newChatMessage.action = null;
                                const cm = await appDataSource.getRepository(ChatMessage_1.ChatMessage).create(newChatMessage);
                                await appDataSource.getRepository(ChatMessage_1.ChatMessage).save(cm);
                                break;
                            }
                        }
                        catch (e) {
                            // error converting action to JSON
                        }
                    }
                }
            }
            // Prepare response
            let result = {};
            result.text = finalResult;
            result.question = incomingInput.question;
            result.chatId = chatId;
            result.chatMessageId = chatMessage?.id;
            if (sessionId)
                result.sessionId = sessionId;
            if (memoryType)
                result.memoryType = memoryType;
            if (agentReasoning?.length)
                result.agentReasoning = agentReasoning;
            if (finalAction && Object.keys(finalAction).length)
                result.action = finalAction;
            if (Object.keys(setVariableNodesOutput).length)
                result.flowVariables = setVariableNodesOutput;
            result.followUpPrompts = JSON.stringify(apiMessage.followUpPrompts);
            return result;
        }
        return undefined;
    }
    else {
        let chatflowConfig = {};
        if (chatflow.chatbotConfig) {
            chatflowConfig = JSON.parse(chatflow.chatbotConfig);
        }
        let isStreamValid = false;
        /* Check for post-processing settings, if available isStreamValid is always false */
        if (chatflowConfig?.postProcessing?.enabled === true) {
            isStreamValid = false;
        }
        else {
            isStreamValid = await checkIfStreamValid(endingNodes, nodes, streaming);
        }
        /*** Find the last node to execute ***/
        const { endingNodeData, endingNodeInstance } = await initEndingNode({
            endingNodeIds,
            componentNodes,
            reactFlowNodes,
            incomingInput,
            flowConfig,
            uploadedFilesContent,
            availableVariables,
            apiOverrideStatus,
            nodeOverrides,
            variableOverrides
        });
        /*** If user uploaded files from chat, prepend the content of the files ***/
        const finalQuestion = uploadedFilesContent ? `${uploadedFilesContent}\n\n${incomingInput.question}` : incomingInput.question;
        /*** Prepare run params ***/
        const runParams = {
            orgId,
            workspaceId,
            subscriptionId,
            chatId,
            chatflowid,
            apiMessageId,
            logger: logger_1.default,
            appDataSource,
            databaseEntities: _1.databaseEntities,
            usageCacheManager,
            analytic: chatflow.analytic,
            uploads,
            prependMessages,
            ...(isStreamValid && { sseStreamer, shouldStreamResponse: isStreamValid }),
            evaluationRunId,
            updateStorageUsage: quotaUsage_1.updateStorageUsage,
            checkStorage: quotaUsage_1.checkStorage
        };
        /*** Run the ending node ***/
        let result = await endingNodeInstance.run(endingNodeData, finalQuestion, runParams);
        result = typeof result === 'string' ? { text: result } : result;
        /*** Retrieve threadId from OpenAI Assistant if exists ***/
        if (typeof result === 'object' && result.assistant) {
            sessionId = result.assistant.threadId;
        }
        const userMessage = {
            role: 'userMessage',
            content: question,
            chatflowid,
            chatType: chatType || (isEvaluation ? Interface_1.ChatType.EVALUATION : isInternal ? Interface_1.ChatType.INTERNAL : Interface_1.ChatType.EXTERNAL),
            chatId,
            memoryType,
            sessionId,
            createdDate: userMessageDateTime,
            fileUploads: uploads ? JSON.stringify(fileUploads) : undefined,
            leadEmail: incomingInput.leadEmail
        };
        await (0, addChatMesage_1.utilAddChatMessage)(userMessage, appDataSource);
        let resultText = '';
        if (result.text) {
            resultText = result.text;
            /* Check for post-processing settings */
            if (chatflowConfig?.postProcessing?.enabled === true) {
                try {
                    const postProcessingFunction = JSON.parse(chatflowConfig?.postProcessing?.customFunction);
                    const nodeInstanceFilePath = componentNodes['customFunction'].filePath;
                    const nodeModule = await Promise.resolve(`${nodeInstanceFilePath}`).then(s => __importStar(require(s)));
                    //set the outputs.output to EndingNode to prevent json escaping of content...
                    const nodeData = {
                        inputs: { javascriptFunction: postProcessingFunction },
                        outputs: { output: 'output' }
                    };
                    const options = {
                        chatflowid: chatflow.id,
                        sessionId,
                        chatId,
                        input: question,
                        postProcessing: {
                            rawOutput: resultText,
                            chatHistory: (0, lodash_1.cloneDeep)(chatHistory),
                            sourceDocuments: result?.sourceDocuments ? (0, lodash_1.cloneDeep)(result.sourceDocuments) : undefined,
                            usedTools: result?.usedTools ? (0, lodash_1.cloneDeep)(result.usedTools) : undefined,
                            artifacts: result?.artifacts ? (0, lodash_1.cloneDeep)(result.artifacts) : undefined,
                            fileAnnotations: result?.fileAnnotations ? (0, lodash_1.cloneDeep)(result.fileAnnotations) : undefined
                        },
                        appDataSource,
                        databaseEntities: _1.databaseEntities,
                        workspaceId,
                        orgId,
                        logger: logger_1.default
                    };
                    const customFuncNodeInstance = new nodeModule.nodeClass();
                    let moderatedResponse = await customFuncNodeInstance.init(nodeData, question, options);
                    if (typeof moderatedResponse === 'string') {
                        result.text = (0, accelance_components_1.handleEscapeCharacters)(moderatedResponse, true);
                    }
                    else if (typeof moderatedResponse === 'object') {
                        result.text = '```json\n' + JSON.stringify(moderatedResponse, null, 2) + '\n```';
                    }
                    else {
                        result.text = moderatedResponse;
                    }
                    resultText = result.text;
                }
                catch (e) {
                    logger_1.default.log('[server]: Post Processing Error:', e);
                }
            }
        }
        else if (result.json)
            resultText = '```json\n' + JSON.stringify(result.json, null, 2);
        else
            resultText = JSON.stringify(result, null, 2);
        const apiMessage = {
            id: apiMessageId,
            role: 'apiMessage',
            content: resultText,
            chatflowid,
            chatType: chatType || (isEvaluation ? Interface_1.ChatType.EVALUATION : isInternal ? Interface_1.ChatType.INTERNAL : Interface_1.ChatType.EXTERNAL),
            chatId,
            memoryType,
            sessionId
        };
        if (result?.sourceDocuments)
            apiMessage.sourceDocuments = JSON.stringify(result.sourceDocuments);
        if (result?.usedTools)
            apiMessage.usedTools = JSON.stringify(result.usedTools);
        if (result?.fileAnnotations)
            apiMessage.fileAnnotations = JSON.stringify(result.fileAnnotations);
        if (result?.artifacts)
            apiMessage.artifacts = JSON.stringify(result.artifacts);
        if (result?.action)
            apiMessage.action = typeof result.action === 'string' ? result.action : JSON.stringify(result.action);
        if (chatflow.followUpPrompts) {
            const followUpPromptsConfig = JSON.parse(chatflow.followUpPrompts);
            const followUpPrompts = await (0, accelance_components_1.generateFollowUpPrompts)(followUpPromptsConfig, apiMessage.content, {
                chatId,
                chatflowid,
                appDataSource,
                databaseEntities: _1.databaseEntities
            });
            if (followUpPrompts?.questions) {
                apiMessage.followUpPrompts = JSON.stringify(followUpPrompts.questions);
            }
        }
        const chatMessage = await (0, addChatMesage_1.utilAddChatMessage)(apiMessage, appDataSource);
        logger_1.default.debug(`[server]: [${orgId}]: Finished running ${endingNodeData.label} (${endingNodeData.id})`);
        if (evaluationRunId) {
            const metrics = await accelance_components_1.EvaluationRunner.getAndDeleteMetrics(evaluationRunId);
            result.metrics = metrics;
        }
        await telemetry.sendTelemetry('prediction_sent', {
            version: await (0, utils_1.getAppVersion)(),
            chatflowId: chatflowid,
            chatId,
            type: isEvaluation ? Interface_1.ChatType.EVALUATION : isInternal ? Interface_1.ChatType.INTERNAL : Interface_1.ChatType.EXTERNAL,
            flowGraph: (0, utils_1.getTelemetryFlowObj)(nodes, edges),
            productId,
            subscriptionId
        }, orgId);
        /*** Prepare response ***/
        result.question = incomingInput.question; // return the question in the response, this is used when input text is empty but question is in audio format
        result.chatId = chatId;
        result.chatMessageId = chatMessage?.id;
        result.followUpPrompts = JSON.stringify(apiMessage.followUpPrompts);
        result.isStreamValid = isStreamValid;
        if (sessionId)
            result.sessionId = sessionId;
        if (memoryType)
            result.memoryType = memoryType;
        if (Object.keys(setVariableNodesOutput).length)
            result.flowVariables = setVariableNodesOutput;
        if (shouldAutoPlayTTS(chatflow.textToSpeech) && result.text) {
            const options = {
                orgId,
                chatflowid,
                chatId,
                appDataSource,
                databaseEntities: _1.databaseEntities
            };
            await generateTTSForResponseStream(result.text, chatflow.textToSpeech, options, chatId, chatMessage?.id, sseStreamer, signal);
        }
        return result;
    }
};
exports.executeFlow = executeFlow;
/**
 * Function to check if the flow is valid for streaming
 * @param {IReactFlowNode[]} endingNodes
 * @param {IReactFlowNode[]} nodes
 * @param {boolean | string} streaming
 * @returns {boolean}
 */
const checkIfStreamValid = async (endingNodes, nodes, streaming) => {
    // If streaming is undefined, set to false by default
    if (streaming === undefined) {
        streaming = false;
    }
    // Once custom function ending node exists, flow is always unavailable to stream
    const isCustomFunctionEndingNode = endingNodes.some((node) => node.data?.outputs?.output === 'EndingNode');
    if (isCustomFunctionEndingNode)
        return false;
    let isStreamValid = false;
    for (const endingNode of endingNodes) {
        const endingNodeData = endingNode.data || {}; // Ensure endingNodeData is never undefined
        const isEndingNode = endingNodeData?.outputs?.output === 'EndingNode';
        // Once custom function ending node exists, no need to do follow-up checks.
        if (isEndingNode)
            continue;
        if (endingNodeData.outputs &&
            Object.keys(endingNodeData.outputs).length &&
            !Object.values(endingNodeData.outputs ?? {}).includes(endingNodeData.name)) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Output of ${endingNodeData.label} (${endingNodeData.id}) must be ${endingNodeData.label}, can't be an Output Prediction`);
        }
        isStreamValid = (0, utils_1.isFlowValidForStream)(nodes, endingNodeData);
    }
    isStreamValid = (streaming === 'true' || streaming === true) && isStreamValid;
    return isStreamValid;
};
/**
 * Build/Data Preparation for execute function
 * @param {Request} req
 * @param {boolean} isInternal
 */
const utilBuildChatflow = async (req, isInternal = false, chatType) => {
    const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
    const chatflowid = req.params.id;
    // Check if chatflow exists
    const chatflow = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).findOneBy({
        id: chatflowid
    });
    if (!chatflow) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Chatflow ${chatflowid} not found`);
    }
    const isAgentFlow = chatflow.type === 'MULTIAGENT';
    const httpProtocol = req.get('x-forwarded-proto') || req.protocol;
    const baseURL = `${httpProtocol}://${req.get('host')}`;
    const incomingInput = req.body || {}; // Ensure incomingInput is never undefined
    const chatId = incomingInput.chatId ?? incomingInput.overrideConfig?.sessionId ?? (0, uuid_1.v4)();
    const files = req.files || [];
    const abortControllerId = `${chatflow.id}_${chatId}`;
    const isTool = req.get('flowise-tool') === 'true';
    const isEvaluation = req.headers['X-Flowise-Evaluation'] || req.body.evaluation;
    let evaluationRunId = '';
    evaluationRunId = req.body.evaluationRunId;
    if (isEvaluation && chatflow.type !== 'AGENTFLOW' && req.body.evaluationRunId) {
        // this is needed for the collection of token metrics for non-agent flows,
        // for agentflows the execution trace has the info needed
        const newEval = {
            evaluation: {
                status: true,
                evaluationRunId
            }
        };
        chatflow.analytic = JSON.stringify(newEval);
    }
    let organizationId = '';
    try {
        // Validate API Key if its external API request
        if (!isInternal) {
            const isKeyValidated = await (0, validateKey_1.validateFlowAPIKey)(req, chatflow);
            if (!isKeyValidated) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.UNAUTHORIZED, `Unauthorized`);
            }
        }
        // This can be public API, so we can only get orgId from the chatflow
        const chatflowWorkspaceId = chatflow.workspaceId;
        const workspace = await appServer.AppDataSource.getRepository(workspace_entity_1.Workspace).findOneBy({
            id: chatflowWorkspaceId
        });
        if (!workspace) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Workspace ${chatflowWorkspaceId} not found`);
        }
        const workspaceId = workspace.id;
        // Guardrails pre-flight: Topic & Action Scoping / Spend & Token Budgets. Covers every flow
        // type (classic/multi-agent/sequential/AgentFlow V2) since they all route through here first.
        const preflight = await (0, preflightGuardrails_1.checkPreflightGuardrails)({
            appDataSource: appServer.AppDataSource,
            workspaceId,
            chatflowId: chatflow.id,
            chatId,
            question: incomingInput.question || '',
            chatType
        });
        if (preflight.blocked) {
            return preflight.result;
        }
        // Confused-deputy prevention: only trusted (verified-membership) when the target workspace
        // has the guardrail enabled -- see preflightGuardrails.ts for the verification itself.
        const trustedToolCallerUserId = await (0, preflightGuardrails_1.resolveTrustedToolCallerUserId)(appServer.AppDataSource, workspaceId, chatflow.id, isTool, req.get('x-original-user-id'));
        const org = await appServer.AppDataSource.getRepository(organization_entity_1.Organization).findOneBy({
            id: workspace.organizationId
        });
        if (!org) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Organization ${workspace.organizationId} not found`);
        }
        const orgId = org.id;
        organizationId = orgId;
        const subscriptionId = org.subscriptionId;
        const productId = await appServer.identityManager.getProductIdFromSubscription(subscriptionId);
        chatflow.analytic = (0, organizationAnalytics_1.mergeAnalyticsConfig)(org.analytic, chatflow.analytic);
        await (0, quotaUsage_1.checkPredictions)(orgId, subscriptionId, appServer.usageCacheManager);
        const executeData = {
            incomingInput, // Use the defensively created incomingInput variable
            chatflow,
            chatId,
            baseURL,
            isInternal,
            files,
            isEvaluation,
            evaluationRunId,
            appDataSource: appServer.AppDataSource,
            sseStreamer: appServer.sseStreamer,
            telemetry: appServer.telemetry,
            cachePool: appServer.cachePool,
            componentNodes: appServer.nodesPool.componentNodes,
            isTool, // used to disable streaming if incoming request its from ChatflowTool
            chatType,
            usageCacheManager: appServer.usageCacheManager,
            orgId,
            workspaceId,
            subscriptionId,
            productId,
            userId: req.user?.id ?? trustedToolCallerUserId
        };
        if (process.env.MODE === Interface_1.MODE.QUEUE) {
            const predictionQueue = appServer.queueManager.getQueue('prediction');
            const job = await predictionQueue.addJob((0, lodash_1.omit)(executeData, constants_1.OMIT_QUEUE_JOB_DATA));
            logger_1.default.debug(`[server]: [${orgId}/${chatflow.id}/${chatId}]: Job added to queue: ${job.id}`);
            const queueEvents = predictionQueue.getQueueEvents();
            const result = await job.waitUntilFinished(queueEvents);
            appServer.abortControllerPool.remove(abortControllerId);
            if (!result) {
                throw new Error('Job execution failed');
            }
            await (0, quotaUsage_1.updatePredictionsUsage)(orgId, subscriptionId, workspaceId, appServer.usageCacheManager);
            incrementSuccessMetricCounter(appServer.metricsProvider, isInternal, isAgentFlow);
            return result;
        }
        else {
            // Add abort controller to the pool
            const signal = new AbortController();
            appServer.abortControllerPool.add(abortControllerId, signal);
            executeData.signal = signal;
            const result = await (0, exports.executeFlow)(executeData);
            appServer.abortControllerPool.remove(abortControllerId);
            await (0, quotaUsage_1.updatePredictionsUsage)(orgId, subscriptionId, workspaceId, appServer.usageCacheManager);
            incrementSuccessMetricCounter(appServer.metricsProvider, isInternal, isAgentFlow);
            return result;
        }
    }
    catch (e) {
        logger_1.default.error(`[server]:${organizationId}/${chatflow.id}/${chatId} Error:`, e);
        appServer.abortControllerPool.remove(`${chatflow.id}_${chatId}`);
        incrementFailedMetricCounter(appServer.metricsProvider, isInternal, isAgentFlow);
        if (e instanceof internalAccelanceError_1.InternalAccelanceError && e.statusCode === http_status_codes_1.StatusCodes.UNAUTHORIZED) {
            throw e;
        }
        else {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, (0, utils_2.getErrorMessage)(e));
        }
    }
};
exports.utilBuildChatflow = utilBuildChatflow;
/**
 * Increment success metric counter
 * @param {IMetricsProvider} metricsProvider
 * @param {boolean} isInternal
 * @param {boolean} isAgentFlow
 */
const incrementSuccessMetricCounter = (metricsProvider, isInternal, isAgentFlow) => {
    if (isAgentFlow) {
        metricsProvider?.incrementCounter(isInternal ? Interface_Metrics_1.ACCELANCE_METRIC_COUNTERS.AGENTFLOW_PREDICTION_INTERNAL : Interface_Metrics_1.ACCELANCE_METRIC_COUNTERS.AGENTFLOW_PREDICTION_EXTERNAL, { status: Interface_Metrics_1.ACCELANCE_COUNTER_STATUS.SUCCESS });
    }
    else {
        metricsProvider?.incrementCounter(isInternal ? Interface_Metrics_1.ACCELANCE_METRIC_COUNTERS.CHATFLOW_PREDICTION_INTERNAL : Interface_Metrics_1.ACCELANCE_METRIC_COUNTERS.CHATFLOW_PREDICTION_EXTERNAL, { status: Interface_Metrics_1.ACCELANCE_COUNTER_STATUS.SUCCESS });
    }
};
/**
 * Increment failed metric counter
 * @param {IMetricsProvider} metricsProvider
 * @param {boolean} isInternal
 * @param {boolean} isAgentFlow
 */
const incrementFailedMetricCounter = (metricsProvider, isInternal, isAgentFlow) => {
    if (isAgentFlow) {
        metricsProvider?.incrementCounter(isInternal ? Interface_Metrics_1.ACCELANCE_METRIC_COUNTERS.AGENTFLOW_PREDICTION_INTERNAL : Interface_Metrics_1.ACCELANCE_METRIC_COUNTERS.AGENTFLOW_PREDICTION_EXTERNAL, { status: Interface_Metrics_1.ACCELANCE_COUNTER_STATUS.FAILURE });
    }
    else {
        metricsProvider?.incrementCounter(isInternal ? Interface_Metrics_1.ACCELANCE_METRIC_COUNTERS.CHATFLOW_PREDICTION_INTERNAL : Interface_Metrics_1.ACCELANCE_METRIC_COUNTERS.CHATFLOW_PREDICTION_EXTERNAL, { status: Interface_Metrics_1.ACCELANCE_COUNTER_STATUS.FAILURE });
    }
};
//# sourceMappingURL=buildChatflow.js.map