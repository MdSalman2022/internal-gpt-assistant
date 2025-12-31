import Link from 'next/link';
import { Brain, ArrowLeft, Calendar, Clock, User, ChevronLeft, ChevronRight } from 'lucide-react';
import ShareButtons from './ShareButtons';

/**
 * BlogLayout - Industry standard blog post layout
 * Features:
 * - Optimal reading width (65-75 characters per line)
 * - Clear typography hierarchy
 * - Cover image with social sharing support
 * - Share buttons (client component)
 * - Author info
 * - Related posts navigation
 */
export default function BlogLayout({
    title,
    excerpt,
    date,
    readTime,
    author = { name: 'InsightAI Team', role: 'Engineering' },
    category,
    coverImage,
    children,
    previousPost,
    nextPost,
}) {
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
                        href="/blog"
                        className="flex items-center gap-2 text-zinc-600 hover:text-black transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        All Posts
                    </Link>
                </div>
            </header>

            {/* Article */}
            <article className="py-12 lg:py-20">
                {/* Hero Section */}
                <header className="max-w-3xl mx-auto px-6 mb-12">
                    {/* Category */}
                    {category && (
                        <div className="mb-4">
                            <span className="px-3 py-1 bg-cyan-50 text-cyan-700 text-sm font-medium rounded-full">
                                {category}
                            </span>
                        </div>
                    )}

                    {/* Title */}
                    <h1 className="text-4xl lg:text-5xl font-bold text-zinc-900 leading-tight mb-6">
                        {title}
                    </h1>

                    {/* Excerpt */}
                    <p className="text-xl text-zinc-600 leading-relaxed mb-8">
                        {excerpt}
                    </p>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-500 pb-8 border-b">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-zinc-600" />
                            </div>
                            <div>
                                <p className="font-medium text-zinc-900">{author.name}</p>
                                <p className="text-zinc-500">{author.role}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                {date}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                {readTime}
                            </span>
                        </div>
                    </div>

                    {/* Cover Image */}
                    {coverImage && (
                        <div className="mt-8">
                            <img
                                src={coverImage}
                                alt={title}
                                className="w-full h-auto rounded-2xl shadow-lg object-cover aspect-video"
                            />
                        </div>
                    )}
                </header>

                {/* Content */}
                <div className="max-w-3xl mx-auto px-6">
                    {/* Prose styling for optimal readability */}
                    <div className="prose prose-lg prose-zinc max-w-none
                        prose-headings:font-bold prose-headings:text-zinc-900
                        prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6
                        prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
                        prose-p:text-zinc-600 prose-p:leading-relaxed prose-p:mb-6
                        prose-li:text-zinc-600
                        prose-strong:text-zinc-900 prose-strong:font-semibold
                        prose-a:text-cyan-600 prose-a:no-underline hover:prose-a:underline
                        prose-blockquote:border-l-4 prose-blockquote:border-cyan-500 prose-blockquote:bg-zinc-50 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:not-italic prose-blockquote:text-zinc-700
                        prose-code:bg-zinc-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
                        prose-pre:bg-zinc-900 prose-pre:text-zinc-100 prose-pre:rounded-xl prose-pre:overflow-x-auto
                        prose-img:rounded-xl prose-img:shadow-lg
                    ">
                        {children}
                    </div>

                    {/* Share Buttons - Client Component */}
                    <ShareButtons title={title} />

                    {/* Navigation */}
                    <nav className="mt-12 pt-8 border-t grid grid-cols-2 gap-4">
                        {previousPost ? (
                            <Link
                                href={previousPost.href}
                                className="group p-4 border rounded-xl hover:border-zinc-300 transition-colors"
                            >
                                <span className="flex items-center gap-1 text-sm text-zinc-500 mb-2">
                                    <ChevronLeft className="w-4 h-4" />
                                    Previous
                                </span>
                                <span className="font-medium text-zinc-900 group-hover:text-cyan-600 transition-colors line-clamp-2">
                                    {previousPost.title}
                                </span>
                            </Link>
                        ) : <div />}
                        {nextPost ? (
                            <Link
                                href={nextPost.href}
                                className="group p-4 border rounded-xl hover:border-zinc-300 transition-colors text-right"
                            >
                                <span className="flex items-center justify-end gap-1 text-sm text-zinc-500 mb-2">
                                    Next
                                    <ChevronRight className="w-4 h-4" />
                                </span>
                                <span className="font-medium text-zinc-900 group-hover:text-cyan-600 transition-colors line-clamp-2">
                                    {nextPost.title}
                                </span>
                            </Link>
                        ) : <div />}
                    </nav>
                </div>
            </article>

            {/* CTA Section */}
            <section className="py-16 px-6 bg-zinc-900">
                <div className="max-w-2xl mx-auto text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Ready to try InsightAI?</h2>
                    <p className="text-zinc-400 mb-8">
                        Transform your documents into intelligent, queryable knowledge.
                    </p>
                    <Link
                        href="/signup?plan=trial"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-cyan-400 text-black font-semibold rounded-full hover:bg-cyan-300 transition-all"
                    >
                        Start Free Trial
                    </Link>
                </div>
            </section>
        </div>
    );
}
