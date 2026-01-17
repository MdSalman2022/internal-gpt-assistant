'use client';

import { useState, useEffect } from 'react';
import {
    Building2,
    Users,
    DollarSign,
    Calendar,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    ChevronRight,
    MoreHorizontal
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AdminDashboardPage() {
    const [stats, setStats] = useState(null);
    const [recentOrgs, setRecentOrgs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [dashboardRes, orgsRes] = await Promise.all([
                fetch(`${API_URL}/api/superadmin/dashboard`, { credentials: 'include' }),
                fetch(`${API_URL}/api/superadmin/organizations?limit=5`, { credentials: 'include' }),
            ]);

            if (dashboardRes.ok) {
                const data = await dashboardRes.json();
                setStats(data.stats);
            }
            if (orgsRes.ok) {
                const data = await orgsRes.json();
                setRecentOrgs(data.organizations || []);
            }
        } catch (error) {
            console.error('Error fetching dashboard:', error);
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
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
            </div>
        );
    }

    const statCards = [
        {
            label: 'Total Organizations',
            value: stats?.totalOrganizations || 0,
            change: `+${stats?.growth?.newOrgsLast30 || 0} this month`,
            changeType: 'positive',
            icon: Building2,
            color: 'violet',
        },
        {
            label: 'Total Users',
            value: stats?.totalUsers || 0,
            change: 'Across all organizations',
            changeType: 'neutral',
            icon: Users,
            color: 'cyan',
        },
        {
            label: 'Monthly Revenue',
            value: formatCurrency(stats?.mrr),
            change: `${stats?.activeSubscriptions || 0} active subs`,
            changeType: 'positive',
            icon: DollarSign,
            color: 'emerald',
        },
    ];

    const colorClasses = {
        violet: 'from-violet-500 to-violet-600',
        cyan: 'from-cyan-500 to-cyan-600',
        emerald: 'from-emerald-500 to-emerald-600',
        amber: 'from-amber-500 to-amber-600',
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
                <p className="text-gray-500 mt-1">Welcome back! Here's what's happening with your platform.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, index) => (
                    <div
                        key={index}
                        className="bg-[#12121a] border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-colors"
                    >
                        <div className="flex items-start justify-between">
                            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${colorClasses[stat.color]}`}>
                                <stat.icon className="w-5 h-5 text-white" />
                            </div>
                            <button className="text-gray-600 hover:text-gray-400">
                                <MoreHorizontal className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="mt-4">
                            <p className="text-gray-500 text-sm">{stat.label}</p>
                            <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                            <div className="flex items-center gap-1 mt-2">
                                {stat.changeType === 'positive' && (
                                    <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                                )}
                                {stat.changeType === 'warning' && (
                                    <TrendingUp className="w-4 h-4 text-amber-400" />
                                )}
                                <span className={`text-sm ${stat.changeType === 'positive' ? 'text-emerald-400' :
                                        stat.changeType === 'warning' ? 'text-amber-400' :
                                            'text-gray-500'
                                    }`}>
                                    {stat.change}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Organizations Section Removed for Cleanliness or add back if needed */}
        </div>
    );
}
