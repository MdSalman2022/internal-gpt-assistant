import Link from 'next/link';
import {
  Sparkles, ArrowRight, Shield, Lock, Cpu, Database, Globe, Layers,
  Check, ChevronRight, Building2, Users, FileSearch, Brain, Workflow,
  BarChart3, MessagesSquare, Calendar, Fingerprint, Cloud, Server,
  Zap, FileText, Search, Target, TrendingUp, Clock, Award, Star,
  CheckCircle, ArrowUpRight, Play, Quote, HelpCircle, ChevronDown,
  Briefcase, GraduationCap, Stethoscope, Scale, Building, Landmark,
  Menu, X
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white overflow-x-hidden antialiased">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#09090b]/90 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 md:gap-3">
            <div className="relative">
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center">
                <Brain className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg blur-lg opacity-30" />
            </div>
            <span className="font-semibold text-base md:text-lg tracking-tight">InsightAI</span>
            <span className="hidden sm:inline-flex text-[10px] font-medium px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded-full border border-violet-500/20">Enterprise</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8 text-sm">
            <a href="#platform" className="text-zinc-400 hover:text-white transition-colors">Platform</a>
            <a href="#features" className="text-zinc-400 hover:text-white transition-colors">Features</a>
            <a href="#security" className="text-zinc-400 hover:text-white transition-colors">Security</a>
            <a href="#use-cases" className="text-zinc-400 hover:text-white transition-colors">Use Cases</a>
            <a href="#pricing" className="text-zinc-400 hover:text-white transition-colors">Pricing</a>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm text-zinc-300 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link href="/login" className="group px-4 py-2 text-sm bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-all flex items-center gap-2">
              Request Demo
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Mobile CTA */}
          <div className="flex md:hidden items-center gap-2">
            <Link href="/login" className="px-3 py-1.5 text-xs bg-white text-black font-medium rounded-lg">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Advanced background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-violet-600/20 via-purple-600/10 to-transparent rounded-full blur-[100px]" />
          <div className="absolute top-40 left-1/4 w-[400px] h-[400px] bg-fuchsia-600/10 rounded-full blur-[80px]" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEI0djRIMHYyaDR2NGgyVjZoNFY0SDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40" />
        </div>

        <div className="relative max-w-6xl mx-auto">
          {/* Enterprise badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-zinc-900/80 border border-zinc-800 rounded-full">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-medium">SOC 2 Compliant</span>
              </div>
              <div className="w-px h-4 bg-zinc-700" />
              <div className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-violet-400" />
                <span className="text-xs text-violet-400 font-medium">End-to-End Encrypted</span>
              </div>
              <div className="w-px h-4 bg-zinc-700" />
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-amber-400 font-medium">G2 Leader 2024</span>
              </div>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-center text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-6">
            <span className="text-zinc-300">Enterprise Knowledge</span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              Intelligence Platform
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-center text-lg md:text-xl text-zinc-500 max-w-3xl mx-auto mb-10 leading-relaxed">
            Transform your organization&apos;s documents into an intelligent knowledge system.
            <span className="text-zinc-400"> Advanced RAG architecture, multi-model AI, and enterprise-grade security.</span>
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/login" className="group relative px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl transition-all shadow-2xl shadow-violet-600/25 hover:shadow-violet-600/40 flex items-center gap-3">
              <span>Start Free Trial</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 blur-xl opacity-50 group-hover:opacity-70 transition-opacity -z-10" />
            </Link>
            <button className="px-8 py-4 text-zinc-400 hover:text-white font-medium transition-colors flex items-center gap-2 group">
              <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Watch Demo
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mb-16">
            {[
              { value: '500+', label: 'Enterprise clients' },
              { value: '10M+', label: 'Documents processed' },
              { value: '99.99%', label: 'Uptime SLA' },
              { value: '<2s', label: 'Avg response time' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-zinc-500">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Logos */}
          <div className="text-center">
            <p className="text-xs text-zinc-600 uppercase tracking-wider mb-6">Trusted by leading organizations</p>
            <div className="flex flex-wrap items-center justify-center gap-12 opacity-40">
              {['Fortune 500', 'TechCorp', 'GlobalBank', 'HealthCare+', 'LegalFirm', 'ConsultCo'].map((name) => (
                <div key={name} className="text-zinc-500 font-semibold text-lg">{name}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 border-t border-zinc-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full text-xs text-violet-400 font-medium mb-4">
              <Workflow className="w-3 h-3" />
              HOW IT WORKS
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">From Documents to Answers in Minutes</h2>
            <p className="text-zinc-500 text-lg max-w-2xl mx-auto">Our intelligent pipeline transforms your unstructured data into actionable knowledge</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '01', icon: FileText, title: 'Upload Documents', desc: 'Drag & drop PDFs, Word, Excel, PowerPoint, Markdown, or connect to cloud storage' },
              { step: '02', icon: Cpu, title: 'AI Processing', desc: 'Advanced chunking, embedding generation, and semantic indexing in our vector database' },
              { step: '03', icon: Search, title: 'Ask Questions', desc: 'Natural language queries with contextual understanding and query expansion' },
              { step: '04', icon: Target, title: 'Get Answers', desc: 'Accurate responses with source citations, confidence scores, and follow-up suggestions' },
            ].map((item, i) => (
              <div key={i} className="relative group">
                {i < 3 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-px bg-gradient-to-r from-violet-500/50 to-transparent -translate-x-4" />
                )}
                <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-violet-500/30 transition-all h-full">
                  <div className="text-xs text-violet-400 font-mono mb-4">{item.step}</div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <item.icon className="w-6 h-6 text-violet-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-zinc-500 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Architecture */}
      <section id="platform" className="py-24 px-6 bg-gradient-to-b from-zinc-950 to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-xs text-purple-400 font-medium mb-4">
              <Cpu className="w-3 h-3" />
              PLATFORM ARCHITECTURE
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Built for Enterprise Scale</h2>
            <p className="text-zinc-500 text-lg max-w-2xl mx-auto">State-of-the-art infrastructure designed to handle millions of documents and thousands of concurrent users</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-12">
            {/* RAG Engine */}
            <div className="group relative p-8 bg-gradient-to-b from-zinc-900/80 to-zinc-900/40 border border-zinc-800/50 rounded-2xl hover:border-violet-500/30 transition-all">
              <div className="absolute inset-0 bg-gradient-to-b from-violet-600/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20 flex items-center justify-center mb-6">
                  <Layers className="w-7 h-7 text-violet-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Advanced RAG Engine</h3>
                <p className="text-zinc-500 text-sm leading-relaxed mb-6">
                  Our proprietary Retrieval-Augmented Generation engine combines hybrid vector + keyword search with cross-encoder reranking for maximum accuracy.
                </p>
                <ul className="space-y-3">
                  {['Semantic document chunking', 'Multi-modal embeddings (text, images, tables)', 'Contextual compression & expansion', 'Real-time query rewriting', 'Confidence scoring & ranking'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-zinc-400">
                      <Check className="w-4 h-4 text-violet-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Multi-Model AI */}
            <div className="group relative p-8 bg-gradient-to-b from-zinc-900/80 to-zinc-900/40 border border-zinc-800/50 rounded-2xl hover:border-purple-500/30 transition-all">
              <div className="absolute inset-0 bg-gradient-to-b from-purple-600/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 border border-purple-500/20 flex items-center justify-center mb-6">
                  <Brain className="w-7 h-7 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Multi-Model Intelligence</h3>
                <p className="text-zinc-500 text-sm leading-relaxed mb-6">
                  Access multiple LLM providers through a unified API. Intelligent routing automatically selects the optimal model for each query type.
                </p>
                <ul className="space-y-3">
                  {['OpenAI GPT-4o & GPT-4 Turbo', 'Anthropic Claude 3.5 Sonnet', 'Google Gemini 2.0 Flash', 'Custom fine-tuned models', 'Automatic fallback & load balancing'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-zinc-400">
                      <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Analytics */}
            <div className="group relative p-8 bg-gradient-to-b from-zinc-900/80 to-zinc-900/40 border border-zinc-800/50 rounded-2xl hover:border-fuchsia-500/30 transition-all">
              <div className="absolute inset-0 bg-gradient-to-b from-fuchsia-600/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-pink-500/20 border border-fuchsia-500/20 flex items-center justify-center mb-6">
                  <BarChart3 className="w-7 h-7 text-fuchsia-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Knowledge Analytics</h3>
                <p className="text-zinc-500 text-sm leading-relaxed mb-6">
                  Understand how knowledge flows through your organization. Identify gaps, optimize documentation, and measure the ROI of your knowledge base.
                </p>
                <ul className="space-y-3">
                  {['Query analytics & usage heatmaps', 'Knowledge gap detection', 'Document health scoring', 'User adoption metrics', 'ROI & productivity tracking'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-zinc-400">
                      <Check className="w-4 h-4 text-fuchsia-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs text-blue-400 font-medium mb-4">
              <Zap className="w-3 h-3" />
              FEATURES
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Everything You Need</h2>
            <p className="text-zinc-500 text-lg max-w-2xl mx-auto">Comprehensive features designed for enterprise knowledge management</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: MessagesSquare, title: 'Natural Language Chat', desc: 'Conversational interface that understands context, follow-ups, and complex queries' },
              { icon: FileSearch, title: 'Semantic Search', desc: 'Find information by meaning, not just keywords. Understands synonyms, concepts, and intent' },
              { icon: FileText, title: '50+ File Formats', desc: 'PDF, Word, Excel, PowerPoint, Markdown, HTML, images, and more—all automatically parsed' },
              { icon: Calendar, title: 'Calendar Integration', desc: 'Connect Google Calendar, Outlook. Ask about schedules, meetings, and availability' },
              { icon: Users, title: 'Team Workspaces', desc: 'Organize knowledge by department, project, or team with granular access controls' },
              { icon: TrendingUp, title: 'Usage Analytics', desc: 'Track queries, popular documents, knowledge gaps, and user adoption metrics' },
              { icon: Clock, title: 'Version History', desc: 'Full audit trail of document changes, queries, and answers for compliance' },
              { icon: Globe, title: 'Multi-Language', desc: 'Support for 50+ languages with automatic translation and cross-language search' },
              { icon: Workflow, title: 'API & Webhooks', desc: 'RESTful API, webhooks, and SDKs for seamless integration with your tech stack' },
            ].map((feature, i) => (
              <div key={i} className="group p-6 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl hover:border-zinc-700 hover:bg-zinc-900/50 transition-all">
                <div className="w-12 h-12 rounded-xl bg-zinc-800/50 flex items-center justify-center mb-4 group-hover:bg-zinc-800 transition-colors">
                  <feature.icon className="w-6 h-6 text-zinc-400 group-hover:text-violet-400 transition-colors" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Compliance */}
      <section id="security" className="py-24 px-6 bg-gradient-to-b from-zinc-950 to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs text-emerald-400 font-medium mb-4">
                <Shield className="w-3 h-3" />
                ENTERPRISE SECURITY
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                Security-First<br />
                <span className="text-zinc-500">Architecture</span>
              </h2>
              <p className="text-zinc-500 text-lg mb-8 leading-relaxed">
                Built to meet the strictest enterprise security and compliance requirements. Your data never leaves your control, and every access is logged and auditable.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { icon: Lock, label: 'AES-256 Encryption' },
                  { icon: Fingerprint, label: 'SSO & SAML 2.0' },
                  { icon: Server, label: 'On-Premise Option' },
                  { icon: Cloud, label: 'Private Cloud Deploy' },
                  { icon: Shield, label: 'Role-Based Access' },
                  { icon: FileSearch, label: 'Audit Logging' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-xl">
                    <item.icon className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm text-zinc-300">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-violet-500/10 rounded-3xl blur-3xl" />
              <div className="relative p-8 bg-zinc-900/50 border border-zinc-800 rounded-3xl">
                <h4 className="text-lg font-semibold mb-6 text-center">Compliance Certifications</h4>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { title: 'SOC 2 Type II', desc: 'Certified', color: 'emerald' },
                    { title: 'GDPR', desc: 'Compliant', color: 'blue' },
                    { title: 'HIPAA', desc: 'Ready', color: 'purple' },
                    { title: 'ISO 27001', desc: 'Certified', color: 'amber' },
                  ].map((cert, i) => (
                    <div key={i} className="p-4 bg-zinc-950/50 border border-zinc-800 rounded-xl text-center">
                      <div className="text-lg font-semibold text-white">{cert.title}</div>
                      <div className={`text-sm text-${cert.color}-400`}>{cert.desc}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                  <p className="text-sm text-emerald-400 text-center">
                    Annual penetration testing by third-party security firms
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs text-amber-400 font-medium mb-4">
              <Building2 className="w-3 h-3" />
              USE CASES
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Built for Every Industry</h2>
            <p className="text-zinc-500 text-lg max-w-2xl mx-auto">From legal to healthcare, InsightAI adapts to your industry&apos;s unique knowledge management needs</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Scale, title: 'Legal', desc: 'Case law research, contract analysis, regulatory compliance, and precedent discovery', example: '"What precedents exist for intellectual property disputes in our jurisdiction?"' },
              { icon: Stethoscope, title: 'Healthcare', desc: 'Clinical guidelines, drug interactions, medical literature, and patient care protocols', example: '"What are the latest treatment guidelines for Type 2 Diabetes management?"' },
              { icon: Landmark, title: 'Finance', desc: 'Regulatory filings, market research, risk assessments, and compliance documentation', example: '"Summarize the key changes in the latest SEC reporting requirements."' },
              { icon: Building, title: 'Enterprise', desc: 'Internal policies, HR documentation, training materials, and company knowledge', example: '"What is our vacation policy for employees in the APAC region?"' },
              { icon: GraduationCap, title: 'Education', desc: 'Research papers, curriculum materials, academic resources, and institutional knowledge', example: '"Find research papers on machine learning in educational assessment."' },
              { icon: Briefcase, title: 'Consulting', desc: 'Project documentation, industry reports, methodologies, and client knowledge bases', example: '"What frameworks have we used for digital transformation projects?"' },
            ].map((useCase, i) => (
              <div key={i} className="group p-6 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl hover:border-amber-500/30 transition-all">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                  <useCase.icon className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{useCase.title}</h3>
                <p className="text-zinc-500 text-sm mb-4">{useCase.desc}</p>
                <div className="p-3 bg-zinc-950/50 border border-zinc-800 rounded-lg">
                  <p className="text-xs text-zinc-400 italic">{useCase.example}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-gradient-to-b from-zinc-950 to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-pink-500/10 border border-pink-500/20 rounded-full text-xs text-pink-400 font-medium mb-4">
              <Star className="w-3 h-3" />
              TESTIMONIALS
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Loved by Teams Worldwide</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { quote: "InsightAI reduced our document search time by 80%. What used to take hours now takes seconds.", author: "Sarah Chen", role: "VP of Operations", company: "TechCorp" },
              { quote: "The accuracy of answers with source citations has transformed how our legal team does research.", author: "Michael Roberts", role: "General Counsel", company: "GlobalBank" },
              { quote: "Finally, a knowledge platform that actually understands context. Our support team loves it.", author: "Emily Watson", role: "Head of Support", company: "SaaS Co" },
            ].map((testimonial, i) => (
              <div key={i} className="p-6 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl">
                <Quote className="w-8 h-8 text-violet-400/30 mb-4" />
                <p className="text-zinc-300 mb-6 leading-relaxed">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-sm font-semibold">
                    {testimonial.author.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{testimonial.author}</div>
                    <div className="text-xs text-zinc-500">{testimonial.role}, {testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs text-blue-400 font-medium mb-4">
            <Workflow className="w-3 h-3" />
            INTEGRATIONS
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Connects to Your Stack</h2>
          <p className="text-zinc-500 text-lg max-w-2xl mx-auto mb-12">
            Seamlessly integrate with your existing tools. Productivity, communication, and storage—all connected.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { name: 'Google Calendar' },
              { name: 'Slack' },
              { name: 'Microsoft Teams' },
              { name: 'Notion' },
              { name: 'Google Drive' },
              { name: 'SharePoint' },
              { name: 'Confluence' },
              { name: 'Dropbox' },
              { name: 'OneDrive' },
              { name: 'Jira' },
            ].map((integration, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors">
                <span className="text-sm text-zinc-300">{integration.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-gradient-to-b from-transparent to-zinc-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full text-xs text-violet-400 font-medium mb-4">
              <Sparkles className="w-3 h-3" />
              PRICING
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Simple, Transparent Pricing</h2>
            <p className="text-zinc-500 text-lg">Start free, scale as you grow. No hidden fees.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Team */}
            <div className="relative p-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
              <h3 className="text-xl font-semibold mb-1">Team</h3>
              <p className="text-zinc-500 text-sm mb-6">For growing teams</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">$49</span>
                <span className="text-zinc-500">/user/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Up to 20 users', '10,000 documents', '50,000 queries/mo', 'Standard AI models', 'Email support', '5 integrations'].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-zinc-400">
                    <Check className="w-4 h-4 text-violet-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/login" className="block w-full py-3 text-center font-medium bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors">
                Start Free Trial
              </Link>
            </div>

            {/* Business */}
            <div className="relative p-8 bg-gradient-to-b from-violet-950/50 to-purple-950/30 border border-violet-500/30 rounded-2xl">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-xs font-semibold rounded-full">
                Most Popular
              </div>
              <h3 className="text-xl font-semibold mb-1">Business</h3>
              <p className="text-zinc-500 text-sm mb-6">For scaling organizations</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">$99</span>
                <span className="text-zinc-500">/user/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Unlimited users', 'Unlimited documents', 'Unlimited queries', 'All AI models', 'All integrations', 'Analytics dashboard', 'Priority support', 'Custom branding'].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                    <Check className="w-4 h-4 text-violet-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/login" className="block w-full py-3 text-center font-medium bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 rounded-xl transition-all shadow-lg shadow-violet-600/20">
                Start Free Trial
              </Link>
            </div>

            {/* Enterprise */}
            <div className="relative p-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
              <h3 className="text-xl font-semibold mb-1">Enterprise</h3>
              <p className="text-zinc-500 text-sm mb-6">For large organizations</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">Custom</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Everything in Business', 'SSO & SAML', 'Custom AI models', 'On-premise deployment', 'Dedicated success manager', '99.99% SLA guarantee', 'Custom integrations', 'Security review'].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-zinc-400">
                    <Check className="w-4 h-4 text-violet-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/login" className="block w-full py-3 text-center font-medium bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors">
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-xs text-cyan-400 font-medium mb-4">
              <HelpCircle className="w-3 h-3" />
              FAQ
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {[
              { q: 'How does InsightAI ensure data security?', a: 'All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We offer on-premise deployment, private cloud options, and are SOC 2 Type II certified. Your data is never used to train models.' },
              { q: 'What file formats are supported?', a: 'We support 50+ formats including PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx), Markdown, HTML, plain text, images with OCR, and more. Custom format parsers available for Enterprise.' },
              { q: 'Can I use my own AI models?', a: 'Yes! Enterprise customers can deploy custom fine-tuned models, private LLMs, or on-premise models. We also support Azure OpenAI and AWS Bedrock.' },
              { q: 'How accurate are the answers?', a: 'Our advanced RAG architecture achieves 95%+ accuracy on benchmark tests. Every answer includes source citations so you can verify. Confidence scores help you assess reliability.' },
              { q: 'What integrations are available?', a: 'We integrate with Google Workspace, Microsoft 365, Slack, Notion, Confluence, SharePoint, Dropbox, and more. Custom integrations available via our API.' },
            ].map((faq, i) => (
              <details key={i} className="group p-6 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="font-medium pr-6">{faq.q}</span>
                  <ChevronDown className="w-5 h-5 text-zinc-500 group-open:rotate-180 transition-transform" />
                </summary>
                <p className="mt-4 text-zinc-400 text-sm leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative p-12 md:p-16 text-center rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-950 via-purple-950 to-fuchsia-950" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEI0djRIMHYyaDR2NGgyVjZoNFY0SDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-violet-500/20 rounded-full blur-[100px]" />
            <div className="relative">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Ready to Transform Your Knowledge Management?</h2>
              <p className="text-zinc-400 mb-8 max-w-xl mx-auto text-lg">
                Join 500+ enterprise teams using InsightAI to unlock organizational intelligence and make faster, better decisions.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/login" className="px-8 py-4 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 transition-all flex items-center gap-2 shadow-2xl">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a href="#" className="px-8 py-4 text-zinc-300 hover:text-white font-medium transition-colors flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Schedule Demo
                </a>
              </div>
              <p className="text-sm text-zinc-500 mt-6">14-day free trial • No credit card required • Cancel anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold">InsightAI</span>
              </div>
              <p className="text-zinc-500 text-sm">Enterprise Knowledge Intelligence Platform</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">GDPR</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-zinc-600 text-sm">© 2024 InsightAI Inc. All rights reserved.</p>
            <div className="flex items-center gap-6 text-sm text-zinc-500">
              <span>🇺🇸 United States</span>
              <span>SOC 2 Type II</span>
              <span>GDPR Compliant</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
