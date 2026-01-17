'use client';

import { useState, useEffect } from 'react';
import VerifiedBadge from '../ui/VerifiedBadge';
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
            admin: 'bg-destructive/10 text-destructive border-destructive/20',
            employee: 'bg-primary/10 text-primary border-primary/20',
            visitor: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
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
                className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl animate-scale-in flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-5 border-b border-border flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-foreground">User Profile</h2>
                    <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors">
                        <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-48">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="p-6 text-center text-destructive">
                            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                            <p>{error}</p>
                        </div>
                    ) : profile && (
                        <>
                            {/* User Info Header */}
                            <div className="p-5 bg-secondary/30 border-b border-border">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center border border-border overflow-hidden">
                                        {profile.user.avatar ? (
                                            <img 
                                                src={profile.user.avatar} 
                                                alt={profile.user.name} 
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-2xl font-bold text-primary-foreground">
                                                {profile.user.name?.charAt(0).toUpperCase() || 'U'}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-semibold text-foreground">{profile.user.name}</h3>
                                            {profile.user.isVerified && (
                                                <VerifiedBadge className="w-5 h-5 text-blue-500" />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Mail className="w-3 h-3" /> {profile.user.email}
                                            </span>
                                            {roleBadge(profile.user.role)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Cards */}
                            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className={`p-4 rounded-xl border ${profile.stats.redFlags.total > 0 ? 'bg-destructive/10 border-destructive/30' : 'bg-secondary/30 border-border'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle className={`w-4 h-4 ${profile.stats.redFlags.total > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Red Flags</span>
                                    </div>
                                    <p className={`text-2xl font-bold ${profile.stats.redFlags.total > 0 ? 'text-destructive' : 'text-foreground'}`}>
                                        {profile.stats.redFlags.total}
                                    </p>
                                    <div className="mt-1 text-[10px] text-muted-foreground">
                                        {profile.stats.redFlags.blocked} blocked • {profile.stats.redFlags.redacted} redacted
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Activity className="w-4 h-4 text-primary" />
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Queries</span>
                                    </div>
                                    <p className="text-2xl font-bold text-foreground">{profile.stats.totalQueries}</p>
                                </div>

                                <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileText className="w-4 h-4 text-primary" />
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Documents</span>
                                    </div>
                                    <p className="text-2xl font-bold text-foreground">{profile.stats.documentsAccessed}</p>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="border-t border-border">
                                <div className="flex border-b border-border">
                                    <button
                                        onClick={() => setActiveTab('redflags')}
                                        className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'redflags' ? 'text-destructive border-destructive' : 'text-muted-foreground border-transparent hover:text-foreground'}`}
                                    >
                                        Red Flag History
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('documents')}
                                        className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'documents' ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-foreground'}`}
                                    >
                                        Document Access
                                    </button>
                                </div>

                                <div className="p-4 max-h-64 overflow-y-auto">
                                    {activeTab === 'redflags' ? (
                                        profile.recentRedFlags.length === 0 ? (
                                            <p className="text-center text-muted-foreground py-6 text-sm">No red flags recorded</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {profile.recentRedFlags.map((flag, i) => (
                                                    <div key={i} className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg border border-border/50">
                                                        <AlertTriangle className={`w-4 h-4 ${flag.action === 'GUARDRAIL_BLOCK' ? 'text-destructive' : 'text-amber-500'}`} />
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-foreground">
                                                                {flag.action === 'GUARDRAIL_BLOCK' ? 'Blocked' : 'PII Redacted'}
                                                            </p>
                                                            {flag.details?.types && (
                                                                <p className="text-xs text-muted-foreground">Types: {flag.details.types.join(', ')}</p>
                                                            )}
                                                            {flag.details?.reason && (
                                                                <p className="text-xs text-muted-foreground">Reason: {flag.details.reason}</p>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {new Date(flag.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    ) : (
                                        profile.recentDocumentAccess.length === 0 ? (
                                            <p className="text-center text-muted-foreground py-6 text-sm">No document access recorded</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {profile.recentDocumentAccess.map((doc, i) => (
                                                    <div key={i} className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg border border-border/50">
                                                        {doc.action === 'VIEW_DOCUMENT' ? (
                                                            <Eye className="w-4 h-4 text-primary" />
                                                        ) : (
                                                            <Download className="w-4 h-4 text-primary" />
                                                        )}
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-foreground">
                                                                {doc.action === 'VIEW_DOCUMENT' ? 'Viewed' : 'Downloaded'}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">Doc ID: {doc.resourceId?.substring(0, 8)}...</p>
                                                        </div>
                                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {new Date(doc.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
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
                <div className="p-4 border-t border-border bg-secondary/50 flex justify-end">
                    <button onClick={onClose} className="btn-secondary">Close</button>
                </div>
            </div>
        </div>
    );
}
