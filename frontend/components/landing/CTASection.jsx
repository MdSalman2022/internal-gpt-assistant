import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import FadeIn from './FadeIn';

export default function CTASection() {
    return (
        <section className="py-32 px-6 bg-black relative overflow-hidden">
            {/* Animated gradient blobs */}
            <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px] -translate-y-1/2 animate-pulse" />
            <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[100px] -translate-y-1/2 animate-pulse delay-1000" />

            {/* Grid pattern overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />

            {/* Decorative borders */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

            <div className="max-w-4xl mx-auto text-center relative z-10">
                <FadeIn>
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-white/70 mb-8">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        Start your free 14-day trial
                    </div>

                    <h2 className="text-4xl lg:text-6xl font-bold mb-6 text-white tracking-tight leading-tight">
                        Ready to transform<br />
                        <span className="text-cyan-400">your knowledge?</span>
                    </h2>

                    <p className="text-white/60 text-lg mb-12 max-w-2xl mx-auto leading-relaxed">
                        Join thousands of teams using InsightAI to unlock their document intelligence. No credit card required.
                    </p>

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
        </section>
    );
}
