import { Request } from 'express';
import Stripe from 'stripe';
export declare class StripeManager {
    private static instance;
    private stripe?;
    private cacheManager;
    static getInstance(): Promise<StripeManager>;
    private initialize;
    getStripe(): Stripe;
    getSubscriptionObject(subscription: Stripe.Response<Stripe.Subscription>): {
        customer: string | Stripe.Customer | Stripe.DeletedCustomer;
        status: Stripe.Subscription.Status;
        created: number;
    };
    getProductIdFromSubscription(subscriptionId: string): Promise<string>;
    getFeaturesByPlan(subscriptionId: string, withoutCache?: boolean): Promise<Record<string, string>>;
    createStripeCustomerPortalSession(req: Request): Promise<{
        url: string;
    }>;
    private getPriceIds;
    private createPortalConfiguration;
    getAdditionalSeatsQuantity(subscriptionId: string): Promise<{
        quantity: number;
        includedSeats: number;
    }>;
    getCustomerWithDefaultSource(customerId: string): Promise<Stripe.Customer>;
    updateCustomerEmail(customerId: string, email: string): Promise<void>;
    getAdditionalSeatsProration(subscriptionId: string, quantity: number): Promise<{
        basePlanAmount: number;
        additionalSeatsProratedAmount: number;
        seatPerUnitPrice: number;
        prorationAmount: number;
        creditBalance: number;
        nextInvoiceTotal: number;
        currency: string;
        prorationDate: number;
        currentPeriodStart: number;
        currentPeriodEnd: number;
    }>;
    updateAdditionalSeats(subscriptionId: string, quantity: number, prorationDate: number): Promise<{
        success: boolean;
        subscription: Stripe.Response<Stripe.Subscription>;
        invoice: Stripe.Invoice;
    }>;
    getPlanProration(subscriptionId: string, newPlanId: string): Promise<{
        newPlanAmount: number;
        prorationAmount: number;
        creditBalance: number;
        currency: string;
        prorationDate: number;
        currentPeriodStart: number;
        currentPeriodEnd: number;
        eligibleForFirstMonthFree: boolean;
    }>;
    updateSubscriptionPlan(subscriptionId: string, newPlanId: string, prorationDate: number): Promise<{
        success: boolean;
        subscription: Stripe.Response<Stripe.Subscription>;
        invoice: Stripe.Invoice;
    }>;
    /**
     * Cancels a Stripe subscription immediately without proration or an immediate invoice.
     *
     * Calls the Stripe API to cancel the subscription with `prorate: false` and
     * `invoice_now: false`. Throws if the Stripe client is not initialized.
     *
     * @param subscriptionId - The Stripe subscription ID to cancel
     * @returns A promise resolving to the Stripe API response containing the cancelled subscription
     */
    cancelSubscription(subscriptionId: string): Promise<Stripe.Response<Stripe.Subscription>>;
}
