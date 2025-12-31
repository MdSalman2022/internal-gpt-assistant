import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Check, CreditCard, Clock, Shield } from 'lucide-react';
import { HeroScene } from './Scene3D';

export default function HeroSection() {
    const trustBadges = [
        { icon: CreditCard, text: 'No credit card', color: 'bg-emerald-50 text-emerald-600' },
        { icon: Clock, text: '14-day free trial', color: 'bg-blue-50 text-blue-600' },
        { icon: Shield, text: 'SOC 2 compliant', color: 'bg-purple-50 text-purple-600' },
    ];

    return (
        <section id="hero" data-theme="light" className="relative min-h-[90svh] flex items-center pt-32 pb-12 lg:pt-20 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center relative">
                <div className="flex flex-col items-start text-left z-10 transition-all duration-700 delay-100 relative">
                    <h1 className="text-6xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-8">
                        Transform  <br />
                        static data into<br />
                        <span className="text-cyan-600">Active Intelligence</span>
                    </h1>

                    <p className="text-lg text-zinc-500 leading-relaxed mb-10 max-w-md">
                        Context-aware document intelligence with production-grade RAG infrastructure. Deploy enterprise AI that actually understands your data.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4 mb-8 w-full sm:w-auto">
                        <Link href="/signup?plan=trial" className="w-full sm:w-auto group inline-flex items-center justify-center gap-3 px-8 py-4 bg-black text-white font-medium rounded-full hover:bg-zinc-800 transition-all">
                            Start Free Trial
                            <span className="w-6 h-6 rounded-full bg-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <ArrowRight className="w-3.5 h-3.5 text-black" />
                            </span>
                        </Link>
                        <a href="#platform" className="w-full sm:w-auto px-6 py-4 text-zinc-600 font-medium hover:text-black transition-colors flex items-center justify-center gap-2">
                            See how it works <ArrowUpRight className="w-4 h-4" />
                        </a>
                    </div>

                    {/* Trust Badges - Pills on mobile, inline on desktop */}
                    {/* Mobile: Colored pills */}
                    <div className="flex sm:hidden flex-wrap justify-center gap-2 w-full">
                        {trustBadges.map((badge, i) => (
                            <div
                                key={i}
                                className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${badge.color}`}
                            >
                                <badge.icon className="w-4 h-4" />
                                {badge.text}
                            </div>
                        ))}
                    </div>

                    {/* Desktop: Simple inline */}
                    <div className="hidden sm:flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-zinc-500">
                        <span className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-cyan-500" />
                            No credit card required
                        </span>
                        <span className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-cyan-500" />
                            14-day free trial
                        </span>
                        <span className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-cyan-500" />
                            SOC 2 compliant
                        </span>
                    </div>
                </div>

                {/* Right - 3D AI Brain Visual */}
                <div className="absolute inset-0 lg:relative lg:inset-auto flex items-center justify-center h-full lg:h-[600px] w-full lg:-mr-20 z-0 opacity-20 lg:opacity-100 pointer-events-none lg:pointer-events-auto">
                    <HeroScene />
                </div>
            </div>
        </section>
    );
}
