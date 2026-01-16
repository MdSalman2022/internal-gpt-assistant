'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { departmentsApi } from '@/lib/api';
import {
    Building2, Users2, Plus, Trash2, Check, X, ChevronDown, ChevronRight,
    Loader2, AlertCircle, UserPlus, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrganizationPage() {
    const { isAdminOrVisitor, isAdmin } = useAuth();
    const router = useRouter();

    const [departments, setDepartments] = useState([]);
    const [accessRequests, setAccessRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedDepts, setExpandedDepts] = useState({});

    // Form states
    const [newDeptName, setNewDeptName] = useState('');
    const [newDeptDesc, setNewDeptDesc] = useState('');
    const [newTeamName, setNewTeamName] = useState('');
    const [activeDeptForTeam, setActiveDeptForTeam] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isAdminOrVisitor === false) {
            router.replace('/settings/profile');
        } else if (isAdminOrVisitor) {
            loadData();
        }
    }, [isAdminOrVisitor, router]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [deptData, requestsData] = await Promise.all([
                departmentsApi.getDepartments(),
                isAdmin ? departmentsApi.getAccessRequests() : Promise.resolve({ requests: [] }),
            ]);
            setDepartments(deptData.departments || []);
            setAccessRequests(requestsData.requests || []);
        } catch (err) {
            console.error('Failed to load data:', err);
            toast.error('Failed to load organization data');
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (deptId) => {
        setExpandedDepts(prev => ({ ...prev, [deptId]: !prev[deptId] }));
    };

    const handleCreateDepartment = async (e) => {
        e.preventDefault();
        if (!newDeptName.trim()) return;

        setSaving(true);
        try {
            await departmentsApi.createDepartment(newDeptName, newDeptDesc);
            setNewDeptName('');
            setNewDeptDesc('');
            toast.success('Department created');
            await loadData();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteDepartment = async (id) => {
        if (!confirm('Delete this department and all its teams?')) return;

        try {
            await departmentsApi.deleteDepartment(id);
            toast.success('Department deleted');
            await loadData();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleAddTeam = async (deptId) => {
        if (!newTeamName.trim()) return;

        setSaving(true);
        try {
            await departmentsApi.addTeam(deptId, newTeamName, '');
            setNewTeamName('');
            setActiveDeptForTeam(null);
            toast.success('Team added');
            await loadData();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteTeam = async (deptId, teamId) => {
        if (!confirm('Delete this team?')) return;
        try {
            await departmentsApi.removeTeam(deptId, teamId);
            toast.success('Team deleted');
            await loadData();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleApproveRequest = async (req) => {
        // Optimistically remove from UI
        setAccessRequests(prev => prev.filter(r => r.id !== req.id));
        try {
            await departmentsApi.approveRequest(req.userId, req.type, req.resource);
            toast.success('Request approved');
        } catch (err) {
            toast.error(err.message);
            await loadData(); // Reload on error to restore state
        }
    };

    const handleRejectRequest = async (req) => {
        // Optimistically remove from UI
        setAccessRequests(prev => prev.filter(r => r.id !== req.id));
        try {
            await departmentsApi.rejectRequest(req.userId, req.type, req.resource);
            toast.success('Request rejected');
        } catch (err) {
            toast.error(err.message);
            await loadData(); // Reload on error to restore state
        }
    };

    if (!isAdminOrVisitor) return null;

    return (
        <div className="h-full overflow-y-auto">
            <div className="p-6 pb-12 w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Header */}
                <div>
                    <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary" />
                        Organization Structure
                    </h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        Manage departments, teams, and access requests
                    </p>
                </div>



                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <>
                        {/* Create Department Form */}
                        {isAdmin && (
                            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                                <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
                                    <Plus className="w-4 h-4 text-emerald-500" />
                                    Create Department
                                </h3>
                                <form onSubmit={handleCreateDepartment} className="flex flex-col sm:flex-row gap-3">
                                    <input
                                        type="text"
                                        value={newDeptName}
                                        onChange={(e) => setNewDeptName(e.target.value)}
                                        placeholder="Department name"
                                        className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                    <input
                                        type="text"
                                        value={newDeptDesc}
                                        onChange={(e) => setNewDeptDesc(e.target.value)}
                                        placeholder="Description (optional)"
                                        className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                    <button
                                        type="submit"
                                        disabled={saving || !newDeptName.trim()}
                                        className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap flex items-center justify-center gap-2"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                        Add
                                    </button>
                                </form>
                            </div>
                        )}



                        {/* Departments List */}
                        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                            <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-blue-500" />
                                Departments ({departments.length})
                            </h3>

                            {departments.length === 0 ? (
                                <p className="text-muted-foreground text-sm py-4 text-center">
                                    No departments created yet
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {departments.map((dept) => (
                                        <div key={dept._id} className="border border-border rounded-lg overflow-hidden transition-colors">
                                            {/* Department Header */}
                                            <div
                                                className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer hover:bg-muted/60 transition-colors"
                                                onClick={() => toggleExpand(dept._id)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {expandedDepts[dept._id] ? (
                                                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                                    ) : (
                                                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-foreground">{dept.name}</p>
                                                        {dept.description && (
                                                            <p className="text-xs text-muted-foreground">{dept.description}</p>
                                                        )}
                                                    </div>
                                                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                                                        {dept.teams?.length || 0} teams
                                                    </span>
                                                </div>
                                                {isAdmin && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteDepartment(dept._id);
                                                        }}
                                                        className="p-1.5 text-destructive hover:bg-destructive/10 rounded transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Teams (Expanded) */}
                                            {expandedDepts[dept._id] && (
                                                <div className="p-3 border-t border-border bg-background/50 space-y-2">
                                                    {dept.teams?.length > 0 ? (
                                                        dept.teams.map((team) => (
                                                            <div
                                                                key={team._id}
                                                                className="flex items-center justify-between p-2 bg-muted/40 rounded-lg hover:bg-muted/70 transition-colors"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <Users2 className="w-4 h-4 text-muted-foreground" />
                                                                    <span className="text-sm text-foreground">{team.name}</span>
                                                                </div>
                                                                {isAdmin && (
                                                                    <button
                                                                        onClick={() => handleDeleteTeam(dept._id, team._id)}
                                                                        className="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors"
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-xs text-muted-foreground px-2">No teams yet</p>
                                                    )}

                                                    {/* Add Team Form */}
                                                    {isAdmin && (
                                                        <div className="flex gap-2 mt-2 pt-2">
                                                            <input
                                                                type="text"
                                                                value={activeDeptForTeam === dept._id ? newTeamName : ''}
                                                                onChange={(e) => {
                                                                    setActiveDeptForTeam(dept._id);
                                                                    setNewTeamName(e.target.value);
                                                                }}
                                                                onFocus={() => setActiveDeptForTeam(dept._id)}
                                                                placeholder="Add team..."
                                                                className="flex-1 bg-background border border-border rounded-lg px-2 py-1.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                                            />
                                                            <button
                                                                onClick={() => handleAddTeam(dept._id)}
                                                                disabled={!newTeamName.trim() || activeDeptForTeam !== dept._id}
                                                                className="px-2 py-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg disabled:opacity-50 transition-colors flex items-center justify-center"
                                                            >
                                                                <Plus className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Access Requests (Admin Only) */}
                        {isAdmin && accessRequests.length > 0 && (
                            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                                <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
                                    <UserPlus className="w-4 h-4 text-warning" />
                                    Pending Access Requests ({accessRequests.length})
                                </h3>
                                <div className="space-y-2">
                                    {accessRequests.map((req) => (
                                        <div
                                            key={req.id}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-warning/5 border border-warning/20 rounded-lg transition-colors hover:bg-warning/10 gap-3"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-warning/10 rounded-full flex-shrink-0">
                                                    <Clock className="w-4 h-4 text-warning" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm text-foreground truncate">
                                                        <span className="font-medium">{req.userName}</span>
                                                        <span className="text-muted-foreground"> ({req.userEmail})</span>
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                                        Requesting {req.type}: <span className="text-warning font-medium">{req.resource}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 self-end sm:self-auto">
                                                <button
                                                    onClick={() => handleApproveRequest(req)}
                                                    className="p-1.5 bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 rounded-lg transition-colors border border-green-500/20"
                                                    title="Approve"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleRejectRequest(req)}
                                                    className="p-1.5 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-lg transition-colors border border-destructive/20"
                                                    title="Reject"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
