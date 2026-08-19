"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const apikey_1 = __importDefault(require("../../services/apikey"));
const pagination_1 = require("../../utils/pagination");
// Get api keys
const getAllApiKeys = async (req, res, next) => {
    try {
        const user = req.user;
        if (req.query?.type === 'organization' && user.isOrganizationAdmin)
            return res.status(http_status_codes_1.StatusCodes.OK).json(await apikey_1.default.getAllApiKeysByOrganization(user.activeOrganizationId));
        const { page, limit } = (0, pagination_1.getPageAndLimitParams)(req);
        const apiResponse = await apikey_1.default.getAllApiKeys(user, page, limit);
        return res.status(http_status_codes_1.StatusCodes.OK).json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const createApiKey = async (req, res, next) => {
    try {
        if (typeof req.body === 'undefined' || !req.body.keyName) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: apikeyController.createApiKey - keyName not provided!`);
        }
        if (!req.body.permissions ||
            !Array.isArray(req.body.permissions) ||
            req.body.permissions.length === 0 ||
            !req.body.permissions.every((p) => typeof p === 'string')) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: apikeyController.createApiKey - permissions must be an array of strings!`);
        }
        const user = req.user;
        const apiResponse = await apikey_1.default.createApiKey(user, req.body.keyName, req.body.permissions);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
// Update api key
const updateApiKey = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: apikeyController.updateApiKey - id not provided!`);
        }
        if (typeof req.body === 'undefined' || !req.body.keyName) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: apikeyController.updateApiKey - keyName not provided!`);
        }
        if (!req.body.permissions ||
            !Array.isArray(req.body.permissions) ||
            req.body.permissions.length === 0 ||
            !req.body.permissions.every((p) => typeof p === 'string')) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: apikeyController.updateApiKey - permissions must be an array of strings!`);
        }
        const user = req.user;
        const apiResponse = await apikey_1.default.updateApiKey(user, req.params.id, req.body.keyName, req.body.permissions);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
// Delete api key
const deleteApiKey = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: apikeyController.deleteApiKey - id not provided!`);
        }
        if (!req.user?.activeWorkspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Workspace ID is required`);
        }
        const apiResponse = await apikey_1.default.deleteApiKey(req.params.id, req.user?.activeWorkspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
// Verify api key
const verifyApiKey = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.apikey) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: apikeyController.verifyApiKey - apikey not provided!`);
        }
        const apiResponse = await apikey_1.default.verifyApiKey(req.params.apikey);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    createApiKey,
    deleteApiKey,
    getAllApiKeys,
    updateApiKey,
    verifyApiKey
};
//# sourceMappingURL=index.js.map