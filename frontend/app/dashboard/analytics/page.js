'use client';

import { useState, useEffect } from 'react';
import {
    TrendingUp,
    DollarSign,
    Users,
    Building2,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AnalyticsPage() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await fetch(`${API_URL}/api/superadmin/revenue-analytics`, {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setAnalytics(data);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
            </div>
        );
    }

    const planBreakdown = analytics?.byPlan || [];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Analytics</h1>
                <p className="text-gray-500 mt-1">Revenue metrics and platform insights</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#12121a] border border-gray-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600">
                            <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Monthly Recurring Revenue</p>
                            <p className="text-3xl font-bold text-white">{formatCurrency(analytics?.mrr)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-400 text-sm">
                        <ArrowUpRight className="w-4 h-4" />
                        Active MRR from {analytics?.activeCount || 0} subscriptions
                    </div>
                </div>

                <div className="bg-[#12121a] border border-gray-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600">
                            <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Total Organizations</p>
                            <p className="text-3xl font-bold text-white">{analytics?.totalOrgs || 0}</p>
                        </div>
                    </div>
                    <p className="text-gray-400 text-sm">
                        {analytics?.trialCount || 0} on trial
                    </p>
                </div>

                <div className="bg-[#12121a] border border-gray-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Conversion Rate</p>
                            <p className="text-3xl font-bold text-white">
                                {analytics?.activeCount && analytics?.totalOrgs
                                    ? Math.round((analytics.activeCount / analytics.totalOrgs) * 100)
                                    : 0}%
                            </p>
                        </div>
                    </div>
                    <p className="text-gray-400 text-sm">
                        Trial to paid conversion
                    </p>
                </div>
            </div>

            {/* Revenue by Plan */}
            <div className="bg-[#12121a] border border-gray-800 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-6">Revenue by Plan</h2>

                {planBreakdown.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        No subscription data available
                    </div>
                ) : (
                    <div className="space-y-4">
                        {planBreakdown.map((plan) => {
                            const percentage = analytics?.mrr
                                ? Math.round((plan.revenue / analytics.mrr) * 100)
                                : 0;

                            const colors = {
                                starter: 'from-cyan-500 to-cyan-600',
                                pro: 'from-violet-500 to-violet-600',
                                enterprise: 'from-amber-500 to-amber-600',
                            };

                            return (
                                <div key={plan._id} className="flex items-center gap-4">
                                    <div className="w-24 text-gray-400 capitalize">{plan._id}</div>
                                    <div className="flex-1">
                                        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full bg-gradient-to-r ${colors[plan._id] || 'from-gray-500 to-gray-600'} rounded-full transition-all duration-500`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="w-32 text-right">
                                        <span className="text-white font-medium">{formatCurrency(plan.revenue)}</span>
                                        <span className="text-gray-500 text-sm ml-2">({plan.count} subs)</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#12121a] border border-gray-800 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-white">{analytics?.activeCount || 0}</p>
                    <p className="text-gray-500 text-sm">Active Paid</p>
                </div>
                <div className="bg-[#12121a] border border-gray-800 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-white">{analytics?.trialCount || 0}</p>
                    <p className="text-gray-500 text-sm">On Trial</p>
                </div>
                <div className="bg-[#12121a] border border-gray-800 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-white">{analytics?.cancelledCount || 0}</p>
                    <p className="text-gray-500 text-sm">Churned</p>
                </div>
                <div className="bg-[#12121a] border border-gray-800 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-white">
                        {formatCurrency((analytics?.mrr || 0) / (analytics?.activeCount || 1))}
                    </p>
                    <p className="text-gray-500 text-sm">Avg Revenue</p>
                </div>
            </div>
        </div>
    );
}
