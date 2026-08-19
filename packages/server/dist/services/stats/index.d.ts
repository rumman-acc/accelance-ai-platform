import { ChatMessageRatingType, ChatType } from '../../Interface';
declare const _default: {
    getChatflowStats: (chatflowid: string, activeWorkspaceId: string, chatTypes: ChatType[] | undefined, startDate?: string, endDate?: string, feedbackTypes?: ChatMessageRatingType[]) => Promise<any>;
};
export default _default;
