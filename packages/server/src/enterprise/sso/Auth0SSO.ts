// Auth0SSO.ts
import express from 'express'
import SSOBase from './SSOBase'
import passport from 'passport'
import { Profile, Strategy as Auth0Strategy } from 'passport-auth0'
import { Request } from 'express'
import auditService from '../services/audit'
import { ErrorMessage, LoginActivityCode } from '../Interface.Enterprise'
import axios from 'axios'
import { orgScopedPath, registerSsoRoutes } from './ssoRouteRegistry'

const PROVIDER_NAME_AUTH0_SSO = 'Auth0 SSO'

function validateAuth0Domain(domain: string): string | null {
    if (!domain || typeof domain !== 'string') {
        return null
    }

    const trimmed = domain.trim()

    // Reject characters that could introduce scheme, port, path, or query
    if (/[/\\?#:]/.test(trimmed)) {
        return null
    }

    // Basic hostname validation
    const hostnameRegex = /^(?=.{1,253}$)([a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,63}$/
    if (!hostnameRegex.test(trimmed)) {
        return null
    }

    // Restrict to Auth0 domains
    if (!trimmed.toLowerCase().endsWith('.auth0.com')) {
        return null
    }

    return trimmed
}

class Auth0SSO extends SSOBase {
    static LOGIN_URI = '/api/v1/auth0/login'
    static CALLBACK_URI = '/api/v1/auth0/callback'
    static LOGOUT_URI = '/api/v1/auth0/logout'

    getProviderName(): string {
        return PROVIDER_NAME_AUTH0_SSO
    }

    getStrategyKey(): string {
        return 'auth0'
    }

    static getCallbackURL(organizationSlug?: string): string {
        const APP_URL = process.env.APP_URL || 'http://127.0.0.1:' + process.env.PORT
        return APP_URL + orgScopedPath(Auth0SSO.CALLBACK_URI, 'auth0', organizationSlug)
    }

    static registerRoutes(app: express.Application, providers: Map<string, SSOBase>) {
        registerSsoRoutes(app, 'auth0', Auth0SSO.LOGIN_URI, Auth0SSO.CALLBACK_URI, providers, 'Auth0 SSO', {
            scope: 'openid profile email'
        })
    }

    setSSOConfig(ssoConfig: any) {
        super.setSSOConfig(ssoConfig)
        if (ssoConfig) {
            const { domain, clientID, clientSecret } = this.ssoConfig

            passport.use(
                this.getStrategyName(),
                new Auth0Strategy(
                    {
                        domain: domain || 'your_auth0_domain',
                        clientID: clientID || 'your_auth0_client_id',
                        clientSecret: clientSecret || 'your_auth0_client_secret',
                        callbackURL: Auth0SSO.getCallbackURL(this.organizationSlug) || 'http://localhost:3000/auth/auth0/callback',
                        passReqToCallback: true
                    },
                    async (
                        req: Request,
                        accessToken: string,
                        refreshToken: string,
                        extraParams: any,
                        profile: Profile,
                        done: (error: any, user?: any) => void
                    ) => {
                        const email = profile.emails?.[0]?.value
                        if (!email) {
                            await auditService.recordLoginActivity(
                                '<empty>',
                                LoginActivityCode.UNKNOWN_USER,
                                ErrorMessage.UNKNOWN_USER,
                                PROVIDER_NAME_AUTH0_SSO
                            )
                            return done({ name: 'SSO_LOGIN_FAILED', message: ErrorMessage.UNKNOWN_USER }, undefined)
                        }
                        return await this.verifyAndLogin(this.app, email, done, profile, accessToken, refreshToken)
                    }
                )
            )
        } else {
            passport.unuse(this.getStrategyName())
        }
    }

    initialize() {
        this.setSSOConfig(this.ssoConfig)
    }

    static async testSetup(ssoConfig: any) {
        const { domain, clientID, clientSecret } = ssoConfig

        const validatedDomain = validateAuth0Domain(domain)
        if (!validatedDomain) {
            const errorMessage = 'Auth0 Configuration test failed. Invalid Auth0 domain.'
            return { error: errorMessage }
        }

        try {
            const tokenResponse = await axios.post(
                `https://${validatedDomain}/oauth/token`,
                {
                    client_id: clientID,
                    client_secret: clientSecret,
                    audience: `https://${validatedDomain}/api/v2/`,
                    grant_type: 'client_credentials'
                },
                {
                    headers: { 'Content-Type': 'application/json' }
                }
            )
            return { message: tokenResponse.status }
        } catch (error) {
            const errorMessage = 'Auth0 Configuration test failed. Please check your credentials and domain.'
            return { error: errorMessage }
        }
    }

    async refreshToken(ssoRefreshToken: string) {
        const { domain, clientID, clientSecret } = this.ssoConfig

        const validatedDomain = validateAuth0Domain(domain)
        if (!validatedDomain) {
            const errorMessage = 'Auth0 Configuration test failed. Invalid Auth0 domain.'
            return { error: errorMessage }
        }

        try {
            const response = await axios.post(
                `https://${validatedDomain}/oauth/token`,
                {
                    client_id: clientID,
                    client_secret: clientSecret,
                    grant_type: 'refresh_token',
                    refresh_token: ssoRefreshToken
                },
                {
                    headers: { 'Content-Type': 'application/json' }
                }
            )
            return { ...response.data }
        } catch (error) {
            const errorMessage = 'Failed to get refreshToken from Auth0.'
            return { error: errorMessage }
        }
    }
}

export default Auth0SSO
