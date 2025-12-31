'use client';

export default function TrustedBy() {
    // Company logos as styled text (replace with actual logos when available)
    const companies = [
        { name: 'Stripe', style: 'font-bold' },
        { name: 'Notion', style: 'font-semibold' },
        { name: 'Linear', style: 'font-medium' },
        { name: 'Vercel', style: 'font-bold tracking-tight' },
        { name: 'Figma', style: 'font-semibold' },
        { name: 'Slack', style: 'font-bold' },
    ];

    // Double the array for seamless loop
    const allCompanies = [...companies, ...companies];

    return (
        <section className="py-12 border-y border-zinc-100 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                <p className="text-center text-sm text-zinc-400 mb-8">
                    Trusted by teams at
                </p>
            </div>

            {/* Marquee Container */}
            <div className="relative">
                {/* Gradient Overlays */}
                <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10" />

                {/* Scrolling Track */}
                <div className="flex animate-marquee">
                    {allCompanies.map((company, i) => (
                        <div
                            key={i}
                            className={`flex-shrink-0 mx-8 sm:mx-12 text-2xl sm:text-3xl text-zinc-200 hover:text-zinc-400 transition-colors cursor-default select-none ${company.style}`}
                        >
                            {company.name}
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
                @keyframes marquee {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(-50%);
                    }
                }
                .animate-marquee {
                    animation: marquee 20s linear infinite;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </section>
    );
}
