"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLoggedInUser = getLoggedInUser;
exports.getActiveWorkspaceIdForRequest = getActiveWorkspaceIdForRequest;
exports.assertQueryOrganizationMatchesActiveOrg = assertQueryOrganizationMatchesActiveOrg;
exports.assertWorkspaceIdAccessibleToUser = assertWorkspaceIdAccessibleToUser;
exports.assertStripeIdMatchesSession = assertStripeIdMatchesSession;
exports.userMayManageOrgUsers = userMayManageOrgUsers;
exports.assertMayReadTargetUser = assertMayReadTargetUser;
const http_status_codes_1 = require("http-status-codes");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const workspace_entity_1 = require("../database/entities/workspace.entity");
const organization_user_service_1 = require("../services/organization-user.service");
function getLoggedInUser(req) {
    const user = req.user;
    if (!user?.id || !user?.activeOrganizationId || !user?.activeWorkspaceId) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Unauthorized" /* GeneralErrorMessage.UNAUTHORIZED */);
    }
    return user;
}
/**
 * Active workspace for tenant-scoped data access.
 * Interactive sessions use {@link getLoggedInUser} (requires `req.user.id`).
 * API key auth sets `activeWorkspaceId` / `activeOrganizationId` on `req.user` but not `id`.
 */
function getActiveWorkspaceIdForRequest(req) {
    const user = req.user;
    if (user?.id) {
        return getLoggedInUser(req).activeWorkspaceId;
    }
    if (!user?.activeWorkspaceId || !user?.activeOrganizationId) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Unauthorized" /* GeneralErrorMessage.UNAUTHORIZED */);
    }
    return user.activeWorkspaceId;
}
/** When a query supplies organizationId, it must match the caller's active organization. */
function assertQueryOrganizationMatchesActiveOrg(user, organizationId) {
    if (organizationId === undefined || organizationId === '')
        return;
    if (organizationId !== user.activeOrganizationId) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.FORBIDDEN, "Forbidden" /* GeneralErrorMessage.FORBIDDEN */);
    }
}
/**
 * Ensures the user may access data for this workspace: same as active workspace, listed in assigned workspaces,
 * or org admin for a workspace that belongs to their active organization.
 */
async function assertWorkspaceIdAccessibleToUser(user, workspaceId, queryRunner) {
    if (workspaceId === undefined || workspaceId === '')
        return;
    if (workspaceId === user.activeWorkspaceId)
        return;
    if (user.assignedWorkspaces?.some((w) => w.id === workspaceId))
        return;
    if (user.isOrganizationAdmin) {
        const workspace = await queryRunner.manager.findOneBy(workspace_entity_1.Workspace, { id: workspaceId });
        if (!workspace || workspace.organizationId !== user.activeOrganizationId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.FORBIDDEN, "Forbidden" /* GeneralErrorMessage.FORBIDDEN */);
        }
        return;
    }
    throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.FORBIDDEN, "Forbidden" /* GeneralErrorMessage.FORBIDDEN */);
}
function assertStripeIdMatchesSession(requestedId, activeId) {
    if (!activeId || requestedId !== activeId) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.FORBIDDEN, "Forbidden" /* GeneralErrorMessage.FORBIDDEN */);
    }
}
function userMayManageOrgUsers(user) {
    return user.isOrganizationAdmin === true || (user.permissions?.includes('users:manage') ?? false);
}
/** Allows reading a user profile when it is self, or when the caller manages org users and the target belongs to the active org. */
async function assertMayReadTargetUser(sessionUser, targetUserId, queryRunner) {
    if (sessionUser.id && targetUserId === sessionUser.id)
        return;
    if (!sessionUser.activeOrganizationId) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.FORBIDDEN, "Forbidden" /* GeneralErrorMessage.FORBIDDEN */);
    }
    if (!userMayManageOrgUsers(sessionUser)) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.FORBIDDEN, "Forbidden" /* GeneralErrorMessage.FORBIDDEN */);
    }
    const organizationUserService = new organization_user_service_1.OrganizationUserService();
    const { organizationUser } = await organizationUserService.readOrganizationUserByOrganizationIdUserId(sessionUser.activeOrganizationId, targetUserId, queryRunner);
    if (!organizationUser) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.FORBIDDEN, "Forbidden" /* GeneralErrorMessage.FORBIDDEN */);
    }
}
//# sourceMappingURL=tenantRequestGuards.js.map