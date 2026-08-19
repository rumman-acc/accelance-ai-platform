import { DeleteResult, FindOptionsWhere } from 'typeorm';
import { ChatMessage } from '../../database/entities/ChatMessage';
import { ChatMessageFeedback } from '../../database/entities/ChatMessageFeedback';
import { ChatMessageRatingType, ChatType, IChatMessage } from '../../Interface';
import { UsageCacheManager } from '../../UsageCacheManager';
declare function getMessagesByChatflowIds(chatflowIds: string[]): Promise<ChatMessage[]>;
declare function getMessagesFeedbackByChatflowIds(chatflowIds: string[]): Promise<ChatMessageFeedback[]>;
declare const _default: {
    createChatMessage: (chatMessage: Partial<IChatMessage>) => Promise<ChatMessage>;
    getAllChatMessages: (chatflowId: string, chatTypes: ChatType[] | undefined, sortOrder?: string, chatId?: string, memoryType?: string, sessionId?: string, startDate?: string, endDate?: string, messageId?: string, feedback?: boolean, feedbackTypes?: ChatMessageRatingType[], activeWorkspaceId?: string, page?: number, pageSize?: number) => Promise<ChatMessage[]>;
    getAllInternalChatMessages: (chatflowId: string, chatTypes: ChatType[] | undefined, sortOrder?: string, chatId?: string, memoryType?: string, sessionId?: string, startDate?: string, endDate?: string, messageId?: string, feedback?: boolean, feedbackTypes?: ChatMessageRatingType[], activeWorkspaceId?: string) => Promise<ChatMessage[]>;
    removeAllChatMessages: (chatId: string, chatflowid: string, deleteOptions: FindOptionsWhere<ChatMessage>, orgId: string, workspaceId: string, usageCacheManager: UsageCacheManager) => Promise<DeleteResult>;
    removeChatMessagesByMessageIds: (chatflowid: string, chatIdMap: Map<string, ChatMessage[]>, messageIds: string[], orgId: string, workspaceId: string, usageCacheManager: UsageCacheManager) => Promise<DeleteResult>;
    abortChatMessage: (chatId: string, chatflowid: string) => Promise<void>;
    getMessagesByChatflowIds: typeof getMessagesByChatflowIds;
    getMessagesFeedbackByChatflowIds: typeof getMessagesFeedbackByChatflowIds;
};
export default _default;
