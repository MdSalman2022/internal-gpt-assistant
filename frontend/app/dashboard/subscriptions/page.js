'use client';

import { useState, useEffect } from 'react';
import {
    Search,
    CreditCard,
    DollarSign,
    Calendar,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    ArrowUpRight
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function SubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [expandedOrgs, setExpandedOrgs] = useState(new Set());

    const toggleOrg = (orgId) => {
        setExpandedOrgs(prev => {
            const next = new Set(prev);
            if (next.has(orgId)) {
                next.delete(orgId);
            } else {
                next.add(orgId);
            }
            return next;
        });
    };

    useEffect(() => {
        fetchData();
    }, [page]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [subsRes, analyticsRes] = await Promise.all([
                fetch(`${API_URL}/api/superadmin/subscriptions?page=${page}&limit=10`, { credentials: 'include' }),
                fetch(`${API_URL}/api/superadmin/revenue-analytics`, { credentials: 'include' }),
            ]);

            if (subsRes.ok) {
                const data = await subsRes.json();
                setSubscriptions(data.subscriptions || []);
                setTotalPages(data.pagination?.totalPages || 1);
            }
            if (analyticsRes.ok) {
                const data = await analyticsRes.json();
                setAnalytics(data);
            }
        } catch (error) {
            console.error('Error fetching subscriptions:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
        }).format(amount || 0);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Subscriptions & Revenue</h1>
                <p className="text-gray-500 mt-1">Monitor subscription activity and revenue metrics</p>
            </div>

            {/* Revenue Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#12121a] border border-gray-800 rounded-2xl p-5">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                        <DollarSign className="w-4 h-4" />
                        Monthly Revenue
                    </div>
                    <p className="text-2xl font-bold text-white">{formatCurrency(analytics?.mrr)}</p>
                    <div className="flex items-center gap-1 mt-2 text-emerald-400 text-sm">
                        <ArrowUpRight className="w-4 h-4" />
                        MRR
                    </div>
                </div>
                <div className="bg-[#12121a] border border-gray-800 rounded-2xl p-5">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                        <TrendingUp className="w-4 h-4" />
                        Active Subscriptions
                    </div>
                    <p className="text-2xl font-bold text-white">{analytics?.activeCount || 0}</p>
                    <p className="text-gray-500 text-sm mt-2">Paying customers</p>
                </div>
                <div className="bg-[#12121a] border border-gray-800 rounded-2xl p-5">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                        <Calendar className="w-4 h-4" />
                        Trials
                    </div>
                    <p className="text-2xl font-bold text-white">{analytics?.trialCount || 0}</p>
                    <p className="text-gray-500 text-sm mt-2">Active trials</p>
                </div>
                <div className="bg-[#12121a] border border-gray-800 rounded-2xl p-5">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                        <CreditCard className="w-4 h-4" />
                        Cancelled
                    </div>
                    <p className="text-2xl font-bold text-white">{analytics?.cancelledCount || 0}</p>
                    <p className="text-gray-500 text-sm mt-2">Churned subscriptions</p>
                </div>
            </div>

            {/* Subscriptions Table */}
            <div className="bg-[#12121a] border border-gray-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-800">
                                <th className="text-left py-4 px-5 text-gray-500 font-medium text-sm">Organization</th>
                                <th className="text-left py-4 px-5 text-gray-500 font-medium text-sm">Active Plan</th>
                                <th className="text-left py-4 px-5 text-gray-500 font-medium text-sm">Status</th>
                                <th className="text-left py-4 px-5 text-gray-500 font-medium text-sm">Current Billing</th>
                                <th className="text-left py-4 px-5 text-gray-500 font-medium text-sm">History</th>
                                <th className="text-right py-4 px-5 text-gray-500 font-medium text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center">
                                        <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto" />
                                    </td>
                                </tr>
                            ) : subscriptions.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center text-gray-500">
                                        No subscriptions found
                                    </td>
                                </tr>
                            ) : (
                                // Group by Organization ID
                                Object.values(subscriptions.reduce((acc, sub) => {
                                    const orgId = sub.organizationId?._id || 'unknown';
                                    if (!acc[orgId]) {
                                        acc[orgId] = {
                                            org: sub.organizationId,
                                            subs: []
                                        };
                                    }
                                    acc[orgId].subs.push(sub);
                                    return acc;
                                }, {})).map((group) => {
                                    // Find active or latest subscription
                                    const activeSub = group.subs.find(s => ['active', 'trialing'].includes(s.status)) || group.subs[0];
                                    const orgId = group.org?._id || 'unknown';
                                    const isExpanded = expandedOrgs.has(orgId);
                                    
                                    // Collect all payments
                                    const allPayments = group.subs.flatMap(s => s.payments || [])
                                        .sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));

                                    return (
                                        <>
                                            <tr 
                                                key={orgId} 
                                                onClick={() => toggleOrg(orgId)}
                                                className={`border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors cursor-pointer ${isExpanded ? 'bg-gray-800/10' : ''}`}
                                            >
                                                <td className="py-4 px-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                                                            <ChevronRight className="w-4 h-4 text-gray-500" />
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-medium">{group.org?.name || 'Unknown'}</p>
                                                            <p className="text-gray-500 text-sm">{group.org?.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-5">
                                                    <span className="text-white capitalize">{activeSub.plan}</span>
                                                    <p className="text-gray-500 text-sm">{activeSub.billingInterval}ly</p>
                                                </td>
                                                <td className="py-4 px-5">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${activeSub.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                                                            activeSub.status === 'trialing' ? 'bg-cyan-500/20 text-cyan-400' :
                                                                activeSub.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                                                                    'bg-amber-500/20 text-amber-400'
                                                        }`}>
                                                        {activeSub.status}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-5 text-white font-medium">
                                                    {formatCurrency(activeSub.payments?.[activeSub.payments?.length -1]?.amount || 0)}
                                                </td>
                                                <td className="py-4 px-5 text-gray-400">
                                                    {allPayments.length} transactions
                                                </td>
                                                <td className="py-4 px-5 text-right">
                                                    <button className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                                                        <MoreHorizontal className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                            
                                            {/* Expanded Content: Transaction History */}
                                            {isExpanded && (
                                                <tr className="bg-gray-900/30">
                                                    <td colSpan="6" className="p-0">
                                                        <div className="p-4 pl-12 border-b border-gray-800">
                                                            <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                                                                <CreditCard className="w-4 h-4" />
                                                                Transaction History
                                                            </h4>
                                                            
                                                            {allPayments.length > 0 ? (
                                                                <div className="bg-[#0a0a0f] border border-gray-800 rounded-xl overflow-hidden">
                                                                    <table className="w-full text-sm">
                                                                        <thead>
                                                                            <tr className="border-b border-gray-800 bg-gray-800/30">
                                                                                <th className="text-left py-2 px-4 text-gray-500 font-medium">Date</th>
                                                                                <th className="text-left py-2 px-4 text-gray-500 font-medium">Amount</th>
                                                                                <th className="text-left py-2 px-4 text-gray-500 font-medium">Status</th>
                                                                                <th className="text-right py-2 px-4 text-gray-500 font-medium">Invoice</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {allPayments.map((payment, idx) => (
                                                                                <tr key={idx} className="border-b border-gray-800/50 last:border-0 text-gray-400">
                                                                                    <td className="py-2 px-4">
                                                                                        {new Date(payment.paidAt).toLocaleDateString()}
                                                                                    </td>
                                                                                    <td className="py-2 px-4 text-white">
                                                                                        {formatCurrency(payment.amount)}
                                                                                    </td>
                                                                                    <td className="py-2 px-4">
                                                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                                                            payment.status === 'succeeded' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-800 text-gray-400'
                                                                                        }`}>
                                                                                            {payment.status}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td className="py-2 px-4 text-right">
                                                                                        {payment.invoicePdf && (
                                                                                            <a 
                                                                                                href={payment.invoicePdf} 
                                                                                                target="_blank" 
                                                                                                rel="noopener noreferrer"
                                                                                                className="text-violet-400 hover:text-violet-300 text-xs hover:underline"
                                                                                                onClick={(e) => e.stopPropagation()}
                                                                                            >
                                                                                                View PDF
                                                                                            </a>
                                                                                        )}
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            ) : (
                                                                <p className="text-gray-500 text-sm italic">No entries found.</p>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t border-gray-800">
                        <p className="text-gray-500 text-sm">Page {page} of {totalPages}</p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
