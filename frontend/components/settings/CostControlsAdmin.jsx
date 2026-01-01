'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { usageApi } from '@/lib/api';
import { Settings, Users, Zap, Save, RotateCcw, Check, AlertCircle } from 'lucide-react';

export default function CostControlsAdmin() {
    const { isAdmin } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        if (isAdmin) loadUsers();
    }, [isAdmin]);

    const loadUsers = async () => {
        try {
            const data = await usageApi.getAllUsersUsage();
            setUsers(data.users || []);
        } catch (err) {
            console.error('Failed to load users:', err);
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const updateLimit = async (userId, field, value) => {
        setSaving(userId);
        try {
            await usageApi.updateUserLimits(userId, { [field]: parseInt(value) });
            setUsers(prev => prev.map(u =>
                u._id === userId ? { ...u, limits: { ...u.limits, [field]: parseInt(value) } } : u
            ));
            showToast('Limit updated successfully');
        } catch (err) {
            showToast(err.message || 'Failed to update limit', 'error');
        } finally {
            setSaving(null);
        }
    };

    const resetDailyAll = async () => {
        if (!confirm('Reset daily usage for ALL users? This cannot be undone.')) return;
        try {
            await usageApi.resetDailyUsage();
            showToast('Daily usage reset for all users');
            loadUsers();
        } catch (err) {
            showToast('Failed to reset daily usage', 'error');
        }
    };

    if (!isAdmin) {
        return (
            <div className="text-center text-muted-foreground py-8">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <p>Admin access required</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                        <Settings className="w-5 h-5 text-primary" />
                        Cost Controls
                    </h3>
                    <p className="text-muted-foreground text-sm mt-1">Manage user token limits</p>
                </div>
                <button
                    onClick={resetDailyAll}
                    className="flex items-center gap-2 px-3 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm rounded-lg transition-colors border border-border"
                >
                    <RotateCcw className="w-4 h-4" />
                    Reset All Daily
                </button>
            </div>

            {/* Users Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground bg-muted/50">
                                <th className="px-4 py-3 font-medium">User</th>
                                <th className="px-4 py-3 font-medium">Daily Usage</th>
                                <th className="px-4 py-3 font-medium">Daily Limit</th>
                                <th className="px-4 py-3 font-medium">Monthly Usage</th>
                                <th className="px-4 py-3 font-medium">Monthly Limit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {users.map(u => (
                                <tr key={u._id} className="hover:bg-muted/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{u.name}</p>
                                            <p className="text-xs text-muted-foreground">{u.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm ${(u.usage?.dailyTokens || 0) > (u.limits?.dailyTokens || 50000) * 0.9
                                                    ? 'text-destructive font-medium'
                                                    : 'text-foreground'
                                                }`}>
                                                {(u.usage?.dailyTokens || 0).toLocaleString()}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="number"
                                            defaultValue={u.limits?.dailyTokens || 50000}
                                            onBlur={(e) => updateLimit(u._id, 'dailyTokens', e.target.value)}
                                            className="w-28 bg-background border border-border rounded-lg px-2 py-1 text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-sm ${(u.usage?.monthlyTokens || 0) > (u.limits?.monthlyTokens || 500000) * 0.9
                                                ? 'text-destructive font-medium'
                                                : 'text-foreground'
                                            }`}>
                                            {(u.usage?.monthlyTokens || 0).toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="number"
                                            defaultValue={u.limits?.monthlyTokens || 500000}
                                            onBlur={(e) => updateLimit(u._id, 'monthlyTokens', e.target.value)}
                                            className="w-28 bg-background border border-border rounded-lg px-2 py-1 text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl animate-in slide-in-from-bottom-5 border
                    ${toast.type === 'error' ? 'bg-destructive border-destructive/50 text-destructive-foreground' : 'bg-card border-border text-foreground'}`}>
                    {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4 text-green-500" />}
                    <span className="text-sm font-medium">{toast.message}</span>
                </div>
            )}
        </div>
    );
}
