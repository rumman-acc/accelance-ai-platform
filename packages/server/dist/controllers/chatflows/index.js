"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const ChatFlow_1 = require("../../database/entities/ChatFlow");
const workspace_user_service_1 = require("../../enterprise/services/workspace-user.service");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const ScheduleBeat_1 = require("../../schedule/ScheduleBeat");
const apikey_1 = __importDefault(require("../../services/apikey"));
const audit_log_1 = __importDefault(require("../../services/audit-log"));
const chatflows_1 = __importDefault(require("../../services/chatflows"));
const credential_access_1 = __importDefault(require("../../services/credential-access"));
const schedule_1 = __importDefault(require("../../services/schedule"));
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const pagination_1 = require("../../utils/pagination");
const quotaUsage_1 = require("../../utils/quotaUsage");
const rateLimit_1 = require("../../utils/rateLimit");
const sanitizeFlowData_1 = require("../../utils/sanitizeFlowData");
const stripProtectedFields_1 = require("../../utils/stripProtectedFields");
const checkIfChatflowIsValidForStreaming = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: chatflowsController.checkIfChatflowIsValidForStreaming - id not provided!`);
        }
        const apiResponse = await chatflows_1.default.checkIfChatflowIsValidForStreaming(req.params.id);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const checkIfChatflowIsValidForUploads = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: chatflowsController.checkIfChatflowIsValidForUploads - id not provided!`);
        }
        const apiResponse = await chatflows_1.default.checkIfChatflowIsValidForUploads(req.params.id);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const deleteChatflow = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: chatflowsController.deleteChatflow - id not provided!`);
        }
        const orgId = req.user?.activeOrganizationId;
        if (!orgId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: chatflowsController.deleteChatflow - organization ${orgId} not found!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: chatflowsController.deleteChatflow - workspace ${workspaceId} not found!`);
        }
        const userPermittedTypes = [];
        const permissions = req.user.permissions;
        if (req.user?.isOrganizationAdmin) {
            userPermittedTypes.push(ChatFlow_1.EnumChatflowType.CHATFLOW);
            userPermittedTypes.push(ChatFlow_1.EnumChatflowType.AGENTFLOW);
            userPermittedTypes.push(ChatFlow_1.EnumChatflowType.MULTIAGENT);
            userPermittedTypes.push(ChatFlow_1.EnumChatflowType.ASSISTANT);
        }
        else {
            if (permissions.includes(`chatflows:delete`))
                userPermittedTypes.push(ChatFlow_1.EnumChatflowType.CHATFLOW);
            if (permissions.includes(`agentflows:delete`))
                userPermittedTypes.push(ChatFlow_1.EnumChatflowType.AGENTFLOW);
            if (permissions.includes(`agentflows:delete`))
                userPermittedTypes.push(ChatFlow_1.EnumChatflowType.MULTIAGENT);
            if (permissions.includes(`assistants:delete`))
                userPermittedTypes.push(ChatFlow_1.EnumChatflowType.ASSISTANT);
            if (userPermittedTypes.length === 0)
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.FORBIDDEN, `You do not have permission to delete any chatflow types`);
        }
        const apiResponse = await chatflows_1.default.deleteChatflow(req.params.id, orgId, workspaceId, userPermittedTypes);
        await audit_log_1.default.record(workspaceId, req.user?.id, 'chatflow.delete', 'ChatFlow', req.params.id);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getAllChatflows = async (req, res, next) => {
    try {
        const { page, limit } = (0, pagination_1.getPageAndLimitParams)(req);
        const apiResponse = await chatflows_1.default.getAllChatflows(req.query?.type, req.user?.activeWorkspaceId, page, limit);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
// Get specific chatflow via api key
const getChatflowByApiKey = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.apikey) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: chatflowsController.getChatflowByApiKey - apikey not provided!`);
        }
        const apikey = await apikey_1.default.getApiKey(req.params.apikey);
        if (!apikey) {
            return res.status(401).send('Unauthorized');
        }
        const apiResponse = await chatflows_1.default.getChatflowByApiKey(apikey.id, apikey.workspaceId, req.query.keyonly);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getChatflowById = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: chatflowsController.getChatflowById - id not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: chatflowsController.getChatflowById - workspace ${workspaceId} not found!`);
        }
        const apiResponse = await chatflows_1.default.getChatflowById(req.params.id, workspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const saveChatflow = async (req, res, next) => {
    try {
        if (!req.body) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: chatflowsController.saveChatflow - body not provided!`);
        }
        const orgId = req.user?.activeOrganizationId;
        if (!orgId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: chatflowsController.saveChatflow - organization ${orgId} not found!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: chatflowsController.saveChatflow - workspace ${workspaceId} not found!`);
        }
        const subscriptionId = req.user?.activeOrganizationSubscriptionId || '';
        const body = req.body;
        if (body.type === 'MULTIAGENT') {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Error: chatflowsController.saveChatflow - creating new V1 Agentflows (MULTIAGENT) is no longer supported, use AGENTFLOW instead');
        }
        const existingChatflowCount = await chatflows_1.default.getAllChatflowsCountByOrganization(body.type, orgId);
        const newChatflowCount = 1;
        await (0, quotaUsage_1.checkUsageLimit)('flows', subscriptionId, (0, getRunningExpressApp_1.getRunningExpressApp)().usageCacheManager, existingChatflowCount + newChatflowCount);
        const newChatFlow = new ChatFlow_1.ChatFlow();
        Object.assign(newChatFlow, (0, stripProtectedFields_1.stripProtectedFields)(body));
        newChatFlow.workspaceId = workspaceId;
        const apiResponse = await chatflows_1.default.saveChatflow(newChatFlow, orgId, workspaceId, subscriptionId, (0, getRunningExpressApp_1.getRunningExpressApp)().usageCacheManager);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const updateChatflow = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: chatflowsController.updateChatflow - id not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: chatflowsController.saveChatflow - workspace ${workspaceId} not found!`);
        }
        const chatflow = await chatflows_1.default.getChatflowById(req.params.id, workspaceId);
        if (!chatflow) {
            return res.status(404).send('Chatflow not found');
        }
        const orgId = req.user?.activeOrganizationId;
        if (!orgId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: chatflowsController.saveChatflow - organization ${orgId} not found!`);
        }
        const subscriptionId = req.user?.activeOrganizationSubscriptionId || '';
        const body = req.body;
        const updateChatFlow = new ChatFlow_1.ChatFlow();
        Object.assign(updateChatFlow, (0, stripProtectedFields_1.stripProtectedFields)(body));
        updateChatFlow.id = chatflow.id;
        const rateLimiterManager = rateLimit_1.RateLimiterManager.getInstance();
        await rateLimiterManager.updateRateLimiter(updateChatFlow);
        const apiResponse = await chatflows_1.default.updateChatflow(chatflow, updateChatFlow, orgId, workspaceId, subscriptionId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getSinglePublicChatflow = async (req, res, next) => {
    let queryRunner;
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: chatflowsController.getSinglePublicChatflow - id not provided!`);
        }
        const chatflow = await chatflows_1.default.getChatflowById(req.params.id);
        if (!chatflow)
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ message: 'Chatflow not found' });
        if (chatflow.isPublic)
            return res.status(http_status_codes_1.StatusCodes.OK).json({ ...chatflow, flowData: (0, sanitizeFlowData_1.sanitizeFlowDataForPublicEndpoint)(chatflow.flowData) });
        if (!req.user)
            return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized" /* GeneralErrorMessage.UNAUTHORIZED */ });
        queryRunner = (0, getRunningExpressApp_1.getRunningExpressApp)().AppDataSource.createQueryRunner();
        const workspaceUserService = new workspace_user_service_1.WorkspaceUserService();
        const workspaceUser = await workspaceUserService.readWorkspaceUserByUserId(req.user.id, queryRunner);
        if (workspaceUser.length === 0)
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ message: "Workspace User Not Found" /* WorkspaceUserErrorMessage.WORKSPACE_USER_NOT_FOUND */ });
        const workspaceIds = workspaceUser.map((user) => user.workspaceId);
        if (!workspaceIds.includes(chatflow.workspaceId))
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ message: 'You are not in the workspace that owns this chatflow' });
        return res.status(http_status_codes_1.StatusCodes.OK).json(chatflow);
    }
    catch (error) {
        next(error);
    }
    finally {
        if (queryRunner)
            await queryRunner.release();
    }
};
const getSinglePublicChatbotConfig = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: chatflowsController.getSinglePublicChatbotConfig - id not provided!`);
        }
        const apiResponse = await chatflows_1.default.getSinglePublicChatbotConfig(req.params.id);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const checkIfChatflowHasChanged = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: chatflowsController.checkIfChatflowHasChanged - id not provided!`);
        }
        if (!req.params.lastUpdatedDateTime) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: chatflowsController.checkIfChatflowHasChanged - lastUpdatedDateTime not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Error: chatflowsController.checkIfChatflowHasChanged - active workspace ID not found!');
        }
        const apiResponse = await chatflows_1.default.checkIfChatflowHasChanged(req.params.id, req.params.lastUpdatedDateTime, workspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getCredentialAccessWarnings = async (req, res, next) => {
    try {
        if (!req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: chatflowsController.getCredentialAccessWarnings - id not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: chatflowsController.getCredentialAccessWarnings - workspace not found!`);
        }
        const apiResponse = await credential_access_1.default.getCredentialAccessWarnings(req.params.id, workspaceId, req.user?.id);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const setWebhookSecret = async (req, res, next) => {
    try {
        if (!req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: chatflowsController.setWebhookSecret - id not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.UNAUTHORIZED, `Error: chatflowsController.setWebhookSecret - workspace not found!`);
        }
        const apiResponse = await chatflows_1.default.setWebhookSecret(req.params.id, workspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const clearWebhookSecret = async (req, res, next) => {
    try {
        if (!req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: chatflowsController.clearWebhookSecret - id not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.UNAUTHORIZED, `Error: chatflowsController.clearWebhookSecret - workspace not found!`);
        }
        await chatflows_1.default.clearWebhookSecret(req.params.id, workspaceId);
        return res.sendStatus(http_status_codes_1.StatusCodes.NO_CONTENT);
    }
    catch (error) {
        next(error);
    }
};
const getScheduleStatus = async (req, res, next) => {
    try {
        if (!req.params?.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, 'Error: chatflowsController.getScheduleStatus - id not provided!');
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Error: chatflowsController.getScheduleStatus - workspace not found!');
        }
        const status = await schedule_1.default.getScheduleStatus(req.params.id, workspaceId);
        return res.json({
            enabled: status.record?.enabled ?? false,
            canEnable: status.canEnable,
            reason: status.reason,
            record: status.record
        });
    }
    catch (error) {
        next(error);
    }
};
const getScheduleTriggerLogs = async (req, res, next) => {
    try {
        if (!req.params?.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, 'Error: chatflowsController.getScheduleTriggerLogs - id not provided!');
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Error: chatflowsController.getScheduleTriggerLogs - workspace not found!');
        }
        const page = req.query.page ? parseInt(String(req.query.page), 10) : undefined;
        const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
        const statusRaw = req.query.status;
        const status = Array.isArray(statusRaw) ? statusRaw : statusRaw ? String(statusRaw) : undefined;
        const result = await schedule_1.default.getTriggerLogs(req.params.id, workspaceId, { page, limit, status });
        return res.json(result);
    }
    catch (error) {
        next(error);
    }
};
const deleteScheduleTriggerLogs = async (req, res, next) => {
    try {
        if (!req.params?.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, 'Error: chatflowsController.deleteScheduleTriggerLogs - id not provided!');
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Error: chatflowsController.deleteScheduleTriggerLogs - workspace not found!');
        }
        const logIds = req.body?.logIds;
        if (!Array.isArray(logIds) || logIds.some((x) => typeof x !== 'string')) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'logIds must be a string[]');
        }
        const result = await schedule_1.default.deleteTriggerLogs(req.params.id, workspaceId, logIds);
        return res.json(result);
    }
    catch (error) {
        next(error);
    }
};
const toggleScheduleEnabled = async (req, res, next) => {
    try {
        if (!req.params?.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, 'Error: chatflowsController.toggleScheduleEnabled - id not provided!');
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Error: chatflowsController.toggleScheduleEnabled - workspace not found!');
        }
        const { enabled } = req.body;
        if (typeof enabled !== 'boolean') {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, '"enabled" must be a boolean');
        }
        const record = await schedule_1.default.toggleScheduleEnabled(req.params.id, workspaceId, enabled);
        await ScheduleBeat_1.ScheduleBeat.getInstance().onScheduleChanged(record.id, enabled ? 'upsert' : 'delete');
        return res.json(record);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    checkIfChatflowIsValidForStreaming,
    checkIfChatflowIsValidForUploads,
    deleteChatflow,
    getAllChatflows,
    getChatflowByApiKey,
    getChatflowById,
    saveChatflow,
    updateChatflow,
    getSinglePublicChatflow,
    getSinglePublicChatbotConfig,
    checkIfChatflowHasChanged,
    setWebhookSecret,
    getCredentialAccessWarnings,
    clearWebhookSecret,
    getScheduleStatus,
    getScheduleTriggerLogs,
    deleteScheduleTriggerLogs,
    toggleScheduleEnabled
};
//# sourceMappingURL=index.js.map