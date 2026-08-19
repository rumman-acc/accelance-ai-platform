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
const stripProtectedFields_1 = require("../../utils/stripProtectedFields");
const accelance_components_1 = require("accelance-components");
const http_status_codes_1 = require("http-status-codes");
const lodash_1 = require("lodash");
const openai_1 = __importDefault(require("openai"));
const typeorm_1 = require("typeorm");
const Assistant_1 = require("../../database/entities/Assistant");
const Credential_1 = require("../../database/entities/Credential");
const DocumentStore_1 = require("../../database/entities/DocumentStore");
const workspace_entity_1 = require("../../enterprise/database/entities/workspace.entity");
const ControllerServiceUtils_1 = require("../../enterprise/utils/ControllerServiceUtils");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const utils_1 = require("../../errors/utils");
const Interface_Metrics_1 = require("../../Interface.Metrics");
const utils_2 = require("../../utils");
const constants_1 = require("../../utils/constants");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const logger_1 = __importDefault(require("../../utils/logger"));
const prompt_1 = require("../../utils/prompt");
const quotaUsage_1 = require("../../utils/quotaUsage");
const nodes_1 = __importDefault(require("../nodes"));
const createAssistant = async (requestBody, orgId, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        if (!requestBody.details) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Invalid request body`);
        }
        const assistantDetails = JSON.parse(requestBody.details);
        if (requestBody.type === 'CUSTOM') {
            // For CUSTOM assistants the credential field is a client-generated UUID used as an
            // internal identifier, not a reference to the Credential entity, so no lookup is needed.
            const newAssistant = new Assistant_1.Assistant();
            Object.assign(newAssistant, (0, stripProtectedFields_1.stripProtectedFields)(requestBody));
            newAssistant.workspaceId = workspaceId;
            const assistant = appServer.AppDataSource.getRepository(Assistant_1.Assistant).create(newAssistant);
            const dbResponse = await appServer.AppDataSource.getRepository(Assistant_1.Assistant).save(assistant);
            await appServer.telemetry.sendTelemetry('assistant_created', {
                version: await (0, utils_2.getAppVersion)(),
                assistantId: dbResponse.id
            }, orgId);
            appServer.metricsProvider?.incrementCounter(Interface_Metrics_1.ACCELANCE_METRIC_COUNTERS.ASSISTANT_CREATED, {
                status: Interface_Metrics_1.ACCELANCE_COUNTER_STATUS.SUCCESS
            });
            return dbResponse;
        }
        try {
            const credential = await appServer.AppDataSource.getRepository(Credential_1.Credential).findOneBy({
                id: requestBody.credential,
                workspaceId: workspaceId
            });
            if (!credential) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Credential ${requestBody.credential} not found`);
            }
            // Decrpyt credentialData
            const decryptedCredentialData = await (0, utils_2.decryptCredentialData)(credential.encryptedData);
            const openAIApiKey = decryptedCredentialData['openAIApiKey'];
            if (!openAIApiKey) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `OpenAI ApiKey not found`);
            }
            const openai = new openai_1.default({ apiKey: openAIApiKey });
            // Prepare tools
            let tools = [];
            if (assistantDetails.tools) {
                for (const tool of assistantDetails.tools ?? []) {
                    tools.push({
                        type: tool
                    });
                }
            }
            // Save tool_resources to be stored later into database
            const savedToolResources = (0, lodash_1.cloneDeep)(assistantDetails.tool_resources);
            // Cleanup tool_resources for creating assistant
            if (assistantDetails.tool_resources) {
                for (const toolResource in assistantDetails.tool_resources) {
                    if (toolResource === 'file_search') {
                        assistantDetails.tool_resources['file_search'] = {
                            vector_store_ids: assistantDetails.tool_resources['file_search'].vector_store_ids
                        };
                    }
                    else if (toolResource === 'code_interpreter') {
                        assistantDetails.tool_resources['code_interpreter'] = {
                            file_ids: assistantDetails.tool_resources['code_interpreter'].file_ids
                        };
                    }
                }
            }
            // If the assistant doesn't exist, create a new one
            if (!assistantDetails.id) {
                const newAssistant = await openai.beta.assistants.create({
                    name: assistantDetails.name,
                    description: assistantDetails.description,
                    instructions: assistantDetails.instructions,
                    model: assistantDetails.model,
                    tools,
                    tool_resources: assistantDetails.tool_resources,
                    temperature: assistantDetails.temperature,
                    top_p: assistantDetails.top_p
                });
                assistantDetails.id = newAssistant.id;
            }
            else {
                const retrievedAssistant = await openai.beta.assistants.retrieve(assistantDetails.id);
                let filteredTools = (0, lodash_1.uniqWith)([...retrievedAssistant.tools.filter((tool) => tool.type === 'function'), ...tools], lodash_1.isEqual);
                // Remove empty functions
                filteredTools = filteredTools.filter((tool) => !(tool.type === 'function' && !tool.function));
                await openai.beta.assistants.update(assistantDetails.id, {
                    name: assistantDetails.name,
                    description: assistantDetails.description ?? '',
                    instructions: assistantDetails.instructions ?? '',
                    model: assistantDetails.model,
                    tools: filteredTools,
                    tool_resources: assistantDetails.tool_resources,
                    temperature: assistantDetails.temperature,
                    top_p: assistantDetails.top_p
                });
            }
            const newAssistantDetails = {
                ...assistantDetails
            };
            if (savedToolResources)
                newAssistantDetails.tool_resources = savedToolResources;
            requestBody.details = JSON.stringify(newAssistantDetails);
        }
        catch (error) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error creating new assistant - ${(0, utils_1.getErrorMessage)(error)}`);
        }
        const newAssistant = new Assistant_1.Assistant();
        Object.assign(newAssistant, (0, stripProtectedFields_1.stripProtectedFields)(requestBody));
        newAssistant.workspaceId = workspaceId;
        const assistant = appServer.AppDataSource.getRepository(Assistant_1.Assistant).create(newAssistant);
        const dbResponse = await appServer.AppDataSource.getRepository(Assistant_1.Assistant).save(assistant);
        await appServer.telemetry.sendTelemetry('assistant_created', {
            version: await (0, utils_2.getAppVersion)(),
            assistantId: dbResponse.id
        }, orgId);
        appServer.metricsProvider?.incrementCounter(Interface_Metrics_1.ACCELANCE_METRIC_COUNTERS.ASSISTANT_CREATED, {
            status: Interface_Metrics_1.ACCELANCE_COUNTER_STATUS.SUCCESS
        });
        return dbResponse;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: assistantsService.createAssistant - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const deleteAssistant = async (assistantId, isDeleteBoth, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const assistant = await appServer.AppDataSource.getRepository(Assistant_1.Assistant).findOneBy({
            id: assistantId,
            workspaceId: workspaceId
        });
        if (!assistant) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Assistant ${assistantId} not found`);
        }
        if (assistant.type === 'CUSTOM') {
            const dbResponse = await appServer.AppDataSource.getRepository(Assistant_1.Assistant).delete({ id: assistantId });
            return dbResponse;
        }
        try {
            const assistantDetails = JSON.parse(assistant.details);
            const credential = await appServer.AppDataSource.getRepository(Credential_1.Credential).findOneBy({
                id: assistant.credential
            });
            if (!credential) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Credential ${assistant.credential} not found`);
            }
            // Decrpyt credentialData
            const decryptedCredentialData = await (0, utils_2.decryptCredentialData)(credential.encryptedData);
            const openAIApiKey = decryptedCredentialData['openAIApiKey'];
            if (!openAIApiKey) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `OpenAI ApiKey not found`);
            }
            const openai = new openai_1.default({ apiKey: openAIApiKey });
            const dbResponse = await appServer.AppDataSource.getRepository(Assistant_1.Assistant).delete({ id: assistantId });
            if (isDeleteBoth)
                await openai.beta.assistants.delete(assistantDetails.id);
            return dbResponse;
        }
        catch (error) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error deleting assistant - ${(0, utils_1.getErrorMessage)(error)}`);
        }
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: assistantsService.deleteAssistant - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
async function getAssistantsCountByOrganization(type, organizationId) {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const workspaces = await appServer.AppDataSource.getRepository(workspace_entity_1.Workspace).findBy({ organizationId });
        const workspaceIds = workspaces.map((workspace) => workspace.id);
        const assistantsCount = await appServer.AppDataSource.getRepository(Assistant_1.Assistant).countBy({
            type,
            workspaceId: (0, typeorm_1.In)(workspaceIds)
        });
        return assistantsCount;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: assistantsService.getAssistantsCountByOrganization - ${(0, utils_1.getErrorMessage)(error)}`);
    }
}
const getAllAssistants = async (workspaceId, type) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        if (type) {
            const dbResponse = await appServer.AppDataSource.getRepository(Assistant_1.Assistant).findBy({
                type,
                ...(0, ControllerServiceUtils_1.getWorkspaceSearchOptions)(workspaceId)
            });
            return dbResponse;
        }
        const dbResponse = await appServer.AppDataSource.getRepository(Assistant_1.Assistant).findBy((0, ControllerServiceUtils_1.getWorkspaceSearchOptions)(workspaceId));
        return dbResponse;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: assistantsService.getAllAssistants - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const getAllAssistantsCount = async (workspaceId, type) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        if (type) {
            const dbResponse = await appServer.AppDataSource.getRepository(Assistant_1.Assistant).countBy({
                type,
                ...(0, ControllerServiceUtils_1.getWorkspaceSearchOptions)(workspaceId)
            });
            return dbResponse;
        }
        const dbResponse = await appServer.AppDataSource.getRepository(Assistant_1.Assistant).countBy((0, ControllerServiceUtils_1.getWorkspaceSearchOptions)(workspaceId));
        return dbResponse;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: assistantsService.getAllAssistantsCount - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const getAssistantById = async (assistantId, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const dbResponse = await appServer.AppDataSource.getRepository(Assistant_1.Assistant).findOneBy({
            id: assistantId,
            workspaceId: workspaceId
        });
        if (!dbResponse) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Assistant ${assistantId} not found`);
        }
        return dbResponse;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: assistantsService.getAssistantById - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const updateAssistant = async (assistantId, requestBody, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const assistant = await appServer.AppDataSource.getRepository(Assistant_1.Assistant).findOneBy({
            id: assistantId,
            workspaceId: workspaceId
        });
        if (!assistant) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Assistant ${assistantId} not found`);
        }
        if (requestBody.details !== undefined) {
            if (!requestBody.details) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Details cannot be empty`);
            }
            let parsedDetails;
            try {
                parsedDetails = JSON.parse(requestBody.details);
            }
            catch (e) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Details must be valid JSON`);
            }
            if (assistant.type === 'CUSTOM' && !parsedDetails?.name) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Details must include a name field`);
            }
        }
        if (assistant.type === 'CUSTOM') {
            Object.assign(assistant, (0, stripProtectedFields_1.stripProtectedFields)(requestBody));
            const dbResponse = await appServer.AppDataSource.getRepository(Assistant_1.Assistant).save(assistant);
            return dbResponse;
        }
        try {
            const openAIAssistantId = JSON.parse(assistant.details)?.id;
            const body = requestBody;
            const assistantDetails = JSON.parse(body.details);
            const credential = await appServer.AppDataSource.getRepository(Credential_1.Credential).findOneBy({
                id: body.credential,
                workspaceId: workspaceId
            });
            if (!credential) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Credential ${body.credential} not found`);
            }
            // Decrpyt credentialData
            const decryptedCredentialData = await (0, utils_2.decryptCredentialData)(credential.encryptedData);
            const openAIApiKey = decryptedCredentialData['openAIApiKey'];
            if (!openAIApiKey) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `OpenAI ApiKey not found`);
            }
            const openai = new openai_1.default({ apiKey: openAIApiKey });
            let tools = [];
            if (assistantDetails.tools) {
                for (const tool of assistantDetails.tools ?? []) {
                    tools.push({
                        type: tool
                    });
                }
            }
            // Save tool_resources to be stored later into database
            const savedToolResources = (0, lodash_1.cloneDeep)(assistantDetails.tool_resources);
            // Cleanup tool_resources before updating
            if (assistantDetails.tool_resources) {
                for (const toolResource in assistantDetails.tool_resources) {
                    if (toolResource === 'file_search') {
                        assistantDetails.tool_resources['file_search'] = {
                            vector_store_ids: assistantDetails.tool_resources['file_search'].vector_store_ids
                        };
                    }
                    else if (toolResource === 'code_interpreter') {
                        assistantDetails.tool_resources['code_interpreter'] = {
                            file_ids: assistantDetails.tool_resources['code_interpreter'].file_ids
                        };
                    }
                }
            }
            const retrievedAssistant = await openai.beta.assistants.retrieve(openAIAssistantId);
            let filteredTools = (0, lodash_1.uniqWith)([...retrievedAssistant.tools.filter((tool) => tool.type === 'function'), ...tools], lodash_1.isEqual);
            filteredTools = filteredTools.filter((tool) => !(tool.type === 'function' && !tool.function));
            await openai.beta.assistants.update(openAIAssistantId, {
                name: assistantDetails.name,
                description: assistantDetails.description,
                instructions: assistantDetails.instructions,
                model: assistantDetails.model,
                tools: filteredTools,
                tool_resources: assistantDetails.tool_resources,
                temperature: assistantDetails.temperature,
                top_p: assistantDetails.top_p
            });
            const newAssistantDetails = {
                ...assistantDetails,
                id: openAIAssistantId
            };
            if (savedToolResources)
                newAssistantDetails.tool_resources = savedToolResources;
            // Explicit allowlist — mutate only allowed fields on the fetched entity (same
            // reasoning as the CUSTOM path above: avoid merge() with an intermediate entity).
            assistant.details = JSON.stringify(newAssistantDetails);
            if (body.credential !== undefined)
                assistant.credential = body.credential;
            if (body.iconSrc !== undefined)
                assistant.iconSrc = body.iconSrc;
            const dbResponse = await appServer.AppDataSource.getRepository(Assistant_1.Assistant).save(assistant);
            return dbResponse;
        }
        catch (error) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error updating assistant - ${(0, utils_1.getErrorMessage)(error)}`);
        }
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: assistantsService.updateAssistant - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const importAssistants = async (newAssistants, orgId, _, subscriptionId, queryRunner) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const repository = queryRunner ? queryRunner.manager.getRepository(Assistant_1.Assistant) : appServer.AppDataSource.getRepository(Assistant_1.Assistant);
        // step 1 - check whether array is zero
        if (newAssistants.length == 0)
            return;
        await (0, quotaUsage_1.checkUsageLimit)('flows', subscriptionId, appServer.usageCacheManager, newAssistants.length);
        // step 2 - check whether ids are duplicate in database
        let ids = '(';
        let count = 0;
        const lastCount = newAssistants.length - 1;
        newAssistants.forEach((newAssistant) => {
            ids += `'${newAssistant.id}'`;
            if (lastCount != count)
                ids += ',';
            if (lastCount == count)
                ids += ')';
            count += 1;
        });
        const selectResponse = await repository
            .createQueryBuilder('assistant')
            .select('assistant.id')
            .where(`assistant.id IN ${ids}`)
            .getMany();
        const foundIds = selectResponse.map((response) => {
            return response.id;
        });
        // step 3 - remove ids that are only duplicate
        const prepVariables = newAssistants.map((newAssistant) => {
            let id = '';
            if (newAssistant.id)
                id = newAssistant.id;
            if (foundIds.includes(id)) {
                newAssistant.id = undefined;
            }
            return newAssistant;
        });
        // step 4 - transactional insert array of entities
        const insertResponse = await repository.insert(prepVariables);
        return insertResponse;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: assistantsService.importAssistants - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const getChatModels = async () => {
    try {
        const dbResponse = await nodes_1.default.getAllNodesForCategory('Chat Models');
        return dbResponse.filter((node) => !node.tags?.includes('LlamaIndex'));
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: assistantsService.getChatModels - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const getDocumentStores = async (activeWorkspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const stores = await appServer.AppDataSource.getRepository(DocumentStore_1.DocumentStore).findBy((0, ControllerServiceUtils_1.getWorkspaceSearchOptions)(activeWorkspaceId));
        const returnData = [];
        for (const store of stores) {
            if (store.status === 'UPSERTED') {
                const obj = {
                    name: store.id,
                    label: store.name,
                    description: store.description
                };
                returnData.push(obj);
            }
        }
        return returnData;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: assistantsService.getDocumentStores - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const getTools = async () => {
    try {
        const tools = await nodes_1.default.getAllNodesForCategory('Tools');
        const mcpTools = await nodes_1.default.getAllNodesForCategory('Tools (MCP)');
        // filter out those tools that input params type are not in the list
        const filteredTools = [...tools, ...mcpTools].filter((tool) => {
            const inputs = tool.inputs || [];
            return inputs.every((input) => constants_1.INPUT_PARAMS_TYPE.includes(input.type));
        });
        return filteredTools;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: assistantsService.getTools - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const generateAssistantInstruction = async (task, selectedChatModel) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        if (selectedChatModel && Object.keys(selectedChatModel).length > 0) {
            const nodeInstanceFilePath = appServer.nodesPool.componentNodes[selectedChatModel.name].filePath;
            const nodeModule = await Promise.resolve(`${nodeInstanceFilePath}`).then(s => __importStar(require(s)));
            const newNodeInstance = new nodeModule.nodeClass();
            const nodeData = {
                credential: selectedChatModel.credential || selectedChatModel.inputs['FLOWISE_CREDENTIAL_ID'] || undefined,
                inputs: selectedChatModel.inputs,
                id: `${selectedChatModel.name}_0`
            };
            const options = {
                appDataSource: appServer.AppDataSource,
                databaseEntities: utils_2.databaseEntities,
                logger: logger_1.default
            };
            const llmNodeInstance = await newNodeInstance.init(nodeData, '', options);
            const response = await llmNodeInstance.invoke([
                {
                    role: 'user',
                    content: prompt_1.ASSISTANT_PROMPT_GENERATOR.replace('{{task}}', task)
                }
            ]);
            const content = (0, accelance_components_1.extractResponseContent)(response);
            return { content };
        }
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: assistantsService.generateAssistantInstruction - Error generating tool description`);
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: assistantsService.generateAssistantInstruction - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
exports.default = {
    createAssistant,
    deleteAssistant,
    getAllAssistants,
    getAllAssistantsCount,
    getAssistantById,
    updateAssistant,
    importAssistants,
    getChatModels,
    getDocumentStores,
    getTools,
    generateAssistantInstruction,
    getAssistantsCountByOrganization
};
//# sourceMappingURL=index.js.map