import mongoose from 'mongoose';

const planSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        unique: true,
        enum: ['trial', 'starter', 'pro', 'enterprise'],
    },
    name: {
        type: String,
        required: true,
    },
    description: String,

    // Pricing
    priceMonthly: {
        type: Number,
        default: null,
    },
    priceYearly: {
        type: Number,
        default: null,
    },
    currency: {
        type: String,
        default: 'usd',
    },

    // Stripe Price IDs
    stripePriceIdMonthly: String,
    stripePriceIdYearly: String,

    // Limits (plan capabilities)
    limits: {
        maxUsers: { type: Number, default: 3 },
        maxDocuments: { type: Number, default: 50 },
        maxTokensPerMonth: { type: Number, default: 100000 },
        customIntegrations: { type: Boolean, default: false },
        prioritySupport: { type: Boolean, default: false },
        ssoEnabled: { type: Boolean, default: false },
        apiAccess: { type: Boolean, default: false },
    },

    // Feature list for display (simple string array)
    features: [String],

    // CTA and navigation
    cta: String,
    href: String,

    // Ordering and visibility
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    popular: { type: Boolean, default: false },

}, {
    timestamps: true,
});

// Static method to seed default plans
planSchema.statics.seedDefaultPlans = async function () {
    const defaultPlans = [
        {
            type: 'trial',
            name: 'Free Trial',
            description: 'Try all features free for 14 days',
            priceMonthly: 0,
            priceYearly: 0,
            currency: 'usd',
            displayOrder: 0,
            limits: {
                maxUsers: 3,
                maxDocuments: 50,
                maxTokensPerMonth: 100000,
                customIntegrations: false,
                prioritySupport: false,
                ssoEnabled: false,
                apiAccess: false,
            },
            features: [
                'Up to 3 team members',
                'Up to 50 documents',
                '100K tokens/month',
                'Basic AI models',
                'Email support',
            ],
            cta: 'Start Free Trial',
            href: '/signup?plan=trial',
        },
        {
            type: 'starter',
            name: 'Starter',
            description: 'For individuals & small teams',
            priceMonthly: 9.99,
            priceYearly: 99.99,
            currency: 'usd',
            displayOrder: 1,
            limits: {
                maxUsers: 5,
                maxDocuments: 100,
                maxTokensPerMonth: 1000000,
                customIntegrations: false,
                prioritySupport: false,
                ssoEnabled: false,
                apiAccess: false,
            },
            features: [
                'Up to 5 team members',
                '100 Documents Storage',
                'Role-based Access Control',
                'Secure Cloud Storage',
                'Email support',
            ],
            cta: 'Start Free Trial',
            href: '/signup?plan=starter',
        },
        {
            type: 'pro',
            name: 'Pro',
            description: 'For growing teams & power users',
            priceMonthly: 49.99,
            priceYearly: 499.99,
            currency: 'usd',
            displayOrder: 2,
            popular: true,
            limits: {
                maxUsers: 20,
                maxDocuments: 1000,
                maxTokensPerMonth: 10000000,
                customIntegrations: false,
                prioritySupport: true,
                ssoEnabled: false,
                apiAccess: false,
            },
            features: [
                'Everything in Starter, plus:',
                'Up to 20 team members',
                '1000 Documents Storage',
                'AI Guardrails (PII & Injection)',
                'Advanced Hybrid Search',
                'Knowledge Gap Analytics',
                'Priority support',
            ],
            cta: 'Get Started',
            href: '/signup?plan=pro',
        },
        {
            type: 'enterprise',
            name: 'Enterprise',
            description: 'For large organizations',
            priceMonthly: null,
            priceYearly: null,
            currency: 'usd',
            displayOrder: 3,
            limits: {
                maxUsers: -1,
                maxDocuments: -1,
                maxTokensPerMonth: -1,
                customIntegrations: true,
                prioritySupport: true,
                ssoEnabled: true,
                apiAccess: true,
            },
            features: [
                'Everything in Pro, plus:',
                'Unlimited team members',
                'Unlimited Documents Storage',
                'SSO (SAML/OIDC)',
                'Private Cloud Deployment',
                'Custom Data Connectors',
                'Dedicated Success Manager',
            ],
            cta: 'Contact Sales',
            href: '/contact?type=enterprise',
        },
    ];

    for (const plan of defaultPlans) {
        await this.findOneAndUpdate(
            { type: plan.type },
            plan,
            { upsert: true, new: true }
        );
    }

    console.log('✅ Default plans seeded');
};

// Get all active plans for pricing page
planSchema.statics.getActivePlans = async function () {
    return this.find({ isActive: true }).sort({ displayOrder: 1 });
};

const Plan = mongoose.model('Plan', planSchema);

export default Plan;
