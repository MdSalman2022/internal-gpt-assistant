'use client';

import { useState, useEffect } from 'react';
import { analyticsApi } from '@/lib/api';
import {
    MessageSquare, FileText, Users, Clock, TrendingUp, TrendingDown,
    AlertTriangle, ThumbsUp, ThumbsDown, Search, RefreshCw,
    BarChart2, Zap, Activity, Calendar, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

export default function AnalyticsDashboard() {
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
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num?.toString() || '0';
    };

    const formatTime = (ms) => {
        if (!ms) return '0s';
        if (ms >= 60000) return (ms / 60000).toFixed(1) + 'm';
        return (ms / 1000).toFixed(1) + 's';
    };

    // Calculate query trend
    const getQueryTrend = () => {
        if (queryVolume.length < 7) return { trend: 0, direction: 'neutral' };
        const recentWeek = queryVolume.slice(-7).reduce((sum, d) => sum + d.count, 0);
        const previousWeek = queryVolume.slice(0, 7).reduce((sum, d) => sum + d.count, 0);
        if (previousWeek === 0) return { trend: recentWeek > 0 ? 100 : 0, direction: 'up' };
        const trend = ((recentWeek - previousWeek) / previousWeek) * 100;
        return { trend: Math.abs(trend).toFixed(0), direction: trend >= 0 ? 'up' : 'down' };
    };

    const queryTrend = getQueryTrend();

    // Helper StatCard Component
    function StatCard({ icon, label, value, change, trend, color }) {
        const colors = {
            primary: 'text-primary bg-primary/10 border-primary/20',
            blue: 'text-blue-500 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
            purple: 'text-purple-500 dark:text-purple-400 bg-purple-500/10 border-purple-500/20',
            amber: 'text-amber-500 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
            green: 'text-green-500 dark:text-green-400 bg-green-500/10 border-green-500/20'
        };
        return (
            <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-all shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${colors[color]}`}>
                        {icon}
                    </div>
                    {trend && (
                        <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${trend.direction === 'up' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-destructive/10 text-destructive'
                            }`}>
                            {trend.direction === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {trend.value}%
                        </div>
                    )}
                </div>
                <p className="text-3xl font-bold text-foreground mb-1">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
                {change && <p className="text-xs text-muted-foreground mt-1">{change}</p>}
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto">
            <div className="p-6 pb-12 w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                            <BarChart2 className="w-5 h-5 text-primary" />
                            Analytics Dashboard
                        </h2>
                        <p className="text-muted-foreground text-sm mt-1">Real-time insights into system usage and performance</p>
                    </div>
                    <button
                        onClick={loadAnalytics}
                        disabled={loading}
                        className="btn-secondary text-sm flex items-center gap-2 w-fit"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh Data
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="flex flex-col items-center gap-3">
                            <div className="animate-spin w-10 h-10 border-2 border-primary border-t-transparent rounded-full" />
                            <p className="text-muted-foreground text-sm">Loading analytics...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard
                                icon={<MessageSquare className="w-5 h-5" />}
                                label="Total Queries"
                                value={formatNumber(stats?.totalQueries)}
                                change={`${stats?.queriesThisWeek || 0} this week`}
                                trend={queryTrend.trend > 0 ? { direction: queryTrend.direction, value: queryTrend.trend } : null}
                                color="primary"
                            />
                            <StatCard
                                icon={<FileText className="w-5 h-5" />}
                                label="Documents"
                                value={formatNumber(stats?.totalDocuments)}
                                change={`${stats?.documentsThisMonth || 0} uploaded this month`}
                                color="blue"
                            />
                            <StatCard
                                icon={<Users className="w-5 h-5" />}
                                label="Active Users"
                                value={formatNumber(stats?.activeUsers)}
                                change="Active in last 30 days"
                                color="purple"
                            />
                            <StatCard
                                icon={<Zap className="w-5 h-5" />}
                                label="Avg Response Time"
                                value={formatTime(stats?.avgResponseTime)}
                                change="Per AI response"
                                color="amber"
                            />
                        </div>

                        {/* Charts Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Satisfaction */}
                            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-medium text-foreground flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-green-500 dark:text-green-400" />
                                        User Satisfaction
                                    </h3>
                                    <span className="text-xs text-muted-foreground">Based on {feedback?.total || 0} ratings</span>
                                </div>
                                {feedback?.total > 0 ? (
                                    <div className="flex items-center justify-center gap-8">
                                        <div className="relative w-32 h-32">
                                            <svg className="w-full h-full -rotate-90">
                                                <circle cx="64" cy="64" r="52" fill="none" className="stroke-muted" strokeWidth="12" />
                                                <circle
                                                    cx="64" cy="64" r="52"
                                                    fill="none"
                                                    stroke={feedback.satisfactionRate >= 80 ? '#10B981' : feedback.satisfactionRate >= 50 ? '#F59E0B' : '#EF4444'}
                                                    strokeWidth="12"
                                                    strokeDasharray={`${(feedback.satisfactionRate / 100) * 327} 327`}
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-3xl font-bold text-foreground">{feedback.satisfactionRate}%</span>
                                                <span className="text-xs text-muted-foreground">Satisfied</span>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 p-2 bg-green-500/10 rounded-lg">
                                                <ThumbsUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                                                <div>
                                                    <span className="text-lg font-bold text-foreground">{feedback.positive}</span>
                                                    <p className="text-xs text-muted-foreground">Positive</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-2 bg-destructive/10 rounded-lg">
                                                <ThumbsDown className="w-5 h-5 text-destructive" />
                                                <div>
                                                    <span className="text-lg font-bold text-foreground">{feedback.negative}</span>
                                                    <p className="text-xs text-muted-foreground">Negative</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-32 flex flex-col items-center justify-center text-muted-foreground">
                                        <ThumbsUp className="w-8 h-8 mb-2 opacity-30" />
                                        <p className="text-sm">No feedback received yet</p>
                                        <p className="text-xs mt-1">Encourage users to rate responses</p>
                                    </div>
                                )}
                            </div>

                            {/* Query Volume Chart */}
                            <div className="bg-card border border-border rounded-xl p-5 lg:col-span-2 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-medium text-foreground flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-primary" />
                                        Query Volume
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Calendar className="w-3 h-3" />
                                        Last 14 days
                                    </div>
                                </div>
                                {queryVolume.length > 0 ? (
                                    <div className="h-40 flex items-end gap-1.5 px-2">
                                        {queryVolume.map((d, i) => {
                                            const max = Math.max(...queryVolume.map(v => v.count), 1);
                                            const height = Math.max((d.count / max) * 100, 8);
                                            const isToday = new Date(d.date).toDateString() === new Date().toDateString();
                                            return (
                                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                                    <div className="relative w-full">
                                                        <div
                                                            className={`w-full rounded-t-md transition-all cursor-pointer ${isToday
                                                                ? 'bg-primary'
                                                                : 'bg-primary/30 hover:bg-primary/50'
                                                                }`}
                                                            style={{ height: `${height}px` }}
                                                        />
                                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover border border-border rounded text-xs text-popover-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-md">
                                                            {d.count} queries
                                                        </div>
                                                    </div>
                                                    <span className={`text-[10px] ${isToday ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                                                        {new Date(d.date).getDate()}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
                                        No query data available
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Lists Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Top Queries */}
                            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-medium text-foreground flex items-center gap-2">
                                        <Search className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                                        Top Queries
                                    </h3>
                                    <span className="text-xs text-muted-foreground">Most frequent</span>
                                </div>
                                {topQueries.length > 0 ? (
                                    <ul className="space-y-2">
                                        {topQueries.map((q, i) => (
                                            <li key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors">
                                                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                                                    i === 1 ? 'bg-muted text-muted-foreground' :
                                                        i === 2 ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400' :
                                                            'bg-muted/50 text-muted-foreground'
                                                    }`}>
                                                    {i + 1}
                                                </span>
                                                <span className="flex-1 text-sm text-foreground truncate">{q.query}</span>
                                                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">{q.count}x</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="py-12 text-center">
                                        <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                        <p className="text-muted-foreground text-sm">No queries yet</p>
                                        <p className="text-xs text-muted-foreground/80 mt-1">Queries will appear once users start chatting</p>
                                    </div>
                                )}
                            </div>

                            {/* Knowledge Gaps */}
                            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-medium text-foreground flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                                        Knowledge Gaps
                                    </h3>
                                    <span className="text-xs text-muted-foreground">Low confidence answers</span>
                                </div>
                                {knowledgeGaps.length > 0 ? (
                                    <ul className="space-y-3">
                                        {knowledgeGaps.map((gap, i) => (
                                            <li key={i} className="p-3 bg-amber-500/5 rounded-lg border border-amber-500/20 hover:border-amber-500/40 transition-colors">
                                                <p className="text-sm text-foreground truncate mb-2">{gap.question}</p>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${(gap.confidence || 0) < 0.3 ? 'bg-destructive' :
                                                                (gap.confidence || 0) < 0.6 ? 'bg-amber-500' : 'bg-green-500'
                                                                }`}
                                                            style={{ width: `${(gap.confidence || 0) * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${(gap.confidence || 0) < 0.3 ? 'bg-destructive/10 text-destructive' :
                                                        (gap.confidence || 0) < 0.6 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-green-500/10 text-green-600 dark:text-green-400'
                                                        }`}>
                                                        {Math.round((gap.confidence || 0) * 100)}%
                                                    </span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="py-12 text-center">
                                        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                                            <ThumbsUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                                        </div>
                                        <p className="text-green-600 dark:text-green-400 text-sm font-medium">No knowledge gaps detected</p>
                                        <p className="text-xs text-muted-foreground mt-1">All queries are being answered confidently</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Additional Info Footer */}
                        <div className="bg-muted/30 border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span>Data refreshes automatically every 5 minutes</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                                <span className="flex items-center gap-1 text-muted-foreground">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    Live data
                                </span>
                                <span className="text-muted-foreground">
                                    Last updated: {new Date().toLocaleTimeString()}
                                </span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
