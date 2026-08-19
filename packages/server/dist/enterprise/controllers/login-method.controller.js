"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginMethodController = void 0;
const http_status_codes_1 = require("http-status-codes");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const Interface_1 = require("../../Interface");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const login_method_entity_1 = require("../database/entities/login-method.entity");
const login_method_service_1 = require("../services/login-method.service");
const organization_service_1 = require("../services/organization.service");
const Auth0SSO_1 = __importDefault(require("../sso/Auth0SSO"));
const AzureSSO_1 = __importDefault(require("../sso/AzureSSO"));
const GithubSSO_1 = __importDefault(require("../sso/GithubSSO"));
const GoogleSSO_1 = __importDefault(require("../sso/GoogleSSO"));
const encryption_util_1 = require("../utils/encryption.util");
const tenantRequestGuards_1 = require("../utils/tenantRequestGuards");
class LoginMethodController {
    constructor() {
        this.create = this.create.bind(this);
        this.read = this.read.bind(this);
        this.update = this.update.bind(this);
        this.defaultMethods = this.defaultMethods.bind(this);
        this.testConfig = this.testConfig.bind(this);
    }
    assertEnterprisePlatform() {
        const platformType = (0, getRunningExpressApp_1.getRunningExpressApp)().identityManager.getPlatformType();
        if (platformType === Interface_1.Platform.CLOUD || platformType === Interface_1.Platform.OPEN_SOURCE) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.FORBIDDEN, "Forbidden" /* GeneralErrorMessage.FORBIDDEN */);
        }
    }
    async getSafeConfig(encryptedConfig) {
        const { clientSecret: _, ...safe } = JSON.parse(await (0, encryption_util_1.decrypt)(encryptedConfig));
        return safe;
    }
    async create(req, res, next) {
        try {
            this.assertEnterprisePlatform();
            const user = (0, tenantRequestGuards_1.getLoggedInUser)(req);
            (0, tenantRequestGuards_1.assertQueryOrganizationMatchesActiveOrg)(user, req.body.organizationId);
            const loginMethodService = new login_method_service_1.LoginMethodService();
            const loginMethod = await loginMethodService.createLoginMethod(req.body);
            return res.status(http_status_codes_1.StatusCodes.CREATED).json(loginMethod);
        }
        catch (error) {
            next(error);
        }
    }
    async defaultMethods(req, res, next) {
        let queryRunner;
        try {
            queryRunner = (0, getRunningExpressApp_1.getRunningExpressApp)().AppDataSource.createQueryRunner();
            await queryRunner.connect();
            let organizationId;
            if ((0, getRunningExpressApp_1.getRunningExpressApp)().identityManager.getPlatformType() === Interface_1.Platform.CLOUD) {
                organizationId = undefined;
            }
            else if ((0, getRunningExpressApp_1.getRunningExpressApp)().identityManager.getPlatformType() === Interface_1.Platform.ENTERPRISE) {
                const organizationSlug = req.query.organizationSlug;
                const organizationService = new organization_service_1.OrganizationService();
                const organization = await organizationService.readOrganizationBySlug(organizationSlug, queryRunner);
                if (!organization) {
                    return res.status(http_status_codes_1.StatusCodes.OK).json({});
                }
                organizationId = organization.id;
            }
            else {
                return res.status(http_status_codes_1.StatusCodes.OK).json({});
            }
            const loginMethodService = new login_method_service_1.LoginMethodService();
            const providers = [];
            let loginMethod = await loginMethodService.readLoginMethodByOrganizationId(organizationId, queryRunner);
            if (loginMethod) {
                for (let method of loginMethod) {
                    if (method.status === login_method_entity_1.LoginMethodStatus.ENABLE)
                        providers.push(method.name);
                }
            }
            return res.status(http_status_codes_1.StatusCodes.OK).json({ providers: providers });
        }
        catch (error) {
            next(error);
        }
        finally {
            if (queryRunner)
                await queryRunner.release();
        }
    }
    async read(req, res, next) {
        let queryRunner;
        try {
            this.assertEnterprisePlatform();
            const user = (0, tenantRequestGuards_1.getLoggedInUser)(req);
            queryRunner = (0, getRunningExpressApp_1.getRunningExpressApp)().AppDataSource.createQueryRunner();
            await queryRunner.connect();
            const query = req.query;
            const loginMethodService = new login_method_service_1.LoginMethodService();
            const organizationService = new organization_service_1.OrganizationService();
            const activeOrganization = await organizationService.readOrganizationById(user.activeOrganizationId, queryRunner);
            const organizationSlug = activeOrganization?.slug;
            const loginMethodConfig = {
                organization: activeOrganization ? { name: activeOrganization.name, slug: activeOrganization.slug } : undefined,
                providers: [],
                callbacks: [
                    { providerName: 'azure', callbackURL: AzureSSO_1.default.getCallbackURL(organizationSlug) },
                    { providerName: 'google', callbackURL: GoogleSSO_1.default.getCallbackURL(organizationSlug) },
                    { providerName: 'auth0', callbackURL: Auth0SSO_1.default.getCallbackURL(organizationSlug) },
                    { providerName: 'github', callbackURL: GithubSSO_1.default.getCallbackURL(organizationSlug) }
                ]
            };
            let loginMethod;
            if (query.id) {
                loginMethod = await loginMethodService.readLoginMethodById(query.id, queryRunner);
                if (!loginMethod)
                    throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Login Method Not Found" /* LoginMethodErrorMessage.LOGIN_METHOD_NOT_FOUND */);
                if (loginMethod.organizationId !== user.activeOrganizationId) {
                    throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.FORBIDDEN, "Forbidden" /* GeneralErrorMessage.FORBIDDEN */);
                }
                loginMethod.config = await this.getSafeConfig(loginMethod.config);
            }
            else if (query.organizationId) {
                if (query.organizationId !== user.activeOrganizationId) {
                    throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.FORBIDDEN, "Forbidden" /* GeneralErrorMessage.FORBIDDEN */);
                }
                loginMethod = await loginMethodService.readLoginMethodByOrganizationId(query.organizationId, queryRunner);
                for (let method of loginMethod) {
                    method.config = await this.getSafeConfig(method.config);
                }
                loginMethodConfig.providers = loginMethod;
            }
            else {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Unhandled Edge Case" /* GeneralErrorMessage.UNHANDLED_EDGE_CASE */);
            }
            return res.status(http_status_codes_1.StatusCodes.OK).json(loginMethodConfig);
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
            this.assertEnterprisePlatform();
            const user = (0, tenantRequestGuards_1.getLoggedInUser)(req);
            (0, tenantRequestGuards_1.assertQueryOrganizationMatchesActiveOrg)(user, req.body.organizationId);
            const loginMethodService = new login_method_service_1.LoginMethodService();
            const loginMethod = await loginMethodService.createOrUpdateConfig(req.body);
            if (loginMethod?.status === 'OK' && loginMethod?.organizationId) {
                const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
                queryRunner = appServer.AppDataSource.createQueryRunner();
                await queryRunner.connect();
                const organization = await new organization_service_1.OrganizationService().readOrganizationById(loginMethod.organizationId, queryRunner);
                let providers = loginMethod.providers ?? [];
                for (const provider of providers) {
                    const identityManager = appServer.identityManager;
                    if (provider.config.clientID) {
                        provider.config.configEnabled = provider.status === login_method_entity_1.LoginMethodStatus.ENABLE;
                        identityManager.initializeSsoProvider(appServer.app, provider.providerName, provider.config, loginMethod.organizationId, organization?.slug);
                    }
                }
            }
            return res.status(http_status_codes_1.StatusCodes.OK).json(loginMethod);
        }
        catch (error) {
            next(error);
        }
        finally {
            if (queryRunner)
                await queryRunner.release();
        }
    }
    async testConfig(req, res, next) {
        let queryRunner;
        try {
            const providers = req.body.providers;
            const providerName = req.body.providerName;
            const organizationId = req.body.organizationId;
            let config = providers[0]?.config ?? {};
            if (organizationId) {
                queryRunner = (0, getRunningExpressApp_1.getRunningExpressApp)().AppDataSource.createQueryRunner();
                await queryRunner.connect();
                const loginMethodService = new login_method_service_1.LoginMethodService();
                config = await loginMethodService.getConfigWithSecrets(organizationId, providerName, config, queryRunner);
            }
            if (providerName === 'azure') {
                const response = await AzureSSO_1.default.testSetup(config);
                return res.json(response);
            }
            else if (providerName === 'google') {
                const response = await GoogleSSO_1.default.testSetup(config);
                return res.json(response);
            }
            else if (providerName === 'auth0') {
                const response = await Auth0SSO_1.default.testSetup(config);
                return res.json(response);
            }
            else if (providerName === 'github') {
                const response = await GithubSSO_1.default.testSetup(config);
                return res.json(response);
            }
            else {
                return res.json({ error: 'Provider not supported' });
            }
        }
        catch (error) {
            next(error);
        }
        finally {
            if (queryRunner)
                await queryRunner.release();
        }
    }
}
exports.LoginMethodController = LoginMethodController;
//# sourceMappingURL=login-method.controller.js.map