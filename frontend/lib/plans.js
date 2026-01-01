export const PLANS = [
    {
        name: 'Starter',
        stripePriceIdMonthly: 'price_1Qd5R1F1Uf7jD9hZ8G3K5L4M', // Replace with your actual Starter Price ID
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
        popular: false
    },
    {
        name: 'Pro',
        stripePriceIdMonthly: 'price_1Qd5S2F1Uf7jD9hZ9H4L6M5N', // Replace with your actual Pro Price ID
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
        popular: true
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
        popular: false
    },
];
