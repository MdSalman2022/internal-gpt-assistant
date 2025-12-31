import Link from 'next/link';
import { Brain, Shield, Twitter, Linkedin, Github } from 'lucide-react';

export default function Footer() {
    const sections = [
        {
            title: 'Product',
            links: [
                { name: 'Features', href: '/#features' },
                { name: 'Pricing', href: '/#pricing' },
                { name: 'Security', href: '/#security' },
                { name: 'Schedule Demo', href: '/contact?type=demo' },
            ]
        },
        {
            title: 'Company',
            links: [
                { name: 'About', href: '/about' },
                { name: 'Blog', href: '/blog' },
                { name: 'Careers', href: '/careers' },
                { name: 'Contact', href: '/contact' },
            ]
        },
        {
            title: 'Legal',
            links: [
                { name: 'Privacy Policy', href: '/privacy' },
                { name: 'Terms of Service', href: '/terms' },
                { name: 'Cookie Policy', href: '/cookies' },
            ]
        },
    ];

    return (
        <footer className="py-16 px-6 bg-zinc-950 text-white relative overflow-hidden">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="grid md:grid-cols-5 gap-10 mb-12">
                    {/* Brand Section */}
                    <div className="md:col-span-2">
                        <Link href="/" className="flex items-center gap-2.5 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                <Brain className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-semibold text-lg">InsightAI</span>
                        </Link>
                        <p className="text-white/50 text-sm max-w-xs mb-6">
                            Enterprise document intelligence platform. Deploy AI that actually understands your data.
                        </p>
                        {/* Social Links */}
                        <div className="flex items-center gap-4">
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors">
                                <Linkedin className="w-5 h-5" />
                            </a>
                            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors">
                                <Github className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Link Sections */}
                    {sections.map((section, i) => (
                        <div key={i}>
                            <h4 className="font-semibold mb-4 text-white/80">{section.title}</h4>
                            <ul className="space-y-2 text-sm text-white/50">
                                {section.links.map((link, j) => (
                                    <li key={j}>
                                        <Link href={link.href} className="hover:text-white transition-colors">
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-white/40 text-sm">© {new Date().getFullYear()} InsightAI. All rights reserved.</p>
                    <div className="flex items-center gap-4 text-sm text-white/50">
                        <span className="flex items-center gap-1.5">
                            <Shield className="w-4 h-4 text-cyan-400" />
                            SOC 2 Certified
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
