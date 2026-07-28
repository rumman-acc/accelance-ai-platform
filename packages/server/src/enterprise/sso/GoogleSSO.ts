// GoogleSSO.ts
import express from 'express'
import SSOBase from './SSOBase'
import passport from 'passport'
import { Profile, Strategy as OpenIDConnectStrategy, VerifyCallback } from 'passport-openidconnect'
import auditService from '../services/audit'
import { ErrorMessage, LoginActivityCode } from '../Interface.Enterprise'
import axios from 'axios'
import { orgScopedPath, registerSsoRoutes } from './ssoRouteRegistry'

class GoogleSSO extends SSOBase {
    static LOGIN_URI = '/api/v1/google/login'
    static CALLBACK_URI = '/api/v1/google/callback'
    static LOGOUT_URI = '/api/v1/google/logout'

    getProviderName(): string {
        return 'Google SSO'
    }

    getStrategyKey(): string {
        return 'google'
    }

    static getCallbackURL(organizationSlug?: string): string {
        const APP_URL = process.env.APP_URL || 'http://127.0.0.1:' + process.env.PORT
        return APP_URL + orgScopedPath(GoogleSSO.CALLBACK_URI, 'google', organizationSlug)
    }

    static registerRoutes(app: express.Application, providers: Map<string, SSOBase>) {
        registerSsoRoutes(app, 'google', GoogleSSO.LOGIN_URI, GoogleSSO.CALLBACK_URI, providers, 'Google SSO')
    }

    setSSOConfig(ssoConfig: any) {
        super.setSSOConfig(ssoConfig)
        if (this.ssoConfig) {
            const clientID = this.ssoConfig.clientID
            const clientSecret = this.ssoConfig.clientSecret

            passport.use(
                this.getStrategyName(),
                new OpenIDConnectStrategy(
                    {
                        issuer: 'https://accounts.google.com',
                        authorizationURL: 'https://accounts.google.com/o/oauth2/v2/auth',
                        tokenURL: 'https://oauth2.googleapis.com/token',
                        userInfoURL: 'https://openidconnect.googleapis.com/v1/userinfo',
                        clientID: clientID || 'your_google_client_id',
                        clientSecret: clientSecret || 'your_google_client_secret',
                        callbackURL: GoogleSSO.getCallbackURL(this.organizationSlug) || 'http://localhost:3000/auth/google/callback',
                        scope: 'openid profile email'
                    },
                    async (
                        issuer: string,
                        profile: Profile,
                        context: object,
                        idToken: string | object,
                        accessToken: string | object,
                        refreshToken: string,
                        done: VerifyCallback
                    ) => {
                        if (profile.emails && profile.emails.length > 0) {
                            const email = profile.emails[0].value
                            return this.verifyAndLogin(this.app, email, done, profile, accessToken, refreshToken)
                        } else {
                            await auditService.recordLoginActivity(
                                '<empty>',
                                LoginActivityCode.UNKNOWN_USER,
                                ErrorMessage.UNKNOWN_USER,
                                this.getProviderName()
                            )
                            return done({ name: 'SSO_LOGIN_FAILED', message: ErrorMessage.UNKNOWN_USER }, undefined)
                        }
                    }
                )
            )
        } else {
            passport.unuse(this.getStrategyName())
        }
    }

    initialize() {
        if (this.ssoConfig) {
            this.setSSOConfig(this.ssoConfig)
        }
    }

    static async testSetup(ssoConfig: any) {
        const { clientID, redirectURL } = ssoConfig

        try {
            const authorizationUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
                client_id: clientID,
                redirect_uri: redirectURL,
                response_type: 'code',
                scope: 'openid email profile'
            }).toString()}`

            const tokenResponse = await axios.get(authorizationUrl)
            return { message: tokenResponse.statusText }
        } catch (error) {
            const errorMessage = 'Google Configuration test failed. Please check your credentials.'
            return { error: errorMessage }
        }
    }

    async refreshToken(ssoRefreshToken: string) {
        const { clientID, clientSecret } = this.ssoConfig

        try {
            const response = await axios.post(
                `https://oauth2.googleapis.com/token`,
                new URLSearchParams({
                    client_id: clientID || '',
                    client_secret: clientSecret || '',
                    grant_type: 'refresh_token',
                    refresh_token: ssoRefreshToken,
                    scope: 'refresh_token'
                }).toString(),
                {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                }
            )
            return { ...response.data }
        } catch (error) {
            const errorMessage = 'Failed to get refreshToken from Google.'
            return { error: errorMessage }
        }
    }
}

export default GoogleSSO
