"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceUserService = void 0;
const http_status_codes_1 = require("http-status-codes");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const organization_user_entity_1 = require("../database/entities/organization-user.entity");
const role_entity_1 = require("../database/entities/role.entity");
const workspace_user_entity_1 = require("../database/entities/workspace-user.entity");
const validation_util_1 = require("../utils/validation.util");
const organization_service_1 = require("./organization.service");
const role_service_1 = require("./role.service");
const user_service_1 = require("./user.service");
const workspace_service_1 = require("./workspace.service");
class WorkspaceUserService {
    constructor() {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        this.dataSource = appServer.AppDataSource;
        this.userService = new user_service_1.UserService();
        this.workspaceService = new workspace_service_1.WorkspaceService();
        this.roleService = new role_service_1.RoleService();
        this.organizationService = new organization_service_1.OrganizationService();
    }
    validateWorkspaceUserStatus(status) {
        if (status && !Object.values(workspace_user_entity_1.WorkspaceUserStatus).includes(status))
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid Workspace User Status" /* WorkspaceUserErrorMessage.INVALID_WORKSPACE_USER_SATUS */);
    }
    validateWorkspaceUserLastLogin(lastLogin) {
        if ((0, validation_util_1.isInvalidDateTime)(lastLogin))
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid Workspace User LastLogin" /* WorkspaceUserErrorMessage.INVALID_WORKSPACE_USER_LASTLOGIN */);
    }
    async readWorkspaceUserByWorkspaceIdUserId(workspaceId, userId, queryRunner) {
        const workspace = await this.workspaceService.readWorkspaceById(workspaceId, queryRunner);
        if (!workspace)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Workspace Not Found" /* WorkspaceErrorMessage.WORKSPACE_NOT_FOUND */);
        const user = await this.userService.readUserById(userId, queryRunner);
        if (!user)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
        const ownerRole = await this.roleService.readGeneralRoleByName(role_entity_1.GeneralRole.OWNER, queryRunner);
        const workspaceUser = await queryRunner.manager
            .createQueryBuilder(workspace_user_entity_1.WorkspaceUser, 'workspaceUser')
            .innerJoinAndSelect('workspaceUser.role', 'role')
            .where('workspaceUser.workspaceId = :workspaceId', { workspaceId })
            .andWhere('workspaceUser.userId = :userId', { userId })
            .getOne();
        return {
            workspace,
            workspaceUser: workspaceUser
                ? {
                    ...workspaceUser,
                    isOrgOwner: workspaceUser.roleId === ownerRole?.id
                }
                : null
        };
    }
    async readWorkspaceUserByWorkspaceId(workspaceId, queryRunner) {
        const workspace = await this.workspaceService.readWorkspaceById(workspaceId, queryRunner);
        if (!workspace)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Workspace Not Found" /* WorkspaceErrorMessage.WORKSPACE_NOT_FOUND */);
        const ownerRole = await this.roleService.readGeneralRoleByName(role_entity_1.GeneralRole.OWNER, queryRunner);
        const workspaceUsers = await queryRunner.manager
            .createQueryBuilder(workspace_user_entity_1.WorkspaceUser, 'workspaceUser')
            .innerJoinAndSelect('workspaceUser.role', 'role')
            .innerJoinAndSelect('workspaceUser.user', 'user')
            .where('workspaceUser.workspaceId = :workspaceId', { workspaceId })
            .getMany();
        return workspaceUsers.map((workspaceUser) => {
            delete workspaceUser.user.credential;
            delete workspaceUser.user.tempToken;
            delete workspaceUser.user.tokenExpiry;
            return {
                ...workspaceUser,
                isOrgOwner: workspaceUser.roleId === ownerRole?.id
            };
        });
    }
    async readWorkspaceUserByUserId(userId, queryRunner) {
        const user = await this.userService.readUserById(userId, queryRunner);
        if (!user)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
        const ownerRole = await this.roleService.readGeneralRoleByName(role_entity_1.GeneralRole.OWNER, queryRunner);
        const workspaceUsers = await queryRunner.manager
            .createQueryBuilder(workspace_user_entity_1.WorkspaceUser, 'workspaceUser')
            .innerJoinAndSelect('workspaceUser.workspace', 'workspace')
            .innerJoinAndSelect('workspaceUser.role', 'role')
            .where('workspaceUser.userId = :userId', { userId })
            .getMany();
        return workspaceUsers.map((user) => ({
            ...user,
            isOrgOwner: user.roleId === ownerRole?.id
        }));
    }
    async readWorkspaceUserByOrganizationIdUserId(organizationId, userId, queryRunner) {
        const user = await this.userService.readUserById(userId, queryRunner);
        if (!user)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
        const organization = await this.organizationService.readOrganizationById(organizationId, queryRunner);
        if (!organization)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Organization Not Found" /* OrganizationErrorMessage.ORGANIZATION_NOT_FOUND */);
        const ownerRole = await this.roleService.readGeneralRoleByName(role_entity_1.GeneralRole.OWNER, queryRunner);
        const workspaceUsers = await queryRunner.manager
            .createQueryBuilder(workspace_user_entity_1.WorkspaceUser, 'workspaceUser')
            .innerJoinAndSelect('workspaceUser.workspace', 'workspace')
            .innerJoinAndSelect('workspaceUser.role', 'role')
            .where('workspace.organizationId = :organizationId', { organizationId })
            .andWhere('workspaceUser.userId = :userId', { userId })
            .getMany();
        return workspaceUsers.map((user) => ({
            ...user,
            isOrgOwner: user.roleId === ownerRole?.id
        }));
    }
    async readWorkspaceUserByOrganizationId(organizationId, queryRunner) {
        const organization = await this.organizationService.readOrganizationById(organizationId, queryRunner);
        if (!organization)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Organization Not Found" /* OrganizationErrorMessage.ORGANIZATION_NOT_FOUND */);
        const ownerRole = await this.roleService.readGeneralRoleByName(role_entity_1.GeneralRole.OWNER, queryRunner);
        const workspaceUsers = await queryRunner.manager
            .createQueryBuilder(workspace_user_entity_1.WorkspaceUser, 'workspaceUser')
            .innerJoinAndSelect('workspaceUser.workspace', 'workspace')
            .innerJoinAndSelect('workspaceUser.user', 'user')
            .innerJoinAndSelect('workspaceUser.role', 'role')
            .where('workspace.organizationId = :organizationId', { organizationId })
            .getMany();
        return workspaceUsers.map((user) => ({
            ...user,
            isOrgOwner: user.roleId === ownerRole?.id
        }));
    }
    async readWorkspaceUserByRoleId(roleId, queryRunner, organizationId) {
        const role = await this.roleService.readRoleById(roleId, queryRunner);
        if (!role)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Role Not Found" /* RoleErrorMessage.ROLE_NOT_FOUND */);
        const ownerRole = await this.roleService.readGeneralRoleByName(role_entity_1.GeneralRole.OWNER, queryRunner);
        const qb = queryRunner.manager
            .createQueryBuilder(workspace_user_entity_1.WorkspaceUser, 'workspaceUser')
            .innerJoinAndSelect('workspaceUser.workspace', 'workspace')
            .innerJoinAndSelect('workspaceUser.user', 'user')
            .innerJoinAndSelect('workspaceUser.role', 'role')
            .where('workspaceUser.roleId = :roleId', { roleId });
        if (organizationId) {
            qb.andWhere('workspace.organizationId = :organizationId', { organizationId });
        }
        const workspaceUsers = await qb.getMany();
        return workspaceUsers.map((workspaceUser) => {
            delete workspaceUser.user.credential;
            delete workspaceUser.user.tempToken;
            delete workspaceUser.user.tokenExpiry;
            return {
                ...workspaceUser,
                isOrgOwner: workspaceUser.roleId === ownerRole?.id
            };
        });
    }
    async readWorkspaceUserByLastLogin(userId, queryRunner) {
        const user = await this.userService.readUserById(userId, queryRunner);
        if (!user)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
        const ownerRole = await this.roleService.readGeneralRoleByName(role_entity_1.GeneralRole.OWNER, queryRunner);
        let workspaceUser = await queryRunner.manager
            .createQueryBuilder(workspace_user_entity_1.WorkspaceUser, 'workspaceUser')
            .innerJoinAndSelect('workspaceUser.workspace', 'workspace')
            .innerJoinAndSelect('workspaceUser.role', 'role')
            .where('workspaceUser.userId = :userId', { userId })
            .andWhere('workspaceUser.lastLogin IS NOT NULL')
            .orderBy('workspaceUser.lastLogin', 'DESC')
            .take(1)
            .getOne();
        if (!workspaceUser)
            return await this.readWorkspaceUserByUserId(userId, queryRunner);
        return {
            ...workspaceUser,
            isOrgOwner: workspaceUser.roleId === ownerRole?.id
        };
    }
    createNewWorkspaceUser(data, queryRunner) {
        if (data.status)
            this.validateWorkspaceUserStatus(data.status);
        data.updatedBy = data.createdBy;
        return queryRunner.manager.create(workspace_user_entity_1.WorkspaceUser, data);
    }
    async saveWorkspaceUser(data, queryRunner) {
        return await queryRunner.manager.save(workspace_user_entity_1.WorkspaceUser, data);
    }
    async createWorkspaceUser(data) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        const { workspace, workspaceUser } = await this.readWorkspaceUserByWorkspaceIdUserId(data.workspaceId, data.userId, queryRunner);
        if (workspaceUser)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Workspace User Already Exists" /* WorkspaceUserErrorMessage.WORKSPACE_USER_ALREADY_EXISTS */);
        const role = await this.roleService.readRoleById(data.roleId, queryRunner);
        if (!role)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Role Not Found" /* RoleErrorMessage.ROLE_NOT_FOUND */);
        const createdBy = await this.userService.readUserById(data.createdBy, queryRunner);
        if (!createdBy)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
        let newWorkspaceUser = this.createNewWorkspaceUser(data, queryRunner);
        workspace.updatedBy = data.createdBy;
        try {
            await queryRunner.startTransaction();
            newWorkspaceUser = await this.saveWorkspaceUser(newWorkspaceUser, queryRunner);
            await this.workspaceService.saveWorkspace(workspace, queryRunner);
            await this.roleService.saveRole(role, queryRunner);
            await queryRunner.commitTransaction();
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
        return newWorkspaceUser;
    }
    async createWorkspace(data) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        const organization = await this.organizationService.readOrganizationById(data.organizationId, queryRunner);
        if (!organization)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Organization Not Found" /* OrganizationErrorMessage.ORGANIZATION_NOT_FOUND */);
        const user = await this.userService.readUserById(data.createdBy, queryRunner);
        if (!user)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
        let organizationUser = await queryRunner.manager.findOneBy(organization_user_entity_1.OrganizationUser, { organizationId: organization.id, userId: user.id });
        if (!organizationUser)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Organization User Not Found" /* OrganizationUserErrorMessage.ORGANIZATION_USER_NOT_FOUND */);
        organizationUser.updatedBy = user.id;
        let newWorkspace = this.workspaceService.createNewWorkspace(data, queryRunner);
        const ownerRole = await this.roleService.readGeneralRoleByName(role_entity_1.GeneralRole.OWNER, queryRunner);
        if (!ownerRole)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Role Not Found" /* RoleErrorMessage.ROLE_NOT_FOUND */);
        const role = await this.roleService.readRoleById(organizationUser.roleId, queryRunner);
        if (!role)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Role Not Found" /* RoleErrorMessage.ROLE_NOT_FOUND */);
        // Add org admin as workspace owner if the user creating the workspace is NOT the org admin
        const orgAdmin = await queryRunner.manager.findOneBy(organization_user_entity_1.OrganizationUser, {
            organizationId: organization.id,
            roleId: ownerRole.id
        });
        if (!orgAdmin)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Organization User Not Found" /* OrganizationUserErrorMessage.ORGANIZATION_USER_NOT_FOUND */);
        let isCreateWorkSpaceUserOrgAdmin = false;
        if (orgAdmin.userId === user.id) {
            isCreateWorkSpaceUserOrgAdmin = true;
        }
        let orgAdminUser = {
            workspaceId: newWorkspace.id,
            roleId: ownerRole.id,
            userId: orgAdmin.userId,
            createdBy: orgAdmin.userId
        };
        if (!isCreateWorkSpaceUserOrgAdmin)
            orgAdminUser = this.createNewWorkspaceUser(orgAdminUser, queryRunner);
        let newWorkspaceUser = {
            workspaceId: newWorkspace.id,
            roleId: role.id,
            userId: user.id,
            createdBy: user.id
        };
        // If user creating the workspace is an invited user, not the organization admin, inherit the role from existingWorkspaceId
        if (data.existingWorkspaceId) {
            const existingWorkspaceUser = await queryRunner.manager.findOneBy(workspace_user_entity_1.WorkspaceUser, {
                workspaceId: data.existingWorkspaceId,
                userId: user.id
            });
            if (existingWorkspaceUser) {
                newWorkspaceUser.roleId = existingWorkspaceUser.roleId;
            }
        }
        newWorkspaceUser = this.createNewWorkspaceUser(newWorkspaceUser, queryRunner);
        try {
            await queryRunner.startTransaction();
            newWorkspace = await this.workspaceService.saveWorkspace(newWorkspace, queryRunner);
            if (!isCreateWorkSpaceUserOrgAdmin)
                await this.saveWorkspaceUser(orgAdminUser, queryRunner);
            await this.saveWorkspaceUser(newWorkspaceUser, queryRunner);
            await queryRunner.manager.save(organization_user_entity_1.OrganizationUser, organizationUser);
            await queryRunner.commitTransaction();
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
        return newWorkspace;
    }
    async updateWorkspaceUser(newWorkspaserUser, queryRunner) {
        const { workspaceUser } = await this.readWorkspaceUserByWorkspaceIdUserId(newWorkspaserUser.workspaceId, newWorkspaserUser.userId, queryRunner);
        if (!workspaceUser)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Workspace User Not Found" /* WorkspaceUserErrorMessage.WORKSPACE_USER_NOT_FOUND */);
        if (newWorkspaserUser.roleId && workspaceUser.role) {
            const role = await this.roleService.readRoleById(newWorkspaserUser.roleId, queryRunner);
            if (!role)
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Role Not Found" /* RoleErrorMessage.ROLE_NOT_FOUND */);
            // check if the role is from the same organization
            if (role.organizationId !== workspaceUser.role.organizationId) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Role Not Found" /* RoleErrorMessage.ROLE_NOT_FOUND */);
            }
            // delete role, the new role will be created again, with the new roleId (newWorkspaserUser.roleId)
            if (workspaceUser.role)
                delete workspaceUser.role;
        }
        const updatedBy = await this.userService.readUserById(newWorkspaserUser.updatedBy, queryRunner);
        if (!updatedBy)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
        if (newWorkspaserUser.status)
            this.validateWorkspaceUserStatus(newWorkspaserUser.status);
        if (newWorkspaserUser.lastLogin)
            this.validateWorkspaceUserLastLogin(newWorkspaserUser.lastLogin);
        newWorkspaserUser.createdBy = workspaceUser.createdBy;
        let updataWorkspaceUser = queryRunner.manager.merge(workspace_user_entity_1.WorkspaceUser, workspaceUser, newWorkspaserUser);
        updataWorkspaceUser = await this.saveWorkspaceUser(updataWorkspaceUser, queryRunner);
        return updataWorkspaceUser;
    }
    async deleteWorkspaceUser(workspaceId, userId) {
        const queryRunner = this.dataSource.createQueryRunner();
        try {
            await queryRunner.connect();
            const { workspace, workspaceUser } = await this.readWorkspaceUserByWorkspaceIdUserId(workspaceId, userId, queryRunner);
            if (!workspaceUser)
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Workspace User Not Found" /* WorkspaceUserErrorMessage.WORKSPACE_USER_NOT_FOUND */);
            const role = await this.roleService.readRoleById(workspaceUser.roleId, queryRunner);
            if (!role)
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Role Not Found" /* RoleErrorMessage.ROLE_NOT_FOUND */);
            if (role.name === role_entity_1.GeneralRole.OWNER)
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Not Allowed To Delete Owner" /* GeneralErrorMessage.NOT_ALLOWED_TO_DELETE_OWNER */);
            await queryRunner.startTransaction();
            await queryRunner.manager.delete(workspace_user_entity_1.WorkspaceUser, { workspaceId, userId });
            await this.roleService.saveRole(role, queryRunner);
            await this.workspaceService.saveWorkspace(workspace, queryRunner);
            await queryRunner.commitTransaction();
            return { message: "Resource Deleted Successful" /* GeneralSuccessMessage.DELETED */ };
        }
        catch (error) {
            if (queryRunner.isTransactionActive)
                await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            if (!queryRunner.isReleased)
                await queryRunner.release();
        }
    }
}
exports.WorkspaceUserService = WorkspaceUserService;
//# sourceMappingURL=workspace-user.service.js.map