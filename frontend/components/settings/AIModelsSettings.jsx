import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { API_URL, organizationsApi } from '@/lib/api';
import APICredentialsSettings from './APICredentialsSettings';
import TavilySettings from './TavilySettings';
import { Settings, Check, AlertCircle, ExternalLink, Sparkles, Bot, Brain, Zap, TrendingUp, RefreshCw, BarChart3, Database, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AIModelsSettings() {
    const { isAdmin } = useAuth();
    const [settings, setSettings] = useState(null);
    const [pricing, setPricing] = useState(null);
    const [costSummary, setCostSummary] = useState(null);
    const [availableProviders, setAvailableProviders] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedModel, setSelectedModel] = useState('');
    const [organization, setOrganization] = useState(null);
    const [expandedProvider, setExpandedProvider] = useState(null);

    useEffect(() => {
        if (isAdmin) loadData();
    }, [isAdmin]);

    const loadData = async () => {
        try {
            const [settingsRes, pricingRes, costRes, availableRes, orgRes] = await Promise.all([
                fetch(`${API_URL}/api/usage/admin/settings`, { credentials: 'include' }).then(r => r.json()),
                fetch(`${API_URL}/api/usage/admin/pricing`, { credentials: 'include' }).then(r => r.json()),
                fetch(`${API_URL}/api/usage/admin/cost-summary`, { credentials: 'include' }).then(r => r.json()),
                fetch(`${API_URL}/api/credentials/available/providers`, { credentials: 'include' }).then(r => r.json()),
                organizationsApi.getCurrent()
            ]);
            
            setSettings(settingsRes);
            setPricing(pricingRes);
            setCostSummary(costRes);
            setOrganization(orgRes.organization);
            
            if (availableRes.success && availableRes.providers) {
                const availMap = {};
                availableRes.providers.forEach(p => { availMap[p.provider] = true; });
                setAvailableProviders(availMap);
            }
            
            setSelectedModel(settingsRes.selectedModel || 'gemini-2.5-flash');
        } catch (err) {
            console.error('Failed to load AI settings:', err);
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleModelSelect = async (modelId) => {
        const loadingToast = toast.loading('Updating active model...');
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
                toast.dismiss(loadingToast);
                toast.success(`Active model updated!`);
            }
        } catch (err) {
            toast.dismiss(loadingToast);
            toast.error('Failed to update active model');
        }
    };

    const providerConfig = {
        gemini: { icon: Sparkles, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
        openai: { icon: Bot, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
        anthropic: { icon: Brain, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
        groq: { icon: Zap, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' }
    };

    if (!isAdmin) return null;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="relative">
                    <div className="w-12 h-12 border-4 border-primary/30 rounded-full"></div>
                    <div className="w-12 h-12 border-4 border-t-primary rounded-full animate-spin absolute top-0 left-0"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 space-y-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-2">AI Control Center</h2>
                    <p className="text-muted-foreground max-w-2xl text-sm md:text-base">
                        Manage your AI infrastructure, monitor costs, and configure API providers. 
                        System intelligently routes requests based on your credentials.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={loadData}
                        className="p-2.5 rounded-xl bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all border border-border"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Cost Summary Hero */}
            {costSummary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="col-span-1 md:col-span-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5 border border-primary/20 rounded-3xl p-1 shadow-md">
                        <div className="bg-card/40 backdrop-blur-sm rounded-[20px] p-6 md:p-8 h-full flex flex-col md:flex-row items-center justify-between gap-8">
                            
                            <div className="flex items-start gap-5">
                                <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
                                    <TrendingUp className="w-8 h-8 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-muted-foreground mb-1">Estimated Cost</h3>
                                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                                        <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight break-all">
                                            ${(costSummary.totalCostCents / 100).toFixed(5)}
                                        </span>
                                        <span className="text-xs sm:text-sm font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/10 whitespace-nowrap">
                                            Last 30 Days
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Based on {Number(costSummary.totalTokens).toLocaleString()} tokens processed
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-8 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                                <div className="px-6 py-3 bg-background/50 rounded-2xl border border-border min-w-[140px]">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                        <Database className="w-4 h-4" />
                                        <span>Queries</span>
                                    </div>
                                    <span className="text-2xl font-bold text-foreground">
                                        {((costSummary.totalRequests || 0) / 1000).toFixed(1)}k
                                    </span>
                                </div>
                                <div className="px-6 py-3 bg-background/50 rounded-2xl border border-border min-w-[140px]">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                        <BarChart3 className="w-4 h-4" />
                                        <span>Models</span>
                                    </div>
                                    <span className="text-2xl font-bold text-foreground">
                                        {Object.keys(costSummary.byModel).length}
                                    </span>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}

            {/* Credentials Section */}
            <div>
                <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                    <span className="w-1 h-6 bg-primary rounded-full block"></span>
                    API Credentials
                </h3>
                <div className="space-y-6">
                    <APICredentialsSettings />
                    
                    {/* Web Search Integration */}
                    {organization && (
                        <TavilySettings organizationId={organization._id} />
                    )}
                </div>
            </div>

            {/* Models Configuration */}
            {pricing && (
                <div className="space-y-8">
                    <div className="flex items-center justify-between border-b border-border pb-4">
                        <div>
                            <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                                <span className="w-1 h-6 bg-blue-500 rounded-full block"></span>
                                Model Logic
                            </h3>
                            <p className="text-muted-foreground text-sm mt-1 ml-3">
                                Select the intelligent core for your agents. Providers unlock automatically when creds are added.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {Object.entries(pricing.providers).map(([providerId, provider]) => {
                            const config = providerConfig[providerId] || { icon: Settings, color: 'text-muted-foreground' };
                            const Icon = config.icon;
                            const isAvailable = !!availableProviders[providerId];
                            
                            // Auto-expand if the selected model belongs to this provider
                            const hasSelectedModel = provider.models.some(m => m.id === selectedModel);
                            const isExpanded = expandedProvider === providerId || (expandedProvider === null && hasSelectedModel);

                            return (
                                <div 
                                    key={providerId} 
                                    className={`group relative flex flex-col bg-card border rounded-2xl overflow-hidden transition-all duration-300 ${isExpanded ? 'border-primary ring-1 ring-primary/10 shadow-lg' : 'border-border hover:border-primary/50'}`}
                                >
                                    {/* Provider Header (Clickable for Accordion) */}
                                    <div 
                                        onClick={() => setExpandedProvider(isExpanded ? null : providerId)}
                                        className={`p-5 flex items-center justify-between cursor-pointer transition-colors ${isExpanded ? 'bg-primary/5' : 'bg-transparent hover:bg-muted/30'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2.5 rounded-xl ${config.bg} border ${config.border} transition-transform duration-300 ${isExpanded ? 'scale-110' : ''}`}>
                                                <Icon className={`w-6 h-6 ${config.color}`} />
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
                                                    {provider.name}
                                                    {isAvailable && (
                                                        <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                                                            <Check className="w-3 h-3" /> Connected
                                                        </span>
                                                    )}
                                                </h4>
                                                <p className="text-sm text-muted-foreground mt-0.5">
                                                    {provider.models.length} optimized models available
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <a 
                                                href={`https://${providerId === 'openai' ? 'platform.openai' : providerId === 'anthropic' ? 'console.anthropic' : providerId === 'groq' ? 'console.groq' : 'aistudio.google'}.com`}
                                                target="_blank"
                                                rel="noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 px-3 py-1.5 rounded-lg border border-transparent hover:border-border hover:bg-background"
                                            >
                                                Get API Key <ExternalLink className="w-3 h-3" />
                                            </a>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-background border border-border transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Accordion Content */}
                                    <div 
                                        className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[800px] opacity-100 border-t border-border/50' : 'max-h-0 opacity-0'}`}
                                    >
                                        <div className="p-5 bg-muted/5">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {provider.models.map((model) => {
                                                    const isSelected = selectedModel === model.id;
                                                    
                                                    return (
                                                        <div 
                                                            key={model.id}
                                                            onClick={() => isAvailable && handleModelSelect(model.id)}
                                                            className={`
                                                                relative p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between group/card
                                                                ${isSelected 
                                                                    ? 'bg-primary/10 border-primary shadow-sm ring-1 ring-primary/20' 
                                                                    : isAvailable
                                                                        ? 'bg-card border-border hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5'
                                                                        : 'bg-muted/40 border-transparent opacity-60 cursor-not-allowed'
                                                                }
                                                            `}
                                                        >
                                                            <div>
                                                                <div className="flex justify-between items-start gap-2 mb-2">
                                                                    <span className={`font-bold text-sm transition-colors ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                                                        {model.name}
                                                                    </span>
                                                                    {isSelected && (
                                                                        <div className="flex-shrink-0 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-sm animate-in zoom-in duration-200">
                                                                            <Check className="w-3 h-3 text-primary-foreground" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed h-9 mb-3">
                                                                    {model.description}
                                                                </p>
                                                            </div>
                                                            
                                                            <div className="flex items-center justify-between pt-3 border-t border-border/50 group-hover/card:border-border transition-colors">
                                                                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                                                                    <span>In: ${model.inputPer1M}</span>
                                                                    <span className="text-border">|</span>
                                                                    <span>Out: ${model.outputPer1M}</span>
                                                                </div>
                                                                {model.freeTier && (
                                                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-500/10 text-green-600 border border-green-500/20">
                                                                        FREE
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
