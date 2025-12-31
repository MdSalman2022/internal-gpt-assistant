'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Brain, ArrowRight } from 'lucide-react';

export default function Header() {
    const [scrolled, setScrolled] = useState(false);
    const [activeSection, setActiveSection] = useState('');

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll, { passive: true });

        // Active Section detection
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.target.id) {
                    setActiveSection(entry.target.id);
                }
            });
        }, {
            threshold: 0,
            rootMargin: '-100px 0px -50% 0px'
        });

        const sections = document.querySelectorAll('section');
        sections.forEach(section => observer.observe(section));

        return () => {
            window.removeEventListener('scroll', handleScroll);
            sections.forEach(section => observer.unobserve(section));
        };
    }, []);

    const navItems = ['Platform', 'Features', 'Security', 'Pricing'];

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
            ? 'bg-white/95 backdrop-blur-xl border-b border-zinc-200'
            : 'bg-transparent'
            }`}>
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
                        <Brain className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-semibold text-lg text-zinc-900">InsightAI</span>
                </Link>

                <div className="hidden lg:flex items-center gap-8 text-sm">
                    {navItems.map((item) => {
                        const isActive = activeSection === item.toLowerCase();
                        return (
                            <a
                                key={item}
                                href={`#${item.toLowerCase()}`}
                                className={`transition-colors ${isActive
                                    ? 'text-cyan-600 font-medium'
                                    : 'text-zinc-500 hover:text-black'
                                    }`}
                            >
                                {item}
                            </a>
                        );
                    })}
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/login"
                        className="hidden sm:block px-4 py-2 text-sm text-zinc-600 hover:text-black font-medium transition-colors"
                    >
                        Login
                    </Link>
                    <Link
                        href="/signup?plan=trial"
                        className="group px-5 py-2.5 text-sm bg-black text-white font-medium rounded-full hover:bg-zinc-800 transition-all flex items-center gap-2"
                    >
                        Get Started
                        <span className="w-5 h-5 rounded-full bg-cyan-400 flex items-center justify-center">
                            <ArrowRight className="w-3 h-3 text-black" />
                        </span>
                    </Link>
                </div>
            </div>
        </nav>
    );
}
