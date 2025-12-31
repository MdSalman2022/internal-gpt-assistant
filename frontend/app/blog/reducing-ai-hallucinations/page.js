import BlogLayout from '@/components/blog/BlogLayout';

// TODO: Replace with your actual image URL
const COVER_IMAGE = 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&h=630&fit=crop';

export const metadata = {
    title: 'How We Reduced AI Hallucinations by 90% | InsightAI Blog',
    description: 'Learn our practical approach to reducing AI hallucinations through better retrieval, prompt engineering, and response validation.',
    keywords: ['AI Hallucinations', 'RAG', 'LLM Reliability', 'Prompt Engineering', 'AI Accuracy'],
    openGraph: {
        title: 'How We Reduced AI Hallucinations by 90%',
        description: 'Our journey to building more reliable AI responses through better retrieval, prompt engineering, and guardrails.',
        type: 'article',
        publishedTime: '2024-12-20',
        authors: ['Sarah Kim'],
        images: [
            {
                url: COVER_IMAGE,
                width: 1200,
                height: 630,
                alt: 'How We Reduced AI Hallucinations by 90%',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'How We Reduced AI Hallucinations by 90%',
        description: 'Our journey to building more reliable AI responses through better retrieval, prompt engineering, and guardrails.',
        images: [COVER_IMAGE],
    },
};

export default function ReducingHallucinationsPost() {
    return (
        <BlogLayout
            title="How We Reduced AI Hallucinations by 90%"
            excerpt="Our journey to building more reliable AI responses through better retrieval, prompt engineering, and guardrails."
            date="December 20, 2024"
            readTime="6 min read"
            category="Engineering"
            author={{ name: 'Sarah Kim', role: 'ML Engineer' }}
            coverImage={COVER_IMAGE}
            previousPost={{
                title: 'Understanding RAG: A Practical Guide for Enterprise',
                href: '/blog/understanding-rag-enterprise-guide'
            }}
            nextPost={{
                title: 'The Future of Document Intelligence',
                href: '/blog/future-of-document-intelligence'
            }}
        >
            <p>
                When we first launched InsightAI, we faced a problem familiar to anyone building
                AI-powered products: hallucinations. Our system would occasionally generate
                confident-sounding responses that were completely made up.
            </p>
            <p>
                For a document intelligence platform, this was unacceptable. Users need to trust
                that the information they're getting comes from their actual documents, not the
                AI's imagination.
            </p>

            <h2>Understanding the Problem</h2>
            <p>
                First, let's define what we mean by "hallucination" in the context of RAG systems:
            </p>
            <ul>
                <li><strong>Fabricated facts:</strong> The AI invents information not present in any document</li>
                <li><strong>Misattribution:</strong> The AI attributes information to the wrong source</li>
                <li><strong>Overconfidence:</strong> The AI presents uncertain information as fact</li>
                <li><strong>Context bleeding:</strong> Information from one document incorrectly applied to another</li>
            </ul>

            <h2>Our Multi-Layer Approach</h2>
            <p>
                Reducing hallucinations isn't about a single fix—it requires improvements across
                the entire RAG pipeline. Here's what worked for us:
            </p>

            <h3>1. Better Retrieval = Better Responses</h3>
            <p>
                The single biggest improvement came from improving our retrieval system. If the
                right context isn't retrieved, the LLM has nothing reliable to ground its response in.
            </p>
            <p>
                We implemented:
            </p>
            <ul>
                <li><strong>Hybrid search:</strong> Combining semantic search with keyword matching</li>
                <li><strong>Query expansion:</strong> Rewriting queries to capture different phrasings</li>
                <li><strong>Reranking:</strong> Using a cross-encoder to rerank initial results</li>
                <li><strong>Relevance thresholds:</strong> Only using context above a confidence score</li>
            </ul>

            <blockquote>
                We found that improving retrieval precision from 70% to 90% reduced hallucinations
                by nearly 50% on its own.
            </blockquote>

            <h3>2. Prompt Engineering That Works</h3>
            <p>
                How you instruct the LLM matters enormously. Our prompts evolved through hundreds
                of iterations. Key learnings:
            </p>
            <ul>
                <li>Explicitly tell the model to only use provided context</li>
                <li>Require the model to cite sources inline</li>
                <li>Instruct it to say "I don't know" when information is missing</li>
                <li>Use structured output formats when possible</li>
            </ul>

            <h3>3. Response Validation</h3>
            <p>
                We added a validation layer that checks responses before they reach users:
            </p>
            <ul>
                <li><strong>Citation verification:</strong> Confirm cited text actually exists in retrieved chunks</li>
                <li><strong>Confidence scoring:</strong> Flag low-confidence responses for review</li>
                <li><strong>Contradiction detection:</strong> Check if the response contradicts retrieved context</li>
            </ul>

            <h3>4. User Feedback Loop</h3>
            <p>
                We built feedback mechanisms directly into the product:
            </p>
            <ul>
                <li>Thumbs up/down on responses</li>
                <li>"Report inaccuracy" button</li>
                <li>Source document links for verification</li>
            </ul>
            <p>
                This data feeds back into our evaluation pipeline, helping us continuously improve.
            </p>

            <h2>The Results</h2>
            <p>
                After implementing all these changes, our hallucination rate dropped from
                approximately 15% to under 1.5%—a 90% reduction.
            </p>
            <p>
                More importantly, user trust increased significantly. Our customer satisfaction
                scores went up 40%, and we saw a 60% reduction in support tickets related to
                incorrect information.
            </p>

            <h2>Lessons Learned</h2>
            <p>
                Looking back, here are the key insights from this journey:
            </p>
            <ol>
                <li><strong>Retrieval is foundational:</strong> No amount of prompt engineering can fix bad retrieval</li>
                <li><strong>Measure everything:</strong> You can't improve what you can't measure</li>
                <li><strong>Defense in depth:</strong> Multiple layers of protection work better than one</li>
                <li><strong>User feedback is gold:</strong> Real users find edge cases you'd never think of</li>
                <li><strong>Transparency builds trust:</strong> Showing sources matters as much as accuracy</li>
            </ol>

            <h2>What's Next</h2>
            <p>
                We're continuing to invest in reliability. Current areas of focus include:
            </p>
            <ul>
                <li>Fine-tuning retrieval models on domain-specific data</li>
                <li>Implementing chain-of-thought reasoning for complex queries</li>
                <li>Building automated evaluation pipelines</li>
                <li>Exploring multi-step verification for high-stakes queries</li>
            </ul>
            <p>
                The goal isn't perfection—it's building systems that are reliable enough for
                enterprise use while being transparent about their limitations.
            </p>
        </BlogLayout>
    );
}
