import Link from 'next/link';
import { ArrowRight, Upload, MessageSquare, BookOpen, Database, Calendar, Languages, Mic, History } from 'lucide-react';
import FadeIn from './FadeIn';

export default function CoreCapabilities() {
    const features = [
        { icon: Upload, title: 'Multi-Format Upload', desc: 'PDF, Word, Excel, PowerPoint, images, and 50+ more formats supported.' },
        { icon: MessageSquare, title: 'Natural Language Chat', desc: 'Ask questions like you would ask a colleague. Context-aware responses.' },
        { icon: BookOpen, title: 'Cited Answers', desc: 'Every response includes source citations for verification.' },
        { icon: Database, title: 'Knowledge Collections', desc: 'Organize documents into team or project-specific collections.' },
        { icon: Calendar, title: 'Calendar Integration', desc: 'Connect Google Calendar and Outlook for scheduling queries.' },
        { icon: Languages, title: '50+ Languages', desc: 'Ask and receive answers in any language you prefer.' },
        { icon: Mic, title: 'Voice Queries', desc: 'Speak your questions naturally with voice input support.' },
        { icon: History, title: 'Query History', desc: 'Access your complete conversation history anytime.' },
    ];

    return (
        <section id="use-cases" className="py-32 px-6 bg-white relative" data-theme="light">
            <div className="max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-[1fr_1.5fr] gap-16 items-start">
                    {/* Left - Sticky */}
                    <div className="lg:sticky lg:top-32 lg:self-start">
                        <FadeIn>
                            <p className="text-cyan-600 text-sm font-medium uppercase tracking-wider mb-4">Core Capabilities</p>
                            <h2 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight mb-6">
                                Everything you need to unlock your data
                            </h2>
                            <p className="text-zinc-500 text-lg mb-8">
                                From document upload to AI-powered insights — all in one platform.
                            </p>
                            <Link href="/login" className="inline-flex items-center gap-2 text-cyan-600 font-medium hover:text-cyan-700 transition-colors">
                                Explore all features <ArrowRight className="w-4 h-4" />
                            </Link>
                        </FadeIn>
                    </div>

                    {/* Right - Features grid */}
                    <div className="grid sm:grid-cols-2 gap-6">
                        {features.map((item, i) => (
                            <FadeIn key={i} delay={i * 60}>
                                <div className="group p-6 rounded-2xl border border-zinc-200 hover:border-cyan-300 hover:shadow-lg transition-all bg-white">
                                    <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center mb-5 group-hover:bg-cyan-50 transition-colors">
                                        <item.icon className="w-6 h-6 text-zinc-700 group-hover:text-cyan-600 transition-colors" />
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                                    <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
