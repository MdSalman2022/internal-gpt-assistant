'use client';

import { useState, useEffect } from 'react';
import { usageApi } from '@/lib/api';
import { Activity, Zap, Calendar, TrendingUp, AlertTriangle } from 'lucide-react';

export default function UsageDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await usageApi.getMyUsage();
            setStats(data);
        } catch (err) {
            console.error('Failed to load usage stats:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="text-center text-slate-500 py-8">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                <p>Failed to load usage data</p>
            </div>
        );
    }

    const ProgressBar = ({ value, max, color = 'primary', warning = false }) => {
        const percent = Math.min(100, Math.round((value / max) * 100));
        const isHigh = percent >= 80;
        const barColor = warning || isHigh ? 'bg-red-500' : `bg-${color}-500`;

        return (
            <div className="w-full">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>{value.toLocaleString()} tokens</span>
                    <span>{percent}%</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${isHigh ? 'bg-red-500' : 'bg-primary-500'}`}
                        style={{ width: `${percent}%` }}
                    />
                </div>
                <div className="text-right text-xs text-slate-500 mt-1">
                    Limit: {max.toLocaleString()}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div>
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary-400" />
                    Token Usage
                </h3>
                <p className="text-slate-400 text-sm mt-1">Monitor your AI usage and limits</p>
            </div>

            {/* Usage Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Daily Usage */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <Zap className="w-4 h-4 text-blue-400" />
                            </div>
                            <span className="text-sm font-medium text-white">Today</span>
                        </div>
                        {stats.percentUsed?.daily >= 80 && (
                            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full">
                                Near Limit
                            </span>
                        )}
                    </div>
                    <ProgressBar
                        value={stats.current?.daily || 0}
                        max={stats.limits?.dailyTokens || 50000}
                    />
                </div>

                {/* Monthly Usage */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-purple-500/10 rounded-lg">
                                <Calendar className="w-4 h-4 text-purple-400" />
                            </div>
                            <span className="text-sm font-medium text-white">This Month</span>
                        </div>
                        {stats.percentUsed?.monthly >= 80 && (
                            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full">
                                Near Limit
                            </span>
                        )}
                    </div>
                    <ProgressBar
                        value={stats.current?.monthly || 0}
                        max={stats.limits?.monthlyTokens || 500000}
                    />
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-white">{stats.today?.requestCount || 0}</p>
                    <p className="text-xs text-slate-400">Requests Today</p>
                </div>
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-white">{stats.thisMonth?.requestCount || 0}</p>
                    <p className="text-xs text-slate-400">Requests This Month</p>
                </div>
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-400">
                        ${((stats.thisMonth?.totalCost || 0) / 100).toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-400">Est. Cost This Month</p>
                </div>
            </div>

            {/* Limits Info */}
            <div className="bg-slate-800/20 border border-slate-700/30 rounded-lg p-4">
                <p className="text-xs text-slate-500">
                    <strong>Note:</strong> Limits reset at midnight UTC (daily) and on the 1st of each month (monthly).
                    Contact an admin to request higher limits.
                </p>
            </div>
        </div>
    );
}
