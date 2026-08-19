"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.utilAddChatMessage = void 0;
const ChatMessage_1 = require("../database/entities/ChatMessage");
const ChatFlow_1 = require("../database/entities/ChatFlow");
const getRunningExpressApp_1 = require("../utils/getRunningExpressApp");
const contentRedaction_1 = require("./contentRedaction");
const guardrails_1 = __importDefault(require("../services/guardrails"));
/**
 * PII-redaction guardrail chokepoint: only queries/redacts when the message actually has content
 * and a chatflowid to resolve a workspace from -- must never throw, this runs on the hot
 * message-persistence path for every chat turn.
 */
const applyRedactionGuardrail = async (chatMessage, dataSource) => {
    if (!chatMessage.content || !chatMessage.chatflowid)
        return;
    try {
        const chatflow = await dataSource.getRepository(ChatFlow_1.ChatFlow).findOne({
            where: { id: chatMessage.chatflowid },
            select: ['id', 'workspaceId']
        });
        if (!chatflow?.workspaceId)
            return;
        const extraPatterns = await guardrails_1.default.getActiveRedactionPatterns(chatflow.workspaceId, chatMessage.chatflowid);
        if (extraPatterns === null)
            return;
        chatMessage.content = (0, contentRedaction_1.redactContent)(chatMessage.content, { patterns: extraPatterns });
    }
    catch (e) {
        // Guardrail evaluation must never break a chat message save.
        console.error('Failed to apply PII redaction guardrail', e);
    }
};
/**
 * Method that add chat messages.
 * @param {Partial<IChatMessage>} chatMessage
 */
const utilAddChatMessage = async (chatMessage, appDataSource) => {
    const dataSource = appDataSource ?? (0, getRunningExpressApp_1.getRunningExpressApp)().AppDataSource;
    await applyRedactionGuardrail(chatMessage, dataSource);
    const newChatMessage = new ChatMessage_1.ChatMessage();
    Object.assign(newChatMessage, chatMessage);
    if (!newChatMessage.createdDate) {
        newChatMessage.createdDate = new Date();
    }
    const chatmessage = await dataSource.getRepository(ChatMessage_1.ChatMessage).create(newChatMessage);
    const dbResponse = await dataSource.getRepository(ChatMessage_1.ChatMessage).save(chatmessage);
    return dbResponse;
};
exports.utilAddChatMessage = utilAddChatMessage;
//# sourceMappingURL=addChatMesage.js.map