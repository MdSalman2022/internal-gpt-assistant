'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    User, Bell, Shield, Palette, Database, Key,
    Save, LogOut, Trash2, Eye, EyeOff, LayoutDashboard, FileText, Users, Activity
} from 'lucide-react';

// Import New Components
import AnalyticsDashboard from '@/components/settings/AnalyticsDashboard';
import DocumentsManager from '@/components/settings/DocumentsManager';
import UsersList from '@/components/settings/UsersList';
import AuditLogViewer from '@/components/settings/AuditLogViewer';

export default function SettingsPage() {
    const { user, logout, isAdmin, hasPermission } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Initialize active tab from URL param or default to 'profile'
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
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

    // Update URL when tab changes
    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        if (activeTab) {
            params.set('tab', activeTab);
        } else {
            params.delete('tab');
        }
        router.push(`/settings?${params.toString()}`);
    }, [activeTab]);

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User, allowed: true },
        // Admin / Manager Sections
        { id: 'analytics', label: 'Analytics', icon: Activity, allowed: true },
        { id: 'documents', label: 'Documents', icon: FileText, allowed: true }, // Everyone can see docs (permissions handled inside)
        { id: 'users', label: 'Users', icon: Users, allowed: true }, // Visually check inside component, but tab can be visible
        { id: 'audit', label: 'Audit Logs', icon: Shield, allowed: isAdmin }, // Only admin

        // System Settings
        { id: 'notifications', label: 'Notifications', icon: Bell, allowed: true },
        { id: 'security', label: 'Security', icon: Key, allowed: true },
        { id: 'appearance', label: 'Appearance', icon: Palette, allowed: true },
        { id: 'integrations', label: 'Integrations', icon: Database, allowed: true },
    ].filter(tab => tab.allowed);

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
                    <p className="text-sm text-slate-500">Manage account and system preferences</p>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Tabs Sidebar */}
                <nav className="w-56 border-r border-slate-800 p-3 flex-shrink-0 overflow-y-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors text-left
                                ${activeTab === tab.id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span className="text-sm font-medium">{tab.label}</span>
                        </button>
                    ))}

                    <div className="mt-8 pt-4 border-t border-slate-800">
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors text-left">
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm font-medium">Logout</span>
                        </button>
                    </div>
                </nav>

                {/* Content Area */}
                <div className="flex-1 bg-slate-950 overflow-y-auto">
                    {/* Full Width Containers for Data Views */}
                    {activeTab === 'analytics' && <AnalyticsDashboard />}
                    {activeTab === 'documents' && <DocumentsManager />}
                    {(activeTab === 'users') && <UsersList />}
                    {(activeTab === 'audit' && isAdmin) && <AuditLogViewer />}

                    {/* Restricted Width Container for Forms */}
                    {['profile', 'notifications', 'security', 'appearance', 'integrations'].includes(activeTab) && (
                        <div className="p-8 max-w-2xl">
                            {activeTab === 'profile' && (
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
                            )}

                            {activeTab === 'notifications' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <h2 className="text-lg font-semibold text-white">Notification Preferences</h2>
                                    <div className="space-y-3">
                                        {[
                                            { key: 'emailDigest', label: 'Daily Digest', desc: 'Summary of queries and answers' },
                                            { key: 'newDocuments', label: 'New Documents', desc: 'Notified when docs are added' },
                                            { key: 'weeklyReport', label: 'Weekly Report', desc: 'Analytics sent weekly' },
                                        ].map(item => (
                                            <div key={item.key} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-800">
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
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <h2 className="text-lg font-semibold text-white">Security & Login</h2>
                                    <div className="p-6 bg-slate-800/50 rounded-lg space-y-4 border border-slate-800">
                                        <h3 className="font-medium text-white">Change Password</h3>
                                        <div>
                                            <label className="block text-sm text-slate-400 mb-1.5">Current Password</label>
                                            <div className="relative">
                                                <input type={showPassword ? 'text' : 'password'} className="input pr-10" />
                                                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
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
                                    <div className="p-6 border border-red-500/20 bg-red-500/5 rounded-lg">
                                        <h3 className="font-medium text-red-400 mb-2">Danger Zone</h3>
                                        <p className="text-sm text-slate-400 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                                        <button className="btn bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"><Trash2 className="w-4 h-4" />Delete My Account</button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'appearance' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <h2 className="text-lg font-semibold text-white">Interface Theme</h2>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button className="p-4 bg-slate-800 border-2 border-primary-500 rounded-xl text-center shadow-lg transform transition-transform scale-105">
                                            <div className="w-full h-24 bg-slate-950 rounded-lg mb-3 shadow-inner" />
                                            <span className="text-white font-medium">Dark Mode</span>
                                        </button>
                                        <button className="p-4 bg-slate-800 border-2 border-transparent rounded-xl text-center opacity-50 cursor-not-allowed hover:bg-slate-700/50">
                                            <div className="w-full h-24 bg-white rounded-lg mb-3" />
                                            <span className="text-slate-500 font-medium">Light Mode (Coming Soon)</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'integrations' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <h2 className="text-lg font-semibold text-white">Connected Apps</h2>
                                    <div className="space-y-3">
                                        {[
                                            { name: 'Google Drive', icon: '📁', connected: true },
                                            { name: 'Notion', icon: '📝', connected: false },
                                            { name: 'Confluence', icon: '📚', connected: false },
                                            { name: 'Slack', icon: '💬', connected: false },
                                        ].map(i => (
                                            <div key={i.name} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-800">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{i.icon}</span>
                                                    <div>
                                                        <span className="block text-white font-medium">{i.name}</span>
                                                        <span className="text-xs text-slate-500">Sync documents and knowledge</span>
                                                    </div>
                                                </div>
                                                <button className={`btn-sm ${i.connected ? 'btn-secondary text-green-400' : 'btn-secondary'}`}>
                                                    {i.connected ? 'Connected' : 'Connect'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
