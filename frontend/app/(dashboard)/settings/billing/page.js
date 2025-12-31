'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import {
    CreditCard,
    Package,
    Users,
    FileText,
    Zap,
    Check,
    ArrowUpRight,
    Download,
    AlertCircle,
    RefreshCw,
    XCircle,
    ExternalLink
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export default function BillingPage() {
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [organization, setOrganization] = useState(null);
    const [subscription, setSubscription] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [plans, setPlans] = useState([]);
    const [actionLoading, setActionLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        // Check for success/cancelled from Stripe redirect
        if (searchParams.get('success') === 'true') {
            setSuccessMessage('Your subscription has been updated successfully!');
            setTimeout(() => setSuccessMessage(''), 5000);
        }

        fetchBillingData();
    }, [searchParams]);

    const fetchBillingData = async () => {
        try {
            const [subRes, invoicesRes, plansRes] = await Promise.all([
                fetch(`${API_URL}/api/subscriptions/current`, { credentials: 'include' }),
                fetch(`${API_URL}/api/subscriptions/invoices`, { credentials: 'include' }),
                fetch(`${API_URL}/api/subscriptions/plans`, { credentials: 'include' }),
            ]);

            const subData = await subRes.json();
            const invoicesData = await invoicesRes.json();
            const plansData = await plansRes.json();

            setOrganization(subData.organization);
            setSubscription(subData.subscription);
            setInvoices(invoicesData.invoices || []);
            setPlans(plansData.plans || []);
        } catch (error) {
            console.error('Error fetching billing data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async (plan) => {
        setActionLoading(true);
        try {
            // Get the price ID for the selected plan (you'd have these from your backend/config)
            const priceId = plan.stripePriceIdMonthly || plan.name; // Fallback for demo

            const res = await fetch(`${API_URL}/api/subscriptions/create-checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ priceId, plan: plan.name }),
            });

            const data = await res.json();

            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            console.error('Error creating checkout:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleManageBilling = async () => {
        setActionLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/subscriptions/portal`, {
                method: 'POST',
                credentials: 'include',
            });

            const data = await res.json();

            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            console.error('Error opening billing portal:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelSubscription = async () => {
        if (!confirm('Are you sure you want to cancel? You will lose access at the end of your billing period.')) {
            return;
        }

        setActionLoading(true);
        try {
            await fetch(`${API_URL}/api/subscriptions/cancel`, {
                method: 'POST',
                credentials: 'include',
            });
            fetchBillingData();
        } catch (error) {
            console.error('Error cancelling:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReactivate = async () => {
        setActionLoading(true);
        try {
            await fetch(`${API_URL}/api/subscriptions/reactivate`, {
                method: 'POST',
                credentials: 'include',
            });
            fetchBillingData();
        } catch (error) {
            console.error('Error reactivating:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getUsagePercent = (current, max) => {
        if (max === -1) return 0; // Unlimited
        return Math.min(100, Math.round((current / max) * 100));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    if (!organization) {
        return (
            <div className="p-6">
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 text-center">
                    <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-white mb-2">No Organization Found</h2>
                    <p className="text-gray-400 mb-4">
                        You need to create or join an organization to manage billing.
                    </p>
                    <a
                        href="/settings/organization"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                    >
                        Create Organization
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Success Message */}
            {successMessage && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-400" />
                    <span className="text-emerald-300">{successMessage}</span>
                </div>
            )}

            {/* Current Plan */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-semibold text-white mb-1">Current Plan</h2>
                        <p className="text-gray-400">Manage your subscription and billing</p>
                    </div>
                    {organization.stripeCustomerId && (
                        <button
                            onClick={handleManageBilling}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Manage Billing
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* Plan */}
                    <div className="bg-gray-700/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                            <Package className="w-4 h-4" />
                            <span className="text-sm">Plan</span>
                        </div>
                        <div className="text-xl font-semibold text-white capitalize">
                            {organization.plan}
                        </div>
                        <div className={`text-sm mt-1 ${organization.planStatus === 'active' ? 'text-emerald-400' :
                                organization.planStatus === 'trialing' ? 'text-cyan-400' :
                                    'text-yellow-400'
                            }`}>
                            {organization.planStatus === 'trialing'
                                ? `Trial ends ${formatDate(organization.trialEndsAt)}`
                                : organization.planStatus
                            }
                        </div>
                    </div>

                    {/* Users */}
                    <div className="bg-gray-700/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                            <Users className="w-4 h-4" />
                            <span className="text-sm">Team Members</span>
                        </div>
                        <div className="text-xl font-semibold text-white">
                            {organization.usage?.currentUsers || 0}
                            <span className="text-gray-400 text-sm font-normal">
                                {organization.limits?.maxUsers === -1
                                    ? ' / Unlimited'
                                    : ` / ${organization.limits?.maxUsers}`
                                }
                            </span>
                        </div>
                        <div className="mt-2 h-1.5 bg-gray-600 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${getUsagePercent(organization.usage?.currentUsers, organization.limits?.maxUsers)}%` }}
                            />
                        </div>
                    </div>

                    {/* Documents */}
                    <div className="bg-gray-700/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                            <FileText className="w-4 h-4" />
                            <span className="text-sm">Documents</span>
                        </div>
                        <div className="text-xl font-semibold text-white">
                            {organization.usage?.currentDocuments || 0}
                            <span className="text-gray-400 text-sm font-normal">
                                {organization.limits?.maxDocuments === -1
                                    ? ' / Unlimited'
                                    : ` / ${organization.limits?.maxDocuments}`
                                }
                            </span>
                        </div>
                        <div className="mt-2 h-1.5 bg-gray-600 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-cyan-500 rounded-full"
                                style={{ width: `${getUsagePercent(organization.usage?.currentDocuments, organization.limits?.maxDocuments)}%` }}
                            />
                        </div>
                    </div>

                    {/* Tokens */}
                    <div className="bg-gray-700/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                            <Zap className="w-4 h-4" />
                            <span className="text-sm">Tokens This Month</span>
                        </div>
                        <div className="text-xl font-semibold text-white">
                            {((organization.usage?.monthlyTokens || 0) / 1000).toFixed(0)}K
                            <span className="text-gray-400 text-sm font-normal">
                                {organization.limits?.maxTokensPerMonth === -1
                                    ? ' / Unlimited'
                                    : ` / ${(organization.limits?.maxTokensPerMonth / 1000000).toFixed(0)}M`
                                }
                            </span>
                        </div>
                        <div className="mt-2 h-1.5 bg-gray-600 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-purple-500 rounded-full"
                                style={{ width: `${getUsagePercent(organization.usage?.monthlyTokens, organization.limits?.maxTokensPerMonth)}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                    {organization.plan === 'trial' && (
                        <button
                            onClick={() => window.location.href = '/pricing'}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-lg transition-colors"
                        >
                            <ArrowUpRight className="w-4 h-4" />
                            Upgrade Now
                        </button>
                    )}

                    {subscription?.cancelAtPeriodEnd ? (
                        <button
                            onClick={handleReactivate}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Reactivate Subscription
                        </button>
                    ) : subscription && (
                        <button
                            onClick={handleCancelSubscription}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <XCircle className="w-4 h-4" />
                            Cancel Subscription
                        </button>
                    )}
                </div>

                {subscription?.cancelAtPeriodEnd && (
                    <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <p className="text-yellow-300 text-sm">
                            Your subscription will be cancelled on {formatDate(subscription.currentPeriodEnd)}.
                            You will retain access until then.
                        </p>
                    </div>
                )}
            </div>

            {/* Available Plans */}
            {organization.plan === 'trial' && plans.length > 0 && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Upgrade Your Plan</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {plans.filter(p => p.name !== 'trial').map((plan) => (
                            <div
                                key={plan.name}
                                className={`border rounded-xl p-4 ${plan.isPopular
                                        ? 'border-emerald-500 bg-emerald-500/5'
                                        : 'border-gray-700'
                                    }`}
                            >
                                <h3 className="text-lg font-semibold text-white">{plan.displayName}</h3>
                                <p className="text-gray-400 text-sm mb-3">{plan.description}</p>
                                <div className="text-2xl font-bold text-white mb-4">
                                    {plan.monthlyPrice > 0 ? `$${plan.monthlyPrice}/mo` : 'Custom'}
                                </div>
                                <button
                                    onClick={() => plan.name === 'enterprise'
                                        ? window.location.href = '/demo'
                                        : handleUpgrade(plan)
                                    }
                                    disabled={actionLoading}
                                    className={`w-full py-2 rounded-lg transition-colors disabled:opacity-50 ${plan.isPopular
                                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                            : 'bg-gray-700 hover:bg-gray-600 text-white'
                                        }`}
                                >
                                    {plan.name === 'enterprise' ? 'Contact Sales' : 'Select Plan'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Invoice History */}
            {invoices.length > 0 && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Invoice History</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-700">
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Invoice</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Amount</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((invoice) => (
                                    <tr key={invoice.id} className="border-b border-gray-700/50">
                                        <td className="py-3 px-4 text-gray-300">
                                            {formatDate(invoice.created)}
                                        </td>
                                        <td className="py-3 px-4 text-gray-300">
                                            {invoice.number || invoice.id.slice(-8)}
                                        </td>
                                        <td className="py-3 px-4 text-white font-medium">
                                            ${invoice.amount} {invoice.currency?.toUpperCase()}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${invoice.status === 'paid'
                                                    ? 'bg-emerald-500/20 text-emerald-400'
                                                    : 'bg-yellow-500/20 text-yellow-400'
                                                }`}>
                                                {invoice.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            {invoice.pdfUrl && (
                                                <a
                                                    href={invoice.pdfUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-sm"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    PDF
                                                </a>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
