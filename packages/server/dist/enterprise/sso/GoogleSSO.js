"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SSOBase_1 = __importDefault(require("./SSOBase"));
const passport_1 = __importDefault(require("passport"));
const passport_openidconnect_1 = require("passport-openidconnect");
const audit_1 = __importDefault(require("../services/audit"));
const Interface_Enterprise_1 = require("../Interface.Enterprise");
const axios_1 = __importDefault(require("axios"));
const ssoRouteRegistry_1 = require("./ssoRouteRegistry");
class GoogleSSO extends SSOBase_1.default {
    getProviderName() {
        return 'Google SSO';
    }
    getStrategyKey() {
        return 'google';
    }
    static getCallbackURL(organizationSlug) {
        const APP_URL = process.env.APP_URL || 'http://127.0.0.1:' + process.env.PORT;
        return APP_URL + (0, ssoRouteRegistry_1.orgScopedPath)(GoogleSSO.CALLBACK_URI, 'google', organizationSlug);
    }
    static registerRoutes(app, providers) {
        (0, ssoRouteRegistry_1.registerSsoRoutes)(app, 'google', GoogleSSO.LOGIN_URI, GoogleSSO.CALLBACK_URI, providers, 'Google SSO');
    }
    setSSOConfig(ssoConfig) {
        super.setSSOConfig(ssoConfig);
        if (this.ssoConfig) {
            const clientID = this.ssoConfig.clientID;
            const clientSecret = this.ssoConfig.clientSecret;
            passport_1.default.use(this.getStrategyName(), new passport_openidconnect_1.Strategy({
                issuer: 'https://accounts.google.com',
                authorizationURL: 'https://accounts.google.com/o/oauth2/v2/auth',
                tokenURL: 'https://oauth2.googleapis.com/token',
                userInfoURL: 'https://openidconnect.googleapis.com/v1/userinfo',
                clientID: clientID || 'your_google_client_id',
                clientSecret: clientSecret || 'your_google_client_secret',
                callbackURL: GoogleSSO.getCallbackURL(this.organizationSlug) || 'http://localhost:3000/auth/google/callback',
                scope: 'openid profile email'
            }, async (issuer, profile, context, idToken, accessToken, refreshToken, done) => {
                if (profile.emails && profile.emails.length > 0) {
                    const email = profile.emails[0].value;
                    return this.verifyAndLogin(this.app, email, done, profile, accessToken, refreshToken);
                }
                else {
                    await audit_1.default.recordLoginActivity('<empty>', Interface_Enterprise_1.LoginActivityCode.UNKNOWN_USER, Interface_Enterprise_1.ErrorMessage.UNKNOWN_USER, this.getProviderName(), this.organizationId);
                    return done({ name: 'SSO_LOGIN_FAILED', message: Interface_Enterprise_1.ErrorMessage.UNKNOWN_USER }, undefined);
                }
            }));
        }
        else {
            passport_1.default.unuse(this.getStrategyName());
        }
    }
    initialize() {
        if (this.ssoConfig) {
            this.setSSOConfig(this.ssoConfig);
        }
    }
    static async testSetup(ssoConfig) {
        const { clientID, redirectURL } = ssoConfig;
        try {
            const authorizationUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
                client_id: clientID,
                redirect_uri: redirectURL,
                response_type: 'code',
                scope: 'openid email profile'
            }).toString()}`;
            const tokenResponse = await axios_1.default.get(authorizationUrl);
            return { message: tokenResponse.statusText };
        }
        catch (error) {
            const errorMessage = 'Google Configuration test failed. Please check your credentials.';
            return { error: errorMessage };
        }
    }
    async refreshToken(ssoRefreshToken) {
        const { clientID, clientSecret } = this.ssoConfig;
        try {
            const response = await axios_1.default.post(`https://oauth2.googleapis.com/token`, new URLSearchParams({
                client_id: clientID || '',
                client_secret: clientSecret || '',
                grant_type: 'refresh_token',
                refresh_token: ssoRefreshToken,
                scope: 'refresh_token'
            }).toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            return { ...response.data };
        }
        catch (error) {
            const errorMessage = 'Failed to get refreshToken from Google.';
            return { error: errorMessage };
        }
    }
}
GoogleSSO.LOGIN_URI = '/api/v1/google/login';
GoogleSSO.CALLBACK_URI = '/api/v1/google/callback';
GoogleSSO.LOGOUT_URI = '/api/v1/google/logout';
exports.default = GoogleSSO;
//# sourceMappingURL=GoogleSSO.js.map