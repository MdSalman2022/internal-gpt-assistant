import Link from 'next/link';
import { Brain, ArrowLeft, Book, Code, Zap, FileText, ArrowRight } from 'lucide-react';

export const metadata = {
    title: 'Documentation | InsightAI',
    description: 'Comprehensive documentation for InsightAI document intelligence platform.',
};

export default function DocsPage() {
    const sections = [
        {
            icon: Zap,
            title: 'Quick Start',
            description: 'Get up and running with InsightAI in 5 minutes.',
            href: '#'
        },
        {
            icon: Book,
            title: 'User Guide',
            description: 'Learn how to use all features of the platform.',
            href: '#'
        },
        {
            icon: Code,
            title: 'API Reference',
            description: 'Integrate InsightAI with your applications.',
            href: '#'
        },
        {
            icon: FileText,
            title: 'Best Practices',
            description: 'Tips for getting the most out of your documents.',
            href: '#'
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
                    <h1 className="text-5xl font-bold text-zinc-900 mb-6">Documentation</h1>
                    <p className="text-xl text-zinc-600 max-w-2xl mx-auto">
                        Everything you need to know to get started with InsightAI and make the most of your document intelligence.
                    </p>
                </div>
            </section>

            {/* Categories */}
            <section className="py-16 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="grid sm:grid-cols-2 gap-6">
                        {sections.map((section, i) => (
                            <Link
                                key={i}
                                href={section.href}
                                className="group p-6 bg-white border border-zinc-100 rounded-2xl hover:shadow-lg hover:border-zinc-200 transition-all"
                            >
                                <div className="w-12 h-12 bg-cyan-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-cyan-100 transition-colors">
                                    <section.icon className="w-6 h-6 text-cyan-600" />
                                </div>
                                <h3 className="text-xl font-semibold text-zinc-900 mb-2">{section.title}</h3>
                                <p className="text-zinc-600 mb-4">{section.description}</p>
                                <span className="inline-flex items-center gap-2 text-cyan-600 font-medium group-hover:gap-3 transition-all">
                                    Learn more <ArrowRight className="w-4 h-4" />
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Coming Soon Banner */}
            <section className="py-12 px-6 bg-zinc-900">
                <div className="max-w-2xl mx-auto text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Full Documentation Coming Soon</h2>
                    <p className="text-zinc-400 mb-6">
                        We're working on comprehensive documentation. In the meantime, reach out to our support team for any questions.
                    </p>
                    <Link
                        href="/contact?type=support"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-400 text-black font-semibold rounded-xl hover:bg-cyan-300 transition-all"
                    >
                        Contact Support
                    </Link>
                </div>
            </section>
        </div>
    );
}
