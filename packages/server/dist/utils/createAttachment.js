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
exports.createFileAttachment = void 0;
const path = __importStar(require("path"));
const accelance_components_1 = require("accelance-components");
const getRunningExpressApp_1 = require("./getRunningExpressApp");
const fileValidation_1 = require("./fileValidation");
const logger_1 = __importDefault(require("./logger"));
const utils_1 = require("../errors/utils");
const quotaUsage_1 = require("./quotaUsage");
const ChatFlow_1 = require("../database/entities/ChatFlow");
const workspace_entity_1 = require("../enterprise/database/entities/workspace.entity");
const organization_entity_1 = require("../enterprise/database/entities/organization.entity");
const internalAccelanceError_1 = require("../errors/internalAccelanceError");
const http_status_codes_1 = require("http-status-codes");
/**
 * Create attachment
 * @param {Request} req
 */
const createFileAttachment = async (req) => {
    const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
    const chatflowid = req.params.chatflowId;
    const chatId = req.params.chatId;
    if (!chatflowid || !(0, accelance_components_1.isValidUUID)(chatflowid)) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid chatflowId format - must be a valid UUID');
    }
    if ((0, accelance_components_1.isPathTraversal)(chatflowid) || (chatId && (0, accelance_components_1.isPathTraversal)(chatId))) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid path characters detected');
    }
    // Validate chatflow exists and check API key
    const chatflow = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).findOneBy({
        id: chatflowid
    });
    if (!chatflow) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Chatflow ${chatflowid} not found`);
    }
    let orgId = req.user?.activeOrganizationId || '';
    let workspaceId = req.user?.activeWorkspaceId || '';
    let subscriptionId = req.user?.activeOrganizationSubscriptionId || '';
    // This is one of the WHITELIST_URLS, API can be public and there might be no req.user
    if (!orgId || !workspaceId) {
        const chatflowWorkspaceId = chatflow.workspaceId;
        const workspace = await appServer.AppDataSource.getRepository(workspace_entity_1.Workspace).findOneBy({
            id: chatflowWorkspaceId
        });
        if (!workspace) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Workspace ${chatflowWorkspaceId} not found`);
        }
        workspaceId = workspace.id;
        const org = await appServer.AppDataSource.getRepository(organization_entity_1.Organization).findOneBy({
            id: workspace.organizationId
        });
        if (!org) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Organization ${workspace.organizationId} not found`);
        }
        orgId = org.id;
        subscriptionId = org.subscriptionId;
    }
    // Parse chatbot configuration to get file upload settings
    let pdfConfig = {
        usage: 'perPage',
        legacyBuild: false
    };
    let allowedFileTypes = [];
    let fileUploadEnabled = false;
    if (chatflow.chatbotConfig) {
        try {
            const chatbotConfig = JSON.parse(chatflow.chatbotConfig);
            if (chatbotConfig?.fullFileUpload) {
                fileUploadEnabled = chatbotConfig.fullFileUpload.status;
                // Get allowed file types from configuration
                if (chatbotConfig.fullFileUpload.allowedUploadFileTypes) {
                    allowedFileTypes = chatbotConfig.fullFileUpload.allowedUploadFileTypes.split(',');
                }
                // PDF specific configuration
                if (chatbotConfig.fullFileUpload.pdfFile) {
                    if (chatbotConfig.fullFileUpload.pdfFile.usage) {
                        pdfConfig.usage = chatbotConfig.fullFileUpload.pdfFile.usage;
                    }
                    if (chatbotConfig.fullFileUpload.pdfFile.legacyBuild !== undefined) {
                        pdfConfig.legacyBuild = chatbotConfig.fullFileUpload.pdfFile.legacyBuild;
                    }
                }
            }
        }
        catch (e) {
            // Use default config if parsing fails
        }
    }
    // Check if file upload is enabled
    if (!fileUploadEnabled) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'File upload is not enabled for this chatflow');
    }
    // Find FileLoader node
    const fileLoaderComponent = appServer.nodesPool.componentNodes['fileLoader'];
    const fileLoaderNodeInstanceFilePath = fileLoaderComponent.filePath;
    const fileLoaderNodeModule = await Promise.resolve(`${fileLoaderNodeInstanceFilePath}`).then(s => __importStar(require(s)));
    const fileLoaderNodeInstance = new fileLoaderNodeModule.nodeClass();
    const options = {
        retrieveAttachmentChatId: true,
        orgId,
        workspaceId,
        chatflowid,
        chatId
    };
    const files = req.files || [];
    const fileAttachments = [];
    if (files.length) {
        const isBase64 = req.body.base64;
        for (const file of files) {
            if (!allowedFileTypes.length) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, `File type '${file.mimetype}' is not allowed. Allowed types: ${allowedFileTypes.join(', ')}`);
            }
            // Validate file type against allowed types
            if (allowedFileTypes.length > 0 && !allowedFileTypes.includes(file.mimetype)) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, `File type '${file.mimetype}' is not allowed. Allowed types: ${allowedFileTypes.join(', ')}`);
            }
            // Security fix: Verify file extension matches the declared MIME type
            // This prevents MIME type spoofing attacks (e.g., uploading .js file with text/plain MIME type)
            // This addresses the vulnerability (CVE-2025-61687)
            (0, fileValidation_1.validateFileMimeTypeAndExtensionMatch)(file.originalname, file.mimetype);
            await (0, quotaUsage_1.checkStorage)(orgId, subscriptionId, appServer.usageCacheManager);
            const fileBuffer = await (0, accelance_components_1.getFileFromUpload)(file.path ?? file.key);
            const fileNames = [];
            // Address file name with special characters: https://github.com/expressjs/multer/issues/1104
            file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
            const { path: storagePath, totalSize } = await (0, accelance_components_1.addArrayFilesToStorage)(file.mimetype, fileBuffer, file.originalname, fileNames, orgId, chatflowid, chatId);
            await (0, quotaUsage_1.updateStorageUsage)(orgId, workspaceId, totalSize, appServer.usageCacheManager);
            const fileInputFieldFromMimeType = (0, accelance_components_1.mapMimeTypeToInputField)(file.mimetype);
            const fileExtension = path.extname(file.originalname);
            const fileInputFieldFromExt = (0, accelance_components_1.mapExtToInputField)(fileExtension);
            let fileInputField = 'txtFile';
            if (fileInputFieldFromExt !== 'txtFile') {
                fileInputField = fileInputFieldFromExt;
            }
            else if (fileInputFieldFromMimeType !== 'txtFile') {
                fileInputField = fileInputFieldFromExt;
            }
            await (0, accelance_components_1.removeSpecificFileFromUpload)(file.path ?? file.key);
            // Track sanitized filename for cleanup if processing fails
            const sanitizedFilename = fileNames.length > 0 ? fileNames[0] : undefined;
            try {
                const nodeData = {
                    inputs: {
                        [fileInputField]: storagePath
                    },
                    outputs: { output: 'document' }
                };
                // Apply PDF specific configuration if this is a PDF file
                if (fileInputField === 'pdfFile') {
                    nodeData.inputs.usage = pdfConfig.usage;
                    nodeData.inputs.legacyBuild = pdfConfig.legacyBuild;
                }
                let content = '';
                if (isBase64) {
                    content = fileBuffer.toString('base64');
                }
                else {
                    const documents = await fileLoaderNodeInstance.init(nodeData, '', options);
                    content = documents.map((doc) => doc.pageContent).join('\n');
                }
                fileAttachments.push({
                    name: file.originalname,
                    mimeType: file.mimetype,
                    size: file.size,
                    content
                });
            }
            catch (error) {
                // Security: Clean up storage if processing failed, which includes invalid file type or content detacted from loader
                if (sanitizedFilename) {
                    logger_1.default.info(`Clean up storage for ${file.originalname} (${sanitizedFilename}). Reason: ${(0, utils_1.getErrorMessage)(error)}`);
                    try {
                        const { totalSize: newTotalSize } = await (0, accelance_components_1.removeSpecificFileFromStorage)(orgId, chatflowid, chatId, sanitizedFilename);
                        await (0, quotaUsage_1.updateStorageUsage)(orgId, workspaceId, newTotalSize, appServer.usageCacheManager);
                    }
                    catch (cleanupError) {
                        logger_1.default.error(`Failed to cleanup storage for ${file.originalname} (${sanitizedFilename}) - ${(0, utils_1.getErrorMessage)(cleanupError)}`);
                    }
                }
                throw new Error(`Failed createFileAttachment: ${file.originalname} (${file.mimetype} - ${(0, utils_1.getErrorMessage)(error)}`);
            }
        }
    }
    return fileAttachments;
};
exports.createFileAttachment = createFileAttachment;
//# sourceMappingURL=createAttachment.js.map