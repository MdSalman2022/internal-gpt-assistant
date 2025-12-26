import { useState, useEffect } from 'react';
import { Lock, Building, Users, Globe } from 'lucide-react';
import MultiSelect from '../ui/MultiSelect';
import { usersApi } from '@/lib/api';

export default function AccessControlSettings({
    accessLevel,
    setAccessLevel,
    selectedDepartments,
    setSelectedDepartments,
    selectedTeams,
    setSelectedTeams
}) {
    const [options, setOptions] = useState({ departments: [], teams: [] });

    // Fetch existing structure data
    useEffect(() => {
        const fetchStructure = async () => {
            try {
                const data = await usersApi.getStructure();
                setOptions(data);
            } catch (err) {
                console.error("Failed to fetch structure:", err);
            }
        };
        fetchStructure();
    }, []);

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary-400" />
                Access Control
            </h3>

            <div className="grid grid-cols-2 gap-2">
                {[
                    { id: 'private', label: 'Private (Only Me)', icon: Lock },
                    { id: 'department', label: 'My Department', icon: Building },
                    { id: 'team', label: 'Specific Teams', icon: Users },
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
                        placeholder="Select or Create Department..."
                        options={options.departments || []}
                        selected={selectedDepartments}
                        onChange={setSelectedDepartments}
                        allowCreate={true}
                    />
                </div>
            )}

            {accessLevel === 'team' && (
                <div className="space-y-1 animate-in slide-in-from-top-2">
                    <MultiSelect
                        label="Select Teams"
                        placeholder="Select or Create Team..."
                        options={options.teams || []}
                        selected={selectedTeams}
                        onChange={setSelectedTeams}
                        allowCreate={true}
                    />
                </div>
            )}
        </div>
    );
}
