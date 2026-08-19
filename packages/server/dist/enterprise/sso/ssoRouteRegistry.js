"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ssoProviderKey = ssoProviderKey;
exports.orgScopedPath = orgScopedPath;
exports.registerSsoRoutes = registerSsoRoutes;
const passport_1 = __importDefault(require("passport"));
const Interface_1 = require("../../Interface");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const passport_2 = require("../middleware/passport");
const organization_service_1 = require("../services/organization.service");
function ssoProviderKey(providerName, organizationId) {
    return organizationId ? `${providerName}:${organizationId}` : providerName;
}
/** Inserts the org slug as a path segment right after the provider name, e.g. '/api/v1/azure/callback' -> '/api/v1/azure/acme/callback'. */
function orgScopedPath(uri, providerName, organizationSlug) {
    return organizationSlug ? uri.replace(`/${providerName}/`, `/${providerName}/${organizationSlug}/`) : uri;
}
async function resolveOrgSlugToId(orgSlug) {
    if (!orgSlug)
        return { organizationId: undefined, notFound: true };
    const queryRunner = (0, getRunningExpressApp_1.getRunningExpressApp)().AppDataSource.createQueryRunner();
    try {
        await queryRunner.connect();
        const organization = await new organization_service_1.OrganizationService().readOrganizationBySlug(orgSlug, queryRunner);
        return { organizationId: organization?.id, notFound: !organization };
    }
    finally {
        await queryRunner.release();
    }
}
async function completeSsoLogin(req, res, next, err, user) {
    if (err || !user) {
        if (err?.name === 'SSO_LOGIN_FAILED') {
            const error = { message: err.message };
            return res.redirect(`/signin?error=${encodeURIComponent(JSON.stringify(error))}`);
        }
        return next ? next(err) : res.status(401).json(err);
    }
    req.session.regenerate((regenerateErr) => {
        if (regenerateErr) {
            return next ? next(regenerateErr) : res.status(500).json({ message: 'Session regeneration failed' });
        }
        req.login(user, { session: true }, async (error) => {
            if (error)
                return next ? next(error) : res.status(401).json(error);
            return (0, passport_2.setTokenOrCookies)(res, user, true, req, true, true);
        });
    });
}
/**
 * Registers a provider's login/callback routes exactly once per provider type.
 * In ENTERPRISE mode the routes carry an :orgSlug segment so a not-yet-authenticated
 * request can be resolved to the organization whose SSO config should be used; the
 * `providers` map then holds one instance per (organizationId, providerName). In
 * every other mode (Cloud) the routes and provider map key stay org-agnostic, matching
 * the pre-existing single-tenant behavior.
 */
function registerSsoRoutes(app, providerName, loginUri, callbackUri, providers, displayName, loginAuthenticateOptions) {
    const isEnterprise = (0, getRunningExpressApp_1.getRunningExpressApp)().identityManager.getPlatformType() === Interface_1.Platform.ENTERPRISE;
    const loginPath = isEnterprise ? orgScopedPath(loginUri, providerName, ':orgSlug') : loginUri;
    const callbackPath = isEnterprise ? orgScopedPath(callbackUri, providerName, ':orgSlug') : callbackUri;
    app.get(loginPath, async (req, res, next) => {
        const { organizationId, notFound } = isEnterprise
            ? await resolveOrgSlugToId(req.params.orgSlug)
            : { organizationId: undefined, notFound: false };
        if (notFound)
            return res.status(404).json({ error: 'Organization not found' });
        const provider = providers.get(ssoProviderKey(providerName, organizationId));
        if (!provider?.getSSOConfig())
            return res.status(400).json({ error: `${displayName} is not configured.` });
        passport_1.default.authenticate(provider.getStrategyName(), loginAuthenticateOptions ?? {}, async () => {
            if (next)
                next();
        })(req, res, next);
    });
    app.get(callbackPath, async (req, res, next) => {
        const { organizationId, notFound } = isEnterprise
            ? await resolveOrgSlugToId(req.params.orgSlug)
            : { organizationId: undefined, notFound: false };
        if (notFound)
            return res.status(404).json({ error: 'Organization not found' });
        const provider = providers.get(ssoProviderKey(providerName, organizationId));
        if (!provider?.getSSOConfig())
            return res.status(400).json({ error: `${displayName} is not configured.` });
        passport_1.default.authenticate(provider.getStrategyName(), async (err, user) => {
            try {
                await completeSsoLogin(req, res, next, err, user);
            }
            catch (error) {
                return next ? next(error) : res.status(401).json(error);
            }
        })(req, res, next);
    });
}
//# sourceMappingURL=ssoRouteRegistry.js.map