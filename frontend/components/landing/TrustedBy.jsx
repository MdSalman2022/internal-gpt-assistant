export default function TrustedBy() {
    const companies = ['TechCorp', 'LegalFirm', 'HealthPlus', 'FinanceHQ', 'EduTech'];

    return (
        <section className="py-12 px-6 border-y border-zinc-100">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-6">
                    {companies.map((name) => (
                        <div key={name} className="text-zinc-300 font-semibold text-lg hover:text-zinc-500 transition-colors cursor-pointer">
                            {name}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
