"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleService = void 0;
const http_status_codes_1 = require("http-status-codes");
const typeorm_1 = require("typeorm");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const role_entity_1 = require("../database/entities/role.entity");
const workspace_user_entity_1 = require("../database/entities/workspace-user.entity");
const validation_util_1 = require("../utils/validation.util");
const organization_service_1 = require("./organization.service");
const user_service_1 = require("./user.service");
class RoleService {
    constructor() {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        this.dataSource = appServer.AppDataSource;
        this.userService = new user_service_1.UserService();
        this.organizationService = new organization_service_1.OrganizationService();
    }
    validateRoleId(id) {
        if ((0, validation_util_1.isInvalidUUID)(id))
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid Role Id" /* RoleErrorMessage.INVALID_ROLE_ID */);
    }
    async readRoleById(id, queryRunner) {
        this.validateRoleId(id);
        return await queryRunner.manager.findOneBy(role_entity_1.Role, { id });
    }
    validateRoleName(name) {
        if ((0, validation_util_1.isInvalidName)(name))
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid Role Name" /* RoleErrorMessage.INVALID_ROLE_NAME */);
    }
    async readRoleByOrganizationId(organizationId, queryRunner) {
        const organization = await this.organizationService.readOrganizationById(organizationId, queryRunner);
        if (!organization)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Organization Not Found" /* OrganizationErrorMessage.ORGANIZATION_NOT_FOUND */);
        const roles = await queryRunner.manager.findBy(role_entity_1.Role, { organizationId });
        return await Promise.all(roles.map(async (role) => {
            const workspaceUser = await queryRunner.manager.findBy(workspace_user_entity_1.WorkspaceUser, { roleId: role.id });
            const userCount = workspaceUser.length;
            return { ...role, userCount };
        }));
    }
    async readRoleByRoleIdOrganizationId(id, organizationId, queryRunner) {
        this.validateRoleId(id);
        const organization = await this.organizationService.readOrganizationById(organizationId, queryRunner);
        if (!organization)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Organization Not Found" /* OrganizationErrorMessage.ORGANIZATION_NOT_FOUND */);
        return await queryRunner.manager.findOneBy(role_entity_1.Role, { id, organizationId });
    }
    async readGeneralRoleByName(name, queryRunner) {
        this.validateRoleName(name);
        const generalRole = await queryRunner.manager.findOneBy(role_entity_1.Role, { name, organizationId: (0, typeorm_1.IsNull)() });
        if (!generalRole)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Role Not Found" /* RoleErrorMessage.ROLE_NOT_FOUND */);
        return generalRole;
    }
    async readRoleIsGeneral(id, queryRunner) {
        this.validateRoleId(id);
        return await queryRunner.manager.findOneBy(role_entity_1.Role, { id, organizationId: (0, typeorm_1.IsNull)() });
    }
    async readRoleByGeneral(queryRunner) {
        const generalRoles = await queryRunner.manager.find(role_entity_1.Role, { where: { organizationId: (0, typeorm_1.IsNull)() } });
        if (generalRoles.length <= 0)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Role Not Found" /* RoleErrorMessage.ROLE_NOT_FOUND */);
        return generalRoles;
    }
    async readRole(queryRunner) {
        return await queryRunner.manager.find(role_entity_1.Role);
    }
    async saveRole(data, queryRunner) {
        return await queryRunner.manager.save(role_entity_1.Role, data);
    }
    async createRole(data) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        const user = await this.userService.readUserById(data.createdBy, queryRunner);
        if (!user)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
        const organization = await this.organizationService.readOrganizationById(data.organizationId, queryRunner);
        if (!organization)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Organization Not Found" /* OrganizationErrorMessage.ORGANIZATION_NOT_FOUND */);
        this.validateRoleName(data.name);
        if (!data.permissions)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid Role Permissions" /* RoleErrorMessage.INVALID_ROLE_PERMISSIONS */);
        data.updatedBy = data.createdBy;
        let newRole = queryRunner.manager.create(role_entity_1.Role, data);
        try {
            await queryRunner.startTransaction();
            newRole = await this.saveRole(newRole, queryRunner);
            await queryRunner.commitTransaction();
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
        return newRole;
    }
    async updateRole(newRole) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        const oldRole = await this.readRoleById(newRole.id, queryRunner);
        if (!oldRole)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Role Not Found" /* RoleErrorMessage.ROLE_NOT_FOUND */);
        const user = await this.userService.readUserById(newRole.updatedBy, queryRunner);
        if (!user)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
        if (newRole.name)
            this.validateRoleName(newRole.name);
        newRole.organizationId = oldRole.organizationId;
        newRole.createdBy = oldRole.createdBy;
        let updateRole = queryRunner.manager.merge(role_entity_1.Role, oldRole, newRole);
        try {
            await queryRunner.startTransaction();
            updateRole = await this.saveRole(updateRole, queryRunner);
            await queryRunner.commitTransaction();
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
        return updateRole;
    }
    async deleteRole(organizationId, roleId) {
        const queryRunner = this.dataSource.createQueryRunner();
        try {
            await queryRunner.connect();
            const role = await this.readRoleByRoleIdOrganizationId(roleId, organizationId, queryRunner);
            if (!role)
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Role Not Found" /* RoleErrorMessage.ROLE_NOT_FOUND */);
            await queryRunner.startTransaction();
            await queryRunner.manager.delete(workspace_user_entity_1.WorkspaceUser, { roleId });
            await queryRunner.manager.delete(role_entity_1.Role, { id: roleId });
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
exports.RoleService = RoleService;
//# sourceMappingURL=role.service.js.map