import { Organization, Subscription, Plan, User } from '../models/index.js';
import { stripeService } from '../services/stripeService.js';
import { auditService } from '../services/index.js';
import config from '../config/index.js';

export default async function subscriptionsRoutes(fastify) {
    // All routes require authentication
    fastify.addHook('preHandler', async (request, reply) => {
        if (!request.session?.userId) {
            return reply.status(401).send({ error: 'Authentication required' });
        }
    });

    /**
     * GET /plans - Get all available plans
     */
    fastify.get('/plans', async (request, reply) => {
        const plans = await Plan.getActivePlans();
        return { plans };
    });

    /**
     * GET /current - Get current organization's subscription
     */
    fastify.get('/current', async (request, reply) => {
        const user = await User.findById(request.session.userId);
        if (!user?.organizationId) {
            return { subscription: null, organization: null };
        }

        const organization = await Organization.findById(user.organizationId);
        const subscription = await Subscription.findOne({
            organizationId: user.organizationId,
            status: { $in: ['active', 'trialing', 'past_due'] }
        });

        return {
            organization: {
                _id: organization._id,
                name: organization.name,
                plan: organization.plan,
                planStatus: organization.planStatus,
                trialEndsAt: organization.trialEndsAt,
                limits: organization.limits,
                usage: organization.usage,
            },
            subscription: subscription ? {
                plan: subscription.plan,
                status: subscription.status,
                currentPeriodEnd: subscription.currentPeriodEnd,
                cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            } : null,
        };
    });

    /**
     * POST /create-checkout - Create Stripe checkout session
     */
    fastify.post('/create-checkout', async (request, reply) => {
        const { priceId, plan } = request.body;
        const user = await User.findById(request.session.userId);

        if (!user?.organizationId) {
            return reply.status(400).send({ error: 'You must be part of an organization to subscribe' });
        }

        // Check org role - only owner/admin can manage billing
        if (!['owner', 'admin'].includes(user.orgRole)) {
            return reply.status(403).send({ error: 'Only organization owners and admins can manage billing' });
        }

        const organization = await Organization.findById(user.organizationId);
        if (!organization) {
            return reply.status(404).send({ error: 'Organization not found' });
        }

        // Create Stripe customer if doesn't exist
        if (!organization.stripeCustomerId) {
            const customer = await stripeService.createCustomer(organization, user);
            organization.stripeCustomerId = customer.id;
            await organization.save();
        }

        const successUrl = `${config.frontendUrl}/settings/billing?success=true&session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${config.frontendUrl}/settings/billing?cancelled=true`;

        const session = await stripeService.createCheckoutSession(
            organization,
            priceId,
            successUrl,
            cancelUrl
        );

        // Audit log
        auditService.log(request, 'CHECKOUT_STARTED', { type: 'subscription' }, {
            plan,
            priceId,
            organizationId: organization._id.toString(),
        });

        return { sessionId: session.id, url: session.url };
    });

    /**
     * POST /portal - Create Stripe billing portal session
     */
    fastify.post('/portal', async (request, reply) => {
        const user = await User.findById(request.session.userId);

        if (!user?.organizationId) {
            return reply.status(400).send({ error: 'Organization required' });
        }

        const organization = await Organization.findById(user.organizationId);
        if (!organization?.stripeCustomerId) {
            return reply.status(400).send({ error: 'No billing account found' });
        }

        const returnUrl = `${config.frontendUrl}/settings/billing`;
        const session = await stripeService.createPortalSession(
            organization.stripeCustomerId,
            returnUrl
        );

        return { url: session.url };
    });

    /**
     * GET /invoices - Get invoice history
     */
    fastify.get('/invoices', async (request, reply) => {
        const user = await User.findById(request.session.userId);

        if (!user?.organizationId) {
            return { invoices: [] };
        }

        const organization = await Organization.findById(user.organizationId);
        if (!organization?.stripeCustomerId) {
            return { invoices: [] };
        }

        const invoices = await stripeService.getInvoices(organization.stripeCustomerId, 20);

        return {
            invoices: invoices.map(inv => ({
                id: inv.id,
                number: inv.number,
                amount: inv.amount_paid / 100,
                currency: inv.currency,
                status: inv.status,
                created: new Date(inv.created * 1000),
                hostedUrl: inv.hosted_invoice_url,
                pdfUrl: inv.invoice_pdf,
            })),
        };
    });

    /**
     * POST /cancel - Cancel subscription
     */
    fastify.post('/cancel', async (request, reply) => {
        const user = await User.findById(request.session.userId);

        if (!['owner', 'admin'].includes(user.orgRole)) {
            return reply.status(403).send({ error: 'Only owners and admins can cancel subscriptions' });
        }

        const organization = await Organization.findById(user.organizationId);
        if (!organization?.stripeSubscriptionId) {
            return reply.status(400).send({ error: 'No active subscription' });
        }

        await stripeService.cancelSubscription(organization.stripeSubscriptionId, true);

        // Update local subscription record
        await Subscription.findOneAndUpdate(
            { stripeSubscriptionId: organization.stripeSubscriptionId },
            { cancelAtPeriodEnd: true }
        );

        auditService.log(request, 'SUBSCRIPTION_CANCELLED', { type: 'subscription' }, {
            organizationId: organization._id.toString(),
        });

        return { success: true, message: 'Subscription will be cancelled at end of billing period' };
    });

    /**
     * POST /reactivate - Reactivate cancelled subscription
     */
    fastify.post('/reactivate', async (request, reply) => {
        const user = await User.findById(request.session.userId);

        if (!['owner', 'admin'].includes(user.orgRole)) {
            return reply.status(403).send({ error: 'Only owners and admins can reactivate subscriptions' });
        }

        const organization = await Organization.findById(user.organizationId);
        if (!organization?.stripeSubscriptionId) {
            return reply.status(400).send({ error: 'No subscription to reactivate' });
        }

        await stripeService.reactivateSubscription(organization.stripeSubscriptionId);

        await Subscription.findOneAndUpdate(
            { stripeSubscriptionId: organization.stripeSubscriptionId },
            { cancelAtPeriodEnd: false }
        );

        auditService.log(request, 'SUBSCRIPTION_REACTIVATED', { type: 'subscription' }, {
            organizationId: organization._id.toString(),
        });

        return { success: true, message: 'Subscription reactivated' };
    });

    /**
     * POST /webhook - Stripe webhook handler (no auth required)
     */
    fastify.post('/webhook', {
        config: {
            rawBody: true,
        },
        preHandler: (request, reply, done) => {
            // Skip auth for webhooks
            done();
        },
    }, async (request, reply) => {
        const sig = request.headers['stripe-signature'];
        let event;

        try {
            event = stripeService.constructWebhookEvent(
                request.rawBody,
                sig,
                config.stripe.webhookSecret
            );
        } catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            return reply.status(400).send({ error: 'Webhook signature verification failed' });
        }

        // Handle the event
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                await handleCheckoutComplete(session);
                break;
            }
            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                await handleSubscriptionUpdate(subscription);
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                await handleSubscriptionCancelled(subscription);
                break;
            }
            case 'invoice.paid': {
                const invoice = event.data.object;
                await handleInvoicePaid(invoice);
                break;
            }
            case 'invoice.payment_failed': {
                const invoice = event.data.object;
                await handlePaymentFailed(invoice);
                break;
            }
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return { received: true };
    });
}

