'use client';

import { useState, useEffect } from 'react';
import { analyticsApi } from '@/lib/api';
import {
    MessageSquare, FileText, Users, Clock, TrendingUp,
    AlertTriangle, ThumbsUp, ThumbsDown, Search, RefreshCw
} from 'lucide-react';

export default function AnalyticsPage() {
    const [stats, setStats] = useState(null);
    const [topQueries, setTopQueries] = useState([]);
    const [knowledgeGaps, setKnowledgeGaps] = useState([]);
    const [queryVolume, setQueryVolume] = useState([]);
    const [feedback, setFeedback] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const [statsData, queriesData, gapsData, volumeData, feedbackData] = await Promise.all([
                analyticsApi.getStats(),
                analyticsApi.getTopQueries(5),
                analyticsApi.getKnowledgeGaps(5),
                analyticsApi.getQueryVolume(14),
                analyticsApi.getFeedback(),
            ]);
            setStats(statsData);
            setTopQueries(queriesData.queries || []);
            setKnowledgeGaps(gapsData.gaps || []);
            setQueryVolume(volumeData.volume || []);
            setFeedback(feedbackData);
        } catch (error) {
            console.error('Failed to load analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num) => {
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num?.toString() || '0';
    };

    const formatTime = (ms) => {
        if (!ms) return '0s';
        return (ms / 1000).toFixed(1) + 's';
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                <div>
                    <h1 className="text-xl font-semibold text-white">Analytics</h1>
                    <p className="text-sm text-slate-500">Knowledge base insights</p>
                </div>
                <button onClick={loadAnalytics} className="btn-secondary">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
                    </div>
                ) : (
                    <div className="space-y-6 max-w-7xl mx-auto">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard icon={<MessageSquare />} label="Total Queries" value={formatNumber(stats?.totalQueries)} change={`${stats?.queriesThisWeek || 0} this week`} color="primary" />
                            <StatCard icon={<FileText />} label="Documents" value={formatNumber(stats?.totalDocuments)} change={`${stats?.documentsThisMonth || 0} this month`} color="blue" />
                            <StatCard icon={<Users />} label="Active Users" value={formatNumber(stats?.activeUsers)} change="Last 30 days" color="purple" />
                            <StatCard icon={<Clock />} label="Avg Response" value={formatTime(stats?.avgResponseTime)} change="Per query" color="amber" />
                        </div>

                        {/* Charts Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Satisfaction */}
                            <div className="card">
                                <h3 className="font-medium text-white mb-4">Satisfaction</h3>
                                {feedback?.total > 0 ? (
                                    <div className="flex items-center justify-center gap-8">
                                        <div className="relative w-28 h-28">
                                            <svg className="w-full h-full -rotate-90">
                                                <circle cx="56" cy="56" r="48" fill="none" stroke="#1e293b" strokeWidth="10" />
                                                <circle cx="56" cy="56" r="48" fill="none" stroke="#10B981" strokeWidth="10" strokeDasharray={`${(feedback.satisfactionRate / 100) * 302} 302`} strokeLinecap="round" />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-2xl font-bold text-white">{feedback.satisfactionRate}%</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2"><ThumbsUp className="w-4 h-4 text-primary-400" /><span className="text-slate-400">{feedback.positive}</span></div>
                                            <div className="flex items-center gap-2"><ThumbsDown className="w-4 h-4 text-red-400" /><span className="text-slate-400">{feedback.negative}</span></div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-28 flex items-center justify-center text-slate-500 text-sm">No feedback yet</div>
                                )}
                            </div>

                            {/* Query Volume */}
                            <div className="card lg:col-span-2">
                                <h3 className="font-medium text-white mb-4">Query Volume (14 days)</h3>
                                <div className="h-32 flex items-end gap-1">
                                    {queryVolume.map((d, i) => {
                                        const max = Math.max(...queryVolume.map(v => v.count), 1);
                                        return (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                                <div className="w-full bg-primary-500/80 rounded-t hover:bg-primary-400 transition-colors" style={{ height: `${Math.max((d.count / max) * 100, 4)}%` }} title={`${d.count} queries`} />
                                                <span className="text-[9px] text-slate-600">{new Date(d.date).getDate()}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Lists Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Top Queries */}
                            <div className="card">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-medium text-white">Top Queries</h3>
                                    <Search className="w-4 h-4 text-slate-500" />
                                </div>
                                {topQueries.length > 0 ? (
                                    <ul className="space-y-2">
                                        {topQueries.map((q, i) => (
                                            <li key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50">
                                                <span className="w-6 h-6 rounded-full bg-primary-500/10 text-primary-400 text-xs flex items-center justify-center font-medium">{i + 1}</span>
                                                <span className="flex-1 text-sm text-slate-300 truncate">{q.query}</span>
                                                <span className="text-xs text-slate-500">{q.count}x</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="py-8 text-center text-slate-500 text-sm">No queries yet</div>
                                )}
                            </div>

                            {/* Knowledge Gaps */}
                            <div className="card">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-medium text-white">Knowledge Gaps</h3>
                                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                                </div>
                                {knowledgeGaps.length > 0 ? (
                                    <ul className="space-y-2">
                                        {knowledgeGaps.map((gap, i) => (
                                            <li key={i} className="p-3 bg-slate-800/30 rounded-lg border border-slate-800">
                                                <p className="text-sm text-slate-300 truncate mb-2">{gap.question}</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                                                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(gap.confidence || 0) * 100}%` }} />
                                                    </div>
                                                    <span className="text-xs text-amber-400">{Math.round((gap.confidence || 0) * 100)}%</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="py-8 text-center text-slate-500 text-sm">No gaps detected ✓</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, change, color }) {
    const colors = { primary: 'text-primary-400 bg-primary-500/10', blue: 'text-blue-400 bg-blue-500/10', purple: 'text-purple-400 bg-purple-500/10', amber: 'text-amber-400 bg-amber-500/10' };
    return (
        <div className="card">
            <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
                    {icon}
                </div>
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
            <p className="text-xs text-slate-600">{change}</p>
        </div>
    );
}
