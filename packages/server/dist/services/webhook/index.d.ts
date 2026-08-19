declare const _default: {
    validateWebhookChatflow: (chatflowId: string, workspaceId?: string, body?: Record<string, any>, method?: string, headers?: Record<string, any>, query?: Record<string, any>, rawBody?: Buffer, options?: {
        skipFieldValidation?: boolean;
    }) => Promise<{
        responseMode: "sync" | "async" | "stream";
        callbackUrl?: string;
        callbackSecret?: string;
    }>;
};
export default _default;
