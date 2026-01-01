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
    Copy,
    Share2
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

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

    // Dialog states
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState(null);
    const [lastInviteLink, setLastInviteLink] = useState('');

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

            // Show success and close modal
            setShowInviteModal(false);
            setInviteEmail('');
            // Trigger a refresh or show a toast notification here ideally
            fetchMembers();
            if (data.invitationLink) {
                setLastInviteLink(data.invitationLink);
            }
            toast.success('Invitation sent successfully!');
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setInviteLoading(false);
        }
    };

    const confirmRemoveMember = (member) => {
        setMemberToDelete(member);
        setDeleteConfirmOpen(true);
        setActionMenuOpen(null);
    };

    const handleRemoveMember = async () => {
        if (!memberToDelete) return;

        try {
            const res = await fetch(`${API_URL}/api/organizations/members/${memberToDelete._id}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to remove member');
            }

            toast.success('Member removed');
            fetchMembers();
        } catch (err) {
            console.error('Error removing member:', err);
            // If already removed (404), refresh list
            if (err.message.includes('not found')) {
                toast.success('Member already removed');
                fetchMembers();
            } else {
                toast.error(err.message);
            }
        } finally {
            setDeleteConfirmOpen(false);
            setMemberToDelete(null);
        }
    };

    const handleChangeRole = async (memberId, newRole) => {
        try {
            const res = await fetch(`${API_URL}/api/organizations/members/${memberId}/role`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ orgRole: newRole }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update role');
            }

            toast.success(`Role updated to ${newRole}`);
            setActionMenuOpen(null);
            fetchMembers();
        } catch (err) {
            console.error('Error changing role:', err);
            toast.error(err.message);
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'owner': return <Crown className="w-4 h-4 text-warning" />;
            case 'admin': return <Shield className="w-4 h-4 text-primary" />;
            default: return <User className="w-4 h-4 text-muted-foreground" />;
        }
    };

    const getRoleBadge = (role) => {
        switch (role) {
            case 'owner':
                return <span className="px-2 py-1 rounded-full text-xs font-medium capitalize bg-warning/20 text-warning">{role}</span>;
            case 'admin':
                return <span className="px-2 py-1 rounded-full text-xs font-medium capitalize bg-primary/20 text-primary">{role}</span>;
            default:
                return <span className="px-2 py-1 rounded-full text-xs font-medium capitalize bg-muted text-muted-foreground">{role}</span>;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }


    return (
        <div className="space-y-6 p-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Team Members</h1>
                    <p className="text-muted-foreground">Manage your organization's team members and roles</p>
                </div>
                <button
                    onClick={() => setShowInviteModal(true)}
                    className="btn-primary"
                >
                    <UserPlus className="w-4 h-4" />
                    Invite Member
                </button>
            </div>

            {/* Members List */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="divide-y divide-border">
                    {members.map((member) => (
                        <div key={member._id} className="p-4 flex items-center justify-between hover:bg-accent/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-semibold">
                                    {member.avatar ? (
                                        <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        member.name?.charAt(0)?.toUpperCase() || '?'
                                    )}
                                </div>
                                <div>
                                    <div className="text-foreground font-medium flex items-center gap-2">
                                        {member.name}
                                        {getRoleIcon(member.orgRole)}
                                    </div>
                                    <div className="text-muted-foreground text-sm">{member.email}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                {getRoleBadge(member.orgRole)}

                                {member.lastLogin && (
                                    <span className="text-muted-foreground text-sm hidden md:block">
                                        Last active: {new Date(member.lastLogin).toLocaleDateString()}
                                    </span>
                                )}

                                {member.orgRole !== 'owner' && (
                                    <div className="relative">
                                        <button
                                            onClick={() => setActionMenuOpen(actionMenuOpen === member._id ? null : member._id)}
                                            className="p-2 hover:bg-accent rounded-lg transition-colors"
                                        >
                                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                        </button>

                                        {actionMenuOpen === member._id && (
                                            <div className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-lg shadow-xl z-20 overflow-hidden">
                                                {member.invitationToken && (
                                                    <button
                                                        onClick={() => {
                                                            const link = `${window.location.origin}/invite/${member.invitationToken}`;
                                                            navigator.clipboard.writeText(link);
                                                            toast.success('Invite link copied');
                                                            setActionMenuOpen(null);
                                                        }}
                                                        className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent flex items-center gap-2"
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                        Copy Invite Link
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleChangeRole(member._id, member.orgRole === 'admin' ? 'member' : 'admin')}
                                                    className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent flex items-center gap-2"
                                                >
                                                    <Shield className="w-4 h-4" />
                                                    {member.orgRole === 'admin' ? 'Remove Admin' : 'Make Admin'}
                                                </button>
                                                <button
                                                    onClick={() => confirmRemoveMember(member)}
                                                    className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2"
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
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <h2 className="text-lg font-semibold text-foreground">Invite Team Member</h2>
                            <button
                                onClick={() => {
                                    setShowInviteModal(false);
                                    setInviteEmail('');
                                    setInviteLink('');
                                    setError('');
                                }}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleInvite} className="p-4 space-y-4">
                            {error && (
                                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        required
                                        placeholder="colleague@company.com"
                                        className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Role
                                </label>
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="member">Member - Can use the platform</option>
                                    <option value="admin">Admin - Can manage members & settings</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={inviteLoading}
                                className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {inviteLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                        Sending Invite...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="w-4 h-4" />
                                        Send Invitation
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove Team Member</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove <strong>{memberToDelete?.name}</strong>?
                            They will lose access to the organization immediately. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <button
                            onClick={() => setDeleteConfirmOpen(false)}
                            className="px-4 py-2 hover:bg-accent rounded-lg transition-colors text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleRemoveMember}
                            className="px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg transition-colors text-sm font-medium"
                        >
                            Remove Member
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Invite Success Dialog with Link */}
            <Dialog open={!!lastInviteLink} onOpenChange={(open) => !open && setLastInviteLink('')}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Invitation Sent</DialogTitle>
                        <DialogDescription>
                            The invitation has been sent to the user. You can also copy the link below.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center gap-2 p-2 bg-muted rounded-md mt-2 border border-border">
                        <code className="text-xs flex-1 break-all font-mono text-muted-foreground">{lastInviteLink}</code>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(lastInviteLink);
                                toast.success('Link copied');
                            }}
                            className="p-2 hover:bg-background rounded-md transition-colors text-muted-foreground hover:text-foreground"
                            title="Copy link"
                        >
                            <Copy className="w-4 h-4" />
                        </button>
                    </div>
                    <DialogFooter>
                        <button
                            onClick={() => setLastInviteLink('')}
                            className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium transition-colors"
                        >
                            Done
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
