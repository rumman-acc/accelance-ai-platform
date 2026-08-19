"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const validation_1 = __importDefault(require("../../services/validation"));
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const http_status_codes_1 = require("http-status-codes");
const checkFlowValidation = async (req, res, next) => {
    try {
        const flowId = req.params?.id;
        if (!flowId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: validationController.checkFlowValidation - id not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        const apiResponse = await validation_1.default.checkFlowValidation(flowId, workspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    checkFlowValidation
};
//# sourceMappingURL=index.js.map