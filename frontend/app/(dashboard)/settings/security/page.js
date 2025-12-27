'use client';

import { useState } from 'react';
import { Eye, EyeOff, Key, Trash2 } from 'lucide-react';

export default function SecurityPage() {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="p-8 max-w-2xl">
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
        </div>
    );
}
