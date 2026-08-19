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
const fs = __importStar(require("fs"));
const openai_assistants_1 = __importDefault(require("../../services/openai-assistants"));
const content_disposition_1 = __importDefault(require("content-disposition"));
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const http_status_codes_1 = require("http-status-codes");
const accelance_components_1 = require("accelance-components");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const ChatFlow_1 = require("../../database/entities/ChatFlow");
const workspace_entity_1 = require("../../enterprise/database/entities/workspace.entity");
const fileValidation_1 = require("../../utils/fileValidation");
// List available assistants
const getAllOpenaiAssistants = async (req, res, next) => {
    try {
        if (typeof req.query === 'undefined' || !req.query.credential) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: openaiAssistantsController.getAllOpenaiAssistants - credential not provided!`);
        }
        const apiResponse = await openai_assistants_1.default.getAllOpenaiAssistants(req.query.credential);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
// Get assistant object
const getSingleOpenaiAssistant = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: openaiAssistantsController.getSingleOpenaiAssistant - id not provided!`);
        }
        if (typeof req.query === 'undefined' || !req.query.credential) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: openaiAssistantsController.getSingleOpenaiAssistant - credential not provided!`);
        }
        const apiResponse = await openai_assistants_1.default.getSingleOpenaiAssistant(req.query.credential, req.params.id);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
// Download file from assistant
const getFileFromAssistant = async (req, res, next) => {
    try {
        if (!req.body.chatflowId || !req.body.chatId || !req.body.fileName) {
            return res.status(500).send(`Invalid file path`);
        }
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const chatflowId = req.body.chatflowId;
        const chatId = req.body.chatId;
        const fileName = req.body.fileName;
        // This can be public API, so we can only get orgId from the chatflow
        const chatflow = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).findOneBy({
            id: chatflowId
        });
        if (!chatflow) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Chatflow ${chatflowId} not found`);
        }
        const chatflowWorkspaceId = chatflow.workspaceId;
        const workspace = await appServer.AppDataSource.getRepository(workspace_entity_1.Workspace).findOneBy({
            id: chatflowWorkspaceId
        });
        if (!workspace) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Workspace ${chatflowWorkspaceId} not found`);
        }
        const orgId = workspace.organizationId;
        res.setHeader('Content-Disposition', (0, content_disposition_1.default)(fileName));
        const fileStream = await (0, accelance_components_1.streamStorageFile)(chatflowId, chatId, fileName, orgId);
        if (!fileStream)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: getFileFromAssistant`);
        if (fileStream instanceof fs.ReadStream && fileStream?.pipe) {
            fileStream.pipe(res);
        }
        else {
            res.send(fileStream);
        }
    }
    catch (error) {
        next(error);
    }
};
const uploadAssistantFiles = async (req, res, next) => {
    try {
        if (typeof req.query === 'undefined' || !req.query.credential) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: openaiAssistantsVectorStoreController.uploadFilesToAssistantVectorStore - credential not provided!`);
        }
        const files = req.files ?? [];
        const uploadFiles = [];
        if (Array.isArray(files)) {
            for (const file of files) {
                // Address file name with special characters: https://github.com/expressjs/multer/issues/1104
                file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
                // Validate file extension, MIME type, and content to prevent security vulnerabilities
                (0, fileValidation_1.validateFileMimeTypeAndExtensionMatch)(file.originalname, file.mimetype);
                uploadFiles.push({
                    filePath: file.path ?? file.key,
                    fileName: file.originalname
                });
            }
        }
        const apiResponse = await openai_assistants_1.default.uploadFilesToAssistant(req.query.credential, uploadFiles);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    getAllOpenaiAssistants,
    getSingleOpenaiAssistant,
    getFileFromAssistant,
    uploadAssistantFiles
};
//# sourceMappingURL=index.js.map