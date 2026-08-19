"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const typeorm_1 = require("typeorm");
const Interface_1 = require("../../Interface");
const ChatMessage_1 = require("../../database/entities/ChatMessage");
const ChatMessageFeedback_1 = require("../../database/entities/ChatMessageFeedback");
const ChatFlow_1 = require("../../database/entities/ChatFlow");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const utils_1 = require("../../errors/utils");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
// get stats for showing in chatflow
const getChatflowStats = async (chatflowid, activeWorkspaceId, chatTypes, startDate, endDate, feedbackTypes) => {
    try {
        if (!activeWorkspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.UNAUTHORIZED, `Error: statsService.getChatflowStats - activeWorkspaceId not provided!`);
        }
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const chatflow = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).findOneBy({
            id: chatflowid,
            workspaceId: activeWorkspaceId
        });
        if (!chatflow)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.FORBIDDEN, `Error: statsService.getChatflowStats - chatflow ${chatflowid} not found in workspace!`);
        const repo = appServer.AppDataSource.getRepository(ChatMessage_1.ChatMessage);
        // Build base WHERE conditions shared by all queries
        const baseWhere = { chatflowid };
        if (chatTypes && chatTypes.length > 0)
            baseWhere.chatType = (0, typeorm_1.In)(chatTypes);
        if (startDate && endDate)
            baseWhere.createdDate = (0, typeorm_1.Between)(new Date(startDate), new Date(endDate));
        else if (startDate)
            baseWhere.createdDate = (0, typeorm_1.MoreThanOrEqual)(new Date(startDate));
        else if (endDate)
            baseWhere.createdDate = (0, typeorm_1.LessThanOrEqual)(new Date(endDate));
        if (feedbackTypes && feedbackTypes.length > 0) {
            // Scoping subquery: find sessions that contain qualifying feedback
            const sessionSubQb = repo
                .createQueryBuilder()
                .subQuery()
                .select('DISTINCT cm2.sessionId')
                .from(ChatMessage_1.ChatMessage, 'cm2')
                .innerJoin(ChatMessageFeedback_1.ChatMessageFeedback, 'f2', 'f2.messageId = cm2.id')
                .where(baseWhere)
                .andWhere('f2.rating IN (:...feedbackTypes)', { feedbackTypes });
            const subSql = sessionSubQb.getQuery();
            const subParams = sessionSubQb.getParameters();
            // Combined query: totalSessions, totalFeedback, positiveFeedback — scoped to qualifying sessions.
            const combinedQb = repo
                .createQueryBuilder('cm')
                .select('COUNT(DISTINCT cm.sessionId)', 'totalSessions')
                .addSelect('COUNT(DISTINCT f.id)', 'totalFeedback')
                .addSelect('COUNT(DISTINCT CASE WHEN f.rating = :posRating THEN f.id END)', 'positiveFeedback')
                .innerJoin(ChatMessageFeedback_1.ChatMessageFeedback, 'f', 'f.messageId = cm.id')
                .where(baseWhere)
                .andWhere(`cm.sessionId IN ${subSql}`)
                .andWhere('f.rating IN (:...ratingFilter)', { ratingFilter: feedbackTypes })
                .setParameters({ ...subParams, posRating: Interface_1.ChatMessageRatingType.THUMBS_UP });
            // Anti-join: count immediate predecessors of feedback messages that aren't
            // themselves feedback messages (to avoid double-counting).
            const precedingCountQb = repo
                .createQueryBuilder('prev')
                .select('COUNT(DISTINCT prev.id)', 'count')
                .innerJoin(ChatMessage_1.ChatMessage, 'fb_msg', 'fb_msg.chatflowid = prev.chatflowid AND fb_msg.sessionId = prev.sessionId AND fb_msg.createdDate > prev.createdDate')
                .innerJoin(ChatMessageFeedback_1.ChatMessageFeedback, 'fb', 'fb.messageId = fb_msg.id')
                .leftJoin(ChatMessage_1.ChatMessage, 'btwn', 'btwn.chatflowid = prev.chatflowid AND btwn.sessionId = prev.sessionId AND btwn.createdDate > prev.createdDate AND btwn.createdDate < fb_msg.createdDate')
                .leftJoin(ChatMessageFeedback_1.ChatMessageFeedback, 'prev_fb', 'prev_fb.messageId = prev.id AND prev_fb.rating IN (:...ft2)', {
                ft2: feedbackTypes
            })
                .where(baseWhere)
                .andWhere('fb.rating IN (:...ft)', { ft: feedbackTypes })
                .andWhere('btwn.id IS NULL')
                .andWhere('prev_fb.id IS NULL');
            const [combinedRaw, precedingRaw] = await Promise.all([combinedQb.getRawOne(), precedingCountQb.getRawOne()]);
            return {
                totalMessages: parseInt(combinedRaw?.totalFeedback ?? '0', 10) + parseInt(precedingRaw?.count ?? '0', 10),
                totalSessions: parseInt(combinedRaw?.totalSessions ?? '0', 10),
                totalFeedback: parseInt(combinedRaw?.totalFeedback ?? '0', 10),
                positiveFeedback: parseInt(combinedRaw?.positiveFeedback ?? '0', 10)
            };
        }
        // Single query: total messages, sessions, and feedback counts with thumbs-up breakdown
        const statsRaw = await repo
            .createQueryBuilder('cm')
            .select('COUNT(*)', 'totalMessages')
            .addSelect('COUNT(DISTINCT cm.sessionId)', 'totalSessions')
            .addSelect('COUNT(DISTINCT f.id)', 'totalFeedback')
            .addSelect('COUNT(DISTINCT CASE WHEN f.rating = :thumbsUp THEN f.id END)', 'positiveFeedback')
            .leftJoin(ChatMessageFeedback_1.ChatMessageFeedback, 'f', 'f.messageId = cm.id')
            .where(baseWhere)
            .setParameter('thumbsUp', Interface_1.ChatMessageRatingType.THUMBS_UP)
            .getRawOne();
        return {
            totalMessages: parseInt(statsRaw?.totalMessages ?? '0', 10),
            totalSessions: parseInt(statsRaw?.totalSessions ?? '0', 10),
            totalFeedback: parseInt(statsRaw?.totalFeedback ?? '0', 10),
            positiveFeedback: parseInt(statsRaw?.positiveFeedback ?? '0', 10)
        };
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: statsService.getChatflowStats - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
exports.default = {
    getChatflowStats
};
//# sourceMappingURL=index.js.map