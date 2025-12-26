'use client';

import { useState, useEffect } from 'react';
import { usersApi } from '@/lib/api';
import {
    X, Shield, AlertTriangle, FileText, Clock, User as UserIcon,
    Mail, Calendar, Activity, Eye, Download
} from 'lucide-react';

export default function UserProfileModal({ userId, onClose }) {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const data = await usersApi.getUserProfile(userId);
                setProfile(data);
            } catch (err) {
                console.error('Failed to fetch user profile:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (userId) fetchProfile();
    }, [userId]);

    useEffect(() => {
        const handleEsc = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!userId) return null;

    const roleBadge = (role) => {
        const styles = {
            admin: 'bg-red-500/10 text-red-400 border-red-500/20',
            employee: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            visitor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        };
        return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[role] || styles.employee} uppercase tracking-wider`}>
                <Shield className="w-3 h-3" />
                {role}
            </span>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl animate-scale-in flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">User Profile</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-48">
                            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="p-6 text-center text-red-400">
                            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                            <p>{error}</p>
                        </div>
                    ) : profile && (
                        <>
                            {/* User Info Header */}
                            <div className="p-5 bg-slate-800/30 border-b border-slate-800">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500/20 to-indigo-500/20 flex items-center justify-center border border-slate-700">
                                        <span className="text-2xl font-bold text-white">
                                            {profile.user.name?.charAt(0).toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-white">{profile.user.name}</h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-sm text-slate-400 flex items-center gap-1">
                                                <Mail className="w-3 h-3" /> {profile.user.email}
                                            </span>
                                            {roleBadge(profile.user.role)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Cards */}
                            <div className="p-5 grid grid-cols-3 gap-4">
                                <div className={`p-4 rounded-xl border ${profile.stats.redFlags.total > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-800/50 border-slate-700'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle className={`w-4 h-4 ${profile.stats.redFlags.total > 0 ? 'text-red-400' : 'text-slate-500'}`} />
                                        <span className="text-xs text-slate-400 uppercase tracking-wider">Red Flags</span>
                                    </div>
                                    <p className={`text-2xl font-bold ${profile.stats.redFlags.total > 0 ? 'text-red-400' : 'text-white'}`}>
                                        {profile.stats.redFlags.total}
                                    </p>
                                    <div className="mt-1 text-xs text-slate-500">
                                        {profile.stats.redFlags.blocked} blocked • {profile.stats.redFlags.redacted} redacted
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Activity className="w-4 h-4 text-primary-400" />
                                        <span className="text-xs text-slate-400 uppercase tracking-wider">Queries</span>
                                    </div>
                                    <p className="text-2xl font-bold text-white">{profile.stats.totalQueries}</p>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileText className="w-4 h-4 text-blue-400" />
                                        <span className="text-xs text-slate-400 uppercase tracking-wider">Docs Accessed</span>
                                    </div>
                                    <p className="text-2xl font-bold text-white">{profile.stats.documentsAccessed}</p>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="border-t border-slate-800">
                                <div className="flex border-b border-slate-800">
                                    <button
                                        onClick={() => setActiveTab('redflags')}
                                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'redflags' ? 'text-red-400 border-b-2 border-red-400' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Red Flag History
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('documents')}
                                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'documents' ? 'text-primary-400 border-b-2 border-primary-400' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Document Access
                                    </button>
                                </div>

                                <div className="p-4 max-h-64 overflow-y-auto">
                                    {activeTab === 'redflags' ? (
                                        profile.recentRedFlags.length === 0 ? (
                                            <p className="text-center text-slate-500 py-6">No red flags recorded</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {profile.recentRedFlags.map((flag, i) => (
                                                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                                        <AlertTriangle className={`w-4 h-4 ${flag.action === 'GUARDRAIL_BLOCK' ? 'text-red-500' : 'text-amber-400'}`} />
                                                        <div className="flex-1">
                                                            <p className="text-sm text-white">
                                                                {flag.action === 'GUARDRAIL_BLOCK' ? 'Blocked' : 'PII Redacted'}
                                                            </p>
                                                            {flag.details?.types && (
                                                                <p className="text-xs text-slate-400">Types: {flag.details.types.join(', ')}</p>
                                                            )}
                                                            {flag.details?.reason && (
                                                                <p className="text-xs text-slate-400">Reason: {flag.details.reason}</p>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-slate-500 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {new Date(flag.timestamp).toLocaleString()}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    ) : (
                                        profile.recentDocumentAccess.length === 0 ? (
                                            <p className="text-center text-slate-500 py-6">No document access recorded</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {profile.recentDocumentAccess.map((doc, i) => (
                                                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                                        {doc.action === 'VIEW_DOCUMENT' ? (
                                                            <Eye className="w-4 h-4 text-blue-400" />
                                                        ) : (
                                                            <Download className="w-4 h-4 text-green-400" />
                                                        )}
                                                        <div className="flex-1">
                                                            <p className="text-sm text-white">
                                                                {doc.action === 'VIEW_DOCUMENT' ? 'Viewed' : 'Downloaded'}
                                                            </p>
                                                            <p className="text-xs text-slate-400">Doc ID: {doc.resourceId?.substring(0, 8)}...</p>
                                                        </div>
                                                        <span className="text-xs text-slate-500 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {new Date(doc.timestamp).toLocaleString()}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 flex justify-end">
                    <button onClick={onClose} className="btn-secondary">Close</button>
                </div>
            </div>
        </div>
    );
}
