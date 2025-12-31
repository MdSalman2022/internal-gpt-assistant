import Link from 'next/link';
import { Brain, ArrowLeft } from 'lucide-react';

export const metadata = {
    title: 'Privacy Policy | InsightAI',
    description: 'Learn how InsightAI collects, uses, and protects your personal information.',
};

export default function PrivacyPage() {
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

            {/* Content */}
            <article className="py-16 px-6">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-4xl font-bold text-zinc-900 mb-4">Privacy Policy</h1>
                    <p className="text-zinc-500 mb-12">Last updated: December 31, 2024</p>

                    <div className="prose prose-zinc max-w-none">
                        <h2>1. Introduction</h2>
                        <p>
                            InsightAI ("we", "our", or "us") is committed to protecting your privacy.
                            This Privacy Policy explains how we collect, use, disclose, and safeguard
                            your information when you use our document intelligence platform.
                        </p>

                        <h2>2. Information We Collect</h2>
                        <h3>2.1 Information You Provide</h3>
                        <ul>
                            <li><strong>Account Information:</strong> Name, email address, password, and organization details when you register.</li>
                            <li><strong>Documents:</strong> Files you upload to our platform for processing and analysis.</li>
                            <li><strong>Communications:</strong> Messages you send to us via contact forms, email, or support channels.</li>
                            <li><strong>Payment Information:</strong> Billing details processed securely through our payment provider (Stripe).</li>
                        </ul>

                        <h3>2.2 Information Collected Automatically</h3>
                        <ul>
                            <li><strong>Usage Data:</strong> How you interact with our platform, including queries, features used, and session duration.</li>
                            <li><strong>Device Information:</strong> Browser type, operating system, and device identifiers.</li>
                            <li><strong>Log Data:</strong> IP addresses, access times, and pages viewed.</li>
                        </ul>

                        <h2>3. How We Use Your Information</h2>
                        <p>We use the information we collect to:</p>
                        <ul>
                            <li>Provide, maintain, and improve our services</li>
                            <li>Process and analyze your documents using AI</li>
                            <li>Respond to your inquiries and provide customer support</li>
                            <li>Send you updates, security alerts, and administrative messages</li>
                            <li>Monitor and analyze usage patterns to improve user experience</li>
                            <li>Detect, prevent, and address technical issues and security threats</li>
                        </ul>

                        <h2>4. Data Security</h2>
                        <p>
                            We implement industry-standard security measures to protect your data:
                        </p>
                        <ul>
                            <li>All data is encrypted in transit (TLS 1.3) and at rest (AES-256)</li>
                            <li>Regular security audits and penetration testing</li>
                            <li>Access controls and authentication mechanisms</li>
                            <li>SOC 2 Type II compliance</li>
                        </ul>

                        <h2>5. Data Retention</h2>
                        <p>
                            We retain your personal information for as long as your account is active
                            or as needed to provide you services. Documents are stored according to
                            your organization's retention settings. You can delete your data at any time
                            through your account settings.
                        </p>

                        <h2>6. Third-Party Services</h2>
                        <p>We work with trusted third-party providers:</p>
                        <ul>
                            <li><strong>Stripe:</strong> Payment processing</li>
                            <li><strong>Google Cloud:</strong> AI model hosting (Gemini)</li>
                            <li><strong>Cloudinary:</strong> Document storage</li>
                            <li><strong>MongoDB Atlas:</strong> Database hosting</li>
                        </ul>

                        <h2>7. Your Rights</h2>
                        <p>You have the right to:</p>
                        <ul>
                            <li>Access your personal information</li>
                            <li>Correct inaccurate data</li>
                            <li>Delete your account and associated data</li>
                            <li>Export your data in a portable format</li>
                            <li>Opt out of marketing communications</li>
                        </ul>

                        <h2>8. Children's Privacy</h2>
                        <p>
                            Our services are not intended for individuals under 18 years of age.
                            We do not knowingly collect personal information from children.
                        </p>

                        <h2>9. Changes to This Policy</h2>
                        <p>
                            We may update this Privacy Policy from time to time. We will notify you
                            of any changes by posting the new policy on this page and updating the
                            "Last updated" date.
                        </p>

                        <h2>10. Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us at:
                        </p>
                        <ul>
                            <li>Email: <a href="mailto:privacy@insightai.com">privacy@insightai.com</a></li>
                            <li>Contact Form: <Link href="/contact">insightai.com/contact</Link></li>
                        </ul>
                    </div>
                </div>
            </article>
        </div>
    );
}
