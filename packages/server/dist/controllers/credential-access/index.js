"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const credential_access_1 = __importDefault(require("../../services/credential-access"));
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const http_status_codes_1 = require("http-status-codes");
const listAccess = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.credentialId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: credentialAccessController.listAccess - credentialId not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: credentialAccessController.listAccess - workspace not found!`);
        }
        const apiResponse = await credential_access_1.default.listAccessForCredential(req.params.credentialId, workspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const grantAccess = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.credentialId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: credentialAccessController.grantAccess - credentialId not provided!`);
        }
        if (!req.body?.userId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: credentialAccessController.grantAccess - userId not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: credentialAccessController.grantAccess - workspace not found!`);
        }
        const apiResponse = await credential_access_1.default.grantAccess(req.params.credentialId, req.body.userId, workspaceId, req.user?.id);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const revokeAccess = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.credentialId || !req.params.userId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: credentialAccessController.revokeAccess - credentialId/userId not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: credentialAccessController.revokeAccess - workspace not found!`);
        }
        const apiResponse = await credential_access_1.default.revokeAccess(req.params.credentialId, req.params.userId, workspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    listAccess,
    grantAccess,
    revokeAccess
};
//# sourceMappingURL=index.js.map