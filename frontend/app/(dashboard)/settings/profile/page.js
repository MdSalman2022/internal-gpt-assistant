'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Save } from 'lucide-react';

export default function ProfilePage() {
    const { user } = useAuth();

    const [profile, setProfile] = useState({
        name: user?.name || '',
        email: user?.email || '',
        department: user?.department || '',
    });

    const handleSaveProfile = async () => {
        alert('Profile saved!');
    };

    return (
        <div className="p-8 max-w-2xl">
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-lg font-semibold text-white">Profile Settings</h2>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">{user?.name?.charAt(0) || 'U'}</span>
                    </div>
                    <button className="btn-secondary text-sm">Change Avatar</button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-slate-400 mb-1.5">Full Name</label>
                        <input type="text" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="input" />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-1.5">Email</label>
                        <input type="email" value={profile.email} disabled className="input opacity-50" />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-1.5">Department</label>
                        <input type="text" value={profile.department} onChange={(e) => setProfile({ ...profile, department: e.target.value })} className="input" placeholder="e.g. Engineering" />
                    </div>
                </div>
                <button onClick={handleSaveProfile} className="btn-primary"><Save className="w-4 h-4" />Save Changes</button>
            </div>
        </div>
    );
}
