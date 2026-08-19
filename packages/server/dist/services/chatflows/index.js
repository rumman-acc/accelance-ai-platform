"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateChatflowType = validateChatflowType;
const crypto_1 = require("crypto");
const accelance_components_1 = require("accelance-components");
const http_status_codes_1 = require("http-status-codes");
const typeorm_1 = require("typeorm");
const uuid_1 = require("uuid");
const Interface_Metrics_1 = require("../../Interface.Metrics");
const ChatFlow_1 = require("../../database/entities/ChatFlow");
const ChatMessage_1 = require("../../database/entities/ChatMessage");
const ChatMessageFeedback_1 = require("../../database/entities/ChatMessageFeedback");
const ScheduleRecord_1 = require("../../database/entities/ScheduleRecord");
const UpsertHistory_1 = require("../../database/entities/UpsertHistory");
const workspace_entity_1 = require("../../enterprise/database/entities/workspace.entity");
const ControllerServiceUtils_1 = require("../../enterprise/utils/ControllerServiceUtils");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const utils_1 = require("../../errors/utils");
const ScheduleBeat_1 = require("../../schedule/ScheduleBeat");
const documentstore_1 = __importDefault(require("../../services/documentstore"));
const schedule_1 = __importDefault(require("../../services/schedule"));
const utils_2 = require("../../utils");
const fileRepository_1 = require("../../utils/fileRepository");
const redisCache_1 = require("../../utils/redisCache");
const CHATFLOWS_LIST_CACHE_PREFIX = 'chatflows:list:';
const CHATFLOWS_LIST_CACHE_TTL_SECONDS = 30;
const fileValidation_1 = require("../../utils/fileValidation");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const getUploadsConfig_1 = require("../../utils/getUploadsConfig");
const logger_1 = __importDefault(require("../../utils/logger"));
const quotaUsage_1 = require("../../utils/quotaUsage");
const sanitizeFlowData_1 = require("../../utils/sanitizeFlowData");
function validateChatflowType(type) {
    if (!Object.values(ChatFlow_1.EnumChatflowType).includes(type))
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid Chatflow Type" /* ChatflowErrorMessage.INVALID_CHATFLOW_TYPE */);
}
// Check if chatflow valid for streaming
const checkIfChatflowIsValidForStreaming = async (chatflowId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        //**
        const chatflow = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).findOneBy({
            id: chatflowId
        });
        if (!chatflow) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Chatflow ${chatflowId} not found`);
        }
        /* Check for post-processing settings, if available isStreamValid is always false */
        let chatflowConfig = {};
        if (chatflow.chatbotConfig) {
            chatflowConfig = JSON.parse(chatflow.chatbotConfig);
            if (chatflowConfig?.postProcessing?.enabled === true) {
                return { isStreaming: false };
            }
        }
        if (chatflow.type === 'AGENTFLOW') {
            return { isStreaming: true };
        }
        /*** Get Ending Node with Directed Graph  ***/
        const flowData = chatflow.flowData;
        const parsedFlowData = JSON.parse(flowData);
        const nodes = parsedFlowData.nodes;
        const edges = parsedFlowData.edges;
        const { graph, nodeDependencies } = (0, utils_2.constructGraphs)(nodes, edges);
        const endingNodes = (0, utils_2.getEndingNodes)(nodeDependencies, graph, nodes);
        let isStreaming = false;
        for (const endingNode of endingNodes) {
            const endingNodeData = endingNode.data;
            const isEndingNode = endingNodeData?.outputs?.output === 'EndingNode';
            // Once custom function ending node exists, flow is always unavailable to stream
            if (isEndingNode) {
                return { isStreaming: false };
            }
            isStreaming = (0, utils_2.isFlowValidForStream)(nodes, endingNodeData);
        }
        // If it is a Multi/Sequential Agents, always enable streaming
        if (endingNodes.filter((node) => node.data.category === 'Multi Agents' || node.data.category === 'Sequential Agents').length > 0) {
            return { isStreaming: true };
        }
        const dbResponse = { isStreaming: isStreaming };
        return dbResponse;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatflowsService.checkIfChatflowIsValidForStreaming - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
// Check if chatflow valid for uploads
const checkIfChatflowIsValidForUploads = async (chatflowId) => {
    try {
        const dbResponse = await (0, getUploadsConfig_1.utilGetUploadsConfig)(chatflowId);
        return dbResponse;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatflowsService.checkIfChatflowIsValidForUploads - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const deleteChatflow = async (chatflowId, orgId, workspaceId, userPermittedTypes) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const chatflow = await getChatflowById(chatflowId, workspaceId);
        if (!userPermittedTypes.includes(chatflow.type))
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.FORBIDDEN, `You do not have permission to delete this chatflow type`);
        const dbResponse = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).delete({ id: chatflowId });
        // Update document store usage
        await documentstore_1.default.updateDocumentStoreUsage(chatflowId, undefined, workspaceId);
        // Delete all chat messages
        await appServer.AppDataSource.getRepository(ChatMessage_1.ChatMessage).delete({ chatflowid: chatflowId });
        // Delete all chat feedback
        await appServer.AppDataSource.getRepository(ChatMessageFeedback_1.ChatMessageFeedback).delete({ chatflowid: chatflowId });
        // Delete all upsert history
        await appServer.AppDataSource.getRepository(UpsertHistory_1.UpsertHistory).delete({ chatflowid: chatflowId });
        // delete schedules related to the chatflow if it's an agentflow
        if (chatflow.type === ChatFlow_1.EnumChatflowType.AGENTFLOW) {
            const existingRecord = await schedule_1.default.deleteScheduleForTarget(chatflow.id, ScheduleRecord_1.ScheduleTriggerType.AGENTFLOW, workspaceId);
            if (existingRecord) {
                await ScheduleBeat_1.ScheduleBeat.getInstance().onScheduleChanged(existingRecord.id, 'delete');
            }
        }
        try {
            // Delete all uploads corresponding to this chatflow
            const { totalSize } = await (0, accelance_components_1.removeFolderFromStorage)(orgId, chatflowId);
            await (0, quotaUsage_1.updateStorageUsage)(orgId, workspaceId, totalSize, appServer.usageCacheManager);
        }
        catch (e) {
            logger_1.default.error(`[server]: Error deleting file storage for chatflow ${chatflowId}`);
        }
        await (0, redisCache_1.invalidateByPrefix)(CHATFLOWS_LIST_CACHE_PREFIX);
        return dbResponse;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatflowsService.deleteChatflow - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
// The list pages (Chatflows/Agentflows) only need this to render node-icon previews and to
// know which flows are schedule-triggered — not the full graph. Computed once here, server-side,
// so `flowData` (often the single largest column, sometimes 1MB+) never has to leave Postgres for
// a list view. Opening a specific flow in the canvas still goes through getChatflowById, which is
// unaffected and continues to return full flowData on demand.
const summarizeFlowDataForList = (flowDataStr) => {
    try {
        const flowData = JSON.parse(flowDataStr);
        const nodes = flowData.nodes || [];
        const nodeIcons = [];
        let isScheduleFlow = false;
        for (const node of nodes) {
            const nodeName = node.data?.name;
            if (!nodeName || nodeName === 'stickyNote' || nodeName === 'stickyNoteAgentflow')
                continue;
            if (nodeName === 'startAgentflow' && node.data?.inputs?.startInputType === 'scheduleInput') {
                isScheduleFlow = true;
            }
            if (!nodeIcons.some((n) => n.nodeName === nodeName)) {
                nodeIcons.push({ nodeName, label: node.data?.label });
            }
        }
        return { nodeIcons, isScheduleFlow };
    }
    catch {
        return { nodeIcons: [], isScheduleFlow: false };
    }
};
// Accepts either a single type ('AGENTFLOW') or a comma-separated list ('AGENTFLOW,MULTIAGENT') -
// the latter is used by the Agentflows list page to show both v2 and legacy v1 flows together.
const getAllChatflows = async (type, workspaceId, page = -1, limit = -1) => {
    const cacheKey = `${CHATFLOWS_LIST_CACHE_PREFIX}${workspaceId ?? 'none'}:${type ?? 'all'}:${page}:${limit}`;
    const cached = await (0, redisCache_1.getCached)(cacheKey);
    if (cached)
        return cached;
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const queryBuilder = appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow)
            .createQueryBuilder('chat_flow')
            .orderBy('chat_flow.updatedDate', 'DESC');
        if (page > 0 && limit > 0) {
            queryBuilder.skip((page - 1) * limit);
            queryBuilder.take(limit);
        }
        const types = type
            ? type
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)
            : [];
        if (types.length > 1) {
            queryBuilder.andWhere('chat_flow.type IN (:...types)', { types });
        }
        else if (types[0] === 'MULTIAGENT') {
            queryBuilder.andWhere('chat_flow.type = :type', { type: 'MULTIAGENT' });
        }
        else if (types[0] === 'AGENTFLOW') {
            queryBuilder.andWhere('chat_flow.type = :type', { type: 'AGENTFLOW' });
        }
        else if (types[0] === 'ASSISTANT') {
            queryBuilder.andWhere('chat_flow.type = :type', { type: 'ASSISTANT' });
        }
        else if (types[0] === 'CHATFLOW') {
            // fetch all chatflows that are not agentflow
            queryBuilder.andWhere('chat_flow.type = :type', { type: 'CHATFLOW' });
        }
        if (workspaceId)
            queryBuilder.andWhere('chat_flow.workspaceId = :workspaceId', { workspaceId });
        const [rawData, total] = await queryBuilder.getManyAndCount();
        const data = rawData.map((chatflow) => {
            const { nodeIcons, isScheduleFlow } = summarizeFlowDataForList(chatflow.flowData);
            const summarized = { ...chatflow, nodeIcons, isScheduleFlow };
            delete summarized.flowData;
            return summarized;
        });
        const result = page > 0 && limit > 0 ? { data, total } : data;
        await (0, redisCache_1.setCached)(cacheKey, result, CHATFLOWS_LIST_CACHE_TTL_SECONDS);
        return result;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatflowsService.getAllChatflows - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
async function getAllChatflowsCountByOrganization(type, organizationId) {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const workspaces = await appServer.AppDataSource.getRepository(workspace_entity_1.Workspace).findBy({ organizationId });
        const workspaceIds = workspaces.map((workspace) => workspace.id);
        const chatflowsCount = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).countBy({
            type,
            workspaceId: (0, typeorm_1.In)(workspaceIds)
        });
        return chatflowsCount;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatflowsService.getAllChatflowsCountByOrganization - ${(0, utils_1.getErrorMessage)(error)}`);
    }
}
const getAllChatflowsCount = async (type, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        if (type) {
            const dbResponse = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).countBy({
                type,
                ...(0, ControllerServiceUtils_1.getWorkspaceSearchOptions)(workspaceId)
            });
            return dbResponse;
        }
        const dbResponse = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).countBy((0, ControllerServiceUtils_1.getWorkspaceSearchOptions)(workspaceId));
        return dbResponse;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatflowsService.getAllChatflowsCount - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const getChatflowByApiKey = async (apiKeyId, workspaceId, keyonly) => {
    try {
        // Here we only get chatflows that are bounded by the apikeyid and chatflows that are not bounded by any apikey
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        let query = appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow)
            .createQueryBuilder('cf')
            .where('cf.workspaceId = :workspaceId', { workspaceId })
            .andWhere(new typeorm_1.Brackets((qb) => {
            qb.where('cf.apikeyid = :apikeyid', { apikeyid: apiKeyId });
            if (keyonly === undefined) {
                qb.orWhere('cf.apikeyid IS NULL').orWhere('cf.apikeyid = ""');
            }
        }));
        const dbResponse = await query.orderBy('cf.name', 'ASC').getMany();
        if (dbResponse.length < 1) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Chatflow not found in the database!`);
        }
        return dbResponse;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatflowsService.getChatflowByApiKey - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const getChatflowById = async (chatflowId, workspaceId) => {
    try {
        if (!(0, uuid_1.validate)(chatflowId)) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid Chatflow ID" /* ChatflowErrorMessage.INVALID_CHATFLOW_ID */);
        }
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const dbResponse = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).findOne({
            where: {
                id: chatflowId,
                ...(workspaceId ? { workspaceId } : {})
            }
        });
        if (!dbResponse) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Chatflow ${chatflowId} not found in the database!`);
        }
        return dbResponse;
    }
    catch (error) {
        if (error instanceof internalAccelanceError_1.InternalAccelanceError) {
            throw error;
        }
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatflowsService.getChatflowById - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
/** Resolves a chatflow only if it belongs to the given workspace; rejects when workspaceId is missing (prevents unscoped lookup). */
const getChatflowByIdForWorkspace = async (chatflowId, workspaceId) => {
    if (!workspaceId) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Workspace ID is required" /* ChatflowErrorMessage.WORKSPACE_ID_REQUIRED */);
    }
    return getChatflowById(chatflowId, workspaceId);
};
/** Ensures every id exists as a chatflow in workspaceId. One DB query; pass queryRunner when inside a transaction for consistent reads. */
const assertChatflowIdsInWorkspace = async (chatflowIds, workspaceId, queryRunner) => {
    try {
        if (chatflowIds.length === 0)
            return;
        for (const id of chatflowIds) {
            if (!(0, uuid_1.validate)(id)) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid Chatflow ID" /* ChatflowErrorMessage.INVALID_CHATFLOW_ID */);
            }
        }
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const manager = queryRunner?.manager ?? appServer.AppDataSource.manager;
        const found = await manager.getRepository(ChatFlow_1.ChatFlow).find({
            where: { id: (0, typeorm_1.In)(chatflowIds), workspaceId },
            select: ['id']
        });
        if (found.length !== chatflowIds.length) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Error: chatflowsService.assertChatflowIdsInWorkspace - one or more chatflows were not found in the workspace!');
        }
    }
    catch (error) {
        if (error instanceof internalAccelanceError_1.InternalAccelanceError) {
            throw error;
        }
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatflowsService.assertChatflowIdsInWorkspace - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const saveChatflow = async (newChatFlow, orgId, workspaceId, subscriptionId, usageCacheManager) => {
    validateChatflowType(newChatFlow.type);
    const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
    let dbResponse;
    if ((0, fileRepository_1.containsBase64File)(newChatFlow)) {
        // we need a 2-step process, as we need to save the chatflow first and then update the file paths
        // this is because we need the chatflow id to create the file paths
        // step 1 - save with empty flowData
        const incomingFlowData = newChatFlow.flowData;
        newChatFlow.flowData = JSON.stringify({});
        const chatflow = appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).create(newChatFlow);
        const step1Results = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).save(chatflow);
        // step 2 - convert base64 to file paths and update the chatflow
        step1Results.flowData = await (0, fileRepository_1.updateFlowDataWithFilePaths)(step1Results.id, incomingFlowData, orgId, workspaceId, subscriptionId, usageCacheManager);
        await _checkAndUpdateDocumentStoreUsage(step1Results, newChatFlow.workspaceId);
        dbResponse = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).save(step1Results);
    }
    else {
        const chatflow = appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).create(newChatFlow);
        dbResponse = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).save(chatflow);
    }
    // Check if the flow is agentflow and if it has a schedule node, if yes then notify the beat to sync the schedule
    if (dbResponse.type === ChatFlow_1.EnumChatflowType.AGENTFLOW) {
        /*** Get chatflows and prepare data  ***/
        const flowData = dbResponse.flowData;
        const parsedFlowData = JSON.parse(flowData);
        const nodes = (parsedFlowData.nodes || []).filter((node) => node.data.name !== 'stickyNoteAgentflow');
        const startNode = nodes.find((node) => node.data.name === 'startAgentflow');
        const startInputType = startNode?.data?.inputs?.startInputType;
        if (startInputType === 'scheduleInput') {
            const scheduleInputMode = startNode?.data?.inputs?.scheduleInputMode;
            if (!scheduleInputMode) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Schedule Input Mode is required on the Start node when Start Input Type is Schedule.');
            }
            const resolvedCron = schedule_1.default.resolveScheduleCron(startNode?.data?.inputs || {});
            const scheduleTimezone = startNode?.data?.inputs?.scheduleTimezone || 'UTC';
            const scheduleDefaultInput = startNode?.data?.inputs?.scheduleDefaultInput || '';
            const scheduleFormDefaultsRaw = startNode?.data?.inputs?.scheduleFormDefaults;
            const scheduleFormDefaults = scheduleInputMode === 'form'
                ? typeof scheduleFormDefaultsRaw === 'string'
                    ? scheduleFormDefaultsRaw
                    : JSON.stringify(scheduleFormDefaultsRaw ?? {})
                : undefined;
            const scheduleEndDate = startNode?.data?.inputs?.scheduleEndDate ? new Date(startNode.data.inputs.scheduleEndDate) : undefined;
            const enabled = schedule_1.default.canScheduleEnable(startNode?.data?.inputs ?? {});
            const record = await schedule_1.default.createOrUpdateSchedule({
                triggerType: ScheduleRecord_1.ScheduleTriggerType.AGENTFLOW,
                targetId: dbResponse.id,
                nodeId: startNode?.id,
                cronExpression: resolvedCron.cronExpression || '',
                timezone: scheduleTimezone,
                enabled: enabled,
                scheduleInputMode,
                defaultInput: scheduleInputMode === 'text' ? scheduleDefaultInput : '',
                defaultForm: scheduleFormDefaults,
                workspaceId,
                endDate: scheduleEndDate
            });
            if (enabled) {
                // Notify the beat to sync the schedule
                await ScheduleBeat_1.ScheduleBeat.getInstance().onScheduleChanged(record.id, 'upsert');
            }
        }
    }
    const productId = await appServer.identityManager.getProductIdFromSubscription(subscriptionId);
    await appServer.telemetry.sendTelemetry('chatflow_created', {
        version: await (0, utils_2.getAppVersion)(),
        chatflowId: dbResponse.id,
        flowGraph: (0, utils_2.getTelemetryFlowObj)(JSON.parse(dbResponse.flowData)?.nodes, JSON.parse(dbResponse.flowData)?.edges),
        productId,
        subscriptionId
    }, orgId);
    appServer.metricsProvider?.incrementCounter(dbResponse?.type === 'MULTIAGENT' ? Interface_Metrics_1.ACCELANCE_METRIC_COUNTERS.AGENTFLOW_CREATED : Interface_Metrics_1.ACCELANCE_METRIC_COUNTERS.CHATFLOW_CREATED, { status: Interface_Metrics_1.ACCELANCE_COUNTER_STATUS.SUCCESS });
    await (0, redisCache_1.invalidateByPrefix)(CHATFLOWS_LIST_CACHE_PREFIX);
    return dbResponse;
};
const updateChatflow = async (chatflow, updateChatFlow, orgId, workspaceId, subscriptionId) => {
    const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
    if (updateChatFlow.flowData && (0, fileRepository_1.containsBase64File)(updateChatFlow)) {
        updateChatFlow.flowData = await (0, fileRepository_1.updateFlowDataWithFilePaths)(chatflow.id, updateChatFlow.flowData, orgId, workspaceId, subscriptionId, appServer.usageCacheManager);
    }
    if (updateChatFlow.type || updateChatFlow.type === '') {
        validateChatflowType(updateChatFlow.type);
    }
    else {
        updateChatFlow.type = chatflow.type;
    }
    if (updateChatFlow.chatbotConfig) {
        try {
            const parsed = JSON.parse(updateChatFlow.chatbotConfig);
            if (parsed?.fullFileUpload?.allowedUploadFileTypes !== undefined) {
                const current = parsed.fullFileUpload.allowedUploadFileTypes;
                const sanitized = (0, fileValidation_1.sanitizeAllowedUploadMimeTypesFromConfig)(typeof current === 'string' ? current : String(current ?? ''));
                parsed.fullFileUpload.allowedUploadFileTypes = sanitized;
                updateChatFlow.chatbotConfig = JSON.stringify(parsed);
            }
        }
        catch (error) {
            const message = (0, utils_1.getErrorMessage)(error);
            logger_1.default.error(`[server]: Invalid chatbotConfig JSON in updateChatflow: ${message}`);
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, `Invalid chatbotConfig: ${message}`);
        }
    }
    const newDbChatflow = appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).merge(chatflow, updateChatFlow);
    newDbChatflow.workspaceId = workspaceId; // defense-in-depth: use trusted param, not chatflow.workspaceId (merge mutates in-place)
    await _checkAndUpdateDocumentStoreUsage(newDbChatflow, workspaceId);
    const dbResponse = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).save(newDbChatflow);
    // Check if the flow is agentflow and if it has a schedule node, if yes then notify the beat to sync the schedule
    if (dbResponse.type === ChatFlow_1.EnumChatflowType.AGENTFLOW) {
        const flowData = dbResponse.flowData;
        const parsedFlowData = JSON.parse(flowData);
        const nodes = (parsedFlowData.nodes || []).filter((node) => node.data.name !== 'stickyNoteAgentflow');
        const startNode = nodes.find((node) => node.data.name === 'startAgentflow');
        const startInputType = startNode?.data?.inputs?.startInputType;
        if (startInputType === 'scheduleInput') {
            const scheduleInputMode = startNode?.data?.inputs?.scheduleInputMode;
            if (!scheduleInputMode) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Schedule Input Mode is required on the Start node when Start Input Type is Schedule.');
            }
            const resolvedCron = schedule_1.default.resolveScheduleCron(startNode?.data?.inputs || {});
            const scheduleTimezone = startNode?.data?.inputs?.scheduleTimezone || 'UTC';
            const scheduleDefaultInput = startNode?.data?.inputs?.scheduleDefaultInput || '';
            const scheduleFormDefaultsRaw = startNode?.data?.inputs?.scheduleFormDefaults;
            const scheduleFormDefaults = scheduleInputMode === 'form'
                ? typeof scheduleFormDefaultsRaw === 'string'
                    ? scheduleFormDefaultsRaw
                    : JSON.stringify(scheduleFormDefaultsRaw ?? {})
                : undefined;
            const scheduleEndDate = startNode?.data?.inputs?.scheduleEndDate ? new Date(startNode.data.inputs.scheduleEndDate) : undefined;
            const canEnable = schedule_1.default.canScheduleEnable(startNode?.data?.inputs ?? {});
            const record = await schedule_1.default.createOrUpdateSchedule({
                triggerType: ScheduleRecord_1.ScheduleTriggerType.AGENTFLOW,
                targetId: dbResponse.id,
                nodeId: startNode?.id,
                cronExpression: resolvedCron.cronExpression || '',
                timezone: scheduleTimezone,
                enabled: canEnable === false ? false : undefined, // automatically disable schedule if it cannot be enabled; otherwise preserve the existing enabled value
                scheduleInputMode,
                defaultInput: scheduleInputMode === 'text' ? scheduleDefaultInput : '',
                defaultForm: scheduleFormDefaults,
                workspaceId,
                endDate: scheduleEndDate
            });
            if (record.enabled) {
                // Notify the beat to sync the (enabled) schedule
                await ScheduleBeat_1.ScheduleBeat.getInstance().onScheduleChanged(record.id, 'upsert');
            }
            else {
                // Schedule is disabled; ensure any existing scheduled job is removed
                await ScheduleBeat_1.ScheduleBeat.getInstance().onScheduleChanged(record.id, 'delete');
            }
        }
        else {
            // If the start node is not scheduleInput, then we need to delete the existing schedule if it exists
            const existingRecord = await schedule_1.default.deleteScheduleForTarget(dbResponse.id, ScheduleRecord_1.ScheduleTriggerType.AGENTFLOW, workspaceId);
            if (existingRecord) {
                await ScheduleBeat_1.ScheduleBeat.getInstance().onScheduleChanged(existingRecord.id, 'delete');
            }
        }
    }
    await (0, redisCache_1.invalidateByPrefix)(CHATFLOWS_LIST_CACHE_PREFIX);
    return dbResponse;
};
// Get specific chatflow chatbotConfig via id (PUBLIC endpoint, used to retrieve config for embedded chat)
// flowData is sanitized before returning — password, file, folder inputs and credential references are stripped
const getSinglePublicChatbotConfig = async (chatflowId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const dbResponse = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).findOneBy({
            id: chatflowId
        });
        if (!dbResponse) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Chatflow ${chatflowId} not found`);
        }
        const uploadsConfig = await (0, getUploadsConfig_1.utilGetUploadsConfig)(chatflowId);
        // even if chatbotConfig is not set but uploads are enabled
        // send uploadsConfig to the chatbot
        if (dbResponse.chatbotConfig || uploadsConfig) {
            try {
                const parsedConfig = dbResponse.chatbotConfig ? JSON.parse(dbResponse.chatbotConfig) : {};
                const ttsConfig = typeof dbResponse.textToSpeech === 'string' ? JSON.parse(dbResponse.textToSpeech) : dbResponse.textToSpeech;
                let isTTSEnabled = false;
                if (ttsConfig) {
                    Object.keys(ttsConfig).forEach((provider) => {
                        if (provider !== 'none' && ttsConfig?.[provider]?.status) {
                            isTTSEnabled = true;
                        }
                    });
                }
                delete parsedConfig.allowedOrigins;
                delete parsedConfig.allowedOriginsError;
                return {
                    ...parsedConfig,
                    uploads: uploadsConfig,
                    flowData: (0, sanitizeFlowData_1.sanitizeFlowDataForPublicEndpoint)(dbResponse.flowData),
                    isTTSEnabled
                };
            }
            catch (e) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error parsing Chatbot Config for Chatflow ${chatflowId}`);
            }
        }
        return 'OK';
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatflowsService.getSinglePublicChatbotConfig - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const _checkAndUpdateDocumentStoreUsage = async (chatflow, workspaceId) => {
    const parsedFlowData = JSON.parse(chatflow.flowData);
    const nodes = parsedFlowData.nodes;
    // from the nodes array find if there is a node with name == documentStore)
    const node = nodes.length > 0 && nodes.find((node) => node.data.name === 'documentStore');
    if (!node || !node.data || !node.data.inputs || node.data.inputs['selectedStore'] === undefined) {
        await documentstore_1.default.updateDocumentStoreUsage(chatflow.id, undefined, workspaceId);
    }
    else {
        await documentstore_1.default.updateDocumentStoreUsage(chatflow.id, node.data.inputs['selectedStore'], workspaceId);
    }
};
const checkIfChatflowHasChanged = async (chatflowId, lastUpdatedDateTime, workspaceId) => {
    try {
        const chatflow = await getChatflowByIdForWorkspace(chatflowId, workspaceId);
        if (!chatflow) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Chatflow ${chatflowId} not found`);
        }
        return { hasChanged: chatflow.updatedDate.toISOString() !== lastUpdatedDateTime };
    }
    catch (error) {
        if (error instanceof internalAccelanceError_1.InternalAccelanceError) {
            throw error;
        }
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatflowsService.checkIfChatflowHasChanged - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const setWebhookSecret = async (chatflowId, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const repo = appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow);
        const chatflow = await repo.findOne({ where: { id: chatflowId, workspaceId } });
        if (!chatflow)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Chatflow ${chatflowId} not found`);
        const plaintext = (0, crypto_1.randomBytes)(32).toString('hex');
        chatflow.webhookSecret = await (0, utils_2.encryptCredentialData)({ secret: plaintext });
        chatflow.webhookSecretConfigured = true;
        await repo.save(chatflow);
        return { webhookSecret: plaintext };
    }
    catch (error) {
        if (error instanceof internalAccelanceError_1.InternalAccelanceError)
            throw error;
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatflowsService.setWebhookSecret - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const clearWebhookSecret = async (chatflowId, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const repo = appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow);
        const chatflow = await repo.findOne({ where: { id: chatflowId, workspaceId } });
        if (!chatflow)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Chatflow ${chatflowId} not found`);
        chatflow.webhookSecret = null;
        chatflow.webhookSecretConfigured = false;
        await repo.save(chatflow);
    }
    catch (error) {
        if (error instanceof internalAccelanceError_1.InternalAccelanceError)
            throw error;
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatflowsService.clearWebhookSecret - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const getWebhookSecret = async (chatflowId, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const dbResponse = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow)
            .createQueryBuilder('chatflow')
            .select('chatflow.webhookSecret')
            .where('chatflow.id = :id', { id: chatflowId })
            .andWhere('chatflow.workspaceId = :workspaceId', { workspaceId })
            .getOne();
        const stored = dbResponse?.webhookSecret;
        if (!stored)
            return null;
        const decrypted = await (0, utils_2.decryptCredentialData)(stored);
        return decrypted?.secret ?? null;
    }
    catch (error) {
        if (error instanceof internalAccelanceError_1.InternalAccelanceError)
            throw error;
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatflowsService.getWebhookSecret - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
exports.default = {
    assertChatflowIdsInWorkspace,
    checkIfChatflowIsValidForStreaming,
    checkIfChatflowIsValidForUploads,
    deleteChatflow,
    getAllChatflows,
    getAllChatflowsCount,
    getChatflowByApiKey,
    getChatflowById,
    getChatflowByIdForWorkspace,
    saveChatflow,
    updateChatflow,
    getSinglePublicChatbotConfig,
    checkIfChatflowHasChanged,
    getAllChatflowsCountByOrganization,
    setWebhookSecret,
    clearWebhookSecret,
    getWebhookSecret
};
//# sourceMappingURL=index.js.map