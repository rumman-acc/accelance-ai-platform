"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SSOBase_1 = __importDefault(require("./SSOBase"));
const passport_1 = __importDefault(require("passport"));
const passport_auth0_1 = require("passport-auth0");
const audit_1 = __importDefault(require("../services/audit"));
const Interface_Enterprise_1 = require("../Interface.Enterprise");
const axios_1 = __importDefault(require("axios"));
const ssoRouteRegistry_1 = require("./ssoRouteRegistry");
const logger_1 = __importDefault(require("../../utils/logger"));
const PROVIDER_NAME_AUTH0_SSO = 'Auth0 SSO';
function validateAuth0Domain(domain) {
    if (!domain || typeof domain !== 'string') {
        return null;
    }
    const trimmed = domain.trim();
    // Reject characters that could introduce scheme, port, path, or query
    if (/[/\\?#:]/.test(trimmed)) {
        return null;
    }
    // Basic hostname validation
    const hostnameRegex = /^(?=.{1,253}$)([a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,63}$/;
    if (!hostnameRegex.test(trimmed)) {
        return null;
    }
    // Restrict to Auth0 domains
    if (!trimmed.toLowerCase().endsWith('.auth0.com')) {
        return null;
    }
    return trimmed;
}
class Auth0SSO extends SSOBase_1.default {
    getProviderName() {
        return PROVIDER_NAME_AUTH0_SSO;
    }
    getStrategyKey() {
        return 'auth0';
    }
    static getCallbackURL(organizationSlug) {
        const APP_URL = process.env.APP_URL || 'http://127.0.0.1:' + process.env.PORT;
        return APP_URL + (0, ssoRouteRegistry_1.orgScopedPath)(Auth0SSO.CALLBACK_URI, 'auth0', organizationSlug);
    }
    static registerRoutes(app, providers) {
        (0, ssoRouteRegistry_1.registerSsoRoutes)(app, 'auth0', Auth0SSO.LOGIN_URI, Auth0SSO.CALLBACK_URI, providers, 'Auth0 SSO', {
            scope: 'openid profile email'
        });
    }
    setSSOConfig(ssoConfig) {
        super.setSSOConfig(ssoConfig);
        if (ssoConfig) {
            const { domain, clientID, clientSecret } = this.ssoConfig;
            passport_1.default.use(this.getStrategyName(), new passport_auth0_1.Strategy({
                domain: domain || 'your_auth0_domain',
                clientID: clientID || 'your_auth0_client_id',
                clientSecret: clientSecret || 'your_auth0_client_secret',
                callbackURL: Auth0SSO.getCallbackURL(this.organizationSlug) || 'http://localhost:3000/auth/auth0/callback',
                passReqToCallback: true
            }, async (req, accessToken, refreshToken, extraParams, profile, done) => {
                const email = profile.emails?.[0]?.value;
                if (!email) {
                    await audit_1.default.recordLoginActivity('<empty>', Interface_Enterprise_1.LoginActivityCode.UNKNOWN_USER, Interface_Enterprise_1.ErrorMessage.UNKNOWN_USER, PROVIDER_NAME_AUTH0_SSO, this.organizationId);
                    return done({ name: 'SSO_LOGIN_FAILED', message: Interface_Enterprise_1.ErrorMessage.UNKNOWN_USER }, undefined);
                }
                return await this.verifyAndLogin(this.app, email, done, profile, accessToken, refreshToken);
            }));
        }
        else {
            passport_1.default.unuse(this.getStrategyName());
        }
    }
    initialize() {
        this.setSSOConfig(this.ssoConfig);
    }
    static async testSetup(ssoConfig) {
        const { domain, clientID, clientSecret } = ssoConfig;
        const validatedDomain = validateAuth0Domain(domain);
        if (!validatedDomain) {
            return { error: 'Auth0 Configuration test failed. Invalid Auth0 domain.' };
        }
        if (!clientID || !clientSecret) {
            return { error: 'Auth0 Configuration test failed. Client ID and Client Secret are required.' };
        }
        // Confirms the domain is a live Auth0 tenant - this is what the actual
        // Authorization Code login flow depends on, unlike the client_credentials
        // check below which only applies to Management-API-authorized apps.
        try {
            const discoveryResponse = await axios_1.default.get(`https://${validatedDomain}/.well-known/openid-configuration`);
            if (!discoveryResponse.data?.issuer) {
                return { error: 'Auth0 Configuration test failed. Domain did not return valid Auth0 metadata.' };
            }
        }
        catch (error) {
            const detail = error.response?.data?.error_description || error.message;
            logger_1.default.error(`[Auth0SSO.testSetup] OIDC discovery failed for domain ${validatedDomain}: ${detail}`);
            return { error: `Auth0 Configuration test failed. Could not reach Auth0 domain: ${detail}` };
        }
        // A regular login application (used for Authorization Code SSO login) is
        // normally never granted Management API / client_credentials access, so
        // "unauthorized_client" / "access_denied" here is expected and does NOT mean
        // the clientID/clientSecret are wrong - only invalid_client does.
        try {
            await axios_1.default.post(`https://${validatedDomain}/oauth/token`, {
                client_id: clientID,
                client_secret: clientSecret,
                audience: `https://${validatedDomain}/api/v2/`,
                grant_type: 'client_credentials'
            }, { headers: { 'Content-Type': 'application/json' } });
        }
        catch (error) {
            const auth0Error = error.response?.data?.error;
            const detail = error.response?.data?.error_description || auth0Error || error.message;
            if (auth0Error === 'invalid_client') {
                logger_1.default.error(`[Auth0SSO.testSetup] Invalid client credentials for domain ${validatedDomain}: ${detail}`);
                return { error: `Auth0 Configuration test failed. Invalid Client ID or Client Secret: ${detail}` };
            }
            logger_1.default.info(`[Auth0SSO.testSetup] Client credentials check for domain ${validatedDomain} returned expected non-M2M error: ${detail}`);
        }
        return { message: 'Auth0 configuration verified successfully.' };
    }
    async refreshToken(ssoRefreshToken) {
        const { domain, clientID, clientSecret } = this.ssoConfig;
        const validatedDomain = validateAuth0Domain(domain);
        if (!validatedDomain) {
            const errorMessage = 'Auth0 Configuration test failed. Invalid Auth0 domain.';
            return { error: errorMessage };
        }
        try {
            const response = await axios_1.default.post(`https://${validatedDomain}/oauth/token`, {
                client_id: clientID,
                client_secret: clientSecret,
                grant_type: 'refresh_token',
                refresh_token: ssoRefreshToken
            }, {
                headers: { 'Content-Type': 'application/json' }
            });
            return { ...response.data };
        }
        catch (error) {
            const errorMessage = 'Failed to get refreshToken from Auth0.';
            return { error: errorMessage };
        }
    }
}
Auth0SSO.LOGIN_URI = '/api/v1/auth0/login';
Auth0SSO.CALLBACK_URI = '/api/v1/auth0/callback';
Auth0SSO.LOGOUT_URI = '/api/v1/auth0/logout';
exports.default = Auth0SSO;
//# sourceMappingURL=Auth0SSO.js.map