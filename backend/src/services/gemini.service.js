import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/index.js';

class GeminiService {
    constructor() {
        this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
        this.model = this.genAI.getGenerativeModel({ model: config.gemini.model });
        this.embeddingModel = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
        console.log(`🤖 Gemini initialized with model: ${config.gemini.model}`);
    }

    /**
     * Generate embedding for text
     */
    async generateEmbedding(text) {
        const start = Date.now();
        try {
            const result = await this.embeddingModel.embedContent(text);
            console.log(`🔢 Embedding generated (${Date.now() - start}ms) - ${text.substring(0, 50)}...`);
            return result.embedding.values;
        } catch (error) {
            console.error('❌ Embedding error:', error.message);
            throw error;
        }
    }

    /**
     * Generate embeddings for multiple texts (batch)
     */
    async generateEmbeddings(texts) {
        const start = Date.now();
        console.log(`🔢 Generating ${texts.length} embeddings...`);
        try {
            const embeddings = await Promise.all(
                texts.map(text => this.generateEmbedding(text))
            );
            console.log(`✅ Batch embeddings complete (${Date.now() - start}ms)`);
            return embeddings;
        } catch (error) {
            console.error('❌ Batch embedding error:', error.message);
            throw error;
        }
    }

    /**
     * Rewrite query for better retrieval
     */
    async rewriteQuery(query) {
        const start = Date.now();
        const prompt = `Rewrite this question to be more specific for semantic search. Output ONLY the rewritten query.

Question: "${query}"
Rewritten:`;

        try {
            const result = await this.model.generateContent(prompt);
            const rewritten = result.response.text().trim();
            console.log(`📝 Query rewritten (${Date.now() - start}ms): "${query}" → "${rewritten}"`);
            return rewritten;
        } catch (error) {
            console.error('❌ Query rewrite error:', error.message);
            return query;
        }
    }

    /**
     * Rerank search results
     */
    async rerankResults(query, results) {
        if (results.length <= 1) return results;

        const start = Date.now();
        console.log(`🔄 Reranking ${results.length} results...`);

        const prompt = `Rate each chunk's relevance to the query (0-10). Return ONLY a JSON array of numbers.

Query: "${query}"

Chunks:
${results.map((r, i) => `[${i}] ${r.content.substring(0, 250)}`).join('\n\n')}

Scores:`;

        try {
            const result = await this.model.generateContent(prompt);
            const text = result.response.text().trim();

            const match = text.match(/\[[\d,.\s]+\]/);
            if (match) {
                const scores = JSON.parse(match[0]);
                const reranked = results.map((r, i) => ({
                    ...r,
                    rerankScore: scores[i] || r.score,
                }));
                reranked.sort((a, b) => b.rerankScore - a.rerankScore);
                console.log(`✅ Reranking complete (${Date.now() - start}ms) - Top score: ${reranked[0]?.rerankScore}`);
                return reranked;
            }
        } catch (error) {
            console.error('❌ Rerank error:', error.message);
        }

        console.log(`⚠️ Reranking failed, using original order (${Date.now() - start}ms)`);
        return results;
    }

    /**
     * Generate answer with citations (optimized prompt)
     */
    async generateAnswer(query, context, conversationHistory = []) {
        const start = Date.now();
        console.log(`💬 Generating answer for: "${query.substring(0, 50)}..."`);
        console.log(`   Context: ${context.length} chunks, History: ${conversationHistory.length} messages`);

        const hasContext = context && context.length > 0;

        const contextText = hasContext
            ? context
                .map((c, i) => `[Source ${i + 1}: ${c.documentTitle}]\n${c.content.substring(0, 500)}`)
                .join('\n\n---\n\n')
            : null;

        const historyText = conversationHistory
            .slice(-4)
            .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content.substring(0, 200)}`)
            .join('\n');

        // Different prompts based on whether we have document context
        const prompt = hasContext
            ? `You are a helpful AI knowledge assistant. Answer the question using the provided documents when relevant.

DOCUMENTS:
${contextText}

${historyText ? `CONVERSATION:\n${historyText}\n` : ''}
USER: ${query}

INSTRUCTIONS:
- If the documents contain relevant info, use them and cite as [Source N]
- If the question is general/conversational (greetings, thanks, etc), respond naturally without citations
- Be helpful, concise, and use markdown formatting

Respond in JSON: {"answer": "...", "citations_used": [1,2], "confidence": 0.85}`
            : `You are a helpful AI assistant. You can answer general questions and have natural conversations.

${historyText ? `CONVERSATION:\n${historyText}\n` : ''}
USER: ${query}

Respond naturally and helpfully. Be concise and friendly.

Respond in JSON: {"answer": "...", "citations_used": [], "confidence": 0.9}`;

        try {
            const result = await this.model.generateContent(prompt);
            const text = result.response.text().trim();

            try {
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    console.log(`✅ Answer generated (${Date.now() - start}ms) - Confidence: ${parsed.confidence}, Citations: [${parsed.citations_used?.join(', ')}]`);
                    return {
                        answer: parsed.answer || text,
                        citationsUsed: parsed.citations_used || [],
                        confidence: parsed.confidence || 0.5,
                        isLowConfidence: (parsed.confidence || 0.5) < config.rag.minConfidence,
                    };
                }
            } catch (parseError) {
                console.log(`⚠️ JSON parse failed, using raw text (${Date.now() - start}ms)`);
                return {
                    answer: text,
                    citationsUsed: [],
                    confidence: 0.7,
                    isLowConfidence: false,
                };
            }
        } catch (error) {
            console.error('❌ Generate answer error:', error.message);
            throw error;
        }
    }

    /**
     * Generate conversation title
     */
    async generateConversationTitle(firstMessage) {
        const start = Date.now();
        const prompt = `Generate a short title (max 5 words) for: "${firstMessage}"
Output only the title.`;

        try {
            const result = await this.model.generateContent(prompt);
            const title = result.response.text().trim().slice(0, 40);
            console.log(`📌 Title generated (${Date.now() - start}ms): "${title}"`);
            return title;
        } catch (error) {
            console.error('❌ Title generation error:', error.message);
            return 'New Conversation';
        }
    }

    /**
     * Generate document tags
     */
    async generateDocumentTags(content) {
        const start = Date.now();
        const prompt = `Extract 3-5 category tags from this document. Return ONLY a JSON array of lowercase strings.

Document:
${content.substring(0, 2000)}

Tags:`;

        try {
            const result = await this.model.generateContent(prompt);
            const text = result.response.text().trim();
            const match = text.match(/\[[\s\S]*?\]/);
            if (match) {
                const tags = JSON.parse(match[0]);
                console.log(`🏷️ Tags generated (${Date.now() - start}ms): [${tags.join(', ')}]`);
                return tags;
            }
        } catch (error) {
            console.error('❌ Tag generation error:', error.message);
        }

        return [];
    }
}

const geminiService = new GeminiService();

export default geminiService;
