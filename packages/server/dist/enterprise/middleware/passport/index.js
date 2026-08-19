"use strict";
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
exports.verifyTokenForBullMQDashboard = exports.verifyToken = exports.generateJwtRefreshToken = exports.generateJwtAuthToken = exports.setTokenOrCookies = exports.initializeJwtCookieMiddleware = void 0;
const axios_1 = require("axios");
const express_session_1 = __importDefault(require("express-session"));
const http_status_codes_1 = require("http-status-codes");
const jsonwebtoken_1 = __importStar(require("jsonwebtoken"));
const passport_1 = __importDefault(require("passport"));
const uuid_1 = require("uuid");
const internalAccelanceError_1 = require("../../../errors/internalAccelanceError");
const Interface_1 = require("../../../Interface");
const getRunningExpressApp_1 = require("../../../utils/getRunningExpressApp");
const organization_user_entity_1 = require("../../database/entities/organization-user.entity");
const role_entity_1 = require("../../database/entities/role.entity");
const workspace_user_entity_1 = require("../../database/entities/workspace-user.entity");
const Interface_Enterprise_1 = require("../../Interface.Enterprise");
const account_service_1 = require("../../services/account.service");
const organization_user_service_1 = require("../../services/organization-user.service");
const organization_service_1 = require("../../services/organization.service");
const role_service_1 = require("../../services/role.service");
const workspace_user_service_1 = require("../../services/workspace-user.service");
const authSecrets_1 = require("../../utils/authSecrets");
const tempTokenUtils_1 = require("../../utils/tempTokenUtils");
const AuthStrategy_1 = require("./AuthStrategy");
const SessionPersistance_1 = require("./SessionPersistance");
const localStrategy = require('passport-local').Strategy;
const expireAuthTokensOnRestart = process.env.EXPIRE_AUTH_TOKENS_ON_RESTART === 'true';
const DEFAULT_AUTH_TOKEN_EXPIRY_IN_MINUTES = 60;
const DEFAULT_REFRESH_TOKEN_EXPIRY_IN_MINUTES = 7 * 24 * 60; // 7 days
const MILLISECONDS_PER_MINUTE = 60 * 1000;
// The session cookie must live at least as long as the refresh token, otherwise the session
// (and the req.user it carries) dies first and every refresh attempt fails with "Unauthorized"
// well before the refresh token itself actually expires.
const configuredRefreshTokenExpiryInMinutes = Number.parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRY_IN_MINUTES ?? '', 10);
const sessionCookieMaxAgeInMinutes = Number.isFinite(configuredRefreshTokenExpiryInMinutes)
    ? configuredRefreshTokenExpiryInMinutes
    : DEFAULT_REFRESH_TOKEN_EXPIRY_IN_MINUTES;
// Allow explicit override of cookie security settings
// This is useful when running behind a reverse proxy/load balancer that terminates SSL
// In production, always enforce secure cookies to prevent clear-text transmission of session data.
const secureCookie = process.env.NODE_ENV === 'production'
    ? true
    : process.env.SECURE_COOKIES === 'false'
        ? false
        : process.env.SECURE_COOKIES === 'true'
            ? true
            : process.env.APP_URL?.startsWith('https')
                ? true
                : false;
