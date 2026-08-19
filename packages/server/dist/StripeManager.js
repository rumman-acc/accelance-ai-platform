"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeManager = void 0;
const stripe_1 = __importDefault(require("stripe"));
const Interface_1 = require("./Interface");
const UsageCacheManager_1 = require("./UsageCacheManager");
const constants_1 = require("./utils/constants");
class StripeManager {
    static async getInstance() {
        if (!StripeManager.instance) {
            StripeManager.instance = new StripeManager();
            await StripeManager.instance.initialize();
        }
        return StripeManager.instance;
    }
    async initialize() {
        if (!this.stripe && process.env.STRIPE_SECRET_KEY) {
            this.stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY);
        }
        this.cacheManager = await UsageCacheManager_1.UsageCacheManager.getInstance();
    }
    getStripe() {
        if (!this.stripe)
            throw new Error('Stripe is not initialized');
        return this.stripe;
    }
    getSubscriptionObject(subscription) {
        return {
            customer: subscription.customer,
            status: subscription.status,
            created: subscription.created
        };
    }
    async getProductIdFromSubscription(subscriptionId) {
        if (!subscriptionId || subscriptionId.trim() === '') {
            return '';
        }
        if (!this.stripe) {
            throw new Error('Stripe is not initialized');
        }
        const subscriptionData = await this.cacheManager.getSubscriptionDataFromCache(subscriptionId);
        if (subscriptionData?.productId) {
            return subscriptionData.productId;
        }
        try {
            const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
            const items = subscription.items.data;
            if (items.length === 0) {
                return '';
            }
            const productId = items[0].price.product;
            await this.cacheManager.updateSubscriptionDataToCache(subscriptionId, {
                productId,
                subsriptionDetails: this.getSubscriptionObject(subscription)
            });
            return productId;
        }
        catch (error) {
            return '';
        }
    }
    async getFeaturesByPlan(subscriptionId, withoutCache = false) {
        if (!this.stripe || !subscriptionId) {
            return {};
        }
        if (!withoutCache) {
            const subscriptionData = await this.cacheManager.getSubscriptionDataFromCache(subscriptionId);
            if (subscriptionData?.features) {
                return subscriptionData.features;
            }
        }
        const subscription = await this.stripe.subscriptions.retrieve(subscriptionId, {
            timeout: 5000
        });
        const items = subscription.items.data;
        if (items.length === 0) {
            return {};
        }
        const productId = items[0].price.product;
        const product = await this.stripe.products.retrieve(productId, {
            timeout: 5000
        });
        const productMetadata = product.metadata;
        if (!productMetadata || Object.keys(productMetadata).length === 0) {
            return {};
        }
        const features = {};
        for (const key in productMetadata) {
            if (key.startsWith('feat:')) {
                features[key] = productMetadata[key];
            }
        }
        await this.cacheManager.updateSubscriptionDataToCache(subscriptionId, {
            features,
            subsriptionDetails: this.getSubscriptionObject(subscription)
        });
        return features;
    }
    async createStripeCustomerPortalSession(req) {
        if (!this.stripe) {
            throw new Error('Stripe is not initialized');
        }
        const customerId = req.user?.activeOrganizationCustomerId;
        if (!customerId) {
            throw new Error('Customer ID is required');
        }
        const subscriptionId = req.user?.activeOrganizationSubscriptionId;
        if (!subscriptionId) {
            throw new Error('Subscription ID is required');
        }
        try {
            const prodPriceIds = await this.getPriceIds();
            const configuration = await this.createPortalConfiguration(prodPriceIds);
            const portalSession = await this.stripe.billingPortal.sessions.create({
                customer: customerId,
                configuration: configuration.id,
                return_url: `${process.env.APP_URL}/account`
                /* We can't have flow_data because it does not support multiple subscription items
                flow_data: {
                    type: 'subscription_update',
                    subscription_update: {
                        subscription: subscriptionId
                    },
                    after_completion: {
                        type: 'redirect',
                        redirect: {
                            return_url: `${process.env.APP_URL}/account/subscription?subscriptionId=${subscriptionId}`
                        }
                    }
                }*/
            });
            return { url: portalSession.url };
        }
        catch (error) {
            console.error('Error creating customer portal session:', error);
            throw error;
        }
    }
    async getPriceIds() {
        const prodPriceIds = {
            [Interface_1.UserPlan.STARTER]: {
                product: process.env.CLOUD_STARTER_ID,
                price: ''
            },
            [Interface_1.UserPlan.PRO]: {
                product: process.env.CLOUD_PRO_ID,
                price: ''
            },
            [Interface_1.UserPlan.FREE]: {
                product: process.env.CLOUD_FREE_ID,
                price: ''
            },
            SEAT: {
                product: process.env.ADDITIONAL_SEAT_ID,
                price: ''
            }
        };
        for (const key in prodPriceIds) {
            const prices = await this.stripe.prices.list({
                product: prodPriceIds[key].product,
                active: true,
                limit: 1
            });
            if (prices.data.length) {
                prodPriceIds[key].price = prices.data[0].id;
            }
        }
        return prodPriceIds;
    }
    async createPortalConfiguration(_) {
        return await this.stripe.billingPortal.configurations.create({
            business_profile: {
                privacy_policy_url: `${process.env.APP_URL}/privacy-policy`,
                terms_of_service_url: `${process.env.APP_URL}/terms-of-service`
            },
            features: {
                invoice_history: {
                    enabled: true
                },
                payment_method_update: {
                    enabled: true
                },
                subscription_cancel: {
                    enabled: false
                }
                /*subscription_update: {
                    enabled: false,
                    default_allowed_updates: ['price'],
                    products: [
                        {
                            product: prodPriceIds[UserPlan.FREE].product,
                            prices: [prodPriceIds[UserPlan.FREE].price]
                        },
                        {
                            product: prodPriceIds[UserPlan.STARTER].product,
                            prices: [prodPriceIds[UserPlan.STARTER].price]
                        },
                        {
                            product: prodPriceIds[UserPlan.PRO].product,
                            prices: [prodPriceIds[UserPlan.PRO].price]
                        }
                    ],
                    proration_behavior: 'always_invoice'
                }*/
            }
        });
    }
    async getAdditionalSeatsQuantity(subscriptionId) {
        if (!this.stripe) {
            throw new Error('Stripe is not initialized');
        }
        try {
            const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
            const additionalSeatsItem = subscription.items.data.find((item) => item.price.product === process.env.ADDITIONAL_SEAT_ID);
            const quotas = await this.cacheManager.getQuotas(subscriptionId);
            return { quantity: additionalSeatsItem?.quantity || 0, includedSeats: quotas[constants_1.LICENSE_QUOTAS.USERS_LIMIT] };
        }
        catch (error) {
            console.error('Error getting additional seats quantity:', error);
            throw error;
        }
    }
    async getCustomerWithDefaultSource(customerId) {
        if (!this.stripe) {
            throw new Error('Stripe is not initialized');
        }
        try {
            const customer = (await this.stripe.customers.retrieve(customerId, {
                expand: ['default_source', 'invoice_settings.default_payment_method']
            }));
            return customer;
        }
        catch (error) {
            console.error('Error retrieving customer with default source:', error);
            throw error;
        }
    }
    async updateCustomerEmail(customerId, email) {
        if (!this.stripe)
            throw new Error('Stripe is not initialized');
        await this.stripe.customers.update(customerId, { email });
    }
    async getAdditionalSeatsProration(subscriptionId, quantity) {
        if (!this.stripe) {
            throw new Error('Stripe is not initialized');
        }
        try {
            const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
            // Get customer's credit balance
            const customer = await this.stripe.customers.retrieve(subscription.customer);
            const creditBalance = customer.balance; // Balance is in cents, negative for credit, positive for amount owed
            // Get the current subscription's base price (without seats)
            const basePlanItem = subscription.items.data.find((item) => item.price.product !== process.env.ADDITIONAL_SEAT_ID);
            const basePlanAmount = basePlanItem ? basePlanItem.price.unit_amount * 1 : 0;
            const existingInvoice = await this.stripe.invoices.retrieveUpcoming({
                customer: subscription.customer,
                subscription: subscriptionId
            });
            const existingInvoiceTotal = existingInvoice.total;
            // Get the price ID for additional seats
            const prices = await this.stripe.prices.list({
                product: process.env.ADDITIONAL_SEAT_ID,
                active: true,
                limit: 1
            });
            if (prices.data.length === 0) {
                throw new Error('No active price found for additional seats');
            }
            const seatPrice = prices.data[0];
            const pricePerSeat = seatPrice.unit_amount || 0;
            // Use current timestamp for proration calculation
            const prorationDate = Math.floor(Date.now() / 1000);
            const additionalSeatsItem = subscription.items.data.find((item) => item.price.product === process.env.ADDITIONAL_SEAT_ID);
            const upcomingInvoice = await this.stripe.invoices.retrieveUpcoming({
                customer: subscription.customer,
                subscription: subscriptionId,
                subscription_details: {
                    proration_behavior: 'always_invoice',
                    proration_date: prorationDate,
                    items: [
                        additionalSeatsItem
                            ? {
                                id: additionalSeatsItem.id,
                                quantity: quantity
                            }
                            : {
                                // If the item doesn't exist yet, create a new one
                                // This will be used to calculate the proration amount
                                price: prices.data[0].id,
                                quantity: quantity
                            }
                    ]
                }
            });
            // Calculate proration amount from the relevant line items
            // Only consider prorations that match our proration date
            const prorationLineItems = upcomingInvoice.lines.data.filter((line) => line.type === 'invoiceitem' && line.period.start === prorationDate);
            const prorationAmount = prorationLineItems.reduce((total, item) => total + item.amount, 0);
            return {
                basePlanAmount: basePlanAmount / 100,
                additionalSeatsProratedAmount: (existingInvoiceTotal + prorationAmount - basePlanAmount) / 100,
                seatPerUnitPrice: pricePerSeat / 100,
                prorationAmount: prorationAmount / 100,
                creditBalance: creditBalance / 100,
                nextInvoiceTotal: (existingInvoiceTotal + prorationAmount) / 100,
                currency: upcomingInvoice.currency.toUpperCase(),
                prorationDate,
                currentPeriodStart: subscription.current_period_start,
                currentPeriodEnd: subscription.current_period_end
            };
        }
        catch (error) {
            console.error('Error calculating additional seats proration:', error);
            throw error;
        }
    }
    async updateAdditionalSeats(subscriptionId, quantity, prorationDate) {
        if (!this.stripe) {
            throw new Error('Stripe is not initialized');
        }
        try {
            const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
            const additionalSeatsItem = subscription.items.data.find((item) => item.price.product === process.env.ADDITIONAL_SEAT_ID);
            // Get the price ID for additional seats if needed
            const prices = await this.stripe.prices.list({
                product: process.env.ADDITIONAL_SEAT_ID,
                active: true,
                limit: 1
            });
            if (prices.data.length === 0) {
                throw new Error('No active price found for additional seats');
            }
            // Create an invoice immediately for the proration
            const updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
                items: [
                    additionalSeatsItem
                        ? {
                            id: additionalSeatsItem.id,
                            quantity: quantity
                        }
                        : {
                            price: prices.data[0].id,
                            quantity: quantity
                        }
                ],
                proration_behavior: 'always_invoice',
                proration_date: prorationDate
            });
            // Get the latest invoice for this subscription
            const invoice = await this.stripe.invoices.list({
                subscription: subscriptionId,
                limit: 1
            });
            if (invoice.data.length > 0) {
                const latestInvoice = invoice.data[0];
                // Only try to pay if the invoice is not already paid
                if (latestInvoice.status !== 'paid') {
                    await this.stripe.invoices.pay(latestInvoice.id);
                }
            }
            return {
                success: true,
                subscription: updatedSubscription,
                invoice: invoice.data[0]
            };
        }
        catch (error) {
            console.error('Error updating additional seats:', error);
            throw error;
        }
    }
    async getPlanProration(subscriptionId, newPlanId) {
        if (!this.stripe) {
            throw new Error('Stripe is not initialized');
        }
        try {
            const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
            const customerId = subscription.customer;
            // Get customer's credit balance and metadata
            const customer = await this.stripe.customers.retrieve(customerId);
            const creditBalance = customer.balance;
            const customerMetadata = customer.metadata || {};
            // Get the price ID for the new plan
            const prices = await this.stripe.prices.list({
                product: newPlanId,
                active: true,
                limit: 1
            });
            if (prices.data.length === 0) {
                throw new Error('No active price found for the selected plan');
            }
            const newPlan = prices.data[0];
            const newPlanPrice = newPlan.unit_amount || 0;
            // Check if this is the STARTER plan and eligible for first month free
            const isStarterPlan = newPlanId === process.env.CLOUD_STARTER_ID;
            const hasUsedFirstMonthFreeCoupon = customerMetadata.has_used_first_month_free === 'true';
            const eligibleForFirstMonthFree = isStarterPlan && !hasUsedFirstMonthFreeCoupon;
            // Use current timestamp for proration calculation
            const prorationDate = Math.floor(Date.now() / 1000);
            const upcomingInvoice = await this.stripe.invoices.retrieveUpcoming({
                customer: customerId,
                subscription: subscriptionId,
                subscription_details: {
                    proration_behavior: 'always_invoice',
                    proration_date: prorationDate,
                    items: [
                        {
                            id: subscription.items.data[0].id,
                            price: newPlan.id
                        }
                    ]
                }
            });
            let prorationAmount = upcomingInvoice.lines.data.reduce((total, item) => total + item.amount, 0);
            if (eligibleForFirstMonthFree) {
                prorationAmount = 0;
            }
            return {
                newPlanAmount: newPlanPrice / 100,
                prorationAmount: prorationAmount / 100,
                creditBalance: creditBalance / 100,
                currency: upcomingInvoice.currency.toUpperCase(),
                prorationDate,
                currentPeriodStart: subscription.current_period_start,
                currentPeriodEnd: subscription.current_period_end,
                eligibleForFirstMonthFree
            };
        }
        catch (error) {
            console.error('Error calculating plan proration:', error);
            throw error;
        }
    }
    async updateSubscriptionPlan(subscriptionId, newPlanId, prorationDate) {
        if (!this.stripe) {
            throw new Error('Stripe is not initialized');
        }
        try {
            const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
            const customerId = subscription.customer;
            // Get customer details and metadata
            const customer = await this.stripe.customers.retrieve(customerId);
            const customerMetadata = customer.metadata || {};
            // Get the price ID for the new plan
            const prices = await this.stripe.prices.list({
                product: newPlanId,
                active: true,
                limit: 1
            });
            if (prices.data.length === 0) {
                throw new Error('No active price found for the selected plan');
            }
            const newPlan = prices.data[0];
            let updatedSubscription;
            // Check if this is an upgrade to CLOUD_STARTER_ID and eligible for first month free
            const isStarterPlan = newPlanId === process.env.CLOUD_STARTER_ID;
            const hasUsedFirstMonthFreeCoupon = customerMetadata.has_used_first_month_free === 'true';
            if (isStarterPlan && !hasUsedFirstMonthFreeCoupon) {
                // Create the one-time 100% off coupon
                const coupon = await this.stripe.coupons.create({
                    duration: 'once',
                    percent_off: 100,
                    max_redemptions: 1,
                    metadata: {
                        type: 'first_month_free',
                        customer_id: customerId,
                        plan_id: process.env.CLOUD_STARTER_ID || ''
                    }
                });
                // Create a promotion code linked to the coupon
                const promotionCode = await this.stripe.promotionCodes.create({
                    coupon: coupon.id,
                    max_redemptions: 1
                });
                // Update the subscription with the new plan and apply the promotion code
                updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
                    items: [
                        {
                            id: subscription.items.data[0].id,
                            price: newPlan.id
                        }
                    ],
                    proration_behavior: 'always_invoice',
                    proration_date: prorationDate,
                    promotion_code: promotionCode.id
                });
                // Update customer metadata to mark the coupon as used
                await this.stripe.customers.update(customerId, {
                    metadata: {
                        ...customerMetadata,
                        has_used_first_month_free: 'true',
                        first_month_free_date: new Date().toISOString()
                    }
                });
            }
            else {
                // Regular plan update without coupon
                updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
                    items: [
                        {
                            id: subscription.items.data[0].id,
                            price: newPlan.id
                        }
                    ],
                    proration_behavior: 'always_invoice',
                    proration_date: prorationDate
                });
            }
            // Get and pay the latest invoice
            const invoice = await this.stripe.invoices.list({
                subscription: subscriptionId,
                limit: 1
            });
            if (invoice.data.length > 0) {
                const latestInvoice = invoice.data[0];
                if (latestInvoice.status !== 'paid') {
                    await this.stripe.invoices.pay(latestInvoice.id);
                }
            }
            return {
                success: true,
                subscription: updatedSubscription,
                invoice: invoice.data[0]
            };
        }
        catch (error) {
            console.error('Error updating subscription plan:', error);
            throw error;
        }
    }
    /**
     * Cancels a Stripe subscription immediately without proration or an immediate invoice.
     *
     * Calls the Stripe API to cancel the subscription with `prorate: false` and
     * `invoice_now: false`. Throws if the Stripe client is not initialized.
     *
     * @param subscriptionId - The Stripe subscription ID to cancel
     * @returns A promise resolving to the Stripe API response containing the cancelled subscription
     */
    async cancelSubscription(subscriptionId) {
        if (!this.stripe)
            throw new Error('Stripe is not initialized');
        return await this.stripe.subscriptions.cancel(subscriptionId, { prorate: false, invoice_now: false });
    }
}
exports.StripeManager = StripeManager;
//# sourceMappingURL=StripeManager.js.map