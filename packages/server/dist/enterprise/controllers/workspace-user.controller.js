"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceUserController = void 0;
const http_status_codes_1 = require("http-status-codes");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const workspace_user_service_1 = require("../services/workspace-user.service");
const tenantRequestGuards_1 = require("../utils/tenantRequestGuards");
class WorkspaceUserController {
    async create(req, res, next) {
        try {
            const workspaceUserService = new workspace_user_service_1.WorkspaceUserService();
            const newWorkspaceUser = await workspaceUserService.createWorkspaceUser(req.body);
            return res.status(http_status_codes_1.StatusCodes.CREATED).json(newWorkspaceUser);
        }
        catch (error) {
            next(error);
        }
    }
    async read(req, res, next) {
        let queryRunner;
        try {
            const user = (0, tenantRequestGuards_1.getLoggedInUser)(req);
            queryRunner = (0, getRunningExpressApp_1.getRunningExpressApp)().AppDataSource.createQueryRunner();
            await queryRunner.connect();
            const query = req.query;
            const workspaceUserService = new workspace_user_service_1.WorkspaceUserService();
            let workspaceUser;
            if (query.workspaceId && query.userId) {
                // Caller must have access to the workspace (own, assigned, or org admin within their org).
                await (0, tenantRequestGuards_1.assertWorkspaceIdAccessibleToUser)(user, query.workspaceId, queryRunner);
                workspaceUser = await workspaceUserService.readWorkspaceUserByWorkspaceIdUserId(query.workspaceId, query.userId, queryRunner);
            }
            else if (query.workspaceId) {
                // Caller must have access to the workspace (own, assigned, or org admin within their org).
                await (0, tenantRequestGuards_1.assertWorkspaceIdAccessibleToUser)(user, query.workspaceId, queryRunner);
                workspaceUser = await workspaceUserService.readWorkspaceUserByWorkspaceId(query.workspaceId, queryRunner);
            }
            else if (query.organizationId && query.userId) {
                // organizationId must match the caller's active org to prevent cross-org access.
                // Caller must be the target user or an org user manager whose target belongs to the same org (IDOR guard).
                (0, tenantRequestGuards_1.assertQueryOrganizationMatchesActiveOrg)(user, query.organizationId);
                await (0, tenantRequestGuards_1.assertMayReadTargetUser)(user, query.userId, queryRunner);
                workspaceUser = await workspaceUserService.readWorkspaceUserByOrganizationIdUserId(query.organizationId, query.userId, queryRunner);
            }
            else if (query.userId) {
                if (query.userId === user.id) {
                    // Self-lookup: return memberships across all orgs so the user can switch to an invited org/workspace.
                    workspaceUser = await workspaceUserService.readWorkspaceUserByUserId(query.userId, queryRunner);
                }
                else {
                    // Non-self: caller must be an org user manager and the target must belong to the caller's active org (IDOR guard).
                    // Results are scoped to the caller's active org to prevent cross-org data leakage.
                    await (0, tenantRequestGuards_1.assertMayReadTargetUser)(user, query.userId, queryRunner);
                    workspaceUser = await workspaceUserService.readWorkspaceUserByOrganizationIdUserId(user.activeOrganizationId, query.userId, queryRunner);
                }
            }
            else if (query.roleId) {
                // Only org user managers may list workspace members by role.
                if (!(0, tenantRequestGuards_1.userMayManageOrgUsers)(user)) {
                    throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.FORBIDDEN, "Forbidden" /* GeneralErrorMessage.FORBIDDEN */);
                }
                workspaceUser = await workspaceUserService.readWorkspaceUserByRoleId(query.roleId, queryRunner, user.activeOrganizationId);
            }
            else {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Unhandled Edge Case" /* GeneralErrorMessage.UNHANDLED_EDGE_CASE */);
            }
            return res.status(http_status_codes_1.StatusCodes.OK).json(workspaceUser);
        }
        catch (error) {
            next(error);
        }
        finally {
            if (queryRunner)
                await queryRunner.release();
        }
    }
    async update(req, res, next) {
        let queryRunner;
        try {
            queryRunner = (0, getRunningExpressApp_1.getRunningExpressApp)().AppDataSource.createQueryRunner();
            await queryRunner.connect();
            const workspaceUserService = new workspace_user_service_1.WorkspaceUserService();
            const workspaceUser = await workspaceUserService.updateWorkspaceUser(req.body, queryRunner);
            return res.status(http_status_codes_1.StatusCodes.OK).json(workspaceUser);
        }
        catch (error) {
            if (queryRunner && queryRunner.isTransactionActive)
                await queryRunner.rollbackTransaction();
            next(error);
        }
        finally {
            if (queryRunner && !queryRunner.isReleased)
                await queryRunner.release();
        }
    }
    async delete(req, res, next) {
        try {
            const query = req.query;
            const workspaceUserService = new workspace_user_service_1.WorkspaceUserService();
            const workspaceUser = await workspaceUserService.deleteWorkspaceUser(query.workspaceId, query.userId);
            return res.status(http_status_codes_1.StatusCodes.OK).json(workspaceUser);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.WorkspaceUserController = WorkspaceUserController;
//# sourceMappingURL=workspace-user.controller.js.map