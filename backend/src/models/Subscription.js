import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    stripePaymentIntentId: String,
    stripeInvoiceId: String,
    amount: Number,
    currency: { type: String, default: 'usd' },
    status: {
        type: String,
        enum: ['succeeded', 'pending', 'failed', 'refunded'],
    },
    paidAt: Date,
    invoiceUrl: String,
    invoicePdf: String,
}, { _id: false });

const subscriptionSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true,
    },

    // Stripe IDs
    stripeSubscriptionId: {
        type: String,
        required: true,
        unique: true,
    },
    stripeCustomerId: {
        type: String,
        required: true,
    },
    stripePriceId: String,

    // Plan info
    plan: {
        type: String,
        enum: ['starter', 'pro', 'enterprise'],
        required: true,
    },
    billingInterval: {
        type: String,
        enum: ['month', 'year'],
        default: 'month',
    },

    // Status
    status: {
        type: String,
        enum: ['active', 'past_due', 'cancelled', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid'],
        default: 'active',
    },

    // Billing period
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: { type: Boolean, default: false },
    cancelledAt: Date,
    endedAt: Date,

    // Trial info (if upgrading from trial)
    trialStart: Date,
    trialEnd: Date,

    // Payment history
    payments: [paymentSchema],

    // Metadata
    lastWebhookEvent: String,
    lastWebhookAt: Date,
}, {
    timestamps: true,
});

// Get the most recent payment
subscriptionSchema.methods.getLastPayment = function () {
    if (!this.payments || this.payments.length === 0) return null;
    return this.payments[this.payments.length - 1];
};

// Add a payment record
subscriptionSchema.methods.addPayment = function (paymentData) {
    this.payments.push({
        stripePaymentIntentId: paymentData.payment_intent,
        stripeInvoiceId: paymentData.id,
        amount: paymentData.amount_paid / 100, // Convert from cents
        currency: paymentData.currency,
        status: paymentData.status === 'paid' ? 'succeeded' : paymentData.status,
        paidAt: new Date(paymentData.status_transitions?.paid_at * 1000 || Date.now()),
        invoiceUrl: paymentData.hosted_invoice_url,
        invoicePdf: paymentData.invoice_pdf,
    });
};

// Calculate MRR (Monthly Recurring Revenue) for this subscription
subscriptionSchema.methods.getMRR = function () {
    const prices = {
        starter: { month: 29, year: 290 },
        pro: { month: 99, year: 990 },
        enterprise: { month: 499, year: 4990 },
    };
    const planPrices = prices[this.plan] || prices.starter;

    if (this.billingInterval === 'year') {
        return planPrices.year / 12;
    }
    return planPrices.month;
};

// Static method to get total MRR across all active subscriptions
subscriptionSchema.statics.getTotalMRR = async function () {
    const activeSubscriptions = await this.find({ status: 'active' });
    return activeSubscriptions.reduce((total, sub) => total + sub.getMRR(), 0);
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
