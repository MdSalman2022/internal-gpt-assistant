'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');
    
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('Verifying your email...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('No verification token found. Please check your link.');
            return;
        }

        const verifyEmail = async () => {
            try {
                // Call verification API
                await api.post('/api/auth/verify-email/confirm', { token });
                setStatus('success');
                setMessage('Your email has been successfully verified! You can now access all features.');
            } catch (error) {
                console.error('Verification failed:', error);
                setStatus('error');
                setMessage(error.message || 'Verification link is invalid or expired. Please request a new one.');
            }
        };

        verifyEmail();
    }, [token]);

    return (
        <div className="w-full max-w-md p-8 bg-card rounded-2xl shadow-xl border border-border/50 backdrop-blur-sm">
            <div className="text-center mb-8">
                <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent hover:opacity-90 transition-opacity">
                    ✨ InsightAI
                </Link>
            </div>

            <div className="flex flex-col items-center text-center space-y-6">
                {status === 'verifying' && (
                    <>
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
                            <div className="relative bg-background p-4 rounded-full border border-border shadow-inner">
                                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-semibold tracking-tight">Verifying Email...</h2>
                            <p className="text-muted-foreground">Please wait while we confirm your email address.</p>
                        </div>
                    </>
                )}

                {status === 'success' && (
                    <>
                         <motion.div 
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="relative"
                        >
                            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl"></div>
                            <div className="relative bg-background p-4 rounded-full border border-green-500/20 shadow-inner">
                                <CheckCircle className="w-12 h-12 text-green-500" />
                            </div>
                        </motion.div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-semibold tracking-tight text-green-500">Email Verified!</h2>
                            <p className="text-muted-foreground">{message}</p>
                        </div>
                        <Link 
                            href="/" 
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-all shadow-lg hover:shadow-primary/25 mt-4"
                        >
                            Go to Help Center <ArrowRight className="w-4 h-4" />
                        </Link>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <motion.div 
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="relative"
                        >
                            <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl"></div>
                            <div className="relative bg-background p-4 rounded-full border border-red-500/20 shadow-inner">
                                <XCircle className="w-12 h-12 text-red-500" />
                            </div>
                        </motion.div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-semibold tracking-tight text-red-500">Verification Failed</h2>
                            <p className="text-muted-foreground max-w-[280px] mx-auto">{message}</p>
                        </div>
                        <Link 
                            href="/" 
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-all mt-4"
                        >
                            Return to Home
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
             {/* Background Effects */}
             <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-3xl opacity-30"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-3xl opacity-30"></div>
            </div>

            <Suspense fallback={
                <div className="w-full max-w-md p-8 bg-card rounded-2xl shadow-xl flex items-center justify-center min-h-[400px]">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
            }>
                <VerifyEmailContent />
            </Suspense>
        </div>
    );
}
