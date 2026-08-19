"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationService = void 0;
const http_status_codes_1 = require("http-status-codes");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const utils_1 = require("../../utils");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const organization_entity_1 = require("../database/entities/organization.entity");
const validation_util_1 = require("../utils/validation.util");
const user_service_1 = require("./user.service");
class OrganizationService {
    constructor() {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        this.dataSource = appServer.AppDataSource;
        this.telemetry = appServer.telemetry;
        this.userService = new user_service_1.UserService();
    }
    validateOrganizationId(id) {
        if ((0, validation_util_1.isInvalidUUID)(id))
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid Organization Id" /* OrganizationErrorMessage.INVALID_ORGANIZATION_ID */);
    }
    async readOrganizationById(id, queryRunner) {
        this.validateOrganizationId(id);
        return await queryRunner.manager.findOneBy(organization_entity_1.Organization, { id });
    }
    validateOrganizationName(name, isRegister = false) {
        if ((0, validation_util_1.isInvalidName)(name))
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid Organization Name" /* OrganizationErrorMessage.INVALID_ORGANIZATION_NAME */);
        if (!isRegister && name === organization_entity_1.OrganizationName.DEFAULT_ORGANIZATION) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Organization name cannot be Default Organization - this is a reserved name" /* OrganizationErrorMessage.ORGANIZATION_RESERVERD_NAME */);
        }
    }
    async readOrganizationByName(name, queryRunner) {
        this.validateOrganizationName(name);
        return await queryRunner.manager.findOneBy(organization_entity_1.Organization, { name });
    }
    async readOrganizationBySlug(slug, queryRunner) {
        if (!slug)
            return null;
        return await queryRunner.manager.findOneBy(organization_entity_1.Organization, { slug });
    }
    slugifyOrganizationName(name) {
        const base = name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-+|-+$)/g, '');
        return base || 'org';
    }
    generateOrganizationSlug(name, id) {
        return `${this.slugifyOrganizationName(name)}-${id.split('-')[0]}`;
    }
    async countOrganizations(queryRunner) {
        return await queryRunner.manager.count(organization_entity_1.Organization);
    }
    async readOrganization(queryRunner) {
        return await queryRunner.manager.find(organization_entity_1.Organization);
    }
    createNewOrganization(data, queryRunner, isRegister = false) {
        this.validateOrganizationName(data.name, isRegister);
        data.updatedBy = data.createdBy;
        data.id = (0, utils_1.generateId)();
        if (!data.slug) {
            data.slug = this.generateOrganizationSlug(data.name || organization_entity_1.OrganizationName.DEFAULT_ORGANIZATION, data.id);
        }
        return queryRunner.manager.create(organization_entity_1.Organization, data);
    }
    async saveOrganization(data, queryRunner) {
        return await queryRunner.manager.save(organization_entity_1.Organization, data);
    }
    async createOrganization(data) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        const user = await this.userService.readUserById(data.createdBy, queryRunner);
        if (!user)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
        let newOrganization = this.createNewOrganization(data, queryRunner);
        try {
            await queryRunner.startTransaction();
            newOrganization = await this.saveOrganization(newOrganization, queryRunner);
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
    async updateOrganization(newOrganizationData) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        const oldOrganizationData = await this.readOrganizationById(newOrganizationData.id, queryRunner);
        if (!oldOrganizationData)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Organization Not Found" /* OrganizationErrorMessage.ORGANIZATION_NOT_FOUND */);
        const user = await this.userService.readUserById(newOrganizationData.updatedBy, queryRunner);
        if (!user)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
        if (newOrganizationData.name) {
            this.validateOrganizationName(newOrganizationData.name);
        }
        newOrganizationData.createdBy = oldOrganizationData.createdBy;
        let updateOrganization = queryRunner.manager.merge(organization_entity_1.Organization, oldOrganizationData, newOrganizationData);
        try {
            await queryRunner.startTransaction();
            await this.saveOrganization(updateOrganization, queryRunner);
            await queryRunner.commitTransaction();
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
        return updateOrganization;
    }
}
exports.OrganizationService = OrganizationService;
//# sourceMappingURL=organization.service.js.map