export const PLANS = [
    {
        name: 'Starter',
        stripePriceIdMonthly: process.env.STRIPE_PRICE_ID_STARTER, // Loaded from ENV
        price: '$9.99',
        priceAmount: 9.99,
        period: '/mo',
        desc: 'For individuals & small teams',
        features: [
            'Up to 5 team members',
            '100 Documents Storage',
            'Role-based Access Control',
            'Secure Cloud Storage',
            'Email support'
        ],
        cta: 'Start Free Trial',
        href: '/signup?plan=starter',
        type: 'starter',
        popular: false,
        limits: {
            maxUsers: 5,
            maxDocuments: 100,
            maxTokensPerMonth: 1000000, // 1M tokens/month
            customIntegrations: false,
            prioritySupport: false,
            ssoEnabled: false,
            apiAccess: false,
        }
    },
    {
        name: 'Pro',
        stripePriceIdMonthly: process.env.STRIPE_PRICE_ID_PRO,
        price: '$49.99',
        priceAmount: 49.99,
        period: '/mo',
        desc: 'For growing teams & power users',
        features: [
            'Everything in Starter, plus:',
            'Up to 20 team members',
            '1000 Documents Storage',
            'AI Guardrails (PII & Injection)',
            'Advanced Hybrid Search',
            'Knowledge Gap Analytics',
            'Priority support'
        ],
        cta: 'Get Started',
        href: '/signup?plan=pro',
        type: 'pro',
        popular: true,
        limits: {
            maxUsers: 20,
            maxDocuments: 1000,
            maxTokensPerMonth: 10000000, // 10M tokens/month
            customIntegrations: false, // NOT included in Pro
            prioritySupport: true,
            ssoEnabled: false,
            apiAccess: false,
        }
    },
    {
        name: 'Enterprise',
        stripePriceIdMonthly: null,
        price: 'Custom',
        priceAmount: null,
        period: '',
        desc: 'For large organizations',
        features: [
            'Everything in Pro, plus:',
            'Unlimited team members',
            'Unlimited Documents Storage',
            'SSO (SAML/OIDC)',
            'Private Cloud Deployment',
            'Custom Data Connectors',
            'Dedicated Success Manager'
        ],
        cta: 'Contact Sales',
        href: '/contact?type=enterprise',
        type: 'enterprise',
        popular: false,
        limits: {
            maxUsers: -1, // Unlimited
            maxDocuments: -1, // Unlimited
            maxTokensPerMonth: -1, // Unlimited
            customIntegrations: true,
            prioritySupport: true,
            ssoEnabled: true,
            apiAccess: false,
        }
    },
];
