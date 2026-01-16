'use client';

import { useState, useEffect } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { PLANS } from '@/lib/plans';
import { Check, Loader2, ArrowLeft, Copy } from 'lucide-react';
import StripePaymentForm from './StripePaymentForm';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const CopyButton = ({ label, value }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex items-center justify-between group cursor-pointer hover:bg-blue-100/50 p-1 rounded transition-colors" onClick={handleCopy}>
            <span>{label}: <span className="font-bold">{value}</span></span>
            {copied ? (
                <Check className="w-3 h-3 text-green-600" />
            ) : (
                <Copy className="w-3 h-3 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
        </div>
    );
};

export function UpgradePlanModal({ isOpen, onClose, currentPlan, onUpgrade, loading, plans = PLANS }) {
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const [open, setOpen] = useState(isOpen);
    const [showCheckout, setShowCheckout] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [clientSecret, setClientSecret] = useState(null);
    const [isLoadingIntent, setIsLoadingIntent] = useState(false);

    useEffect(() => {
        setOpen(isOpen);
    }, [isOpen]);

    const handleOpenChange = (open) => {
        setOpen(open);
        if (!open) {
            setShowCheckout(false);
            setSelectedPlan(null);
            setClientSecret(null);
            onClose();
        }
    };

    const handleUpgradeClick = async (plan) => {
        const planType = plan.type || plan.name?.toLowerCase();
        const isEnterprise = planType === 'enterprise';
        
        if (isEnterprise) {
            window.location.href = (plan.href || '/contact?type=enterprise');
            return;
        }

        setSelectedPlan(plan);
        
        // Check if this is an upgrade from an existing subscription
        const hasExistingSubscription = currentPlan && currentPlan !== 'trial';

        if (hasExistingSubscription) {
            // Upgrade existing subscription (with proration)
            setIsLoadingIntent(true);
            try {
                const priceId = plan.priceId || plan.stripePriceIdMonthly;
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions/upgrade`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        newPriceId: priceId,
                        newPlan: planType
                    })
                });

                const data = await res.json();

                if (data.success) {
                    handlePaymentSuccess();
                } else {
                    throw new Error(data.error || 'Failed to upgrade');
                }
            } catch (err) {
                console.error('Failed to upgrade:', err);
                alert(err.message);
                setSelectedPlan(null);
            } finally {
                setIsLoadingIntent(false);
            }
            return;
        }

        // New subscription (trial -> paid)
        setShowCheckout(true);
        setIsLoadingIntent(true);

        try {
            // Fetch client secret
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions/create-payment-intent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    priceId: plan.priceId || plan.stripePriceIdMonthly,
                    plan: planType
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to create payment intent');
            }

            const data = await res.json();
            setClientSecret(data.clientSecret);
        } catch (err) {
            console.error('Failed to create payment intent:', err);
            alert(err.message);
            setShowCheckout(false);
            setSelectedPlan(null);
        } finally {
            setIsLoadingIntent(false);
        }
    };

    const handlePaymentSuccess = () => {
        setShowCheckout(false);
        setSelectedPlan(null);
        setClientSecret(null);
        if (onUpgrade) {
            onUpgrade();
        }
        onClose();
    };

    const handlePaymentError = (error) => {
        console.error('Payment error:', error);
    };

    const handleBackToPlans = () => {
        setShowCheckout(false);
        setSelectedPlan(null);
        setClientSecret(null);
    };

    const Content = () => {
        // If showing checkout, render the payment form
        if (showCheckout && selectedPlan) {
            const displayName = selectedPlan.displayName || selectedPlan.name;
            const monthlyPrice = selectedPlan.priceMonthly || selectedPlan.monthlyPrice;

            return (
                <div className="max-w-[500px] mx-auto">
                    {/* Plan summary */}
                    <div className="mb-6 flex items-center justify-between p-4 bg-zinc-50 border border-zinc-100 rounded-xl">
                        <div>
                             <p className="text-sm text-zinc-500 font-medium">Subscribing to</p>
                            <h3 className="text-lg font-bold text-zinc-900">
                                {displayName}
                            </h3>
                        </div>
                        <div className="text-right">
                             <p className="text-sm text-zinc-500 font-medium">Total</p>
                            <p className="text-xl font-bold text-zinc-900">
                                ${monthlyPrice}
                                <span className="text-sm font-normal text-zinc-500">/mo</span>
                            </p>
                        </div>
                    </div>

                    {/* Test Credentials Helper */}
                    <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
                        <p className="font-semibold mb-2 flex items-center gap-2">
                            <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider">Test Mode</span>
                            Use these details to test:
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-white/50 p-2 rounded">
                            <CopyButton label="Card" value="4242 4242 4242 4242" />
                            <CopyButton label="Exp" value="12/34" />
                            <CopyButton label="CVC" value="123" />
                            <CopyButton label="Zip" value="12345" />
                        </div>
                    </div>

                    {/* Payment form */}
                    {isLoadingIntent ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <Loader2 className="w-8 h-8 animate-spin text-zinc-900" />
                            <p className="text-sm text-zinc-500">Preparing secure checkout...</p>
                        </div>
                    ) : clientSecret ? (
                        <Elements
                            stripe={stripePromise}
                            options={{
                                clientSecret,
                                appearance: {
                                    theme: 'stripe',
                                    variables: {
                                        colorPrimary: '#000000',
                                        fontFamily: 'system-ui, sans-serif',
                                        spacingUnit: '4px',
                                        borderRadius: '8px',
                                    }
                                }
                            }}
                        >
                            <StripePaymentForm
                                amount={monthlyPrice}
                                onSuccess={handlePaymentSuccess}
                                onError={handlePaymentError}
                            />
                        </Elements>
                    ) : (
                        <div className="text-center py-8 text-red-500 bg-red-50 rounded-lg">
                            <p className="font-medium">Unable to initialize checkout</p>
                            <button onClick={() => handleUpgradeClick(selectedPlan)} className="text-sm underline mt-2">Try Again</button>
                        </div>
                    )}
                </div>
            );
        }

        // Otherwise show pricing plans
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 px-2">
                {plans.map((p) => {
                    const planType = p.type || p.name?.toLowerCase();
                    const isCurrent = currentPlan?.toLowerCase() === planType;
                    const isEnterprise = planType === 'enterprise';
                    const isPopular = p.popular || p.isPopular;

                    const displayName = p.displayName || p.name;
                    const description = p.desc || p.description;
                    const monthlyPrice = p.priceMonthly || p.monthlyPrice;
                    const price = p.price || (monthlyPrice ? `$${monthlyPrice}` : 'Custom');
                    const period = p.period || (monthlyPrice ? '/mo' : '');

                    const features = p.features
                        ? (typeof p.features[0] === 'string' ? p.features : p.features.map(f => f.text || f))
                        : p.featureList?.filter(f => f.included !== false).map(f => f.text) || [];

                    return (
                        <div
                            key={displayName}
                            className={`relative flex flex-col p-6 rounded-2xl transition-all ${isPopular
                                ? 'bg-cyan-400 text-black scale-105 shadow-xl shadow-cyan-900/20 z-10'
                                : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                                }`}
                        >
                            {isPopular && (
                                <div className="absolute -top-3 left-6 px-3 py-1 bg-black text-cyan-400 text-xs font-bold rounded-full">
                                    POPULAR
                                </div>
                            )}

                            <div className="mb-4">
                                <h3 className="text-xl font-bold mb-1">{displayName}</h3>
                                <p className={`text-sm ${isPopular ? 'text-black/70' : 'text-white/60'}`}>
                                    {description}
                                </p>
                            </div>

                            <div className="text-4xl font-bold mb-6">
                                {price}
                                {period && (
                                    <span className={`text-base font-normal ${isPopular ? 'text-black/70' : 'text-white/60'}`}>
                                        {period}
                                    </span>
                                )}
                            </div>

                            <ul className="flex-1 space-y-3 mb-8">
                                {features.map((f, j) => (
                                    <li key={j} className={`flex items-start gap-2 text-sm ${isPopular ? 'text-black/80' : 'text-white/70'}`}>
                                        <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isPopular ? 'text-black' : 'text-cyan-400'}`} />
                                        <span>{f?.replace?.('Everything in Starter, plus:', '')?.replace?.('Everything in Pro, plus:', '') || f}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleUpgradeClick(p)}
                                disabled={isCurrent || loading}
                                className={`
                                    w-full py-3 px-4 rounded-full font-semibold transition-all flex items-center justify-center gap-2
                                    ${isCurrent
                                        ? 'bg-white/10 text-white/40 cursor-default'
                                        : isPopular
                                            ? 'bg-black text-white hover:bg-zinc-800'
                                            : 'bg-white text-black hover:bg-zinc-200'
                                    }
                                `}
                            >
                                {loading && !isCurrent ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Processing...</span>
                                    </>
                                ) : isCurrent ? (
                                    'Current Plan'
                                ) : isEnterprise ? (
                                    'Contact Sales'
                                ) : (
                                    'Upgrade Plan'
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>
        );
    };

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent 
                    className={`sm:max-w-[600px] p-0 max-h-[90vh] overflow-y-auto transition-colors duration-300 ${
                        showCheckout ? 'bg-white text-zinc-900' : 'bg-zinc-950 border-zinc-800 text-white sm:max-w-[1000px]'
                    }`}
                    onPointerDownOutside={(e) => {
                        if (showCheckout) {
                            e.preventDefault();
                        }
                    }}
                    onInteractOutside={(e) => {
                        if (showCheckout) {
                            e.preventDefault();
                        }
                    }}
                >
                    <div className={`px-6 py-4 border-b sticky top-0 z-10 backdrop-blur-sm flex items-center gap-4 ${
                        showCheckout ? 'bg-white/80 border-zinc-100' : 'bg-white/5 border-white/10'
                    }`}>
                        {showCheckout && (
                            <button
                                onClick={handleBackToPlans}
                                className="p-2 -ml-2 rounded-full hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        )}
                        <div>
                            <DialogTitle className={`text-xl font-bold ${showCheckout ? 'text-zinc-900' : 'text-white'}`}>
                                {showCheckout ? 'Complete Payment' : 'Upgrade Your Plan'}
                            </DialogTitle>
                            {!showCheckout && (
                                <DialogDescription className="text-sm text-white/60 mt-1">
                                    Choose the plan that fits your team's needs.
                                </DialogDescription>
                            )}
                        </div>
                    </div>
                    <div className={`p-6 ${showCheckout ? 'bg-white' : 'bg-zinc-950'}`}>
                        <Content />
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetContent side="bottom" className={`h-[95vh] overflow-y-auto p-0 transition-colors duration-300 ${
                showCheckout ? 'bg-white text-zinc-900' : 'bg-zinc-950 border-zinc-800 text-white'
            }`}>
                <div className={`sticky top-0 z-20 backdrop-blur-md px-6 py-4 border-b flex items-center gap-4 ${
                    showCheckout ? 'bg-white/80 border-zinc-100' : 'bg-zinc-950/80 border-white/10'
                }`}>
                    {showCheckout && (
                         <button
                            onClick={handleBackToPlans}
                            className="p-2 -ml-2 rounded-full hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    )}
                    <div>
                        <SheetTitle className={showCheckout ? 'text-zinc-900' : 'text-white'}>
                            {showCheckout ? 'Complete Payment' : 'Upgrade Plan'}
                        </SheetTitle>
                        {!showCheckout && (
                             <SheetDescription className={showCheckout ? 'text-zinc-500' : 'text-white/60'}>
                                Choose your plan.
                            </SheetDescription>
                        )}
                   </div>
                </div>
                <div className={`p-4 ${showCheckout ? 'bg-white' : 'bg-zinc-950'}`}>
                    <Content />
                </div>
            </SheetContent>
        </Sheet>
    );
}
