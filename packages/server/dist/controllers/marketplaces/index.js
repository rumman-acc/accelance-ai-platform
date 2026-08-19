"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const marketplaces_1 = __importDefault(require("../../services/marketplaces"));
const stripProtectedFields_1 = require("../../utils/stripProtectedFields");
// Get all templates for marketplaces
const getAllTemplates = async (req, res, next) => {
    try {
        const apiResponse = await marketplaces_1.default.getAllTemplates();
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const deleteCustomTemplate = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: marketplacesService.deleteCustomTemplate - id not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: marketplacesController.deleteCustomTemplate - workspace ${workspaceId} not found!`);
        }
        const apiResponse = await marketplaces_1.default.deleteCustomTemplate(req.params.id, workspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getAllCustomTemplates = async (req, res, next) => {
    try {
        const apiResponse = await marketplaces_1.default.getAllCustomTemplates(req.user?.activeWorkspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const saveCustomTemplate = async (req, res, next) => {
    try {
        if ((!req.body && !(req.body.chatflowId || req.body.tool)) || !req.body.name) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: marketplacesService.saveCustomTemplate - body not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: marketplacesController.saveCustomTemplate - workspace ${workspaceId} not found!`);
        }
        const apiResponse = await marketplaces_1.default.saveCustomTemplate({ ...(0, stripProtectedFields_1.stripProtectedFields)(req.body), workspaceId });
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    getAllTemplates,
    getAllCustomTemplates,
    saveCustomTemplate,
    deleteCustomTemplate
};
//# sourceMappingURL=index.js.map