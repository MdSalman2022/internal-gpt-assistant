'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { usersApi } from '@/lib/api';
import {
    Users, Search, Trash2, CheckCircle, AlertCircle, X, Shield,
    User as UserIcon, MoreVertical, LayoutGrid, Calendar, Mail
} from 'lucide-react';

export default function UsersList() {
    const { user: currentUser, isAdmin } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // UI State
    const [selectedUser, setSelectedUser] = useState(null); // For role edit modal
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [toast, setToast] = useState(null);
    const [roleUpdating, setRoleUpdating] = useState(false);

    const showToast = (message, type = 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await usersApi.getUsers();
            setUsers(data.users || []);
        } catch (error) {
            console.error('Failed to load users:', error);
            showToast('Failed to load users list', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleDelete = async (userId) => {
        if (!isAdmin) {
            showToast('You are not an admin. Only administrators can delete users.', 'error');
            return;
        }

        if (userId === currentUser.id) {
            showToast('You cannot delete your own account', 'error');
            return;
        }

        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

        try {
            await usersApi.deleteUser(userId);
            setUsers(prev => prev.filter(u => u._id !== userId));
            showToast('User deleted successfully', 'success');
        } catch (error) {
            console.error('Delete failed:', error);
            showToast(error.message || 'Failed to delete user', 'error');
        }
    };

    const handleRoleUpdate = async (userId, newRole) => {
        if (!isAdmin) {
            showToast('You are not an admin. Only administrators can change user roles.', 'error');
            return;
        }

        if (userId === currentUser.id && newRole !== 'admin') {
            // Basic safety check on frontend
            if (!confirm('Warning: You are demoting yourself from Admin. You might lose access to this page. Continue?')) return;
        }

        setRoleUpdating(true);
        try {
            await usersApi.updateUser(userId, { role: newRole });
            setUsers(prev => prev.map(u =>
                u._id === userId ? { ...u, role: newRole } : u
            ));
            setIsEditModalOpen(false);
            showToast('User role updated successfully', 'success');
        } catch (error) {
            console.error('Update failed:', error);
            showToast(error.message || 'Failed to update user role', 'error');
        } finally {
            setRoleUpdating(false);
        }
    };

    // Filter users
    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
        <div className="flex flex-col h-full bg-transparent p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-medium text-white">Users</h2>
                    <p className="text-slate-400 text-sm">Manage system access and roles.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="max-w-xs relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                        />
                    </div>
                    <div className="bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700/50">
                        <span className="text-slate-400 text-sm">Total: </span>
                        <span className="text-white font-mono font-semibold">{users.length}</span>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-700/50 text-xs uppercase tracking-wider text-slate-500 bg-slate-800/50">
                            <th className="px-6 py-4 font-medium">User</th>
                            <th className="px-6 py-4 font-medium">Role</th>
                            <th className="px-6 py-4 font-medium">Joined</th>
                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {loading ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                                        Loading users...
                                    </div>
                                </td>
                            </tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                                    No users found matching your search.
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map(u => (
                                <tr key={u._id} className="group hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-slate-700 shadow-inner">
                                                <span className="text-white font-semibold text-sm">
                                                    {u.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white group-hover:text-primary-400 transition-colors">
                                                    {u.name}
                                                    {u._id === currentUser.id && <span className="ml-2 text-xs text-slate-500">(You)</span>}
                                                </p>
                                                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                                    <Mail className="w-3 h-3" />
                                                    {u.email}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {roleBadge(u.role)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-400">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(u.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedUser(u);
                                                    setIsEditModalOpen(true);
                                                }}
                                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors text-xs font-medium border border-transparent hover:border-slate-600"
                                                title="Change Role"
                                            >
                                                Edit Role
                                            </button>

                                            {u._id !== currentUser.id && (
                                                <button
                                                    onClick={() => handleDelete(u._id)}
                                                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                                                    title="Delete User"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Role Modal */}
            {isEditModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsEditModalOpen(false)}>
                    <div
                        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-slate-800">
                            <h3 className="text-xl font-semibold text-white">Edit User Role</h3>
                            <p className="text-slate-400 text-sm mt-1">
                                Change access level for <span className="text-white font-medium">{selectedUser.name}</span>
                            </p>
                        </div>

                        <div className="p-6 space-y-3">
                            {['admin', 'visitor', 'employee'].map((role) => (
                                <button
                                    key={role}
                                    onClick={() => handleRoleUpdate(selectedUser._id, role)}
                                    disabled={roleUpdating}
                                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left group
                                        ${selectedUser.role === role
                                            ? 'bg-primary-500/10 border-primary-500/50 shadow-[0_0_15px_-3px_rgba(var(--primary-500),0.3)]'
                                            : 'bg-slate-800/50 border-slate-700 hover:border-primary-500/30 hover:bg-slate-800'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center
                                            ${selectedUser.role === role ? 'border-primary-500' : 'border-slate-600 group-hover:border-primary-500/50'}
                                        `}>
                                            {selectedUser.role === role && <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />}
                                        </div>
                                        <div>
                                            <span className={`block font-medium ${selectedUser.role === role ? 'text-primary-400' : 'text-slate-200'}`}>
                                                {role.charAt(0).toUpperCase() + role.slice(1)}
                                            </span>
                                        </div>
                                    </div>
                                    {roleBadge(role)}
                                </button>
                            ))}
                        </div>

                        <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex justify-end">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-4 py-2 text-slate-400 hover:text-white font-medium transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl animate-scale-in border
                    ${toast.type === 'error'
                        ? 'bg-slate-900 border-red-500/50 text-red-200'
                        : 'bg-slate-900 border-primary-500/50 text-primary-200'
                    }`}
                >
                    {toast.type === 'error' ? <AlertCircle className="w-5 h-5 text-red-400" /> : <CheckCircle className="w-5 h-5 text-primary-400" />}
                    <span className="text-sm font-medium">{toast.message}</span>
                    <button onClick={() => setToast(null)} className="ml-2 hover:bg-white/10 rounded p-0.5">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
