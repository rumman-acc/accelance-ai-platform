import { ApiKey } from '../../database/entities/ApiKey';
import { LoggedInUser } from '../../enterprise/Interface.Enterprise';
/**
 * Get all API keys for an organization
 * Returns all API keys across all workspaces in the organization
 */
declare function getAllApiKeysByOrganization(organizationId: string): Promise<ApiKey[]>;
declare const _default: {
    createApiKey: (user: LoggedInUser, keyName: string, permissions: string[]) => Promise<any>;
    deleteApiKey: (id: string, workspaceId: string) => Promise<import("typeorm").DeleteResult>;
    getAllApiKeys: (user: LoggedInUser, page?: number, limit?: number) => Promise<any>;
    getAllApiKeysByOrganization: typeof getAllApiKeysByOrganization;
    updateApiKey: (user: LoggedInUser, id: string, keyName: string, permissions: string[]) => Promise<any>;
    verifyApiKey: (paramApiKey: string) => Promise<string>;
    getApiKey: (apiKey: string) => Promise<ApiKey | undefined>;
    getApiKeyById: (apiKeyId: string) => Promise<ApiKey | undefined>;
};
export default _default;
