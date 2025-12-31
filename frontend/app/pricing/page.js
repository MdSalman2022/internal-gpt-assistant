'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Sparkles, Building2, ArrowRight, Calendar } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function PricingPage() {
    const router = useRouter();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [billingInterval, setBillingInterval] = useState('month');

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await fetch(`${API_URL}/api/demo/plans`);
            const data = await res.json();
            setPlans(data.plans || []);
        } catch (error) {
            console.error('Error fetching plans:', error);
            // Use default plans if API fails
            setPlans([
                {
                    name: 'trial',
                    displayName: 'Free Trial',
                    description: 'Try all features free for 14 days',
                    monthlyPrice: 0,
                    yearlyPrice: 0,
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
                    isPopular: true,
                    featureList: [
                        { text: 'Up to 50 team members', included: true },
                        { text: 'Up to 5,000 documents', included: true },
                        { text: '10M tokens/month', included: true },
                        { text: 'All AI models', included: true },
                        { text: 'API access', included: true },
                        { text: 'Custom integrations', included: true },
                        { text: 'Priority support', included: true },
                        { text: 'Custom branding', included: true },
                    ],
                },
                {
                    name: 'enterprise',
                    displayName: 'Enterprise',
                    description: 'For large organizations with custom needs',
                    monthlyPrice: 0,
                    yearlyPrice: 0,
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
                    ],
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPlan = (plan) => {
        if (plan.name === 'trial') {
            router.push('/signup?plan=trial');
        } else if (plan.name === 'enterprise') {
            router.push('/demo');
        } else {
            router.push(`/signup?plan=${plan.name}&interval=${billingInterval}`);
        }
    };

    const getPrice = (plan) => {
        if (plan.name === 'enterprise') return 'Custom';
        if (plan.name === 'trial') return 'Free';
        return billingInterval === 'year'
            ? `$${Math.round(plan.yearlyPrice / 12)}`
            : `$${plan.monthlyPrice}`;
    };

    const getSavings = (plan) => {
        if (plan.name === 'enterprise' || plan.name === 'trial') return null;
        const monthlyCost = plan.monthlyPrice * 12;
        const yearlyCost = plan.yearlyPrice;
        const savings = monthlyCost - yearlyCost;
        return savings > 0 ? Math.round((savings / monthlyCost) * 100) : 0;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            {/* Header */}
            <header className="py-6 px-4 sm:px-6 lg:px-8">
                <nav className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">InsightAI</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <a href="/login" className="text-gray-300 hover:text-white transition-colors">
                            Sign In
                        </a>
                        <a
                            href="/signup"
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                        >
                            Get Started
                        </a>
                    </div>
                </nav>
            </header>

            {/* Hero Section */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 text-center">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
                    Simple, Transparent <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Pricing</span>
                </h1>
                <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
                    Choose the perfect plan for your team. Start free and scale as you grow.
                </p>

                {/* Billing Toggle */}
                <div className="flex items-center justify-center gap-4 mb-12">
                    <span className={`text-sm ${billingInterval === 'month' ? 'text-white' : 'text-gray-400'}`}>
                        Monthly
                    </span>
                    <button
                        onClick={() => setBillingInterval(billingInterval === 'month' ? 'year' : 'month')}
                        className="relative w-14 h-7 bg-gray-700 rounded-full transition-colors"
                    >
                        <div
                            className={`absolute top-1 w-5 h-5 bg-emerald-500 rounded-full transition-all ${billingInterval === 'year' ? 'left-8' : 'left-1'
                                }`}
                        />
                    </button>
                    <span className={`text-sm ${billingInterval === 'year' ? 'text-white' : 'text-gray-400'}`}>
                        Yearly
                        <span className="ml-2 text-xs text-emerald-400">(Save up to 20%)</span>
                    </span>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="pb-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`relative bg-gray-800/50 backdrop-blur-sm border rounded-2xl p-6 flex flex-col ${plan.isPopular
                                ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                                : 'border-gray-700'
                                }`}
                        >
                            {plan.isPopular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-xs font-semibold rounded-full">
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-white mb-2">{plan.displayName}</h3>
                                <p className="text-gray-400 text-sm">{plan.description}</p>
                            </div>

                            <div className="mb-6">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold text-white">{getPrice(plan)}</span>
                                    {plan.name !== 'enterprise' && plan.name !== 'trial' && (
                                        <span className="text-gray-400">/mo</span>
                                    )}
                                </div>
                                {billingInterval === 'year' && getSavings(plan) > 0 && (
                                    <p className="text-emerald-400 text-sm mt-1">
                                        Save {getSavings(plan)}% with yearly billing
                                    </p>
                                )}
                                {plan.name === 'trial' && (
                                    <p className="text-gray-400 text-sm mt-1">14-day free trial</p>
                                )}
                            </div>

                            <ul className="space-y-3 mb-8 flex-1">
                                {plan.featureList?.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        {feature.included ? (
                                            <Check className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                        ) : (
                                            <X className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                                        )}
                                        <span className={feature.included ? 'text-gray-300' : 'text-gray-500'}>
                                            {feature.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleSelectPlan(plan)}
                                className={`w-full py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${plan.isPopular
                                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white'
                                    : plan.name === 'enterprise'
                                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                                    }`}
                            >
                                {plan.name === 'trial' && 'Start Free Trial'}
                                {plan.name === 'enterprise' && (
                                    <>
                                        <Calendar className="w-4 h-4" />
                                        Schedule a Demo
                                    </>
                                )}
                                {!['trial', 'enterprise'].includes(plan.name) && (
                                    <>
                                        Get Started
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Enterprise CTA */}
            <section className="py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-2xl p-8 text-center">
                    <Building2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-4">Need a custom solution?</h2>
                    <p className="text-gray-400 mb-6">
                        Our Enterprise plan includes custom pricing, dedicated support, SSO/SAML, and more.
                        Contact our sales team for a personalized demo.
                    </p>
                    <a
                        href="/demo"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors"
                    >
                        <Calendar className="w-5 h-5" />
                        Schedule a Demo
                    </a>
                </div>
            </section>

            {/* FAQ would go here */}

            {/* Footer */}
            <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
                <div className="max-w-7xl mx-auto text-center text-gray-400 text-sm">
                    © {new Date().getFullYear()} AI Assistant. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
