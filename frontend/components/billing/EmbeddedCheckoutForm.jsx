'use client';

import { useEffect, useState } from 'react';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { X, Loader2 } from 'lucide-react';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function EmbeddedCheckoutForm({ priceId, planName, onSuccess, onCancel }) {
    const [error, setError] = useState(null);

    const fetchClientSecret = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions/create-embedded-checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ priceId, plan: planName })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to create checkout session');
            }

            const data = await res.json();
            return data.clientSecret;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    return (
        <div className="relative">
            {/* Close button */}
            {onCancel && (
                <button
                    onClick={onCancel}
                    className="absolute top-2 right-2 z-50 p-2 rounded-full bg-secondary/80 hover:bg-secondary transition-colors"
                    aria-label="Close"
                >
                    <X className="w-5 h-5 text-foreground" />
                </button>
            )}

            {error ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                    <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-lg">
                        <p className="font-semibold mb-1">Payment Error</p>
                        <p className="text-sm">{error}</p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            ) : (
                <EmbeddedCheckoutProvider
                    stripe={stripePromise}
                    options={{ fetchClientSecret }}
                >
                    <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
            )}
        </div>
    );
}
