'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function LoginPage() {
    const { login, register, user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    });

    // Redirect if already logged in
    useEffect(() => {
        if (!authLoading && user) {
            router.push('/chat');
        }
    }, [user, authLoading, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await login(formData.email, formData.password);
            } else {
                await register(formData.name, formData.email, formData.password);
            }
            router.push('/chat');
        } catch (err) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = `${API_URL}/api/auth/google`;
    };

    return (
        <div className="min-h-screen flex bg-background">
            {/* Left side - Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
                            <Sparkles className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="text-xl font-bold text-foreground">KnowledgeAI</span>
                    </div>

                    {/* Header */}
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        {isLogin ? 'Welcome back' : 'Create account'}
                    </h1>
                    <p className="text-muted-foreground mb-8">
                        {isLogin
                            ? 'Sign in to access your knowledge assistant'
                            : 'Start finding answers from your documents'
                        }
                    </p>

                    {/* Google OAuth */}
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 
                       bg-white hover:bg-gray-100 text-gray-800 font-medium 
                       rounded-lg transition-colors mb-6"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                    </button>

                    {/* Divider */}
                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-background text-muted-foreground">or continue with email</span>
                        </div>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="John Doe"
                                        required={!isLogin}
                                        className="input pl-10"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="you@company.com"
                                    required
                                    className="input pl-10"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
                                    required
                                    className="input pl-10 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {isLogin && (
                            <div className="flex justify-end">
                                <Link href="/forgot-password" className="text-sm text-primary hover:text-primary/80">
                                    Forgot password?
                                </Link>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary py-3"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Processing...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    {isLogin ? 'Sign In' : 'Create Account'}
                                    <ArrowRight className="w-5 h-5" />
                                </span>
                            )}
                        </button>
                    </form>

                    {/* Toggle */}
                    <p className="text-center text-muted-foreground mt-6">
                        {isLogin ? "Don't have an account?" : 'Already have an account?'}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="ml-1 text-primary hover:text-primary/80 font-medium"
                        >
                            {isLogin ? 'Sign up' : 'Sign in'}
                        </button>
                    </p>
                </div>
            </div>

            {/* Right side - Decorative */}
            <div className="hidden lg:flex flex-1 items-center justify-center bg-card p-12">
                <div className="max-w-lg text-center">
                    <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-8 shadow-lg shadow-primary/40 ring-1 ring-primary/20">
                        <Sparkles className="w-10 h-10 text-primary-foreground fill-primary-foreground/10" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-4">
                        Your Company Knowledge, Instantly Accessible
                    </h2>
                    <p className="text-muted-foreground mb-8">
                        Ask questions in natural language and get accurate answers from your internal documents, with sources and citations.
                    </p>

                    {/* Use cases */}
                    <div className="text-left space-y-4 mb-8">
                        <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg border border-border/50">
                            <span className="text-xl">🎯</span>
                            <div>
                                <p className="text-foreground font-medium">HR & Policy</p>
                                <p className="text-sm text-muted-foreground">Vacation, benefits, onboarding guides</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg border border-border/50">
                            <span className="text-xl">💻</span>
                            <div>
                                <p className="text-foreground font-medium">IT Support</p>
                                <p className="text-sm text-muted-foreground">Setup guides, troubleshooting, security</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg border border-border/50">
                            <span className="text-xl">📊</span>
                            <div>
                                <p className="text-foreground font-medium">Sales Enablement</p>
                                <p className="text-sm text-muted-foreground">Product info, pricing, competitor analysis</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-3">
                        {['PDFs', 'Word Docs', 'Notion', 'Confluence', 'Slack'].map(tag => (
                            <span key={tag} className="px-3 py-1 bg-secondary text-muted-foreground rounded-full text-sm border border-border/50">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
