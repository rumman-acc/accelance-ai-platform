"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const accelance_components_1 = require("accelance-components");
const http_status_codes_1 = require("http-status-codes");
const typeorm_1 = require("typeorm");
const ChatMessage_1 = require("../../database/entities/ChatMessage");
const ChatMessageFeedback_1 = require("../../database/entities/ChatMessageFeedback");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const utils_1 = require("../../errors/utils");
const Interface_1 = require("../../Interface");
const addChatMesage_1 = require("../../utils/addChatMesage");
const getChatMessage_1 = require("../../utils/getChatMessage");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const quotaUsage_1 = require("../../utils/quotaUsage");
// Add chatmessages for chatflowid
const createChatMessage = async (chatMessage) => {
    try {
        const dbResponse = await (0, addChatMesage_1.utilAddChatMessage)(chatMessage);
        return dbResponse;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatMessagesService.createChatMessage - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
// Get all chatmessages from chatflowid
const getAllChatMessages = async (chatflowId, chatTypes, sortOrder = 'ASC', chatId, memoryType, sessionId, startDate, endDate, messageId, feedback, feedbackTypes, activeWorkspaceId, page, pageSize) => {
    try {
        const dbResponse = await (0, getChatMessage_1.utilGetChatMessage)({
            chatflowid: chatflowId,
            chatTypes,
            sortOrder,
            chatId,
            memoryType,
            sessionId,
            startDate,
            endDate,
            messageId,
            feedback,
            feedbackTypes,
            activeWorkspaceId,
            page,
            pageSize
        });
        return dbResponse;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatMessagesService.getAllChatMessages - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
// Get internal chatmessages from chatflowid
const getAllInternalChatMessages = async (chatflowId, chatTypes, sortOrder = 'ASC', chatId, memoryType, sessionId, startDate, endDate, messageId, feedback, feedbackTypes, activeWorkspaceId) => {
    try {
        const dbResponse = await (0, getChatMessage_1.utilGetChatMessage)({
            chatflowid: chatflowId,
            chatTypes,
            sortOrder,
            chatId,
            memoryType,
            sessionId,
            startDate,
            endDate,
            messageId,
            feedback,
            feedbackTypes,
            activeWorkspaceId
        });
        return dbResponse;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatMessagesService.getAllInternalChatMessages - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const removeAllChatMessages = async (chatId, chatflowid, deleteOptions, orgId, workspaceId, usageCacheManager) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        // Remove all related feedback records
        const feedbackDeleteOptions = { chatId };
        await appServer.AppDataSource.getRepository(ChatMessageFeedback_1.ChatMessageFeedback).delete(feedbackDeleteOptions);
        // Delete all uploads corresponding to this chatflow/chatId
        if (chatId) {
            try {
                const { totalSize } = await (0, accelance_components_1.removeFilesFromStorage)(orgId, chatflowid, chatId);
                await (0, quotaUsage_1.updateStorageUsage)(orgId, workspaceId, totalSize, usageCacheManager);
            }
            catch (e) {
                // Don't throw error if file deletion fails because file might not exist
            }
        }
        const dbResponse = await appServer.AppDataSource.getRepository(ChatMessage_1.ChatMessage).delete(deleteOptions);
        return dbResponse;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatMessagesService.removeAllChatMessages - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const removeChatMessagesByMessageIds = async (chatflowid, chatIdMap, messageIds, orgId, workspaceId, usageCacheManager) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        // Get messages before deletion to check for executionId
        const messages = await appServer.AppDataSource.getRepository(ChatMessage_1.ChatMessage).findByIds(messageIds);
        const executionIds = messages.map((msg) => msg.executionId).filter(Boolean);
        for (const [composite_key] of chatIdMap) {
            const [chatId] = composite_key.split('_');
            // Remove all related feedback records
            const feedbackDeleteOptions = { chatId };
            await appServer.AppDataSource.getRepository(ChatMessageFeedback_1.ChatMessageFeedback).delete(feedbackDeleteOptions);
            // Delete all uploads corresponding to this chatflow/chatId
            try {
                const { totalSize } = await (0, accelance_components_1.removeFilesFromStorage)(orgId, chatflowid, chatId);
                await (0, quotaUsage_1.updateStorageUsage)(orgId, workspaceId, totalSize, usageCacheManager);
            }
            catch (e) {
                // Don't throw error if file deletion fails because file might not exist
            }
        }
        // Delete executions if they exist
        if (executionIds.length > 0) {
            await appServer.AppDataSource.getRepository('Execution').delete(executionIds);
        }
        const dbResponse = await appServer.AppDataSource.getRepository(ChatMessage_1.ChatMessage).delete(messageIds);
        return dbResponse;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatMessagesService.removeChatMessagesByMessageIds - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const abortChatMessage = async (chatId, chatflowid) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const id = `${chatflowid}_${chatId}`;
        if (process.env.MODE === Interface_1.MODE.QUEUE) {
            await appServer.queueManager.getPredictionQueueEventsProducer().publishEvent({
                eventName: 'abort',
                id
            });
        }
        else {
            appServer.abortControllerPool.abort(id);
        }
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatMessagesService.abortChatMessage - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
async function getMessagesByChatflowIds(chatflowIds) {
    const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
    return await appServer.AppDataSource.getRepository(ChatMessage_1.ChatMessage).find({ where: { chatflowid: (0, typeorm_1.In)(chatflowIds) } });
}
async function getMessagesFeedbackByChatflowIds(chatflowIds) {
    const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
    return await appServer.AppDataSource.getRepository(ChatMessageFeedback_1.ChatMessageFeedback).find({ where: { chatflowid: (0, typeorm_1.In)(chatflowIds) } });
}
exports.default = {
    createChatMessage,
    getAllChatMessages,
    getAllInternalChatMessages,
    removeAllChatMessages,
    removeChatMessagesByMessageIds,
    abortChatMessage,
    getMessagesByChatflowIds,
    getMessagesFeedbackByChatflowIds
};
//# sourceMappingURL=index.js.map