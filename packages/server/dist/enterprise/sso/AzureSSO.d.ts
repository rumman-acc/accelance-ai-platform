import express from 'express';
import SSOBase from './SSOBase';
declare class AzureSSO extends SSOBase {
    static LOGIN_URI: string;
    static CALLBACK_URI: string;
    static LOGOUT_URI: string;
    getProviderName(): string;
    getStrategyKey(): string;
    static getCallbackURL(organizationSlug?: string): string;
    static registerRoutes(app: express.Application, providers: Map<string, SSOBase>): void;
    initialize(): void;
    setSSOConfig(ssoConfig: any): void;
    static testSetup(ssoConfig: any): Promise<{
        message: string;
        error?: undefined;
    } | {
        error: string;
        message?: undefined;
    }>;
    refreshToken(ssoRefreshToken: string): Promise<any>;
}
export default AzureSSO;
