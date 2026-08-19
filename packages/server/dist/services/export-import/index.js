"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const typeorm_1 = require("typeorm");
const uuid_1 = require("uuid");
const Assistant_1 = require("../../database/entities/Assistant");
const ChatFlow_1 = require("../../database/entities/ChatFlow");
const ChatMessage_1 = require("../../database/entities/ChatMessage");
const ChatMessageFeedback_1 = require("../../database/entities/ChatMessageFeedback");
const CustomTemplate_1 = require("../../database/entities/CustomTemplate");
const DocumentStore_1 = require("../../database/entities/DocumentStore");
const DocumentStoreFileChunk_1 = require("../../database/entities/DocumentStoreFileChunk");
const Execution_1 = require("../../database/entities/Execution");
const Tool_1 = require("../../database/entities/Tool");
const Variable_1 = require("../../database/entities/Variable");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const utils_1 = require("../../errors/utils");
const assistants_1 = __importDefault(require("../assistants"));
const chatflows_1 = __importDefault(require("../chatflows"));
const chat_messages_1 = __importDefault(require("../chat-messages"));
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const getChatMessage_1 = require("../../utils/getChatMessage");
const accelance_components_1 = require("accelance-components");
const path_1 = __importDefault(require("path"));
const quotaUsage_1 = require("../../utils/quotaUsage");
const documentstore_1 = __importDefault(require("../documentstore"));
const executions_1 = __importDefault(require("../executions"));
const marketplaces_1 = __importDefault(require("../marketplaces"));
const tools_1 = __importDefault(require("../tools"));
const variables_1 = __importDefault(require("../variables"));
const Interface_1 = require("../../Interface");
const sanitize_util_1 = require("../../utils/sanitize.util");
const convertExportInput = (body) => {
    try {
        if (!body || typeof body !== 'object')
            throw new Error('Invalid ExportInput object in request body');
        if (body.agentflow && typeof body.agentflow !== 'boolean')
            throw new Error('Invalid agentflow property in ExportInput object');
        if (body.agentflowv2 && typeof body.agentflowv2 !== 'boolean')
            throw new Error('Invalid agentflowv2 property in ExportInput object');
        if (body.assistant && typeof body.assistant !== 'boolean')
            throw new Error('Invalid assistant property in ExportInput object');
        if (body.chatflow && typeof body.chatflow !== 'boolean')
            throw new Error('Invalid chatflow property in ExportInput object');
        if (body.chat_message && typeof body.chat_message !== 'boolean')
            throw new Error('Invalid chat_message property in ExportInput object');
        if (body.chat_feedback && typeof body.chat_feedback !== 'boolean')
            throw new Error('Invalid chat_feedback property in ExportInput object');
        if (body.custom_template && typeof body.custom_template !== 'boolean')
            throw new Error('Invalid custom_template property in ExportInput object');
        if (body.document_store && typeof body.document_store !== 'boolean')
            throw new Error('Invalid document_store property in ExportInput object');
        if (body.execution && typeof body.execution !== 'boolean')
            throw new Error('Invalid execution property in ExportInput object');
        if (body.tool && typeof body.tool !== 'boolean')
            throw new Error('Invalid tool property in ExportInput object');
        if (body.variable && typeof body.variable !== 'boolean')
            throw new Error('Invalid variable property in ExportInput object');
        return body;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: exportImportService.convertExportInput - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const FileDefaultName = 'ExportData.json';
const exportData = async (exportInput, activeWorkspaceId) => {
    try {
        let AgentFlow = exportInput.agentflow === true ? await chatflows_1.default.getAllChatflows('MULTIAGENT', activeWorkspaceId) : [];
        AgentFlow = 'data' in AgentFlow ? AgentFlow.data : AgentFlow;
        let AgentFlowV2 = exportInput.agentflowv2 === true ? await chatflows_1.default.getAllChatflows('AGENTFLOW', activeWorkspaceId) : [];
        AgentFlowV2 = 'data' in AgentFlowV2 ? AgentFlowV2.data : AgentFlowV2;
        let AssistantCustom = exportInput.assistantCustom === true ? await assistants_1.default.getAllAssistants(activeWorkspaceId, 'CUSTOM') : [];
        let AssistantFlow = exportInput.assistantCustom === true ? await chatflows_1.default.getAllChatflows('ASSISTANT', activeWorkspaceId) : [];
        AssistantFlow = 'data' in AssistantFlow ? AssistantFlow.data : AssistantFlow;
        let AssistantOpenAI = exportInput.assistantOpenAI === true ? await assistants_1.default.getAllAssistants(activeWorkspaceId, 'OPENAI') : [];
        let AssistantAzure = exportInput.assistantAzure === true ? await assistants_1.default.getAllAssistants(activeWorkspaceId, 'AZURE') : [];
        let ChatFlow = exportInput.chatflow === true ? await chatflows_1.default.getAllChatflows('CHATFLOW', activeWorkspaceId) : [];
        ChatFlow = 'data' in ChatFlow ? ChatFlow.data : ChatFlow;
        let allChatflow = exportInput.chat_message === true || exportInput.chat_feedback === true
            ? await chatflows_1.default.getAllChatflows(undefined, activeWorkspaceId)
            : [];
        allChatflow = 'data' in allChatflow ? allChatflow.data : allChatflow;
        const chatflowIds = allChatflow.map((chatflow) => chatflow.id);
        let ChatMessage = exportInput.chat_message === true ? await chat_messages_1.default.getMessagesByChatflowIds(chatflowIds) : [];
        let ChatMessageFeedback = exportInput.chat_feedback === true ? await chat_messages_1.default.getMessagesFeedbackByChatflowIds(chatflowIds) : [];
        let CustomTemplate = exportInput.custom_template === true ? await marketplaces_1.default.getAllCustomTemplates(activeWorkspaceId) : [];
        let DocumentStore = exportInput.document_store === true ? await documentstore_1.default.getAllDocumentStores(activeWorkspaceId) : [];
        DocumentStore = 'data' in DocumentStore ? DocumentStore.data : DocumentStore;
        const documentStoreIds = DocumentStore.map((documentStore) => documentStore.id);
        let DocumentStoreFileChunk = exportInput.document_store === true
            ? await documentstore_1.default.getAllDocumentFileChunksByDocumentStoreIds(documentStoreIds)
            : [];
        const filters = { workspaceId: activeWorkspaceId };
        const { data: totalExecutions } = exportInput.execution === true ? await executions_1.default.getAllExecutions(filters) : { data: [] };
        let Execution = exportInput.execution === true ? totalExecutions : [];
        let Tool = exportInput.tool === true ? await tools_1.default.getAllTools(activeWorkspaceId) : [];
        Tool = 'data' in Tool ? Tool.data : Tool;
        let Variable = exportInput.variable === true ? await variables_1.default.getAllVariables(activeWorkspaceId) : [];
        Variable = 'data' in Variable ? Variable.data : Variable;
        return {
            FileDefaultName,
            AgentFlow,
            AgentFlowV2,
            AssistantCustom,
            AssistantFlow,
            AssistantOpenAI,
            AssistantAzure,
            ChatFlow,
            ChatMessage,
            ChatMessageFeedback,
            CustomTemplate,
            DocumentStore,
            DocumentStoreFileChunk,
            Execution,
            Tool,
            Variable
        };
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: exportImportService.exportData - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
async function replaceDuplicateIdsForChatFlow(queryRunner, originalData, chatflows) {
    try {
        const ids = chatflows.map((chatflow) => chatflow.id);
        const records = await queryRunner.manager.find(ChatFlow_1.ChatFlow, {
            where: { id: (0, typeorm_1.In)(ids) }
        });
        if (records.length < 0)
            return originalData;
        for (let record of records) {
            const oldId = record.id;
            const newId = (0, uuid_1.v4)();
            originalData = JSON.parse(JSON.stringify(originalData).replaceAll(oldId, newId));
        }
        return originalData;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: exportImportService.replaceDuplicateIdsForChatflow - ${(0, utils_1.getErrorMessage)(error)}`);
    }
}
async function replaceDuplicateIdsForAssistant(queryRunner, originalData, assistants) {
    try {
        const ids = assistants.map((assistant) => assistant.id);
        const records = await queryRunner.manager.find(Assistant_1.Assistant, {
            where: { id: (0, typeorm_1.In)(ids) }
        });
        if (records.length < 0)
            return originalData;
        for (let record of records) {
            const oldId = record.id;
            const newId = (0, uuid_1.v4)();
            originalData = JSON.parse(JSON.stringify(originalData).replaceAll(oldId, newId));
        }
        return originalData;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: exportImportService.replaceDuplicateIdsForAssistant - ${(0, utils_1.getErrorMessage)(error)}`);
    }
}
async function replaceDuplicateIdsForChatMessage(queryRunner, originalData, chatMessages, activeWorkspaceId) {
    try {
        const chatmessageChatflowIds = chatMessages.map((chatMessage) => {
            return { id: chatMessage.chatflowid, qty: 0 };
        });
        const originalDataChatflowIds = [
            ...originalData.AssistantFlow.map((assistantFlow) => assistantFlow.id),
            ...originalData.AgentFlow.map((agentFlow) => agentFlow.id),
            ...originalData.AgentFlowV2.map((agentFlowV2) => agentFlowV2.id),
            ...originalData.ChatFlow.map((chatFlow) => chatFlow.id)
        ];
        chatmessageChatflowIds.forEach((item) => {
            if (originalDataChatflowIds.includes(item.id)) {
                item.qty += 1;
            }
        });
        const databaseChatflowIds = await (await queryRunner.manager.find(ChatFlow_1.ChatFlow, {
            where: {
                id: (0, typeorm_1.In)(chatmessageChatflowIds.map((chatmessageChatflowId) => chatmessageChatflowId.id)),
                workspaceId: activeWorkspaceId
            }
        })).map((chatflow) => chatflow.id);
        chatmessageChatflowIds.forEach((item) => {
            if (databaseChatflowIds.includes(item.id)) {
                item.qty += 1;
            }
        });
        const missingChatflowIds = chatmessageChatflowIds.filter((item) => item.qty === 0).map((item) => item.id);
        if (missingChatflowIds.length > 0) {
            chatMessages = chatMessages.filter((chatMessage) => !missingChatflowIds.includes(chatMessage.chatflowid));
            originalData.ChatMessage = chatMessages;
        }
        const ids = chatMessages.map((chatMessage) => chatMessage.id);
        const records = await queryRunner.manager.find(ChatMessage_1.ChatMessage, {
            where: { id: (0, typeorm_1.In)(ids) }
        });
        if (records.length < 0)
            return originalData;
        // Replace duplicate ChatMessage ids found in db with new ids,
        // and update corresponding messageId references in ChatMessageFeedback
        const idMap = {};
        const dbExistingIds = new Set(records.map((record) => record.id));
        originalData.ChatMessage = originalData.ChatMessage.map((item) => {
            if (dbExistingIds.has(item.id)) {
                const newId = (0, uuid_1.v4)();
                idMap[item.id] = newId;
                return { ...item, id: newId };
            }
            return item;
        });
        originalData.ChatMessageFeedback = originalData.ChatMessageFeedback.map((item) => {
            if (idMap[item.messageId]) {
                return { ...item, messageId: idMap[item.messageId] };
            }
            return item;
        });
        return originalData;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: exportImportService.replaceDuplicateIdsForChatMessage - ${(0, utils_1.getErrorMessage)(error)}`);
    }
}
async function replaceExecutionIdForChatMessage(queryRunner, originalData, chatMessages, activeWorkspaceId) {
    try {
        // step 1 - get all execution ids from chatMessages
        const chatMessageExecutionIds = chatMessages
            .map((chatMessage) => {
            return { id: chatMessage.executionId, qty: 0 };
        })
            .filter((item) => item !== undefined);
        // step 2 - increase qty if execution id is in importData.Execution
        const originalDataExecutionIds = originalData.Execution.map((execution) => execution.id);
        chatMessageExecutionIds.forEach((item) => {
            if (originalDataExecutionIds.includes(item.id)) {
                item.qty += 1;
            }
        });
        // step 3 - increase qty if execution id is in database
        const databaseExecutionIds = await (await queryRunner.manager.find(Execution_1.Execution, {
            where: {
                id: (0, typeorm_1.In)(chatMessageExecutionIds.map((chatMessageExecutionId) => chatMessageExecutionId.id)),
                workspaceId: activeWorkspaceId
            }
        })).map((execution) => execution.id);
        chatMessageExecutionIds.forEach((item) => {
            if (databaseExecutionIds.includes(item.id)) {
                item.qty += 1;
            }
        });
        // step 4 - if executionIds not found replace with NULL
        const missingExecutionIds = chatMessageExecutionIds.filter((item) => item.qty === 0).map((item) => item.id);
        chatMessages.forEach((chatMessage) => {
            if (chatMessage.executionId && missingExecutionIds.includes(chatMessage.executionId)) {
                delete chatMessage.executionId;
            }
        });
        originalData.ChatMessage = chatMessages;
        return originalData;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: exportImportService.replaceExecutionIdForChatMessage - ${(0, utils_1.getErrorMessage)(error)}`);
    }
}
async function replaceDuplicateIdsForChatMessageFeedback(queryRunner, originalData, chatMessageFeedbacks, activeWorkspaceId) {
    try {
        const feedbackChatflowIds = chatMessageFeedbacks.map((feedback) => {
            return { id: feedback.chatflowid, qty: 0 };
        });
        const originalDataChatflowIds = [
            ...originalData.AssistantFlow.map((assistantFlow) => assistantFlow.id),
            ...originalData.AgentFlow.map((agentFlow) => agentFlow.id),
            ...originalData.AgentFlowV2.map((agentFlowV2) => agentFlowV2.id),
            ...originalData.ChatFlow.map((chatFlow) => chatFlow.id)
        ];
        feedbackChatflowIds.forEach((item) => {
            if (originalDataChatflowIds.includes(item.id)) {
                item.qty += 1;
            }
        });
        const databaseChatflowIds = await (await queryRunner.manager.find(ChatFlow_1.ChatFlow, {
            where: { id: (0, typeorm_1.In)(feedbackChatflowIds.map((feedbackChatflowId) => feedbackChatflowId.id)), workspaceId: activeWorkspaceId }
        })).map((chatflow) => chatflow.id);
        feedbackChatflowIds.forEach((item) => {
            if (databaseChatflowIds.includes(item.id)) {
                item.qty += 1;
            }
        });
        const feedbackMessageIds = chatMessageFeedbacks.map((feedback) => {
            return { id: feedback.messageId, qty: 0 };
        });
        const originalDataMessageIds = originalData.ChatMessage.map((chatMessage) => chatMessage.id);
        feedbackMessageIds.forEach((item) => {
            if (originalDataMessageIds.includes(item.id)) {
                item.qty += 1;
            }
        });
        const databaseMessageIds = await (await queryRunner.manager.find(ChatMessage_1.ChatMessage, {
            where: { id: (0, typeorm_1.In)(feedbackMessageIds.map((feedbackMessageId) => feedbackMessageId.id)) }
        })).map((chatMessage) => chatMessage.id);
        feedbackMessageIds.forEach((item) => {
            if (databaseMessageIds.includes(item.id)) {
                item.qty += 1;
            }
        });
        const missingChatflowIds = feedbackChatflowIds.filter((item) => item.qty === 0).map((item) => item.id);
        const missingMessageIds = feedbackMessageIds.filter((item) => item.qty === 0).map((item) => item.id);
        if (missingChatflowIds.length > 0 || missingMessageIds.length > 0) {
            chatMessageFeedbacks = chatMessageFeedbacks.filter((feedback) => !missingChatflowIds.includes(feedback.chatflowid) && !missingMessageIds.includes(feedback.messageId));
            originalData.ChatMessageFeedback = chatMessageFeedbacks;
        }
        const ids = chatMessageFeedbacks.map((chatMessageFeedback) => chatMessageFeedback.id);
        const records = await queryRunner.manager.find(ChatMessageFeedback_1.ChatMessageFeedback, {
            where: { id: (0, typeorm_1.In)(ids) }
        });
        // remove duplicate messageId
        const seenMessageIds = new Set();
        originalData.ChatMessageFeedback = originalData.ChatMessageFeedback.filter((feedback) => {
            if (seenMessageIds.has(feedback.messageId)) {
                return false;
            }
            seenMessageIds.add(feedback.messageId);
            return true;
        });
        if (records.length < 0)
            return originalData;
        // replace duplicate ids found in db to new id
        const dbExistingIds = new Set(records.map((record) => record.id));
        originalData.ChatMessageFeedback = originalData.ChatMessageFeedback.map((item) => {
            if (dbExistingIds.has(item.id)) {
                const newId = (0, uuid_1.v4)();
                return { ...item, id: newId };
            }
            return item;
        });
        return originalData;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: exportImportService.replaceDuplicateIdsForChatMessageFeedback - ${(0, utils_1.getErrorMessage)(error)}`);
    }
}
async function replaceDuplicateIdsForCustomTemplate(queryRunner, originalData, customTemplates) {
    try {
        const ids = customTemplates.map((customTemplate) => customTemplate.id);
        const records = await queryRunner.manager.find(CustomTemplate_1.CustomTemplate, {
            where: { id: (0, typeorm_1.In)(ids) }
        });
        if (records.length < 0)
            return originalData;
        for (let record of records) {
            const oldId = record.id;
            const newId = (0, uuid_1.v4)();
            originalData = JSON.parse(JSON.stringify(originalData).replaceAll(oldId, newId));
        }
        return originalData;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: exportImportService.replaceDuplicateIdsForCustomTemplate - ${(0, utils_1.getErrorMessage)(error)}`);
    }
}
async function replaceDuplicateIdsForDocumentStore(queryRunner, originalData, documentStores) {
    try {
        const ids = documentStores.map((documentStore) => documentStore.id);
        const records = await queryRunner.manager.find(DocumentStore_1.DocumentStore, {
            where: { id: (0, typeorm_1.In)(ids) }
        });
        if (records.length < 0)
            return originalData;
        for (let record of records) {
            const oldId = record.id;
            const newId = (0, uuid_1.v4)();
            originalData = JSON.parse(JSON.stringify(originalData).replaceAll(oldId, newId));
        }
        return originalData;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: exportImportService.replaceDuplicateIdsForDocumentStore - ${(0, utils_1.getErrorMessage)(error)}`);
    }
}
async function replaceDuplicateIdsForDocumentStoreFileChunk(queryRunner, originalData, documentStoreFileChunks) {
    try {
        const ids = documentStoreFileChunks.map((documentStoreFileChunk) => documentStoreFileChunk.id);
        const records = await queryRunner.manager.find(DocumentStoreFileChunk_1.DocumentStoreFileChunk, {
            where: { id: (0, typeorm_1.In)(ids) }
        });
        if (records.length < 0)
            return originalData;
        // replace duplicate ids found in db to new id
        const dbExistingIds = new Set(records.map((record) => record.id));
        originalData.DocumentStoreFileChunk = originalData.DocumentStoreFileChunk.map((item) => {
            if (dbExistingIds.has(item.id)) {
                return { ...item, id: (0, uuid_1.v4)() };
            }
            return item;
        });
        return originalData;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: exportImportService.replaceDuplicateIdsForDocumentStoreFileChunk - ${(0, utils_1.getErrorMessage)(error)}`);
    }
}
async function replaceDuplicateIdsForTool(queryRunner, originalData, tools) {
    try {
        const ids = tools.map((tool) => tool.id);
        const records = await queryRunner.manager.find(Tool_1.Tool, {
            where: { id: (0, typeorm_1.In)(ids) }
        });
        if (records.length < 0)
            return originalData;
        for (let record of records) {
            const oldId = record.id;
            const newId = (0, uuid_1.v4)();
            originalData = JSON.parse(JSON.stringify(originalData).replaceAll(oldId, newId));
        }
        return originalData;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: exportImportService.replaceDuplicateIdsForTool - ${(0, utils_1.getErrorMessage)(error)}`);
    }
}
async function replaceDuplicateIdsForVariable(queryRunner, originalData, variables) {
    try {
        const ids = variables.map((variable) => variable.id);
        const records = await queryRunner.manager.find(Variable_1.Variable, {
            where: { id: (0, typeorm_1.In)(ids) }
        });
        if ((0, getRunningExpressApp_1.getRunningExpressApp)().identityManager.getPlatformType() === Interface_1.Platform.CLOUD)
            originalData.Variable = originalData.Variable.filter((variable) => variable.type !== 'runtime');
        if (records.length < 0)
            return originalData;
        for (let record of records) {
            const oldId = record.id;
            const newId = (0, uuid_1.v4)();
            originalData = JSON.parse(JSON.stringify(originalData).replaceAll(oldId, newId));
        }
        return originalData;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: exportImportService.replaceDuplicateIdsForVariable - ${(0, utils_1.getErrorMessage)(error)}`);
    }
}
async function replaceDuplicateIdsForExecution(queryRunner, originalData, executions) {
    try {
        const ids = executions.map((execution) => execution.id);
        const records = await queryRunner.manager.find(Execution_1.Execution, {
            where: { id: (0, typeorm_1.In)(ids) }
        });
        if (records.length < 0)
            return originalData;
        for (let record of records) {
            const oldId = record.id;
            const newId = (0, uuid_1.v4)();
            originalData = JSON.parse(JSON.stringify(originalData).replaceAll(oldId, newId));
        }
        return originalData;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: exportImportService.replaceDuplicateIdsForExecution - ${(0, utils_1.getErrorMessage)(error)}`);
    }
}
function reduceSpaceForChatflowFlowData(chatflows) {
    return chatflows.map((chatflow) => {
        return { ...chatflow, flowData: JSON.stringify(JSON.parse(chatflow.flowData)) };
    });
}
function insertWorkspaceId(importedData, activeWorkspaceId) {
    if (!activeWorkspaceId)
        return importedData;
    importedData.forEach((item) => {
        if (item.type === 'Tool') {
            // TODO: This is a temporary fix where export data for CustomTemplate type Tool need to be changed in the future.
            // Also handles backward compatibility for previously exported data where CustomTemplate type Tool does not have flowData field.
            item.flowData = JSON.stringify({
                iconSrc: item.iconSrc,
                schema: item.schema,
                func: item.func
            });
        }
        item.workspaceId = activeWorkspaceId;
    });
    return importedData;
}
async function saveBatch(manager, entity, items, batchSize = 900) {
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        await manager.save(entity, batch);
    }
}
const importData = async (importData, orgId, activeWorkspaceId, subscriptionId) => {
    // Initialize missing properties with empty arrays to avoid "undefined" errors
    importData.AgentFlow = importData.AgentFlow || [];
    importData.AgentFlowV2 = importData.AgentFlowV2 || [];
    importData.AssistantCustom = importData.AssistantCustom || [];
    importData.AssistantFlow = importData.AssistantFlow || [];
    importData.AssistantOpenAI = importData.AssistantOpenAI || [];
    importData.AssistantAzure = importData.AssistantAzure || [];
    importData.ChatFlow = importData.ChatFlow || [];
    importData.ChatMessage = importData.ChatMessage || [];
    importData.ChatMessageFeedback = importData.ChatMessageFeedback || [];
    importData.CustomTemplate = importData.CustomTemplate || [];
    importData.DocumentStore = importData.DocumentStore || [];
    importData.DocumentStoreFileChunk = importData.DocumentStoreFileChunk || [];
    importData.Execution = importData.Execution || [];
    importData.Tool = importData.Tool || [];
    importData.Variable = importData.Variable || [];
    let queryRunner;
    try {
        queryRunner = (0, getRunningExpressApp_1.getRunningExpressApp)().AppDataSource.createQueryRunner();
        await queryRunner.connect();
        try {
            if (importData.AgentFlow.length > 0) {
                importData.AgentFlow = reduceSpaceForChatflowFlowData(importData.AgentFlow);
                importData.AgentFlow = insertWorkspaceId(importData.AgentFlow, activeWorkspaceId);
                const existingChatflowCount = await chatflows_1.default.getAllChatflowsCountByOrganization('MULTIAGENT', orgId);
                const newChatflowCount = importData.AgentFlow.length;
                await (0, quotaUsage_1.checkUsageLimit)('flows', subscriptionId, (0, getRunningExpressApp_1.getRunningExpressApp)().usageCacheManager, existingChatflowCount + newChatflowCount);
                importData = await replaceDuplicateIdsForChatFlow(queryRunner, importData, importData.AgentFlow);
            }
            if (importData.AgentFlowV2.length > 0) {
                importData.AgentFlowV2 = reduceSpaceForChatflowFlowData(importData.AgentFlowV2);
                importData.AgentFlowV2 = insertWorkspaceId(importData.AgentFlowV2, activeWorkspaceId);
                const existingChatflowCount = await chatflows_1.default.getAllChatflowsCountByOrganization('AGENTFLOW', orgId);
                const newChatflowCount = importData.AgentFlowV2.length;
                await (0, quotaUsage_1.checkUsageLimit)('flows', subscriptionId, (0, getRunningExpressApp_1.getRunningExpressApp)().usageCacheManager, existingChatflowCount + newChatflowCount);
                importData = await replaceDuplicateIdsForChatFlow(queryRunner, importData, importData.AgentFlowV2);
            }
            if (importData.AssistantCustom.length > 0) {
                importData.AssistantCustom = insertWorkspaceId(importData.AssistantCustom, activeWorkspaceId);
                const existingAssistantCount = await assistants_1.default.getAssistantsCountByOrganization('CUSTOM', orgId);
                const newAssistantCount = importData.AssistantCustom.length;
                await (0, quotaUsage_1.checkUsageLimit)('flows', subscriptionId, (0, getRunningExpressApp_1.getRunningExpressApp)().usageCacheManager, existingAssistantCount + newAssistantCount);
                importData = await replaceDuplicateIdsForAssistant(queryRunner, importData, importData.AssistantCustom);
            }
            if (importData.AssistantFlow.length > 0) {
                importData.AssistantFlow = reduceSpaceForChatflowFlowData(importData.AssistantFlow);
                importData.AssistantFlow = insertWorkspaceId(importData.AssistantFlow, activeWorkspaceId);
                const existingChatflowCount = await chatflows_1.default.getAllChatflowsCountByOrganization('ASSISTANT', orgId);
                const newChatflowCount = importData.AssistantFlow.length;
                await (0, quotaUsage_1.checkUsageLimit)('flows', subscriptionId, (0, getRunningExpressApp_1.getRunningExpressApp)().usageCacheManager, existingChatflowCount + newChatflowCount);
                importData = await replaceDuplicateIdsForChatFlow(queryRunner, importData, importData.AssistantFlow);
            }
            if (importData.AssistantOpenAI.length > 0) {
                importData.AssistantOpenAI = insertWorkspaceId(importData.AssistantOpenAI, activeWorkspaceId);
                const existingAssistantCount = await assistants_1.default.getAssistantsCountByOrganization('OPENAI', orgId);
                const newAssistantCount = importData.AssistantOpenAI.length;
                await (0, quotaUsage_1.checkUsageLimit)('flows', subscriptionId, (0, getRunningExpressApp_1.getRunningExpressApp)().usageCacheManager, existingAssistantCount + newAssistantCount);
                importData = await replaceDuplicateIdsForAssistant(queryRunner, importData, importData.AssistantOpenAI);
            }
            if (importData.AssistantAzure.length > 0) {
                importData.AssistantAzure = insertWorkspaceId(importData.AssistantAzure, activeWorkspaceId);
                const existingAssistantCount = await assistants_1.default.getAssistantsCountByOrganization('AZURE', orgId);
                const newAssistantCount = importData.AssistantAzure.length;
                await (0, quotaUsage_1.checkUsageLimit)('flows', subscriptionId, (0, getRunningExpressApp_1.getRunningExpressApp)().usageCacheManager, existingAssistantCount + newAssistantCount);
                importData = await replaceDuplicateIdsForAssistant(queryRunner, importData, importData.AssistantAzure);
            }
            if (importData.ChatFlow.length > 0) {
                importData.ChatFlow = reduceSpaceForChatflowFlowData(importData.ChatFlow);
                importData.ChatFlow = insertWorkspaceId(importData.ChatFlow, activeWorkspaceId);
                const existingChatflowCount = await chatflows_1.default.getAllChatflowsCountByOrganization('CHATFLOW', orgId);
                const newChatflowCount = importData.ChatFlow.length;
                await (0, quotaUsage_1.checkUsageLimit)('flows', subscriptionId, (0, getRunningExpressApp_1.getRunningExpressApp)().usageCacheManager, existingChatflowCount + newChatflowCount);
                importData = await replaceDuplicateIdsForChatFlow(queryRunner, importData, importData.ChatFlow);
            }
            if (importData.ChatMessage.length > 0) {
                importData = await replaceDuplicateIdsForChatMessage(queryRunner, importData, importData.ChatMessage, activeWorkspaceId);
                importData = await replaceExecutionIdForChatMessage(queryRunner, importData, importData.ChatMessage, activeWorkspaceId);
            }
            if (importData.ChatMessageFeedback.length > 0)
                importData = await replaceDuplicateIdsForChatMessageFeedback(queryRunner, importData, importData.ChatMessageFeedback, activeWorkspaceId);
            if (importData.CustomTemplate.length > 0) {
                importData.CustomTemplate = insertWorkspaceId(importData.CustomTemplate, activeWorkspaceId);
                importData = await replaceDuplicateIdsForCustomTemplate(queryRunner, importData, importData.CustomTemplate);
            }
            if (importData.DocumentStore.length > 0) {
                importData.DocumentStore = insertWorkspaceId(importData.DocumentStore, activeWorkspaceId);
                importData = await replaceDuplicateIdsForDocumentStore(queryRunner, importData, importData.DocumentStore);
            }
            if (importData.DocumentStoreFileChunk.length > 0)
                importData = await replaceDuplicateIdsForDocumentStoreFileChunk(queryRunner, importData, importData.DocumentStoreFileChunk);
            if (importData.Tool.length > 0) {
                importData.Tool = insertWorkspaceId(importData.Tool, activeWorkspaceId);
                importData = await replaceDuplicateIdsForTool(queryRunner, importData, importData.Tool);
            }
            if (importData.Execution.length > 0) {
                importData.Execution = insertWorkspaceId(importData.Execution, activeWorkspaceId);
                importData = await replaceDuplicateIdsForExecution(queryRunner, importData, importData.Execution);
            }
            if (importData.Variable.length > 0) {
                importData.Variable = insertWorkspaceId(importData.Variable, activeWorkspaceId);
                importData = await replaceDuplicateIdsForVariable(queryRunner, importData, importData.Variable);
            }
            importData = (0, sanitize_util_1.sanitizeNullBytes)(importData);
            await queryRunner.startTransaction();
            if (importData.AgentFlow.length > 0)
                await queryRunner.manager.save(ChatFlow_1.ChatFlow, importData.AgentFlow);
            if (importData.AgentFlowV2.length > 0)
                await queryRunner.manager.save(ChatFlow_1.ChatFlow, importData.AgentFlowV2);
            if (importData.AssistantFlow.length > 0)
                await queryRunner.manager.save(ChatFlow_1.ChatFlow, importData.AssistantFlow);
            if (importData.AssistantCustom.length > 0)
                await queryRunner.manager.save(Assistant_1.Assistant, importData.AssistantCustom);
            if (importData.AssistantOpenAI.length > 0)
                await queryRunner.manager.save(Assistant_1.Assistant, importData.AssistantOpenAI);
            if (importData.AssistantAzure.length > 0)
                await queryRunner.manager.save(Assistant_1.Assistant, importData.AssistantAzure);
            if (importData.ChatFlow.length > 0)
                await queryRunner.manager.save(ChatFlow_1.ChatFlow, importData.ChatFlow);
            if (importData.ChatMessage.length > 0)
                await saveBatch(queryRunner.manager, ChatMessage_1.ChatMessage, importData.ChatMessage);
            if (importData.ChatMessageFeedback.length > 0)
                await queryRunner.manager.save(ChatMessageFeedback_1.ChatMessageFeedback, importData.ChatMessageFeedback);
            if (importData.CustomTemplate.length > 0)
                await queryRunner.manager.save(CustomTemplate_1.CustomTemplate, importData.CustomTemplate);
            if (importData.DocumentStore.length > 0)
                await queryRunner.manager.save(DocumentStore_1.DocumentStore, importData.DocumentStore);
            if (importData.DocumentStoreFileChunk.length > 0)
                await saveBatch(queryRunner.manager, DocumentStoreFileChunk_1.DocumentStoreFileChunk, importData.DocumentStoreFileChunk);
            if (importData.Tool.length > 0)
                await queryRunner.manager.save(Tool_1.Tool, importData.Tool);
            if (importData.Execution.length > 0)
                await queryRunner.manager.save(Execution_1.Execution, importData.Execution);
            if (importData.Variable.length > 0)
                await queryRunner.manager.save(Variable_1.Variable, importData.Variable);
            await queryRunner.commitTransaction();
        }
        catch (error) {
            if (queryRunner.isTransactionActive)
                await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            if (!queryRunner.isReleased)
                await queryRunner.release();
        }
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: exportImportService.importAll - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
// Export chatflow messages
const exportChatflowMessages = async (chatflowId, chatType, feedbackType, startDate, endDate, workspaceId) => {
    try {
        // Parse chatType if it's a string
        let parsedChatTypes;
        if (chatType) {
            if (typeof chatType === 'string') {
                const parsed = (0, accelance_components_1.parseJsonBody)(chatType);
                parsedChatTypes = Array.isArray(parsed) ? parsed : [chatType];
            }
            else if (Array.isArray(chatType)) {
                parsedChatTypes = chatType;
            }
        }
        // Parse feedbackType if it's a string
        let parsedFeedbackTypes;
        if (feedbackType) {
            if (typeof feedbackType === 'string') {
                const parsed = (0, accelance_components_1.parseJsonBody)(feedbackType);
                parsedFeedbackTypes = Array.isArray(parsed) ? parsed : [feedbackType];
            }
            else if (Array.isArray(feedbackType)) {
                parsedFeedbackTypes = feedbackType;
            }
        }
        // Get all chat messages for the chatflow with feedback
        const chatMessages = await (0, getChatMessage_1.utilGetChatMessage)({
            chatflowid: chatflowId,
            chatTypes: parsedChatTypes,
            feedbackTypes: parsedFeedbackTypes,
            startDate,
            endDate,
            sortOrder: 'DESC',
            feedback: true,
            activeWorkspaceId: workspaceId
        });
        const storagePath = (0, accelance_components_1.getStoragePath)();
        const exportObj = {};
        // Process each chat message
        for (const chatmsg of chatMessages) {
            const chatPK = getChatPK(chatmsg);
            const filePaths = [];
            // Handle file uploads
            if (chatmsg.fileUploads) {
                const uploads = (0, accelance_components_1.parseJsonBody)(chatmsg.fileUploads);
                if (Array.isArray(uploads)) {
                    uploads.forEach((file) => {
                        if (file.type === 'stored-file') {
                            filePaths.push(path_1.default.join(storagePath, chatmsg.chatflowid, chatmsg.chatId, file.name));
                        }
                    });
                }
            }
            // Create message object
            const msg = {
                content: chatmsg.content,
                role: chatmsg.role === 'apiMessage' ? 'bot' : 'user',
                time: chatmsg.createdDate
            };
            // Add optional properties
            if (filePaths.length)
                msg.filePaths = filePaths;
            if (chatmsg.sourceDocuments)
                msg.sourceDocuments = (0, accelance_components_1.parseJsonBody)(chatmsg.sourceDocuments);
            if (chatmsg.usedTools)
                msg.usedTools = (0, accelance_components_1.parseJsonBody)(chatmsg.usedTools);
            if (chatmsg.fileAnnotations)
                msg.fileAnnotations = (0, accelance_components_1.parseJsonBody)(chatmsg.fileAnnotations);
            if (chatmsg.feedback)
                msg.feedback = chatmsg.feedback.content;
            if (chatmsg.agentReasoning)
                msg.agentReasoning = (0, accelance_components_1.parseJsonBody)(chatmsg.agentReasoning);
            // Handle artifacts
            if (chatmsg.artifacts) {
                const artifacts = (0, accelance_components_1.parseJsonBody)(chatmsg.artifacts);
                msg.artifacts = artifacts;
                if (Array.isArray(artifacts)) {
                    artifacts.forEach((artifact) => {
                        if (artifact.type === 'png' || artifact.type === 'jpeg') {
                            const baseURL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
                            artifact.data = `${baseURL}/api/get-upload-file?chatflowId=${chatmsg.chatflowid}&chatId=${chatmsg.chatId}&fileName=${artifact.data.replace('FILE-STORAGE::', '')}`;
                        }
                    });
                }
            }
            // Group messages by chat session
            if (!exportObj[chatPK]) {
                exportObj[chatPK] = {
                    id: chatmsg.chatId,
                    source: getChatType(chatmsg.chatType),
                    sessionId: chatmsg.sessionId ?? null,
                    memoryType: chatmsg.memoryType ?? null,
                    email: chatmsg.leadEmail ?? null,
                    messages: [msg]
                };
            }
            else {
                exportObj[chatPK].messages.push(msg);
            }
        }
        // Convert to array and reverse message order within each conversation
        const exportMessages = Object.values(exportObj).map((conversation) => ({
            ...conversation,
            messages: conversation.messages.reverse()
        }));
        return exportMessages;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: exportImportService.exportChatflowMessages - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
// Helper function to get chat primary key
const getChatPK = (chatmsg) => {
    const chatId = chatmsg.chatId;
    const memoryType = chatmsg.memoryType;
    const sessionId = chatmsg.sessionId;
    if (memoryType && sessionId) {
        return `${chatId}_${memoryType}_${sessionId}`;
    }
    return chatId;
};
// Helper function to get chat type display name
const getChatType = (chatType) => {
    if (!chatType)
        return 'Unknown';
    switch (chatType) {
        case Interface_1.ChatType.EVALUATION:
            return 'Evaluation';
        case Interface_1.ChatType.INTERNAL:
            return 'UI';
        case Interface_1.ChatType.EXTERNAL:
            return 'API/Embed';
        case Interface_1.ChatType.MCP:
            return 'MCP';
        case Interface_1.ChatType.SCHEDULED:
            return 'Scheduled';
        case Interface_1.ChatType.WEBHOOK:
            return 'Webhook';
    }
};
exports.default = {
    convertExportInput,
    exportData,
    importData,
    exportChatflowMessages
};
//# sourceMappingURL=index.js.map