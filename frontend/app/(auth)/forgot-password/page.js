'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowLeft, Mail, CheckCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [resetUrl, setResetUrl] = useState(''); // DEV ONLY

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to send reset email');
            }

            // DEV: If email not found, show error instead of success
            if (data.emailNotFound) {
                setError(data.message);
                return;
            }

            setSuccess(true);
            // DEV ONLY: Show reset URL if provided
            if (data.resetUrl) {
                setResetUrl(data.resetUrl);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
            {/* Background gradient */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-white">KnowledgeAI</span>
                    </Link>
                </div>

                {/* Card */}
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-xl">
                    {!success ? (
                        <>
                            <div className="text-center mb-6">
                                <h1 className="text-2xl font-bold text-white mb-2">Forgot Password?</h1>
                                <p className="text-slate-400">
                                    Enter your email and we'll send you a reset link
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Email address
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            placeholder="you@example.com"
                                            className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors shadow-lg shadow-primary-500/25"
                                >
                                    {loading ? 'Sending...' : 'Send Reset Link'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-primary-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
                            <p className="text-slate-400 mb-6">
                                If an account exists for {email}, you'll receive a password reset link.
                            </p>

                            {/* DEV ONLY: Show reset link */}
                            {resetUrl && (
                                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mb-6">
                                    <p className="text-yellow-400 text-sm font-medium mb-2">
                                        🔧 DEV MODE: Reset link
                                    </p>
                                    <Link
                                        href={resetUrl.replace(API_URL.replace('/api', ''), '')}
                                        className="text-primary-400 hover:text-primary-300 text-sm break-all underline"
                                    >
                                        Click here to reset password
                                    </Link>
                                </div>
                            )}

                            <button
                                onClick={() => {
                                    setSuccess(false);
                                    setEmail('');
                                    setResetUrl('');
                                }}
                                className="text-primary-400 hover:text-primary-300 text-sm"
                            >
                                Try another email
                            </button>
                        </div>
                    )}

                    {/* Back to login */}
                    <div className="mt-6 pt-6 border-t border-slate-800 text-center">
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
