'use client';

import { useState, useEffect } from 'react';
import { Globe, Eye, EyeOff, Loader2, Check, ExternalLink, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth-context';
import { organizationsApi } from '@/lib/api';

export default function TavilySettings({ organizationId }) {
    const { isAdmin } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [enabled, setEnabled] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);
    const [hasApiKey, setHasApiKey] = useState(false);
    const [freeQuota, setFreeQuota] = useState(1000);

    useEffect(() => {
        if (organizationId) {
            loadSettings();
        }
    }, [organizationId]);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const data = await organizationsApi.getTavilySettings(organizationId);
            setEnabled(data.enabled || false);
            setHasApiKey(data.hasApiKey || false);
            setFreeQuota(data.freeMonthlyQuota || 1000);
        } catch (error) {
            console.error('Failed to load Tavily settings:', error);
            toast.error('Failed to load web search settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!isAdmin) {
            toast.error('Only admins can update settings');
            return;
        }

        try {
            setSaving(true);
            const data = await organizationsApi.updateTavilySettings(organizationId, {
                enabled,
                apiKey: apiKey.trim() || undefined
            });

            setHasApiKey(data.hasApiKey);
            setApiKey(''); // Clear the input after saving
            setShowApiKey(false);
            
            toast.success('Settings saved successfully');
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="group relative flex flex-col bg-card border border-border rounded-3xl overflow-hidden transition-all duration-300 hover:border-primary/50">
            {/* Header */}
            <div className="p-6 border-b border-border bg-muted/20">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                            <Globe className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground">Web Search (Tavily)</h3>
                            <p className="text-sm text-muted-foreground">
                                Real-time internet access for your AI agents
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                         <div className={`px-3 py-1 rounded-full text-xs font-medium border ${enabled ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-muted text-muted-foreground border-border'}`}>
                            {enabled ? 'Enabled' : 'Disabled'}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Info Panel */}
                <div className="p-4 bg-muted/30 border border-border rounded-2xl flex gap-4">
                    <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2 text-sm">
                        <p className="text-foreground leading-relaxed">
                            <strong>Tavily</strong> connects your AI to the web, allowing it to search for current events, 
                            news, and real-time data to provide up-to-date responses.
                        </p>
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                Free tier: {freeQuota.toLocaleString()} searches/mo
                            </span>
                            <a 
                                href="https://app.tavily.com/sign-up" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
                            >
                                Get API Key <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Configuration */}
                <div className="space-y-5">
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <div className="relative inline-flex items-center">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={enabled}
                                    onChange={() => setEnabled(!enabled)}
                                    disabled={!isAdmin || saving}
                                />
                                <div className="w-11 h-6 bg-muted peer-focus:outline-none ring-offset-background rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </div>
                            <span className="text-sm font-medium text-foreground">Enable Web Search</span>
                        </label>
                    </div>

                    {enabled && (
                        <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                            <label className="text-sm font-medium text-foreground flex items-center justify-between">
                                <span>API Key</span>
                                {hasApiKey && (
                                    <span className="text-xs text-green-600 flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Configured
                                    </span>
                                )}
                            </label>
                            <div className="relative">
                                <input
                                    type={showApiKey ? 'text' : 'password'}
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder={hasApiKey ? '••••••••••••••••' : 'tvly-...'}
                                    disabled={!isAdmin || saving}
                                    className="w-full bg-background border border-input hover:border-primary/50 focus:border-primary rounded-xl px-4 py-3 pr-10 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground pl-1">
                                Keys are stored with AES-256 encryption.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                {isAdmin && (
                    <div className="pt-2">
                        <button
                            onClick={handleSave}
                            disabled={saving || (!enabled && hasApiKey === enabled)}
                            className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:brightness-110 text-primary-foreground font-medium rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Settings'
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
