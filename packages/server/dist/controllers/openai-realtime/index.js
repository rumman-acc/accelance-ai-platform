"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const openai_realtime_1 = __importDefault(require("../../services/openai-realtime"));
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const http_status_codes_1 = require("http-status-codes");
const getAgentTools = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: openaiRealTimeController.getAgentTools - id not provided!`);
        }
        const apiResponse = await openai_realtime_1.default.getAgentTools(req.params.id);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const executeAgentTool = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: openaiRealTimeController.executeAgentTool - id not provided!`);
        }
        if (!req.body) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: openaiRealTimeController.executeAgentTool - body not provided!`);
        }
        if (!req.body.chatId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: openaiRealTimeController.executeAgentTool - body chatId not provided!`);
        }
        if (!req.body.toolName) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: openaiRealTimeController.executeAgentTool - body toolName not provided!`);
        }
        if (!req.body.inputArgs) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: openaiRealTimeController.executeAgentTool - body inputArgs not provided!`);
        }
        const apiResponse = await openai_realtime_1.default.executeAgentTool(req.params.id, req.body.chatId, req.body.toolName, req.body.inputArgs, req.body.apiMessageId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    getAgentTools,
    executeAgentTool
};
//# sourceMappingURL=index.js.map