// Webhook handlers
async function handleCheckoutComplete(session) {
    const organizationId = session.metadata?.organizationId;
    if (!organizationId) return;

    const organization = await Organization.findById(organizationId);
    if (!organization) return;

    // Update organization with Stripe customer ID if not set
    if (!organization.stripeCustomerId && session.customer) {
        organization.stripeCustomerId = session.customer;
    }

    if (session.subscription) {
        organization.stripeSubscriptionId = session.subscription;
    }

    await organization.save();
    console.log(`✅ Checkout completed for org: ${organization.name}`);
}

async function handleSubscriptionUpdate(stripeSubscription) {
    const organizationId = stripeSubscription.metadata?.organizationId;
    if (!organizationId) return;

    const organization = await Organization.findById(organizationId);
    if (!organization) return;

    // Determine plan from price
    const priceId = stripeSubscription.items.data[0]?.price?.id;
    let plan = 'starter';
    if (priceId?.includes('pro')) plan = 'pro';
    if (priceId?.includes('enterprise')) plan = 'enterprise';

    // Update organization
    organization.stripeSubscriptionId = stripeSubscription.id;
    organization.plan = plan;
    organization.planStatus = stripeSubscription.status;
    organization.updatePlanLimits();
    await organization.save();

    // Update or create subscription record
    await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: stripeSubscription.id },
        {
            organizationId: organization._id,
            stripeSubscriptionId: stripeSubscription.id,
            stripeCustomerId: stripeSubscription.customer,
            stripePriceId: priceId,
            plan,
            status: stripeSubscription.status,
            currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
            lastWebhookEvent: 'subscription.updated',
            lastWebhookAt: new Date(),
        },
        { upsert: true, new: true }
    );

    console.log(`✅ Subscription updated for org: ${organization.name}, plan: ${plan}`);
}

async function handleSubscriptionCancelled(stripeSubscription) {
    const sub = await Subscription.findOne({ stripeSubscriptionId: stripeSubscription.id });
    if (!sub) return;

    sub.status = 'cancelled';
    sub.endedAt = new Date();
    await sub.save();

    // Update organization
    const organization = await Organization.findById(sub.organizationId);
    if (organization) {
        organization.planStatus = 'cancelled';
        organization.plan = 'trial'; // Downgrade to trial
        organization.updatePlanLimits();
        await organization.save();
    }

    console.log(`❌ Subscription cancelled for org: ${organization?.name}`);
}

async function handleInvoicePaid(invoice) {
    const sub = await Subscription.findOne({ stripeCustomerId: invoice.customer });
    if (!sub) return;

    sub.addPayment(invoice);
    await sub.save();

    console.log(`💰 Payment received: $${invoice.amount_paid / 100}`);
}

async function handlePaymentFailed(invoice) {
    const organization = await Organization.findOne({ stripeCustomerId: invoice.customer });
    if (!organization) return;

    organization.planStatus = 'past_due';
    await organization.save();

    console.log(`⚠️ Payment failed for org: ${organization.name}`);
}
