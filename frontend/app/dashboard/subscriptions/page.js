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
                                <th className="text-left py-4 px-5 text-gray-500 font-medium text-sm">Plan</th>
                                <th className="text-left py-4 px-5 text-gray-500 font-medium text-sm">Status</th>
                                <th className="text-left py-4 px-5 text-gray-500 font-medium text-sm">Amount</th>
                                <th className="text-left py-4 px-5 text-gray-500 font-medium text-sm">Next Billing</th>
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
                                subscriptions.map((sub) => (
                                    <tr key={sub._id} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                                        <td className="py-4 px-5">
                                            <div>
                                                <p className="text-white font-medium">{sub.organizationId?.name || 'Unknown'}</p>
                                                <p className="text-gray-500 text-sm">{sub.organizationId?.email}</p>
                                            </div>
                                        </td>
                                        <td className="py-4 px-5">
                                            <span className="text-white capitalize">{sub.planName}</span>
                                            <p className="text-gray-500 text-sm">{sub.interval}ly</p>
                                        </td>
                                        <td className="py-4 px-5">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${sub.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                                                    sub.status === 'trialing' ? 'bg-cyan-500/20 text-cyan-400' :
                                                        sub.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                                                            'bg-amber-500/20 text-amber-400'
                                                }`}>
                                                {sub.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-5 text-white font-medium">
                                            {formatCurrency(sub.amount)}
                                        </td>
                                        <td className="py-4 px-5 text-gray-400">
                                            {sub.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : '-'}
                                        </td>
                                        <td className="py-4 px-5 text-right">
                                            <button className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                                                <MoreHorizontal className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
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
