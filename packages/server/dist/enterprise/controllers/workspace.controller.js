"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceController = void 0;
const http_status_codes_1 = require("http-status-codes");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const organization_user_entity_1 = require("../database/entities/organization-user.entity");
const role_entity_1 = require("../database/entities/role.entity");
const workspace_user_entity_1 = require("../database/entities/workspace-user.entity");
const organization_user_service_1 = require("../services/organization-user.service");
const organization_service_1 = require("../services/organization.service");
const role_service_1 = require("../services/role.service");
const user_service_1 = require("../services/user.service");
const workspace_user_service_1 = require("../services/workspace-user.service");
const workspace_service_1 = require("../services/workspace.service");
const tenantRequestGuards_1 = require("../utils/tenantRequestGuards");
class WorkspaceController {
    async create(req, res, next) {
        try {
            const workspaceUserService = new workspace_user_service_1.WorkspaceUserService();
            const newWorkspace = await workspaceUserService.createWorkspace(req.body);
            return res.status(http_status_codes_1.StatusCodes.CREATED).json(newWorkspace);
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
            const workspaceService = new workspace_service_1.WorkspaceService();
            (0, tenantRequestGuards_1.assertQueryOrganizationMatchesActiveOrg)(user, query.organizationId);
            let workspace;
            if (query.id) {
                await (0, tenantRequestGuards_1.assertWorkspaceIdAccessibleToUser)(user, query.id, queryRunner);
                workspace = await workspaceService.readWorkspaceById(query.id, queryRunner);
            }
            else if (query.organizationId) {
                workspace = await workspaceService.readWorkspaceByOrganizationId(query.organizationId, queryRunner);
                if (!user.isOrganizationAdmin && Array.isArray(workspace)) {
                    const allowed = new Set((user.assignedWorkspaces ?? []).map((w) => w.id));
                    if (user.activeWorkspaceId)
                        allowed.add(user.activeWorkspaceId);
                    workspace = workspace.filter((w) => allowed.has(w.id));
                }
            }
            else {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Unhandled Edge Case" /* GeneralErrorMessage.UNHANDLED_EDGE_CASE */);
            }
            return res.status(http_status_codes_1.StatusCodes.OK).json(workspace);
        }
        catch (error) {
            next(error);
        }
        finally {
            if (queryRunner)
                await queryRunner.release();
        }
    }
    async switchWorkspace(req, res, next) {
        if (!req.user) {
            return next(new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.UNAUTHORIZED, `Unauthorized: User not found`));
        }
        let queryRunner;
        try {
            queryRunner = (0, getRunningExpressApp_1.getRunningExpressApp)().AppDataSource.createQueryRunner();
            await queryRunner.connect();
            const query = req.query;
            await queryRunner.startTransaction();
            const workspaceService = new workspace_service_1.WorkspaceService();
            const workspace = await workspaceService.readWorkspaceById(query.id, queryRunner);
            if (!workspace)
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Workspace Not Found" /* WorkspaceErrorMessage.WORKSPACE_NOT_FOUND */);
            const userService = new user_service_1.UserService();
            const user = await userService.readUserById(req.user.id, queryRunner);
            if (!user)
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
            const workspaceUserService = new workspace_user_service_1.WorkspaceUserService();
            const { workspaceUser } = await workspaceUserService.readWorkspaceUserByWorkspaceIdUserId(query.id, req.user.id, queryRunner);
            if (!workspaceUser)
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Workspace User Not Found" /* WorkspaceUserErrorMessage.WORKSPACE_USER_NOT_FOUND */);
            workspaceUser.lastLogin = new Date().toISOString();
            workspaceUser.status = workspace_user_entity_1.WorkspaceUserStatus.ACTIVE;
            workspaceUser.updatedBy = user.id;
            await workspaceUserService.saveWorkspaceUser(workspaceUser, queryRunner);
            const organizationUserService = new organization_user_service_1.OrganizationUserService();
            const { organizationUser } = await organizationUserService.readOrganizationUserByWorkspaceIdUserId(workspaceUser.workspaceId, workspaceUser.userId, queryRunner);
            if (!organizationUser)
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Organization User Not Found" /* OrganizationUserErrorMessage.ORGANIZATION_USER_NOT_FOUND */);
            organizationUser.status = organization_user_entity_1.OrganizationUserStatus.ACTIVE;
            organizationUser.updatedBy = user.id;
            await organizationUserService.saveOrganizationUser(organizationUser, queryRunner);
            const roleService = new role_service_1.RoleService();
            const ownerRole = await roleService.readGeneralRoleByName(role_entity_1.GeneralRole.OWNER, queryRunner);
            const role = await roleService.readRoleById(workspaceUser.roleId, queryRunner);
            if (!role)
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Role Not Found" /* RoleErrorMessage.ROLE_NOT_FOUND */);
            const orgService = new organization_service_1.OrganizationService();
            const org = await orgService.readOrganizationById(organizationUser.organizationId, queryRunner);
            if (!org)
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Organization Not Found" /* OrganizationErrorMessage.ORGANIZATION_NOT_FOUND */);
            const subscriptionId = org.subscriptionId;
            const customerId = org.customerId;
            const features = await (0, getRunningExpressApp_1.getRunningExpressApp)().identityManager.getFeaturesByPlan(subscriptionId);
            const productId = await (0, getRunningExpressApp_1.getRunningExpressApp)().identityManager.getProductIdFromSubscription(subscriptionId);
            const workspaceUsers = await workspaceUserService.readWorkspaceUserByUserId(req.user.id, queryRunner);
            const assignedWorkspaces = workspaceUsers.map((workspaceUser) => {
                return {
                    id: workspaceUser.workspace.id,
                    name: workspaceUser.workspace.name,
                    role: workspaceUser.role?.name,
                    organizationId: workspaceUser.workspace.organizationId
                };
            });
            const loggedInUser = {
                ...req.user,
                activeOrganizationId: org.id,
                activeOrganizationSubscriptionId: subscriptionId,
                activeOrganizationCustomerId: customerId,
                activeOrganizationProductId: productId,
                isOrganizationAdmin: workspaceUser.roleId === ownerRole.id,
                activeWorkspaceId: workspace.id,
                activeWorkspace: workspace.name,
                assignedWorkspaces,
                isSSO: req.user.ssoProvider ? true : false,
                permissions: [...JSON.parse(role.permissions)],
                features,
                role: role.name,
                roleId: role.id
            };
            // update the passport session
            req.user = {
                ...req.user,
                ...loggedInUser
            };
            // Update passport session
            // @ts-ignore
            req.session.passport.user = {
                ...req.user,
                ...loggedInUser
            };
            req.session.save((err) => {
                if (err)
                    throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Unhandled Edge Case" /* GeneralErrorMessage.UNHANDLED_EDGE_CASE */);
            });
            await queryRunner.commitTransaction();
            return res.status(http_status_codes_1.StatusCodes.OK).json(loggedInUser);
        }
        catch (error) {
            if (queryRunner && !queryRunner.isTransactionActive) {
                await queryRunner.rollbackTransaction();
            }
            next(error);
        }
        finally {
            if (queryRunner && !queryRunner.isReleased) {
                await queryRunner.release();
            }
        }
    }
    async update(req, res, next) {
        try {
            const workspaceService = new workspace_service_1.WorkspaceService();
            const workspace = await workspaceService.updateWorkspace(req.body);
            return res.status(http_status_codes_1.StatusCodes.OK).json(workspace);
        }
        catch (error) {
            next(error);
        }
    }
    async delete(req, res, next) {
        let queryRunner;
        try {
            queryRunner = (0, getRunningExpressApp_1.getRunningExpressApp)().AppDataSource.createQueryRunner();
            await queryRunner.connect();
            const workspaceId = req.params.id;
            if (!workspaceId) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid Workspace Id" /* WorkspaceErrorMessage.INVALID_WORKSPACE_ID */);
            }
            const workspaceService = new workspace_service_1.WorkspaceService();
            await queryRunner.startTransaction();
            const workspace = await workspaceService.deleteWorkspaceById(queryRunner, workspaceId);
            await queryRunner.commitTransaction();
            return res.status(http_status_codes_1.StatusCodes.OK).json(workspace);
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
    async getSharedWorkspacesForItem(req, res, next) {
        try {
            if (typeof req.params === 'undefined' || !req.params.id) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid Workspace Id" /* WorkspaceErrorMessage.INVALID_WORKSPACE_ID */);
            }
            const workspaceService = new workspace_service_1.WorkspaceService();
            return res.json(await workspaceService.getSharedWorkspacesForItem(req.params.id));
        }
        catch (error) {
            next(error);
        }
    }
    async setSharedWorkspacesForItem(req, res, next) {
        try {
            if (!req.user) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.UNAUTHORIZED, `Unauthorized: User not found`);
            }
            if (typeof req.params === 'undefined' || !req.params.id) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.UNAUTHORIZED, `Error: workspaceController.setSharedWorkspacesForItem - id not provided!`);
            }
            if (!req.body) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: workspaceController.setSharedWorkspacesForItem - body not provided!`);
            }
            const workspaceService = new workspace_service_1.WorkspaceService();
            return res.json(await workspaceService.setSharedWorkspacesForItem(req.params.id, req.body));
        }
        catch (error) {
            next(error);
        }
    }
}
exports.WorkspaceController = WorkspaceController;
//# sourceMappingURL=workspace.controller.js.map