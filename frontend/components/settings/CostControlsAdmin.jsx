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
            <div className="text-center text-slate-500 py-8">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <p>Admin access required</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium text-white flex items-center gap-2">
                        <Settings className="w-5 h-5 text-primary-400" />
                        Cost Controls
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">Manage user token limits</p>
                </div>
                <button
                    onClick={resetDailyAll}
                    className="btn-secondary text-xs flex items-center gap-1.5"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset All Daily
                </button>
            </div>

            {/* Users Table */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-700/50 text-xs uppercase tracking-wider text-slate-500 bg-slate-800/50">
                            <th className="px-4 py-3">User</th>
                            <th className="px-4 py-3">Daily Usage</th>
                            <th className="px-4 py-3">Daily Limit</th>
                            <th className="px-4 py-3">Monthly Usage</th>
                            <th className="px-4 py-3">Monthly Limit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {users.map(u => (
                            <tr key={u._id} className="hover:bg-slate-800/30">
                                <td className="px-4 py-3">
                                    <div>
                                        <p className="text-sm text-white">{u.name}</p>
                                        <p className="text-xs text-slate-500">{u.email}</p>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="text-sm text-slate-300">
                                        {(u.usage?.dailyTokens || 0).toLocaleString()}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <input
                                        type="number"
                                        defaultValue={u.limits?.dailyTokens || 50000}
                                        onBlur={(e) => updateLimit(u._id, 'dailyTokens', e.target.value)}
                                        className="w-24 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <span className="text-sm text-slate-300">
                                        {(u.usage?.monthlyTokens || 0).toLocaleString()}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <input
                                        type="number"
                                        defaultValue={u.limits?.monthlyTokens || 500000}
                                        onBlur={(e) => updateLimit(u._id, 'monthlyTokens', e.target.value)}
                                        className="w-28 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl animate-scale-in border
                    ${toast.type === 'error' ? 'bg-slate-900 border-red-500/50 text-red-200' : 'bg-slate-900 border-green-500/50 text-green-200'}`}>
                    {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    <span className="text-sm">{toast.message}</span>
                </div>
            )}
        </div>
    );
}
