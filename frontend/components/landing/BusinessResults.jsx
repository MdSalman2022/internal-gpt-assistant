import FadeIn from './FadeIn';

export default function BusinessResults() {
    const stats = [
        { stat: '85%', label: 'Faster research' },
        { stat: '10x', label: 'Productivity boost' },
        { stat: '99.2%', label: 'Accuracy rate' },
        { stat: '50+', label: 'File formats' },
    ];

    return (
        <section id="results" className="min-h-[80vh] py-40 px-6 bg-black text-white flex items-center" data-theme="dark">
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
                        {stats.map((item, i) => (
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
    );
}
