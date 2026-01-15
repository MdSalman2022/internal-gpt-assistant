import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { API_URL } from '@/lib/api';
import { 
    Key, Plus, Trash2, Shield, 
    AlertCircle, Loader2, Sparkles, Bot, Brain, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function APICredentialsSettings() {
    const { user } = useAuth();
    const [credentials, setCredentials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({
        provider: 'gemini',
        apiKey: '',
        label: ''
    });

    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        loadCredentials();
    }, []);

    const loadCredentials = async () => {
        try {
            const res = await fetch(`${API_URL}/api/credentials`, {
                credentials: 'include'
            });
            const data = await res.json();
            if (data.success) {
                setCredentials(data.credentials);
            }
        } catch (error) {
            console.error('Failed to load credentials:', error);
            toast.error('Failed to load API keys');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setProcessingId('create');
        
        try {
            const res = await fetch(`${API_URL}/api/credentials`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData)
            });
            
            const data = await res.json();
            
            if (data.success) {
                toast.success('API Key added successfully');
                setCredentials([data.credential, ...credentials]); // Optimistic update
                setIsCreating(false);
                setFormData({ provider: 'gemini', apiKey: '', label: '' });
                loadCredentials(); 
            } else {
                toast.error(data.error || 'Failed to add key');
            }
        } catch (error) {
            toast.error('Error adding API key');
        } finally {
            setProcessingId(null);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to deactivate this key?')) return;
        
        setProcessingId(id);
        try {
            const res = await fetch(`${API_URL}/api/credentials/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            if (res.ok) {
                toast.success('Key deactivated');
                setCredentials(credentials.filter(c => c._id !== id));
            } else {
                toast.error('Failed to deactivate key');
            }
        } catch (error) {
            toast.error('Error removing key');
        } finally {
            setProcessingId(null);
        }
    };

    const getProviderIcon = (provider) => {
        switch(provider) {
            case 'gemini': return <Sparkles className="w-5 h-5 text-blue-500" />;
            case 'openai': return <Bot className="w-5 h-5 text-green-500" />;
            case 'anthropic': return <Brain className="w-5 h-5 text-purple-500" />;
            case 'groq': return <Zap className="w-5 h-5 text-orange-500" />;
            default: return <Key className="w-5 h-5 text-muted-foreground" />;
        }
    };

    if (loading) return (
        <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            {/* Toolbar */}
            <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <p className="text-sm text-muted-foreground">
                        Keys listed here override platform defaults.
                    </p>
                </div>
                
                <button 
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:opacity-90 text-primary-foreground rounded-lg transition-all shadow-sm font-medium text-sm"
                >
                    <Plus className="w-4 h-4" />
                    Connect Provider
                </button>
            </div>

            {/* Create Form */}
            {isCreating && (
                <div className="p-6 bg-muted/40 border-b border-border animate-in slide-in-from-top-2">
                    <form onSubmit={handleCreate} className="space-y-4 max-w-3xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Provider</label>
                                <div className="relative">
                                    <select 
                                        value={formData.provider}
                                        onChange={(e) => setFormData({...formData, provider: e.target.value})}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/20 outline-none"
                                    >
                                        <option value="gemini">Google Gemini</option>
                                        <option value="openai">OpenAI</option>
                                        <option value="anthropic">Anthropic Claude</option>
                                        <option value="groq">Groq</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <span className="text-muted-foreground text-xs">▼</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Label (Optional)</label>
                                <input 
                                    type="text"
                                    placeholder="e.g. Production Key"
                                    value={formData.label}
                                    onChange={(e) => setFormData({...formData, label: e.target.value})}
                                    className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/20 outline-none placeholder:text-muted-foreground/50"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">API Secret Key</label>
                                <input 
                                    type="password"
                                    placeholder="sk-..."
                                    required
                                    value={formData.apiKey}
                                    onChange={(e) => setFormData({...formData, apiKey: e.target.value})}
                                    className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm font-mono text-foreground focus:ring-2 focus:ring-primary/20 outline-none placeholder:text-muted-foreground/50"
                                />
                                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                    <Shield className="w-3 h-3" />
                                    Keys are encrypted at rest with AES-256.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button 
                                type="submit"
                                disabled={processingId === 'create'}
                                className="px-6 py-2 bg-primary hover:opacity-90 text-primary-foreground font-medium rounded-lg flex items-center gap-2 transition-colors"
                            >
                                {processingId === 'create' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save & Secure'}
                            </button>
                            <button 
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 text-muted-foreground hover:text-foreground font-medium transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            <div className="divide-y divide-border">
                {credentials.length === 0 ? (
                    <div className="text-center py-16 px-4">
                        <div className="w-16 h-16 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                            <Shield className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-medium text-foreground">No Custom Credentials</h3>
                        <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
                            You are running on platform shared keys. Add your own to remove rate limits.
                        </p>
                    </div>
                ) : (
                    credentials.map(cred => (
                        <div key={cred._id} className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-muted/30 transition-colors">
                            
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-muted rounded-xl border border-border shrink-0">
                                    {getProviderIcon(cred.provider)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h4 className="font-semibold text-foreground text-base">{cred.label || cred.provider}</h4>
                                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-green-500/10 text-green-600 border border-green-500/20 tracking-wider">
                                            Active
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground font-mono">
                                        <span className="bg-muted/50 px-2 py-1 rounded border border-border">
                                            {cred.keyPreview}
                                        </span>
                                        <span>Added {new Date(cred.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 md:gap-12 pl-14 md:pl-0">
                                <div className="flex items-center gap-8 text-sm">
                                    <div>
                                        <p className="text-muted-foreground text-xs mb-0.5 uppercase tracking-wide font-medium">Requests</p>
                                        <p className="text-foreground font-mono">{cred.usage?.totalRequests || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs mb-0.5 uppercase tracking-wide font-medium">Usage</p>
                                        <p className="text-foreground font-mono">
                                            {cred.usage?.totalTokens ? (cred.usage.totalTokens / 1000).toFixed(1) + 'k' : '0'} toks
                                        </p>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => handleDelete(cred._id)}
                                    disabled={processingId === cred._id}
                                    className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                                    title="Deactivate Key"
                                >
                                    {processingId === cred._id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
