'use client';

import { useState, useEffect } from 'react';
import {
    Users,
    UserPlus,
    Crown,
    Shield,
    User,
    Mail,
    Trash2,
    MoreVertical,
    X,
    Check,
    AlertCircle,
    Copy
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function TeamPage() {
    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState([]);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('member');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteLink, setInviteLink] = useState('');
    const [error, setError] = useState('');
    const [actionMenuOpen, setActionMenuOpen] = useState(null);

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            const res = await fetch(`${API_URL}/api/organizations/members`, {
                credentials: 'include',
            });
            const data = await res.json();
            setMembers(data.members || []);
        } catch (err) {
            console.error('Error fetching members:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        setInviteLoading(true);
        setError('');
        setInviteLink('');

        try {
            const res = await fetch(`${API_URL}/api/organizations/members/invite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email: inviteEmail, orgRole: inviteRole }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to invite member');
            }

            if (data.invitationLink) {
                setInviteLink(data.invitationLink);
            } else {
                setShowInviteModal(false);
                setInviteEmail('');
                fetchMembers();
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setInviteLoading(false);
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (!confirm('Are you sure you want to remove this member?')) return;

        try {
            await fetch(`${API_URL}/api/organizations/members/${memberId}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            fetchMembers();
        } catch (err) {
            console.error('Error removing member:', err);
        }
    };

    const handleChangeRole = async (memberId, newRole) => {
        try {
            await fetch(`${API_URL}/api/organizations/members/${memberId}/role`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ orgRole: newRole }),
            });
            setActionMenuOpen(null);
            fetchMembers();
        } catch (err) {
            console.error('Error changing role:', err);
        }
    };

    const copyInviteLink = () => {
        navigator.clipboard.writeText(inviteLink);
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'owner': return <Crown className="w-4 h-4 text-yellow-400" />;
            case 'admin': return <Shield className="w-4 h-4 text-purple-400" />;
            default: return <User className="w-4 h-4 text-gray-400" />;
        }
    };

    const getRoleBadge = (role) => {
        const styles = {
            owner: 'bg-yellow-500/20 text-yellow-400',
            admin: 'bg-purple-500/20 text-purple-400',
            member: 'bg-gray-500/20 text-gray-400',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${styles[role]}`}>
                {role}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Team Members</h1>
                    <p className="text-gray-400">Manage your organization's team members and roles</p>
                </div>
                <button
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                >
                    <UserPlus className="w-4 h-4" />
                    Invite Member
                </button>
            </div>

            {/* Members List */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
                <div className="divide-y divide-gray-700">
                    {members.map((member) => (
                        <div key={member._id} className="p-4 flex items-center justify-between hover:bg-gray-700/20">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold">
                                    {member.avatar ? (
                                        <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        member.name?.charAt(0)?.toUpperCase() || '?'
                                    )}
                                </div>
                                <div>
                                    <div className="text-white font-medium flex items-center gap-2">
                                        {member.name}
                                        {getRoleIcon(member.orgRole)}
                                    </div>
                                    <div className="text-gray-400 text-sm">{member.email}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                {getRoleBadge(member.orgRole)}

                                {member.lastLogin && (
                                    <span className="text-gray-400 text-sm hidden md:block">
                                        Last active: {new Date(member.lastLogin).toLocaleDateString()}
                                    </span>
                                )}

                                {member.orgRole !== 'owner' && (
                                    <div className="relative">
                                        <button
                                            onClick={() => setActionMenuOpen(actionMenuOpen === member._id ? null : member._id)}
                                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                                        >
                                            <MoreVertical className="w-4 h-4 text-gray-400" />
                                        </button>

                                        {actionMenuOpen === member._id && (
                                            <div className="absolute right-0 top-full mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10">
                                                <button
                                                    onClick={() => handleChangeRole(member._id, member.orgRole === 'admin' ? 'member' : 'admin')}
                                                    className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                                                >
                                                    <Shield className="w-4 h-4" />
                                                    {member.orgRole === 'admin' ? 'Remove Admin' : 'Make Admin'}
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveMember(member._id)}
                                                    className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Remove Member
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-md">
                        <div className="flex items-center justify-between p-4 border-b border-gray-700">
                            <h2 className="text-lg font-semibold text-white">Invite Team Member</h2>
                            <button
                                onClick={() => {
                                    setShowInviteModal(false);
                                    setInviteEmail('');
                                    setInviteLink('');
                                    setError('');
                                }}
                                className="text-gray-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleInvite} className="p-4 space-y-4">
                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}

                            {inviteLink ? (
                                <div className="space-y-4">
                                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm flex items-center gap-2">
                                        <Check className="w-4 h-4" />
                                        Invitation created! Share this link:
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={inviteLink}
                                            readOnly
                                            className="flex-1 px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={copyInviteLink}
                                            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowInviteModal(false);
                                            setInviteEmail('');
                                            setInviteLink('');
                                            fetchMembers();
                                        }}
                                        className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg"
                                    >
                                        Done
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="email"
                                                value={inviteEmail}
                                                onChange={(e) => setInviteEmail(e.target.value)}
                                                required
                                                placeholder="colleague@company.com"
                                                className="w-full pl-10 pr-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Role
                                        </label>
                                        <select
                                            value={inviteRole}
                                            onChange={(e) => setInviteRole(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        >
                                            <option value="member">Member - Can use the platform</option>
                                            <option value="admin">Admin - Can manage members & settings</option>
                                        </select>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={inviteLoading}
                                        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {inviteLoading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus className="w-4 h-4" />
                                                Send Invitation
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
