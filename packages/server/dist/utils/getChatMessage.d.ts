import { ChatMessageRatingType, ChatType } from '../Interface';
import { ChatMessage } from '../database/entities/ChatMessage';
/**
 * Method that get chat messages.
 * @param {string} chatflowid
 * @param {ChatType[]} chatTypes
 * @param {string} sortOrder
 * @param {string} chatId
 * @param {string} memoryType
 * @param {string} sessionId
 * @param {string} startDate
 * @param {string} endDate
 * @param {boolean} feedback
 * @param {ChatMessageRatingType[]} feedbackTypes
 */
interface GetChatMessageParams {
    chatflowid: string;
    chatTypes?: ChatType[];
    sortOrder?: string;
    chatId?: string;
    memoryType?: string;
    sessionId?: string;
    startDate?: string;
    endDate?: string;
    messageId?: string;
    feedback?: boolean;
    feedbackTypes?: ChatMessageRatingType[];
    activeWorkspaceId?: string;
    page?: number;
    pageSize?: number;
}
export declare const utilGetChatMessage: ({ chatflowid, chatTypes, sortOrder, chatId, memoryType, sessionId, startDate, endDate, messageId, feedback, feedbackTypes, activeWorkspaceId, page, pageSize }: GetChatMessageParams) => Promise<ChatMessage[]>;
export {};
