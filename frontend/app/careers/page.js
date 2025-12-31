import Link from 'next/link';
import { Brain, ArrowLeft, MapPin, Briefcase, Clock, ArrowRight, Heart } from 'lucide-react';

export const metadata = {
    title: 'Careers | InsightAI',
    description: 'Join the InsightAI team and help build the future of document intelligence.',
};

export default function CareersPage() {
    const openings = [
        {
            title: 'Senior Full Stack Engineer',
            department: 'Engineering',
            location: 'Remote (US/EU)',
            type: 'Full-time',
            description: 'Build and scale our core platform using Node.js, React, and MongoDB.'
        },
        {
            title: 'Machine Learning Engineer',
            department: 'AI/ML',
            location: 'Remote',
            type: 'Full-time',
            description: 'Improve our RAG pipeline, embeddings, and model serving infrastructure.'
        },
        {
            title: 'Product Designer',
            department: 'Design',
            location: 'Remote (US)',
            type: 'Full-time',
            description: 'Shape the user experience of our document intelligence platform.'
        },
        {
            title: 'Developer Advocate',
            department: 'Marketing',
            location: 'Remote',
            type: 'Full-time',
            description: 'Help developers understand and integrate InsightAI into their workflows.'
        },
    ];

    const perks = [
        'Competitive salary + equity',
        'Fully remote, async-first culture',
        'Unlimited PTO',
        'Health, dental, and vision insurance',
        '$1,500/year learning budget',
        'Latest MacBook Pro or equivalent',
        'Annual team retreats',
        'Flexible working hours'
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
                        Join Our Team
                    </h1>
                    <p className="text-xl text-zinc-600 leading-relaxed max-w-2xl mx-auto">
                        We're building the future of document intelligence. Join a team of passionate
                        engineers, designers, and thinkers who love solving hard problems.
                    </p>
                </div>
            </section>

            {/* Why Join Us */}
            <section className="py-16 px-6">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-zinc-900 mb-8 text-center">Why InsightAI?</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {perks.map((perk, i) => (
                            <div key={i} className="flex items-center gap-3 p-4 bg-zinc-50 rounded-xl">
                                <Heart className="w-5 h-5 text-cyan-600 flex-shrink-0" />
                                <span className="text-zinc-700">{perk}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Open Positions */}
            <section className="py-16 px-6 bg-zinc-50">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-zinc-900 mb-8 text-center">Open Positions</h2>
                    <div className="space-y-4">
                        {openings.map((job, i) => (
                            <div
                                key={i}
                                className="bg-white border border-zinc-100 rounded-2xl p-6 hover:shadow-lg hover:border-zinc-200 transition-all"
                            >
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div>
                                        <h3 className="text-xl font-semibold text-zinc-900 mb-2">{job.title}</h3>
                                        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500">
                                            <span className="flex items-center gap-1">
                                                <Briefcase className="w-4 h-4" />
                                                {job.department}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4" />
                                                {job.location}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {job.type}
                                            </span>
                                        </div>
                                        <p className="text-zinc-600 mt-3">{job.description}</p>
                                    </div>
                                    <Link
                                        href={`/contact?type=general&subject=Application: ${job.title}`}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-medium rounded-xl hover:bg-zinc-800 transition-all whitespace-nowrap"
                                    >
                                        Apply Now <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* No Match CTA */}
            <section className="py-16 px-6">
                <div className="max-w-2xl mx-auto text-center">
                    <h2 className="text-2xl font-bold text-zinc-900 mb-4">Don't see a perfect fit?</h2>
                    <p className="text-zinc-600 mb-8">
                        We're always looking for talented people. Send us your resume and tell us how you can contribute.
                    </p>
                    <Link
                        href="/contact?type=general"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-zinc-100 text-zinc-900 font-medium rounded-full hover:bg-zinc-200 transition-all"
                    >
                        Get in Touch
                    </Link>
                </div>
            </section>
        </div>
    );
}
