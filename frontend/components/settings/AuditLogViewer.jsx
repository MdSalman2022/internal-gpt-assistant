'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { auditApi, usersApi } from '@/lib/api';
import {
    Shield, Search, Download, FileText, Database, User,
    Clock, AlertTriangle, CheckCircle, ChevronDown, ChevronRight, X
} from 'lucide-react';

export default function AuditLogViewer() {
    const { isAdmin, loading: authLoading } = useAuth();

    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Filters
    const [filters, setFilters] = useState({
        action: '',
        userId: '',
    });

    // Lists for dropdowns
    const [users, setUsers] = useState([]);

    // UI State
    const [expandedLogId, setExpandedLogId] = useState(null);

    useEffect(() => {
        if (!authLoading && isAdmin) {
            loadInitialData();
        }
    }, [isAdmin, authLoading]);

    const loadInitialData = async () => {
        try {
            const [usersData] = await Promise.all([
                usersApi.getUsers()
            ]);
            setUsers(usersData.users || []);
            loadLogs();
        } catch (error) {
            console.error('Failed to load initial data:', error);
        }
    };

    useEffect(() => {
        if (isAdmin) loadLogs();
    }, [page, filters, isAdmin]);

    const loadLogs = async () => {
        try {
            setLoading(true);
            const data = await auditApi.getLogs(filters, page);
            setLogs(data.logs || []);
            setTotalPages(data.pagination?.pages || 1);
        } catch (error) {
            console.error('Failed to load logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        // Simple CSV export logic
        const headers = ['Timestamp', 'Action', 'User', 'IP', 'Status', 'Resource', 'Details'];
        const csvContent = [
            headers.join(','),
            ...logs.map(log => [
                new Date(log.timestamp).toISOString(),
                log.action,
                log.userEmail || 'System',
                log.ipAddress || 'N/A',
                log.status,
                `${log.resourceType}:${log.resourceId}`,
                JSON.stringify(log.details || {}).replace(/,/g, ';') // Simple escape
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const actionColors = {
        LOGIN: 'text-green-400 bg-green-500/10',
        LOGOUT: 'text-slate-400 bg-slate-500/10',
        QUERY: 'text-blue-400 bg-blue-500/10',
        VIEW_DOCUMENT: 'text-cyan-400 bg-cyan-500/10',
        DOWNLOAD_DOCUMENT: 'text-purple-400 bg-purple-500/10',
        DELETE_DOCUMENT: 'text-red-400 bg-red-500/10',
        UPLOAD_DOCUMENT: 'text-emerald-400 bg-emerald-500/10',
        USER_UPDATE: 'text-orange-400 bg-orange-500/10',
        USER_DELETE: 'text-red-500 bg-red-500/10',
        FAILURE: 'text-red-500',
    };

    if (authLoading) return null;
    if (!isAdmin) return <div className="p-6 text-center text-slate-500">Access Denied. Admin only.</div>;

    return (
        <div className="flex flex-col h-full bg-transparent p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-medium text-white">Audit Logs</h2>
                    <p className="text-slate-400 text-sm">Forensic records of all system events.</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Filters */}
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <select
                                value={filters.userId}
                                onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
                                className="pl-3 pr-8 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:ring-1 focus:ring-primary-500 appearance-none min-w-[150px]"
                            >
                                <option value="">All Users</option>
                                {users.map(u => (
                                    <option key={u._id} value={u._id}>{u.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        <div className="relative">
                            <select
                                value={filters.action}
                                onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                                className="pl-3 pr-8 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:ring-1 focus:ring-primary-500 appearance-none"
                            >
                                <option value="">All Actions</option>
                                <option value="LOGIN">Login / Register</option>
                                <option value="QUERY">Queries</option>
                                <option value="DOWNLOAD_DOCUMENT">Document Downloads</option>
                                <option value="VIEW_DOCUMENT">Document Views</option>
                                <option value="DELETE_DOCUMENT">Document Deletions</option>
                                <option value="USER_UPDATE">User Admin</option>
                                <option value="FAILURE">Failures</option>
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>

                    <button onClick={handleExport} className="btn-secondary py-1.5 text-sm">
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-700/50 text-xs uppercase tracking-wider text-slate-500 bg-slate-800/50">
                            <th className="px-6 py-4 w-6"></th>
                            <th className="px-6 py-4 font-medium">Timestamp</th>
                            <th className="px-6 py-4 font-medium">User</th>
                            <th className="px-6 py-4 font-medium">Action</th>
                            <th className="px-6 py-4 font-medium">Resource</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                                        Loading logs...
                                    </div>
                                </td>
                            </tr>
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                    No audit logs found matching filters.
                                </td>
                            </tr>
                        ) : (
                            logs.map(log => (
                                <>
                                    <tr
                                        key={log._id}
                                        onClick={() => setExpandedLogId(expandedLogId === log._id ? null : log._id)}
                                        className={`
                                            group cursor-pointer transition-colors hover:bg-slate-800/30
                                            ${expandedLogId === log._id ? 'bg-slate-800/50' : ''}
                                        `}
                                    >
                                        <td className="px-6 py-4">
                                            {expandedLogId === log._id ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-300 font-mono">
                                                <Clock className="w-3.5 h-3.5 text-slate-500" />
                                                {new Date(log.timestamp).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                                                    {(log.userEmail || 'S').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white">{log.userId?.name || 'Unknown'}</p>
                                                    <p className="text-xs text-slate-500">{log.userEmail || 'System/Guest'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${actionColors[log.action] || 'bg-slate-800 text-slate-400'}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-400 font-mono">
                                            {log.resourceType ? `${log.resourceType}:${log.resourceId?.substring(0, 6)}...` : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {log.status === 'SUCCESS' ? (
                                                <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                                                    <CheckCircle className="w-3.5 h-3.5" /> Success
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-xs text-red-400">
                                                    <AlertTriangle className="w-3.5 h-3.5" /> {log.status}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                    {/* Expanded Details Row */}
                                    {expandedLogId === log._id && (
                                        <tr className="bg-slate-900/50 border-b border-slate-800">
                                            <td colSpan="6" className="px-6 py-4">
                                                <div className="ml-10 p-4 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs">
                                                    <h4 className="text-slate-400 mb-2 font-bold uppercase tracking-wider text-[10px]">Event Details</h4>
                                                    <div className="grid grid-cols-2 gap-8">
                                                        <div>
                                                            <p className="text-slate-500 mb-1">IP Address</p>
                                                            <p className="text-slate-300 mb-4">{log.ipAddress || 'Unknown'}</p>

                                                            <p className="text-slate-500 mb-1">User Agent</p>
                                                            <p className="text-slate-300 truncate max-w-md">{log.userAgent || 'Unknown'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-slate-500 mb-1">Metadata</p>
                                                            <pre className="text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                                                                {JSON.stringify(log.details, null, 2)}
                                                            </pre>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
                <button
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="px-4 py-2 text-sm text-slate-400 disabled:opacity-50 hover:text-white"
                >
                    Previous
                </button>
                <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
                <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-4 py-2 text-sm text-slate-400 disabled:opacity-50 hover:text-white"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
