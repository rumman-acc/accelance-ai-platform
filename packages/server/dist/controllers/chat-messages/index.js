"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Interface_1 = require("../../Interface");
const chatflows_1 = __importDefault(require("../../services/chatflows"));
const chat_messages_1 = __importDefault(require("../../services/chat-messages"));
const utils_1 = require("../../utils");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const typeorm_1 = require("typeorm");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const http_status_codes_1 = require("http-status-codes");
const getChatMessage_1 = require("../../utils/getChatMessage");
const pagination_1 = require("../../utils/pagination");
const getFeedbackTypeFilters = (_feedbackTypeFilters) => {
    try {
        let feedbackTypeFilters;
        const feedbackTypeFilterArray = JSON.parse(JSON.stringify(_feedbackTypeFilters));
        if (feedbackTypeFilterArray.includes(Interface_1.ChatMessageRatingType.THUMBS_UP) &&
            feedbackTypeFilterArray.includes(Interface_1.ChatMessageRatingType.THUMBS_DOWN)) {
            feedbackTypeFilters = [Interface_1.ChatMessageRatingType.THUMBS_UP, Interface_1.ChatMessageRatingType.THUMBS_DOWN];
        }
        else if (feedbackTypeFilterArray.includes(Interface_1.ChatMessageRatingType.THUMBS_UP)) {
            feedbackTypeFilters = [Interface_1.ChatMessageRatingType.THUMBS_UP];
        }
        else if (feedbackTypeFilterArray.includes(Interface_1.ChatMessageRatingType.THUMBS_DOWN)) {
            feedbackTypeFilters = [Interface_1.ChatMessageRatingType.THUMBS_DOWN];
        }
        else {
            feedbackTypeFilters = undefined;
        }
        return feedbackTypeFilters;
    }
    catch (e) {
        return _feedbackTypeFilters;
    }
};
const createChatMessage = async (req, res, next) => {
    try {
        if (!req.body) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, 'Error: chatMessagesController.createChatMessage - request body not provided!');
        }
        const apiResponse = await chat_messages_1.default.createChatMessage(req.body);
        return res.json(parseAPIResponse(apiResponse));
    }
    catch (error) {
        next(error);
    }
};
const getAllChatMessages = async (req, res, next) => {
    try {
        const _chatTypes = req.query?.chatType;
        let chatTypes;
        if (_chatTypes) {
            try {
                if (Array.isArray(_chatTypes)) {
                    chatTypes = _chatTypes;
                }
                else {
                    chatTypes = JSON.parse(_chatTypes);
                }
            }
            catch (e) {
                chatTypes = [_chatTypes];
            }
        }
        const activeWorkspaceId = req.user?.activeWorkspaceId;
        const sortOrder = req.query?.order;
        const chatId = req.query?.chatId;
        const memoryType = req.query?.memoryType;
        const sessionId = req.query?.sessionId;
        const messageId = req.query?.messageId;
        const startDate = req.query?.startDate;
        const endDate = req.query?.endDate;
        const feedback = req.query?.feedback;
        const { page, limit } = (0, pagination_1.getPageAndLimitParams)(req);
        let feedbackTypeFilters = req.query?.feedbackType;
        if (feedbackTypeFilters) {
            feedbackTypeFilters = getFeedbackTypeFilters(feedbackTypeFilters);
        }
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: chatMessageController.getAllChatMessages - id not provided!`);
        }
        const apiResponse = await chat_messages_1.default.getAllChatMessages(req.params.id, chatTypes, sortOrder, chatId, memoryType, sessionId, startDate, endDate, messageId, feedback, feedbackTypeFilters, activeWorkspaceId, page, limit);
        return res.json(parseAPIResponse(apiResponse));
    }
    catch (error) {
        next(error);
    }
};
const getAllInternalChatMessages = async (req, res, next) => {
    try {
        const activeWorkspaceId = req.user?.activeWorkspaceId;
        const sortOrder = req.query?.order;
        const chatId = req.query?.chatId;
        const memoryType = req.query?.memoryType;
        const sessionId = req.query?.sessionId;
        const messageId = req.query?.messageId;
        const startDate = req.query?.startDate;
        const endDate = req.query?.endDate;
        const feedback = req.query?.feedback;
        let feedbackTypeFilters = req.query?.feedbackType;
        if (feedbackTypeFilters) {
            feedbackTypeFilters = getFeedbackTypeFilters(feedbackTypeFilters);
        }
        const apiResponse = await chat_messages_1.default.getAllInternalChatMessages(req.params.id, [Interface_1.ChatType.INTERNAL], sortOrder, chatId, memoryType, sessionId, startDate, endDate, messageId, feedback, feedbackTypeFilters, activeWorkspaceId);
        return res.json(parseAPIResponse(apiResponse));
    }
    catch (error) {
        next(error);
    }
};
const removeAllChatMessages = async (req, res, next) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, 'Error: chatMessagesController.removeAllChatMessages - id not provided!');
        }
        const orgId = req.user?.activeOrganizationId;
        if (!orgId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: chatMessagesController.removeAllChatMessages - organization ${orgId} not found!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: chatMessagesController.removeAllChatMessages - workspace ${workspaceId} not found!`);
        }
        const chatflowid = req.params.id;
        const chatflow = await chatflows_1.default.getChatflowByIdForWorkspace(req.params.id, workspaceId);
        if (!chatflow) {
            return res.status(404).send('Chatflow not found');
        }
        const flowData = chatflow.flowData;
        const parsedFlowData = JSON.parse(flowData);
        const nodes = parsedFlowData.nodes;
        const chatId = req.query?.chatId;
        const memoryType = req.query?.memoryType;
        const sessionId = req.query?.sessionId;
        const _chatTypes = req.query?.chatType;
        let chatTypes;
        if (_chatTypes) {
            try {
                if (Array.isArray(_chatTypes)) {
                    chatTypes = _chatTypes;
                }
                else {
                    chatTypes = JSON.parse(_chatTypes);
                }
            }
            catch (e) {
                chatTypes = [_chatTypes];
            }
        }
        const startDate = req.query?.startDate;
        const endDate = req.query?.endDate;
        const isClearFromViewMessageDialog = req.query?.isClearFromViewMessageDialog;
        let feedbackTypeFilters = req.query?.feedbackType;
        if (feedbackTypeFilters) {
            feedbackTypeFilters = getFeedbackTypeFilters(feedbackTypeFilters);
        }
        if (!chatId) {
            const isFeedback = feedbackTypeFilters?.length ? true : false;
            const hardDelete = req.query?.hardDelete;
            const messages = await (0, getChatMessage_1.utilGetChatMessage)({
                chatflowid,
                chatTypes,
                sessionId,
                startDate,
                endDate,
                feedback: isFeedback,
                feedbackTypes: feedbackTypeFilters,
                activeWorkspaceId: workspaceId
            });
            const messageIds = messages.map((message) => message.id);
            if (messages.length === 0) {
                const result = { raw: [], affected: 0 };
                return res.json(result);
            }
            // Categorize by chatId_memoryType_sessionId
            const chatIdMap = new Map();
            messages.forEach((message) => {
                const chatId = message.chatId;
                const memoryType = message.memoryType;
                const sessionId = message.sessionId;
                const composite_key = `${chatId}_${memoryType}_${sessionId}`;
                if (!chatIdMap.has(composite_key)) {
                    chatIdMap.set(composite_key, []);
                }
                chatIdMap.get(composite_key)?.push(message);
            });
            // If hardDelete is ON, we clearSessionMemory from third party integrations
            if (hardDelete) {
                for (const [composite_key] of chatIdMap) {
                    const [chatId, memoryType, sessionId] = composite_key.split('_');
                    try {
                        await (0, utils_1.clearSessionMemory)(nodes, appServer.nodesPool.componentNodes, chatId, appServer.AppDataSource, orgId, sessionId, memoryType, isClearFromViewMessageDialog);
                    }
                    catch (e) {
                        console.error('Error clearing chat messages');
                    }
                }
            }
            const apiResponse = await chat_messages_1.default.removeChatMessagesByMessageIds(chatflowid, chatIdMap, messageIds, orgId, workspaceId, appServer.usageCacheManager);
            return res.json(apiResponse);
        }
        else {
            try {
                await (0, utils_1.clearSessionMemory)(nodes, appServer.nodesPool.componentNodes, chatId, appServer.AppDataSource, orgId, sessionId, memoryType, isClearFromViewMessageDialog);
            }
            catch (e) {
                return res.status(500).send('Error clearing chat messages');
            }
            const deleteOptions = { chatflowid };
            if (chatId)
                deleteOptions.chatId = chatId;
            if (memoryType)
                deleteOptions.memoryType = memoryType;
            if (sessionId)
                deleteOptions.sessionId = sessionId;
            if (chatTypes && chatTypes.length > 0) {
                deleteOptions.chatType = (0, typeorm_1.In)(chatTypes);
            }
            if (startDate && endDate) {
                const fromDate = new Date(startDate);
                const toDate = new Date(endDate);
                deleteOptions.createdDate = (0, typeorm_1.Between)(fromDate ?? (0, utils_1.aMonthAgo)(), toDate ?? new Date());
            }
            const apiResponse = await chat_messages_1.default.removeAllChatMessages(chatId, chatflowid, deleteOptions, orgId, workspaceId, appServer.usageCacheManager);
            return res.json(apiResponse);
        }
    }
    catch (error) {
        next(error);
    }
};
const abortChatMessage = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.chatflowid || !req.params.chatid) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: chatMessagesController.abortChatMessage - chatflowid or chatid not provided!`);
        }
        await chat_messages_1.default.abortChatMessage(req.params.chatid, req.params.chatflowid);
        return res.json({ status: 200, message: 'Chat message aborted' });
    }
    catch (error) {
        next(error);
    }
};
const parseAPIResponse = (apiResponse) => {
    const parseResponse = (response) => {
        const parsedResponse = { ...response };
        try {
            if (parsedResponse.sourceDocuments) {
                parsedResponse.sourceDocuments = JSON.parse(parsedResponse.sourceDocuments);
            }
            if (parsedResponse.usedTools) {
                parsedResponse.usedTools = JSON.parse(parsedResponse.usedTools);
            }
            if (parsedResponse.fileAnnotations) {
                parsedResponse.fileAnnotations = JSON.parse(parsedResponse.fileAnnotations);
            }
            if (parsedResponse.agentReasoning) {
                parsedResponse.agentReasoning = JSON.parse(parsedResponse.agentReasoning);
            }
            if (parsedResponse.reasonContent) {
                parsedResponse.reasonContent = JSON.parse(parsedResponse.reasonContent);
            }
            if (parsedResponse.fileUploads) {
                parsedResponse.fileUploads = JSON.parse(parsedResponse.fileUploads);
            }
            if (parsedResponse.action) {
                parsedResponse.action = JSON.parse(parsedResponse.action);
            }
            if (parsedResponse.artifacts) {
                parsedResponse.artifacts = JSON.parse(parsedResponse.artifacts);
            }
        }
        catch (e) {
            console.error('Error parsing chat message response', e);
        }
        return parsedResponse;
    };
    if (Array.isArray(apiResponse)) {
        return apiResponse.map(parseResponse);
    }
    else {
        return parseResponse(apiResponse);
    }
};
exports.default = {
    createChatMessage,
    getAllChatMessages,
    getAllInternalChatMessages,
    removeAllChatMessages,
    abortChatMessage
};
//# sourceMappingURL=index.js.map