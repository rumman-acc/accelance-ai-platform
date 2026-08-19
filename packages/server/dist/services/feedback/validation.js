"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFeedbackForUpdate = exports.validateFeedbackForCreation = exports.validateFeedbackExists = exports.validateMessageExists = void 0;
const http_status_codes_1 = require("http-status-codes");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const ChatMessage_1 = require("../../database/entities/ChatMessage");
const ChatMessageFeedback_1 = require("../../database/entities/ChatMessageFeedback");
/**
 * Validates that the message ID exists
 * @param {string} messageId
 */
const validateMessageExists = async (messageId) => {
    const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
    const message = await appServer.AppDataSource.getRepository(ChatMessage_1.ChatMessage).findOne({
        where: { id: messageId }
    });
    if (!message) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Message with ID ${messageId} not found`);
    }
    return message;
};
exports.validateMessageExists = validateMessageExists;
/**
 * Validates that the feedback ID exists
 * @param {string} feedbackId
 */
const validateFeedbackExists = async (feedbackId) => {
    const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
    const feedbackExists = await appServer.AppDataSource.getRepository(ChatMessageFeedback_1.ChatMessageFeedback).findOne({
        where: { id: feedbackId }
    });
    if (!feedbackExists) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Feedback with ID ${feedbackId} not found`);
    }
    return feedbackExists;
};
exports.validateFeedbackExists = validateFeedbackExists;
/**
 * Validates a feedback object for creation
 * @param {Partial<IChatMessageFeedback>} feedback
 */
const validateFeedbackForCreation = async (feedback) => {
    // If messageId is provided, validate it exists and get the message
    let message = null;
    if (feedback.messageId) {
        message = await (0, exports.validateMessageExists)(feedback.messageId);
    }
    else {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Message ID is required');
    }
    // If chatId is provided, validate it matches the message's chatId
    if (feedback.chatId) {
        if (message.chatId !== feedback.chatId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, `Inconsistent chat ID: message with ID ${message.id} does not belong to chat with ID ${feedback.chatId}`);
        }
    }
    else {
        // If not provided, use the message's chatId
        feedback.chatId = message.chatId;
    }
    // If chatflowid is provided, validate it matches the message's chatflowid
    if (feedback.chatflowid) {
        if (message.chatflowid !== feedback.chatflowid) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, `Inconsistent chatflow ID: message with ID ${message.id} does not belong to chatflow with ID ${feedback.chatflowid}`);
        }
    }
    else {
        // If not provided, use the message's chatflowid
        feedback.chatflowid = message.chatflowid;
    }
    return feedback;
};
exports.validateFeedbackForCreation = validateFeedbackForCreation;
/**
 * Validates a feedback object for update
 * @param {string} feedbackId
 * @param {Partial<IChatMessageFeedback>} feedback
 */
const validateFeedbackForUpdate = async (feedbackId, feedback) => {
    // First validate the feedback exists
    const existingFeedback = await (0, exports.validateFeedbackExists)(feedbackId);
    feedback.messageId = feedback.messageId ?? existingFeedback.messageId;
    feedback.chatId = feedback.chatId ?? existingFeedback.chatId;
    feedback.chatflowid = feedback.chatflowid ?? existingFeedback.chatflowid;
    // If messageId is provided, validate it exists and get the message
    let message = null;
    if (feedback.messageId) {
        message = await (0, exports.validateMessageExists)(feedback.messageId);
    }
    // If chatId is provided and we have a message, validate it matches the message's chatId
    if (feedback.chatId) {
        if (message?.chatId !== feedback.chatId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, `Inconsistent chat ID: message with ID ${message?.id} does not belong to chat with ID ${feedback.chatId}`);
        }
    }
    // If chatflowid is provided and we have a message, validate it matches the message's chatflowid
    if (feedback.chatflowid && message) {
        if (message?.chatflowid !== feedback.chatflowid) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, `Inconsistent chatflow ID: message with ID ${message?.id} does not belong to chatflow with ID ${feedback.chatflowid}`);
        }
    }
    return feedback;
};
exports.validateFeedbackForUpdate = validateFeedbackForUpdate;
//# sourceMappingURL=validation.js.map