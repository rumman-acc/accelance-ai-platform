import { HttpStatusCode } from 'axios'
import { RedisStore } from 'connect-redis'
import express, { NextFunction, Request, Response } from 'express'
import session from 'express-session'
import { StatusCodes } from 'http-status-codes'
import jwt, { JwtPayload, sign } from 'jsonwebtoken'
import passport from 'passport'
import { VerifiedCallback } from 'passport-jwt'
import { v4 as uuidv4 } from 'uuid'
import { InternalAccelanceError } from '../../../errors/internalAccelanceError'
import { IdentityManager } from '../../../IdentityManager'
import { Platform } from '../../../Interface'
import { getRunningExpressApp } from '../../../utils/getRunningExpressApp'
import { OrganizationUserStatus } from '../../database/entities/organization-user.entity'
import { GeneralRole } from '../../database/entities/role.entity'
import { WorkspaceUser, WorkspaceUserStatus } from '../../database/entities/workspace-user.entity'
import { ErrorMessage, IAssignedWorkspace, LoggedInUser } from '../../Interface.Enterprise'
import { AccountService } from '../../services/account.service'
import { OrganizationUserErrorMessage, OrganizationUserService } from '../../services/organization-user.service'
import { OrganizationService } from '../../services/organization.service'
import { RoleErrorMessage, RoleService } from '../../services/role.service'
import { WorkspaceUserService } from '../../services/workspace-user.service'
import {
    getExpressSessionSecret,
    getJWTAudience,
    getJWTAuthTokenSecret,
    getJWTIssuer,
    getJWTRefreshTokenSecret
} from '../../utils/authSecrets'
import { decryptToken, encryptToken, generateSafeCopy } from '../../utils/tempTokenUtils'
import { getAuthStrategy } from './AuthStrategy'
import { initializeDBClientAndStore, initializeRedisClientAndStore } from './SessionPersistance'

const localStrategy = require('passport-local').Strategy

const expireAuthTokensOnRestart = process.env.EXPIRE_AUTH_TOKENS_ON_RESTART === 'true'
const DEFAULT_AUTH_TOKEN_EXPIRY_IN_MINUTES = 60
const DEFAULT_REFRESH_TOKEN_EXPIRY_IN_MINUTES = 7 * 24 * 60 // 7 days
const MILLISECONDS_PER_MINUTE = 60 * 1000

// The session cookie must live at least as long as the refresh token, otherwise the session
// (and the req.user it carries) dies first and every refresh attempt fails with "Unauthorized"
// well before the refresh token itself actually expires.
const configuredRefreshTokenExpiryInMinutes = Number.parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRY_IN_MINUTES ?? '', 10)
const sessionCookieMaxAgeInMinutes = Number.isFinite(configuredRefreshTokenExpiryInMinutes)
    ? configuredRefreshTokenExpiryInMinutes
    : DEFAULT_REFRESH_TOKEN_EXPIRY_IN_MINUTES

// Allow explicit override of cookie security settings
// This is useful when running behind a reverse proxy/load balancer that terminates SSL
// In production, always enforce secure cookies to prevent clear-text transmission of session data.
const secureCookie =
    process.env.NODE_ENV === 'production'
        ? true
        : process.env.SECURE_COOKIES === 'false'
        ? false
        : process.env.SECURE_COOKIES === 'true'
        ? true
        : process.env.APP_URL?.startsWith('https')
        ? true
        : false

const _initializePassportMiddleware = async (app: express.Application) => {
    // Configure session middleware
    let options: any = {
        secret: getExpressSessionSecret(),
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: secureCookie,
            httpOnly: true,
            sameSite: 'lax', // Add sameSite attribute
            maxAge: sessionCookieMaxAgeInMinutes * MILLISECONDS_PER_MINUTE
        },
        rolling: true
    }

    // if the auth tokens are not to be expired on restart, then configure the session store
    if (!expireAuthTokensOnRestart) {
        // configure session store based on the mode
        if (process.env.MODE === 'queue') {
            const redisStore = initializeRedisClientAndStore()
            options.store = redisStore as RedisStore
        } else {
            // for the database store, choose store basis the DB configuration from .env
            const dbSessionStore = initializeDBClientAndStore()
            if (dbSessionStore) {
                options.store = dbSessionStore
            }
        }
    }

    app.use(session(options))
    app.use(passport.initialize())
    app.use(passport.session())

    if (options.store) {
        const appServer = getRunningExpressApp()
        appServer.sessionStore = options.store
    }

    passport.serializeUser((user: any, done) => {
        done(null, user)
    })

    passport.deserializeUser((user: any, done) => {
        done(null, user)
    })
}

