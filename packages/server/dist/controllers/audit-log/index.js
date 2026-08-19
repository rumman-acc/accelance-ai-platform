"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const audit_log_1 = __importDefault(require("../../services/audit-log"));
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const http_status_codes_1 = require("http-status-codes");
const list = async (req, res, next) => {
    try {
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: auditLogController.list - workspace not found!`);
        }
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
        const apiResponse = await audit_log_1.default.list(workspaceId, limit);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    list
};
//# sourceMappingURL=index.js.map