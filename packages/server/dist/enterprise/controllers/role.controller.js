"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleController = void 0;
const http_status_codes_1 = require("http-status-codes");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const role_service_1 = require("../services/role.service");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const tenantRequestGuards_1 = require("../utils/tenantRequestGuards");
class RoleController {
    async create(req, res, next) {
        try {
            const user = (0, tenantRequestGuards_1.getLoggedInUser)(req);
            (0, tenantRequestGuards_1.assertQueryOrganizationMatchesActiveOrg)(user, req.body.organizationId);
            const roleService = new role_service_1.RoleService();
            const newRole = await roleService.createRole(req.body);
            return res.status(http_status_codes_1.StatusCodes.CREATED).json(newRole);
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
            const roleService = new role_service_1.RoleService();
            let role;
            if (query.id) {
                const oneRole = await roleService.readRoleById(query.id, queryRunner);
                if (!oneRole) {
                    throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Role Not Found" /* RoleErrorMessage.ROLE_NOT_FOUND */);
                }
                if (oneRole.organizationId != null) {
                    if (!user.activeOrganizationId || oneRole.organizationId !== user.activeOrganizationId) {
                        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.FORBIDDEN, "Forbidden" /* GeneralErrorMessage.FORBIDDEN */);
                    }
                }
                role = oneRole;
            }
            else if (query.organizationId) {
                if (!user.activeOrganizationId || query.organizationId !== user.activeOrganizationId) {
                    throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.FORBIDDEN, "Forbidden" /* GeneralErrorMessage.FORBIDDEN */);
                }
                role = await roleService.readRoleByOrganizationId(query.organizationId, queryRunner);
            }
            else {
                role = await roleService.readRoleByGeneral(queryRunner);
            }
            return res.status(http_status_codes_1.StatusCodes.OK).json(role);
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
            const user = (0, tenantRequestGuards_1.getLoggedInUser)(req);
            (0, tenantRequestGuards_1.assertQueryOrganizationMatchesActiveOrg)(user, req.body.organizationId);
            const roleService = new role_service_1.RoleService();
            const role = await roleService.updateRole(req.body);
            return res.status(http_status_codes_1.StatusCodes.OK).json(role);
        }
        catch (error) {
            next(error);
        }
    }
    async delete(req, res, next) {
        try {
            const query = req.query;
            if (!query.id) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Role ID is required');
            }
            if (!query.organizationId) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Organization ID is required');
            }
            const roleService = new role_service_1.RoleService();
            const role = await roleService.deleteRole(query.organizationId, query.id);
            return res.status(http_status_codes_1.StatusCodes.OK).json(role);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.RoleController = RoleController;
//# sourceMappingURL=role.controller.js.map