"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.utilUpdateChatMessageFeedback = void 0;
const getRunningExpressApp_1 = require("../utils/getRunningExpressApp");
const ChatMessageFeedback_1 = require("../database/entities/ChatMessageFeedback");
const ChatFlow_1 = require("../database/entities/ChatFlow");
const lunary_1 = __importDefault(require("lunary"));
/**
 * Method that updates chat message feedback.
 * @param {string} id
 * @param {Partial<IChatMessageFeedback>} chatMessageFeedback
 */
const utilUpdateChatMessageFeedback = async (id, chatMessageFeedback) => {
    const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
    const newChatMessageFeedback = new ChatMessageFeedback_1.ChatMessageFeedback();
    Object.assign(newChatMessageFeedback, chatMessageFeedback);
    await appServer.AppDataSource.getRepository(ChatMessageFeedback_1.ChatMessageFeedback).update({ id }, chatMessageFeedback);
    // Fetch the updated entity
    const updatedFeedback = await appServer.AppDataSource.getRepository(ChatMessageFeedback_1.ChatMessageFeedback).findOne({ where: { id } });
    const chatflow = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).findOne({ where: { id: updatedFeedback?.chatflowid } });
    const analytic = JSON.parse(chatflow?.analytic ?? '{}');
    if (analytic?.lunary?.status === true && updatedFeedback?.rating) {
        lunary_1.default.trackFeedback(updatedFeedback.messageId, {
            comment: updatedFeedback?.content,
            thumb: updatedFeedback?.rating === 'THUMBS_UP' ? 'up' : 'down'
        });
    }
    return { status: 'OK' };
};
exports.utilUpdateChatMessageFeedback = utilUpdateChatMessageFeedback;
//# sourceMappingURL=updateChatMessageFeedback.js.map