'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { profileApi, departmentsApi } from '@/lib/api';
import { Save, Loader2, CheckCircle, Clock, XCircle, Building2, Users2, Plus, X } from 'lucide-react';

export default function ProfilePage() {
    const { user, checkAuth } = useAuth();

    const [profile, setProfile] = useState({
        name: '',
        email: '',
    });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);

    // Departments and teams
    const [allDepartments, setAllDepartments] = useState([]);
    const [allTeams, setAllTeams] = useState([]);
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedTeam, setSelectedTeam] = useState('');
    const [requesting, setRequesting] = useState(false);

    // Initialize form with user data
    useEffect(() => {
        if (user) {
            setProfile({
                name: user.name || '',
                email: user.email || '',
            });
        }
    }, [user]);

    // Fetch departments and teams
    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const data = await departmentsApi.getDepartments();
                setAllDepartments(data.departments || []);

                // Build teams list
                const teams = [];
                data.departments?.forEach(dept => {
                    dept.teams?.forEach(team => {
                        teams.push({ name: `${dept.name}:${team.name}`, deptName: dept.name, teamName: team.name });
                    });
                });
                setAllTeams(teams);
            } catch (err) {
                console.error('Failed to fetch departments:', err);
            }
        };
        fetchDepartments();
    }, []);

    const handleSaveProfile = async () => {
        setSaving(true);
        setError(null);
        setSaved(false);

        try {
            await profileApi.updateProfile({
                name: profile.name,
            });

            await checkAuth();
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error('Failed to save profile:', err);
            setError(err.message || 'Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const handleRequestDepartment = async () => {
        if (!selectedDept) return;
        setRequesting(true);
        setError(null);

        try {
            await departmentsApi.requestAccess(selectedDept, null);
            await checkAuth();
            setSelectedDept('');
        } catch (err) {
            setError(err.message);
        } finally {
            setRequesting(false);
        }
    };

    const handleRequestTeam = async () => {
        if (!selectedTeam) return;
        setRequesting(true);
        setError(null);

        try {
            await departmentsApi.requestAccess(null, selectedTeam);
            await checkAuth();
            setSelectedTeam('');
        } catch (err) {
            setError(err.message);
        } finally {
            setRequesting(false);
        }
    };

    // Get status badge for department/team
    const StatusBadge = ({ status }) => {
        if (status === 'approved') {
            return (
                <span className="inline-flex items-center p-1 bg-green-500/10 rounded-full" title="Approved">
                    <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                </span>
            );
        }
        if (status === 'pending') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded-full text-xs text-amber-400">
                    <Clock className="w-3 h-3" />
                    Pending
                </span>
            );
        }
        return null;
    };

    // Combine approved and pending for display
    const approvedDepts = user?.departments || [];
    const pendingDepts = user?.pendingDepartments || [];
    const approvedTeams = user?.teams || [];
    const pendingTeams = user?.pendingTeams || [];

    // Available departments to request (not already approved or pending)
    const availableDepts = allDepartments.filter(d =>
        !approvedDepts.includes(d.name) && !pendingDepts.includes(d.name)
    );
    const availableTeams = allTeams.filter(t =>
        !approvedTeams.includes(t.name) && !pendingTeams.includes(t.name)
    );

    return (
        <div className="h-full overflow-y-auto">
            <div className="p-6 pb-12 max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-semibold text-white">Profile Settings</h2>

                {/* Avatar Section */}
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
                        <span className="text-2xl font-bold text-white">
                            {profile.name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                    </div>
                    <div>
                        <p className="text-white font-medium">{profile.name || user?.name}</p>
                        <p className="text-sm text-slate-400">{profile.email || user?.email}</p>
                    </div>
                </div>

                {/* Basic Info */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
                    <div>
                        <label className="block text-sm text-slate-400 mb-1.5">Full Name</label>
                        <input
                            type="text"
                            value={profile.name}
                            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                            className="input"
                            placeholder="Enter your full name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-1.5">Email</label>
                        <input
                            type="email"
                            value={profile.email}
                            disabled
                            className="input opacity-50 cursor-not-allowed"
                        />
                        <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                    </div>

                    <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="btn-primary disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                    </button>
                </div>

                {/* Departments Section */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
                    <h3 className="font-medium text-white flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-400" />
                        Departments
                    </h3>

                    {/* Current Departments */}
                    <div className="flex flex-wrap gap-2">
                        {approvedDepts.map(dept => (
                            <div key={dept} className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                <span className="text-sm text-blue-300">{dept}</span>
                                <StatusBadge status="approved" />
                            </div>
                        ))}
                        {pendingDepts.map(dept => (
                            <div key={dept} className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                <span className="text-sm text-amber-300">{dept}</span>
                                <StatusBadge status="pending" />
                            </div>
                        ))}
                        {approvedDepts.length === 0 && pendingDepts.length === 0 && (
                            <p className="text-sm text-slate-500">No departments assigned</p>
                        )}
                    </div>

                    {/* Request Department */}
                    {availableDepts.length > 0 && (
                        <div className="flex gap-2">
                            <select
                                value={selectedDept}
                                onChange={(e) => setSelectedDept(e.target.value)}
                                className="input flex-1 text-sm"
                            >
                                <option value="">Select department to request...</option>
                                {availableDepts.map(d => (
                                    <option key={d._id} value={d.name}>{d.name}</option>
                                ))}
                            </select>
                            <button
                                onClick={handleRequestDepartment}
                                disabled={!selectedDept || requesting}
                                className="btn-secondary text-sm disabled:opacity-50"
                            >
                                {requesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                Request
                            </button>
                        </div>
                    )}
                </div>

                {/* Teams Section */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
                    <h3 className="font-medium text-white flex items-center gap-2">
                        <Users2 className="w-4 h-4 text-purple-400" />
                        Teams
                    </h3>

                    {/* Current Teams */}
                    <div className="flex flex-wrap gap-2">
                        {approvedTeams.map(team => (
                            <div key={team} className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                                <span className="text-sm text-purple-300">{team}</span>
                                <StatusBadge status="approved" />
                            </div>
                        ))}
                        {pendingTeams.map(team => (
                            <div key={team} className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                <span className="text-sm text-amber-300">{team}</span>
                                <StatusBadge status="pending" />
                            </div>
                        ))}
                        {approvedTeams.length === 0 && pendingTeams.length === 0 && (
                            <p className="text-sm text-slate-500">No teams assigned</p>
                        )}
                    </div>

                    {/* Request Team */}
                    {availableTeams.length > 0 && (
                        <div className="flex gap-2">
                            <select
                                value={selectedTeam}
                                onChange={(e) => setSelectedTeam(e.target.value)}
                                className="input flex-1 text-sm"
                            >
                                <option value="">Select team to request...</option>
                                {availableTeams.map(t => (
                                    <option key={t.name} value={t.name}>{t.name}</option>
                                ))}
                            </select>
                            <button
                                onClick={handleRequestTeam}
                                disabled={!selectedTeam || requesting}
                                className="btn-secondary text-sm disabled:opacity-50"
                            >
                                {requesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                Request
                            </button>
                        </div>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                        {error}
                    </div>
                )}

                {/* Success Message */}
                {saved && (
                    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-400 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Profile saved successfully!
                    </div>
                )}
            </div>
        </div>
    );
}
