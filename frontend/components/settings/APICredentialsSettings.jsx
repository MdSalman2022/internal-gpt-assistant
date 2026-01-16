import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { API_URL } from '@/lib/api';
import { 
    Key, Plus, Trash2, Shield, Pencil,
    AlertCircle, Loader2, Sparkles, Bot, Brain, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function APICredentialsSettings() {
    const { user } = useAuth();
    const [credentials, setCredentials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
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
                setCredentials([data.credential, ...credentials]); 
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

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!editingId) return;
        setProcessingId('update');

        try {
            const res = await fetch(`${API_URL}/api/credentials/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData)
            });
            
            const data = await res.json();
            
            if (data.success) {
                toast.success('API Key updated successfully');
                setCredentials(credentials.map(c => c._id === editingId ? data.credential : c));
                setEditingId(null);
                setFormData({ provider: 'gemini', apiKey: '', label: '' });
            } else {
                toast.error(data.error || 'Failed to update key');
            }
        } catch (error) {
            toast.error('Error updating API key');
        } finally {
            setProcessingId(null);
        }
    };

    const startEdit = (cred) => {
        setEditingId(cred._id);
        setFormData({
            provider: cred.provider,
            apiKey: '', // Don't show existing key for security, or maybe placeholder? Usually blank/placeholder.
            label: cred.label || ''
        });
        setIsCreating(true);
    };

    const cancelEdit = () => {
        setIsCreating(false);
        setEditingId(null);
        setFormData({ provider: 'gemini', apiKey: '', label: '' });
    };

    const handleToggleActive = async (id, currentStatus, provider) => {
        const newStatus = !currentStatus;
        
        // Optimistic Update Calculation
        let updates = [];
        
        // If activating, we must deactivate others for the same provider
        if (newStatus === true) {
            const activeOthers = credentials.filter(c => c.provider === provider && c._id !== id && c.isActive);
            activeOthers.forEach(other => {
                updates.push({ id: other._id, status: false });
            });
        }
        
        // Add current target
        updates.push({ id, status: newStatus });
        
        // Apply Optimistic State
        setCredentials(prev => prev.map(c => {
            const update = updates.find(u => u.id === c._id);
            return update ? { ...c, isActive: update.status } : c;
        }));

        // Execute API calls
        try {
            await Promise.all(updates.map(u => 
                fetch(`${API_URL}/api/credentials/${u.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ isActive: u.status })
                })
            ));
            
            // Optional: Success feedback for main action only to avoid spam
            // toast.success(newStatus ? 'Key activated' : 'Key deactivated');
        } catch (error) {
            console.error('Failed to update statuses', error);
            toast.error('Failed to update key status');
            loadCredentials(); // Revert on error
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to PERMANENTLY delete this key? This action cannot be undone.')) return;
        
        setProcessingId(id);
        try {
            const res = await fetch(`${API_URL}/api/credentials/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            if (res.ok) {
                toast.success('Key deleted permanently');
                setCredentials(credentials.filter(c => c._id !== id));
            } else {
                toast.error('Failed to delete key');
            }
        } catch (error) {
            toast.error('Error removing key');
        } finally {
            setProcessingId(null);
        }
    };

    const getProviderName = (provider) => {
        switch(provider) {
            case 'gemini': return 'Google Gemini';
            case 'openai': return 'OpenAI';
            case 'anthropic': return 'Anthropic Claude';
            case 'groq': return 'Groq';
            default: return provider;
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

            {/* Form */}
            {isCreating && (
                <div className="p-6 bg-muted/40 border-b border-border animate-in slide-in-from-top-2">
                    <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4 max-w-3xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Provider</label>
                                <div className="relative">
                                    <select 
                                        value={formData.provider}
                                        onChange={(e) => setFormData({...formData, provider: e.target.value})}
                                        disabled={!!editingId} // Disable provider change when editing
                                        className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-50"
                                    >
                                        <option value="gemini">Google Gemini</option>
                                        <option value="openai">OpenAI</option>
                                        <option value="anthropic">Anthropic Claude</option>
                                        <option value="groq">Groq</option>
                                    </select>
                                    {!editingId && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <span className="text-muted-foreground text-xs">▼</span>
                                        </div>
                                    )}
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
                                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">
                                    {editingId ? 'New API Secret Key (Leave blank to keep current)' : 'API Secret Key'}
                                </label>
                                <input 
                                    type="password"
                                    placeholder={editingId ? "•••••••••••••••••••••" : "sk-..."}
                                    required={!editingId}
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
                                disabled={processingId === 'create' || processingId === 'update'}
                                className="px-6 py-2 bg-primary hover:opacity-90 text-primary-foreground font-medium rounded-lg flex items-center gap-2 transition-colors"
                            >
                                {(processingId === 'create' || processingId === 'update') ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId ? 'Update Credentials' : 'Save & Secure')}
                            </button>
                            <button 
                                type="button"
                                onClick={cancelEdit}
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
                        <div key={cred._id} className={`p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-muted/30 transition-colors ${!cred.isActive ? 'opacity-60 bg-muted/10' : ''}`}>
                            
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-muted rounded-xl border border-border shrink-0">
                                    {getProviderIcon(cred.provider)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h4 className="font-bold text-foreground text-base">
                                            {getProviderName(cred.provider)}
                                        </h4>
                                        {cred.isActive ? (
                                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-green-500/10 text-green-600 border border-green-500/20 tracking-wider">
                                                Active
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-500/10 text-slate-500 border border-slate-500/20 tracking-wider">
                                                Inactive
                                            </span>
                                        )}
                                    </div>
                                    {cred.label && (
                                        <p className="text-sm text-foreground/80 mt-0.5 font-medium">{cred.label}</p>
                                    )}
                                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground font-mono">
                                        <span className="bg-muted/50 pl-2 pr-3 py-1 rounded-md border border-border flex items-center gap-2 select-all">
                                            <Key className="w-3 h-3 opacity-50" />
                                            {cred.keyPreview || '••••'}
                                        </span>
                                        <span className="text-[10px] uppercase tracking-wide opacity-70">
                                            Added {new Date(cred.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 md:gap-12 pl-14 md:pl-0">
                                <div className="flex items-center gap-8 text-sm">
                                    <div>
                                        <p className="text-muted-foreground text-[10px] mb-1 uppercase tracking-wider font-bold">Spent</p>
                                        <p className="text-foreground font-mono font-medium">
                                            ${((cred.usage?.totalCostCents || 0) / 100).toFixed(4)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-[10px] mb-1 uppercase tracking-wider font-bold">Requests</p>
                                        <p className="text-foreground font-mono font-medium">{cred.usage?.totalRequests || 0}</p>
                                    </div>
                                    <div className="hidden sm:block">
                                        <p className="text-muted-foreground text-[10px] mb-1 uppercase tracking-wider font-bold">Usage</p>
                                        <p className="text-foreground font-mono font-medium">
                                            {cred.usage?.totalTokens ? (cred.usage.totalTokens / 1000).toFixed(1) + 'k' : '0'} toks
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Edit Button */}
                                    <button 
                                        onClick={() => startEdit(cred)}
                                        disabled={processingId === cred._id}
                                        className="p-2.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                        title="Edit Key"
                                    >
                                        <Pencil className="w-4.5 h-4.5" />
                                    </button>

                                    {/* Enable/Disable Switch */}
                                    <button 
                                        onClick={() => handleToggleActive(cred._id, cred.isActive, cred.provider)}
                                        disabled={processingId === cred._id}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${cred.isActive ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                                        title={cred.isActive ? "Deactivate Key" : "Activate Key"}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${cred.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>

                                    {/* Hard Delete */}
                                    <button 
                                        onClick={() => handleDelete(cred._id)}
                                        disabled={processingId === cred._id}
                                        className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                                        title="Permanently Delete Key"
                                    >
                                        {processingId === cred._id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
