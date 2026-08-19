"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tool_policy_1 = __importDefault(require("../../services/tool-policy"));
const audit_log_1 = __importDefault(require("../../services/audit-log"));
const AgentToolPolicy_1 = require("../../database/entities/AgentToolPolicy");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const http_status_codes_1 = require("http-status-codes");
const listPolicies = async (req, res, next) => {
    try {
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: toolPolicyController.listPolicies - workspace not found!`);
        }
        const chatflowId = req.query.chatflowId;
        const apiResponse = await tool_policy_1.default.listPolicies(workspaceId, chatflowId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const upsertPolicy = async (req, res, next) => {
    try {
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: toolPolicyController.upsertPolicy - workspace not found!`);
        }
        const { chatflowId, toolNodeName, effect } = req.body || {};
        if (!toolNodeName || !effect) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: toolPolicyController.upsertPolicy - toolNodeName/effect not provided!`);
        }
        if (effect !== AgentToolPolicy_1.AgentToolPolicyEffect.ALLOW && effect !== AgentToolPolicy_1.AgentToolPolicyEffect.DENY) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, `Error: toolPolicyController.upsertPolicy - invalid effect!`);
        }
        const apiResponse = await tool_policy_1.default.upsertPolicy(workspaceId, chatflowId, toolNodeName, effect, req.user?.id);
        await audit_log_1.default.record(workspaceId, req.user?.id, 'tool_policy.upsert', 'AgentToolPolicy', apiResponse.id, {
            toolNodeName,
            effect,
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
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: toolPolicyController.deletePolicy - id not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: toolPolicyController.deletePolicy - workspace not found!`);
        }
        const apiResponse = await tool_policy_1.default.deletePolicy(req.params.id, workspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    listPolicies,
    upsertPolicy,
    deletePolicy
};
//# sourceMappingURL=index.js.map