'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [tokenValid, setTokenValid] = useState(false);

    // Validate token on mount
    useEffect(() => {
        if (!token) {
            setError('No reset token provided');
            setValidating(false);
            return;
        }

        validateToken();
    }, [token]);

    const validateToken = async () => {
        try {
            const res = await fetch(`${API_URL}/api/auth/reset-password/${token}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Invalid or expired token');
            }

            setTokenValid(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setValidating(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to reset password');
            }

            setSuccess(true);

            // Redirect to login after 3 seconds
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (validating) {
        return (
            <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-muted-foreground">Validating reset link...</p>
            </div>
        );
    }

    if (!tokenValid && !success) {
        return (
            <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                    <XCircle className="w-8 h-8 text-destructive" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">Invalid Link</h2>
                <p className="text-muted-foreground mb-6">{error || 'This reset link is invalid or has expired.'}</p>
                <Link
                    href="/forgot-password"
                    className="inline-block px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-colors"
                >
                    Request New Link
                </Link>
            </div>
        );
    }

    if (success) {
        return (
            <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">Password Reset!</h2>
                <p className="text-muted-foreground mb-6">
                    Your password has been successfully reset. Redirecting to login...
                </p>
                <Link
                    href="/login"
                    className="inline-block px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-colors"
                >
                    Go to Login
                </Link>
            </div>
        );
    }

    return (
        <>
            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-foreground mb-2">Reset Password</h1>
                <p className="text-muted-foreground">Enter your new password below</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        New Password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            placeholder="••••••••"
                            className="w-full pl-10 pr-12 py-3 bg-secondary/50 border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
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

                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Confirm Password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                            placeholder="••••••••"
                            className="w-full pl-10 pr-4 py-3 bg-secondary/50 border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-semibold rounded-xl transition-colors shadow-lg shadow-primary/25"
                >
                    {loading ? 'Resetting...' : 'Reset Password'}
                </button>
            </form>
        </>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            {/* Background gradient */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary rounded-full blur-[120px]" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/40 ring-1 ring-primary/20">
                            <Sparkles className="w-7 h-7 text-primary-foreground fill-primary-foreground/10" />
                        </div>
                        <span className="text-2xl font-bold text-foreground">InsightAI</span>
                    </Link>
                </div>

                {/* Card */}
                <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-xl">
                    <Suspense fallback={
                        <div className="text-center">
                            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                        </div>
                    }>
                        <ResetPasswordForm />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
