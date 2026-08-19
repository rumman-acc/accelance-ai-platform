"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationUserController = void 0;
const http_status_codes_1 = require("http-status-codes");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const quotaUsage_1 = require("../../utils/quotaUsage");
const Interface_1 = require("../../Interface");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const role_entity_1 = require("../database/entities/role.entity");
const user_entity_1 = require("../database/entities/user.entity");
const workspace_user_entity_1 = require("../database/entities/workspace-user.entity");
const organization_user_service_1 = require("../services/organization-user.service");
const role_service_1 = require("../services/role.service");
const workspace_service_1 = require("../services/workspace.service");
const tenantRequestGuards_1 = require("../utils/tenantRequestGuards");
class OrganizationUserController {
    async create(req, res, next) {
        try {
            const organizationUserservice = new organization_user_service_1.OrganizationUserService();
            const totalOrgUsers = await organizationUserservice.readOrgUsersCountByOrgId(req.body.organizationId);
            const subscriptionId = req.user?.activeOrganizationSubscriptionId || '';
            await (0, quotaUsage_1.checkUsageLimit)('users', subscriptionId, (0, getRunningExpressApp_1.getRunningExpressApp)().usageCacheManager, totalOrgUsers + 1);
            const newOrganizationUser = await organizationUserservice.createOrganizationUser(req.body);
            return res.status(http_status_codes_1.StatusCodes.CREATED).json(newOrganizationUser);
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
            const organizationUserservice = new organization_user_service_1.OrganizationUserService();
            (0, tenantRequestGuards_1.assertQueryOrganizationMatchesActiveOrg)(user, query.organizationId);
            let organizationUser;
            if (query.organizationId && query.userId) {
                organizationUser = await organizationUserservice.readOrganizationUserByOrganizationIdUserId(query.organizationId, query.userId, queryRunner);
            }
            else if (query.organizationId && query.roleId) {
                if (!(0, tenantRequestGuards_1.userMayManageOrgUsers)(user)) {
                    throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.FORBIDDEN, "Forbidden" /* GeneralErrorMessage.FORBIDDEN */);
                }
                organizationUser = await organizationUserservice.readOrganizationUserByOrganizationIdRoleId(query.organizationId, query.roleId, queryRunner);
            }
            else if (query.organizationId) {
                if (!(0, tenantRequestGuards_1.userMayManageOrgUsers)(user)) {
                    throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.FORBIDDEN, "Forbidden" /* GeneralErrorMessage.FORBIDDEN */);
                }
                organizationUser = await organizationUserservice.readOrganizationUserByOrganizationId(query.organizationId, queryRunner);
            }
            else if (query.userId) {
                if (query.userId !== user.id && !(0, tenantRequestGuards_1.userMayManageOrgUsers)(user)) {
                    throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.FORBIDDEN, "Forbidden" /* GeneralErrorMessage.FORBIDDEN */);
                }
                if (query.userId === user.id) {
                    organizationUser = await organizationUserservice.readOrganizationUserByUserId(query.userId, queryRunner);
                }
                else {
                    organizationUser = await organizationUserservice.readOrganizationUserByOrganizationIdUserId(user.activeOrganizationId, query.userId, queryRunner);
                }
            }
            else {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Unhandled Edge Case" /* GeneralErrorMessage.UNHANDLED_EDGE_CASE */);
            }
            return res.status(http_status_codes_1.StatusCodes.OK).json(organizationUser);
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
        try {
            const organizationUserService = new organization_user_service_1.OrganizationUserService();
            const organizationUser = await organizationUserService.updateOrganizationUser(req.body);
            return res.status(http_status_codes_1.StatusCodes.OK).json(organizationUser);
        }
        catch (error) {
            next(error);
        }
    }
    async delete(req, res, next) {
        let queryRunner;
        try {
            queryRunner = (0, getRunningExpressApp_1.getRunningExpressApp)().AppDataSource.createQueryRunner();
            const currentPlatform = (0, getRunningExpressApp_1.getRunningExpressApp)().identityManager.getPlatformType();
            await queryRunner.connect();
            const query = req.query;
            if (!query.organizationId) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Organization ID is required');
            }
            if (!query.userId) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'User ID is required');
            }
            const organizationUserService = new organization_user_service_1.OrganizationUserService();
            const workspaceService = new workspace_service_1.WorkspaceService();
            const roleService = new role_service_1.RoleService();
            let organizationUser;
            await queryRunner.startTransaction();
            if (currentPlatform === Interface_1.Platform.ENTERPRISE) {
                const personalRole = await roleService.readGeneralRoleByName(role_entity_1.GeneralRole.PERSONAL_WORKSPACE, queryRunner);
                const personalWorkspaces = await queryRunner.manager.findBy(workspace_user_entity_1.WorkspaceUser, {
                    userId: query.userId,
                    roleId: personalRole.id
                });
                if (personalWorkspaces.length === 1)
                    // delete personal workspace
                    await workspaceService.deleteWorkspaceById(queryRunner, personalWorkspaces[0].workspaceId);
                // remove user from other workspces
                organizationUser = await organizationUserService.deleteOrganizationUser(queryRunner, query.organizationId, query.userId);
                // soft delete user because they might workspace might created by them
                const deleteUser = await queryRunner.manager.findOneBy(user_entity_1.User, { id: query.userId });
                if (!deleteUser)
                    throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, "Unhandled Edge Case" /* GeneralErrorMessage.UNHANDLED_EDGE_CASE */);
                deleteUser.name = user_entity_1.UserStatus.DELETED;
                deleteUser.email = `deleted_${deleteUser.id}_${Date.now()}@deleted.flowise`;
                deleteUser.status = user_entity_1.UserStatus.DELETED;
                deleteUser.credential = null;
                deleteUser.tokenExpiry = null;
                deleteUser.tempToken = null;
                await queryRunner.manager.save(user_entity_1.User, deleteUser);
            }
            else {
                organizationUser = await organizationUserService.deleteOrganizationUser(queryRunner, query.organizationId, query.userId);
            }
            await queryRunner.commitTransaction();
            return res.status(http_status_codes_1.StatusCodes.OK).json(organizationUser);
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
}
exports.OrganizationUserController = OrganizationUserController;
//# sourceMappingURL=organization-user.controller.js.map