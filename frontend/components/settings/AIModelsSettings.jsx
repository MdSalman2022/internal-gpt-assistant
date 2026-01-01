import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { API_URL } from '@/lib/api';
import { Settings, Key, Check, AlertCircle, Sparkles, Bot, Brain, DollarSign, TrendingUp, Eye, EyeOff, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AIModelsSettings() {
    const { isAdmin } = useAuth();
    const [settings, setSettings] = useState(null);
    const [pricing, setPricing] = useState(null);
    const [costSummary, setCostSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [selectedModel, setSelectedModel] = useState('');
    const [apiKeys, setApiKeys] = useState({
        gemini: '',
        openai: '',
        anthropic: ''
    });
    const [showKeys, setShowKeys] = useState({
        gemini: false,
        openai: false,
        anthropic: false
    });

    useEffect(() => {
        if (isAdmin) loadData();
    }, [isAdmin]);

    const loadData = async () => {
        try {
            const [settingsRes, pricingRes, costRes] = await Promise.all([
                fetch(`${API_URL}/api/usage/admin/settings`, { credentials: 'include' }).then(r => r.json()),
                fetch(`${API_URL}/api/usage/admin/pricing`, { credentials: 'include' }).then(r => r.json()),
                fetch(`${API_URL}/api/usage/admin/cost-summary`, { credentials: 'include' }).then(r => r.json())
            ]);
            setSettings(settingsRes);
            setPricing(pricingRes);
            setCostSummary(costRes);
            setSelectedModel(settingsRes.selectedModel || 'gemini-2.5-flash');
        } catch (err) {
            console.error('Failed to load AI settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveKey = async (providerId) => {
        setSaving(providerId);
        try {
            const payload = {};
            if (apiKeys[providerId] !== undefined) {
                payload[`${providerId}ApiKey`] = apiKeys[providerId];
            }

            const res = await fetch(`${API_URL}/api/usage/admin/settings`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                setSettings(data.settings);
                toast.success(`${providerId} API Key saved successfully`);
                setApiKeys(prev => ({ ...prev, [providerId]: '' }));
            }
        } catch (err) {
            toast.error('Failed to save API key');
        } finally {
            setSaving(false);
        }
    };

    const handleModelSelect = async (modelId) => {
        setSelectedModel(modelId);
        try {
            const res = await fetch(`${API_URL}/api/usage/admin/settings`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ selectedModel: modelId })
            });
            const data = await res.json();
            if (data.success) {
                setSettings(data.settings);
                toast.success(`Active model changed to ${modelId}`);
            }
        } catch (err) {
            toast.error('Failed to update active model');
        }
    };

    const providerIcons = {
        gemini: Sparkles,
        openai: Bot,
        anthropic: Brain
    };

    const providerHelpUrls = {
        gemini: 'https://aistudio.google.com/app/apikey',
        openai: 'https://platform.openai.com/api-keys',
        anthropic: 'https://console.anthropic.com/settings/keys'
    };

    if (!isAdmin) {
        return (
            <div className="text-center text-muted-foreground py-8">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <p>Admin access required</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-6 md:space-y-8 animate-in fade-in duration-500 max-w-6xl">
            {/* Header */}
            <div>
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" />
                    AI Models & API Settings
                </h2>
                <p className="text-muted-foreground text-sm mt-1">Configure AI providers, API keys, and view cost analysis</p>
            </div>

            {/* Cost Summary Card */}
            {costSummary && (
                <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 rounded-2xl p-6">
                    <h3 className="text-lg font-medium text-foreground flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Cost Summary (Last 30 Days)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                        <div className="bg-card/50 rounded-xl p-4 text-center border border-border">
                            <p className="text-xl md:text-3xl font-bold text-emerald-500">${costSummary.totalCostUSD}</p>
                            <p className="text-xs text-muted-foreground mt-1">Total Cost</p>
                        </div>
                        <div className="bg-card/50 rounded-xl p-4 text-center border border-border">
                            <p className="text-xl md:text-3xl font-bold text-foreground">{(costSummary.totalTokens / 1000).toFixed(1)}K</p>
                            <p className="text-xs text-muted-foreground mt-1">Total Tokens</p>
                        </div>
                        <div className="bg-card/50 rounded-xl p-4 text-center border border-border">
                            <p className="text-xl md:text-3xl font-bold text-foreground">{Object.keys(costSummary.byModel).length}</p>
                            <p className="text-xs text-muted-foreground mt-1">Models Used</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Model Selection & Pricing */}
            {pricing && (
                <div className="space-y-6">
                    <h3 className="text-lg font-medium text-foreground">Select Active Model</h3>

                    {Object.entries(pricing.providers).map(([providerId, provider]) => {
                        const Icon = providerIcons[providerId] || Settings;
                        return (
                            <div key={providerId} className="bg-card border border-border rounded-2xl overflow-hidden transition-all hover:border-primary/50">
                                {/* Provider Header */}
                                <div className="flex flex-col md:flex-row md:items-center gap-4 px-5 py-4 border-b border-border bg-muted/30">
                                    <div className="flex items-center justify-between w-full md:w-auto">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-background border border-border rounded-lg shadow-sm">
                                                <Icon className="w-5 h-5 text-foreground" />
                                            </div>
                                            <div>
                                                <h4 className="text-foreground font-medium flex items-center gap-2">
                                                    {provider.name}
                                                    {providerHelpUrls[providerId] && (
                                                        <a
                                                            href={providerHelpUrls[providerId]}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-primary hover:text-primary/80"
                                                            title={`Get ${provider.name} API Key`}
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                        </a>
                                                    )}
                                                </h4>
                                                <a
                                                    href={providerHelpUrls[providerId]}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                                                >
                                                    Get API key here
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    {/* API Key Input */}
                                    <div className="flex-1 md:ml-auto flex items-center gap-2 w-full md:w-auto">
                                        <div className="relative flex-1 md:max-w-xs">
                                            <input
                                                type={showKeys[providerId] ? 'text' : 'password'}
                                                placeholder={settings?.[`${providerId}ApiKey`] ? '••••••••••••••••' : 'Enter API Key'}
                                                value={apiKeys[providerId]}
                                                onChange={(e) => setApiKeys({ ...apiKeys, [providerId]: e.target.value })}
                                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground pr-10 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                            />
                                            <button
                                                onClick={() => setShowKeys({ ...showKeys, [providerId]: !showKeys[providerId] })}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                {showKeys[providerId] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => handleSaveKey(providerId)}
                                            disabled={saving === providerId || !apiKeys[providerId]}
                                            className="px-3 py-2 bg-primary hover:opacity-90 text-primary-foreground text-xs font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                                        >
                                            {saving === providerId ? 'Saving...' : 'Save'}
                                        </button>

                                        {settings?.[`${providerId}ApiKey`] && (
                                            <div title="Key configured" className="p-1.5 bg-green-500/10 rounded-lg">
                                                <Check className="w-4 h-4 text-green-500" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Models Grid */}
                                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {provider.models.map((model) => {
                                        const isSelected = selectedModel === model.id;
                                        const hasKey = !!settings?.[`${providerId}ApiKey`];

                                        return (
                                            <div
                                                key={model.id}
                                                className={`flex flex-col p-4 rounded-xl border-2 transition-all duration-200 ${isSelected
                                                    ? 'border-primary bg-primary/5 shadow-sm'
                                                    : hasKey
                                                        ? 'border-border bg-background hover:border-muted-foreground/30'
                                                        : 'border-border bg-muted/50 opacity-60' // Disabled state style
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className={`text-sm font-medium ${hasKey ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                        {model.name}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        {model.recommended && (
                                                            <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                                                                Recommended
                                                            </span>
                                                        )}
                                                        {model.freeTier && (
                                                            <span className="text-[10px] bg-green-500/20 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded-full">
                                                                Free
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <p className="text-xs text-muted-foreground mb-3 line-clamp-2 flex-grow">{model.description}</p>

                                                <div className="flex items-center gap-4 text-xs mb-4">
                                                    <div>
                                                        <span className="text-muted-foreground">Input:</span>
                                                        <span className="text-foreground ml-1">${model.inputPer1M}/1M</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Output:</span>
                                                        <span className="text-foreground ml-1">${model.outputPer1M}/1M</span>
                                                    </div>
                                                </div>

                                                <div className="mt-auto pt-2 border-t border-border/50">
                                                    {isSelected ? (
                                                        <div className="w-full flex items-center justify-center gap-2 py-2 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg text-xs font-medium">
                                                            <Check className="w-3.5 h-3.5" />
                                                            Active Model
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleModelSelect(model.id)}
                                                            disabled={!hasKey}
                                                            className={`w-full py-2 rounded-lg text-xs font-medium transition-colors ${hasKey
                                                                ? 'bg-primary text-primary-foreground hover:opacity-90 shadow-sm'
                                                                : 'bg-muted text-muted-foreground cursor-not-allowed'
                                                                }`}
                                                        >
                                                            {hasKey ? 'Set as Default' : 'API Key Required'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

        </div>
    );
}
