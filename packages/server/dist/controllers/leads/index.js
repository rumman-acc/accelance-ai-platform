"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chatflows_1 = __importDefault(require("../../services/chatflows"));
const leads_1 = __importDefault(require("../../services/leads"));
const http_status_codes_1 = require("http-status-codes");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const getAllLeadsForChatflow = async (req, res, next) => {
    try {
        if (typeof req.params.id === 'undefined' || req.params.id === '') {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: leadsController.getAllLeadsForChatflow - id not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: leadsController.getAllLeadsForChatflow - workspace ${workspaceId} not found!`);
        }
        const chatflowid = req.params.id;
        const chatflow = await chatflows_1.default.getChatflowByIdForWorkspace(chatflowid, workspaceId);
        if (!chatflow) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: leadsController.getAllLeadsForChatflow - chatflow ${chatflowid} not found in workspace ${workspaceId}`);
        }
        const apiResponse = await leads_1.default.getAllLeads(chatflowid);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const createLeadInChatflow = async (req, res, next) => {
    try {
        if (typeof req.body === 'undefined' || req.body === '') {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: leadsController.createLeadInChatflow - body not provided!`);
        }
        const apiResponse = await leads_1.default.createLead(req.body);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    createLeadInChatflow,
    getAllLeadsForChatflow
};
//# sourceMappingURL=index.js.map