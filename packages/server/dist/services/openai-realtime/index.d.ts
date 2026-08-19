declare const _default: {
    getAgentTools: (chatflowid: string) => Promise<any>;
    executeAgentTool: (chatflowid: string, chatId: string, toolName: string, inputArgs: string, apiMessageId?: string) => Promise<any>;
};
export default _default;
