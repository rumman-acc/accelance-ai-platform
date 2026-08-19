"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationUserService = void 0;
const http_status_codes_1 = require("http-status-codes");
const typeorm_1 = require("typeorm");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const organization_user_entity_1 = require("../database/entities/organization-user.entity");
const role_entity_1 = require("../database/entities/role.entity");
const workspace_user_entity_1 = require("../database/entities/workspace-user.entity");
const workspace_entity_1 = require("../database/entities/workspace.entity");
const organization_service_1 = require("./organization.service");
const role_service_1 = require("./role.service");
const user_service_1 = require("./user.service");
class OrganizationUserService {
    constructor() {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        this.dataSource = appServer.AppDataSource;
        this.userService = new user_service_1.UserService();
        this.organizationService = new organization_service_1.OrganizationService();
        this.roleService = new role_service_1.RoleService();
    }
    validateOrganizationUserStatus(status) {
        if (status && !Object.values(organization_user_entity_1.OrganizationUserStatus).includes(status))
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid Organization User Status" /* OrganizationUserErrorMessage.INVALID_ORGANIZATION_USER_SATUS */);
    }
    async readOrganizationUserByOrganizationIdUserId(organizationId, userId, queryRunner) {
        const organization = await this.organizationService.readOrganizationById(organizationId, queryRunner);
        if (!organization)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Organization Not Found" /* OrganizationErrorMessage.ORGANIZATION_NOT_FOUND */);
        const user = await this.userService.readUserById(userId, queryRunner);
        if (!user)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
        const ownerRole = await this.roleService.readGeneralRoleByName(role_entity_1.GeneralRole.OWNER, queryRunner);
        const organizationUser = await queryRunner.manager
            .createQueryBuilder(organization_user_entity_1.OrganizationUser, 'organizationUser')
            .innerJoinAndSelect('organizationUser.role', 'role')
            .where('organizationUser.organizationId = :organizationId', { organizationId })
            .andWhere('organizationUser.userId = :userId', { userId })
            .getOne();
        return {
            organization,
            organizationUser: organizationUser
                ? {
                    ...organizationUser,
                    isOrgOwner: organizationUser.roleId === ownerRole?.id
                }
                : null
        };
    }
    async readOrganizationUserByWorkspaceIdUserId(workspaceId, userId, queryRunner) {
        const workspace = await queryRunner.manager
            .createQueryBuilder(workspace_user_entity_1.WorkspaceUser, 'workspaceUser')
            .innerJoinAndSelect('workspaceUser.workspace', 'workspace')
            .innerJoinAndSelect('workspaceUser.user', 'user')
            .innerJoinAndSelect('workspaceUser.role', 'role')
            .where('workspace.id = :workspaceId', { workspaceId })
            .getOne();
        if (!workspace)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Workspace User Not Found" /* WorkspaceUserErrorMessage.WORKSPACE_USER_NOT_FOUND */);
        return await this.readOrganizationUserByOrganizationIdUserId(workspace.workspace.organizationId, userId, queryRunner);
    }
    async readOrganizationUserByOrganizationId(organizationId, queryRunner) {
        const organization = await this.organizationService.readOrganizationById(organizationId, queryRunner);
        if (!organization)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Organization Not Found" /* OrganizationErrorMessage.ORGANIZATION_NOT_FOUND */);
        const ownerRole = await this.roleService.readGeneralRoleByName(role_entity_1.GeneralRole.OWNER, queryRunner);
        const organizationUsers = await queryRunner.manager
            .createQueryBuilder(organization_user_entity_1.OrganizationUser, 'organizationUser')
            .innerJoinAndSelect('organizationUser.user', 'user')
            .innerJoinAndSelect('organizationUser.role', 'role')
            .where('organizationUser.organizationId = :organizationId', { organizationId })
            .getMany();
        // Get workspace user last login for all users
        const workspaceUsers = await queryRunner.manager
            .createQueryBuilder(workspace_user_entity_1.WorkspaceUser, 'workspaceUser')
            .where('workspaceUser.userId IN (:...userIds)', {
            userIds: organizationUsers.map((user) => user.userId)
        })
            .orderBy('workspaceUser.lastLogin', 'ASC')
            .getMany();
        const lastLoginMap = new Map(workspaceUsers.map((wu) => [wu.userId, wu.lastLogin]));
        return await Promise.all(organizationUsers.map(async (organizationUser) => {
            const workspaceUser = await queryRunner.manager.findBy(workspace_user_entity_1.WorkspaceUser, {
                userId: organizationUser.userId,
                workspace: { organizationId: organizationId }
            });
            delete organizationUser.user.credential;
            delete organizationUser.user.tempToken;
            delete organizationUser.user.tokenExpiry;
            return {
                ...organizationUser,
                isOrgOwner: organizationUser.roleId === ownerRole?.id,
                lastLogin: lastLoginMap.get(organizationUser.userId) || null,
                roleCount: workspaceUser.length
            };
        }));
    }
    async readOrganizationUserByOrganizationIdRoleId(organizationId, roleId, queryRunner) {
        const organization = await this.organizationService.readOrganizationById(organizationId, queryRunner);
        if (!organization)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Organization Not Found" /* OrganizationErrorMessage.ORGANIZATION_NOT_FOUND */);
        const role = await this.roleService.readRoleById(roleId, queryRunner);
        if (!role)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Role Not Found" /* RoleErrorMessage.ROLE_NOT_FOUND */);
        const ownerRole = await this.roleService.readGeneralRoleByName(role_entity_1.GeneralRole.OWNER, queryRunner);
        const orgUsers = await queryRunner.manager
            .createQueryBuilder(organization_user_entity_1.OrganizationUser, 'organizationUser')
            .innerJoinAndSelect('organizationUser.role', 'role')
            .innerJoinAndSelect('organizationUser.user', 'user')
            .where('organizationUser.organizationId = :organizationId', { organizationId })
            .andWhere('organizationUser.roleId = :roleId', { roleId })
            .getMany();
        return orgUsers.map((organizationUser) => {
            delete organizationUser.user.credential;
            delete organizationUser.user.tempToken;
            delete organizationUser.user.tokenExpiry;
            return {
                ...organizationUser,
                isOrgOwner: organizationUser.roleId === ownerRole?.id
            };
        });
    }
    async readOrganizationUserByUserId(userId, queryRunner) {
        const user = await this.userService.readUserById(userId, queryRunner);
        if (!user)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
        const ownerRole = await this.roleService.readGeneralRoleByName(role_entity_1.GeneralRole.OWNER, queryRunner);
        const orgUsers = await queryRunner.manager
            .createQueryBuilder(organization_user_entity_1.OrganizationUser, 'organizationUser')
            .innerJoinAndSelect('organizationUser.role', 'role')
            .innerJoinAndSelect('organizationUser.organization', 'organization')
            .where('organizationUser.userId = :userId', { userId })
            .getMany();
        const organizationUsers = orgUsers.map((user) => ({
            ...user,
            isOrgOwner: user.roleId === ownerRole?.id
        }));
        // loop through organizationUsers, get the organizationId, find the organization user with the ownerRole.id, and get the user's details
        for (const user of organizationUsers) {
            const organizationOwner = await this.readOrganizationUserByOrganizationIdRoleId(user.organizationId, ownerRole?.id, queryRunner);
            if (organizationOwner.length === 1) {
                // get the user's name and email
                const userDetails = await this.userService.readUserById(organizationOwner[0].userId, queryRunner);
                if (userDetails) {
                    delete userDetails.credential;
                    delete userDetails.tempToken;
                    delete userDetails.tokenExpiry;
                    user.user = userDetails;
                }
            }
        }
        return organizationUsers;
    }
    async readOrgUsersCountByOrgId(organizationId) {
        try {
            const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
            const dbResponse = await appServer.AppDataSource.getRepository(organization_user_entity_1.OrganizationUser).countBy({
                organizationId
            });
            return dbResponse;
        }
        catch (error) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Organization User Not Found" /* OrganizationUserErrorMessage.ORGANIZATION_USER_NOT_FOUND */);
        }
    }
    createNewOrganizationUser(data, queryRunner) {
        if (data.status)
            this.validateOrganizationUserStatus(data.status);
        data.updatedBy = data.createdBy;
        return queryRunner.manager.create(organization_user_entity_1.OrganizationUser, data);
    }
    async saveOrganizationUser(data, queryRunner) {
        return await queryRunner.manager.save(organization_user_entity_1.OrganizationUser, data);
    }
    async createOrganizationUser(data) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        const { organization, organizationUser } = await this.readOrganizationUserByOrganizationIdUserId(data.organizationId, data.userId, queryRunner);
        if (organizationUser)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Organization User Already Exists" /* OrganizationUserErrorMessage.ORGANIZATION_USER_ALREADY_EXISTS */);
        const role = await this.roleService.readRoleIsGeneral(data.roleId, queryRunner);
        if (!role)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Role Not Found" /* RoleErrorMessage.ROLE_NOT_FOUND */);
        const createdBy = await this.userService.readUserById(data.createdBy, queryRunner);
        if (!createdBy)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
        let newOrganizationUser = this.createNewOrganizationUser(data, queryRunner);
        organization.updatedBy = data.createdBy;
        try {
            await queryRunner.startTransaction();
            newOrganizationUser = await this.saveOrganizationUser(newOrganizationUser, queryRunner);
            await this.organizationService.saveOrganization(organization, queryRunner);
            await queryRunner.commitTransaction();
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
        return newOrganizationUser;
    }
    async createOrganization(data) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        const user = await this.userService.readUserById(data.createdBy, queryRunner);
        if (!user)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
        let newOrganization = this.organizationService.createNewOrganization(data, queryRunner);
        const role = await this.roleService.readGeneralRoleByName(role_entity_1.GeneralRole.OWNER, queryRunner);
        if (!role)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Role Not Found" /* RoleErrorMessage.ROLE_NOT_FOUND */);
        let newOrganizationUser = {
            organizationId: newOrganization.id,
            userId: user.id,
            roleId: role.id,
            createdBy: user.id
        };
        newOrganizationUser = this.createNewOrganizationUser(newOrganizationUser, queryRunner);
        try {
            await queryRunner.startTransaction();
            newOrganization = await this.organizationService.saveOrganization(newOrganization, queryRunner);
            await this.saveOrganizationUser(newOrganizationUser, queryRunner);
            await queryRunner.commitTransaction();
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
        return newOrganization;
    }
    async updateOrganizationUser(newOrganizationUser) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        const { organizationUser } = await this.readOrganizationUserByOrganizationIdUserId(newOrganizationUser.organizationId, newOrganizationUser.userId, queryRunner);
        if (!organizationUser)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Organization User Not Found" /* OrganizationUserErrorMessage.ORGANIZATION_USER_NOT_FOUND */);
        if (newOrganizationUser.roleId) {
            const role = await this.roleService.readRoleIsGeneral(newOrganizationUser.roleId, queryRunner);
            if (!role)
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Role Not Found" /* RoleErrorMessage.ROLE_NOT_FOUND */);
        }
        if (newOrganizationUser.status)
            this.validateOrganizationUserStatus(newOrganizationUser.status);
        newOrganizationUser.createdBy = organizationUser.createdBy;
        let updateOrganizationUser = queryRunner.manager.merge(organization_user_entity_1.OrganizationUser, organizationUser, newOrganizationUser);
        try {
            await queryRunner.startTransaction();
            updateOrganizationUser = await this.saveOrganizationUser(updateOrganizationUser, queryRunner);
            await queryRunner.commitTransaction();
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
        return updateOrganizationUser;
    }
    async deleteOrganizationUser(queryRunner, organizationId, userId) {
        const { organizationUser } = await this.readOrganizationUserByOrganizationIdUserId(organizationId, userId, queryRunner);
        if (!organizationUser)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Organization User Not Found" /* OrganizationUserErrorMessage.ORGANIZATION_USER_NOT_FOUND */);
        const role = await this.roleService.readRoleById(organizationUser.roleId, queryRunner);
        if (!role)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Role Not Found" /* RoleErrorMessage.ROLE_NOT_FOUND */);
        if (role.name === role_entity_1.GeneralRole.OWNER)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Not Allowed To Delete Owner" /* GeneralErrorMessage.NOT_ALLOWED_TO_DELETE_OWNER */);
        const rolePersonalWorkspace = await this.roleService.readGeneralRoleByName(role_entity_1.GeneralRole.PERSONAL_WORKSPACE, queryRunner);
        const organizationWorkspaces = await queryRunner.manager.findBy(workspace_entity_1.Workspace, { organizationId });
        const workspaceUserToDelete = organizationWorkspaces.map((organizationWorkspace) => ({
            workspaceId: organizationWorkspace.id,
            userId: organizationUser.userId,
            roleId: (0, typeorm_1.Not)(rolePersonalWorkspace.id)
        }));
        await queryRunner.manager.delete(organization_user_entity_1.OrganizationUser, { organizationId, userId });
        await queryRunner.manager.delete(workspace_user_entity_1.WorkspaceUser, workspaceUserToDelete);
        return organizationUser;
    }
}
exports.OrganizationUserService = OrganizationUserService;
//# sourceMappingURL=organization-user.service.js.map