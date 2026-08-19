"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = __importDefault(require("openai"));
const http_status_codes_1 = require("http-status-codes");
const utils_1 = require("../../utils");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const Credential_1 = require("../../database/entities/Credential");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const utils_2 = require("../../errors/utils");
const accelance_components_1 = require("accelance-components");
// ----------------------------------------
// Assistants
// ----------------------------------------
// List available assistants
const getAllOpenaiAssistants = async (credentialId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const credential = await appServer.AppDataSource.getRepository(Credential_1.Credential).findOneBy({
            id: credentialId
        });
        if (!credential) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Credential ${credentialId} not found in the database!`);
        }
        // Decrpyt credentialData
        const decryptedCredentialData = await (0, utils_1.decryptCredentialData)(credential.encryptedData);
        const openAIApiKey = decryptedCredentialData['openAIApiKey'];
        if (!openAIApiKey) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `OpenAI ApiKey not found`);
        }
        const openai = new openai_1.default({ apiKey: openAIApiKey });
        const retrievedAssistants = await openai.beta.assistants.list();
        const dbResponse = retrievedAssistants.data;
        return dbResponse;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: openaiAssistantsService.getAllOpenaiAssistants - ${(0, utils_2.getErrorMessage)(error)}`);
    }
};
// Get assistant object
const getSingleOpenaiAssistant = async (credentialId, assistantId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const credential = await appServer.AppDataSource.getRepository(Credential_1.Credential).findOneBy({
            id: credentialId
        });
        if (!credential) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Credential ${credentialId} not found in the database!`);
        }
        // Decrpyt credentialData
        const decryptedCredentialData = await (0, utils_1.decryptCredentialData)(credential.encryptedData);
        const openAIApiKey = decryptedCredentialData['openAIApiKey'];
        if (!openAIApiKey) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `OpenAI ApiKey not found`);
        }
        const openai = new openai_1.default({ apiKey: openAIApiKey });
        const dbResponse = await openai.beta.assistants.retrieve(assistantId);
        const resp = await openai.files.list();
        const existingFiles = resp.data ?? [];
        if (dbResponse.tool_resources?.code_interpreter?.file_ids?.length) {
            ;
            dbResponse.tool_resources.code_interpreter.files = [
                ...existingFiles.filter((file) => dbResponse.tool_resources?.code_interpreter?.file_ids?.includes(file.id))
            ];
        }
        if (dbResponse.tool_resources?.file_search?.vector_store_ids?.length) {
            // Since there can only be 1 vector store per assistant
            const vectorStoreId = dbResponse.tool_resources.file_search.vector_store_ids[0];
            const vectorStoreFiles = await openai.vectorStores.files.list(vectorStoreId);
            const fileIds = vectorStoreFiles.data?.map((file) => file.id) ?? [];
            dbResponse.tool_resources.file_search.files = [...existingFiles.filter((file) => fileIds.includes(file.id))];
            dbResponse.tool_resources.file_search.vector_store_object = await openai.vectorStores.retrieve(vectorStoreId);
        }
        return dbResponse;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: openaiAssistantsService.getSingleOpenaiAssistant - ${(0, utils_2.getErrorMessage)(error)}`);
    }
};
const uploadFilesToAssistant = async (credentialId, files) => {
    const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
    const credential = await appServer.AppDataSource.getRepository(Credential_1.Credential).findOneBy({
        id: credentialId
    });
    if (!credential) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Credential ${credentialId} not found in the database!`);
    }
    // Decrpyt credentialData
    const decryptedCredentialData = await (0, utils_1.decryptCredentialData)(credential.encryptedData);
    const openAIApiKey = decryptedCredentialData['openAIApiKey'];
    if (!openAIApiKey) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `OpenAI ApiKey not found`);
    }
    const openai = new openai_1.default({ apiKey: openAIApiKey });
    const uploadedFiles = [];
    for (const file of files) {
        const fileBuffer = await (0, accelance_components_1.getFileFromUpload)(file.filePath);
        const toFile = await openai_1.default.toFile(fileBuffer, file.fileName);
        const createdFile = await openai.files.create({
            file: toFile,
            purpose: 'assistants'
        });
        uploadedFiles.push(createdFile);
        await (0, accelance_components_1.removeSpecificFileFromUpload)(file.filePath);
    }
    return uploadedFiles;
};
exports.default = {
    getAllOpenaiAssistants,
    getSingleOpenaiAssistant,
    uploadFilesToAssistant
};
//# sourceMappingURL=index.js.map