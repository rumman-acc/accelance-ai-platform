"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const ChatFlow_1 = require("../../database/entities/ChatFlow");
const Credential_1 = require("../../database/entities/Credential");
const CredentialAccess_1 = require("../../database/entities/CredentialAccess");
const EnterpriseEntities_1 = require("../../enterprise/database/entities/EnterpriseEntities");
const workspace_user_entity_1 = require("../../enterprise/database/entities/workspace-user.entity");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const utils_1 = require("../../errors/utils");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
/**
 * Does userId have access to credentialId? Checked in this order:
 * 1. userId is the credential's createdBy (its owner)
 * 2. an explicit CredentialAccess grant exists
 * 3. the credential is shared (via WorkspaceShared) into a workspace where userId is an
 *    active member -- this preserves today's actual behavior for cross-workspace-shared
 *    credentials without needing a CredentialAccess row per shared-workspace member.
 *
 * A missing/undefined userId (no authenticated principal -- public chatbot, API-key-triggered
 * run) is the caller's decision to make, not this function's -- see the tool-call policy
 * chokepoint (Phase 3), which skips this check entirely when there's no principal.
 */
const hasAccess = async (userId, credentialId) => {
    const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
    const credential = await appServer.AppDataSource.getRepository(Credential_1.Credential).findOneBy({ id: credentialId });
    if (!credential)
        return false;
    if (credential.createdBy && credential.createdBy === userId)
        return true;
    const grant = await appServer.AppDataSource.getRepository(CredentialAccess_1.CredentialAccess).findOneBy({ credentialId, userId });
    if (grant)
        return true;
    const sharedWorkspaces = await appServer.AppDataSource.getRepository(EnterpriseEntities_1.WorkspaceShared).find({
        where: { sharedItemId: credentialId, itemType: 'credential' }
    });
    if (!sharedWorkspaces.length)
        return false;
    const membership = await appServer.AppDataSource.getRepository(workspace_user_entity_1.WorkspaceUser).findOne({
        where: sharedWorkspaces.map((sw) => ({
            workspaceId: sw.workspaceId,
            userId,
            status: workspace_user_entity_1.WorkspaceUserStatus.ACTIVE
        }))
    });
    return !!membership;
};
/**
 * Non-blocking, build-time-only warnings for the flow builder: which of this chatflow's tool
 * nodes reference a credential the requesting (saving/deploying) user doesn't have access to.
 * Deliberately advisory -- the picker itself isn't filtered (see the plan's build-time UX
 * decision); this is the API-side half surfaced by the builder UI at save/deploy time. Hard
 * enforcement happens at execution time via the Phase 3 tool-call chokepoint, not here.
 */
const getCredentialAccessWarnings = async (chatflowId, workspaceId, userId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const chatflow = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).findOneBy({ id: chatflowId, workspaceId });
        if (!chatflow) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Chatflow ${chatflowId} not found`);
        }
        if (!userId)
            return [];
        const parsedFlowData = JSON.parse(chatflow.flowData);
        const nodesWithCredential = (parsedFlowData.nodes || []).filter((node) => !!node.data?.credential);
        const warnings = [];
        for (const node of nodesWithCredential) {
            const credentialId = node.data.credential;
            const allowed = await hasAccess(userId, credentialId);
            if (!allowed) {
                warnings.push({ nodeId: node.id, nodeLabel: node.data.label, credentialId });
            }
        }
        return warnings;
    }
    catch (error) {
        if (error instanceof internalAccelanceError_1.InternalAccelanceError)
            throw error;
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: credentialAccessService.getCredentialAccessWarnings - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const listAccessForCredential = async (credentialId, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        return await appServer.AppDataSource.getRepository(CredentialAccess_1.CredentialAccess).find({ where: { credentialId, workspaceId } });
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: credentialAccessService.listAccessForCredential - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const grantAccess = async (credentialId, userId, workspaceId, grantedBy) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const repo = appServer.AppDataSource.getRepository(CredentialAccess_1.CredentialAccess);
        const existing = await repo.findOneBy({ credentialId, userId });
        if (existing)
            return existing;
        const grant = repo.create({ credentialId, userId, workspaceId, grantedBy });
        return await repo.save(grant);
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: credentialAccessService.grantAccess - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const revokeAccess = async (credentialId, userId, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        return await appServer.AppDataSource.getRepository(CredentialAccess_1.CredentialAccess).delete({ credentialId, userId, workspaceId });
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: credentialAccessService.revokeAccess - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
exports.default = {
    hasAccess,
    getCredentialAccessWarnings,
    listAccessForCredential,
    grantAccess,
    revokeAccess
};
//# sourceMappingURL=index.js.map