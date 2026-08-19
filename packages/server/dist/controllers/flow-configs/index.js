"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const flow_configs_1 = __importDefault(require("../../services/flow-configs"));
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const http_status_codes_1 = require("http-status-codes");
const getSingleFlowConfig = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: flowConfigsController.getSingleFlowConfig - id not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: flowConfigsController.getSingleFlowConfig - workspace ${workspaceId} not found!`);
        }
        const apiResponse = await flow_configs_1.default.getSingleFlowConfig(req.params.id, workspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    getSingleFlowConfig
};
//# sourceMappingURL=index.js.map