'use client';

import ThemeSelector from '@/components/settings/ThemeSelector';
import { useAuth } from '@/lib/auth-context';
import { Save, X, RefreshCcw } from 'lucide-react';

export default function AppearancePage() {
    const { isThemeDirty, saveTheme, discardTheme } = useAuth();

    return (
        <div className="p-8 max-w-4xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                    <h2 className="text-xl font-bold text-foreground">Appearance</h2>
                    <p className="text-muted-foreground text-sm mt-1">Customize how InsightAI looks on your device.</p>
                </div>

                {isThemeDirty && (
                    <div className="flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                        <button
                            onClick={discardTheme}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                        >
                            <X className="w-4 h-4" />
                            Discard
                        </button>
                        <button
                            onClick={saveTheme}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20 transition-all border border-primary/20"
                        >
                            <Save className="w-4 h-4" />
                            Save Changes
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150">
                <ThemeSelector />
            </div>

            {!isThemeDirty && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary/30 border border-border text-xs text-muted-foreground animate-in fade-in duration-1000">
                    <RefreshCcw className="w-3.5 h-3.5" />
                    Changes are previewed instantly but only saved after you click "Save Changes".
                </div>
            )}
        </div>
    );
}
