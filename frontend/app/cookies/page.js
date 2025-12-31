import Link from 'next/link';
import { Brain, ArrowLeft } from 'lucide-react';

export const metadata = {
    title: 'Cookie Policy | InsightAI',
    description: 'Learn how InsightAI uses cookies and similar technologies.',
};

export default function CookiesPage() {
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
                    <h1 className="text-4xl font-bold text-zinc-900 mb-4">Cookie Policy</h1>
                    <p className="text-zinc-500 mb-12">Last updated: December 31, 2024</p>

                    <div className="prose prose-zinc max-w-none">
                        <h2>1. What Are Cookies?</h2>
                        <p>
                            Cookies are small text files that are stored on your device when you visit
                            a website. They are widely used to make websites work more efficiently,
                            provide information to website owners, and enhance user experience.
                        </p>

                        <h2>2. How We Use Cookies</h2>
                        <p>InsightAI uses cookies for the following purposes:</p>

                        <h3>2.1 Essential Cookies</h3>
                        <p>
                            These cookies are necessary for the website to function properly. They enable
                            core functionality such as security, account authentication, and session
                            management. You cannot opt out of these cookies.
                        </p>
                        <table>
                            <thead>
                                <tr>
                                    <th>Cookie</th>
                                    <th>Purpose</th>
                                    <th>Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>session_id</td>
                                    <td>Maintains your login session</td>
                                    <td>7 days</td>
                                </tr>
                                <tr>
                                    <td>csrf_token</td>
                                    <td>Protects against cross-site request forgery</td>
                                    <td>Session</td>
                                </tr>
                            </tbody>
                        </table>

                        <h3>2.2 Functional Cookies</h3>
                        <p>
                            These cookies enable enhanced functionality and personalization, such as
                            remembering your preferences and settings.
                        </p>
                        <table>
                            <thead>
                                <tr>
                                    <th>Cookie</th>
                                    <th>Purpose</th>
                                    <th>Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>theme</td>
                                    <td>Remembers your dark/light mode preference</td>
                                    <td>1 year</td>
                                </tr>
                                <tr>
                                    <td>sidebar_collapsed</td>
                                    <td>Remembers sidebar state</td>
                                    <td>1 year</td>
                                </tr>
                            </tbody>
                        </table>

                        <h3>2.3 Analytics Cookies</h3>
                        <p>
                            These cookies help us understand how visitors interact with our website by
                            collecting and reporting information anonymously. This helps us improve
                            our services.
                        </p>
                        <table>
                            <thead>
                                <tr>
                                    <th>Cookie</th>
                                    <th>Purpose</th>
                                    <th>Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>_ga</td>
                                    <td>Google Analytics - Distinguishes users</td>
                                    <td>2 years</td>
                                </tr>
                                <tr>
                                    <td>_gid</td>
                                    <td>Google Analytics - Distinguishes users</td>
                                    <td>24 hours</td>
                                </tr>
                            </tbody>
                        </table>

                        <h2>3. Third-Party Cookies</h2>
                        <p>
                            Some cookies are placed by third-party services that appear on our pages:
                        </p>
                        <ul>
                            <li><strong>Stripe:</strong> Payment processing and fraud detection</li>
                            <li><strong>Google:</strong> Analytics and AI services</li>
                            <li><strong>Intercom:</strong> Customer support chat (if enabled)</li>
                        </ul>

                        <h2>4. Managing Cookies</h2>
                        <p>
                            Most web browsers allow you to control cookies through their settings.
                            You can typically:
                        </p>
                        <ul>
                            <li>View what cookies are stored and delete them individually</li>
                            <li>Block third-party cookies</li>
                            <li>Block cookies from specific sites</li>
                            <li>Block all cookies</li>
                            <li>Delete all cookies when you close your browser</li>
                        </ul>
                        <p>
                            <strong>Note:</strong> If you disable essential cookies, some features of
                            our website may not function properly.
                        </p>

                        <h3>Browser-Specific Instructions:</h3>
                        <ul>
                            <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
                            <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
                            <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a></li>
                            <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
                        </ul>

                        <h2>5. Do Not Track</h2>
                        <p>
                            Some browsers have a "Do Not Track" feature that signals to websites that
                            you do not want your online activity tracked. We currently respond to DNT
                            signals by disabling non-essential analytics cookies.
                        </p>

                        <h2>6. Updates to This Policy</h2>
                        <p>
                            We may update this Cookie Policy from time to time. We will notify you of
                            any changes by posting the new policy on this page and updating the "Last
                            updated" date.
                        </p>

                        <h2>7. Contact Us</h2>
                        <p>
                            If you have any questions about our use of cookies, please contact us:
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
