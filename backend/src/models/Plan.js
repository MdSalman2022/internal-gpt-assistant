import mongoose from 'mongoose';

const planSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        enum: ['trial', 'starter', 'pro', 'enterprise'],
    },
    displayName: {
        type: String,
        required: true,
    },
    description: String,

    // Stripe Price IDs
    stripePriceIdMonthly: String,
    stripePriceIdYearly: String,

    // Pricing
    monthlyPrice: {
        type: Number,
        default: 0,
    },
    yearlyPrice: {
        type: Number,
        default: 0,
    },

    // Features / Limits
    features: {
        maxUsers: { type: Number, default: 3 },
        maxDocuments: { type: Number, default: 50 },
        maxTokensPerMonth: { type: Number, default: 100000 },
        customIntegrations: { type: Boolean, default: false },
        prioritySupport: { type: Boolean, default: false },
        ssoEnabled: { type: Boolean, default: false },
        apiAccess: { type: Boolean, default: false },
        auditLogs: { type: Boolean, default: true },
        customBranding: { type: Boolean, default: false },
    },

    // Feature list for display
    featureList: [{
        text: String,
        included: { type: Boolean, default: true },
    }],

    // Ordering and visibility
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isPopular: { type: Boolean, default: false }, // For "Most Popular" badge

}, {
    timestamps: true,
});

// Static method to seed default plans
planSchema.statics.seedDefaultPlans = async function () {
    const defaultPlans = [
        {
            name: 'trial',
            displayName: 'Free Trial',
            description: 'Try all features free for 14 days',
            monthlyPrice: 0,
            yearlyPrice: 0,
            sortOrder: 0,
            features: {
                maxUsers: 3,
                maxDocuments: 50,
                maxTokensPerMonth: 100000,
                customIntegrations: false,
                prioritySupport: false,
                ssoEnabled: false,
                apiAccess: false,
                auditLogs: true,
                customBranding: false,
            },
            featureList: [
                { text: 'Up to 3 team members', included: true },
                { text: 'Up to 50 documents', included: true },
                { text: '100K tokens/month', included: true },
                { text: 'Basic AI models', included: true },
                { text: 'Email support', included: true },
                { text: 'Custom integrations', included: false },
                { text: 'Priority support', included: false },
            ],
        },
        {
            name: 'starter',
            displayName: 'Starter',
            description: 'For small teams getting started',
            monthlyPrice: 29,
            yearlyPrice: 290,
            sortOrder: 1,
            features: {
                maxUsers: 10,
                maxDocuments: 500,
                maxTokensPerMonth: 1000000,
                customIntegrations: false,
                prioritySupport: false,
                ssoEnabled: false,
                apiAccess: true,
                auditLogs: true,
                customBranding: false,
            },
            featureList: [
                { text: 'Up to 10 team members', included: true },
                { text: 'Up to 500 documents', included: true },
                { text: '1M tokens/month', included: true },
                { text: 'All AI models', included: true },
                { text: 'API access', included: true },
                { text: 'Email support', included: true },
                { text: 'Custom integrations', included: false },
                { text: 'Priority support', included: false },
            ],
        },
        {
            name: 'pro',
            displayName: 'Pro',
            description: 'For growing teams with advanced needs',
            monthlyPrice: 99,
            yearlyPrice: 990,
            sortOrder: 2,
            isPopular: true,
            features: {
                maxUsers: 50,
                maxDocuments: 5000,
                maxTokensPerMonth: 10000000,
                customIntegrations: true,
                prioritySupport: true,
                ssoEnabled: false,
                apiAccess: true,
                auditLogs: true,
                customBranding: true,
            },
            featureList: [
                { text: 'Up to 50 team members', included: true },
                { text: 'Up to 5,000 documents', included: true },
                { text: '10M tokens/month', included: true },
                { text: 'All AI models', included: true },
                { text: 'API access', included: true },
                { text: 'Custom integrations', included: true },
                { text: 'Priority support', included: true },
                { text: 'Custom branding', included: true },
                { text: 'SSO', included: false },
            ],
        },
        {
            name: 'enterprise',
            displayName: 'Enterprise',
            description: 'For large organizations with custom needs',
            monthlyPrice: 0, // Custom pricing
            yearlyPrice: 0,
            sortOrder: 3,
            features: {
                maxUsers: -1, // Unlimited
                maxDocuments: -1,
                maxTokensPerMonth: -1,
                customIntegrations: true,
                prioritySupport: true,
                ssoEnabled: true,
                apiAccess: true,
                auditLogs: true,
                customBranding: true,
            },
            featureList: [
                { text: 'Unlimited team members', included: true },
                { text: 'Unlimited documents', included: true },
                { text: 'Unlimited tokens', included: true },
                { text: 'All AI models', included: true },
                { text: 'API access', included: true },
                { text: 'Custom integrations', included: true },
                { text: 'Priority support', included: true },
                { text: 'SSO/SAML', included: true },
                { text: 'Dedicated account manager', included: true },
                { text: 'Custom SLA', included: true },
            ],
        },
    ];

    for (const plan of defaultPlans) {
        await this.findOneAndUpdate(
            { name: plan.name },
            plan,
            { upsert: true, new: true }
        );
    }

    console.log('✅ Default plans seeded');
};

// Get all active plans for pricing page
planSchema.statics.getActivePlans = async function () {
    return this.find({ isActive: true }).sort({ sortOrder: 1 });
};

const Plan = mongoose.model('Plan', planSchema);

export default Plan;
