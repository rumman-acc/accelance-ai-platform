import { ChatFlow } from '../../database/entities/ChatFlow';
import { IMcpServerConfig } from '../../Interface';
/**
 * Parse the mcpServerConfig JSON string from a ChatFlow entity
 */
declare function parseMcpConfig(chatflow: ChatFlow): IMcpServerConfig | null;
declare const _default: {
    getMcpServerConfig: (chatflowId: string, workspaceId: string) => Promise<IMcpServerConfig>;
    createMcpServerConfig: (chatflowId: string, workspaceId: string, body: {
        description: string;
        toolName: string;
    }) => Promise<IMcpServerConfig>;
    updateMcpServerConfig: (chatflowId: string, workspaceId: string, body: {
        description?: string;
        toolName?: string;
        enabled?: boolean;
    }) => Promise<IMcpServerConfig>;
    deleteMcpServerConfig: (chatflowId: string, workspaceId: string) => Promise<void>;
    refreshMcpToken: (chatflowId: string, workspaceId: string) => Promise<IMcpServerConfig>;
    getChatflowByIdAndVerifyToken: (chatflowId: string, token: string) => Promise<ChatFlow>;
    parseMcpConfig: typeof parseMcpConfig;
};
export default _default;
