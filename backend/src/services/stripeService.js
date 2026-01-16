import Stripe from 'stripe';
import config from '../config/index.js';
import { PLANS } from '../config/plans.js';

// Lazy Stripe initialization - only create instance when actually needed
let stripe = null;

function getStripe() {
    if (!stripe) {
        const apiKey = config.stripeSecretKey
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

import { auditService } from './index.js';

class StripeService {
    constructor() {
        this.auditService = auditService;
    }

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
     * Get customer's credit balance
     */
    async getCustomerBalance(customerId) {
        try {
            const customer = await getStripe().customers.retrieve(customerId);
            // Balance is in cents, negative means credit (customer has money)
            return {
                balance: customer.balance / 100, // Convert to dollars
                balanceDisplay: customer.balance < 0
                    ? `$${Math.abs(customer.balance / 100).toFixed(2)} credit`
                    : customer.balance > 0
                        ? `$${(customer.balance / 100).toFixed(2)} owed`
                        : '$0.00'
            };
        } catch (error) {
            console.error('Error getting customer balance:', error);
            return { balance: 0, balanceDisplay: '$0.00' };
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
                // Don't automatically apply customer credit balance - let user see full price
                sessionParams.customer_update = {
                    name: 'auto',
                    address: 'auto',
                };
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
     * Create an EMBEDDED checkout session (payment UI stays on your site)
     */
    async createEmbeddedCheckoutSession(organization, priceId, returnUrl) {
        try {
            const sessionParams = {
                mode: 'subscription',
                ui_mode: 'embedded', // KEY: Embedded mode
                payment_method_types: ['card'],
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                return_url: returnUrl, // Single return URL (not success/cancel)
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
                sessionParams.customer_update = {
                    name: 'auto',
                    address: 'auto',
                };
            } else {
                sessionParams.customer_email = organization.email;
            }

            const session = await getStripe().checkout.sessions.create(sessionParams);
            
            // Return client_secret for frontend to render embedded checkout
            return {
                clientSecret: session.client_secret,
                sessionId: session.id
            };
        } catch (error) {
            console.error('Error creating embedded checkout session:', error);
            throw error;
        }
    }

    /**
     * Create a Payment Intent for subscription (minimal PaymentElement approach)
     */
    async createSubscriptionPaymentIntent(organization, priceId) {
        try {
            // 1. Ensure Customer Exists
            let customerId = organization.stripeCustomerId;
            if (!customerId) {
                const customer = await getStripe().customers.create({
                    email: organization.email,
                    name: organization.name,
                    metadata: { organizationId: organization._id.toString() }
                });
                customerId = customer.id;
                organization.stripeCustomerId = customerId;
                await organization.save();
            }

            // 2. Identify Plan & Price
            const plan = PLANS.find(p => p.stripePriceIdMonthly === priceId);
            const planType = plan ? (plan.type || plan.name.toLowerCase()) : 'pro'; // Fallback to 'pro' if not found, but should be found

            const price = await this.getPrice(priceId);

            // 3. Create Subscription (Incomplete)
            const subscription = await getStripe().subscriptions.create({
                customer: customerId,
                items: [{ price: priceId }],
                payment_behavior: 'default_incomplete',
                payment_settings: { save_default_payment_method: 'on_subscription' },
                expand: ['latest_invoice.payment_intent'],
                metadata: {
                    organizationId: organization._id.toString(),
                    type: planType, // Store actual plan type (e.g. 'starter', 'pro')
                    priceId
                }
            });

            // 4. Save Subscription ID to Org (Pending)
            organization.stripeSubscriptionId = subscription.id;
            await organization.save();
            
            // 5. Return Client Secret from the Invoice's Payment Intent
            const invoice = subscription.latest_invoice;
            const paymentIntent = invoice.payment_intent;

            return {
                clientSecret: paymentIntent.client_secret,
                amount: price.unit_amount / 100,
                currency: price.currency || 'usd',
                subscriptionId: subscription.id
            };
        } catch (error) {
            console.error('Error creating subscription:', error);
            throw error;
        }
    }

    /**
     * Finalize Payment Intent and create subscription
     * Called after frontend confirms payment
     */
    async finalizePaymentIntent(paymentIntentId, organization) {
        try {
            // 1. Retrieve Payment Intent to confirm success
            const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId);
            
            if (paymentIntent.status !== 'succeeded') {
                throw new Error('Payment has not succeeded yet');
            }

            // 2. Identify Subscription
            // The PI from an invoice generally has 'invoice' in metadata or we can find it via invoice
            let subscriptionId = organization.stripeSubscriptionId;
            
            // If we can't find it on org, try to find it from the invoice
            if (!subscriptionId && paymentIntent.invoice) {
                const invoice = await getStripe().invoices.retrieve(paymentIntent.invoice);
                subscriptionId = invoice.subscription;
            }

            if (!subscriptionId) {
                throw new Error('No subscription found for this payment');
            }

            // 3. Activate Subscription (if needed) & Sync DB
            // With 'default_incomplete', a successful payment automatically activates the sub
            const subscription = await getStripe().subscriptions.retrieve(subscriptionId);

            if (subscription.status !== 'active' && subscription.status !== 'trialing') {
                 // Should be active now since payment succeeded
                 console.warn(`Subscription ${subscriptionId} status is ${subscription.status} after payment`);
            }

            // 4. Update Organization
            const priceId = subscription.items.data[0].price.id;
            
            // Determine plan type from metadata, or match price ID to Plan
            let planType = subscription.metadata.type;
            
            if (!planType || planType === 'subscription') {
                // Metadata might be old or generic, try to find plan by price
                const plan = PLANS.find(p => p.stripePriceIdMonthly === priceId);
                planType = plan ? (plan.type || plan.name.toLowerCase()) : 'pro';
            }

            // Final sanity check
            if (!['starter', 'pro', 'enterprise'].includes(planType)) {
                console.warn(`Invalid plan type '${planType}' detected. Defaulting to 'pro'`);
                planType = 'pro';
            }

            // Find the plan config to get limits
            const planConfig = PLANS.find(p => (p.type || p.name.toLowerCase()) === planType);
            
            organization.plan = planType;
            organization.planStatus = 'active';
            organization.stripeSubscriptionId = subscription.id;
            organization.stripeCustomerId = subscription.customer;
            
            // Update limits based on the new plan
            if (planConfig && planConfig.limits) {
                organization.limits = {
                    maxUsers: planConfig.limits.maxUsers,
                    maxDocuments: planConfig.limits.maxDocuments,
                    maxTokensPerMonth: planConfig.limits.maxTokensPerMonth,
                    customIntegrations: planConfig.limits.customIntegrations || false,
                    prioritySupport: planConfig.limits.prioritySupport || false,
                    ssoEnabled: planConfig.limits.ssoEnabled || false,
                    apiAccess: planConfig.limits.apiAccess || false
                };
            }

            // Sync billing period dates
            organization.currentPeriodStart = new Date(subscription.current_period_start * 1000);
            organization.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
            organization.cancelAtPeriodEnd = subscription.cancel_at_period_end;
            
            await organization.save();

            // 5. Save Payment/Invoice record to database
            let paymentRecord = null;
            if (paymentIntent.invoice) {
                try {
                    const { default: Payment } = await import('../models/Payment.js');
                    const invoice = await getStripe().invoices.retrieve(paymentIntent.invoice, {
                        expand: ['payment_intent']
                    });
                    paymentRecord = await Payment.createFromStripeInvoice(organization._id, invoice);
                    console.log(`✅ Payment record created: ${paymentRecord._id}`);
                } catch (paymentError) {
                    console.error('Failed to save payment record:', paymentError);
                    // Don't fail the whole flow if payment record fails
                }
            }

            // 6. Audit log - simplified without request object
            if (this.auditService) {
                try {
                    await this.auditService.log({
                        action: 'SUBSCRIPTION_UPDATED',
                        userId: null, // No user context in this flow
                        organizationId: organization._id,
                        resource: { type: 'subscription', id: subscription.id },
                        details: { plan: planType, subscriptionId: subscription.id, status: subscription.status },
                        status: 'SUCCESS'
                    });
                } catch (auditError) {
                    console.error('Failed to write audit log:', auditError);
                }
            }

            return {
                success: true,
                subscription,
                organization
            };
        } catch (error) {
            console.error('Error finalizing payment intent:', error);
            
            if (this.auditService) {
                try {
                    await this.auditService.log({
                        action: 'SUBSCRIPTION_UPDATED',
                        userId: null,
                        organizationId: organization?._id,
                        resource: { type: 'subscription' },
                        details: { error: error.message },
                        status: 'FAILURE'
                    });
                } catch (auditError) {
                    console.error('Failed to write audit log:', auditError);
                }
            }
            
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
     * Retrieve a checkout session by ID
     */
    async retrieveCheckoutSession(sessionId) {
        try {
            return await getStripe().checkout.sessions.retrieve(sessionId);
        } catch (error) {
            console.error('Error retrieving checkout session:', error);
            throw error;
        }
    }

    /**
     * Retrieve a subscription by ID
     */
    async retrieveSubscription(subscriptionId) {
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
     * Create a refund for a payment
     */
    async createRefund(paymentIntentId, amount, reason = 'requested_by_customer') {
        try {
            return await getStripe().refunds.create({
                payment_intent: paymentIntentId,
                amount: Math.round(amount * 100), // Convert to cents
                reason,
            });
        } catch (error) {
            console.error('Error creating refund:', error);
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
                proration_behavior: 'always_invoice', // Charge immediately (industry standard)
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
                expand: ['data.payment_intent'], // Expand to get full payment intent
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

    /**
     * Get Stripe instance for direct access
     */
    getStripe() {
        return getStripe();
    }
}

// Export singleton instance
export const stripeService = new StripeService();
export default stripeService;
