'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function InvitePage() {
    const router = useRouter();
    const params = useParams();
    const { token } = params;
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('Verifying invitation...');
    const [orgName, setOrgName] = useState('');
    const [inviterName, setInviterName] = useState('');

    useEffect(() => {
        verifyToken();
    }, [token]);

    const verifyToken = async () => {
        try {
            const res = await fetch(`${API_URL}/api/invite/verify/${token}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Invalid invitation');
            }

            // Redirect to signup page with invite token
            router.push(`/signup?inviteToken=${token}`);
        } catch (err) {
            setStatus('error');
            setMessage(err.message);
        }
    };

    const handleAccept = async () => {
        try {
            const res = await fetch(`${API_URL}/api/invite/accept/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to accept invitation');
            }

            toast.success('Invitation accepted! Please log in.');
            router.push('/dashboard/login');
        } catch (err) {
            toast.error(err.message);
        }
    };

    if (status === 'verifying') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground">{message}</p>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="bg-card border border-border rounded-xl p-8 max-w-md w-full shadow-lg text-center">
                    <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4 text-destructive">
                        <X className="w-6 h-6" />
                    </div>
                    <h1 className="text-xl font-bold text-foreground mb-2">Invitation Error</h1>
                    <p className="text-muted-foreground mb-6">{message}</p>
                    <button
                        onClick={() => router.push('/')}
                        className="btn-secondary w-full"
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-xl p-8 max-w-md w-full shadow-lg text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                    <Check className="w-6 h-6" />
                </div>
                <h1 className="text-xl font-bold text-foreground mb-2">Join {orgName}</h1>
                <p className="text-muted-foreground mb-8">
                    {inviterName} has invited you to join their organization on InsightAI.
                </p>

                <div className="space-y-3">
                    <button
                        onClick={handleAccept}
                        className="btn-primary w-full"
                    >
                        Accept Invitation
                    </button>
                    <button
                        onClick={() => router.push('/')}
                        className="btn-ghost w-full"
                    >
                        Decline
                    </button>
                </div>
            </div>
        </div>
    );
}
