import { ArrowUpRight } from 'lucide-react';
import FadeIn from './FadeIn';

export default function AIModels() {
    const models = [
        { name: 'GPT-5', provider: 'OpenAI', desc: 'Most capable model for complex reasoning and analysis.', tag: 'Recommended' },
        { name: 'Claude 4.5 Sonnet', provider: 'Anthropic', desc: 'Excellent for long-form content and nuanced understanding.' },
        { name: 'Gemini 3.0', provider: 'Google', desc: 'Fast responses with strong multilingual capabilities.' },
        { name: 'Custom Model', provider: 'Custom', desc: 'Cost-effective for everyday queries and quick tasks.' },
    ];

    return (
        <section id="features" className="py-32 px-6 bg-white" data-theme="light">
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
                        {models.map((model, i) => (
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
    );
}