export const initializeJwtCookieMiddleware = async (app: express.Application, identityManager: IdentityManager) => {
    await _initializePassportMiddleware(app)

    const jwtOptions = {
        secretOrKey: getJWTAuthTokenSecret(),
        audience: getJWTAudience(),
        issuer: getJWTIssuer()
    }
    const strategy = getAuthStrategy(jwtOptions)
    passport.use(strategy)
    passport.use(
        'login',
        new localStrategy(
            {
                usernameField: 'email',
                passwordField: 'password',
                session: true
            },
            async (email: string, password: string, done: VerifiedCallback) => {
                let queryRunner
                try {
                    queryRunner = getRunningExpressApp().AppDataSource.createQueryRunner()
                    await queryRunner.connect()
                    const accountService = new AccountService()
                    const body: any = {
                        user: {
                            email: email,
                            credential: password
                        }
                    }
                    const response = await accountService.login(body)
                    const workspaceUser: WorkspaceUser =
                        Array.isArray(response.workspaceDetails) && response.workspaceDetails.length > 0
                            ? response.workspaceDetails[0]
                            : (response.workspaceDetails as WorkspaceUser)
                    const workspaceUserService = new WorkspaceUserService()
                    workspaceUser.status = WorkspaceUserStatus.ACTIVE
                    workspaceUser.lastLogin = new Date().toISOString()
                    workspaceUser.updatedBy = workspaceUser.userId
                    const organizationUserService = new OrganizationUserService()
                    const { organizationUser } = await organizationUserService.readOrganizationUserByWorkspaceIdUserId(
                        workspaceUser.workspaceId,
                        workspaceUser.userId,
                        queryRunner
                    )
                    if (!organizationUser)
                        throw new InternalAccelanceError(StatusCodes.NOT_FOUND, OrganizationUserErrorMessage.ORGANIZATION_USER_NOT_FOUND)
                    organizationUser.status = OrganizationUserStatus.ACTIVE
                    await workspaceUserService.updateWorkspaceUser(workspaceUser, queryRunner)
                    await organizationUserService.updateOrganizationUser(organizationUser)

                    const workspaceUsers = await workspaceUserService.readWorkspaceUserByUserId(organizationUser.userId, queryRunner)
                    const assignedWorkspaces: IAssignedWorkspace[] = workspaceUsers.map((workspaceUser) => {
                        return {
                            id: workspaceUser.workspace.id,
                            name: workspaceUser.workspace.name,
                            role: workspaceUser.role?.name,
                            organizationId: workspaceUser.workspace.organizationId
                        } as IAssignedWorkspace
                    })

                    let roleService = new RoleService()
                    const ownerRole = await roleService.readGeneralRoleByName(GeneralRole.OWNER, queryRunner)
                    const role = await roleService.readRoleById(workspaceUser.roleId, queryRunner)
                    if (!role) throw new InternalAccelanceError(StatusCodes.NOT_FOUND, RoleErrorMessage.ROLE_NOT_FOUND)

                    const orgService = new OrganizationService()
                    const organization = await orgService.readOrganizationById(organizationUser.organizationId, queryRunner)
                    if (!organization) {
                        return done('Organization not found')
                    }
                    const subscriptionId = organization.subscriptionId as string
                    const customerId = organization.customerId as string
                    const features = await identityManager.getFeaturesByPlan(subscriptionId)
                    const productId = await identityManager.getProductIdFromSubscription(subscriptionId)

                    const loggedInUser: LoggedInUser = {
                        id: workspaceUser.userId,
                        email: response.user.email!,
                        name: response.user.name ?? response.user.email!,
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
                    }
                    return done(null, loggedInUser, { message: 'Logged in Successfully' })
                } catch (error) {
                    return done(error)
                } finally {
                    if (queryRunner) await queryRunner.release()
                }
            }
        )
    )

    app.post('/api/auth/resolve', async (req, res) => {
        // check for the organization, if empty redirect to the organization setup page for OpenSource and Enterprise Versions
        // for Cloud (Horizontal) version, redirect to the signin page
        const expressApp = getRunningExpressApp()
        const platform = expressApp.identityManager.getPlatformType()
        if (platform === Platform.CLOUD) {
            return res.status(HttpStatusCode.Ok).json({ redirectUrl: '/signin' })
        }
        const orgService = new OrganizationService()
        const queryRunner = expressApp.AppDataSource.createQueryRunner()
        await queryRunner.connect()
        const registeredOrganizationCount = await orgService.countOrganizations(queryRunner)
        await queryRunner.release()
        if (registeredOrganizationCount === 0) {
            switch (platform) {
                case Platform.ENTERPRISE:
                    if (!identityManager.isLicenseValid()) {
                        return res.status(HttpStatusCode.Ok).json({ redirectUrl: '/license-expired' })
                    }
                    return res.status(HttpStatusCode.Ok).json({ redirectUrl: '/organization-setup' })
                default:
                    return res.status(HttpStatusCode.Ok).json({ redirectUrl: '/organization-setup' })
            }
        }
        switch (platform) {
            case Platform.ENTERPRISE:
                if (!identityManager.isLicenseValid()) {
                    return res.status(HttpStatusCode.Ok).json({ redirectUrl: '/license-expired' })
                }
                return res.status(HttpStatusCode.Ok).json({ redirectUrl: '/signin' })
            default:
                return res.status(HttpStatusCode.Ok).json({ redirectUrl: '/signin' })
        }
    })

    app.post('/api/auth/refreshToken', async (req, res) => {
        const refreshToken = req.cookies.refreshToken
        if (!refreshToken) return res.sendStatus(401)

        jwt.verify(refreshToken, getJWTRefreshTokenSecret(), async (err: any, payload: any) => {
            if (err || !payload) return res.status(401).json({ message: ErrorMessage.REFRESH_TOKEN_EXPIRED })
            // @ts-ignore
            const loggedInUser = req.user as LoggedInUser
            let isSSO = false
            let newTokenResponse: any = {}
            if (loggedInUser && loggedInUser.ssoRefreshToken) {
                try {
                    newTokenResponse = await identityManager.getRefreshToken(
                        loggedInUser.ssoProvider,
                        loggedInUser.ssoRefreshToken,
                        loggedInUser.activeOrganizationId
                    )
                    if (newTokenResponse.error) {
                        return res.status(401).json({ message: ErrorMessage.REFRESH_TOKEN_EXPIRED })
                    }
                    isSSO = true
                } catch (error) {
                    return res.status(401).json({ message: ErrorMessage.REFRESH_TOKEN_EXPIRED })
                }
            }
            const meta = decryptToken(payload.meta)
            if (!meta) {
                return res.status(401).json({ message: ErrorMessage.REFRESH_TOKEN_EXPIRED })
            }
            if (isSSO) {
                loggedInUser.ssoToken = newTokenResponse.access_token
                if (newTokenResponse.refresh_token) {
                    loggedInUser.ssoRefreshToken = newTokenResponse.refresh_token
                }
                return setTokenOrCookies(res, loggedInUser, false, req, false, true)
            } else {
                return setTokenOrCookies(res, loggedInUser, false, req)
            }
        })
    })

    app.post('/api/auth/login', (req, res, next?) => {
        passport.authenticate('login', async (err: any, user: LoggedInUser) => {
            try {
                if (err || !user) {
                    return next ? next(err) : res.status(401).json(err)
                }
                if (identityManager.isEnterprise() && !identityManager.isLicenseValid()) {
                    return res.status(401).json({ redirectUrl: '/license-expired' })
                }

                req.session.regenerate((regenerateErr) => {
                    if (regenerateErr) {
                        return next ? next(regenerateErr) : res.status(500).json({ message: 'Session regeneration failed' })
                    }

                    req.login(user, { session: true }, async (error) => {
                        if (error) {
                            return next ? next(error) : res.status(401).json(error)
                        }
                        return setTokenOrCookies(res, user, true, req)
                    })
                })
            } catch (error: any) {
                return next ? next(error) : res.status(401).json(error)
            }
        })(req, res, next)
    })
}

