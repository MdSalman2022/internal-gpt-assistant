import Link from 'next/link';
import { ArrowRight, Users, Database, BarChart3, Shield, Workflow, Share2 } from 'lucide-react';
import FadeIn from './FadeIn';

export default function Platform() {
    const features = [
        { icon: Users, title: 'Team Management', desc: 'Invite members, assign roles, create departments. Control who can access what with granular permissions.' },
        { icon: Database, title: 'Knowledge Base Organization', desc: 'Create multiple knowledge bases for different teams or projects. Set visibility and access rules per collection.' },
        { icon: BarChart3, title: 'Usage Analytics', desc: 'Track queries, popular documents, and user activity. Measure ROI and identify knowledge gaps across your organization.' },
        { icon: Shield, title: 'Compliance & Audit Logs', desc: 'Complete audit trail of all activities. Export logs for compliance. Meet regulatory requirements with confidence.' },
        { icon: Workflow, title: 'Custom Workflows', desc: 'Set up approval workflows for sensitive queries. Route questions to subject matter experts automatically.' },
        { icon: Share2, title: 'SSO & Directory Sync', desc: 'Connect with Okta, Azure AD, Google Workspace. Auto-provision users and sync groups from your identity provider.' },
    ];

    return (
        <section id="platform" className="min-h-[90vh] py-40 px-6 bg-black text-white flex items-center" data-theme="dark">
            <div className="max-w-7xl mx-auto w-full">
                <div className="grid lg:grid-cols-2 gap-20 items-start">
                    {/* Left - Sticky title */}
                    <div className="lg:sticky lg:top-32 lg:self-start">
                        <FadeIn>
                            <p className="text-cyan-400 text-sm font-medium uppercase tracking-wider mb-4">Enterprise Platform</p>
                            <h2 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
                                Built for admins who need control
                            </h2>
                            <p className="text-white/60 text-lg mb-8">
                                Manage teams, control access, monitor usage, and ensure compliance — all from one powerful dashboard.
                            </p>
                            <Link href="/login" className="inline-flex items-center gap-2 text-cyan-400 font-medium hover:text-cyan-300 transition-colors">
                                See admin features <ArrowRight className="w-4 h-4" />
                            </Link>
                        </FadeIn>
                    </div>

                    {/* Right - Admin features */}
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
