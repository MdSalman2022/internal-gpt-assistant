import Link from 'next/link';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import FadeIn from './FadeIn';

export default function PricingCTA() {
    const plans = [
        { name: 'starter', price: 'Free', desc: 'For individuals', features: ['5 documents', '100 queries/month', 'GPT-4o mini', 'Email support'], cta: 'Get Started', href: '/signup?plan=trial' },
        { name: 'pro', price: '$29', period: '/mo', desc: 'For small teams', features: ['Unlimited documents', 'Unlimited queries', 'All AI models', 'Priority support', 'Team workspaces'], popular: true, cta: 'Start Free Trial', href: '/signup?plan=pro' },
        { name: 'enterprise', price: 'Custom', desc: 'For organizations', features: ['Everything in Pro', 'SSO & SAML', 'On-premise deploy', 'Custom SLA', 'Dedicated CSM'], cta: 'Contact Sales', href: '/contact?type=enterprise' },
    ];

    return (
        <section id="pricing" className="py-32 px-6 bg-black text-white relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-black to-black" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />

            {/* Decorative glows */}
            <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px]" />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Unified Header - CTA Style */}
                <div className="text-center mb-20">
                    <FadeIn>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-white/70 mb-8">
                            <Sparkles className="w-4 h-4 text-cyan-400" />
                            Start your free 14-day trial
                        </div>

                        <h2 className="text-4xl lg:text-6xl font-bold mb-6 text-white tracking-tight leading-tight">
                            Ready to transform<br />
                            <span className="text-cyan-400">your knowledge?</span>
                        </h2>

                        <p className="text-white/60 text-lg mb-6 max-w-2xl mx-auto leading-relaxed">
                            Choose the plan that fits your team. No hidden fees, upgrade anytime.
                        </p>
                    </FadeIn>
                </div>

                {/* Pricing Cards */}
                <div className="grid lg:grid-cols-3 gap-6 mb-20">
                    {plans.map((p, i) => (
                        <FadeIn key={i} delay={i * 100}>
                            <div className={`relative h-full p-8 rounded-2xl ${p.popular ? 'bg-cyan-400 text-black' : 'bg-white/5 border border-white/10 text-white'}`}>
                                {p.popular && (
                                    <div className="absolute -top-3 left-6 px-3 py-1 bg-black text-cyan-400 text-xs font-bold rounded-full">
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
                                <Link href={p.href} className={`block w-full py-3 text-center font-semibold rounded-full transition-all ${p.popular ? 'bg-black text-white hover:bg-zinc-800' : 'bg-white text-black hover:bg-zinc-100'}`}>
                                    {p.cta}
                                </Link>
                            </div>
                        </FadeIn>
                    ))}
                </div>

                {/* Bottom CTA */}
                <div className="text-center">
                    <FadeIn>
                        <p className="text-white/50 text-sm mb-6">Not sure which plan? Start free and upgrade anytime.</p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/signup?plan=trial"
                                className="group inline-flex items-center gap-3 px-10 py-5 bg-cyan-400 text-black font-bold rounded-full hover:bg-cyan-300 hover:shadow-xl hover:shadow-cyan-500/30 transition-all hover:scale-105"
                            >
                                Start Free Trial
                                <span className="w-7 h-7 rounded-full bg-black flex items-center justify-center group-hover:rotate-45 transition-transform">
                                    <ArrowRight className="w-4 h-4 text-cyan-400" />
                                </span>
                            </Link>
                            <Link
                                href="/contact?type=demo"
                                className="px-10 py-5 text-white font-medium border border-white/20 bg-white/5 backdrop-blur-sm rounded-full hover:border-white/40 hover:bg-white/10 transition-all"
                            >
                                Schedule Demo
                            </Link>
                        </div>
                    </FadeIn>
                </div>
            </div>
        </section>
    );
}
