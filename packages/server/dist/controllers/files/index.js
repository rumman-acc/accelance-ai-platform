"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const accelance_components_1 = require("accelance-components");
const quotaUsage_1 = require("../../utils/quotaUsage");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const http_status_codes_1 = require("http-status-codes");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const getAllFiles = async (req, res, next) => {
    try {
        const activeOrganizationId = req.user?.activeOrganizationId;
        if (!activeOrganizationId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: filesController.getAllFiles - organization ${activeOrganizationId} not found!`);
        }
        const apiResponse = await (0, accelance_components_1.getFilesListFromStorage)(activeOrganizationId);
        const filesList = apiResponse.map((file) => ({
            ...file,
            // replace org id because we don't want to expose it
            path: file.path.replace((0, accelance_components_1.getStoragePath)(), '').replace(`${path_1.default.sep}${activeOrganizationId}${path_1.default.sep}`, '')
        }));
        return res.json(filesList);
    }
    catch (error) {
        next(error);
    }
};
const deleteFile = async (req, res, next) => {
    try {
        const activeOrganizationId = req.user?.activeOrganizationId;
        if (!activeOrganizationId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: filesController.deleteFile - organization ${activeOrganizationId} not found!`);
        }
        const activeWorkspaceId = req.user?.activeWorkspaceId;
        if (!activeWorkspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: filesController.deleteFile - workspace ${activeWorkspaceId} not found!`);
        }
        const filePath = req.query.path;
        const paths = filePath.split(path_1.default.sep).filter((path) => path !== '');
        const { totalSize } = await (0, accelance_components_1.removeSpecificFileFromStorage)(activeOrganizationId, ...paths);
        await (0, quotaUsage_1.updateStorageUsage)(activeOrganizationId, activeWorkspaceId, totalSize, (0, getRunningExpressApp_1.getRunningExpressApp)().usageCacheManager);
        return res.json({ message: 'file_deleted' });
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    getAllFiles,
    deleteFile
};
//# sourceMappingURL=index.js.map