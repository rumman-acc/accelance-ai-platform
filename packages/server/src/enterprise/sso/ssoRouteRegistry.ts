import express, { NextFunction, Request, Response } from 'express'
import passport from 'passport'
import { Platform } from '../../Interface'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { LoggedInUser } from '../Interface.Enterprise'
import { setTokenOrCookies } from '../middleware/passport'
import { OrganizationService } from '../services/organization.service'
import SSOBase from './SSOBase'

export function ssoProviderKey(providerName: string, organizationId?: string): string {
    return organizationId ? `${providerName}:${organizationId}` : providerName
}

/** Inserts the org slug as a path segment right after the provider name, e.g. '/api/v1/azure/callback' -> '/api/v1/azure/acme/callback'. */
export function orgScopedPath(uri: string, providerName: string, organizationSlug?: string): string {
    return organizationSlug ? uri.replace(`/${providerName}/`, `/${providerName}/${organizationSlug}/`) : uri
}

async function resolveOrgSlugToId(orgSlug: string | undefined): Promise<{ organizationId?: string; notFound: boolean }> {
    if (!orgSlug) return { organizationId: undefined, notFound: true }
    const queryRunner = getRunningExpressApp().AppDataSource.createQueryRunner()
    try {
        await queryRunner.connect()
        const organization = await new OrganizationService().readOrganizationBySlug(orgSlug, queryRunner)
        return { organizationId: organization?.id, notFound: !organization }
    } finally {
        await queryRunner.release()
    }
}

async function completeSsoLogin(req: Request, res: Response, next: NextFunction | undefined, err: any, user: LoggedInUser) {
    if (err || !user) {
        if (err?.name === 'SSO_LOGIN_FAILED') {
            const error = { message: err.message }
            return res.redirect(`/signin?error=${encodeURIComponent(JSON.stringify(error))}`)
        }
        return next ? next(err) : res.status(401).json(err)
    }

    req.session.regenerate((regenerateErr) => {
        if (regenerateErr) {
            return next ? next(regenerateErr) : res.status(500).json({ message: 'Session regeneration failed' })
        }
        req.login(user, { session: true }, async (error) => {
            if (error) return next ? next(error) : res.status(401).json(error)
            return setTokenOrCookies(res, user, true, req, true, true)
        })
    })
}

/**
 * Registers a provider's login/callback routes exactly once per provider type.
 * In ENTERPRISE mode the routes carry an :orgSlug segment so a not-yet-authenticated
 * request can be resolved to the organization whose SSO config should be used; the
 * `providers` map then holds one instance per (organizationId, providerName). In
 * every other mode (Cloud) the routes and provider map key stay org-agnostic, matching
 * the pre-existing single-tenant behavior.
 */
export function registerSsoRoutes(
    app: express.Application,
    providerName: string,
    loginUri: string,
    callbackUri: string,
    providers: Map<string, SSOBase>,
    displayName: string,
    loginAuthenticateOptions?: Record<string, unknown>
) {
    const isEnterprise = getRunningExpressApp().identityManager.getPlatformType() === Platform.ENTERPRISE
    const loginPath = isEnterprise ? orgScopedPath(loginUri, providerName, ':orgSlug') : loginUri
    const callbackPath = isEnterprise ? orgScopedPath(callbackUri, providerName, ':orgSlug') : callbackUri

    app.get(loginPath, async (req, res, next) => {
        const { organizationId, notFound } = isEnterprise
            ? await resolveOrgSlugToId(req.params.orgSlug)
            : { organizationId: undefined, notFound: false }
        if (notFound) return res.status(404).json({ error: 'Organization not found' })

        const provider = providers.get(ssoProviderKey(providerName, organizationId))
        if (!provider?.getSSOConfig()) return res.status(400).json({ error: `${displayName} is not configured.` })

        passport.authenticate(provider.getStrategyName(), loginAuthenticateOptions ?? {}, async () => {
            if (next) next()
        })(req, res, next)
    })

    app.get(callbackPath, async (req, res, next) => {
        const { organizationId, notFound } = isEnterprise
            ? await resolveOrgSlugToId(req.params.orgSlug)
            : { organizationId: undefined, notFound: false }
        if (notFound) return res.status(404).json({ error: 'Organization not found' })

        const provider = providers.get(ssoProviderKey(providerName, organizationId))
        if (!provider?.getSSOConfig()) return res.status(400).json({ error: `${displayName} is not configured.` })

        passport.authenticate(provider.getStrategyName(), async (err: any, user: LoggedInUser) => {
            try {
                await completeSsoLogin(req, res, next, err, user)
            } catch (error) {
                return next ? next(error) : res.status(401).json(error)
            }
        })(req, res, next)
    })
}
