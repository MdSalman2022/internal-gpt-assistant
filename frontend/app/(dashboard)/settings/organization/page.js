'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { departmentsApi } from '@/lib/api';
import {
    Building2, Users2, Plus, Trash2, Check, X, ChevronDown, ChevronRight,
    Loader2, AlertCircle, UserPlus, Clock
} from 'lucide-react';

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
    const [error, setError] = useState(null);

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
                isAdmin ? departmentsApi.getAccessRequests() : Promise.resolve({ requests: [] })
            ]);
            setDepartments(deptData.departments || []);
            setAccessRequests(requestsData.requests || []);
        } catch (err) {
            console.error('Failed to load data:', err);
            setError(err.message);
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
        setError(null);
        try {
            await departmentsApi.createDepartment(newDeptName, newDeptDesc);
            setNewDeptName('');
            setNewDeptDesc('');
            await loadData();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteDepartment = async (id) => {
        if (!confirm('Delete this department and all its teams?')) return;

        try {
            await departmentsApi.deleteDepartment(id);
            await loadData();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleAddTeam = async (deptId) => {
        if (!newTeamName.trim()) return;

        setSaving(true);
        try {
            await departmentsApi.addTeam(deptId, newTeamName, '');
            setNewTeamName('');
            setActiveDeptForTeam(null);
            await loadData();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteTeam = async (deptId, teamId) => {
        try {
            await departmentsApi.removeTeam(deptId, teamId);
            await loadData();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleApproveRequest = async (req) => {
        // Optimistically remove from UI
        setAccessRequests(prev => prev.filter(r => r.id !== req.id));
        try {
            await departmentsApi.approveRequest(req.userId, req.type, req.resource);
        } catch (err) {
            setError(err.message);
            await loadData(); // Reload on error to restore state
        }
    };

    const handleRejectRequest = async (req) => {
        // Optimistically remove from UI
        setAccessRequests(prev => prev.filter(r => r.id !== req.id));
        try {
            await departmentsApi.rejectRequest(req.userId, req.type, req.resource);
        } catch (err) {
            setError(err.message);
            await loadData(); // Reload on error to restore state
        }
    };

    if (!isAdminOrVisitor) return null;

    return (
        <div className="h-full overflow-y-auto">
            <div className="p-6 pb-12 max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Header */}
                <div>
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary-400" />
                        Organization Structure
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        Manage departments, teams, and access requests
                    </p>
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                    </div>
                ) : (
                    <>
                        {/* Create Department Form */}
                        {isAdmin && (
                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                                <h3 className="font-medium text-white mb-4 flex items-center gap-2">
                                    <Plus className="w-4 h-4 text-green-400" />
                                    Create Department
                                </h3>
                                <form onSubmit={handleCreateDepartment} className="flex flex-col sm:flex-row gap-3">
                                    <input
                                        type="text"
                                        value={newDeptName}
                                        onChange={(e) => setNewDeptName(e.target.value)}
                                        placeholder="Department name"
                                        className="input flex-1"
                                    />
                                    <input
                                        type="text"
                                        value={newDeptDesc}
                                        onChange={(e) => setNewDeptDesc(e.target.value)}
                                        placeholder="Description (optional)"
                                        className="input flex-1"
                                    />
                                    <button
                                        type="submit"
                                        disabled={saving || !newDeptName.trim()}
                                        className="btn-primary whitespace-nowrap disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                        Add
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* Departments List */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                            <h3 className="font-medium text-white mb-4 flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-blue-400" />
                                Departments ({departments.length})
                            </h3>

                            {departments.length === 0 ? (
                                <p className="text-slate-500 text-sm py-4 text-center">
                                    No departments created yet
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {departments.map((dept) => (
                                        <div key={dept._id} className="border border-slate-700/50 rounded-lg overflow-hidden">
                                            {/* Department Header */}
                                            <div
                                                className="flex items-center justify-between p-3 bg-slate-800/50 cursor-pointer hover:bg-slate-800"
                                                onClick={() => toggleExpand(dept._id)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {expandedDepts[dept._id] ? (
                                                        <ChevronDown className="w-4 h-4 text-slate-400" />
                                                    ) : (
                                                        <ChevronRight className="w-4 h-4 text-slate-400" />
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-white">{dept.name}</p>
                                                        {dept.description && (
                                                            <p className="text-xs text-slate-500">{dept.description}</p>
                                                        )}
                                                    </div>
                                                    <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                                                        {dept.teams?.length || 0} teams
                                                    </span>
                                                </div>
                                                {isAdmin && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteDepartment(dept._id);
                                                        }}
                                                        className="p-1.5 text-red-400 hover:bg-red-500/20 rounded"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Teams (Expanded) */}
                                            {expandedDepts[dept._id] && (
                                                <div className="p-3 border-t border-slate-700/50 space-y-2">
                                                    {dept.teams?.map((team) => (
                                                        <div
                                                            key={team._id}
                                                            className="flex items-center justify-between p-2 bg-slate-800/30 rounded-lg"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Users2 className="w-4 h-4 text-slate-500" />
                                                                <span className="text-sm text-slate-300">{team.name}</span>
                                                            </div>
                                                            {isAdmin && (
                                                                <button
                                                                    onClick={() => handleDeleteTeam(dept._id, team._id)}
                                                                    className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}

                                                    {/* Add Team Form */}
                                                    {isAdmin && (
                                                        <div className="flex gap-2 mt-2">
                                                            <input
                                                                type="text"
                                                                value={activeDeptForTeam === dept._id ? newTeamName : ''}
                                                                onChange={(e) => {
                                                                    setActiveDeptForTeam(dept._id);
                                                                    setNewTeamName(e.target.value);
                                                                }}
                                                                onFocus={() => setActiveDeptForTeam(dept._id)}
                                                                placeholder="Add team..."
                                                                className="input text-sm flex-1"
                                                            />
                                                            <button
                                                                onClick={() => handleAddTeam(dept._id)}
                                                                disabled={!newTeamName.trim() || activeDeptForTeam !== dept._id}
                                                                className="btn-secondary text-xs disabled:opacity-50"
                                                            >
                                                                <Plus className="w-3 h-3" />
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
                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                                <h3 className="font-medium text-white mb-4 flex items-center gap-2">
                                    <UserPlus className="w-4 h-4 text-amber-400" />
                                    Pending Access Requests ({accessRequests.length})
                                </h3>
                                <div className="space-y-2">
                                    {accessRequests.map((req) => (
                                        <div
                                            key={req.id}
                                            className="flex items-center justify-between p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Clock className="w-4 h-4 text-amber-400" />
                                                <div>
                                                    <p className="text-sm text-white">
                                                        <span className="font-medium">{req.userName}</span>
                                                        <span className="text-slate-400"> ({req.userEmail})</span>
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        Requesting {req.type}: <span className="text-amber-400">{req.resource}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleApproveRequest(req)}
                                                    className="p-1.5 text-green-400 hover:bg-green-500/20 rounded"
                                                    title="Approve"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleRejectRequest(req)}
                                                    className="p-1.5 text-red-400 hover:bg-red-500/20 rounded"
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
