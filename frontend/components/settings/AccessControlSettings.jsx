import { useState, useEffect } from 'react';
import { Lock, Building, Users, Globe, Mail, X } from 'lucide-react';
import MultiSelect from '../ui/MultiSelect';
import { usersApi, departmentsApi } from '@/lib/api';

export default function AccessControlSettings({
    accessLevel,
    setAccessLevel,
    selectedDepartments,
    setSelectedDepartments,
    selectedTeams,
    setSelectedTeams,
    selectedUsers = [],
    setSelectedUsers = () => { }
}) {
    const [options, setOptions] = useState({ departments: [], teams: [] });
    const [emailInput, setEmailInput] = useState('');

    // Fetch existing structure data from departments API
    useEffect(() => {
        const fetchStructure = async () => {
            try {
                // Get departments from the new departments API
                const deptData = await departmentsApi.getDepartments();
                const departments = deptData.departments?.map(d => d.name) || [];

                // Build teams list from departments
                const teams = [];
                deptData.departments?.forEach(dept => {
                    dept.teams?.forEach(team => {
                        teams.push(`${dept.name}:${team.name}`);
                    });
                });

                setOptions({ departments, teams });
            } catch (err) {
                console.error("Failed to fetch structure:", err);
                // Fallback to old API if departments API fails
                try {
                    const data = await usersApi.getStructure();
                    setOptions(data);
                } catch (e) {
                    console.error("Fallback also failed:", e);
                }
            }
        };
        fetchStructure();
    }, []);

    const handleAddEmail = () => {
        const email = emailInput.trim().toLowerCase();
        if (email && !selectedUsers.includes(email) && email.includes('@')) {
            setSelectedUsers([...selectedUsers, email]);
            setEmailInput('');
        }
    };

    const handleRemoveEmail = (email) => {
        setSelectedUsers(selectedUsers.filter(e => e !== email));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddEmail();
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary-400" />
                Access Control
            </h3>

            <div className="grid grid-cols-2 gap-2">
                {[
                    { id: 'private', label: 'Private (Only Me)', icon: Lock },
                    { id: 'department', label: 'Departments', icon: Building },
                    { id: 'team', label: 'Teams', icon: Users },
                    { id: 'users', label: 'Specific Users', icon: Mail },
                    { id: 'public', label: 'Public (Everyone)', icon: Globe },
                ].map(opt => (
                    <button
                        key={opt.id}
                        onClick={() => setAccessLevel(opt.id)}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-sm transition-all
                            ${accessLevel === opt.id
                                ? 'bg-primary-500/10 border-primary-500 text-primary-400'
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                            }`}
                    >
                        <opt.icon className="w-4 h-4" />
                        {opt.label}
                    </button>
                ))}
            </div>

            {accessLevel === 'department' && (
                <div className="space-y-1 animate-in slide-in-from-top-2">
                    <MultiSelect
                        label="Select Departments"
                        placeholder="Select Department..."
                        options={options.departments || []}
                        selected={selectedDepartments}
                        onChange={setSelectedDepartments}
                        allowCreate={false}
                    />
                    {options.departments?.length === 0 && (
                        <p className="text-xs text-amber-400">No departments created yet. Create them in Settings → Organization.</p>
                    )}
                </div>
            )}

            {accessLevel === 'team' && (
                <div className="space-y-1 animate-in slide-in-from-top-2">
                    <MultiSelect
                        label="Select Teams"
                        placeholder="Select Team..."
                        options={options.teams || []}
                        selected={selectedTeams}
                        onChange={setSelectedTeams}
                        allowCreate={false}
                    />
                    {options.teams?.length === 0 && (
                        <p className="text-xs text-amber-400">No teams created yet. Create them in Settings → Organization.</p>
                    )}
                </div>
            )}

            {accessLevel === 'users' && (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                    <label className="text-xs text-slate-400">Add user emails who can access this document</label>
                    <div className="flex gap-2">
                        <input
                            type="email"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter email address..."
                            className="input flex-1 text-sm"
                        />
                        <button
                            type="button"
                            onClick={handleAddEmail}
                            disabled={!emailInput.includes('@')}
                            className="btn-secondary text-sm disabled:opacity-50"
                        >
                            Add
                        </button>
                    </div>

                    {/* Email list */}
                    {selectedUsers.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {selectedUsers.map(email => (
                                <span
                                    key={email}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-primary-500/10 border border-primary-500/30 rounded-full text-xs text-primary-400"
                                >
                                    {email}
                                    <button
                                        onClick={() => handleRemoveEmail(email)}
                                        className="p-0.5 hover:bg-primary-500/20 rounded-full"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