export const setTokenOrCookies = (
    res: Response,
    user: any,
    regenerateRefreshToken: boolean,
    req?: Request,
    redirect?: boolean,
    isSSO?: boolean
) => {
    const token = generateJwtAuthToken(user)
    const authTokenMaxAge = getAuthTokenExpiryInMinutes(user) * MILLISECONDS_PER_MINUTE
    const refreshTokenMaxAge = getRefreshTokenExpiryInMinutes(user) * MILLISECONDS_PER_MINUTE
    let refreshToken: string = ''
    if (regenerateRefreshToken) {
        refreshToken = generateJwtRefreshToken(user)
    } else {
        refreshToken = req?.cookies?.refreshToken
    }
    const returnUser = generateSafeCopy(user)
    returnUser.isSSO = !isSSO ? false : isSSO

    if (redirect) {
        // 1. Generate a random token
        const ssoToken = uuidv4()

        // 2. Store returnUser in your session store, keyed by ssoToken, with a short expiry
        storeSSOUserPayload(ssoToken, returnUser)
        // 3. Redirect with token only
        const dashboardUrl = `/sso-success?token=${ssoToken}`

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
            })
        resWithCookies.redirect(dashboardUrl)
    } else {
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
            .send({ ...returnUser })
    }
}

export const generateJwtAuthToken = (user: any) => {
    return _generateJwtToken(user, getAuthTokenExpiryInMinutes(user), getJWTAuthTokenSecret())
}

