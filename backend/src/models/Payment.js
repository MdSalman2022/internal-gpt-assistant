import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },

    // Stripe IDs (unique to prevent duplicates)
    stripeInvoiceId: {
        type: String,
        unique: true,
        sparse: true // Allows null values
    },
    stripePaymentIntentId: String,
    stripeChargeId: String,

    // Payment details
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'usd'
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'paid', 'failed', 'refunded', 'partially_refunded'],
        default: 'pending'
    },

    // Refund info
    refundedAmount: {
        type: Number,
        default: 0
    },
    refundedAt: Date,
    refundReason: String,

    // Invoice details
    invoiceUrl: String,
    invoicePdf: String,
    invoiceNumber: String,

    // What this payment was for
    description: String,
    planType: {
        type: String,
        enum: ['starter', 'pro', 'enterprise']
    },

    // Dates
    paidAt: Date,
    periodStart: Date,
    periodEnd: Date

}, {
    timestamps: true
});

// Indexes for common queries
paymentSchema.index({ organizationId: 1, createdAt: -1 });
paymentSchema.index({ stripePaymentIntentId: 1 });
paymentSchema.index({ status: 1 });

// Static method to add payment from Stripe invoice
paymentSchema.statics.createFromStripeInvoice = async function (organizationId, invoice) {
    // Check if already exists
    const existing = await this.findOne({ stripeInvoiceId: invoice.id });
    if (existing) return existing;

    // Handle payment_intent being string or object
    const paymentIntentId = typeof invoice.payment_intent === 'string'
        ? invoice.payment_intent
        : invoice.payment_intent?.id;

    return this.create({
        organizationId,
        stripeInvoiceId: invoice.id,
        stripePaymentIntentId: paymentIntentId,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
        status: invoice.status === 'paid' ? 'paid' : invoice.status,
        invoiceUrl: invoice.hosted_invoice_url,
        invoicePdf: invoice.invoice_pdf,
        invoiceNumber: invoice.number,
        description: invoice.lines?.data?.[0]?.description || 'Subscription payment',
        paidAt: invoice.status_transitions?.paid_at
            ? new Date(invoice.status_transitions.paid_at * 1000)
            : new Date(),
        periodStart: invoice.lines?.data?.[0]?.period?.start
            ? new Date(invoice.lines.data[0].period.start * 1000)
            : null,
        periodEnd: invoice.lines?.data?.[0]?.period?.end
            ? new Date(invoice.lines.data[0].period.end * 1000)
            : null
    });
};

// Get payments for organization
paymentSchema.statics.getForOrganization = async function (organizationId, limit = 20) {
    return this.find({ organizationId })
        .sort({ createdAt: -1 })
        .limit(limit);
};

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
