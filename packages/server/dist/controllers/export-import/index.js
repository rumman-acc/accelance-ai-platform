"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const export_import_1 = __importDefault(require("../../services/export-import"));
const exportData = async (req, res, next) => {
    try {
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: exportImportController.exportData - workspace ${workspaceId} not found!`);
        }
        const apiResponse = await export_import_1.default.exportData(export_import_1.default.convertExportInput(req.body), workspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const importData = async (req, res, next) => {
    try {
        const orgId = req.user?.activeOrganizationId;
        if (!orgId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: exportImportController.importData - organization ${orgId} not found!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: exportImportController.importData - workspace ${workspaceId} not found!`);
        }
        const subscriptionId = req.user?.activeOrganizationSubscriptionId || '';
        const importData = req.body;
        if (!importData) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Error: exportImportController.importData - importData is required!');
        }
        await export_import_1.default.importData(importData, orgId, workspaceId, subscriptionId);
        return res.status(http_status_codes_1.StatusCodes.OK).json({ message: 'success' });
    }
    catch (error) {
        next(error);
    }
};
const exportChatflowMessages = async (req, res, next) => {
    try {
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: exportImportController.exportChatflowMessages - workspace ${workspaceId} not found!`);
        }
        const { chatflowId, chatType, feedbackType, startDate, endDate } = req.body;
        if (!chatflowId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Error: exportImportController.exportChatflowMessages - chatflowId is required!');
        }
        const apiResponse = await export_import_1.default.exportChatflowMessages(chatflowId, chatType, feedbackType, startDate, endDate, workspaceId);
        // Set headers for file download
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${chatflowId}-Message.json"`);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    exportData,
    importData,
    exportChatflowMessages
};
//# sourceMappingURL=index.js.map