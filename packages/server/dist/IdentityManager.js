"use strict";
/**
 * Copyright (c) 2023-present FlowiseAI, Inc.
 *
 * The Enterprise and Cloud versions of Flowise are licensed under the [Commercial License](https://github.com/FlowiseAI/Flowise/tree/main/packages/server/src/enterprise/LICENSE.md).
 * Unauthorized copying, modification, distribution, or use of the Enterprise and Cloud versions is strictly prohibited without a valid license agreement from FlowiseAI, Inc.
 *
 * The Open Source version is licensed under the Apache License, Version 2.0 (the "License")
 *
 * For information about licensing of the Enterprise and Cloud versions, please contact:
 * security@accelance.io
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityManager = void 0;
const axios_1 = __importDefault(require("axios"));
const fs = __importStar(require("fs"));
const http_status_codes_1 = require("http-status-codes");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const path_1 = __importDefault(require("path"));
const login_method_entity_1 = require("./enterprise/database/entities/login-method.entity");
const Interface_Enterprise_1 = require("./enterprise/Interface.Enterprise");
const Permissions_1 = require("./enterprise/rbac/Permissions");
const login_method_service_1 = require("./enterprise/services/login-method.service");
const organization_service_1 = require("./enterprise/services/organization.service");
const Auth0SSO_1 = __importDefault(require("./enterprise/sso/Auth0SSO"));
const AzureSSO_1 = __importDefault(require("./enterprise/sso/AzureSSO"));
const GithubSSO_1 = __importDefault(require("./enterprise/sso/GithubSSO"));
const GoogleSSO_1 = __importDefault(require("./enterprise/sso/GoogleSSO"));
const ssoRouteRegistry_1 = require("./enterprise/sso/ssoRouteRegistry");
const internalAccelanceError_1 = require("./errors/internalAccelanceError");
const Interface_1 = require("./Interface");
const StripeManager_1 = require("./StripeManager");
const UsageCacheManager_1 = require("./UsageCacheManager");
const constants_1 = require("./utils/constants");
const getRunningExpressApp_1 = require("./utils/getRunningExpressApp");
const quotaUsage_1 = require("./utils/quotaUsage");
const allSSOProviders = ['azure', 'google', 'auth0', 'github'];
class IdentityManager {
    constructor() {
        this.licenseValid = false;
        this.ssoProviderName = '';
        this.currentInstancePlatform = Interface_1.Platform.OPEN_SOURCE;
        // create a map to store the sso provider name and the sso provider instance
        this.ssoProviders = new Map();
        this.getPlatformType = () => {
            return this.currentInstancePlatform;
        };
        this.getPermissions = () => {
            return this.permissions;
        };
        this.isEnterprise = () => {
            return this.currentInstancePlatform === Interface_1.Platform.ENTERPRISE;
        };
        this.isCloud = () => {
            return this.currentInstancePlatform === Interface_1.Platform.CLOUD;
        };
        this.isOpenSource = () => {
            return this.currentInstancePlatform === Interface_1.Platform.OPEN_SOURCE;
        };
        this.isLicenseValid = () => {
            return this.licenseValid;
        };
        this._validateLicenseKey = async () => {
            // Self-hosted enterprise mode: set ACCELANCE_PLATFORM=enterprise in .env to bypass license check.
            // Enables all enterprise features (org/workspace/user/role management) without an Accelance EE license.
            if (process.env.ACCELANCE_PLATFORM?.toLowerCase() === 'enterprise') {
                this.licenseValid = true;
                this.currentInstancePlatform = Interface_1.Platform.ENTERPRISE;
                return;
            }
            const LICENSE_URL = process.env.LICENSE_URL;
            const ACCELANCE_EE_LICENSE_KEY = process.env.ACCELANCE_EE_LICENSE_KEY;
            // First check if license key is missing
            if (!ACCELANCE_EE_LICENSE_KEY) {
                this.licenseValid = false;
                this.currentInstancePlatform = Interface_1.Platform.OPEN_SOURCE;
                return;
            }
            try {
                if (process.env.OFFLINE === 'true') {
                    const decodedLicense = this._offlineVerifyLicense(ACCELANCE_EE_LICENSE_KEY);
                    if (!decodedLicense) {
                        this.licenseValid = false;
                    }
                    else {
                        const issuedAtSeconds = decodedLicense.iat;
                        if (!issuedAtSeconds) {
                            this.licenseValid = false;
                        }
                        else {
                            const issuedAt = new Date(issuedAtSeconds * 1000);
                            const expiryDurationInMonths = decodedLicense.expiryDurationInMonths || 0;
                            const expiryDate = new Date(issuedAt);
                            expiryDate.setMonth(expiryDate.getMonth() + expiryDurationInMonths);
                            if (new Date() > expiryDate) {
                                this.licenseValid = false;
                            }
                            else {
                                this.licenseValid = true;
                            }
                        }
                    }
                    this.currentInstancePlatform = Interface_1.Platform.ENTERPRISE;
                }
                else if (LICENSE_URL) {
                    try {
                        const response = await axios_1.default.post(`${LICENSE_URL}/enterprise/verify`, { license: ACCELANCE_EE_LICENSE_KEY });
                        this.licenseValid = response.data?.valid;
                        if (!LICENSE_URL.includes('api'))
                            this.currentInstancePlatform = Interface_1.Platform.ENTERPRISE;
                        else if (LICENSE_URL.includes('v1'))
                            this.currentInstancePlatform = Interface_1.Platform.ENTERPRISE;
                        else if (LICENSE_URL.includes('v2'))
                            this.currentInstancePlatform = response.data?.platform;
                        else
                            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, "Unhandled Edge Case" /* GeneralErrorMessage.UNHANDLED_EDGE_CASE */);
                    }
                    catch (error) {
                        console.error('Error verifying license key:', error);
                        this.licenseValid = false;
                        this.currentInstancePlatform = Interface_1.Platform.ENTERPRISE;
                        return;
                    }
                }
            }
            catch (error) {
                this.licenseValid = false;
            }
        };
        this.initializeSSO = async (app) => {
            this.registerAllSsoRoutes(app);
            const platformType = this.getPlatformType();
            if (platformType === Interface_1.Platform.ENTERPRISE) {
                const loginMethodService = new login_method_service_1.LoginMethodService();
                let queryRunner;
                try {
                    queryRunner = (0, getRunningExpressApp_1.getRunningExpressApp)().AppDataSource.createQueryRunner();
                    await queryRunner.connect();
                    const organizationService = new organization_service_1.OrganizationService();
                    const organizations = await organizationService.readOrganization(queryRunner);
                    for (const organization of organizations) {
                        const loginMethods = await loginMethodService.readLoginMethodByOrganizationId(organization.id, queryRunner);
                        if (loginMethods && loginMethods.length > 0) {
                            for (let method of loginMethods) {
                                if (method.status === login_method_entity_1.LoginMethodStatus.ENABLE) {
                                    method.config = JSON.parse(await loginMethodService.decryptLoginMethodConfig(method.config));
                                    this.initializeSsoProvider(app, method.name, method.config, organization.id, organization.slug);
                                }
                            }
                        }
                    }
                }
                finally {
                    if (queryRunner)
                        await queryRunner.release();
                }
                // Enterprise providers are instantiated lazily, per (organization, provider) - no
                // deployment-wide placeholders needed since every route resolves its org from the slug.
                return;
            }
            if (platformType === Interface_1.Platform.CLOUD) {
                const loginMethodService = new login_method_service_1.LoginMethodService();
                let queryRunner;
                try {
                    queryRunner = (0, getRunningExpressApp_1.getRunningExpressApp)().AppDataSource.createQueryRunner();
                    await queryRunner.connect();
                    const loginMethods = await loginMethodService.readLoginMethodByOrganizationId(undefined, queryRunner);
                    if (loginMethods && loginMethods.length > 0) {
                        for (let method of loginMethods) {
                            if (method.status === login_method_entity_1.LoginMethodStatus.ENABLE) {
                                method.config = JSON.parse(await loginMethodService.decryptLoginMethodConfig(method.config));
                                this.initializeSsoProvider(app, method.name, method.config);
                            }
                        }
                    }
                }
                finally {
                    if (queryRunner)
                        await queryRunner.release();
                }
            }
            // iterate through the remaining providers and initialize them with configEnabled as false
            this.initializeEmptySSO(app);
        };
    }
    static async getInstance() {
        if (!IdentityManager.instance) {
            IdentityManager.instance = new IdentityManager();
            await IdentityManager.instance.initialize();
        }
        return IdentityManager.instance;
    }
    async initialize() {
        await this._validateLicenseKey();
        this.permissions = new Permissions_1.Permissions();
        if (process.env.STRIPE_SECRET_KEY) {
            this.stripeManager = await StripeManager_1.StripeManager.getInstance();
        }
    }
    _offlineVerifyLicense(licenseKey) {
        try {
            const publicKey = fs.readFileSync(path_1.default.join(__dirname, '../', 'src/enterprise/license/public.pem'), 'utf8');
            const decoded = jsonwebtoken_1.default.verify(licenseKey, publicKey, {
                algorithms: ['RS256']
            });
            return decoded;
        }
        catch (error) {
            console.error('Error verifying license key:', error);
            return null;
        }
    }
    registerAllSsoRoutes(app) {
        AzureSSO_1.default.registerRoutes(app, this.ssoProviders);
        GoogleSSO_1.default.registerRoutes(app, this.ssoProviders);
        Auth0SSO_1.default.registerRoutes(app, this.ssoProviders);
        GithubSSO_1.default.registerRoutes(app, this.ssoProviders);
    }
    initializeEmptySSO(app) {
        allSSOProviders.map((providerName) => {
            if (!this.ssoProviders.has(providerName)) {
                this.initializeSsoProvider(app, providerName, undefined);
            }
        });
    }
    initializeSsoProvider(app, providerName, providerConfig, organizationId, organizationSlug) {
        const key = (0, ssoRouteRegistry_1.ssoProviderKey)(providerName, organizationId);
        if (this.ssoProviders.has(key)) {
            const provider = this.ssoProviders.get(key);
            if (provider) {
                if (providerConfig && providerConfig.configEnabled === true) {
                    provider.setSSOConfig(providerConfig);
                    provider.initialize();
                }
                else {
                    // if false, disable the provider
                    provider.setSSOConfig(undefined);
                }
            }
        }
        else {
            switch (providerName) {
                case 'azure': {
                    const azureSSO = new AzureSSO_1.default(app, organizationId, providerConfig, organizationSlug);
                    azureSSO.initialize();
                    this.ssoProviders.set(key, azureSSO);
                    break;
                }
                case 'google': {
                    const googleSSO = new GoogleSSO_1.default(app, organizationId, providerConfig, organizationSlug);
                    googleSSO.initialize();
                    this.ssoProviders.set(key, googleSSO);
                    break;
                }
                case 'auth0': {
                    const auth0SSO = new Auth0SSO_1.default(app, organizationId, providerConfig, organizationSlug);
                    auth0SSO.initialize();
                    this.ssoProviders.set(key, auth0SSO);
                    break;
                }
                case 'github': {
                    const githubSSO = new GithubSSO_1.default(app, organizationId, providerConfig, organizationSlug);
                    githubSSO.initialize();
                    this.ssoProviders.set(key, githubSSO);
                    break;
                }
                default:
                    throw new Error(`SSO Provider ${providerName} not found`);
            }
        }
    }
    async getRefreshToken(providerName, ssoRefreshToken, organizationId) {
        const key = (0, ssoRouteRegistry_1.ssoProviderKey)(providerName, organizationId);
        if (!this.ssoProviders.has(key)) {
            throw new Error(`SSO Provider ${providerName} not found`);
        }
        return await this.ssoProviders.get(key).refreshToken(ssoRefreshToken);
    }
    async getProductIdFromSubscription(subscriptionId) {
        if (!subscriptionId)
            return '';
        if (!this.stripeManager) {
            throw new Error('Stripe manager is not initialized');
        }
        return await this.stripeManager.getProductIdFromSubscription(subscriptionId);
    }
    async getFeaturesByPlan(subscriptionId, withoutCache = false) {
        if (this.isEnterprise()) {
            const features = {};
            for (const feature of quotaUsage_1.ENTERPRISE_FEATURE_FLAGS) {
                features[feature] = 'true';
            }
            return features;
        }
        else if (this.isCloud()) {
            if (!this.stripeManager || !subscriptionId) {
                return {};
            }
            return await this.stripeManager.getFeaturesByPlan(subscriptionId, withoutCache);
        }
        return {};
    }
    static checkFeatureByPlan(feature) {
        return (req, res, next) => {
            const user = req.user;
            if (user) {
                if (!user.features || Object.keys(user.features).length === 0) {
                    return res.status(403).json({ message: Interface_Enterprise_1.ErrorMessage.FORBIDDEN });
                }
                if (Object.keys(user.features).includes(feature) && user.features[feature] === 'true') {
                    return next();
                }
            }
            return res.status(403).json({ message: Interface_Enterprise_1.ErrorMessage.FORBIDDEN });
        };
    }
    async createStripeCustomerPortalSession(req) {
        if (!this.stripeManager) {
            throw new Error('Stripe manager is not initialized');
        }
        return await this.stripeManager.createStripeCustomerPortalSession(req);
    }
    async getAdditionalSeatsQuantity(subscriptionId) {
        if (!subscriptionId)
            return {};
        if (!this.stripeManager) {
            throw new Error('Stripe manager is not initialized');
        }
        return await this.stripeManager.getAdditionalSeatsQuantity(subscriptionId);
    }
    async getCustomerWithDefaultSource(customerId) {
        if (!customerId)
            return;
        if (!this.stripeManager) {
            throw new Error('Stripe manager is not initialized');
        }
        return await this.stripeManager.getCustomerWithDefaultSource(customerId);
    }
    async updateStripeCustomerEmail(customerId, email) {
        if (!this.stripeManager)
            throw new Error('Stripe manager is not initialized');
        await this.stripeManager.updateCustomerEmail(customerId, email);
    }
    async getAdditionalSeatsProration(subscriptionId, newQuantity) {
        if (!subscriptionId)
            return {};
        if (!this.stripeManager) {
            throw new Error('Stripe manager is not initialized');
        }
        return await this.stripeManager.getAdditionalSeatsProration(subscriptionId, newQuantity);
    }
    async updateAdditionalSeats(subscriptionId, quantity, prorationDate) {
        if (!subscriptionId)
            return {};
        if (!this.stripeManager) {
            throw new Error('Stripe manager is not initialized');
        }
        const { success, subscription, invoice } = await this.stripeManager.updateAdditionalSeats(subscriptionId, quantity, prorationDate);
        // Fetch product details to get quotas
        const items = subscription.items.data;
        if (items.length === 0) {
            throw new Error('No subscription items found');
        }
        const productId = items[0].price.product;
        const product = await this.stripeManager.getStripe().products.retrieve(productId);
        const productMetadata = product.metadata;
        // Extract quotas from metadata
        const quotas = {};
        for (const key in productMetadata) {
            if (key.startsWith('quota:')) {
                quotas[key] = parseInt(productMetadata[key]);
            }
        }
        quotas[constants_1.LICENSE_QUOTAS.ADDITIONAL_SEATS_LIMIT] = quantity;
        // Get features from Stripe
        const features = await this.getFeaturesByPlan(subscription.id, true);
        // Update the cache with new subscription data including quotas
        const cacheManager = await UsageCacheManager_1.UsageCacheManager.getInstance();
        await cacheManager.updateSubscriptionDataToCache(subscriptionId, {
            features,
            quotas,
            subsriptionDetails: this.stripeManager.getSubscriptionObject(subscription)
        });
        return { success, subscription, invoice };
    }
    async getPlanProration(subscriptionId, newPlanId) {
        if (!subscriptionId || !newPlanId)
            return {};
        if (!this.stripeManager) {
            throw new Error('Stripe manager is not initialized');
        }
        return await this.stripeManager.getPlanProration(subscriptionId, newPlanId);
    }
    async updateSubscriptionPlan(req, subscriptionId, newPlanId, prorationDate) {
        if (!subscriptionId || !newPlanId)
            return {};
        if (!this.stripeManager) {
            throw new Error('Stripe manager is not initialized');
        }
        if (!req.user) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Unauthorized" /* GeneralErrorMessage.UNAUTHORIZED */);
        }
        const { success, subscription } = await this.stripeManager.updateSubscriptionPlan(subscriptionId, newPlanId, prorationDate);
        if (success) {
            // Fetch product details to get quotas
            const product = await this.stripeManager.getStripe().products.retrieve(newPlanId);
            const productMetadata = product.metadata;
            // Extract quotas from metadata
            const quotas = {};
            for (const key in productMetadata) {
                if (key.startsWith('quota:')) {
                    quotas[key] = parseInt(productMetadata[key]);
                }
            }
            const additionalSeatsItem = subscription.items.data.find((item) => item.price.product === process.env.ADDITIONAL_SEAT_ID);
            quotas[constants_1.LICENSE_QUOTAS.ADDITIONAL_SEATS_LIMIT] = additionalSeatsItem?.quantity || 0;
            // Get features from Stripe
            const features = await this.getFeaturesByPlan(subscription.id, true);
            // Update the cache with new subscription data including quotas
            const cacheManager = await UsageCacheManager_1.UsageCacheManager.getInstance();
            const updateCacheData = {
                features,
                quotas,
                subsriptionDetails: this.stripeManager.getSubscriptionObject(subscription)
            };
            if (newPlanId === process.env.CLOUD_FREE_ID ||
                newPlanId === process.env.CLOUD_STARTER_ID ||
                newPlanId === process.env.CLOUD_PRO_ID) {
                updateCacheData.productId = newPlanId;
            }
            await cacheManager.updateSubscriptionDataToCache(subscriptionId, updateCacheData);
            const loggedInUser = {
                ...req.user,
                activeOrganizationSubscriptionId: subscription.id,
                features
            };
            if (newPlanId === process.env.CLOUD_FREE_ID ||
                newPlanId === process.env.CLOUD_STARTER_ID ||
                newPlanId === process.env.CLOUD_PRO_ID) {
                loggedInUser.activeOrganizationProductId = newPlanId;
            }
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
            return {
                status: 'success',
                user: loggedInUser
            };
        }
        return {
            status: 'error',
            message: 'Payment or subscription update not completed'
        };
    }
    async createStripeUserAndSubscribe({ email, userPlan, referral }) {
        if (!this.stripeManager) {
            throw new Error('Stripe manager is not initialized');
        }
        try {
            // Create a customer in Stripe
            let customer;
            if (referral) {
                customer = await this.stripeManager.getStripe().customers.create({
                    email: email,
                    metadata: {
                        referral
                    }
                });
            }
            else {
                customer = await this.stripeManager.getStripe().customers.create({
                    email: email
                });
            }
            let productId = '';
            switch (userPlan) {
                case Interface_1.UserPlan.STARTER:
                    productId = process.env.CLOUD_STARTER_ID;
                    break;
                case Interface_1.UserPlan.PRO:
                    productId = process.env.CLOUD_PRO_ID;
                    break;
                case Interface_1.UserPlan.FREE:
                    productId = process.env.CLOUD_FREE_ID;
                    break;
            }
            // Get the default price ID for the product
            const prices = await this.stripeManager.getStripe().prices.list({
                product: productId,
                active: true,
                limit: 1
            });
            if (!prices.data.length) {
                throw new Error('No active price found for the product');
            }
            // Create the subscription
            const subscription = await this.stripeManager.getStripe().subscriptions.create({
                customer: customer.id,
                items: [{ price: prices.data[0].id }]
            });
            return {
                customerId: customer.id,
                subscriptionId: subscription.id
            };
        }
        catch (error) {
            console.error('Error creating Stripe user and subscription:', error);
            throw error;
        }
    }
    /**
     * Cancels a Stripe subscription and syncs the result to the usage cache.
     *
     * Requests cancellation via Stripe, then updates the subscription data in cache
     * so usage and billing state stay consistent. Throws if the Stripe manager
     * is not initialized.
     *
     * @param subscriptionId - The Stripe subscription ID to cancel
     * @returns The cancelled Stripe subscription object
     */
    async cancelSubscription(subscriptionId) {
        if (!this.stripeManager)
            throw new Error('Stripe manager is not initialized');
        const subscription = await this.stripeManager.cancelSubscription(subscriptionId);
        const cacheManager = await UsageCacheManager_1.UsageCacheManager.getInstance();
        await cacheManager.updateSubscriptionDataToCache(subscriptionId, {
            subsriptionDetails: this.stripeManager.getSubscriptionObject(subscription)
        });
        return subscription;
    }
}
exports.IdentityManager = IdentityManager;
//# sourceMappingURL=IdentityManager.js.map