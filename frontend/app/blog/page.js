import Link from 'next/link';
import { Brain, ArrowLeft, Calendar, Clock, ArrowRight } from 'lucide-react';

export const metadata = {
    title: 'Blog | InsightAI',
    description: 'Insights, tutorials, and updates from the InsightAI team on AI, document intelligence, and RAG systems.',
};

// Blog posts data - used for listing and navigation
// TODO: Replace image URLs with your actual images
export const blogPosts = [
    {
        slug: 'understanding-rag-enterprise-guide',
        title: 'Understanding RAG: A Practical Guide for Enterprise',
        excerpt: 'Retrieval-Augmented Generation is revolutionizing how enterprises interact with their knowledge bases. Here\'s what you need to know to implement it successfully.',
        date: 'Dec 28, 2024',
        readTime: '8 min read',
        category: 'Technical',
        coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop',
    },
    {
        slug: 'reducing-ai-hallucinations',
        title: 'How We Reduced AI Hallucinations by 90%',
        excerpt: 'Our journey to building more reliable AI responses through better retrieval, prompt engineering, and guardrails.',
        date: 'Dec 20, 2024',
        readTime: '6 min read',
        category: 'Engineering',
        coverImage: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&h=400&fit=crop',
    },
    {
        slug: 'future-of-document-intelligence',
        title: 'The Future of Document Intelligence',
        excerpt: 'From keyword search to semantic understanding—how AI is transforming the way organizations access information.',
        date: 'Dec 15, 2024',
        readTime: '5 min read',
        category: 'Industry',
        coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=400&fit=crop',
    },
    {
        slug: 'security-best-practices-ai-applications',
        title: 'Security Best Practices for AI-Powered Applications',
        excerpt: 'Building trust through security: our approach to data protection, access control, and compliance.',
        date: 'Dec 10, 2024',
        readTime: '7 min read',
        category: 'Security',
        coverImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&h=400&fit=crop',
    },
];

export default function BlogPage() {
    const categories = ['All', 'Technical', 'Engineering', 'Industry', 'Security'];

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
            <section className="py-16 px-6 bg-gradient-to-b from-zinc-50 to-white">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-5xl font-bold text-zinc-900 mb-6">Blog</h1>
                    <p className="text-xl text-zinc-600">
                        Insights, tutorials, and updates from our team on AI, document intelligence, and building great products.
                    </p>
                </div>
            </section>

            {/* Categories */}
            <section className="px-6 border-b">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-wrap gap-2 py-4">
                        {categories.map((category, i) => (
                            <button
                                key={i}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${i === 0
                                    ? 'bg-black text-white'
                                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Posts */}
            <section className="py-16 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-8">
                        {blogPosts.map((post, i) => (
                            <article
                                key={i}
                                className="group bg-white border border-zinc-100 rounded-2xl overflow-hidden hover:shadow-lg hover:border-zinc-200 transition-all"
                            >
                                {/* Cover Image */}
                                {post.coverImage && (
                                    <Link href={`/blog/${post.slug}`}>
                                        <div className="aspect-video overflow-hidden">
                                            <img
                                                src={post.coverImage}
                                                alt={post.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                    </Link>
                                )}
                                <div className="p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="px-3 py-1 bg-cyan-50 text-cyan-700 text-xs font-medium rounded-full">
                                            {post.category}
                                        </span>
                                        <span className="flex items-center gap-1 text-zinc-400 text-sm">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {post.date}
                                        </span>
                                        <span className="flex items-center gap-1 text-zinc-400 text-sm">
                                            <Clock className="w-3.5 h-3.5" />
                                            {post.readTime}
                                        </span>
                                    </div>
                                    <h2 className="text-xl font-semibold text-zinc-900 mb-3 group-hover:text-cyan-600 transition-colors">
                                        {post.title}
                                    </h2>
                                    <p className="text-zinc-600 mb-4 line-clamp-2">{post.excerpt}</p>
                                    <Link
                                        href={`/blog/${post.slug}`}
                                        className="inline-flex items-center gap-2 text-cyan-600 font-medium hover:gap-3 transition-all"
                                    >
                                        Read More <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* Newsletter CTA */}
            <section className="py-16 px-6 bg-zinc-900">
                <div className="max-w-2xl mx-auto text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Stay Updated</h2>
                    <p className="text-zinc-400 mb-8">
                        Get the latest insights on AI and document intelligence delivered to your inbox.
                    </p>
                    <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:bg-white/20 focus:border-white/40 outline-none transition-all"
                        />
                        <button
                            type="submit"
                            className="px-6 py-3 bg-cyan-400 text-black font-semibold rounded-xl hover:bg-cyan-300 transition-all"
                        >
                            Subscribe
                        </button>
                    </form>
                </div>
            </section>
        </div>
    );
}
