import { Organization, Subscription, Plan, User, Payment } from '../models/index.js';
import { stripeService } from '../services/stripeService.js';
import { auditService } from '../services/index.js';
import config from '../config/index.js';

export default async function subscriptionsRoutes(fastify) {
    // All routes require authentication except /plans
    fastify.addHook('preHandler', async (request, reply) => {
        const path = request.routerPath || request.url.split('?')[0];
        if (path?.endsWith('/plans') || path?.endsWith('/webhook')) {
            return; // Skip auth for public routes
        }
        if (!request.session?.userId) {
            return reply.status(401).send({ error: 'Authentication required' });
        }
    });

    /**
     * GET /plans - Get all available plans from database
     */
    fastify.get('/plans', async (request, reply) => {
        // Fetch plans from database
        const plans = await Plan.find({ isActive: true }).sort({ displayOrder: 1 });
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

        // Get customer credit balance from Stripe
        let creditBalance = { balance: 0, balanceDisplay: '$0.00' };
        if (organization?.stripeCustomerId) {
            creditBalance = await stripeService.getCustomerBalance(organization.stripeCustomerId);
        }

        // Build subscription from Organization's embedded fields
        const subscription = organization.stripeSubscriptionId ? {
            plan: organization.plan,
            status: organization.planStatus,
            currentPeriodStart: organization.currentPeriodStart,
            currentPeriodEnd: organization.currentPeriodEnd,
            cancelAtPeriodEnd: organization.cancelAtPeriodEnd,
            cancelledAt: organization.cancelledAt
        } : null;

        return {
            organization: {
                _id: organization._id,
                name: organization.name,
                plan: organization.plan,
                planStatus: organization.planStatus,
                trialEndsAt: organization.trialEndsAt,
                limits: organization.limits,
                usage: organization.usage,
                stripeCustomerId: organization.stripeCustomerId,
            },
            subscription,
            creditBalance,
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
     * POST /upgrade - Upgrade/downgrade existing subscription
     */
    fastify.post('/upgrade', async (request, reply) => {
        const { newPriceId, newPlan } = request.body;
        const user = await User.findById(request.session.userId);

        if (!user?.organizationId) {
            return reply.status(400).send({ error: 'Organization required' });
        }

        if (!['owner', 'admin'].includes(user.orgRole)) {
            return reply.status(403).send({ error: 'Only owners and admins can manage billing' });
        }

        const organization = await Organization.findById(user.organizationId);
        if (!organization?.stripeSubscriptionId) {
            return reply.status(400).send({ error: 'No active subscription to upgrade. Please use checkout for new subscriptions.' });
        }

        try {
            // Update the subscription in Stripe (handles proration automatically)
            const updatedSubscription = await stripeService.updateSubscription(
                organization.stripeSubscriptionId,
                newPriceId
            );

            // Update organization plan and billing period
            organization.plan = newPlan || 'starter';
            organization.planStatus = updatedSubscription.status;
            organization.currentPeriodStart = new Date(updatedSubscription.current_period_start * 1000);
            organization.currentPeriodEnd = new Date(updatedSubscription.current_period_end * 1000);
            organization.updatePlanLimits();
            await organization.save();

            // Fetch the proration invoice and store using Payment model
            if (updatedSubscription.latest_invoice) {
                try {
                    const invoice = await stripeService.getStripe().invoices.retrieve(
                        updatedSubscription.latest_invoice,
                        { expand: ['payment_intent'] }
                    );
                    if (invoice.status === 'paid') {
                        await Payment.createFromStripeInvoice(organization._id, invoice);
                    }
                } catch (invoiceError) {
                    console.error('Error fetching proration invoice:', invoiceError);
                }
            }

            auditService.log(request, 'SUBSCRIPTION_UPDATED', { type: 'subscription' }, {
                organizationId: organization._id.toString(),
                oldPlan: organization.plan,
                newPlan,
            });

            return {
                success: true,
                message: 'Subscription updated successfully',
                newPlan,
                currentPeriodEnd: organization.currentPeriodEnd,
            };
        } catch (error) {
            console.error('Error upgrading subscription:', error);
            return reply.status(500).send({ error: 'Failed to upgrade subscription' });
        }
    });

    /**
     * POST /verify-session - Manually verify checkout session (for localhost)
     */
    fastify.post('/verify-session', async (request, reply) => {
        const { sessionId } = request.body;
        const user = await User.findById(request.session.userId);

        if (!user?.organizationId) {
            return reply.status(400).send({ error: 'Organization required' });
        }

        if (!sessionId) {
            return reply.status(400).send({ error: 'Session ID required' });
        }

        try {
            // Retrieve session from Stripe
            const session = await stripeService.retrieveCheckoutSession(sessionId);

            if (session.payment_status === 'paid') {
                // Manually trigger the completion handler
                // We add the organizationId metadata if missing (though it should be there)
                session.metadata = { ...session.metadata, organizationId: user.organizationId.toString() };

                await handleCheckoutComplete(session);

                // If subscription exists, fetch it too to ensure full sync
                if (session.subscription) {
                    const subscription = await stripeService.retrieveSubscription(session.subscription);

                    // CRITICAL: Ensure we have the metadata on the subscription object too
                    subscription.metadata = { ...subscription.metadata, organizationId: user.organizationId.toString() };

                    await handleSubscriptionUpdate(subscription);

                    // Also fetch and store the first invoice/payment using Payment model
                    try {
                        const organization = await Organization.findById(user.organizationId);
                        if (organization?.stripeCustomerId) {
                            const invoices = await stripeService.getInvoices(organization.stripeCustomerId, 1);
                            if (invoices && invoices.length > 0 && invoices[0].status === 'paid') {
                                // Use Payment model - handles duplicates automatically
                                await Payment.createFromStripeInvoice(organization._id, invoices[0]);
                            }
                        }
                    } catch (invoiceError) {
                        console.error('Error fetching initial invoice:', invoiceError);
                        // Non-critical, continue anyway
                    }
                }

                return { success: true, message: 'Subscription verified and updated' };
            } else {
                return { success: false, status: session.payment_status };
            }
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Failed to verify session' });
        }
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
     * GET /invoices - Get invoice history from Payment collection
     */
    fastify.get('/invoices', async (request, reply) => {
        const user = await User.findById(request.session.userId);

        if (!user?.organizationId) {
            return { invoices: [] };
        }

        const organization = await Organization.findById(user.organizationId);

        // Fetch payments from Payment collection
        let payments = await Payment.getForOrganization(user.organizationId, 20);

        // If no payments locally, try syncing from Stripe
        if (payments.length === 0 && organization?.stripeCustomerId) {
            try {
                const stripeInvoices = await stripeService.getInvoices(organization.stripeCustomerId, 10);

                if (stripeInvoices && stripeInvoices.length > 0) {
                    for (const invoice of stripeInvoices) {
                        if (invoice.status === 'paid') {
                            await Payment.createFromStripeInvoice(organization._id, invoice);
                        }
                    }
                    // Re-fetch after sync
                    payments = await Payment.getForOrganization(user.organizationId, 20);
                }
            } catch (error) {
                console.error('Error syncing invoices from Stripe:', error);
            }
        }

        // Map to invoice format
        return {
            invoices: payments.map(payment => ({
                id: payment.stripeInvoiceId || payment._id?.toString(),
                number: payment.invoiceNumber || payment.stripeInvoiceId?.slice(-8) || 'N/A',
                amount: payment.amount,
                currency: payment.currency?.toUpperCase() || 'USD',
                status: payment.status === 'succeeded' ? 'paid' : payment.status,
                created: payment.paidAt || payment.createdAt,
                hostedUrl: payment.invoiceUrl,
                pdfUrl: payment.invoicePdf,
            }))
        };
    });

    /**
     * GET /check-refund-eligibility - Check if user is eligible for refund
     */
    fastify.get('/check-refund-eligibility', async (request, reply) => {
        const user = await User.findById(request.session.userId);

        if (!user?.organizationId) {
            return { eligible: false };
        }

        const organization = await Organization.findById(user.organizationId);

        // Check if has active subscription
        if (!organization?.stripeSubscriptionId || !organization.currentPeriodStart) {
            return { eligible: false };
        }

        // Calculate days since subscription started using Organization fields
        const currentPeriodStart = new Date(organization.currentPeriodStart);
        const currentPeriodEnd = new Date(organization.currentPeriodEnd);
        const now = new Date();

        const daysUsed = Math.ceil((now - currentPeriodStart) / (1000 * 60 * 60 * 24));
        const totalDays = Math.ceil((currentPeriodEnd - currentPeriodStart) / (1000 * 60 * 60 * 24));

        // Check if within 3-day refund window
        const eligible = daysUsed <= 3;

        if (!eligible) {
            return {
                eligible: false,
                daysUsed,
                periodEnd: organization.currentPeriodEnd
            };
        }

        // Get last payment from Payment collection
        const lastPayment = await Payment.findOne({
            organizationId: organization._id,
            status: 'paid'
        }).sort({ paidAt: -1 });

        const amountPaid = lastPayment?.amount || 0;

        const chargeAmount = (amountPaid / totalDays) * daysUsed;
        const refundAmount = amountPaid - chargeAmount;

        return {
            eligible: true,
            daysUsed,
            totalDays,
            amountPaid,
            chargeAmount: Math.round(chargeAmount * 100) / 100,
            refundAmount: Math.round(refundAmount * 100) / 100,
            periodEnd: organization.currentPeriodEnd,
            lastPaymentId: lastPayment?.stripeInvoiceId
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

        // Calculate days since subscription started using Organization fields
        const currentPeriodStart = organization.currentPeriodStart || new Date();
        const currentPeriodEnd = organization.currentPeriodEnd || new Date();
        const now = new Date();
        const daysUsed = Math.ceil((now - new Date(currentPeriodStart)) / (1000 * 60 * 60 * 24));

        // Check if within 3-day refund window
        if (daysUsed <= 3) {
            try {
                // Get last payment from Payment collection for refund
                const lastPayment = await Payment.findOne({
                    organizationId: organization._id,
                    status: 'paid'
                }).sort({ paidAt: -1 });

                console.log('🔍 Refund Debug - Last Payment:', JSON.stringify(lastPayment, null, 2));

                if (lastPayment?.stripePaymentIntentId) {
                    // Calculate prorated refund
                    const totalDays = Math.ceil((new Date(currentPeriodEnd) - new Date(currentPeriodStart)) / (1000 * 60 * 60 * 24));
                    const amountPaid = lastPayment.amount;
                    const chargeAmount = (amountPaid / totalDays) * daysUsed;
                    const refundAmount = amountPaid - chargeAmount;

                    console.log('💰 Refund Calculation:', {
                        daysUsed,
                        totalDays,
                        amountPaid,
                        chargeAmount,
                        refundAmount
                    });

                    // Create refund
                    if (refundAmount > 0) {
                        console.log(`🔄 Creating refund: Payment Intent ${lastPayment.stripePaymentIntentId}, Amount: $${refundAmount}`);
                        const refundResult = await stripeService.createRefund(lastPayment.stripePaymentIntentId, refundAmount);
                        console.log('✅ Refund created successfully:', refundResult.id);

                        // Update Payment record with refund info
                        lastPayment.status = 'refunded';
                        lastPayment.refundedAmount = refundAmount;
                        lastPayment.refundedAt = new Date();
                        lastPayment.refundReason = 'Cancelled within refund window';
                        await lastPayment.save();
                    } else {
                        console.log('⚠️ Refund amount is 0 or negative, skipping refund');
                    }
                } else {
                    console.log('❌ No payment intent found in last payment. Cannot process refund.');
                }

                // Cancel subscription immediately (not at period end)
                await stripeService.cancelSubscription(organization.stripeSubscriptionId, false);

                // Update Organization - clear subscription
                organization.plan = 'trial';
                organization.planStatus = 'cancelled';
                organization.stripeSubscriptionId = null;
                organization.currentPeriodStart = null;
                organization.currentPeriodEnd = null;
                organization.cancelAtPeriodEnd = false;
                organization.cancelledAt = new Date();
                organization.updatePlanLimits();
                await organization.save();

                auditService.log(request, 'SUBSCRIPTION_CANCELLED', { type: 'subscription' }, {
                    organizationId: organization._id.toString(),
                    refundIssued: true,
                    daysUsed
                });

                return {
                    success: true,
                    message: 'Subscription cancelled and refund issued',
                    refunded: true
                };
            } catch (error) {
                console.error('Error processing immediate cancellation:', error);
                return reply.status(500).send({ error: 'Failed to process cancellation' });
            }
        } else {
            // After 3 days - cancel at period end
            await stripeService.cancelSubscription(organization.stripeSubscriptionId, true);

            // Update Organization
            organization.cancelAtPeriodEnd = true;
            await organization.save();

            auditService.log(request, 'SUBSCRIPTION_CANCELLED', { type: 'subscription' }, {
                organizationId: organization._id.toString(),
            });

            return { success: true, message: 'Subscription will be cancelled at end of billing period' };
        }
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

    // Determine plan from price - look up in Plan collection
    const priceId = stripeSubscription.items.data[0]?.price?.id;
    let plan = 'starter';

    const planDoc = await Plan.findOne({ stripePriceIdMonthly: priceId });
    if (planDoc) {
        plan = planDoc.type;
    } else {
        // Fallback to string matching
        if (priceId?.toLowerCase().includes('pro')) plan = 'pro';
        if (priceId?.toLowerCase().includes('enterprise')) plan = 'enterprise';
    }

    // Update organization with all subscription fields
    organization.stripeSubscriptionId = stripeSubscription.id;
    organization.plan = plan;
    organization.planStatus = stripeSubscription.status;
    organization.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
    organization.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
    organization.cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;
    organization.updatePlanLimits();
    await organization.save();

    console.log(`✅ Subscription updated for org: ${organization.name}, plan: ${plan}`);
}

async function handleSubscriptionCancelled(stripeSubscription) {
    // Find organization by subscription ID
    const organization = await Organization.findOne({
        stripeSubscriptionId: stripeSubscription.id
    });
    if (!organization) return;

    // Update organization - revert to trial
    organization.plan = 'trial';
    organization.planStatus = 'cancelled';
    organization.stripeSubscriptionId = null;
    organization.currentPeriodStart = null;
    organization.currentPeriodEnd = null;
    organization.cancelAtPeriodEnd = false;
    organization.cancelledAt = new Date();
    organization.updatePlanLimits();
    await organization.save();

    console.log(`❌ Subscription cancelled for org: ${organization.name}`);
}

async function handleInvoicePaid(invoice) {
    // Find organization by stripe customer ID
    const organization = await Organization.findOne({
        stripeCustomerId: invoice.customer
    });
    if (!organization) return;

    // Create payment record using Payment model
    try {
        await Payment.createFromStripeInvoice(organization._id, invoice);
        console.log(`💰 Payment received: $${invoice.amount_paid / 100}`);
    } catch (error) {
        console.error('Error creating payment record:', error);
    }
}

async function handlePaymentFailed(invoice) {
    const organization = await Organization.findOne({ stripeCustomerId: invoice.customer });
    if (!organization) return;

    organization.planStatus = 'past_due';
    await organization.save();

    console.log(`⚠️ Payment failed for org: ${organization.name}`);
}
