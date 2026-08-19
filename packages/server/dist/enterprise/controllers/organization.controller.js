"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationController = void 0;
const http_status_codes_1 = require("http-status-codes");
const organization_service_1 = require("../services/organization.service");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const organization_user_service_1 = require("../services/organization-user.service");
const quotaUsage_1 = require("../../utils/quotaUsage");
const tenantRequestGuards_1 = require("../utils/tenantRequestGuards");
class OrganizationController {
    async create(req, res, next) {
        try {
            const organizationUserService = new organization_user_service_1.OrganizationUserService();
            const newOrganization = await organizationUserService.createOrganization(req.body);
            return res.status(http_status_codes_1.StatusCodes.CREATED).json(newOrganization);
        }
        catch (error) {
            next(error);
        }
    }
    async read(req, res, next) {
        let queryRunner;
        try {
            queryRunner = (0, getRunningExpressApp_1.getRunningExpressApp)().AppDataSource.createQueryRunner();
            await queryRunner.connect();
            const query = req.query;
            const organizationService = new organization_service_1.OrganizationService();
            let organization;
            if (query.id) {
                organization = await organizationService.readOrganizationById(query.id, queryRunner);
                if (!organization)
                    throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Organization Not Found" /* OrganizationErrorMessage.ORGANIZATION_NOT_FOUND */);
            }
            else if (query.name) {
                organization = await organizationService.readOrganizationByName(query.name, queryRunner);
                if (!organization)
                    throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Organization Not Found" /* OrganizationErrorMessage.ORGANIZATION_NOT_FOUND */);
            }
            else {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Unhandled Edge Case" /* GeneralErrorMessage.UNHANDLED_EDGE_CASE */);
            }
            return res.status(http_status_codes_1.StatusCodes.OK).json(organization);
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
            const organizationService = new organization_service_1.OrganizationService();
            const organization = await organizationService.updateOrganization(req.body);
            return res.status(http_status_codes_1.StatusCodes.OK).json(organization);
        }
        catch (error) {
            next(error);
        }
    }
    async getAdditionalSeatsQuantity(req, res, next) {
        try {
            const { subscriptionId } = req.query;
            if (!subscriptionId) {
                return res.status(400).json({ error: 'Subscription ID is required' });
            }
            (0, tenantRequestGuards_1.assertStripeIdMatchesSession)(subscriptionId, req.user?.activeOrganizationSubscriptionId);
            const organizationUserservice = new organization_user_service_1.OrganizationUserService();
            const totalOrgUsers = await organizationUserservice.readOrgUsersCountByOrgId(req.user?.activeOrganizationId);
            const identityManager = (0, getRunningExpressApp_1.getRunningExpressApp)().identityManager;
            const result = await identityManager.getAdditionalSeatsQuantity(subscriptionId);
            return res.status(http_status_codes_1.StatusCodes.OK).json({ ...result, totalOrgUsers });
        }
        catch (error) {
            next(error);
        }
    }
    async getCustomerWithDefaultSource(req, res, next) {
        try {
            const { customerId } = req.query;
            if (!customerId) {
                return res.status(400).json({ error: 'Customer ID is required' });
            }
            (0, tenantRequestGuards_1.assertStripeIdMatchesSession)(customerId, req.user?.activeOrganizationCustomerId);
            const identityManager = (0, getRunningExpressApp_1.getRunningExpressApp)().identityManager;
            const result = await identityManager.getCustomerWithDefaultSource(customerId);
            return res.status(http_status_codes_1.StatusCodes.OK).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async getAdditionalSeatsProration(req, res, next) {
        try {
            const { subscriptionId, quantity } = req.query;
            if (!subscriptionId) {
                return res.status(400).json({ error: 'Subscription ID is required' });
            }
            if (quantity === undefined) {
                return res.status(400).json({ error: 'Quantity is required' });
            }
            (0, tenantRequestGuards_1.assertStripeIdMatchesSession)(subscriptionId, req.user?.activeOrganizationSubscriptionId);
            const identityManager = (0, getRunningExpressApp_1.getRunningExpressApp)().identityManager;
            const result = await identityManager.getAdditionalSeatsProration(subscriptionId, parseInt(quantity));
            return res.status(http_status_codes_1.StatusCodes.OK).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async getPlanProration(req, res, next) {
        try {
            const { subscriptionId, newPlanId } = req.query;
            if (!subscriptionId) {
                return res.status(400).json({ error: 'Subscription ID is required' });
            }
            if (!newPlanId) {
                return res.status(400).json({ error: 'New plan ID is required' });
            }
            (0, tenantRequestGuards_1.assertStripeIdMatchesSession)(subscriptionId, req.user?.activeOrganizationSubscriptionId);
            const identityManager = (0, getRunningExpressApp_1.getRunningExpressApp)().identityManager;
            const result = await identityManager.getPlanProration(subscriptionId, newPlanId);
            return res.status(http_status_codes_1.StatusCodes.OK).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async updateAdditionalSeats(req, res, next) {
        try {
            const { subscriptionId, quantity, prorationDate } = req.body;
            if (!subscriptionId) {
                return res.status(400).json({ error: 'Subscription ID is required' });
            }
            if (quantity === undefined) {
                return res.status(400).json({ error: 'Quantity is required' });
            }
            if (!prorationDate) {
                return res.status(400).json({ error: 'Proration date is required' });
            }
            (0, tenantRequestGuards_1.assertStripeIdMatchesSession)(subscriptionId, req.user?.activeOrganizationSubscriptionId);
            const identityManager = (0, getRunningExpressApp_1.getRunningExpressApp)().identityManager;
            const result = await identityManager.updateAdditionalSeats(subscriptionId, quantity, prorationDate);
            return res.status(http_status_codes_1.StatusCodes.OK).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async updateSubscriptionPlan(req, res, next) {
        try {
            const { subscriptionId, newPlanId, prorationDate } = req.body;
            if (!subscriptionId) {
                return res.status(400).json({ error: 'Subscription ID is required' });
            }
            if (!newPlanId) {
                return res.status(400).json({ error: 'New plan ID is required' });
            }
            if (!prorationDate) {
                return res.status(400).json({ error: 'Proration date is required' });
            }
            (0, tenantRequestGuards_1.assertStripeIdMatchesSession)(subscriptionId, req.user?.activeOrganizationSubscriptionId);
            const identityManager = (0, getRunningExpressApp_1.getRunningExpressApp)().identityManager;
            const result = await identityManager.updateSubscriptionPlan(req, subscriptionId, newPlanId, prorationDate);
            return res.status(http_status_codes_1.StatusCodes.OK).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async getCurrentUsage(req, res, next) {
        try {
            const orgId = req.user?.activeOrganizationId;
            const subscriptionId = req.user?.activeOrganizationSubscriptionId;
            if (!orgId) {
                return res.status(400).json({ error: 'Organization ID is required' });
            }
            if (!subscriptionId) {
                return res.status(400).json({ error: 'Subscription ID is required' });
            }
            const usageCacheManager = (0, getRunningExpressApp_1.getRunningExpressApp)().usageCacheManager;
            const result = await (0, quotaUsage_1.getCurrentUsage)(orgId, subscriptionId, usageCacheManager);
            return res.status(http_status_codes_1.StatusCodes.OK).json(result);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.OrganizationController = OrganizationController;
//# sourceMappingURL=organization.controller.js.map