import Link from 'next/link';
import { Brain, ArrowLeft } from 'lucide-react';

export const metadata = {
    title: 'Terms of Service | InsightAI',
    description: 'Terms and conditions for using InsightAI document intelligence platform.',
};

export default function TermsPage() {
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
                    <h1 className="text-4xl font-bold text-zinc-900 mb-4">Terms of Service</h1>
                    <p className="text-zinc-500 mb-12">Last updated: December 31, 2024</p>

                    <div className="prose prose-zinc max-w-none">
                        <h2>1. Acceptance of Terms</h2>
                        <p>
                            By accessing or using InsightAI ("Service"), you agree to be bound by these
                            Terms of Service ("Terms"). If you disagree with any part of these terms,
                            you may not access the Service.
                        </p>

                        <h2>2. Description of Service</h2>
                        <p>
                            InsightAI is a document intelligence platform that allows users to upload,
                            process, and query documents using artificial intelligence. The Service
                            includes features such as document storage, AI-powered search, analytics,
                            and team collaboration tools.
                        </p>

                        <h2>3. User Accounts</h2>
                        <h3>3.1 Registration</h3>
                        <p>
                            To use certain features of the Service, you must register for an account.
                            You agree to provide accurate, current, and complete information during
                            registration and to update such information as necessary.
                        </p>

                        <h3>3.2 Account Security</h3>
                        <p>
                            You are responsible for safeguarding your password and for all activities
                            that occur under your account. You agree to notify us immediately of any
                            unauthorized use of your account.
                        </p>

                        <h2>4. Acceptable Use</h2>
                        <p>You agree not to:</p>
                        <ul>
                            <li>Use the Service for any illegal purpose or in violation of any laws</li>
                            <li>Upload content that infringes on intellectual property rights</li>
                            <li>Attempt to gain unauthorized access to the Service or its systems</li>
                            <li>Interfere with or disrupt the Service or servers</li>
                            <li>Use the Service to send spam or unsolicited communications</li>
                            <li>Reverse engineer or attempt to extract source code from the Service</li>
                            <li>Use the Service to process sensitive personal data without proper consent</li>
                        </ul>

                        <h2>5. Content Ownership</h2>
                        <h3>5.1 Your Content</h3>
                        <p>
                            You retain ownership of all documents and content you upload to the Service.
                            By uploading content, you grant us a limited license to process, store, and
                            analyze your content solely for the purpose of providing the Service.
                        </p>

                        <h3>5.2 Our Content</h3>
                        <p>
                            The Service, including its design, features, and underlying technology,
                            is owned by InsightAI and protected by intellectual property laws.
                        </p>

                        <h2>6. Subscriptions and Payment</h2>
                        <h3>6.1 Billing</h3>
                        <p>
                            Paid subscriptions are billed in advance on a monthly or annual basis.
                            You authorize us to charge your payment method for the subscription fees.
                        </p>

                        <h3>6.2 Cancellation</h3>
                        <p>
                            You may cancel your subscription at any time. Upon cancellation, you will
                            retain access until the end of your current billing period. No refunds are
                            provided for partial periods.
                        </p>

                        <h3>6.3 Price Changes</h3>
                        <p>
                            We reserve the right to modify our pricing. We will provide at least 30 days
                            notice before any price changes take effect.
                        </p>

                        <h2>7. Service Availability</h2>
                        <p>
                            We strive to maintain high availability but do not guarantee uninterrupted
                            access to the Service. We may perform maintenance or updates that temporarily
                            affect availability.
                        </p>

                        <h2>8. Limitation of Liability</h2>
                        <p>
                            To the maximum extent permitted by law, InsightAI shall not be liable for
                            any indirect, incidental, special, consequential, or punitive damages, or
                            any loss of profits or revenues, whether incurred directly or indirectly.
                        </p>

                        <h2>9. Disclaimer of Warranties</h2>
                        <p>
                            The Service is provided "as is" and "as available" without warranties of
                            any kind, either express or implied, including but not limited to warranties
                            of merchantability, fitness for a particular purpose, and non-infringement.
                        </p>

                        <h2>10. Indemnification</h2>
                        <p>
                            You agree to indemnify and hold harmless InsightAI and its officers,
                            directors, employees, and agents from any claims, damages, or expenses
                            arising from your use of the Service or violation of these Terms.
                        </p>

                        <h2>11. Termination</h2>
                        <p>
                            We may terminate or suspend your access to the Service immediately, without
                            prior notice, for conduct that we believe violates these Terms or is harmful
                            to other users, us, or third parties, or for any other reason.
                        </p>

                        <h2>12. Changes to Terms</h2>
                        <p>
                            We reserve the right to modify these Terms at any time. We will provide
                            notice of significant changes via email or through the Service. Your
                            continued use of the Service after such changes constitutes acceptance.
                        </p>

                        <h2>13. Governing Law</h2>
                        <p>
                            These Terms shall be governed by and construed in accordance with the laws
                            of the State of Delaware, United States, without regard to its conflict of
                            law provisions.
                        </p>

                        <h2>14. Contact Information</h2>
                        <p>
                            For any questions about these Terms, please contact us at:
                        </p>
                        <ul>
                            <li>Email: <a href="mailto:legal@insightai.com">legal@insightai.com</a></li>
                            <li>Contact Form: <Link href="/contact">insightai.com/contact</Link></li>
                        </ul>
                    </div>
                </div>
            </article>
        </div>
    );
}
