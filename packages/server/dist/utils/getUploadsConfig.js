"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.utilGetUploadsConfig = void 0;
const http_status_codes_1 = require("http-status-codes");
const ChatFlow_1 = require("../database/entities/ChatFlow");
const getRunningExpressApp_1 = require("../utils/getRunningExpressApp");
const internalAccelanceError_1 = require("../errors/internalAccelanceError");
/**
 * Method that checks if uploads are enabled in the chatflow
 * @param {string} chatflowid
 */
const utilGetUploadsConfig = async (chatflowid) => {
    const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
    const chatflow = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).findOneBy({
        id: chatflowid
    });
    if (!chatflow) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Chatflow ${chatflowid} not found`);
    }
    const flowObj = JSON.parse(chatflow.flowData);
    const nodes = flowObj.nodes;
    const edges = flowObj.edges;
    let isSpeechToTextEnabled = false;
    let isImageUploadAllowed = false;
    let isRAGFileUploadAllowed = false;
    /*
     * Check for STT
     */
    if (chatflow.speechToText) {
        const speechToTextProviders = JSON.parse(chatflow.speechToText);
        for (const provider in speechToTextProviders) {
            if (provider !== 'none') {
                const providerObj = speechToTextProviders[provider];
                if (providerObj.status) {
                    isSpeechToTextEnabled = true;
                    break;
                }
            }
        }
    }
    /*
     * Condition for isRAGFileUploadAllowed
     * 1.) vector store with fileUpload = true && connected to a document loader with fileType
     */
    const fileUploadSizeAndTypes = [];
    for (const node of nodes) {
        if (node.data.category === 'Vector Stores' && node.data.inputs?.fileUpload) {
            // Get the connected document loader node fileTypes
            const sourceDocumentEdges = edges.filter((edge) => edge.target === node.id && edge.targetHandle === `${node.id}-input-document-Document`);
            for (const edge of sourceDocumentEdges) {
                const sourceNode = nodes.find((node) => node.id === edge.source);
                if (!sourceNode)
                    continue;
                const fileType = sourceNode.data.inputParams.find((param) => param.type === 'file' && param.fileType)?.fileType;
                if (fileType) {
                    fileUploadSizeAndTypes.push({
                        fileTypes: fileType.split(', '),
                        maxUploadSize: 500
                    });
                    isRAGFileUploadAllowed = true;
                }
            }
            break;
        }
    }
    /*
     * Condition for isImageUploadAllowed
     * 1.) one of the imgUploadAllowedNodes exists
     * 2.) one of the imgUploadLLMNodes exists + allowImageUploads is ON
     */
    const imgUploadSizeAndTypes = [];
    const imgUploadAllowedNodes = [
        'llmChain',
        'conversationChain',
        'reactAgentChat',
        'conversationalAgent',
        'toolAgent',
        'supervisor',
        'seqStart'
    ];
    const isAgentflow = nodes.some((node) => node.data.category === 'Agent Flows');
    if (isAgentflow) {
        // check through all the nodes and check if any of the nodes data inputs agentModelConfig or llmModelConfig or conditionAgentModelConfig has allowImageUploads
        nodes.forEach((node) => {
            if (node.data.category === 'Agent Flows') {
                if (node.data.inputs?.agentModelConfig?.allowImageUploads ||
                    node.data.inputs?.llmModelConfig?.allowImageUploads ||
                    node.data.inputs?.conditionAgentModelConfig?.allowImageUploads) {
                    imgUploadSizeAndTypes.push({
                        fileTypes: 'image/gif;image/jpeg;image/png;image/webp;'.split(';'),
                        maxUploadSize: 5
                    });
                    isImageUploadAllowed = true;
                }
            }
        });
    }
    else {
        if (nodes.some((node) => imgUploadAllowedNodes.includes(node.data.name))) {
            nodes.forEach((node) => {
                const data = node.data;
                if (data.category === 'Chat Models' && data.inputs?.['allowImageUploads'] === true) {
                    // TODO: for now the maxUploadSize is hardcoded to 5MB, we need to add it to the node properties
                    node.data.inputParams.map((param) => {
                        if (param.name === 'allowImageUploads' && node.data.inputs?.['allowImageUploads']) {
                            imgUploadSizeAndTypes.push({
                                fileTypes: 'image/gif;image/jpeg;image/png;image/webp;'.split(';'),
                                maxUploadSize: 5
                            });
                            isImageUploadAllowed = true;
                        }
                    });
                }
            });
        }
    }
    return {
        isSpeechToTextEnabled,
        isImageUploadAllowed,
        isRAGFileUploadAllowed,
        imgUploadSizeAndTypes,
        fileUploadSizeAndTypes
    };
};
exports.utilGetUploadsConfig = utilGetUploadsConfig;
//# sourceMappingURL=getUploadsConfig.js.map