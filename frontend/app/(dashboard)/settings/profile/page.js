'use client';

import { useState, useEffect, useRef } from 'react';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import { useAuth } from '@/lib/auth-context';
import { profileApi, departmentsApi, uploadApi, api } from '@/lib/api';
import { Save, Loader2, CheckCircle, Clock, XCircle, Building2, Users2, Plus, X, Camera, Shield } from 'lucide-react';

export default function ProfilePage() {
    const { user, checkAuth } = useAuth();
    const fileInputRef = useRef(null);

    const [profile, setProfile] = useState({
        name: '',
        email: '',
        avatar: '',
    });
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);

    // Departments and teams
    const [allDepartments, setAllDepartments] = useState([]);
    const [allTeams, setAllTeams] = useState([]);
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedTeam, setSelectedTeam] = useState('');

    const [requesting, setRequesting] = useState(false);
    
    // Email Verification
    const [verificationLoading, setVerificationLoading] = useState(false);
    const [verificationSent, setVerificationSent] = useState(false);

    // Initialize form with user data
    useEffect(() => {
        if (user) {
            setProfile({
                name: user.name || '',
                email: user.email || '',
                avatar: user.avatar || '',
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
                // Avatar is updated immediately upon upload, so we don't strictly need to send it here
                // unless we want to allow "reverting" changes before save (not implemented here)
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

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be less than 5MB');
            return;
        }

        if (!file.type.startsWith('image/')) {
            setError('File must be an image');
            return;
        }

        setUploading(true);
        setError(null);

        try {
            // 1. Upload file
            const uploadResult = await uploadApi.uploadFile(file);
            
            // 2. Update user profile with new URL
            await profileApi.updateProfile({
                avatar: uploadResult.url
            });

            // 3. Refresh auth context and local state
            await checkAuth();
            setProfile(prev => ({ ...prev, avatar: uploadResult.url }));
            
        } catch (err) {
            console.error('Failed to upload avatar:', err);
            setError(err.message || 'Failed to upload image');
        } finally {
            setUploading(false);
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
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

    const handleVerifyEmail = async () => {
        setVerificationLoading(true);
        setError(null);
        try {
            await api.post('/api/auth/verify-email/request');
            setVerificationSent(true);
        } catch (err) {
            setError(err.message || 'Failed to send verification email');
        } finally {
            setVerificationLoading(false);
        }
    };

    // Get status badge for department/team
    const StatusBadge = ({ status }) => {
        if (status === 'approved') {
            return (
                <span className="inline-flex items-center p-1 bg-primary/10 rounded-full" title="Approved">
                    <CheckCircle className="w-3.5 h-3.5 text-primary" />
                </span>
            );
        }
        if (status === 'pending') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs text-amber-500">
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
            <div className="p-6 pb-12 max-w-5xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-semibold text-foreground">Profile Settings</h2>

                {/* Avatar Section */}
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20 overflow-hidden">
                            {profile.avatar ? (
                                <img 
                                    src={profile.avatar} 
                                    alt={profile.name} 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-2xl font-bold text-primary-foreground">
                                    {profile.name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                            )}
                        </div>
                        
                        {/* Upload Overlay */}
                        <div 
                            className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {uploading ? (
                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                            ) : (
                                <Camera className="w-6 h-6 text-white" />
                            )}
                        </div>
                        
                        {/* Hidden Input */}
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            className="hidden" 
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            disabled={uploading}
                        />
                    </div>
                    <div>
                        <p className="text-foreground font-medium">{profile.name || user?.name}</p>
                        <p className="text-sm text-muted-foreground">{profile.email || user?.email}</p>
                    </div>
                </div>

                {/* Basic Info */}
                <div className="bg-card/50 border border-border/50 rounded-xl p-5 space-y-4">
                    <div>
                        <label className="block text-sm text-muted-foreground mb-1.5">Full Name</label>
                        <input
                            type="text"
                            value={profile.name}
                            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                            className="input bg-secondary/50"
                            placeholder="Enter your full name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-muted-foreground mb-1.5">Email</label>
                        <input
                            type="email"
                            value={profile.email}
                            disabled
                            className="input bg-secondary/30 opacity-70 cursor-not-allowed"
                        />
                        <p className="text-xs text-muted-foreground/60 mt-1">Email cannot be changed</p>
                        
                        {!user?.isVerified && (
                            <div className="mt-2">
                                {verificationSent ? (
                                    <div className="flex items-center gap-2 text-sm text-green-500 bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/20">
                                        <CheckCircle className="w-4 h-4" />
                                        Verification link sent! Check your inbox.
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleVerifyEmail}
                                        disabled={verificationLoading}
                                        className="text-sm text-primary hover:underline flex items-center gap-1.5"
                                    >
                                        {verificationLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                                        Verify Email
                                    </button>
                                )}
                            </div>
                        )}
                         {user?.isVerified && (
                            <div className="flex items-center gap-1.5 mt-2 text-sm text-blue-500">
                                <VerifiedBadge className="w-4 h-4 text-blue-500" />
                                <span className="font-medium">Verified Account</span>
                            </div>
                        )}
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
                <div className="bg-card/50 border border-border/50 rounded-xl p-5 space-y-4">
                    <h3 className="font-medium text-foreground flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary" />
                        Departments
                    </h3>

                    {/* Current Departments */}
                    <div className="flex flex-wrap gap-2">
                        {approvedDepts.map(dept => (
                            <div key={dept} className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg">
                                <span className="text-sm text-primary/80">{dept}</span>
                                <StatusBadge status="approved" />
                            </div>
                        ))}
                        {pendingDepts.map(dept => (
                            <div key={dept} className="flex items-center gap-3 px-3 py-1.5 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                                <span className="text-sm text-amber-500/80">{dept}</span>
                                <StatusBadge status="pending" />
                            </div>
                        ))}
                        {approvedDepts.length === 0 && pendingDepts.length === 0 && (
                            <p className="text-sm text-muted-foreground">No departments assigned</p>
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
                <div className="bg-card/50 border border-border/50 rounded-xl p-5 space-y-4">
                    <h3 className="font-medium text-foreground flex items-center gap-2">
                        <Users2 className="w-4 h-4 text-primary" />
                        Teams
                    </h3>

                    {/* Current Teams */}
                    <div className="flex flex-wrap gap-2">
                        {approvedTeams.map(team => (
                            <div key={team} className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg">
                                <span className="text-sm text-primary/80">{team}</span>
                                <StatusBadge status="approved" />
                            </div>
                        ))}
                        {pendingTeams.map(team => (
                            <div key={team} className="flex items-center gap-3 px-3 py-1.5 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                                <span className="text-sm text-amber-500/80">{team}</span>
                                <StatusBadge status="pending" />
                            </div>
                        ))}
                        {approvedTeams.length === 0 && pendingTeams.length === 0 && (
                            <p className="text-sm text-muted-foreground">No teams assigned</p>
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
