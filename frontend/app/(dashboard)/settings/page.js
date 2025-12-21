'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import {
    User, Bell, Shield, Palette, Database, Key,
    Save, LogOut, Trash2, Eye, EyeOff
} from 'lucide-react';

export default function SettingsPage() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('profile');
    const [showPassword, setShowPassword] = useState(false);

    const [profile, setProfile] = useState({
        name: user?.name || '',
        email: user?.email || '',
        department: user?.department || '',
    });

    const [notifications, setNotifications] = useState({
        emailDigest: true,
        newDocuments: true,
        weeklyReport: false,
    });

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'appearance', label: 'Appearance', icon: Palette },
        { id: 'integrations', label: 'Integrations', icon: Database },
    ];

    const handleSaveProfile = async () => {
        alert('Profile saved!');
    };

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                <div>
                    <h1 className="text-xl font-semibold text-white">Settings</h1>
                    <p className="text-sm text-slate-500">Manage your account</p>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Tabs */}
                <nav className="w-48 border-r border-slate-800 p-3 flex-shrink-0">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors text-left
                                ${activeTab === tab.id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span className="text-sm">{tab.label}</span>
                        </button>
                    ))}
                </nav>

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                    <div className="max-w-xl">
                        {activeTab === 'profile' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-semibold text-white">Profile</h2>
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
                                <button onClick={handleSaveProfile} className="btn-primary"><Save className="w-4 h-4" />Save</button>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-semibold text-white">Notifications</h2>
                                <div className="space-y-3">
                                    {[
                                        { key: 'emailDigest', label: 'Daily Digest', desc: 'Summary of queries and answers' },
                                        { key: 'newDocuments', label: 'New Documents', desc: 'Notified when docs are added' },
                                        { key: 'weeklyReport', label: 'Weekly Report', desc: 'Analytics sent weekly' },
                                    ].map(item => (
                                        <div key={item.key} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                                            <div>
                                                <p className="text-white font-medium">{item.label}</p>
                                                <p className="text-sm text-slate-500">{item.desc}</p>
                                            </div>
                                            <button
                                                onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })}
                                                className={`w-11 h-6 rounded-full transition-colors relative ${notifications[item.key] ? 'bg-primary-500' : 'bg-slate-700'}`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${notifications[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-semibold text-white">Security</h2>
                                <div className="p-4 bg-slate-800/50 rounded-lg space-y-4">
                                    <h3 className="font-medium text-white">Change Password</h3>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1.5">Current Password</label>
                                        <div className="relative">
                                            <input type={showPassword ? 'text' : 'password'} className="input pr-10" />
                                            <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1.5">New Password</label>
                                        <input type="password" className="input" />
                                    </div>
                                    <button className="btn-primary"><Key className="w-4 h-4" />Update Password</button>
                                </div>
                                <div className="p-4 border border-red-500/20 bg-red-500/5 rounded-lg">
                                    <h3 className="font-medium text-red-400 mb-2">Danger Zone</h3>
                                    <div className="flex gap-3">
                                        <button onClick={handleLogout} className="btn-secondary text-red-400"><LogOut className="w-4 h-4" />Logout</button>
                                        <button className="btn bg-red-500/20 text-red-400 hover:bg-red-500/30"><Trash2 className="w-4 h-4" />Delete Account</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'appearance' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-semibold text-white">Appearance</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <button className="p-4 bg-slate-800 border-2 border-primary-500 rounded-lg text-center">
                                        <div className="w-full h-16 bg-slate-900 rounded mb-2" />
                                        <span className="text-white text-sm">Dark</span>
                                    </button>
                                    <button className="p-4 bg-slate-800 border-2 border-slate-700 rounded-lg text-center opacity-50 cursor-not-allowed">
                                        <div className="w-full h-16 bg-white rounded mb-2" />
                                        <span className="text-slate-500 text-sm">Light (Soon)</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'integrations' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-semibold text-white">Integrations</h2>
                                <div className="space-y-3">
                                    {[
                                        { name: 'Google Drive', icon: '📁' },
                                        { name: 'Notion', icon: '📝' },
                                        { name: 'Confluence', icon: '📚' },
                                        { name: 'Slack', icon: '💬' },
                                    ].map(i => (
                                        <div key={i.name} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">{i.icon}</span>
                                                <span className="text-white">{i.name}</span>
                                            </div>
                                            <button className="btn-secondary text-sm">Connect</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
