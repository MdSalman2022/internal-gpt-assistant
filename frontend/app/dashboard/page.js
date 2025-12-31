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
    const [recentDemos, setRecentDemos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [dashboardRes, orgsRes, demosRes] = await Promise.all([
                fetch(`${API_URL}/api/superadmin/dashboard`, { credentials: 'include' }),
                fetch(`${API_URL}/api/superadmin/organizations?limit=5`, { credentials: 'include' }),
                fetch(`${API_URL}/api/superadmin/demo-requests?status=pending&limit=5`, { credentials: 'include' }),
            ]);

            if (dashboardRes.ok) {
                const data = await dashboardRes.json();
                setStats(data.stats);
            }
            if (orgsRes.ok) {
                const data = await orgsRes.json();
                setRecentOrgs(data.organizations || []);
            }
            if (demosRes.ok) {
                const data = await demosRes.json();
                setRecentDemos(data.requests || []);
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
        {
            label: 'Pending Demos',
            value: stats?.pendingDemos || 0,
            change: `${stats?.trialOrganizations || 0} on trial`,
            changeType: 'warning',
            icon: Calendar,
            color: 'amber',
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

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Organizations */}
                <div className="bg-[#12121a] border border-gray-800 rounded-2xl">
                    <div className="flex items-center justify-between p-5 border-b border-gray-800">
                        <h2 className="text-lg font-semibold text-white">Recent Organizations</h2>
                        <a
                            href="/dashboard/organizations"
                            className="text-violet-400 hover:text-violet-300 text-sm flex items-center gap-1"
                        >
                            View all <ChevronRight className="w-4 h-4" />
                        </a>
                    </div>
                    <div className="divide-y divide-gray-800">
                        {recentOrgs.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No organizations yet
                            </div>
                        ) : (
                            recentOrgs.map((org) => (
                                <div key={org._id} className="p-4 flex items-center justify-between hover:bg-gray-800/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center text-violet-400 font-semibold">
                                            {org.name?.charAt(0)?.toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{org.name}</p>
                                            <p className="text-gray-500 text-sm">{org.email}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${org.planStatus === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                                                org.planStatus === 'trialing' ? 'bg-cyan-500/20 text-cyan-400' :
                                                    'bg-gray-500/20 text-gray-400'
                                            }`}>
                                            {org.plan}
                                        </span>
                                        <p className="text-gray-600 text-xs mt-1">
                                            {org.memberCount || 0} members
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Pending Demo Requests */}
                <div className="bg-[#12121a] border border-gray-800 rounded-2xl">
                    <div className="flex items-center justify-between p-5 border-b border-gray-800">
                        <h2 className="text-lg font-semibold text-white">Pending Demos</h2>
                        <a
                            href="/dashboard/demos"
                            className="text-violet-400 hover:text-violet-300 text-sm flex items-center gap-1"
                        >
                            View all <ChevronRight className="w-4 h-4" />
                        </a>
                    </div>
                    <div className="divide-y divide-gray-800">
                        {recentDemos.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No pending demo requests
                            </div>
                        ) : (
                            recentDemos.map((demo) => (
                                <div key={demo._id} className="p-4 flex items-center justify-between hover:bg-gray-800/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{demo.companyName}</p>
                                            <p className="text-gray-500 text-sm">{demo.contactName}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${demo.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                                demo.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                                                    'bg-gray-500/20 text-gray-400'
                                            }`}>
                                            {demo.priority}
                                        </span>
                                        <p className="text-gray-600 text-xs mt-1">
                                            {formatDate(demo.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
