'use client';

import { useState, useEffect } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { PLANS } from '@/lib/plans';
import { Check, Loader2 } from 'lucide-react';

export function UpgradePlanModal({ isOpen, onClose, currentPlan, onUpgrade, loading, plans = PLANS }) {
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const [open, setOpen] = useState(isOpen);

    useEffect(() => {
        setOpen(isOpen);
    }, [isOpen]);

    const handleOpenChange = (open) => {
        setOpen(open);
        if (!open) onClose();
    };

    const Content = () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 px-2">
            {plans.map((p) => {
                // Handle both old format (type) and new DB format (name)
                const planType = p.type || p.name?.toLowerCase();
                const isCurrent = currentPlan?.toLowerCase() === planType;
                const isEnterprise = planType === 'enterprise';
                const isPopular = p.popular || p.isPopular;

                // Handle different field names from Plan model
                const displayName = p.displayName || p.name;
                const description = p.desc || p.description;
                const monthlyPrice = p.priceMonthly || p.monthlyPrice;
                const price = p.price || (monthlyPrice ? `$${monthlyPrice}` : 'Custom');
                const period = p.period || (monthlyPrice ? '/mo' : '');

                // Handle featureList (objects) vs features (strings)
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
                            onClick={() => isEnterprise ? window.location.href = (p.href || '/contact?type=enterprise') : onUpgrade({ ...p, type: planType, name: displayName })}
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

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-[1000px] p-0 overflow-hidden bg-zinc-950 border-zinc-800 text-white">
                    <div className="p-8 border-b border-white/10 bg-white/5">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-white">Upgrade Your Plan</DialogTitle>
                            <DialogDescription className="text-base text-white/60 mt-2">
                                Choose the plan that fits your team's needs. Upgrade or downgrade anytime.
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    <div className="p-4 bg-zinc-950">
                        <Content />
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetContent side="bottom" className="h-[95vh] overflow-y-auto p-0 bg-zinc-950 border-zinc-800 text-white">
                <div className="sticky top-0 z-20 bg-zinc-950/80 backdrop-blur-md p-6 border-b border-white/10">
                    <SheetHeader>
                        <SheetTitle className="text-white">Upgrade Plan</SheetTitle>
                        <SheetDescription className="text-white/60">
                            Choose the plan that fits your team's needs.
                        </SheetDescription>
                    </SheetHeader>
                </div>
                <div className="p-4 bg-zinc-950">
                    <Content />
                </div>
            </SheetContent>
        </Sheet>
    );
}
