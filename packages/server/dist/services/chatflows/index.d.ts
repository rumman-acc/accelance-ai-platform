import { QueryRunner } from 'typeorm';
import { ChatflowType } from '../../Interface';
import { UsageCacheManager } from '../../UsageCacheManager';
import { ChatFlow, EnumChatflowType } from '../../database/entities/ChatFlow';
export declare const enum ChatflowErrorMessage {
    INVALID_CHATFLOW_TYPE = "Invalid Chatflow Type",
    INVALID_CHATFLOW_ID = "Invalid Chatflow ID",
    WORKSPACE_ID_REQUIRED = "Workspace ID is required"
}
export declare function validateChatflowType(type: ChatflowType | undefined): void;
declare function getAllChatflowsCountByOrganization(type: ChatflowType, organizationId: string): Promise<number>;
declare const _default: {
    assertChatflowIdsInWorkspace: (chatflowIds: string[], workspaceId: string, queryRunner?: QueryRunner) => Promise<void>;
    checkIfChatflowIsValidForStreaming: (chatflowId: string) => Promise<any>;
    checkIfChatflowIsValidForUploads: (chatflowId: string) => Promise<any>;
    deleteChatflow: (chatflowId: string, orgId: string, workspaceId: string, userPermittedTypes: EnumChatflowType[]) => Promise<any>;
    getAllChatflows: (type?: ChatflowType | string, workspaceId?: string, page?: number, limit?: number) => Promise<any>;
    getAllChatflowsCount: (type?: ChatflowType, workspaceId?: string) => Promise<number>;
    getChatflowByApiKey: (apiKeyId: string, workspaceId: string, keyonly?: unknown) => Promise<any>;
    getChatflowById: (chatflowId: string, workspaceId?: string) => Promise<any>;
    getChatflowByIdForWorkspace: (chatflowId: string, workspaceId: string | undefined) => Promise<any>;
    saveChatflow: (newChatFlow: ChatFlow, orgId: string, workspaceId: string, subscriptionId: string, usageCacheManager: UsageCacheManager) => Promise<any>;
    updateChatflow: (chatflow: ChatFlow, updateChatFlow: ChatFlow, orgId: string, workspaceId: string, subscriptionId: string) => Promise<any>;
    getSinglePublicChatbotConfig: (chatflowId: string) => Promise<any>;
    checkIfChatflowHasChanged: (chatflowId: string, lastUpdatedDateTime: string, workspaceId: string) => Promise<any>;
    getAllChatflowsCountByOrganization: typeof getAllChatflowsCountByOrganization;
    setWebhookSecret: (chatflowId: string, workspaceId: string) => Promise<{
        webhookSecret: string;
    }>;
    clearWebhookSecret: (chatflowId: string, workspaceId: string) => Promise<void>;
    getWebhookSecret: (chatflowId: string, workspaceId: string) => Promise<string | null>;
};
export default _default;