export const generateJwtRefreshToken = (user: any) => {
    return _generateJwtToken(user, getRefreshTokenExpiryInMinutes(user), getJWTRefreshTokenSecret())
}

const getAuthTokenExpiryInMinutes = (user: any) => {
    const ssoTokenExpiry = getTokenExpiryMinutesFromJwt(user?.ssoToken, true)
    if (ssoTokenExpiry !== -1) return ssoTokenExpiry

    const configuredExpiry = Number.parseInt(process.env.JWT_TOKEN_EXPIRY_IN_MINUTES ?? '', 10)
    return Number.isFinite(configuredExpiry) ? configuredExpiry : DEFAULT_AUTH_TOKEN_EXPIRY_IN_MINUTES
}

const getRefreshTokenExpiryInMinutes = (user: any) => {
    const ssoRefreshTokenExpiry = getTokenExpiryMinutesFromJwt(user?.ssoRefreshToken)
    if (ssoRefreshTokenExpiry !== -1) return ssoRefreshTokenExpiry

    const configuredExpiry = Number.parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRY_IN_MINUTES ?? '', 10)
    return Number.isFinite(configuredExpiry) ? configuredExpiry : DEFAULT_REFRESH_TOKEN_EXPIRY_IN_MINUTES
}

const getTokenExpiryMinutesFromJwt = (token?: string, includeHeaderPayload = false) => {
    if (!token) return -1

    const decodedToken = jwt.decode(token, { complete: includeHeaderPayload })
    const payload = includeHeaderPayload ? (decodedToken as any)?.payload : decodedToken
    const utcSeconds = typeof payload === 'string' ? undefined : (payload as JwtPayload | undefined)?.exp

    if (!utcSeconds) return -1

    const expirationDate = new Date(0)
    expirationDate.setUTCSeconds(utcSeconds)
    return Math.abs(expirationDate.getTime() - new Date().getTime()) / 60000
}

const _generateJwtToken = (user: Partial<LoggedInUser>, expiryInMinutes: number, secret: string) => {
    const encryptedUserInfo = encryptToken(user?.id + ':' + user?.activeWorkspaceId)
    return sign({ id: user?.id, username: user?.name, meta: encryptedUserInfo }, secret, {
        expiresIn: expiryInMinutes + 'm', // Expiry in minutes
        notBefore: '0', // Cannot use before now, can be configured to be deferred.
        algorithm: 'HS256', // HMAC using SHA-256 hash algorithm
        audience: getJWTAudience(),
        issuer: getJWTIssuer()
    })
}

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('jwt', { session: true }, (err: any, user: LoggedInUser, info: object) => {
        if (err) {
            return next(err)
        }

        // @ts-ignore
        if (info && info.name === 'TokenExpiredError') {
            if (req.cookies && req.cookies.refreshToken) {
                return res.status(401).json({ message: ErrorMessage.TOKEN_EXPIRED, retry: true })
            }
            return res.status(401).json({ message: ErrorMessage.INVALID_MISSING_TOKEN })
        }

        if (!user) {
            return res.status(401).json({ message: ErrorMessage.INVALID_MISSING_TOKEN })
        }

        const identityManager = getRunningExpressApp().identityManager
        if (identityManager.isEnterprise() && !identityManager.isLicenseValid()) {
            return res.status(401).json({ redirectUrl: '/license-expired' })
        }

        req.user = user
        next()
    })(req, res, next)
}

export const verifyTokenForBullMQDashboard = (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('jwt', { session: true }, (err: any, user: LoggedInUser, info: object) => {
        if (err) {
            return next(err)
        }

        // @ts-ignore
        if (info && info.name === 'TokenExpiredError') {
            if (req.cookies && req.cookies.refreshToken) {
                return res.redirect('/signin?retry=true')
            }
            return res.redirect('/signin')
        }

        if (!user) {
            return res.redirect('/signin')
        }

        const identityManager = getRunningExpressApp().identityManager
        if (identityManager.isEnterprise() && !identityManager.isLicenseValid()) {
            return res.redirect('/license-expired')
        }

        req.user = user
        next()
    })(req, res, next)
}

const storeSSOUserPayload = (ssoToken: string, returnUser: any) => {
    const app = getRunningExpressApp()
    app.cachePool.addSSOTokenCache(ssoToken, returnUser)
}
