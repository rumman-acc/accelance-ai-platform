"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = __importDefault(require("openai"));
const http_status_codes_1 = require("http-status-codes");
const Credential_1 = require("../../database/entities/Credential");
const EnterpriseEntities_1 = require("../../enterprise/database/entities/EnterpriseEntities");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const utils_1 = require("../../errors/utils");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const utils_2 = require("../../utils");
const accelance_components_1 = require("accelance-components");
const rethrowIfFlowiseError = (error) => {
    if (error instanceof internalAccelanceError_1.InternalAccelanceError) {
        throw error;
    }
};
const resolveCredentialForWorkspace = async (credentialId, workspaceId) => {
    if (!workspaceId) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Workspace ID is required');
    }
    const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
    const credentialRepo = appServer.AppDataSource.getRepository(Credential_1.Credential);
    let credential = await credentialRepo.findOneBy({
        id: credentialId,
        workspaceId
    });
    if (!credential) {
        const share = await appServer.AppDataSource.getRepository(EnterpriseEntities_1.WorkspaceShared).findOneBy({
            workspaceId,
            sharedItemId: credentialId,
            itemType: 'credential'
        });
        if (share) {
            credential = await credentialRepo.findOneBy({ id: credentialId });
        }
    }
    if (credential) {
        return credential;
    }
    throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Credential not found');
};
const getAssistantVectorStore = async (credentialId, vectorStoreId, workspaceId) => {
    try {
        const credential = await resolveCredentialForWorkspace(credentialId, workspaceId);
        // Decrpyt credentialData
        const decryptedCredentialData = await (0, utils_2.decryptCredentialData)(credential.encryptedData);
        const openAIApiKey = decryptedCredentialData['openAIApiKey'];
        if (!openAIApiKey) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `OpenAI ApiKey not found`);
        }
        const openai = new openai_1.default({ apiKey: openAIApiKey });
        const dbResponse = await openai.vectorStores.retrieve(vectorStoreId);
        return dbResponse;
    }
    catch (error) {
        rethrowIfFlowiseError(error);
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: openaiAssistantsVectorStoreService.getAssistantVectorStore - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const listAssistantVectorStore = async (credentialId, workspaceId) => {
    try {
        const credential = await resolveCredentialForWorkspace(credentialId, workspaceId);
        // Decrpyt credentialData
        const decryptedCredentialData = await (0, utils_2.decryptCredentialData)(credential.encryptedData);
        const openAIApiKey = decryptedCredentialData['openAIApiKey'];
        if (!openAIApiKey) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `OpenAI ApiKey not found`);
        }
        const openai = new openai_1.default({ apiKey: openAIApiKey });
        const dbResponse = await openai.vectorStores.list();
        return dbResponse.data;
    }
    catch (error) {
        rethrowIfFlowiseError(error);
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: openaiAssistantsVectorStoreService.listAssistantVectorStore - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const createAssistantVectorStore = async (credentialId, obj, workspaceId) => {
    try {
        const credential = await resolveCredentialForWorkspace(credentialId, workspaceId);
        // Decrpyt credentialData
        const decryptedCredentialData = await (0, utils_2.decryptCredentialData)(credential.encryptedData);
        const openAIApiKey = decryptedCredentialData['openAIApiKey'];
        if (!openAIApiKey) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `OpenAI ApiKey not found`);
        }
        const openai = new openai_1.default({ apiKey: openAIApiKey });
        const dbResponse = await openai.vectorStores.create(obj);
        return dbResponse;
    }
    catch (error) {
        rethrowIfFlowiseError(error);
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: openaiAssistantsVectorStoreService.createAssistantVectorStore - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const updateAssistantVectorStore = async (credentialId, vectorStoreId, obj, workspaceId) => {
    try {
        const credential = await resolveCredentialForWorkspace(credentialId, workspaceId);
        // Decrpyt credentialData
        const decryptedCredentialData = await (0, utils_2.decryptCredentialData)(credential.encryptedData);
        const openAIApiKey = decryptedCredentialData['openAIApiKey'];
        if (!openAIApiKey) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `OpenAI ApiKey not found`);
        }
        const openai = new openai_1.default({ apiKey: openAIApiKey });
        const dbResponse = await openai.vectorStores.update(vectorStoreId, obj);
        const vectorStoreFiles = await openai.vectorStores.files.list(vectorStoreId);
        if (vectorStoreFiles.data?.length) {
            const files = [];
            for (const file of vectorStoreFiles.data) {
                const fileData = await openai.files.retrieve(file.id);
                files.push(fileData);
            }
            ;
            dbResponse.files = files;
        }
        return dbResponse;
    }
    catch (error) {
        rethrowIfFlowiseError(error);
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: openaiAssistantsVectorStoreService.updateAssistantVectorStore - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const deleteAssistantVectorStore = async (credentialId, vectorStoreId, workspaceId) => {
    try {
        const credential = await resolveCredentialForWorkspace(credentialId, workspaceId);
        // Decrpyt credentialData
        const decryptedCredentialData = await (0, utils_2.decryptCredentialData)(credential.encryptedData);
        const openAIApiKey = decryptedCredentialData['openAIApiKey'];
        if (!openAIApiKey) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `OpenAI ApiKey not found`);
        }
        const openai = new openai_1.default({ apiKey: openAIApiKey });
        const dbResponse = await openai.vectorStores.delete(vectorStoreId);
        return dbResponse;
    }
    catch (error) {
        rethrowIfFlowiseError(error);
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: openaiAssistantsVectorStoreService.deleteAssistantVectorStore - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const uploadFilesToAssistantVectorStore = async (credentialId, vectorStoreId, files, workspaceId) => {
    try {
        const credential = await resolveCredentialForWorkspace(credentialId, workspaceId);
        // Decrpyt credentialData
        const decryptedCredentialData = await (0, utils_2.decryptCredentialData)(credential.encryptedData);
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
        const file_ids = [...uploadedFiles.map((file) => file.id)];
        const res = await openai.vectorStores.fileBatches.createAndPoll(vectorStoreId, {
            file_ids
        });
        if (res.status === 'completed' && res.file_counts.completed === uploadedFiles.length)
            return uploadedFiles;
        else if (res.status === 'failed')
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Error: openaiAssistantsVectorStoreService.uploadFilesToAssistantVectorStore - Upload failed!');
        else
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Error: openaiAssistantsVectorStoreService.uploadFilesToAssistantVectorStore - Upload cancelled!');
    }
    catch (error) {
        rethrowIfFlowiseError(error);
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: openaiAssistantsVectorStoreService.uploadFilesToAssistantVectorStore - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const deleteFilesFromAssistantVectorStore = async (credentialId, vectorStoreId, file_ids, workspaceId) => {
    try {
        const credential = await resolveCredentialForWorkspace(credentialId, workspaceId);
        // Decrpyt credentialData
        const decryptedCredentialData = await (0, utils_2.decryptCredentialData)(credential.encryptedData);
        const openAIApiKey = decryptedCredentialData['openAIApiKey'];
        if (!openAIApiKey) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `OpenAI ApiKey not found`);
        }
        const openai = new openai_1.default({ apiKey: openAIApiKey });
        const deletedFileIds = [];
        let count = 0;
        for (const file of file_ids) {
            const res = await openai.vectorStores.files.delete(file, { vector_store_id: vectorStoreId });
            if (res.deleted) {
                deletedFileIds.push(file);
                count += 1;
            }
        }
        return { deletedFileIds, count };
    }
    catch (error) {
        rethrowIfFlowiseError(error);
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: openaiAssistantsVectorStoreService.uploadFilesToAssistantVectorStore - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
exports.default = {
    getAssistantVectorStore,
    listAssistantVectorStore,
    createAssistantVectorStore,
    updateAssistantVectorStore,
    deleteAssistantVectorStore,
    uploadFilesToAssistantVectorStore,
    deleteFilesFromAssistantVectorStore
};
//# sourceMappingURL=index.js.map