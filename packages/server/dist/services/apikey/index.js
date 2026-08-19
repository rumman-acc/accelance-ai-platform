"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const uuid_1 = require("uuid");
const ApiKey_1 = require("../../database/entities/ApiKey");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const utils_1 = require("../../errors/utils");
const Interface_1 = require("../../Interface");
const addChatflowsCount_1 = require("../../utils/addChatflowsCount");
const apiKey_1 = require("../../utils/apiKey");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const logger_1 = __importDefault(require("../../utils/logger"));
/**
 * Validates that requested permissions are allowed for API keys
 * @param user - The logged-in user
 * @param permissions - string array of requested permissions
 * @param operation - The operation being performed (for error message)
 * @throws InternalAccelanceError if validation fails
 */
function validatePermissions(user, requestedPermissions, operation) {
    // API Keys should not have workspace or admin permissions
    // This applies to ALL users, including admins (platform constraint)
    const hasRestrictedPermissions = requestedPermissions.some((permission) => permission.startsWith('workspace:') || permission.startsWith('admin:'));
    if (hasRestrictedPermissions) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, `Cannot ${operation} API key with workspace or admin permissions`);
    }
    // For Cloud platform, check feature-gated permissions
    // This also applies to ALL users, including admins (platform constraint)
    const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
    if (appServer.identityManager.getPlatformType() === Interface_1.Platform.CLOUD) {
        if (!user.features) {
            // On Cloud platform, user features should always exist
            // Log the anomaly with context for debugging
            logger_1.default.error(`[server]: Missing user features on Cloud platform for ${operation} API key. ` +
                `User: ${user.email || user.id}, ` +
                `Organization: ${user.activeOrganizationId || 'unknown'}, ` +
                `Subscription: ${user.activeOrganizationSubscriptionId || 'unknown'}, ` +
                `Customer: ${user.activeOrganizationCustomerId || 'unknown'}, ` +
                `Workspace: ${user.activeWorkspaceId || 'unknown'}`);
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Unable to validate permissions: user features not available`);
        }
        const featureToPermissionMap = {
            'feat:login-activity': ['loginActivity:'],
            'feat:roles': ['roles:'],
            'feat:share': ['credentials:share', 'templates:custom-share'],
            'feat:sso-config': ['sso:'],
            'feat:users': ['users:'],
            'feat:workspaces': ['workspace:']
        };
        const disabledFeatures = Object.entries(user.features).filter(([, value]) => value === 'false');
        const disabledPermissionPrefixes = [];
        disabledFeatures.forEach(([featureKey]) => {
            const prefixes = featureToPermissionMap[featureKey];
            if (prefixes) {
                disabledPermissionPrefixes.push(...prefixes);
            }
        });
        const hasDisabledFeaturePermissions = requestedPermissions.some((permission) => disabledPermissionPrefixes.some((prefix) => permission.startsWith(prefix)));
        if (hasDisabledFeaturePermissions) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, `Cannot ${operation} API key with permissions for disabled features`);
        }
    }
    // User permission validation - only applies to non-admins (authorization check)
    if (!user.isOrganizationAdmin) {
        // Check if all requested permissions are included in user permissions
        const hasInvalidPermissions = requestedPermissions.some((permission) => !user.permissions.includes(permission));
        if (hasInvalidPermissions) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, `Cannot ${operation} API key with permissions that exceed your own permissions`);
        }
    }
}
/**
 * Get all API keys for an organization
 * Returns all API keys across all workspaces in the organization
 */
async function getAllApiKeysByOrganization(organizationId) {
    const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
    const ApiKeys = await appServer.AppDataSource.getRepository(ApiKey_1.ApiKey)
        .createQueryBuilder('api_key')
        .select(['api_key.keyName', 'api_key.permissions'])
        .leftJoin('workspace', 'workspace', 'api_key.workspaceId = workspace.id')
        .where('workspace.organizationId = :organizationId', { organizationId })
        .getMany();
    return ApiKeys;
}
/**
 * Get all API keys for a workspace
 * Non-admin users can only view API keys whose permissions are a subset of their own permissions
 */
const getAllApiKeys = async (user, page = -1, limit = -1) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const queryBuilder = appServer.AppDataSource.getRepository(ApiKey_1.ApiKey)
            .createQueryBuilder('api_key')
            .orderBy('api_key.updatedDate', 'DESC');
        if (page > 0 && limit > 0) {
            queryBuilder.skip((page - 1) * limit);
            queryBuilder.take(limit);
        }
        queryBuilder.andWhere('api_key.workspaceId = :workspaceId', { workspaceId: user.activeWorkspaceId });
        const allKeys = await queryBuilder.getMany();
        // Filter keys based on user permissions
        let filteredKeys = allKeys;
        if (!user.isOrganizationAdmin) {
            // Non-admin users can only see API keys whose permissions are a subset of their own
            filteredKeys = allKeys.filter((key) => {
                // Check if all key permissions are included in user permissions
                return key.permissions.every((permission) => user.permissions.includes(permission));
            });
        }
        const keysWithChatflows = await (0, addChatflowsCount_1.addChatflowsCount)(filteredKeys);
        if (page > 0 && limit > 0) {
            return { total: filteredKeys.length, data: keysWithChatflows };
        }
        else {
            return keysWithChatflows;
        }
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: apikeyService.getAllApiKeys - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const getApiKey = async (apiKey) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const currentKey = await appServer.AppDataSource.getRepository(ApiKey_1.ApiKey).findOneBy({
            apiKey: apiKey
        });
        if (!currentKey) {
            return undefined;
        }
        return currentKey;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: apikeyService.getApiKey - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const getApiKeyById = async (apiKeyId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const currentKey = await appServer.AppDataSource.getRepository(ApiKey_1.ApiKey).findOneBy({
            id: apiKeyId
        });
        if (!currentKey) {
            return undefined;
        }
        return currentKey;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: apikeyService.getApiKeyById - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const createApiKey = async (user, keyName, permissions) => {
    // Validate permissions before creating the key
    validatePermissions(user, permissions, 'create');
    const apiKey = (0, apiKey_1.generateAPIKey)();
    const apiSecret = (0, apiKey_1.generateSecretHash)(apiKey);
    const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
    const newKey = new ApiKey_1.ApiKey();
    newKey.id = (0, uuid_1.v4)();
    newKey.apiKey = apiKey;
    newKey.apiSecret = apiSecret;
    newKey.keyName = keyName;
    newKey.permissions = permissions;
    newKey.workspaceId = user.activeWorkspaceId;
    const key = appServer.AppDataSource.getRepository(ApiKey_1.ApiKey).create(newKey);
    await appServer.AppDataSource.getRepository(ApiKey_1.ApiKey).save(key);
    return await getAllApiKeys(user);
};
// Update api key
const updateApiKey = async (user, id, keyName, permissions) => {
    // Validate permissions before updating the key
    validatePermissions(user, permissions, 'update');
    const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
    const currentKey = await appServer.AppDataSource.getRepository(ApiKey_1.ApiKey).findOneBy({
        id: id,
        workspaceId: user.activeWorkspaceId
    });
    if (!currentKey) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `ApiKey ${currentKey} not found`);
    }
    currentKey.keyName = keyName;
    currentKey.permissions = permissions;
    await appServer.AppDataSource.getRepository(ApiKey_1.ApiKey).save(currentKey);
    return await getAllApiKeys(user);
};
const deleteApiKey = async (id, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const dbResponse = await appServer.AppDataSource.getRepository(ApiKey_1.ApiKey).delete({ id, workspaceId });
        if (!dbResponse) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `ApiKey ${id} not found`);
        }
        return dbResponse;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: apikeyService.deleteApiKey - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const verifyApiKey = async (paramApiKey) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const apiKey = await appServer.AppDataSource.getRepository(ApiKey_1.ApiKey).findOneBy({
            apiKey: paramApiKey
        });
        if (!apiKey) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.UNAUTHORIZED, `Unauthorized`);
        }
        return 'OK';
    }
    catch (error) {
        if (error instanceof internalAccelanceError_1.InternalAccelanceError && error.statusCode === http_status_codes_1.StatusCodes.UNAUTHORIZED) {
            throw error;
        }
        else {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: apikeyService.verifyApiKey - ${(0, utils_1.getErrorMessage)(error)}`);
        }
    }
};
exports.default = {
    createApiKey,
    deleteApiKey,
    getAllApiKeys,
    getAllApiKeysByOrganization,
    updateApiKey,
    verifyApiKey,
    getApiKey,
    getApiKeyById
};
//# sourceMappingURL=index.js.map