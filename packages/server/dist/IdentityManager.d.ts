/**
 * Copyright (c) 2023-present FlowiseAI, Inc.
 *
 * The Enterprise and Cloud versions of Flowise are licensed under the [Commercial License](https://github.com/FlowiseAI/Flowise/tree/main/packages/server/src/enterprise/LICENSE.md).
 * Unauthorized copying, modification, distribution, or use of the Enterprise and Cloud versions is strictly prohibited without a valid license agreement from FlowiseAI, Inc.
 *
 * The Open Source version is licensed under the Apache License, Version 2.0 (the "License")
 *
 * For information about licensing of the Enterprise and Cloud versions, please contact:
 * security@accelance.io
 */
import express, { Application, NextFunction, Request, Response } from 'express';
import Stripe from 'stripe';
import { LoggedInUser } from './enterprise/Interface.Enterprise';
import { Permissions } from './enterprise/rbac/Permissions';
import SSOBase from './enterprise/sso/SSOBase';
import { Platform, UserPlan } from './Interface';
export declare class IdentityManager {
    private static instance;
    private stripeManager?;
    licenseValid: boolean;
    permissions: Permissions;
    ssoProviderName: string;
    currentInstancePlatform: Platform;
    ssoProviders: Map<string, SSOBase>;
    static getInstance(): Promise<IdentityManager>;
    initialize(): Promise<void>;
    getPlatformType: () => Platform;
    getPermissions: () => Permissions;
    isEnterprise: () => boolean;
    isCloud: () => boolean;
    isOpenSource: () => boolean;
    isLicenseValid: () => boolean;
    private _offlineVerifyLicense;
    private _validateLicenseKey;
    initializeSSO: (app: express.Application) => Promise<void>;
    private registerAllSsoRoutes;
    initializeEmptySSO(app: Application): void;
    initializeSsoProvider(app: Application, providerName: string, providerConfig: any, organizationId?: string, organizationSlug?: string): void;
    getRefreshToken(providerName: any, ssoRefreshToken: string, organizationId?: string): Promise<{
        [key: string]: any;
    }>;
    getProductIdFromSubscription(subscriptionId: string): Promise<string>;
    getFeaturesByPlan(subscriptionId: string, withoutCache?: boolean): Promise<Record<string, string>>;
    static checkFeatureByPlan(feature: string): (req: Request, res: Response, next: NextFunction) => void | express.Response<any, Record<string, any>>;
    createStripeCustomerPortalSession(req: Request): Promise<{
        url: string;
    }>;
    getAdditionalSeatsQuantity(subscriptionId: string): Promise<{}>;
    getCustomerWithDefaultSource(customerId: string): Promise<Stripe.Customer | undefined>;
    updateStripeCustomerEmail(customerId: string, email: string): Promise<void>;
    getAdditionalSeatsProration(subscriptionId: string, newQuantity: number): Promise<{}>;
    updateAdditionalSeats(subscriptionId: string, quantity: number, prorationDate: number): Promise<{
        success?: undefined;
        subscription?: undefined;
        invoice?: undefined;
    } | {
        success: boolean;
        subscription: Stripe.Response<Stripe.Subscription>;
        invoice: Stripe.Invoice;
    }>;
    getPlanProration(subscriptionId: string, newPlanId: string): Promise<{}>;
    updateSubscriptionPlan(req: Request, subscriptionId: string, newPlanId: string, prorationDate: number): Promise<{
        status?: undefined;
        user?: undefined;
        message?: undefined;
    } | {
        status: string;
        user: LoggedInUser;
        message?: undefined;
    } | {
        status: string;
        message: string;
        user?: undefined;
    }>;
    createStripeUserAndSubscribe({ email, userPlan, referral }: {
        email: string;
        userPlan: UserPlan;
        referral?: string;
    }): Promise<{
        customerId: string;
        subscriptionId: string;
    }>;
    /**
     * Cancels a Stripe subscription and syncs the result to the usage cache.
     *
     * Requests cancellation via Stripe, then updates the subscription data in cache
     * so usage and billing state stay consistent. Throws if the Stripe manager
     * is not initialized.
     *
     * @param subscriptionId - The Stripe subscription ID to cancel
     * @returns The cancelled Stripe subscription object
     */
    cancelSubscription(subscriptionId: string): Promise<Stripe.Response<Stripe.Subscription>>;
}
