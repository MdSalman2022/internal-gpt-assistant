'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { API_URL } from '@/lib/api';
import { Settings, Key, Check, AlertCircle, Sparkles, Bot, Brain, DollarSign, TrendingUp, Eye, EyeOff } from 'lucide-react';

export default function AIModelsSettings() {
    const { isAdmin } = useAuth();
    const [settings, setSettings] = useState(null);
    const [pricing, setPricing] = useState(null);
    const [costSummary, setCostSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

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

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = { selectedModel };
            if (apiKeys.gemini) payload.geminiApiKey = apiKeys.gemini;
            if (apiKeys.openai) payload.openaiApiKey = apiKeys.openai;
            if (apiKeys.anthropic) payload.anthropicApiKey = apiKeys.anthropic;

            const res = await fetch(`${API_URL}/api/usage/admin/settings`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                setSettings(data.settings);
                setApiKeys({ gemini: '', openai: '', anthropic: '' });
                showToast('Settings saved successfully');
            }
        } catch (err) {
            showToast('Failed to save settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    const providerIcons = {
        gemini: Sparkles,
        openai: Bot,
        anthropic: Brain
    };

    if (!isAdmin) {
        return (
            <div className="text-center text-slate-500 py-8">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <p>Admin access required</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500 max-w-6xl">
            {/* Header */}
            <div>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary-400" />
                    AI Models & API Settings
                </h2>
                <p className="text-slate-400 text-sm mt-1">Configure AI providers, API keys, and view cost analysis</p>
            </div>

            {/* Cost Summary Card */}
            {costSummary && (
                <div className="bg-gradient-to-br from-primary-500/10 to-purple-500/10 border border-primary-500/20 rounded-2xl p-6">
                    <h3 className="text-lg font-medium text-white flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-primary-400" />
                        Cost Summary (Last 30 Days)
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-slate-900/50 rounded-xl p-4 text-center">
                            <p className="text-3xl font-bold text-green-400">${costSummary.totalCostUSD}</p>
                            <p className="text-xs text-slate-400 mt-1">Total Cost</p>
                        </div>
                        <div className="bg-slate-900/50 rounded-xl p-4 text-center">
                            <p className="text-3xl font-bold text-white">{(costSummary.totalTokens / 1000).toFixed(1)}K</p>
                            <p className="text-xs text-slate-400 mt-1">Total Tokens</p>
                        </div>
                        <div className="bg-slate-900/50 rounded-xl p-4 text-center">
                            <p className="text-3xl font-bold text-white">{Object.keys(costSummary.byModel).length}</p>
                            <p className="text-xs text-slate-400 mt-1">Models Used</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Model Selection & Pricing */}
            {pricing && (
                <div className="space-y-6">
                    <h3 className="text-lg font-medium text-white">Select Active Model</h3>

                    {Object.entries(pricing.providers).map(([providerId, provider]) => {
                        const Icon = providerIcons[providerId] || Settings;
                        return (
                            <div key={providerId} className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
                                {/* Provider Header */}
                                <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800 bg-slate-800/50">
                                    <div className="p-2 bg-slate-700 rounded-lg">
                                        <Icon className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-white font-medium">{provider.name}</h4>
                                    </div>
                                    {/* API Key Input */}
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <input
                                                type={showKeys[providerId] ? 'text' : 'password'}
                                                placeholder={settings[`${providerId}ApiKey`] || 'Enter API Key'}
                                                value={apiKeys[providerId]}
                                                onChange={(e) => setApiKeys({ ...apiKeys, [providerId]: e.target.value })}
                                                className="w-64 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white pr-10"
                                            />
                                            <button
                                                onClick={() => setShowKeys({ ...showKeys, [providerId]: !showKeys[providerId] })}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                                            >
                                                {showKeys[providerId] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {settings[`${providerId}ApiKey`] && (
                                            <Check className="w-5 h-5 text-green-400" />
                                        )}
                                    </div>
                                </div>

                                {/* Models Grid */}
                                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {provider.models.map((model) => (
                                        <button
                                            key={model.id}
                                            onClick={() => setSelectedModel(model.id)}
                                            className={`text-left p-4 rounded-xl border-2 transition-all ${selectedModel === model.id
                                                ? 'border-primary-500 bg-primary-500/10'
                                                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-white">{model.name}</span>
                                                {model.recommended && (
                                                    <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded-full">
                                                        Recommended
                                                    </span>
                                                )}
                                                {model.freeTier && (
                                                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                                                        Free Tier
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-400 mb-3">{model.description}</p>
                                            <div className="flex items-center gap-4 text-xs">
                                                <div>
                                                    <span className="text-slate-500">Input:</span>
                                                    <span className="text-slate-300 ml-1">${model.inputPer1M}/1M</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500">Output:</span>
                                                    <span className="text-slate-300 ml-1">${model.outputPer1M}/1M</span>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary px-6 py-2.5 flex items-center gap-2"
                >
                    {saving ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Check className="w-4 h-4" />
                    )}
                    Save Settings
                </button>
            </div>

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl border
                    ${toast.type === 'error' ? 'bg-slate-900 border-red-500/50 text-red-200' : 'bg-slate-900 border-green-500/50 text-green-200'}`}>
                    {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    <span className="text-sm">{toast.message}</span>
                </div>
            )}
        </div>
    );
}
