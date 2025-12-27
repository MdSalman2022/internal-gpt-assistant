import { Star } from 'lucide-react';
import FadeIn from './FadeIn';

export default function Testimonials() {
    const testimonials = [
        { quote: 'InsightAI cut our research time by 80%. What used to take hours now takes minutes.', author: 'Jennifer Kim', role: 'Head of Research, TechCorp' },
        { quote: 'The accuracy and citation features are game-changing for our legal team.', author: 'Michael Chen', role: 'General Counsel, LegalFirm' },
        { quote: 'Finally, an AI that understands our complex documents without hallucinating.', author: 'Sarah Johnson', role: 'VP Operations, FinanceHQ' },
        { quote: 'We onboarded 500 employees in a week. The SSO integration was flawless.', author: 'David Park', role: 'IT Director, HealthPlus' },
        { quote: 'The analytics dashboard helps us understand how knowledge flows in our org.', author: 'Emily Zhang', role: 'Chief of Staff, EduTech' },
        { quote: 'Best investment we made this year. ROI was clear within the first month.', author: 'Robert Miller', role: 'CEO, StartupCo' },
        { quote: 'Multi-language support means our global team can all use the same platform.', author: 'Maria Garcia', role: 'Global Ops, WorldBank' },
        { quote: 'The compliance features saved us during our SOC 2 audit. Highly recommend.', author: 'James Wilson', role: 'Compliance Officer, SecureCorp' },
        { quote: 'Our team productivity increased 3x since switching to InsightAI.', author: 'Lisa Thompson', role: 'Product Lead, TechStartup' },
    ];

    return (
        <section className="py-32 px-6 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-16 items-start">
                    {/* Left - Sticky */}
                    <div className="lg:sticky lg:top-32 lg:self-start">
                        <FadeIn>
                            <p className="text-cyan-600 text-sm font-medium uppercase tracking-wider mb-4">Testimonials</p>
                            <h2 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
                                Loved by teams<br />around the world
                            </h2>
                            <div className="flex gap-1 mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-6 h-6 text-amber-400 fill-amber-400" />
                                ))}
                            </div>
                            <p className="text-zinc-500">4.9/5 from 500+ reviews</p>
                        </FadeIn>
                    </div>

                    {/* Right - Auto-scrolling testimonials */}
                    <div className="relative h-[500px] overflow-hidden">
                        {/* Gradient masks */}
                        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-white to-transparent z-10" />
                        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent z-10" />

                        {/* Scrolling container */}
                        <div className="animate-scroll-up space-y-4">
                            {testimonials.map((t, i) => (
                                <div key={i} className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200">
                                    <p className="text-zinc-700 text-base mb-3">&ldquo;{t.quote}&rdquo;</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-zinc-200 flex items-center justify-center font-semibold text-xs text-zinc-600">
                                            {t.author.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm text-zinc-900">{t.author}</p>
                                            <p className="text-zinc-500 text-xs">{t.role}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {/* Duplicate for seamless loop */}
                            {testimonials.slice(0, 3).map((t, i) => (
                                <div key={`dup-${i}`} className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200">
                                    <p className="text-zinc-700 text-base mb-3">&ldquo;{t.quote}&rdquo;</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-zinc-200 flex items-center justify-center font-semibold text-xs text-zinc-600">
                                            {t.author.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm text-zinc-900">{t.author}</p>
                                            <p className="text-zinc-500 text-xs">{t.role}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
