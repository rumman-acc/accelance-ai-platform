"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const composio_catalog_1 = __importDefault(require("../../services/composio-catalog"));
const requireWorkspaceId = (req) => {
    const workspaceId = req.user?.activeWorkspaceId;
    if (!workspaceId) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: composioCatalogController - workspace not found!`);
    }
    return workspaceId;
};
const searchActions = async (req, res, next) => {
    try {
        const workspaceId = requireWorkspaceId(req);
        const credentialId = req.query.credentialId;
        const query = req.query.query || '';
        if (!credentialId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: composioCatalogController.searchActions - credentialId not provided!`);
        }
        const apiResponse = await composio_catalog_1.default.searchActions(credentialId, workspaceId, query);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const listConnections = async (req, res, next) => {
    try {
        const workspaceId = requireWorkspaceId(req);
        const credentialId = req.query.credentialId;
        const appName = req.query.appName;
        if (!credentialId || !appName) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: composioCatalogController.listConnections - credentialId/appName not provided!`);
        }
        const apiResponse = await composio_catalog_1.default.listConnections(credentialId, workspaceId, appName);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const importAction = async (req, res, next) => {
    try {
        const workspaceId = requireWorkspaceId(req);
        const orgId = req.user?.activeOrganizationId;
        if (!orgId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: composioCatalogController.importAction - organization not found!`);
        }
        if (!req.body) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: composioCatalogController.importAction - body not provided!`);
        }
        const { credentialId, actionName, connectedAccountId } = req.body;
        if (!credentialId || !actionName) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: composioCatalogController.importAction - credentialId/actionName not provided!`);
        }
        const apiResponse = await composio_catalog_1.default.importAction(credentialId, workspaceId, orgId, actionName, connectedAccountId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    searchActions,
    listConnections,
    importAction
};
//# sourceMappingURL=index.js.map