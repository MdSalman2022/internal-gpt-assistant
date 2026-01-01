'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
    User, Mail, Lock, Building2, Globe, Briefcase,
    ArrowRight, ArrowLeft, Check, Sparkles, Loader2, AlertCircle
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Education',
    'E-commerce',
    'Manufacturing',
    'Consulting',
    'Legal',
    'Real Estate',
    'Media & Entertainment',
    'Other'
];

function SignupForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const inviteToken = searchParams.get('inviteToken');
    const { user, loading: authLoading } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [slugChecking, setSlugChecking] = useState(false);
    const [slugAvailable, setSlugAvailable] = useState(null);
    const [inviteDetails, setInviteDetails] = useState(null);

    // Redirect if already logged in
    useEffect(() => {
        if (!authLoading && user) {
            router.push('/chat');
        }
    }, [user, authLoading, router]);

    // Fetch Invite Details
    useEffect(() => {
        if (inviteToken) {
            const fetchInvite = async () => {
                try {
                    const res = await fetch(`${API_URL}/api/invite/verify/${inviteToken}`);
                    const data = await res.json();
                    if (res.ok) {
                        setInviteDetails(data);
                        setFormData(prev => ({ ...prev, email: data.email }));
                    } else {
                        setError(data.error || 'Invalid invitation');
                    }
                } catch (err) {
                    setError('Failed to verify invitation');
                }
            };
            fetchInvite();
        }
    }, [inviteToken]);

    const [formData, setFormData] = useState({
        // Step 1: Account
        name: '',
        email: '',
        password: '',
        // Step 2: Organization
        organizationName: '',
        organizationSlug: '',
        industry: '',
        // Plan from URL
        plan: searchParams.get('plan') || 'trial',
        billingInterval: searchParams.get('interval') || 'month',
    });

    // Auto-generate slug when org name changes
    useEffect(() => {
        if (formData.organizationName && !formData.organizationSlug) {
            generateSlug(formData.organizationName);
        }
    }, [formData.organizationName]);

    // Check slug availability with debounce
    useEffect(() => {
        if (formData.organizationSlug.length >= 3) {
            const timer = setTimeout(() => checkSlug(formData.organizationSlug), 500);
            return () => clearTimeout(timer);
        }
    }, [formData.organizationSlug]);

    const generateSlug = async (name) => {
        try {
            const res = await fetch(`${API_URL}/api/auth/generate-slug?name=${encodeURIComponent(name)}`);
            const data = await res.json();
            setFormData(prev => ({ ...prev, organizationSlug: data.slug }));
            setSlugAvailable(data.available);
        } catch (err) {
            console.error('Error generating slug:', err);
        }
    };

    const checkSlug = async (slug) => {
        setSlugChecking(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/check-slug/${slug}`);
            const data = await res.json();
            setSlugAvailable(data.available);
        } catch (err) {
            console.error('Error checking slug:', err);
        } finally {
            setSlugChecking(false);
        }
    };

    const handleNext = () => {
        setError('');
        if (step === 1) {
            if (!formData.name || !formData.email || !formData.password) {
                setError('Please fill in all fields');
                return;
            }
            if (formData.password.length < 6) {
                setError('Password must be at least 6 characters');
                return;
            }

            // If invited, skip Step 2 and submit directly
            if (inviteToken) {
                handleSubmit(new Event('submit'));
            } else {
                setStep(2);
            }
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setError('');

        if (!inviteToken) {
            if (!formData.organizationName || !formData.organizationSlug) {
                setError('Please fill in organization details');
                return;
            }

            if (!slugAvailable) {
                setError('Organization URL is not available');
                return;
            }
        }

        setLoading(true);
        try {
            let url = `${API_URL}/api/auth/register-organization`;
            let body = { ...formData };

            // If invited, use simple register endpoint with token
            if (inviteToken) {
                url = `${API_URL}/api/auth/register`;
                body = {
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    inviteToken
                };
            }

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            // Redirect to the appropriate page
            router.push(data.redirectUrl || '/chat');
        } catch (err) {
            setError(err.message);
            if (err.message.includes('Email already registered')) {
                // If invited, this shouldn't happen unless logic is wrong, 
                // but if new org signup, go back to step 1
                if (!inviteToken) setStep(1);
            }
        } finally {
            setLoading(false);
        }
    };

    const planLabels = {
        trial: '14-Day Free Trial',
        starter: 'Starter Plan',
        pro: 'Pro Plan',
        enterprise: 'Enterprise Plan',
    };

    // Show loading while checking auth status
    if (authLoading || user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-zinc-200 border-t-cyan-500 rounded-full animate-spin" />
                    <p className="text-sm text-zinc-500">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-white">
            {/* Left side - Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-white relative z-10">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 mb-8 group">
                        <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-zinc-900">InsightAI</span>
                    </Link>

                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-zinc-900 mb-2">
                            {inviteDetails
                                ? `Join ${inviteDetails.organizationName}`
                                : step === 1 ? 'Create your account' : 'Set up your organization'
                            }
                        </h1>
                        <p className="text-zinc-500">
                            {inviteDetails
                                ? `You've been invited by ${inviteDetails.inviterName}`
                                : step === 1
                                    ? 'Start your journey with InsightAI'
                                    : 'Tell us about your company'
                            }
                        </p>
                    </div>

                    {/* Plan Badge (Hide if invited) */}
                    {!inviteToken && (
                        <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
                            <Check className="w-4 h-4" />
                            {planLabels[formData.plan]}
                        </div>
                    )}

                    {/* Step Indicator (Hide if invited) */}
                    {!inviteToken && (
                        <div className="flex items-center gap-3 mb-8">
                            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-black' : 'text-zinc-400'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? 'bg-black text-white' : 'bg-zinc-200'
                                    }`}>
                                    {step > 1 ? <Check className="w-4 h-4" /> : '1'}
                                </div>
                                <span className="text-sm font-medium">Account</span>
                            </div>
                            <div className="w-12 h-px bg-zinc-200" />
                            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-black' : 'text-zinc-400'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? 'bg-black text-white' : 'bg-zinc-200'
                                    }`}>
                                    2
                                </div>
                                <span className="text-sm font-medium">Organization</span>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={step === 1 ? (e) => { e.preventDefault(); handleNext(); } : handleSubmit}>
                        {step === 1 && (
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-900 mb-2">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="John Doe"
                                            required
                                            className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-900 mb-2">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="you@company.com"
                                            required
                                            readOnly={!!inviteToken} // Read-only if invited
                                            className={`w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 outline-none transition-all ${inviteToken ? 'bg-zinc-100 cursor-not-allowed text-zinc-500' : 'focus:bg-white focus:border-black focus:ring-1 focus:ring-black'}`}
                                        />
                                    </div>
                                    {inviteToken && <p className="text-xs text-zinc-500 mt-1">Email is locked for invitation</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-900 mb-2">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
                                            className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                                        />
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-1">Minimum 6 characters</p>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-black text-white py-3.5 rounded-xl font-medium hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                                >
                                    {inviteToken ? 'Join Organization' : 'Continue'}
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-900 mb-2">Organization Name</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                                        <input
                                            type="text"
                                            value={formData.organizationName}
                                            onChange={(e) => setFormData({ ...formData, organizationName: e.target.value, organizationSlug: '' })}
                                            placeholder="Acme Inc"
                                            required
                                            className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-900 mb-2">Organization URL</label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                                        <input
                                            type="text"
                                            value={formData.organizationSlug}
                                            onChange={(e) => setFormData({ ...formData, organizationSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                            placeholder="acme-inc"
                                            required
                                            className={`w-full pl-10 pr-12 py-3 bg-zinc-50 border rounded-xl text-zinc-900 placeholder-zinc-400 focus:bg-white outline-none transition-all ${slugAvailable === true ? 'border-emerald-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500' :
                                                slugAvailable === false ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500' :
                                                    'border-zinc-200 focus:border-black focus:ring-1 focus:ring-black'
                                                }`}
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            {slugChecking && <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />}
                                            {!slugChecking && slugAvailable === true && <Check className="w-5 h-5 text-emerald-500" />}
                                            {!slugChecking && slugAvailable === false && <AlertCircle className="w-5 h-5 text-red-500" />}
                                        </div>
                                    </div>
                                    {slugAvailable === false && (
                                        <p className="text-xs text-red-500 mt-1">This URL is already taken</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-900 mb-2">Industry (Optional)</label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                                        <select
                                            value={formData.industry}
                                            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all appearance-none"
                                        >
                                            <option value="">Select industry...</option>
                                            {industries.map(ind => (
                                                <option key={ind} value={ind}>{ind}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="px-6 py-3.5 border border-zinc-200 rounded-xl font-medium hover:bg-zinc-50 transition-all flex items-center gap-2 text-black"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !slugAvailable}
                                        className="flex-1 bg-black text-white py-3.5 rounded-xl font-medium hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                Create Organization
                                                <ArrowRight className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>

                    {/* Login link */}
                    <p className="text-center text-zinc-500 mt-8">
                        Already have an account?{' '}
                        <Link href="/login" className="text-black font-semibold hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>

            {/* Right side - Visual */}
            <div className="hidden lg:flex flex-[1.2] bg-black relative overflow-hidden items-center justify-center p-16">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10 max-w-xl">
                    <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center mb-10">
                        <Building2 className="w-10 h-10 text-emerald-400" />
                    </div>

                    <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
                        Team Collaboration,<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Enterprise Ready</span>
                    </h2>

                    <p className="text-lg text-white/60 mb-12 leading-relaxed">
                        Create your organization workspace and invite your team to start finding answers from your company's knowledge base.
                    </p>

                    <div className="space-y-4">
                        {[
                            { icon: '👥', title: 'Team workspaces', desc: 'Collaborate with your entire organization' },
                            { icon: '🔐', title: 'Role-based access', desc: 'Control who sees what with fine-grained permissions' },
                            { icon: '📊', title: 'Usage analytics', desc: 'Track adoption and insights across your team' },
                        ].map((feature, i) => (
                            <div key={i} className="p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                                <div className="flex items-start gap-4">
                                    <div className="p-2.5 bg-emerald-500/10 rounded-lg">
                                        <span className="text-2xl">{feature.icon}</span>
                                    </div>
                                    <div>
                                        <p className="text-white font-medium mb-1">{feature.title}</p>
                                        <p className="text-sm text-white/40">{feature.desc}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
            </div>
        }>
            <SignupForm />
        </Suspense>
    );
}