const _initializePassportMiddleware = async (app) => {
    // Configure session middleware
    let options = {
        secret: (0, authSecrets_1.getExpressSessionSecret)(),
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: secureCookie,
            httpOnly: true,
            sameSite: 'lax', // Add sameSite attribute
            maxAge: sessionCookieMaxAgeInMinutes * MILLISECONDS_PER_MINUTE
        },
        rolling: true
    };
    // if the auth tokens are not to be expired on restart, then configure the session store
    if (!expireAuthTokensOnRestart) {
        // configure session store based on the mode
        if (process.env.MODE === 'queue') {
            const redisStore = (0, SessionPersistance_1.initializeRedisClientAndStore)();
            options.store = redisStore;
        }
        else {
            // for the database store, choose store basis the DB configuration from .env
            const dbSessionStore = (0, SessionPersistance_1.initializeDBClientAndStore)();
            if (dbSessionStore) {
                options.store = dbSessionStore;
            }
        }
    }
    app.use((0, express_session_1.default)(options));
    app.use(passport_1.default.initialize());
    app.use(passport_1.default.session());
    if (options.store) {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        appServer.sessionStore = options.store;
    }
    passport_1.default.serializeUser((user, done) => {
        done(null, user);
    });
    passport_1.default.deserializeUser((user, done) => {
        done(null, user);
    });
};
const initializeJwtCookieMiddleware = async (app, identityManager) => {
    await _initializePassportMiddleware(app);
    const jwtOptions = {
        secretOrKey: (0, authSecrets_1.getJWTAuthTokenSecret)(),
        audience: (0, authSecrets_1.getJWTAudience)(),
        issuer: (0, authSecrets_1.getJWTIssuer)()
    };
    const strategy = (0, AuthStrategy_1.getAuthStrategy)(jwtOptions);
    passport_1.default.use(strategy);
    passport_1.default.use('login', new localStrategy({
        usernameField: 'email',
        passwordField: 'password',
        session: true
    }, async (email, password, done) => {
        let queryRunner;
        try {
            queryRunner = (0, getRunningExpressApp_1.getRunningExpressApp)().AppDataSource.createQueryRunner();
            await queryRunner.connect();
            const accountService = new account_service_1.AccountService();
            const body = {
                user: {
                    email: email,
                    credential: password
                }
            };
            const response = await accountService.login(body);
            const workspaceUser = Array.isArray(response.workspaceDetails) && response.workspaceDetails.length > 0
                ? response.workspaceDetails[0]
                : response.workspaceDetails;
            const workspaceUserService = new workspace_user_service_1.WorkspaceUserService();
            workspaceUser.status = workspace_user_entity_1.WorkspaceUserStatus.ACTIVE;
            workspaceUser.lastLogin = new Date().toISOString();
            workspaceUser.updatedBy = workspaceUser.userId;
            const organizationUserService = new organization_user_service_1.OrganizationUserService();
            const { organizationUser } = await organizationUserService.readOrganizationUserByWorkspaceIdUserId(workspaceUser.workspaceId, workspaceUser.userId, queryRunner);
            if (!organizationUser)
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Organization User Not Found" /* OrganizationUserErrorMessage.ORGANIZATION_USER_NOT_FOUND */);
            organizationUser.status = organization_user_entity_1.OrganizationUserStatus.ACTIVE;
            await workspaceUserService.updateWorkspaceUser(workspaceUser, queryRunner);
            await organizationUserService.updateOrganizationUser(organizationUser);
            const workspaceUsers = await workspaceUserService.readWorkspaceUserByUserId(organizationUser.userId, queryRunner);
            const assignedWorkspaces = workspaceUsers.map((workspaceUser) => {
                return {
                    id: workspaceUser.workspace.id,
                    name: workspaceUser.workspace.name,
                    role: workspaceUser.role?.name,
                    organizationId: workspaceUser.workspace.organizationId
                };
            });
            let roleService = new role_service_1.RoleService();
            const ownerRole = await roleService.readGeneralRoleByName(role_entity_1.GeneralRole.OWNER, queryRunner);
            const role = await roleService.readRoleById(workspaceUser.roleId, queryRunner);
            if (!role)
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Role Not Found" /* RoleErrorMessage.ROLE_NOT_FOUND */);
            const orgService = new organization_service_1.OrganizationService();
            const organization = await orgService.readOrganizationById(organizationUser.organizationId, queryRunner);
            if (!organization) {
                return done('Organization not found');
            }
            const subscriptionId = organization.subscriptionId;
            const customerId = organization.customerId;
            const features = await identityManager.getFeaturesByPlan(subscriptionId);
            const productId = await identityManager.getProductIdFromSubscription(subscriptionId);
            const loggedInUser = {
                id: workspaceUser.userId,
                email: response.user.email,
                name: response.user.name ?? response.user.email,
                roleId: workspaceUser.roleId,
                activeOrganizationId: organization.id,
                activeOrganizationSubscriptionId: subscriptionId,
                activeOrganizationCustomerId: customerId,
                activeOrganizationProductId: productId,
                isOrganizationAdmin: workspaceUser.roleId === ownerRole.id,
                activeWorkspaceId: workspaceUser.workspaceId,
                activeWorkspace: workspaceUser.workspace.name,
                assignedWorkspaces,
                permissions: [...JSON.parse(role.permissions)],
                features
            };
            return done(null, loggedInUser, { message: 'Logged in Successfully' });
        }
        catch (error) {
            return done(error);
        }
        finally {
            if (queryRunner)
                await queryRunner.release();
        }
    }));
    app.post('/api/auth/resolve', async (req, res) => {
        // check for the organization, if empty redirect to the organization setup page for OpenSource and Enterprise Versions
        // for Cloud (Horizontal) version, redirect to the signin page
        const expressApp = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const platform = expressApp.identityManager.getPlatformType();
        if (platform === Interface_1.Platform.CLOUD) {
            return res.status(axios_1.HttpStatusCode.Ok).json({ redirectUrl: '/signin' });
        }
        const orgService = new organization_service_1.OrganizationService();
        const queryRunner = expressApp.AppDataSource.createQueryRunner();
        await queryRunner.connect();
        const registeredOrganizationCount = await orgService.countOrganizations(queryRunner);
        await queryRunner.release();
        if (registeredOrganizationCount === 0) {
            switch (platform) {
                case Interface_1.Platform.ENTERPRISE:
                    if (!identityManager.isLicenseValid()) {
                        return res.status(axios_1.HttpStatusCode.Ok).json({ redirectUrl: '/license-expired' });
                    }
                    return res.status(axios_1.HttpStatusCode.Ok).json({ redirectUrl: '/organization-setup' });
                default:
                    return res.status(axios_1.HttpStatusCode.Ok).json({ redirectUrl: '/organization-setup' });
            }
        }
        switch (platform) {
            case Interface_1.Platform.ENTERPRISE:
                if (!identityManager.isLicenseValid()) {
                    return res.status(axios_1.HttpStatusCode.Ok).json({ redirectUrl: '/license-expired' });
                }
                return res.status(axios_1.HttpStatusCode.Ok).json({ redirectUrl: '/signin' });
            default:
                return res.status(axios_1.HttpStatusCode.Ok).json({ redirectUrl: '/signin' });
        }
    });
    app.post('/api/auth/refreshToken', async (req, res) => {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken)
            return res.sendStatus(401);
        jsonwebtoken_1.default.verify(refreshToken, (0, authSecrets_1.getJWTRefreshTokenSecret)(), async (err, payload) => {
            if (err || !payload)
                return res.status(401).json({ message: Interface_Enterprise_1.ErrorMessage.REFRESH_TOKEN_EXPIRED });
            // @ts-ignore
            const loggedInUser = req.user;
            let isSSO = false;
            let newTokenResponse = {};
            if (loggedInUser && loggedInUser.ssoRefreshToken) {
                try {
                    newTokenResponse = await identityManager.getRefreshToken(loggedInUser.ssoProvider, loggedInUser.ssoRefreshToken, loggedInUser.activeOrganizationId);
                    if (newTokenResponse.error) {
                        return res.status(401).json({ message: Interface_Enterprise_1.ErrorMessage.REFRESH_TOKEN_EXPIRED });
                    }
                    isSSO = true;
                }
                catch (error) {
                    return res.status(401).json({ message: Interface_Enterprise_1.ErrorMessage.REFRESH_TOKEN_EXPIRED });
                }
            }
            const meta = (0, tempTokenUtils_1.decryptToken)(payload.meta);
            if (!meta) {
                return res.status(401).json({ message: Interface_Enterprise_1.ErrorMessage.REFRESH_TOKEN_EXPIRED });
            }
            if (isSSO) {
                loggedInUser.ssoToken = newTokenResponse.access_token;
                if (newTokenResponse.refresh_token) {
                    loggedInUser.ssoRefreshToken = newTokenResponse.refresh_token;
                }
                return (0, exports.setTokenOrCookies)(res, loggedInUser, false, req, false, true);
            }
            else {
                return (0, exports.setTokenOrCookies)(res, loggedInUser, false, req);
            }
        });
    });
    app.post('/api/auth/login', (req, res, next) => {
        passport_1.default.authenticate('login', async (err, user) => {
            try {
                if (err || !user) {
                    return next ? next(err) : res.status(401).json(err);
                }
                if (identityManager.isEnterprise() && !identityManager.isLicenseValid()) {
                    return res.status(401).json({ redirectUrl: '/license-expired' });
                }
                req.session.regenerate((regenerateErr) => {
                    if (regenerateErr) {
                        return next ? next(regenerateErr) : res.status(500).json({ message: 'Session regeneration failed' });
                    }
                    req.login(user, { session: true }, async (error) => {
                        if (error) {
                            return next ? next(error) : res.status(401).json(error);
                        }
                        return (0, exports.setTokenOrCookies)(res, user, true, req);
                    });
                });
            }
            catch (error) {
                return next ? next(error) : res.status(401).json(error);
            }
        })(req, res, next);
    });
};
exports.initializeJwtCookieMiddleware = initializeJwtCookieMiddleware;
const setTokenOrCookies = (res, user, regenerateRefreshToken, req, redirect, isSSO) => {
    const token = (0, exports.generateJwtAuthToken)(user);
    const authTokenMaxAge = getAuthTokenExpiryInMinutes(user) * MILLISECONDS_PER_MINUTE;
    const refreshTokenMaxAge = getRefreshTokenExpiryInMinutes(user) * MILLISECONDS_PER_MINUTE;
    let refreshToken = '';
    if (regenerateRefreshToken) {
        refreshToken = (0, exports.generateJwtRefreshToken)(user);
    }
    else {
        refreshToken = req?.cookies?.refreshToken;
    }
    const returnUser = (0, tempTokenUtils_1.generateSafeCopy)(user);
    returnUser.isSSO = !isSSO ? false : isSSO;
    if (redirect) {
        // 1. Generate a random token
        const ssoToken = (0, uuid_1.v4)();
        // 2. Store returnUser in your session store, keyed by ssoToken, with a short expiry
        storeSSOUserPayload(ssoToken, returnUser);
        // 3. Redirect with token only
        const dashboardUrl = `/sso-success?token=${ssoToken}`;
        // Return the token as a cookie in our response.
        let resWithCookies = res
            .cookie('token', token, {
            httpOnly: true,
            secure: secureCookie,
            sameSite: 'lax',
            maxAge: authTokenMaxAge
        })
            .cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: secureCookie,
            sameSite: 'lax',
            maxAge: refreshTokenMaxAge
        });
        resWithCookies.redirect(dashboardUrl);
    }
    else {
        // Return the token as a cookie in our response.
        res.cookie('token', token, {
            httpOnly: true,
            secure: secureCookie,
            sameSite: 'lax',
            maxAge: authTokenMaxAge
        })
            .cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: secureCookie,
            sameSite: 'lax',
            maxAge: refreshTokenMaxAge
        })
            .type('json')
            .send({ ...returnUser });
    }
};
exports.setTokenOrCookies = setTokenOrCookies;
const generateJwtAuthToken = (user) => {
    return _generateJwtToken(user, getAuthTokenExpiryInMinutes(user), (0, authSecrets_1.getJWTAuthTokenSecret)());
};
exports.generateJwtAuthToken = generateJwtAuthToken;
const generateJwtRefreshToken = (user) => {
    return _generateJwtToken(user, getRefreshTokenExpiryInMinutes(user), (0, authSecrets_1.getJWTRefreshTokenSecret)());
};
exports.generateJwtRefreshToken = generateJwtRefreshToken;
const getAuthTokenExpiryInMinutes = (user) => {
    const ssoTokenExpiry = getTokenExpiryMinutesFromJwt(user?.ssoToken, true);
    if (ssoTokenExpiry !== -1)
        return ssoTokenExpiry;
    const configuredExpiry = Number.parseInt(process.env.JWT_TOKEN_EXPIRY_IN_MINUTES ?? '', 10);
    return Number.isFinite(configuredExpiry) ? configuredExpiry : DEFAULT_AUTH_TOKEN_EXPIRY_IN_MINUTES;
};
const getRefreshTokenExpiryInMinutes = (user) => {
    const ssoRefreshTokenExpiry = getTokenExpiryMinutesFromJwt(user?.ssoRefreshToken);
    if (ssoRefreshTokenExpiry !== -1)
        return ssoRefreshTokenExpiry;
    const configuredExpiry = Number.parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRY_IN_MINUTES ?? '', 10);
    return Number.isFinite(configuredExpiry) ? configuredExpiry : DEFAULT_REFRESH_TOKEN_EXPIRY_IN_MINUTES;
};
const getTokenExpiryMinutesFromJwt = (token, includeHeaderPayload = false) => {
    if (!token)
        return -1;
    const decodedToken = jsonwebtoken_1.default.decode(token, { complete: includeHeaderPayload });
    const payload = includeHeaderPayload ? decodedToken?.payload : decodedToken;
    const utcSeconds = typeof payload === 'string' ? undefined : payload?.exp;
    if (!utcSeconds)
        return -1;
    const expirationDate = new Date(0);
    expirationDate.setUTCSeconds(utcSeconds);
    return Math.abs(expirationDate.getTime() - new Date().getTime()) / 60000;
};
const _generateJwtToken = (user, expiryInMinutes, secret) => {
    const encryptedUserInfo = (0, tempTokenUtils_1.encryptToken)(user?.id + ':' + user?.activeWorkspaceId);
    return (0, jsonwebtoken_1.sign)({ id: user?.id, username: user?.name, meta: encryptedUserInfo }, secret, {
        expiresIn: expiryInMinutes + 'm', // Expiry in minutes
        notBefore: '0', // Cannot use before now, can be configured to be deferred.
        algorithm: 'HS256', // HMAC using SHA-256 hash algorithm
        audience: (0, authSecrets_1.getJWTAudience)(),
        issuer: (0, authSecrets_1.getJWTIssuer)()
    });
};
const verifyToken = (req, res, next) => {
    passport_1.default.authenticate('jwt', { session: true }, (err, user, info) => {
        if (err) {
            return next(err);
        }
        // @ts-ignore
        if (info && info.name === 'TokenExpiredError') {
            if (req.cookies && req.cookies.refreshToken) {
                return res.status(401).json({ message: Interface_Enterprise_1.ErrorMessage.TOKEN_EXPIRED, retry: true });
            }
            return res.status(401).json({ message: Interface_Enterprise_1.ErrorMessage.INVALID_MISSING_TOKEN });
        }
        if (!user) {
            return res.status(401).json({ message: Interface_Enterprise_1.ErrorMessage.INVALID_MISSING_TOKEN });
        }
        const identityManager = (0, getRunningExpressApp_1.getRunningExpressApp)().identityManager;
        if (identityManager.isEnterprise() && !identityManager.isLicenseValid()) {
            return res.status(401).json({ redirectUrl: '/license-expired' });
        }
        req.user = user;
        next();
    })(req, res, next);
};
exports.verifyToken = verifyToken;
const verifyTokenForBullMQDashboard = (req, res, next) => {
    passport_1.default.authenticate('jwt', { session: true }, (err, user, info) => {
        if (err) {
            return next(err);
        }
        // @ts-ignore
        if (info && info.name === 'TokenExpiredError') {
            if (req.cookies && req.cookies.refreshToken) {
                return res.redirect('/signin?retry=true');
            }
            return res.redirect('/signin');
        }
        if (!user) {
            return res.redirect('/signin');
        }
        const identityManager = (0, getRunningExpressApp_1.getRunningExpressApp)().identityManager;
        if (identityManager.isEnterprise() && !identityManager.isLicenseValid()) {
            return res.redirect('/license-expired');
        }
        req.user = user;
        next();
    })(req, res, next);
};
exports.verifyTokenForBullMQDashboard = verifyTokenForBullMQDashboard;
const storeSSOUserPayload = (ssoToken, returnUser) => {
    const app = (0, getRunningExpressApp_1.getRunningExpressApp)();
    app.cachePool.addSSOTokenCache(ssoToken, returnUser);
};
//# sourceMappingURL=index.js.map