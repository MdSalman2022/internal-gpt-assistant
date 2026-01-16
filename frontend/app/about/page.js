import Link from 'next/link';
import { Brain, ArrowLeft, Users, Target, Lightbulb, Heart } from 'lucide-react';

export const metadata = {
    title: 'About Us | InsightAI',
    description: 'Learn about InsightAI - the team building the future of enterprise document intelligence.',
};

export default function AboutPage() {
    const values = [
        {
            icon: Target,
            title: 'Mission-Driven',
            description: 'We believe every organization deserves access to intelligent document understanding, not just the tech giants.'
        },
        {
            icon: Lightbulb,
            title: 'Innovation First',
            description: 'We push the boundaries of what\'s possible with AI, while keeping solutions practical and production-ready.'
        },
        {
            icon: Users,
            title: 'Customer Obsessed',
            description: 'Your success is our success. We build what you need, not what\'s trendy.'
        },
        {
            icon: Heart,
            title: 'Transparency',
            description: 'Open communication, honest pricing, and clear documentation. No surprises, ever.'
        },
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="border-b bg-white sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Brain className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-zinc-900">InsightAI</span>
                    </Link>
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-zinc-600 hover:text-black transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                </div>
            </header>

            {/* Hero */}
            <section className="py-20 px-6 bg-gradient-to-b from-zinc-50 to-white">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-5xl font-bold text-zinc-900 mb-6">
                        Building the Future of<br />
                        <span className="text-cyan-600">Document Intelligence</span>
                    </h1>
                    <p className="text-xl text-zinc-600 leading-relaxed">
                        InsightAI was founded with a simple belief: every organization should be able
                        to unlock the knowledge trapped in their documents using AI, without needing
                        a team of ML engineers.
                    </p>
                </div>
            </section>

            {/* Story */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-zinc-900 mb-8">Our Story</h2>
                    <div className="prose prose-lg prose-zinc max-w-none">
                        <p className="text-zinc-600 leading-relaxed mb-6">
                            We started InsightAI after experiencing firsthand the frustration of searching
                            through thousands of documents to find critical information. As engineers at
                            large enterprises, we saw how much time was wasted and how many insights were
                            missed because the right information wasn't accessible when it was needed.
                        </p>
                        <p className="text-zinc-600 leading-relaxed mb-6">
                            The advent of large language models opened new possibilities, but deploying
                            them in production—with proper security, accuracy, and scale—remained a
                            massive undertaking. We built InsightAI to bridge that gap.
                        </p>
                        <p className="text-zinc-600 leading-relaxed">
                            Today, we're proud to serve organizations of all sizes, from startups to
                            Fortune 500 companies, helping them transform their static documents into
                            active, queryable intelligence.
                        </p>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-20 px-6 bg-zinc-50">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-zinc-900 mb-12 text-center">Our Values</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {values.map((value, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl border border-zinc-100">
                                <div className="w-12 h-12 bg-cyan-50 rounded-xl flex items-center justify-center mb-4">
                                    <value.icon className="w-6 h-6 text-cyan-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-zinc-900 mb-2">{value.title}</h3>
                                <p className="text-zinc-600 text-sm">{value.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold text-zinc-900 mb-6">Join Us on This Journey</h2>
                    <p className="text-lg text-zinc-600 mb-8">
                        Whether you're looking to use InsightAI or join our team, we'd love to hear from you.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/signup?plan=trial"
                            className="px-8 py-4 bg-black text-white font-medium rounded-full hover:bg-zinc-800 transition-all"
                        >
                            Start Free Trial
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
