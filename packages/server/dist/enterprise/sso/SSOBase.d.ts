import express from 'express';
import passport from 'passport';
declare abstract class SSOBase {
    protected app: express.Application;
    protected ssoConfig: any;
    protected organizationId?: string;
    protected organizationSlug?: string;
    constructor(app: express.Application, organizationId: string | undefined, ssoConfig?: any, organizationSlug?: string);
    setSSOConfig(ssoConfig: any): void;
    getSSOConfig(): any;
    getOrganizationId(): string | undefined;
    /** Passport strategy name this instance registers under - org-scoped in ENTERPRISE mode, plain otherwise. */
    getStrategyName(): string;
    abstract getProviderName(): string;
    /** Base passport strategy key for this provider type, e.g. 'azure-ad', 'google', 'auth0', 'github'. */
    abstract getStrategyKey(): string;
    abstract initialize(): void;
    abstract refreshToken(ssoRefreshToken: string): Promise<{
        [key: string]: any;
    }>;
    verifyAndLogin(app: express.Application, email: string, done: (err?: Error | null, user?: Express.User, info?: any) => void, profile: passport.Profile, accessToken: string | object, refreshToken: string): Promise<void>;
}
export default SSOBase;
