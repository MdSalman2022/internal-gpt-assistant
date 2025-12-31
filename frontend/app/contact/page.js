'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Sparkles, Send, ArrowLeft, Mail, User, MessageSquare, CheckCircle2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ContactPage() {
    const searchParams = useSearchParams();
    const typeParam = searchParams.get('type') || 'general';

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: '',
        type: typeParam
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // Type configurations
    const typeConfig = {
        demo: {
            title: 'Schedule a Demo',
            subtitle: 'See InsightAI in action with a personalized walkthrough',
            placeholder: 'Tell us about your use case, team size, and what you\'d like to see in the demo...'
        },
        sales: {
            title: 'Contact Sales',
            subtitle: 'Get custom pricing for your enterprise needs',
            placeholder: 'Tell us about your organization, requirements, and any questions you have...'
        },
        enterprise: {
            title: 'Enterprise Inquiry',
            subtitle: 'Learn about our enterprise features and custom solutions',
            placeholder: 'Tell us about your enterprise requirements, compliance needs, and expected scale...'
        },
        support: {
            title: 'Get Support',
            subtitle: 'Our team is here to help you succeed',
            placeholder: 'Describe the issue you\'re experiencing or the help you need...'
        },
        general: {
            title: 'Contact Us',
            subtitle: 'We\'d love to hear from you',
            placeholder: 'How can we help you today?'
        }
    };

    const config = typeConfig[formData.type] || typeConfig.general;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/contact/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send message');
            }

            setSuccess(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-white flex items-center justify-center p-6">
                <div className="max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-zinc-900 mb-4">Message Sent!</h1>
                    <p className="text-zinc-600 mb-8">
                        Thank you for reaching out. We'll get back to you within 24 hours.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Link
                            href="/"
                            className="px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-zinc-800 transition-all"
                        >
                            Back to Home
                        </Link>
                        <button
                            onClick={() => {
                                setSuccess(false);
                                setFormData({ ...formData, message: '' });
                            }}
                            className="px-6 py-3 border border-zinc-200 rounded-xl font-medium hover:bg-zinc-50 transition-all text-zinc-900"
                        >
                            Send Another
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-white">
            {/* Header */}
            <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Sparkles className="w-5 h-5 text-white" />
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

            <div className="max-w-2xl mx-auto px-6 py-16">
                {/* Title */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-zinc-900 mb-4">{config.title}</h1>
                    <p className="text-xl text-zinc-600">{config.subtitle}</p>
                </div>

                {/* Type Selector */}
                <div className="flex flex-wrap gap-2 justify-center mb-10">
                    {Object.entries(typeConfig).map(([key, value]) => (
                        <button
                            key={key}
                            onClick={() => setFormData({ ...formData, type: key })}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${formData.type === key
                                    ? 'bg-black text-white'
                                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                                }`}
                        >
                            {value.title}
                        </button>
                    ))}
                </div>

                {/* Form */}
                <div className="bg-white rounded-2xl shadow-xl shadow-zinc-200/50 border border-zinc-100 p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-900 mb-2">
                                Your Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="John Doe"
                                    required
                                    className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-900 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="you@company.com"
                                    required
                                    className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Message */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-900 mb-2">
                                Message
                            </label>
                            <div className="relative">
                                <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-zinc-400" />
                                <textarea
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    placeholder={config.placeholder}
                                    required
                                    rows={5}
                                    className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all resize-none"
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-black text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    Send Message
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Alternative Actions */}
                <div className="mt-8 text-center text-zinc-600">
                    <p>
                        Want to try it yourself?{' '}
                        <Link href="/signup" className="text-black font-semibold hover:underline">
                            Start a free trial
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
