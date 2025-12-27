'use client';

export default function IntegrationsPage() {
    const integrations = [
        { name: 'Google Drive', icon: '📁', connected: true },
        { name: 'Notion', icon: '📝', connected: false },
        { name: 'Confluence', icon: '📚', connected: false },
        { name: 'Slack', icon: '💬', connected: false },
    ];

    return (
        <div className="p-8 max-w-2xl">
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-lg font-semibold text-white">Connected Apps</h2>
                <div className="space-y-3">
                    {integrations.map(i => (
                        <div key={i.name} className="flex items-center justify-between p-4 bg-primary/5 border-primary/50 rounded-lg border border-slate-800">
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
        </div>
    );
}
