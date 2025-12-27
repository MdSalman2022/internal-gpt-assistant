'use client';

import { useState } from 'react';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState({
        emailDigest: true,
        newDocuments: true,
        weeklyReport: false,
    });

    return (
        <div className="p-8 max-w-2xl">
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
        </div>
    );
}
