"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const http_status_codes_1 = require("http-status-codes");
const Interface_1 = require("../../Interface");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
globals_1.jest.mock('../../utils/getRunningExpressApp', () => ({
    getRunningExpressApp: globals_1.jest.fn()
}));
const _1 = __importDefault(require("."));
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const ChatFlow_1 = require("../../database/entities/ChatFlow");
const mockQb = {
    select: globals_1.jest.fn().mockReturnThis(),
    addSelect: globals_1.jest.fn().mockReturnThis(),
    from: globals_1.jest.fn().mockReturnThis(),
    innerJoin: globals_1.jest.fn().mockReturnThis(),
    leftJoin: globals_1.jest.fn().mockReturnThis(),
    where: globals_1.jest.fn().mockReturnThis(),
    andWhere: globals_1.jest.fn().mockReturnThis(),
    setParameter: globals_1.jest.fn().mockReturnThis(),
    setParameters: globals_1.jest.fn().mockReturnThis(),
    subQuery: globals_1.jest.fn().mockReturnThis(),
    getQuery: globals_1.jest.fn().mockReturnValue('(SELECT DISTINCT cm2.sessionId FROM chat_message cm2)'),
    getParameters: globals_1.jest.fn().mockReturnValue({}),
    getRawOne: globals_1.jest.fn(),
    getRawMany: globals_1.jest.fn()
};
const mockMessageRepo = {
    createQueryBuilder: globals_1.jest.fn().mockReturnValue(mockQb)
};
const mockChatFlowRepo = {
    findOneBy: globals_1.jest.fn()
};
const CHATFLOW_ID = 'cf-abc-123';
const WORKSPACE_ID = 'ws-xyz-456';
(0, globals_1.describe)('statsService.getChatflowStats', () => {
    (0, globals_1.beforeEach)(() => {
        globals_1.jest.clearAllMocks();
        getRunningExpressApp_1.getRunningExpressApp.mockReturnValue({
            AppDataSource: {
                getRepository: globals_1.jest.fn((entity) => {
                    if (entity === ChatFlow_1.ChatFlow)
                        return mockChatFlowRepo;
                    return mockMessageRepo;
                })
            }
        });
        mockChatFlowRepo.findOneBy.mockResolvedValue({ id: CHATFLOW_ID });
        mockQb.getRawOne.mockResolvedValue({ count: '0' });
        mockQb.getRawMany.mockResolvedValue([]);
        mockQb.select.mockReturnThis();
        mockQb.addSelect.mockReturnThis();
        mockQb.from.mockReturnThis();
        mockQb.innerJoin.mockReturnThis();
        mockQb.leftJoin.mockReturnThis();
        mockQb.where.mockReturnThis();
        mockQb.andWhere.mockReturnThis();
        mockQb.setParameter.mockReturnThis();
        mockQb.setParameters.mockReturnThis();
        mockQb.subQuery.mockReturnThis();
        mockQb.getQuery.mockReturnValue('(SELECT DISTINCT cm2.sessionId FROM chat_message cm2)');
        mockQb.getParameters.mockReturnValue({});
        mockMessageRepo.createQueryBuilder.mockReturnValue(mockQb);
    });
    (0, globals_1.describe)('workspace authorization', () => {
        (0, globals_1.it)('throws when activeWorkspaceId is not provided', async () => {
            await (0, globals_1.expect)(_1.default.getChatflowStats(CHATFLOW_ID, undefined, undefined, undefined, undefined, undefined)).rejects.toBeInstanceOf(internalAccelanceError_1.InternalAccelanceError);
            (0, globals_1.expect)(mockChatFlowRepo.findOneBy).not.toHaveBeenCalled();
        });
        (0, globals_1.it)('throws when chatflow is not found in the workspace', async () => {
            mockChatFlowRepo.findOneBy.mockResolvedValue(null);
            await (0, globals_1.expect)(_1.default.getChatflowStats(CHATFLOW_ID, WORKSPACE_ID, undefined, undefined, undefined, undefined)).rejects.toBeInstanceOf(internalAccelanceError_1.InternalAccelanceError);
            (0, globals_1.expect)(mockMessageRepo.createQueryBuilder).not.toHaveBeenCalled();
        });
        (0, globals_1.it)('looks up chatflow with the correct workspaceId', async () => {
            await _1.default.getChatflowStats(CHATFLOW_ID, WORKSPACE_ID, undefined, undefined, undefined, undefined);
            (0, globals_1.expect)(mockChatFlowRepo.findOneBy).toHaveBeenCalledWith({
                id: CHATFLOW_ID,
                workspaceId: WORKSPACE_ID
            });
        });
    });
    (0, globals_1.describe)('no filters', () => {
        (0, globals_1.it)('returns the correct shape with parsed integers', async () => {
            mockQb.getRawOne.mockResolvedValueOnce({
                totalMessages: '157',
                totalSessions: '42',
                totalFeedback: '10',
                positiveFeedback: '7'
            });
            const result = await _1.default.getChatflowStats(CHATFLOW_ID, WORKSPACE_ID, undefined, undefined, undefined, undefined);
            (0, globals_1.expect)(result).toEqual({
                totalMessages: 157,
                totalSessions: 42,
                totalFeedback: 10,
                positiveFeedback: 7
            });
        });
        (0, globals_1.it)('defaults to 0 when getRawOne returns undefined', async () => {
            mockQb.getRawOne.mockResolvedValue(undefined);
            const result = await _1.default.getChatflowStats(CHATFLOW_ID, WORKSPACE_ID, undefined, undefined, undefined, undefined);
            (0, globals_1.expect)(result.totalMessages).toBe(0);
            (0, globals_1.expect)(result.totalSessions).toBe(0);
            (0, globals_1.expect)(result.totalFeedback).toBe(0);
            (0, globals_1.expect)(result.positiveFeedback).toBe(0);
        });
        (0, globals_1.it)('runs 1 QueryBuilder and getRawOne 1 time when no feedbackTypes filter is set', async () => {
            await _1.default.getChatflowStats(CHATFLOW_ID, WORKSPACE_ID, undefined, undefined, undefined, undefined);
            (0, globals_1.expect)(mockMessageRepo.createQueryBuilder).toHaveBeenCalledTimes(1);
            (0, globals_1.expect)(mockQb.getRawOne).toHaveBeenCalledTimes(1);
        });
    });
    (0, globals_1.describe)('chatTypes filter', () => {
        (0, globals_1.it)('uses In operator with the provided chatTypes', async () => {
            const chatTypes = [Interface_1.ChatType.INTERNAL];
            await _1.default.getChatflowStats(CHATFLOW_ID, WORKSPACE_ID, chatTypes, undefined, undefined, undefined);
            const whereArg = mockQb.where.mock.calls[0][0];
            (0, globals_1.expect)(whereArg.chatType.type).toBe('in');
            (0, globals_1.expect)(whereArg.chatType.value).toEqual(chatTypes);
        });
    });
    (0, globals_1.describe)('date range filter', () => {
        (0, globals_1.it)('uses Between when both startDate and endDate are provided', async () => {
            await _1.default.getChatflowStats(CHATFLOW_ID, WORKSPACE_ID, undefined, '2024-01-01', '2024-12-31', undefined);
            const whereArg = mockQb.where.mock.calls[0][0];
            (0, globals_1.expect)(whereArg.createdDate.type).toBe('between');
        });
        (0, globals_1.it)('uses MoreThanOrEqual when only startDate is provided', async () => {
            await _1.default.getChatflowStats(CHATFLOW_ID, WORKSPACE_ID, undefined, '2024-01-01', undefined, undefined);
            const whereArg = mockQb.where.mock.calls[0][0];
            (0, globals_1.expect)(whereArg.createdDate.type).toBe('moreThanOrEqual');
        });
        (0, globals_1.it)('uses LessThanOrEqual when only endDate is provided', async () => {
            await _1.default.getChatflowStats(CHATFLOW_ID, WORKSPACE_ID, undefined, undefined, '2024-12-31', undefined);
            const whereArg = mockQb.where.mock.calls[0][0];
            (0, globals_1.expect)(whereArg.createdDate.type).toBe('lessThanOrEqual');
        });
    });
    (0, globals_1.describe)('feedbackTypes filter', () => {
        (0, globals_1.it)('returns all zeros when no sessions have qualifying feedback', async () => {
            mockQb.getRawOne.mockResolvedValue({ count: '0' });
            const result = await _1.default.getChatflowStats(CHATFLOW_ID, WORKSPACE_ID, undefined, undefined, undefined, [
                Interface_1.ChatMessageRatingType.THUMBS_UP
            ]);
            (0, globals_1.expect)(result).toEqual({ totalMessages: 0, totalSessions: 0, totalFeedback: 0, positiveFeedback: 0 });
            // 1 combinedQb + 1 precedingCountQb = 2
            (0, globals_1.expect)(mockQb.getRawOne).toHaveBeenCalledTimes(2);
        });
        (0, globals_1.it)('computes totalMessages as totalFeedback + precedingCount when feedbackTypes is set', async () => {
            mockQb.getRawOne
                .mockResolvedValueOnce({ totalSessions: '42', totalFeedback: '67', positiveFeedback: '60' }) // combinedQb
                .mockResolvedValueOnce({ count: '57' }); // precedingCountQb
            const result = await _1.default.getChatflowStats(CHATFLOW_ID, WORKSPACE_ID, undefined, undefined, undefined, [
                Interface_1.ChatMessageRatingType.THUMBS_UP
            ]);
            // totalMessages = totalFeedback(67) + precedingCount(57) = 124
            (0, globals_1.expect)(result.totalMessages).toBe(124);
            (0, globals_1.expect)(result.totalSessions).toBe(42);
            (0, globals_1.expect)(result.totalFeedback).toBe(67);
            (0, globals_1.expect)(result.positiveFeedback).toBe(60);
            // 1 combinedQb + 1 precedingCountQb = 2
            (0, globals_1.expect)(mockQb.getRawOne).toHaveBeenCalledTimes(2);
        });
        (0, globals_1.it)('passes the feedbackTypes to the session subquery', async () => {
            await _1.default.getChatflowStats(CHATFLOW_ID, WORKSPACE_ID, undefined, undefined, undefined, [
                Interface_1.ChatMessageRatingType.THUMBS_DOWN
            ]);
            const feedbackCall = mockQb.andWhere.mock.calls.find((call) => call[0].includes('feedbackTypes'));
            (0, globals_1.expect)(feedbackCall).toBeDefined();
            (0, globals_1.expect)(feedbackCall[1]).toEqual(globals_1.expect.objectContaining({ feedbackTypes: [Interface_1.ChatMessageRatingType.THUMBS_DOWN] }));
        });
        (0, globals_1.it)('appends the session subquery condition to the combined count query', async () => {
            await _1.default.getChatflowStats(CHATFLOW_ID, WORKSPACE_ID, undefined, undefined, undefined, [
                Interface_1.ChatMessageRatingType.THUMBS_UP
            ]);
            const sessionIdCalls = mockQb.andWhere.mock.calls.filter((call) => call[0].includes('cm.sessionId IN'));
            (0, globals_1.expect)(sessionIdCalls.length).toBe(1);
        });
    });
    (0, globals_1.describe)('error handling', () => {
        (0, globals_1.it)('wraps unexpected errors as InternalAccelanceError with 500 status', async () => {
            mockQb.getRawOne.mockRejectedValue(new Error('DB connection lost'));
            let caught;
            try {
                await _1.default.getChatflowStats(CHATFLOW_ID, WORKSPACE_ID, undefined, undefined, undefined, undefined);
            }
            catch (e) {
                caught = e;
            }
            (0, globals_1.expect)(caught).toBeInstanceOf(internalAccelanceError_1.InternalAccelanceError);
            (0, globals_1.expect)(caught.statusCode).toBe(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
            (0, globals_1.expect)(caught.message).toContain('statsService.getChatflowStats');
        });
    });
});
//# sourceMappingURL=index.test.js.map