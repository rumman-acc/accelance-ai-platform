"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.utilGetChatMessage = void 0;
const typeorm_1 = require("typeorm");
const ChatMessage_1 = require("../database/entities/ChatMessage");
const ChatMessageFeedback_1 = require("../database/entities/ChatMessageFeedback");
const ChatFlow_1 = require("../database/entities/ChatFlow");
const getRunningExpressApp_1 = require("../utils/getRunningExpressApp");
const utilGetChatMessage = async ({ chatflowid, chatTypes, sortOrder = 'ASC', chatId, memoryType, sessionId, startDate, endDate, messageId, feedback, feedbackTypes, activeWorkspaceId, page = -1, pageSize = -1 }) => {
    if (!page)
        page = -1;
    if (!pageSize)
        pageSize = -1;
    const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
    // Check if chatflow workspaceId is same as activeWorkspaceId
    if (activeWorkspaceId) {
        const chatflow = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).findOneBy({
            id: chatflowid,
            workspaceId: activeWorkspaceId
        });
        if (!chatflow) {
            throw new Error('Unauthorized access');
        }
    }
    else {
        throw new Error('Unauthorized access');
    }
    if (feedback) {
        // Handle feedback queries with improved efficiency
        return await handleFeedbackQuery({
            chatflowid,
            chatTypes,
            sortOrder,
            chatId,
            memoryType,
            sessionId,
            startDate,
            endDate,
            messageId,
            feedbackTypes,
            page,
            pageSize
        });
    }
    let createdDateQuery;
    if (startDate || endDate) {
        if (startDate && endDate) {
            createdDateQuery = (0, typeorm_1.Between)(new Date(startDate), new Date(endDate));
        }
        else if (startDate) {
            createdDateQuery = (0, typeorm_1.MoreThanOrEqual)(new Date(startDate));
        }
        else if (endDate) {
            createdDateQuery = (0, typeorm_1.LessThanOrEqual)(new Date(endDate));
        }
    }
    const messages = await appServer.AppDataSource.getRepository(ChatMessage_1.ChatMessage).find({
        where: {
            chatflowid,
            chatType: chatTypes?.length ? (0, typeorm_1.In)(chatTypes) : undefined,
            chatId,
            memoryType: memoryType ?? undefined,
            sessionId: sessionId ?? undefined,
            createdDate: createdDateQuery,
            id: messageId ?? undefined
        },
        relations: {
            execution: true
        },
        order: {
            createdDate: sortOrder === 'DESC' ? 'DESC' : 'ASC'
        }
    });
    return messages;
};
exports.utilGetChatMessage = utilGetChatMessage;
async function handleFeedbackQuery(params) {
    const { chatflowid, chatTypes, sortOrder, chatId, memoryType, sessionId, startDate, endDate, messageId, feedbackTypes, page, pageSize } = params;
    const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
    // For specific session/message queries, no pagination needed
    if (sessionId || messageId) {
        return await getMessagesWithFeedback(params, false);
    }
    // For paginated queries, handle session-based pagination efficiently
    if (page > -1 && pageSize > -1) {
        // First get session IDs with pagination
        const sessionQuery = appServer.AppDataSource.getRepository(ChatMessage_1.ChatMessage)
            .createQueryBuilder('chat_message')
            .select('chat_message.sessionId', 'sessionId')
            .where('chat_message.chatflowid = :chatflowid', { chatflowid });
        // Apply basic filters
        if (chatTypes && chatTypes.length > 0) {
            sessionQuery.andWhere('chat_message.chatType IN (:...chatTypes)', { chatTypes });
        }
        if (chatId) {
            sessionQuery.andWhere('chat_message.chatId = :chatId', { chatId });
        }
        if (memoryType) {
            sessionQuery.andWhere('chat_message.memoryType = :memoryType', { memoryType });
        }
        if (startDate && typeof startDate === 'string') {
            sessionQuery.andWhere('chat_message.createdDate >= :startDateTime', {
                startDateTime: new Date(startDate)
            });
        }
        if (endDate && typeof endDate === 'string') {
            sessionQuery.andWhere('chat_message.createdDate <= :endDateTime', {
                endDateTime: new Date(endDate)
            });
        }
        // If feedback types are specified, only get sessions with those feedback types
        if (feedbackTypes && feedbackTypes.length > 0) {
            sessionQuery
                .leftJoin(ChatMessageFeedback_1.ChatMessageFeedback, 'feedback', 'feedback.messageId = chat_message.id')
                .andWhere('feedback.rating IN (:...feedbackTypes)', { feedbackTypes });
        }
        const startIndex = pageSize * (page - 1);
        const sessionIds = await sessionQuery
            .orderBy('MAX(chat_message.createdDate)', sortOrder === 'DESC' ? 'DESC' : 'ASC')
            .groupBy('chat_message.sessionId')
            .offset(startIndex)
            .limit(pageSize)
            .getRawMany();
        if (sessionIds.length === 0) {
            return [];
        }
        // Get all messages for these sessions
        const sessionIdList = sessionIds.map((s) => s.sessionId);
        return await getMessagesWithFeedback({
            ...params,
            sessionId: undefined // Clear specific sessionId since we're using list
        }, true, sessionIdList);
    }
    // No pagination - get all feedback messages
    return await getMessagesWithFeedback(params, false);
}
async function getMessagesWithFeedback(params, useSessionList = false, sessionIdList) {
    const { chatflowid, chatTypes, sortOrder, chatId, memoryType, sessionId, startDate, endDate, messageId, feedbackTypes } = params;
    const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
    const query = appServer.AppDataSource.getRepository(ChatMessage_1.ChatMessage).createQueryBuilder('chat_message');
    query
        .leftJoinAndSelect('chat_message.execution', 'execution')
        .leftJoinAndMapOne('chat_message.feedback', ChatMessageFeedback_1.ChatMessageFeedback, 'feedback', 'feedback.messageId = chat_message.id')
        .where('chat_message.chatflowid = :chatflowid', { chatflowid });
    // Apply filters
    if (useSessionList && sessionIdList && sessionIdList.length > 0) {
        query.andWhere('chat_message.sessionId IN (:...sessionIds)', { sessionIds: sessionIdList });
    }
    if (chatTypes && chatTypes.length > 0) {
        query.andWhere('chat_message.chatType IN (:...chatTypes)', { chatTypes });
    }
    if (chatId) {
        query.andWhere('chat_message.chatId = :chatId', { chatId });
    }
    if (memoryType) {
        query.andWhere('chat_message.memoryType = :memoryType', { memoryType });
    }
    if (sessionId) {
        query.andWhere('chat_message.sessionId = :sessionId', { sessionId });
    }
    if (messageId) {
        query.andWhere('chat_message.id = :messageId', { messageId });
    }
    if (startDate && typeof startDate === 'string') {
        query.andWhere('chat_message.createdDate >= :startDateTime', {
            startDateTime: new Date(startDate)
        });
    }
    if (endDate && typeof endDate === 'string') {
        query.andWhere('chat_message.createdDate <= :endDateTime', {
            endDateTime: new Date(endDate)
        });
    }
    // Pre-filter by feedback types if specified (more efficient than post-processing)
    if (feedbackTypes && feedbackTypes.length > 0) {
        query.andWhere('(feedback.rating IN (:...feedbackTypes) OR feedback.rating IS NULL)', { feedbackTypes });
    }
    query.orderBy('chat_message.createdDate', sortOrder === 'DESC' ? 'DESC' : 'ASC');
    const messages = (await query.getMany());
    // Apply feedback type filtering with previous message inclusion
    if (feedbackTypes && feedbackTypes.length > 0) {
        return filterMessagesWithFeedback(messages, feedbackTypes);
    }
    return messages;
}
function filterMessagesWithFeedback(messages, feedbackTypes) {
    // Group messages by session for proper filtering
    const sessionGroups = new Map();
    messages.forEach((message) => {
        const sessionId = message.sessionId;
        if (!sessionId)
            return; // Skip messages without sessionId
        if (!sessionGroups.has(sessionId)) {
            sessionGroups.set(sessionId, []);
        }
        sessionGroups.get(sessionId).push(message);
    });
    const result = [];
    // Process each session group
    sessionGroups.forEach((sessionMessages) => {
        // Sort by creation date to ensure proper order
        sessionMessages.sort((a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime());
        const toInclude = new Set();
        sessionMessages.forEach((message, index) => {
            if (message.role === 'apiMessage' && message.feedback && feedbackTypes.includes(message.feedback.rating)) {
                // Include the feedback message
                toInclude.add(index);
                // Include the previous message (user message) if it exists
                if (index > 0) {
                    toInclude.add(index - 1);
                }
            }
        });
        // Add filtered messages to result
        sessionMessages.forEach((message, index) => {
            if (toInclude.has(index)) {
                result.push(message);
            }
        });
    });
    // Sort final result by creation date
    return result.sort((a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime());
}
//# sourceMappingURL=getChatMessage.js.map