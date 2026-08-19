"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const guardrails_1 = __importDefault(require("../../services/guardrails"));
const audit_log_1 = __importDefault(require("../../services/audit-log"));
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const http_status_codes_1 = require("http-status-codes");
const requireWorkspaceId = (req) => {
    const workspaceId = req.user?.activeWorkspaceId;
    if (!workspaceId) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: guardrailsController - workspace not found!`);
    }
    return workspaceId;
};
const listCatalog = async (req, res, next) => {
    try {
        const apiResponse = await guardrails_1.default.listCatalog(requireWorkspaceId(req));
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const createCustomCatalogItem = async (req, res, next) => {
    try {
        const workspaceId = requireWorkspaceId(req);
        const { name, description, defaultConfig } = req.body || {};
        if (!name || !description) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: guardrailsController.createCustomCatalogItem - name/description not provided!`);
        }
        const apiResponse = await guardrails_1.default.createCustomCatalogItem(workspaceId, name, description, defaultConfig, req.user?.id);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const listPolicies = async (req, res, next) => {
    try {
        const workspaceId = requireWorkspaceId(req);
        const chatflowId = req.query.chatflowId;
        const apiResponse = await guardrails_1.default.listPolicies(workspaceId, chatflowId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const upsertPolicy = async (req, res, next) => {
    try {
        const workspaceId = requireWorkspaceId(req);
        const { chatflowId, catalogKey, enabled, config } = req.body || {};
        if (!catalogKey || typeof enabled !== 'boolean') {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: guardrailsController.upsertPolicy - catalogKey/enabled not provided!`);
        }
        const apiResponse = await guardrails_1.default.upsertPolicy(workspaceId, chatflowId, catalogKey, enabled, config, req.user?.id);
        await audit_log_1.default.record(workspaceId, req.user?.id, 'guardrail_policy.upsert', 'GuardrailPolicy', apiResponse.id, {
            catalogKey,
            enabled,
            chatflowId: chatflowId || null
        });
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const deletePolicy = async (req, res, next) => {
    try {
        if (!req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: guardrailsController.deletePolicy - id not provided!`);
        }
        const apiResponse = await guardrails_1.default.deletePolicy(req.params.id, requireWorkspaceId(req));
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getSummary = async (req, res, next) => {
    try {
        const workspaceId = requireWorkspaceId(req);
        if (!req.params.chatflowId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: guardrailsController.getSummary - chatflowId not provided!`);
        }
        const apiResponse = await guardrails_1.default.getSummary(workspaceId, req.params.chatflowId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    listCatalog,
    createCustomCatalogItem,
    listPolicies,
    upsertPolicy,
    deletePolicy,
    getSummary
};
//# sourceMappingURL=index.js.map