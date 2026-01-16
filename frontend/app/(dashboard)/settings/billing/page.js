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
    ExternalLink,
    Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import { UpgradePlanModal } from '@/components/billing/UpgradePlanModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

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
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [refundEligibility, setRefundEligibility] = useState(null);
    const [creditBalance, setCreditBalance] = useState(null);

    useEffect(() => {
        // Check for success/cancelled from Stripe redirect
        const success = searchParams.get('success');
        const sessionId = searchParams.get('session_id');

        const verifySession = async () => {
            if (success === 'true' && sessionId) {
                try {
                    const res = await fetch(`${API_URL}/api/subscriptions/verify-session`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ sessionId })
                    });

                    if (res.ok) {
                        toast.success('Your subscription has been verified and updated!');
                        // Refresh data immediately
                        fetchBillingData();
                        // Clean URL by removing query parameters
                        window.history.replaceState({}, '', '/settings/billing');
                    }
                } catch (error) {
                    console.error('Verification failed', error);
                }
            } else if (success === 'true') {
                toast.success('Your subscription has been updated successfully!');
                // Clean URL
                window.history.replaceState({}, '', '/settings/billing');
            }
        };

        verifySession();
        fetchBillingData();
    }, [searchParams]);

    const fetchBillingData = async () => {
        try {
            const [subRes, invoicesRes, plansRes, refundRes] = await Promise.all([
                fetch(`${API_URL}/api/subscriptions/current`, { credentials: 'include' }),
                fetch(`${API_URL}/api/subscriptions/invoices`, { credentials: 'include' }),
                fetch(`${API_URL}/api/subscriptions/plans`, { credentials: 'include' }),
                fetch(`${API_URL}/api/subscriptions/check-refund-eligibility`, { credentials: 'include' }),
            ]);

            const subData = await subRes.json();
            const invoicesData = await invoicesRes.json();
            const plansData = await plansRes.json();
            const refundData = await refundRes.json();

            setOrganization(subData.organization);
            setSubscription(subData.subscription);
            setCreditBalance(subData.creditBalance);
            setInvoices(invoicesData.invoices || []);
            setPlans(plansData.plans || []);
            setRefundEligibility(refundData);
        } catch (error) {
            console.error('Error fetching billing data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async (selectedPlan) => {
        setActionLoading(true);
        try {
            // Find the matching plan from the API data to get the correct Price ID
            const apiPlan = plans.find(p => p.name.toLowerCase() === selectedPlan.name.toLowerCase());
            const priceId = apiPlan?.stripePriceIdMonthly || selectedPlan.name.toLowerCase();
            const planType = selectedPlan.type || selectedPlan.name.toLowerCase();

            // Check if user has existing subscription - use /upgrade, otherwise /create-checkout
            const hasExistingSubscription = subscription && !subscription.cancelAtPeriodEnd;

            if (hasExistingSubscription && organization?.plan !== 'trial') {
                // Upgrade existing subscription
                const res = await fetch(`${API_URL}/api/subscriptions/upgrade`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ newPriceId: priceId, newPlan: planType }),
                });

                const data = await res.json();

                if (data.success) {
                    toast.success(`Successfully upgraded to ${selectedPlan.name} plan!`);
                    setShowUpgradeModal(false);
                    fetchBillingData(); // Refresh data
                } else {
                    toast.error(data.error || 'Failed to upgrade');
                }
            } else {
                // New subscription - use Stripe Checkout
                const res = await fetch(`${API_URL}/api/subscriptions/create-checkout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ priceId, plan: planType }),
                });

                const data = await res.json();

                if (data.url) {
                    window.location.href = data.url;
                }
            }
        } catch (error) {
            console.error('Error upgrading:', error);
            toast.error('Failed to process upgrade');
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

    // Renew expired subscription - go directly to checkout for current plan
    const handleRenew = async () => {
        setActionLoading(true);
        try {
            // Find the current plan's price ID - Plan model uses 'name' field
            const currentPlan = plans.find(p =>
                p.name?.toLowerCase() === subscription?.plan?.toLowerCase() ||
                p.name?.toLowerCase() === organization?.plan?.toLowerCase()
            );
            const priceId = currentPlan?.stripePriceIdMonthly;
            const planType = currentPlan?.name?.toLowerCase() || subscription?.plan;

            if (!priceId) {
                toast.error('Please select a plan to continue');
                setShowUpgradeModal(true);
                setActionLoading(false);
                return;
            }

            const res = await fetch(`${API_URL}/api/subscriptions/create-checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ priceId, plan: planType }),
            });

            const data = await res.json();

            // Use URL redirect from backend - no need for Stripe.js
            if (data.url) {
                window.location.href = data.url;
            } else {
                toast.error(data.error || 'Failed to start checkout');
            }
        } catch (error) {
            console.error('Error starting renewal:', error);
            toast.error('Something went wrong');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelSubscription = async () => {
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
        if (max === -1 || !max) return 0; // Unlimited or unknown
        return Math.min(100, Math.round((current / max) * 100));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500"></div>
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
        <div className="p-6 w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <UpgradePlanModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                currentPlan={organization?.plan}
                onUpgrade={() => {
                    fetchBillingData();
                    toast.success('Plan updated successfully');
                }}
                loading={actionLoading}
                plans={plans}
            />

            {/* Current Plan */}
            <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-4">
                    <div>
                        <h2 className="text-xl font-semibold text-foreground mb-1">Current Plan</h2>
                        <p className="text-muted-foreground">Manage your subscription and billing</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {organization.stripeCustomerId && (
                            <button
                                onClick={handleManageBilling}
                                disabled={actionLoading}
                                className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg transition-colors disabled:opacity-50"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Manage Billing
                            </button>
                        )}
                        <button
                            onClick={() => setShowUpgradeModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-lg transition-colors shadow-sm font-medium"
                        >
                            <ArrowUpRight className="w-4 h-4" />
                            {organization.plan === 'trial' ? 'Upgrade Now' : 'Change Plan'}
                        </button>
                    </div>
                </div>

                {/* Expired Trial Banner - shows when trial has ended */}
                {organization.plan === 'trial' && organization.trialEndsAt && new Date(organization.trialEndsAt) < new Date() && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-500/20 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-red-500 font-semibold">
                                    Trial Period Ended
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Your trial expired on {formatDate(organization.trialEndsAt)}. Please upgrade to continue using all features.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowUpgradeModal(true)}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                        >
                            Upgrade Now
                        </button>
                    </div>
                )}

                {/* Cancellation Banner - shows when subscription is set to cancel */}
                {subscription?.cancelAtPeriodEnd && (
                    <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-500/20 rounded-lg">
                                <Calendar className="w-5 h-5 text-yellow-600" />
                            </div>
                            <p className="text-yellow-700 dark:text-yellow-400">
                                Your subscription will be canceled on{' '}
                                <span className="font-semibold">
                                    {formatDate(subscription.currentPeriodEnd)}
                                </span>
                            </p>
                        </div>
                        <button
                            onClick={handleReactivate}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
                        >
                            Resubscribe
                        </button>
                    </div>
                )}

                {/* Expired Subscription Banner - shows when subscription has expired */}
                {subscription?.currentPeriodEnd && new Date(subscription.currentPeriodEnd) < new Date() && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-500/20 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-red-500 font-semibold">
                                    Subscription Expired
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Your subscription expired on {formatDate(subscription.currentPeriodEnd)}. Please update your payment method or renew.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleRenew}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                        >
                            {actionLoading ? 'Loading...' : 'Renew Now'}
                        </button>
                    </div>
                )}

                {/* Credit Balance Banner - shows when customer has credit */}
                {creditBalance && creditBalance.balance < 0 && (
                    <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/20 rounded-lg">
                                <CreditCard className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-emerald-500 font-semibold">
                                    {creditBalance.balanceDisplay}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    This credit will be applied to your next invoice
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* Plan */}
                    <div className="bg-muted/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                            <Package className="w-4 h-4" />
                            <span className="text-sm">Plan</span>
                        </div>
                        <div className="text-xl font-semibold text-foreground capitalize">
                            {organization.plan}
                        </div>
                        <div className={`text-sm mt-1 font-medium ${
                            // Check if subscription is expired
                            subscription?.currentPeriodEnd && new Date(subscription.currentPeriodEnd) < new Date()
                                ? 'text-red-500'
                                : organization.planStatus === 'active'
                                    ? 'text-emerald-500'
                                    : organization.planStatus === 'trialing'
                                        ? 'text-cyan-500'
                                        : 'text-muted-foreground'
                            } `}>
                            {/* Check expiration first */}
                            {subscription?.currentPeriodEnd && new Date(subscription.currentPeriodEnd) < new Date()
                                ? `Expired ${formatDate(subscription.currentPeriodEnd)}`
                                : organization.planStatus === 'trialing'
                                    ? `Trial ends ${formatDate(organization.trialEndsAt)}`
                                    : organization.planStatus === 'active' && subscription?.currentPeriodEnd
                                        ? `Renews ${formatDate(subscription.currentPeriodEnd)}`
                                        : organization.planStatus === 'active'
                                            ? 'Active'
                                            : '' // Don't show 'cancelled' status
                            }
                        </div>
                    </div>

                    {/* Users */}
                    <div className="bg-muted/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                            <Users className="w-4 h-4" />
                            <span className="text-sm">Team Members</span>
                        </div>
                        <div className="text-xl font-semibold text-foreground">
                            {organization.usage?.currentUsers || 0}
                            <span className="text-muted-foreground text-sm font-normal">
                                {organization.limits?.maxUsers === -1
                                    ? ' / Unlimited'
                                    : ` / ${organization.limits?.maxUsers}`
                                }
                            </span>
                        </div>
                        <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${getUsagePercent(organization.usage?.currentUsers, organization.limits?.maxUsers)}%` }}
                            />
                        </div>
                    </div>

                    {/* Documents */}
                    <div className="bg-muted/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                            <FileText className="w-4 h-4" />
                            <span className="text-sm">Documents</span>
                        </div>
                        <div className="text-xl font-semibold text-foreground">
                            {organization.usage?.currentDocuments || 0}
                            <span className="text-muted-foreground text-sm font-normal">
                                {organization.limits?.maxDocuments === -1
                                    ? ' / Unlimited'
                                    : ` / ${organization.limits?.maxDocuments}`
                                }
                            </span>
                        </div>
                        <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-cyan-500 rounded-full"
                                style={{ width: `${getUsagePercent(organization.usage?.currentDocuments, organization.limits?.maxDocuments)}%` }}
                            />
                        </div>
                    </div>

                    {/* Tokens */}
                    <div className="bg-muted/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                            <Zap className="w-4 h-4" />
                            <span className="text-sm">Tokens This Month</span>
                        </div>
                        <div className="text-xl font-semibold text-foreground">
                            {((organization.usage?.monthlyTokens || 0) / 1000).toFixed(0)}K
                            <span className="text-muted-foreground text-sm font-normal">
                                {organization.limits?.maxTokensPerMonth === -1
                                    ? ' / Unlimited'
                                    : organization.limits?.maxTokensPerMonth >= 1000000
                                        ? ` / ${(organization.limits?.maxTokensPerMonth / 1000000).toFixed(0)}M`
                                        : ` / ${(organization.limits?.maxTokensPerMonth / 1000).toFixed(0)}K`
                                }
                            </span>
                        </div>
                        <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
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
                            onClick={() => setShowUpgradeModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-lg transition-colors shadow-lg shadow-emerald-500/20"
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
                            onClick={() => setShowCancelDialog(true)}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg transition-colors disabled:opacity-50"
                        >
                            <XCircle className="w-4 h-4" />
                            Cancel Subscription
                        </button>
                    )}
                </div>

                {subscription?.cancelAtPeriodEnd && (
                    <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                            Your subscription will be cancelled on {formatDate(subscription.currentPeriodEnd)}.
                            You will retain access until then.
                        </p>
                    </div>
                )}
            </div>

            {/* Invoice History */}
            {invoices.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-foreground mb-4">Invoice History</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Date</th>
                                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Invoice</th>
                                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Amount</th>
                                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((invoice) => (
                                    <tr key={invoice.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                        <td className="py-3 px-4 text-foreground">
                                            {formatDate(invoice.created)}
                                        </td>
                                        <td className="py-3 px-4 text-muted-foreground">
                                            {invoice.number || invoice.id.slice(-8)}
                                        </td>
                                        <td className="py-3 px-4 text-foreground font-medium">
                                            ${invoice.amount} {invoice.currency?.toUpperCase()}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wide ${invoice.status === 'paid'
                                                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                                : 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20'
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
                                                    className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-sm"
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

            {/* Cancel Subscription Dialog */}
            <ConfirmDialog
                open={showCancelDialog}
                onOpenChange={setShowCancelDialog}
                title={refundEligibility?.eligible ? "Cancel & Get Refund?" : "Cancel Subscription?"}
                description={
                    refundEligibility?.eligible
                        ? `You're within the 3-day refund window.\n\nDays used: ${refundEligibility.daysUsed} of ${refundEligibility.totalDays}\nAmount paid: $${refundEligibility.amountPaid?.toFixed(2)}\nCharge for usage: $${refundEligibility.chargeAmount?.toFixed(2)}\nRefund: $${refundEligibility.refundAmount?.toFixed(2)}\n\nYou'll lose access immediately.`
                        : `You'll keep access until ${formatDate(refundEligibility?.periodEnd || subscription?.currentPeriodEnd)}.\n\nNo refund available after the 3-day grace period.`
                }
                confirmText={refundEligibility?.eligible ? "Cancel & Refund" : "Yes, Cancel"}
                cancelText="Keep Subscription"
                variant="danger"
                loading={actionLoading}
                onConfirm={handleCancelSubscription}
            />
        </div>
    );
}
