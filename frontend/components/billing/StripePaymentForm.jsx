'use client';

import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Loader2 } from 'lucide-react';

export default function StripePaymentForm({ amount, onSuccess, onError }) {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);
        setErrorMessage(null);

        try {
            // Submit the elements to validate
            const { error: submitError } = await elements.submit();
            if (submitError) {
                setErrorMessage(submitError.message);
                setIsProcessing(false);
                return;
            }

            // Confirm payment
            const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                redirect: 'if_required', // Don't redirect, handle in-page
                confirmParams: {
                    return_url: `${window.location.origin}/settings/billing`,
                }
            });

            if (error) {
                setErrorMessage(error.message);
                setIsProcessing(false);
                if (onError) onError(error);
            } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                // Payment succeeded! Now create the subscription
                try {
                    const finalizeRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions/finalize-payment-intent`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ paymentIntentId: paymentIntent.id })
                    });

                    if (!finalizeRes.ok) {
                        const errorData = await finalizeRes.json();
                        throw new Error(errorData.error || 'Failed to activate subscription');
                    }

                    // Success! Subscription created
                    setIsProcessing(false);
                    if (onSuccess) onSuccess(paymentIntent);
                } catch (err) {
                    console.error('Subscription creation error:', err);
                    setErrorMessage('Payment succeeded, but subscription setup failed. Please contact support.');
                    setIsProcessing(false);
                    if (onError) onError(err);
                }
            }
        } catch (err) {
            setErrorMessage(err.message);
            setIsProcessing(false);
            if (onError) onError(err);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement options={{ layout: "tabs" }} />

            {errorMessage && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                    {errorMessage}
                </div>
            )}

            <button
                type="submit"
                disabled={!stripe || isProcessing}
                className="w-full bg-zinc-900 text-white py-3 px-4 rounded-lg font-semibold
                         hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                    </>
                ) : (
                    <span>Subscribe ${amount}/month</span>
                )}
            </button>
        </form>
    );
}
