// AzureSSO.ts
import express from 'express'
import SSOBase from './SSOBase'
import passport from 'passport'
import { Profile, Strategy as OpenIDConnectStrategy, VerifyCallback } from 'passport-openidconnect'
import { Request } from 'express'
import auditService from '../services/audit'
import { ErrorMessage, LoginActivityCode } from '../Interface.Enterprise'
import axios from 'axios'
import { orgScopedPath, registerSsoRoutes } from './ssoRouteRegistry'

class AzureSSO extends SSOBase {
    static LOGIN_URI = '/api/v1/azure/login'
    static CALLBACK_URI = '/api/v1/azure/callback'
    static LOGOUT_URI = '/api/v1/azure/logout'

    getProviderName(): string {
        return 'Microsoft SSO'
    }

    getStrategyKey(): string {
        return 'azure-ad'
    }

    static getCallbackURL(organizationSlug?: string): string {
        const APP_URL = process.env.APP_URL || 'http://127.0.0.1:' + process.env.PORT
        return APP_URL + orgScopedPath(AzureSSO.CALLBACK_URI, 'azure', organizationSlug)
    }

    static registerRoutes(app: express.Application, providers: Map<string, SSOBase>) {
        registerSsoRoutes(app, 'azure', AzureSSO.LOGIN_URI, AzureSSO.CALLBACK_URI, providers, 'Azure SSO')
    }

    initialize() {
        this.setSSOConfig(this.ssoConfig)
    }

    setSSOConfig(ssoConfig: any) {
        super.setSSOConfig(ssoConfig)
        if (this.ssoConfig) {
            const { tenantID, clientID, clientSecret } = this.ssoConfig
            passport.use(
                this.getStrategyName(),
                new OpenIDConnectStrategy(
                    {
                        issuer: `https://login.microsoftonline.com/${tenantID}/v2.0`,
                        authorizationURL: `https://login.microsoftonline.com/${tenantID}/oauth2/v2.0/authorize`,
                        tokenURL: `https://login.microsoftonline.com/${tenantID}/oauth2/v2.0/token`,
                        userInfoURL: `https://graph.microsoft.com/oidc/userinfo`,
                        clientID: clientID || 'your_client_id',
                        clientSecret: clientSecret || 'your_client_secret',
                        callbackURL: AzureSSO.getCallbackURL(this.organizationSlug),
                        scope: 'openid profile email offline_access',
                        passReqToCallback: true
                    },
                    async (
                        req: Request,
                        issuer: string,
                        profile: Profile,
                        context: object,
                        idToken: string | object,
                        accessToken: string | object,
                        refreshToken: string,
                        done: VerifyCallback
                    ) => {
                        const email = profile.username
                        if (!email) {
                            await auditService.recordLoginActivity(
                                '<empty>',
                                LoginActivityCode.UNKNOWN_USER,
                                ErrorMessage.UNKNOWN_USER,
                                this.getProviderName()
                            )
                            return done({ name: 'SSO_LOGIN_FAILED', message: ErrorMessage.UNKNOWN_USER }, undefined)
                        }
                        return this.verifyAndLogin(this.app, email, done, profile, accessToken, refreshToken)
                    }
                )
            )
        } else {
            passport.unuse(this.getStrategyName())
        }
    }

    static async testSetup(ssoConfig: any) {
        const { tenantID, clientID, clientSecret } = ssoConfig

        try {
            const tokenResponse = await axios.post(
                `https://login.microsoftonline.com/${tenantID}/oauth2/v2.0/token`,
                new URLSearchParams({
                    client_id: clientID,
                    client_secret: clientSecret,
                    grant_type: 'client_credentials',
                    scope: 'https://graph.microsoft.com/.default'
                }).toString(),
                {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                }
            )
            return { message: tokenResponse.statusText }
        } catch (error) {
            const errorMessage = 'Microsoft Configuration test failed. Please check your credentials and Tenant ID.'
            return { error: errorMessage }
        }
    }

    async refreshToken(ssoRefreshToken: string) {
        const { tenantID, clientID, clientSecret } = this.ssoConfig

        try {
            const response = await axios.post(
                `https://login.microsoftonline.com/${tenantID}/oauth2/v2.0/token`,
                new URLSearchParams({
                    client_id: clientID || '',
                    client_secret: clientSecret || '',
                    grant_type: 'refresh_token',
                    refresh_token: ssoRefreshToken,
                    scope: 'openid profile email'
                }).toString(),
                {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                }
            )
            return { ...response.data }
        } catch (error) {
            const errorMessage = 'Failed to get refreshToken from Azure.'
            return { error: errorMessage }
        }
    }
}

export default AzureSSO
