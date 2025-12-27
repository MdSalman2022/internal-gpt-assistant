'use client';

export default function AppearancePage() {
    return (
        <div className="p-8 max-w-2xl">
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
        </div>
    );
}
