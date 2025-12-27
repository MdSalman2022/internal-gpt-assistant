import Link from 'next/link';
import { Check } from 'lucide-react';
import FadeIn from './FadeIn';

export default function Pricing() {
    const plans = [
        { name: 'Starter', price: 'Free', desc: 'For individuals', features: ['5 documents', '100 queries/month', 'GPT-4o mini', 'Email support'], cta: 'Get Started' },
        { name: 'Pro', price: '$29', period: '/mo', desc: 'For small teams', features: ['Unlimited documents', 'Unlimited queries', 'All AI models', 'Priority support', 'Team workspaces'], popular: true, cta: 'Start Free Trial' },
        { name: 'Enterprise', price: 'Custom', desc: 'For organizations', features: ['Everything in Pro', 'SSO & SAML', 'On-premise deploy', 'Custom SLA', 'Dedicated CSM'], cta: 'Contact Sales' },
    ];

    return (
        <section id="pricing" className="py-32 px-6 bg-gradient-to-b from-zinc-900 to-black text-white relative overflow-hidden">
            {/* Subtle grid pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:60px_60px]" />

            {/* Decorative glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px]" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-start mb-16">
                    <FadeIn>
                        <p className="text-cyan-400 text-sm font-medium uppercase tracking-wider mb-4">Pricing</p>
                        <h2 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
                            Simple pricing,<br />powerful results
                        </h2>
                    </FadeIn>
                    <FadeIn delay={100}>
                        <p className="text-white/60 text-lg lg:mt-12">
                            Start with our free plan and upgrade as your team grows. No hidden fees, no surprises.
                        </p>
                    </FadeIn>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {plans.map((p, i) => (
                        <FadeIn key={i} delay={i * 100}>
                            <div className={`relative h-full p-8 rounded-2xl ${p.popular ? 'bg-cyan-400 text-black' : 'bg-white/5 border border-white/10 text-white'}`}>
                                {p.popular && (
                                    <div className="absolute -top-3 left-6 px-3 py-1 bg-cyan-400 text-black text-xs font-bold rounded-full">
                                        POPULAR
                                    </div>
                                )}
                                <h3 className="text-xl font-bold mb-1">{p.name}</h3>
                                <p className={`text-sm mb-4 ${p.popular ? 'text-black/70' : 'text-white/60'}`}>{p.desc}</p>
                                <div className="text-4xl font-bold mb-6">
                                    {p.price}
                                    {p.period && <span className={`text-base font-normal ${p.popular ? 'text-black/70' : 'text-white/60'}`}>{p.period}</span>}
                                </div>
                                <ul className="space-y-3 mb-8">
                                    {p.features.map((f, j) => (
                                        <li key={j} className={`flex items-center gap-2 text-sm ${p.popular ? 'text-black/80' : 'text-white/70'}`}>
                                            <Check className={`w-4 h-4 ${p.popular ? 'text-black' : 'text-cyan-400'}`} />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <Link href="/login" className={`block w-full py-3 text-center font-semibold rounded-full transition-all ${p.popular ? 'bg-black text-white hover:bg-zinc-800' : 'bg-white text-black hover:bg-zinc-100'}`}>
                                    {p.cta}
                                </Link>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </div>
        </section>
    );
}
