'use client';

import { useState } from 'react';
import { Eye, EyeOff, Key, Trash2 } from 'lucide-react';

export default function SecurityPage() {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="p-8 max-w-2xl">
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-lg font-semibold text-foreground">Security & Login</h2>
                <div className="p-6 bg-card/50 rounded-lg space-y-4 border border-border/50">
                    <h3 className="font-medium text-foreground">Change Password</h3>
                    <div>
                        <label className="block text-sm text-muted-foreground mb-1.5">Current Password</label>
                        <div className="relative">
                            <input type={showPassword ? 'text' : 'password'} className="input bg-secondary/50 pr-10" />
                            <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-muted-foreground mb-1.5">New Password</label>
                        <input type="password" className="input bg-secondary/50" />
                    </div>
                    <button className="btn-primary"><Key className="w-4 h-4" />Update Password</button>
                </div>
                <div className="p-6 border border-destructive/20 bg-destructive/5 rounded-lg">
                    <h3 className="font-medium text-destructive mb-2">Danger Zone</h3>
                    <p className="text-sm text-muted-foreground mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                    <button className="btn bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 transition-colors"><Trash2 className="w-4 h-4" />Delete My Account</button>
                </div>
            </div>
        </div>
    );
}
