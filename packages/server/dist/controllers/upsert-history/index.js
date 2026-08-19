"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const chatflows_1 = __importDefault(require("../../services/chatflows"));
const upsert_history_1 = __importDefault(require("../../services/upsert-history"));
const getAllUpsertHistory = async (req, res, next) => {
    try {
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: upsertHistoryController.getAllUpsertHistory - workspace ${workspaceId} not found!`);
        }
        const chatflowid = req.params?.id;
        if (!chatflowid) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Error: upsertHistoryController.getAllUpsertHistory - chatflow id is required!');
        }
        await chatflows_1.default.getChatflowById(chatflowid, workspaceId);
        const sortOrder = req.query?.order;
        const startDate = req.query?.startDate;
        const endDate = req.query?.endDate;
        const apiResponse = await upsert_history_1.default.getAllUpsertHistory(sortOrder, chatflowid, startDate, endDate);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const patchDeleteUpsertHistory = async (req, res, next) => {
    try {
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: upsertHistoryController.patchDeleteUpsertHistory - workspace ${workspaceId} not found!`);
        }
        const ids = req.body.ids ?? [];
        const apiResponse = await upsert_history_1.default.patchDeleteUpsertHistory(ids, workspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    getAllUpsertHistory,
    patchDeleteUpsertHistory
};
//# sourceMappingURL=index.js.map