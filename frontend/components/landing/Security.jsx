import Link from 'next/link';
import { ArrowRight, Lock, Fingerprint, Shield, History, Server, Globe, Check } from 'lucide-react';
import FadeIn from './FadeIn';

export default function Security() {
    const features = [
        { icon: Lock, title: 'AES-256 Encryption', desc: 'All API keys and sensitive data are encrypted using AES-256 with unique initialization vectors. Data encrypted at rest and in transit via TLS 1.3.' },
        { icon: Fingerprint, title: 'OAuth2 Authentication', desc: 'Secure authentication via Google OAuth2, session-based access control, and JWT tokens. Support for enterprise SSO with SAML 2.0.' },
        { icon: Shield, title: 'Role-Based Access Control', desc: 'Granular permissions system with Admin and User roles. Department and team-level access controls for document collections.' },
        { icon: History, title: 'Complete Audit Logging', desc: 'Every action is logged with user ID, timestamp, and IP address. Export audit trails for compliance audits and security reviews.' },
        { icon: Server, title: 'Secure Session Management', desc: 'HTTP-only cookies, secure session tokens, and automatic session expiration. Protection against XSS and CSRF attacks.' },
        { icon: Globe, title: 'Data Residency Options', desc: 'Choose your data storage region. On-premise deployment available for organizations requiring full data sovereignty.' },
    ];

    const certifications = ['SOC 2 Type II', 'GDPR Compliant', 'HIPAA Ready'];

    return (
        <section id="security" className="min-h-[90vh] py-40 px-6 bg-black text-white flex items-center" data-theme="dark">
            <div className="max-w-7xl mx-auto w-full">
                <div className="grid lg:grid-cols-2 gap-20 items-start">
                    {/* Left - Sticky title */}
                    <div className="lg:sticky lg:top-32 lg:self-start">
                        <FadeIn>
                            <p className="text-cyan-400 text-sm font-medium uppercase tracking-wider mb-4">Security & Privacy</p>
                            <h2 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
                                Enterprise-grade protection for your data
                            </h2>
                            <p className="text-white/60 text-lg mb-8">
                                Your documents and conversations are protected with industry-leading security. We never train on your data.
                            </p>

                            {/* Compliance badges */}
                            <div className="flex flex-wrap gap-3 mb-8">
                                {certifications.map((cert, i) => (
                                    <div key={i} className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm font-medium flex items-center gap-2">
                                        <Check className="w-4 h-4 text-cyan-400" />
                                        {cert}
                                    </div>
                                ))}
                            </div>

                            <Link href="/login" className="inline-flex items-center gap-2 text-cyan-400 font-medium hover:text-cyan-300 transition-colors">
                                Read our security whitepaper <ArrowRight className="w-4 h-4" />
                            </Link>
                        </FadeIn>
                    </div>

                    {/* Right - Security features */}
                    <div className="space-y-5">
                        {features.map((item, i) => (
                            <FadeIn key={i} delay={i * 80}>
                                <div className="flex gap-5 p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 transition-all group cursor-default">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-500/10 transition-colors">
                                        <item.icon className="w-6 h-6 text-white/60 group-hover:text-cyan-400 transition-colors" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1 group-hover:text-cyan-400 transition-colors">{item.title}</h3>
                                        <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
