'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowRight, Shield, Lock, Cpu, Globe, Layers,
  Check, Building2, Users, FileSearch, Brain, Workflow,
  BarChart3, MessagesSquare, Fingerprint, Cloud, Server,
  Zap, FileText, Search, Target, Star, Sparkles,
  ChevronDown, Upload, Database, MessageSquare, Calendar,
  Languages, Bot, BookOpen, TrendingUp, ArrowUpRight,
  Mic, Image as ImageIcon, Code, GitBranch, History, Share2
} from 'lucide-react';

// Intersection Observer hook for scroll animations
function useInView(options = {}) {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsInView(true);
    }, { threshold: 0.1, ...options });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, isInView];
}

// Animated wrapper
function FadeIn({ children, className = '', delay = 0 }) {
  const [ref, isInView] = useInView();

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translateY(0)' : 'translateY(30px)',
        transition: `all 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/95 backdrop-blur-xl border-b border-zinc-200' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-lg">InsightAI</span>
          </Link>

          <div className="hidden lg:flex items-center gap-8 text-sm">
            <a href="#platform" className="text-zinc-500 hover:text-black transition-colors">Platform</a>
            <a href="#features" className="text-zinc-500 hover:text-black transition-colors">Features</a>
            <a href="#security" className="text-zinc-500 hover:text-black transition-colors">Security</a>
            <a href="#pricing" className="text-zinc-500 hover:text-black transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block px-4 py-2 text-sm text-zinc-600 hover:text-black font-medium transition-colors">Login</Link>
            <Link href="/login" className="group px-5 py-2.5 text-sm bg-black text-white font-medium rounded-full hover:bg-zinc-800 transition-all flex items-center gap-2">
              Get Started
              <span className="w-5 h-5 rounded-full bg-cyan-400 flex items-center justify-center">
                <ArrowRight className="w-3 h-3 text-black" />
              </span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - White */}
      <section className="relative min-h-[90vh] flex items-center pt-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-12 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-6">
              The intelligent<br />
              knowledge layer<br />
              <span className="text-zinc-400">for modern teams</span>
            </h1>

            <p className="text-lg text-zinc-500 leading-relaxed mb-8 max-w-md">
              Context-aware document intelligence with production-grade RAG infrastructure. Deploy enterprise AI that actually understands your data.
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-8">
              <Link href="/login" className="group inline-flex items-center gap-3 px-6 py-3 bg-black text-white font-medium rounded-full hover:bg-zinc-800 transition-all">
                Start Free Trial
                <span className="w-6 h-6 rounded-full bg-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ArrowRight className="w-3.5 h-3.5 text-black" />
                </span>
              </Link>
              <a href="#platform" className="px-6 py-3 text-zinc-600 font-medium hover:text-black transition-colors flex items-center gap-2">
                See how it works <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-cyan-500" />No credit card</span>
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-cyan-500" />Free 14-day trial</span>
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-cyan-500" />SOC 2 compliant</span>
            </div>
          </div>

          {/* Right - 3D AI Brain Visual */}
          <div className="relative flex items-center justify-center">
            <div className="relative w-full max-w-lg aspect-square">
              {/* 3D AI Brain Neural Network SVG */}
              <svg viewBox="0 0 400 400" className="relative w-full h-full">
                <defs>
                  <linearGradient id="nodeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#0e7490" />
                  </linearGradient>
                </defs>

                {/* Neural network connections */}
                <g stroke="#06b6d4" strokeWidth="1.5" opacity="0.3">
                  <line x1="200" y1="100" x2="120" y2="160" />
                  <line x1="200" y1="100" x2="280" y2="160" />
                  <line x1="120" y1="160" x2="80" y2="240" />
                  <line x1="120" y1="160" x2="160" y2="240" />
                  <line x1="280" y1="160" x2="240" y2="240" />
                  <line x1="280" y1="160" x2="320" y2="240" />
                  <line x1="80" y1="240" x2="120" y2="320" />
                  <line x1="160" y1="240" x2="200" y2="320" />
                  <line x1="240" y1="240" x2="200" y2="320" />
                  <line x1="320" y1="240" x2="280" y2="320" />
                </g>

                {/* Neural nodes */}
                <circle cx="200" cy="100" r="14" fill="url(#nodeGrad)" />
                <circle cx="120" cy="160" r="10" fill="#0891b2" />
                <circle cx="280" cy="160" r="10" fill="#0891b2" />
                <circle cx="80" cy="240" r="8" fill="#06b6d4" opacity="0.7" />
                <circle cx="160" cy="240" r="8" fill="#06b6d4" opacity="0.7" />
                <circle cx="240" cy="240" r="8" fill="#06b6d4" opacity="0.7" />
                <circle cx="320" cy="240" r="8" fill="#06b6d4" opacity="0.7" />
                <circle cx="120" cy="320" r="6" fill="#22d3ee" />
                <circle cx="200" cy="320" r="12" fill="url(#nodeGrad)" />
                <circle cx="280" cy="320" r="6" fill="#22d3ee" />

                {/* Center brain icon */}
                <circle cx="200" cy="200" r="45" fill="white" stroke="#06b6d4" strokeWidth="2" />
                <g transform="translate(175, 175)">
                  <path d="M25 10 C15 10 10 18 10 25 C10 32 15 38 20 40 L20 42 L30 42 L30 40 C35 38 40 32 40 25 C40 18 35 10 25 10 Z" fill="none" stroke="#0891b2" strokeWidth="2" />
                  <circle cx="18" cy="22" r="3" fill="#06b6d4" />
                  <circle cx="32" cy="22" r="3" fill="#06b6d4" />
                  <circle cx="25" cy="30" r="3" fill="#0891b2" />
                </g>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="py-12 px-6 border-y border-zinc-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-6">
            {['TechCorp', 'LegalFirm', 'HealthPlus', 'FinanceHQ', 'EduTech'].map((name) => (
              <div key={name} className="text-zinc-300 font-semibold text-lg hover:text-zinc-500 transition-colors cursor-pointer">{name}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Business Results - Dark section */}
      <section className="min-h-[80vh] py-40 px-6 bg-black text-white flex items-center">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-20 items-start">
            {/* Left - Sticky Title */}
            <div className="lg:sticky lg:top-32 lg:self-start">
              <FadeIn>
                <p className="text-cyan-400 text-sm font-medium uppercase tracking-wider mb-4">Why Teams Choose Us</p>
                <h2 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
                  Built for speed,<br />accuracy, and scale
                </h2>
                <p className="text-white/60 text-lg max-w-md">
                  Join thousands of teams who have transformed their document workflows with our AI-powered platform.
                </p>
              </FadeIn>
            </div>

            {/* Right - Stats */}
            <div className="grid grid-cols-2 gap-6">
              {[
                { stat: '85%', label: 'Faster research' },
                { stat: '10x', label: 'Productivity boost' },
                { stat: '99.2%', label: 'Accuracy rate' },
                { stat: '50+', label: 'File formats' },
              ].map((item, i) => (
                <FadeIn key={i} delay={i * 100}>
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 transition-all cursor-default">
                    <div className="text-4xl lg:text-5xl font-bold mb-2 text-white">{item.stat}</div>
                    <p className="text-white/50">{item.label}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities - White */}
      <section id="use-cases" className="py-32 px-6 bg-white relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[1fr_1.5fr] gap-16 items-start">
            {/* Left - Sticky */}
            <div className="lg:sticky lg:top-32 lg:self-start">
              <FadeIn>
                <p className="text-cyan-600 text-sm font-medium uppercase tracking-wider mb-4">Core Capabilities</p>
                <h2 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight mb-6">
                  Everything you need to unlock your data
                </h2>
                <p className="text-zinc-500 text-lg mb-8">
                  From document upload to AI-powered insights — all in one platform.
                </p>
                <Link href="/login" className="inline-flex items-center gap-2 text-cyan-600 font-medium hover:text-cyan-700 transition-colors">
                  Explore all features <ArrowRight className="w-4 h-4" />
                </Link>
              </FadeIn>
            </div>

            {/* Right - Features grid */}
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                { icon: Upload, title: 'Multi-Format Upload', desc: 'PDF, Word, Excel, PowerPoint, images, and 50+ more formats supported.' },
                { icon: MessageSquare, title: 'Natural Language Chat', desc: 'Ask questions like you would ask a colleague. Context-aware responses.' },
                { icon: BookOpen, title: 'Cited Answers', desc: 'Every response includes source citations for verification.' },
                { icon: Database, title: 'Knowledge Collections', desc: 'Organize documents into team or project-specific collections.' },
                { icon: Calendar, title: 'Calendar Integration', desc: 'Connect Google Calendar and Outlook for scheduling queries.' },
                { icon: Languages, title: '50+ Languages', desc: 'Ask and receive answers in any language you prefer.' },
                { icon: Mic, title: 'Voice Queries', desc: 'Speak your questions naturally with voice input support.' },
                { icon: History, title: 'Query History', desc: 'Access your complete conversation history anytime.' },
              ].map((item, i) => (
                <FadeIn key={i} delay={i * 60}>
                  <div className="group p-6 rounded-2xl border border-zinc-200 hover:border-cyan-300 hover:shadow-lg transition-all bg-white">
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center mb-5 group-hover:bg-cyan-50 transition-colors">
                      <item.icon className="w-6 h-6 text-zinc-700 group-hover:text-cyan-600 transition-colors" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Platform - Dark section */}
      <section id="platform" className="min-h-[90vh] py-40 px-6 bg-black text-white flex items-center">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-20 items-start">
            {/* Left - Sticky title */}
            <div className="lg:sticky lg:top-32 lg:self-start">
              <FadeIn>
                <p className="text-cyan-400 text-sm font-medium uppercase tracking-wider mb-4">Enterprise Platform</p>
                <h2 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
                  Built for admins who need control
                </h2>
                <p className="text-white/60 text-lg mb-8">
                  Manage teams, control access, monitor usage, and ensure compliance — all from one powerful dashboard.
                </p>
                <Link href="/login" className="inline-flex items-center gap-2 text-cyan-400 font-medium hover:text-cyan-300 transition-colors">
                  See admin features <ArrowRight className="w-4 h-4" />
                </Link>
              </FadeIn>
            </div>

            {/* Right - Admin features */}
            <div className="space-y-5">
              {[
                { icon: Users, title: 'Team Management', desc: 'Invite members, assign roles, create departments. Control who can access what with granular permissions.' },
                { icon: Database, title: 'Knowledge Base Organization', desc: 'Create multiple knowledge bases for different teams or projects. Set visibility and access rules per collection.' },
                { icon: BarChart3, title: 'Usage Analytics', desc: 'Track queries, popular documents, and user activity. Measure ROI and identify knowledge gaps across your organization.' },
                { icon: Shield, title: 'Compliance & Audit Logs', desc: 'Complete audit trail of all activities. Export logs for compliance. Meet regulatory requirements with confidence.' },
                { icon: Workflow, title: 'Custom Workflows', desc: 'Set up approval workflows for sensitive queries. Route questions to subject matter experts automatically.' },
                { icon: Share2, title: 'SSO & Directory Sync', desc: 'Connect with Okta, Azure AD, Google Workspace. Auto-provision users and sync groups from your identity provider.' },
              ].map((item, i) => (
                <FadeIn key={i} delay={i * 80}>
                  <div className="flex gap-5 p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 transition-all group cursor-default">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-500/10 transition-colors">
                      <item.icon className="w-6 h-6 text-white/60 group-hover:text-cyan-400 transition-colors" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1 group-hover:text-cyan-400 transition-colors">{item.title}</h3>
                      <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AI Models - White */}
      <section id="features" className="py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left - Sticky */}
            <div className="lg:sticky lg:top-32 lg:self-start">
              <FadeIn>
                <p className="text-cyan-600 text-sm font-medium uppercase tracking-wider mb-4">AI Models</p>
                <h2 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight mb-6">
                  Powered by the best AI models
                </h2>
                <p className="text-zinc-500 text-lg mb-8">
                  Access multiple AI providers through one unified interface. Switch models based on your needs.
                </p>
              </FadeIn>
            </div>

            {/* Right - Model cards */}
            <div className="space-y-4">
              {[
                { name: 'GPT-4o', provider: 'OpenAI', desc: 'Most capable model for complex reasoning and analysis.', tag: 'Recommended' },
                { name: 'Claude 3.5 Sonnet', provider: 'Anthropic', desc: 'Excellent for long-form content and nuanced understanding.' },
                { name: 'Gemini 2.0 Flash', provider: 'Google', desc: 'Fast responses with strong multilingual capabilities.' },
                { name: 'GPT-4o Mini', provider: 'OpenAI', desc: 'Cost-effective for everyday queries and quick tasks.' },
              ].map((model, i) => (
                <FadeIn key={i} delay={i * 100}>
                  <div className="p-6 bg-white rounded-2xl border border-zinc-200 hover:border-cyan-300 hover:shadow-lg transition-all flex items-start justify-between group cursor-default">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{model.name}</h3>
                        {model.tag && <span className="px-2 py-0.5 bg-cyan-100 text-cyan-700 text-xs font-medium rounded">{model.tag}</span>}
                      </div>
                      <p className="text-sm text-zinc-400 mb-1">{model.provider}</p>
                      <p className="text-zinc-500">{model.desc}</p>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-zinc-300 group-hover:text-cyan-500 transition-colors" />
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Security - Dark section */}
      <section id="security" className="min-h-[90vh] py-40 px-6 bg-black text-white flex items-center">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-20 items-start">
            {/* Left - Sticky title */}
            <div className="lg:sticky lg:top-32 lg:self-start">
              <FadeIn>
                <p className="text-cyan-400 text-sm font-medium uppercase tracking-wider mb-4">Security & Privacy</p>
                <h2 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
                  Enterprise-grade protection for your data
                </h2>
                <p className="text-white/60 text-lg mb-8">
                  Your documents and conversations are protected with industry-leading security. We never train on your data.
                </p>

                {/* Compliance badges */}
                <div className="flex flex-wrap gap-3 mb-8">
                  {['SOC 2 Type II', 'GDPR Compliant', 'HIPAA Ready'].map((cert, i) => (
                    <div key={i} className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm font-medium flex items-center gap-2">
                      <Check className="w-4 h-4 text-cyan-400" />
                      {cert}
                    </div>
                  ))}
                </div>

                <Link href="/login" className="inline-flex items-center gap-2 text-cyan-400 font-medium hover:text-cyan-300 transition-colors">
                  Read our security whitepaper <ArrowRight className="w-4 h-4" />
                </Link>
              </FadeIn>
            </div>

            {/* Right - Security features */}
            <div className="space-y-5">
              {[
                { icon: Lock, title: 'AES-256 Encryption', desc: 'All API keys and sensitive data are encrypted using AES-256 with unique initialization vectors. Data encrypted at rest and in transit via TLS 1.3.' },
                { icon: Fingerprint, title: 'OAuth2 Authentication', desc: 'Secure authentication via Google OAuth2, session-based access control, and JWT tokens. Support for enterprise SSO with SAML 2.0.' },
                { icon: Shield, title: 'Role-Based Access Control', desc: 'Granular permissions system with Admin and User roles. Department and team-level access controls for document collections.' },
                { icon: History, title: 'Complete Audit Logging', desc: 'Every action is logged with user ID, timestamp, and IP address. Export audit trails for compliance audits and security reviews.' },
                { icon: Server, title: 'Secure Session Management', desc: 'HTTP-only cookies, secure session tokens, and automatic session expiration. Protection against XSS and CSRF attacks.' },
                { icon: Globe, title: 'Data Residency Options', desc: 'Choose your data storage region. On-premise deployment available for organizations requiring full data sovereignty.' },
              ].map((item, i) => (
                <FadeIn key={i} delay={i * 80}>
                  <div className="flex gap-5 p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 transition-all group cursor-default">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-500/10 transition-colors">
                      <item.icon className="w-6 h-6 text-white/60 group-hover:text-cyan-400 transition-colors" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1 group-hover:text-cyan-400 transition-colors">{item.title}</h3>
                      <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials - White section */}
      <section className="py-32 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left - Sticky */}
            <div className="lg:sticky lg:top-32 lg:self-start">
              <FadeIn>
                <p className="text-cyan-600 text-sm font-medium uppercase tracking-wider mb-4">Testimonials</p>
                <h2 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
                  Loved by teams<br />around the world
                </h2>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-zinc-500">4.9/5 from 500+ reviews</p>
              </FadeIn>
            </div>

            {/* Right - Auto-scrolling testimonials */}
            <div className="relative h-[500px] overflow-hidden">
              {/* Gradient masks */}
              <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-white to-transparent z-10" />
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent z-10" />

              {/* Scrolling container */}
              <div className="animate-scroll-up space-y-4">
                {[
                  { quote: 'InsightAI cut our research time by 80%. What used to take hours now takes minutes.', author: 'Jennifer Kim', role: 'Head of Research, TechCorp' },
                  { quote: 'The accuracy and citation features are game-changing for our legal team.', author: 'Michael Chen', role: 'General Counsel, LegalFirm' },
                  { quote: 'Finally, an AI that understands our complex documents without hallucinating.', author: 'Sarah Johnson', role: 'VP Operations, FinanceHQ' },
                  { quote: 'We onboarded 500 employees in a week. The SSO integration was flawless.', author: 'David Park', role: 'IT Director, HealthPlus' },
                  { quote: 'The analytics dashboard helps us understand how knowledge flows in our org.', author: 'Emily Zhang', role: 'Chief of Staff, EduTech' },
                  { quote: 'Best investment we made this year. ROI was clear within the first month.', author: 'Robert Miller', role: 'CEO, StartupCo' },
                  { quote: 'Multi-language support means our global team can all use the same platform.', author: 'Maria Garcia', role: 'Global Ops, WorldBank' },
                  { quote: 'The compliance features saved us during our SOC 2 audit. Highly recommend.', author: 'James Wilson', role: 'Compliance Officer, SecureCorp' },
                  { quote: 'Our team productivity increased 3x since switching to InsightAI.', author: 'Lisa Thompson', role: 'Product Lead, TechStartup' },
                ].map((t, i) => (
                  <div key={i} className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200">
                    <p className="text-zinc-700 text-base mb-3">&ldquo;{t.quote}&rdquo;</p>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-zinc-200 flex items-center justify-center font-semibold text-xs text-zinc-600">
                        {t.author.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-zinc-900">{t.author}</p>
                        <p className="text-zinc-500 text-xs">{t.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {/* Duplicate for seamless loop */}
                {[
                  { quote: 'InsightAI cut our research time by 80%. What used to take hours now takes minutes.', author: 'Jennifer Kim', role: 'Head of Research, TechCorp' },
                  { quote: 'The accuracy and citation features are game-changing for our legal team.', author: 'Michael Chen', role: 'General Counsel, LegalFirm' },
                  { quote: 'Finally, an AI that understands our complex documents without hallucinating.', author: 'Sarah Johnson', role: 'VP Operations, FinanceHQ' },
                ].map((t, i) => (
                  <div key={`dup-${i}`} className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200">
                    <p className="text-zinc-700 text-base mb-3">&ldquo;{t.quote}&rdquo;</p>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-zinc-200 flex items-center justify-center font-semibold text-xs text-zinc-600">
                        {t.author.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-zinc-900">{t.author}</p>
                        <p className="text-zinc-500 text-xs">{t.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing - Dark */}
      <section id="pricing" className="py-32 px-6 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start mb-16">
            <FadeIn>
              <p className="text-cyan-400 text-sm font-medium uppercase tracking-wider mb-4">Pricing</p>
              <h2 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
                Simple pricing,<br />powerful results
              </h2>
            </FadeIn>
            <FadeIn delay={100}>
              <p className="text-white/60 text-lg lg:mt-12">
                Start with our free plan and upgrade as your team grows. No hidden fees, no surprises.
              </p>
            </FadeIn>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {[
              { name: 'Starter', price: 'Free', desc: 'For individuals', features: ['5 documents', '100 queries/month', 'GPT-4o mini', 'Email support'], cta: 'Get Started' },
              { name: 'Pro', price: '$29', period: '/mo', desc: 'For small teams', features: ['Unlimited documents', 'Unlimited queries', 'All AI models', 'Priority support', 'Team workspaces'], popular: true, cta: 'Start Free Trial' },
              { name: 'Enterprise', price: 'Custom', desc: 'For organizations', features: ['Everything in Pro', 'SSO & SAML', 'On-premise deploy', 'Custom SLA', 'Dedicated CSM'], cta: 'Contact Sales' },
            ].map((p, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div className={`relative h-full p-8 rounded-2xl ${p.popular ? 'bg-cyan-400 text-black' : 'bg-white/5 border border-white/10 text-white'}`}>
                  {p.popular && (
                    <div className="absolute -top-3 left-6 px-3 py-1 bg-cyan-400 text-black text-xs font-bold rounded-full">
                      POPULAR
                    </div>
                  )}
                  <h3 className="text-xl font-bold mb-1">{p.name}</h3>
                  <p className={`text-sm mb-4 ${p.popular ? 'text-black/70' : 'text-white/60'}`}>{p.desc}</p>
                  <div className="text-4xl font-bold mb-6">
                    {p.price}
                    {p.period && <span className={`text-base font-normal ${p.popular ? 'text-black/70' : 'text-white/60'}`}>{p.period}</span>}
                  </div>
                  <ul className="space-y-3 mb-8">
                    {p.features.map((f, j) => (
                      <li key={j} className={`flex items-center gap-2 text-sm ${p.popular ? 'text-black/80' : 'text-white/70'}`}>
                        <Check className={`w-4 h-4 ${p.popular ? 'text-black' : 'text-cyan-400'}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/login" className={`block w-full py-3 text-center font-semibold rounded-full transition-all ${p.popular ? 'bg-black text-white hover:bg-zinc-800' : 'bg-white text-black hover:bg-zinc-100'}`}>
                    {p.cta}
                  </Link>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - White */}
      <section className="py-32 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-black">Ready to get started?</h2>
            <p className="text-zinc-500 text-lg mb-10 max-w-2xl mx-auto">Join thousands of teams using InsightAI to unlock their document intelligence.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login" className="group inline-flex items-center gap-3 px-8 py-4 bg-black text-white font-semibold rounded-full hover:bg-zinc-800 transition-all">
                Start Free Trial
                <span className="w-6 h-6 rounded-full bg-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ArrowRight className="w-3.5 h-3.5 text-black" />
                </span>
              </Link>
              <a href="#" className="px-8 py-4 text-zinc-600 font-medium border border-zinc-300 rounded-full hover:border-zinc-400 hover:bg-zinc-50 transition-all">
                Schedule Demo
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 bg-black text-white border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-lg">InsightAI</span>
              </div>
              <p className="text-white/50 text-sm max-w-xs">Enterprise document intelligence platform. Deploy AI that actually understands your data.</p>
            </div>
            {[
              { title: 'Product', links: ['Platform', 'Features', 'Pricing', 'Integrations'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
              { title: 'Legal', links: ['Privacy', 'Terms', 'Security'] },
            ].map((section, i) => (
              <div key={i}>
                <h4 className="font-semibold mb-4 text-white/80">{section.title}</h4>
                <ul className="space-y-2 text-sm text-white/50">
                  {section.links.map((link, j) => (
                    <li key={j}><a href="#" className="hover:text-white transition-colors">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/40 text-sm">© 2024 InsightAI. All rights reserved.</p>
            <div className="flex items-center gap-4 text-sm text-white/50">
              <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-cyan-400" />SOC 2 Certified</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
