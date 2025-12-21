import Link from 'next/link';
import {
  Sparkles, ArrowRight, FileText, MessageSquare, ShieldCheck,
  Zap, BarChart3, Search, ChevronRight, CheckCircle
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">KnowledgeAI</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-400 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-slate-400 hover:text-white transition-colors">How it works</a>
            <a href="#pricing" className="text-slate-400 hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-slate-300 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link href="/login" className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        {/* Background gradient */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary-500/20 rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-full text-sm text-slate-300 mb-8">
            <Sparkles className="w-4 h-4 text-primary-400" />
            <span>AI-Powered Knowledge Assistant</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
            Find answers in your
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-emerald-300">
              company documents
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Upload your documents, ask questions in plain English, and get instant answers with source citations.
            Stop searching—start finding.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" className="group flex items-center gap-2 px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-500/25">
              Start for Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#how-it-works" className="flex items-center gap-2 px-8 py-4 text-slate-300 hover:text-white transition-colors">
              See how it works
              <ChevronRight className="w-5 h-5" />
            </a>
          </div>

          {/* Trust badges */}
          <div className="mt-16 pt-8 border-t border-slate-800/50">
            <p className="text-sm text-slate-500 mb-4">Trusted by teams at</p>
            <div className="flex items-center justify-center gap-8 opacity-50">
              {['Company A', 'Company B', 'Company C', 'Company D'].map((name) => (
                <div key={name} className="text-slate-400 font-semibold">{name}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything you need</h2>
            <p className="text-slate-400 text-lg">Powerful features to transform how your team accesses knowledge</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Search, title: 'Semantic Search', desc: 'Find information using natural language—no keywords needed' },
              { icon: MessageSquare, title: 'AI Chat', desc: 'Ask questions and get conversational answers with citations' },
              { icon: FileText, title: 'Multi-Format', desc: 'Upload PDFs, Word docs, text files, CSVs and more' },
              { icon: ShieldCheck, title: 'Secure', desc: 'Enterprise-grade security with role-based access control' },
              { icon: Zap, title: 'Fast Answers', desc: 'Get responses in seconds, not minutes of searching' },
              { icon: BarChart3, title: 'Analytics', desc: 'Track usage, identify knowledge gaps, measure impact' },
            ].map((feature, i) => (
              <div key={i} className="group p-6 bg-slate-800/30 border border-slate-800 rounded-2xl hover:border-slate-700 hover:bg-slate-800/50 transition-all">
                <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center mb-4 group-hover:bg-primary-500/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How it works</h2>
            <p className="text-slate-400 text-lg">Get started in three simple steps</p>
          </div>

          <div className="space-y-12">
            {[
              { step: '01', title: 'Upload Documents', desc: 'Drop your files—PDFs, Word docs, text files. We process and index them automatically.' },
              { step: '02', title: 'Ask Questions', desc: 'Type your question in plain English. No need to know which document has the answer.' },
              { step: '03', title: 'Get Answers', desc: 'Receive accurate responses with citations pointing to the exact source.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-8 items-start">
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-500/5 border border-primary-500/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary-400">{item.step}</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-slate-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative p-12 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/20 rounded-full blur-[80px]" />

            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to transform your knowledge access?</h2>
              <p className="text-slate-400 mb-8 max-w-xl mx-auto">
                Join teams already using KnowledgeAI to find answers faster and make better decisions.
              </p>
              <Link href="/login" className="inline-flex items-center gap-2 px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-500/25">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="text-sm text-slate-500 mt-4">No credit card required</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">KnowledgeAI</span>
          </div>
          <p className="text-slate-500 text-sm">© 2024 KnowledgeAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
