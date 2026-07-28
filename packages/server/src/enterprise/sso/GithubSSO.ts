import express from 'express'
import SSOBase from './SSOBase'
import passport from 'passport'
import { Strategy as GitHubStrategy, Profile } from 'passport-github'
import { orgScopedPath, registerSsoRoutes } from './ssoRouteRegistry'

class GithubSSO extends SSOBase {
    static LOGIN_URI = '/api/v1/github/login'
    static CALLBACK_URI = '/api/v1/github/callback'
    static LOGOUT_URI = '/api/v1/github/logout'

    getProviderName(): string {
        return 'Github SSO'
    }

    getStrategyKey(): string {
        return 'github'
    }

    static getCallbackURL(organizationSlug?: string): string {
        const APP_URL = process.env.APP_URL || 'http://127.0.0.1:' + process.env.PORT
        return APP_URL + orgScopedPath(GithubSSO.CALLBACK_URI, 'github', organizationSlug)
    }

    static registerRoutes(app: express.Application, providers: Map<string, SSOBase>) {
        registerSsoRoutes(app, 'github', GithubSSO.LOGIN_URI, GithubSSO.CALLBACK_URI, providers, 'Github SSO')
    }

    setSSOConfig(ssoConfig: any) {
        super.setSSOConfig(ssoConfig)
        if (this.ssoConfig) {
            const clientID = this.ssoConfig.clientID
            const clientSecret = this.ssoConfig.clientSecret

            // Configure Passport to use the GitHub strategy
            passport.use(
                this.getStrategyName(),
                new GitHubStrategy(
                    {
                        clientID: clientID,
                        clientSecret: clientSecret,
                        callbackURL: GithubSSO.getCallbackURL(this.organizationSlug),
                        scope: ['user:email']
                    },
                    async (accessToken: string, refreshToken: string, profile: Profile, done: any) => {
                        // Fetch emails from GitHub API using the access token.
                        const emailResponse = await fetch('https://api.github.com/user/emails', {
                            headers: {
                                Authorization: `token ${accessToken}`,
                                'User-Agent': 'Node.js'
                            }
                        })
                        const emails = await emailResponse.json()
                        // Look for a verified primary email.
                        let primaryEmail = emails.find((email: any) => email.primary && email.verified)?.email
                        if (!primaryEmail && Array.isArray(emails) && emails.length > 0) {
                            primaryEmail = emails[0].email
                        }
                        return this.verifyAndLogin(this.app, primaryEmail, done, profile, accessToken, refreshToken)
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
        const { clientID, clientSecret } = ssoConfig

        try {
            const response = await fetch('https://github.com/login/oauth/access_token', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    client_id: clientID,
                    client_secret: clientSecret,
                    code: 'dummy_code_for_testing'
                })
            })
            const data = await response.json()
            if (data.error === 'bad_verification_code') {
                return { message: 'ClientID and clientSecret are valid.' }
            } else {
                return { error: `Invalid credentials. Received error: ${data.error || 'unknown'}` }
            }
        } catch (error) {
            return { error: 'Github Configuration test failed. Please check your credentials.' }
        }
    }

    async refreshToken(currentRefreshToken: string) {
        const { clientID, clientSecret } = this.ssoConfig

        try {
            const response = await fetch('https://github.com/login/oauth/access_token', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    client_id: clientID,
                    client_secret: clientSecret,
                    grant_type: 'refresh_token',
                    refresh_token: currentRefreshToken
                })
            })
            const data = await response.json()
            if (data.error || !data.access_token) {
                return { error: 'Failed to get refreshToken from Github.' }
            } else {
                return data
            }
        } catch (error) {
            return { error: 'Failed to get refreshToken from Github.' }
        }
    }
}

export default GithubSSO
