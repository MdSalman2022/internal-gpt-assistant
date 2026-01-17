'use client';

import { useAdminAuth } from '../admin-auth-context';
import { User, Shield, Mail, Key } from 'lucide-react';

export default function AdminSettingsPage() {
    const { admin } = useAdminAuth();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Settings</h1>
                <p className="text-gray-500 mt-1">Manage your admin account preferences</p>
            </div>

            <div className="bg-[#12121a] border border-gray-800 rounded-2xl p-6 max-w-2xl">
                <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Profile Information
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Name</label>
                        <div className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-xl border border-gray-800 text-white">
                            <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 font-semibold">
                                {admin?.name?.charAt(0) || 'A'}
                            </div>
                            {admin?.name}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
                        <div className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-xl border border-gray-800 text-gray-400">
                            <Mail className="w-5 h-5" />
                            {admin?.email}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Role</label>
                        <div className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-xl border border-gray-800 text-gray-400">
                            <Shield className="w-5 h-5" />
                            <span className="capitalize">{admin?.platformRole || 'Admin'}</span>
                        </div>
                    </div>
                </div>


            </div>
        </div>
    );
}
