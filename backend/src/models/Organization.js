import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    logo: {
        type: String,
        default: null,
    },

    // Subscription
    plan: {
        type: String,
        enum: ['trial', 'starter', 'pro', 'enterprise'],
        default: 'trial',
    },
    planStatus: {
        type: String,
        enum: ['active', 'past_due', 'cancelled', 'trialing', 'incomplete'],
        default: 'trialing',
    },
    trialEndsAt: {
        type: Date,
        default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    },

    // Stripe
    stripeCustomerId: {
        type: String,
        default: null,
    },
    stripeSubscriptionId: {
        type: String,
        default: null,
    },

    // Limits (based on plan)
    limits: {
        maxUsers: { type: Number, default: 3 },
        maxDocuments: { type: Number, default: 50 },
        maxTokensPerMonth: { type: Number, default: 100000 },
        customIntegrations: { type: Boolean, default: false },
        prioritySupport: { type: Boolean, default: false },
        ssoEnabled: { type: Boolean, default: false },
        apiAccess: { type: Boolean, default: false },
    },

    // Current Usage
    usage: {
        currentUsers: { type: Number, default: 1 },
        currentDocuments: { type: Number, default: 0 },
        monthlyTokens: { type: Number, default: 0 },
        lastTokenReset: { type: Date, default: Date.now },
    },

    // Settings
    settings: {
        allowedDomains: [{ type: String }], // For email domain restrictions
        requireApproval: { type: Boolean, default: true }, // Require admin approval for new members
    },

    // Signup Tracking
    industry: {
        type: String,
        default: null,
    },
    billingInterval: {
        type: String,
        enum: ['month', 'year'],
        default: 'month',
    },
    signupSource: {
        type: String,
        enum: ['direct', 'pricing', 'demo', 'referral', 'organic'],
        default: 'direct',
    },
    signupPlan: {
        type: String, // The plan they originally signed up for
        default: null,
    },
    convertedAt: {
        type: Date, // When trial converted to paid
        default: null,
    },
    referralCode: {
        type: String,
        default: null,
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true,
});

// Generate slug from name
organizationSchema.pre('save', function (next) {
    if (this.isModified('name') && !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }
    next();
});

// Static method to get plan limits
organizationSchema.statics.getPlanLimits = function (plan) {
    const limits = {
        trial: {
            maxUsers: 3,
            maxDocuments: 50,
            maxTokensPerMonth: 100000,
            customIntegrations: false,
            prioritySupport: false,
            ssoEnabled: false,
            apiAccess: false,
        },
        starter: {
            maxUsers: 10,
            maxDocuments: 500,
            maxTokensPerMonth: 1000000,
            customIntegrations: false,
            prioritySupport: false,
            ssoEnabled: false,
            apiAccess: true,
        },
        pro: {
            maxUsers: 50,
            maxDocuments: 5000,
            maxTokensPerMonth: 10000000,
            customIntegrations: true,
            prioritySupport: true,
            ssoEnabled: false,
            apiAccess: true,
        },
        enterprise: {
            maxUsers: -1, // Unlimited
            maxDocuments: -1,
            maxTokensPerMonth: -1,
            customIntegrations: true,
            prioritySupport: true,
            ssoEnabled: true,
            apiAccess: true,
        },
    };
    return limits[plan] || limits.trial;
};

// Update limits when plan changes
organizationSchema.methods.updatePlanLimits = function () {
    this.limits = this.constructor.getPlanLimits(this.plan);
};

// Check if organization can add more users
organizationSchema.methods.canAddUser = function () {
    if (this.limits.maxUsers === -1) return true;
    return this.usage.currentUsers < this.limits.maxUsers;
};

// Check if organization can add more documents
organizationSchema.methods.canAddDocument = function () {
    if (this.limits.maxDocuments === -1) return true;
    return this.usage.currentDocuments < this.limits.maxDocuments;
};

// Check if organization has tokens remaining
organizationSchema.methods.hasTokensRemaining = function (tokensNeeded = 0) {
    if (this.limits.maxTokensPerMonth === -1) return true;
    return (this.usage.monthlyTokens + tokensNeeded) <= this.limits.maxTokensPerMonth;
};

// Check if subscription/trial is active
organizationSchema.methods.isActive = function () {
    if (this.planStatus === 'active') return true;
    if (this.planStatus === 'trialing' && this.trialEndsAt > new Date()) return true;
    return false;
};

const Organization = mongoose.model('Organization', organizationSchema);

export default Organization;
