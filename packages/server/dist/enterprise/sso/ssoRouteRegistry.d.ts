import express from 'express';
import SSOBase from './SSOBase';
export declare function ssoProviderKey(providerName: string, organizationId?: string): string;
/** Inserts the org slug as a path segment right after the provider name, e.g. '/api/v1/azure/callback' -> '/api/v1/azure/acme/callback'. */
export declare function orgScopedPath(uri: string, providerName: string, organizationSlug?: string): string;
/**
 * Registers a provider's login/callback routes exactly once per provider type.
 * In ENTERPRISE mode the routes carry an :orgSlug segment so a not-yet-authenticated
 * request can be resolved to the organization whose SSO config should be used; the
 * `providers` map then holds one instance per (organizationId, providerName). In
 * every other mode (Cloud) the routes and provider map key stay org-agnostic, matching
 * the pre-existing single-tenant behavior.
 */
export declare function registerSsoRoutes(app: express.Application, providerName: string, loginUri: string, callbackUri: string, providers: Map<string, SSOBase>, displayName: string, loginAuthenticateOptions?: Record<string, unknown>): void;
