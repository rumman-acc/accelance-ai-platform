"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const feedback_1 = __importDefault(require("../../services/feedback"));
const validation_1 = require("../../services/feedback/validation");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const http_status_codes_1 = require("http-status-codes");
const getAllChatMessageFeedback = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: feedbackController.getAllChatMessageFeedback - id not provided!`);
        }
        const chatflowid = req.params.id;
        const chatId = req.query?.chatId;
        const sortOrder = req.query?.order;
        const startDate = req.query?.startDate;
        const endDate = req.query?.endDate;
        const apiResponse = await feedback_1.default.getAllChatMessageFeedback(chatflowid, chatId, sortOrder, startDate, endDate);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const createChatMessageFeedbackForChatflow = async (req, res, next) => {
    try {
        if (!req.body) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: feedbackController.createChatMessageFeedbackForChatflow - body not provided!`);
        }
        await (0, validation_1.validateFeedbackForCreation)(req.body);
        const apiResponse = await feedback_1.default.createChatMessageFeedbackForChatflow(req.body);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const updateChatMessageFeedbackForChatflow = async (req, res, next) => {
    try {
        if (!req.body) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: feedbackController.updateChatMessageFeedbackForChatflow - body not provided!`);
        }
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: feedbackController.updateChatMessageFeedbackForChatflow - id not provided!`);
        }
        await (0, validation_1.validateFeedbackForUpdate)(req.params.id, req.body);
        const apiResponse = await feedback_1.default.updateChatMessageFeedbackForChatflow(req.params.id, req.body);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    getAllChatMessageFeedback,
    createChatMessageFeedbackForChatflow,
    updateChatMessageFeedbackForChatflow
};
//# sourceMappingURL=index.js.map