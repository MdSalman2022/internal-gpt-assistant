import Stripe from 'stripe';
import config from '../config/index.js';

// Lazy Stripe initialization - only create instance when actually needed
let stripe = null;

function getStripe() {
    if (!stripe) {
        const apiKey = config.stripeSecretKey || process.env.STRIPE_SECRET_KEY;
        if (!apiKey) {
            console.warn('⚠️ Stripe API key not configured - billing features disabled');
            return null;
        }
        stripe = new Stripe(apiKey, {
            apiVersion: '2023-10-16',
        });
        console.log('✅ Stripe initialized');
    }
    return stripe;
}

class StripeService {
    /**
     * Check if Stripe is configured
     */
    isConfigured() {
        return !!(config.stripeSecretKey || process.env.STRIPE_SECRET_KEY);
    }
    /**
     * Create a Stripe customer for an organization
     */
    async createCustomer(organization, user) {
        try {
            const customer = await getStripe().customers.create({
                email: organization.email,
                name: organization.name,
                metadata: {
                    organizationId: organization._id.toString(),
                    createdBy: user._id.toString(),
                },
            });
            return customer;
        } catch (error) {
            console.error('Error creating Stripe customer:', error);
            throw error;
        }
    }

    /**
     * Create a checkout session for subscription
     */
    async createCheckoutSession(organization, priceId, successUrl, cancelUrl) {
        try {
            const sessionParams = {
                mode: 'subscription',
                payment_method_types: ['card'],
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                success_url: successUrl,
                cancel_url: cancelUrl,
                metadata: {
                    organizationId: organization._id.toString(),
                },
                subscription_data: {
                    metadata: {
                        organizationId: organization._id.toString(),
                    },
                },
            };

            // If organization already has a Stripe customer, use it
            if (organization.stripeCustomerId) {
                sessionParams.customer = organization.stripeCustomerId;
            } else {
                sessionParams.customer_email = organization.email;
            }

            const session = await getStripe().checkout.sessions.create(sessionParams);
            return session;
        } catch (error) {
            console.error('Error creating checkout session:', error);
            throw error;
        }
    }

    /**
     * Create a billing portal session
     */
    async createPortalSession(customerId, returnUrl) {
        try {
            const session = await getStripe().billingPortal.sessions.create({
                customer: customerId,
                return_url: returnUrl,
            });
            return session;
        } catch (error) {
            console.error('Error creating portal session:', error);
            throw error;
        }
    }

    /**
     * Get subscription details
     */
    async getSubscription(subscriptionId) {
        try {
            return await getStripe().subscriptions.retrieve(subscriptionId);
        } catch (error) {
            console.error('Error retrieving subscription:', error);
            throw error;
        }
    }

    /**
     * Cancel subscription
     */
    async cancelSubscription(subscriptionId, cancelAtPeriodEnd = true) {
        try {
            if (cancelAtPeriodEnd) {
                // Cancel at end of billing period
                return await getStripe().subscriptions.update(subscriptionId, {
                    cancel_at_period_end: true,
                });
            } else {
                // Cancel immediately
                return await getStripe().subscriptions.cancel(subscriptionId);
            }
        } catch (error) {
            console.error('Error cancelling subscription:', error);
            throw error;
        }
    }

    /**
     * Reactivate a subscription (undo cancel at period end)
     */
    async reactivateSubscription(subscriptionId) {
        try {
            return await getStripe().subscriptions.update(subscriptionId, {
                cancel_at_period_end: false,
            });
        } catch (error) {
            console.error('Error reactivating subscription:', error);
            throw error;
        }
    }

    /**
     * Update subscription (change plan)
     */
    async updateSubscription(subscriptionId, newPriceId) {
        try {
            const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
            return await getStripe().subscriptions.update(subscriptionId, {
                items: [
                    {
                        id: subscription.items.data[0].id,
                        price: newPriceId,
                    },
                ],
                proration_behavior: 'create_prorations',
            });
        } catch (error) {
            console.error('Error updating subscription:', error);
            throw error;
        }
    }

    /**
     * Get customer invoices
     */
    async getInvoices(customerId, limit = 10) {
        try {
            const invoices = await getStripe().invoices.list({
                customer: customerId,
                limit,
            });
            return invoices.data;
        } catch (error) {
            console.error('Error retrieving invoices:', error);
            throw error;
        }
    }

    /**
     * Get upcoming invoice
     */
    async getUpcomingInvoice(customerId) {
        try {
            return await getStripe().invoices.retrieveUpcoming({
                customer: customerId,
            });
        } catch (error) {
            // No upcoming invoice is not an error
            if (error.code === 'invoice_upcoming_none') {
                return null;
            }
            console.error('Error retrieving upcoming invoice:', error);
            throw error;
        }
    }

    /**
     * Verify webhook signature
     */
    constructWebhookEvent(payload, signature, webhookSecret) {
        try {
            return getStripe().webhooks.constructEvent(
                payload,
                signature,
                webhookSecret || config.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (error) {
            console.error('Webhook signature verification failed:', error);
            throw error;
        }
    }

    /**
     * Get price by ID
     */
    async getPrice(priceId) {
        try {
            return await getStripe().prices.retrieve(priceId, {
                expand: ['product'],
            });
        } catch (error) {
            console.error('Error retrieving price:', error);
            throw error;
        }
    }

    /**
     * List all prices
     */
    async listPrices(productId = null, active = true) {
        try {
            const params = { active };
            if (productId) params.product = productId;
            return await getStripe().prices.list(params);
        } catch (error) {
            console.error('Error listing prices:', error);
            throw error;
        }
    }

    /**
     * Create a product (for initial setup)
     */
    async createProduct(name, description) {
        try {
            return await getStripe().products.create({
                name,
                description,
            });
        } catch (error) {
            console.error('Error creating product:', error);
            throw error;
        }
    }

    /**
     * Create a price (for initial setup)
     */
    async createPrice(productId, amount, currency = 'usd', interval = 'month') {
        try {
            return await getStripe().prices.create({
                product: productId,
                unit_amount: amount * 100, // Convert to cents
                currency,
                recurring: { interval },
            });
        } catch (error) {
            console.error('Error creating price:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const stripeService = new StripeService();
export default stripeService;
