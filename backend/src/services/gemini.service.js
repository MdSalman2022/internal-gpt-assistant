import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/index.js';

class GeminiService {
    constructor() {
        this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        this.embeddingModel = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
    }

    /**
     * Generate embeddings for text
     * @param {string} text - Text to embed
     * @returns {Promise<Array<number>>} - Embedding vector
     */
    async generateEmbedding(text) {
        try {
            const result = await this.embeddingModel.embedContent(text);
            return result.embedding.values;
        } catch (error) {
            console.error('❌ Gemini embedding error:', error.message);
            throw error;
        }
    }

    /**
     * Generate embeddings for multiple texts (batch)
     * @param {Array<string>} texts - Array of texts
     * @returns {Promise<Array<Array<number>>>} - Array of embedding vectors
     */
    async generateEmbeddings(texts) {
        try {
            const embeddings = await Promise.all(
                texts.map(text => this.generateEmbedding(text))
            );
            return embeddings;
        } catch (error) {
            console.error('❌ Gemini batch embedding error:', error.message);
            throw error;
        }
    }

    /**
     * Rewrite query for better retrieval
     * @param {string} query - Original user query
     * @returns {Promise<string>} - Rewritten query
     */
    async rewriteQuery(query) {
        const prompt = `Rewrite the following user question to be more specific and better suited for semantic search. 
Keep it concise but capture the key concepts. Only output the rewritten query, nothing else.

Original question: "${query}"

Rewritten query:`;

        try {
            const result = await this.model.generateContent(prompt);
            return result.response.text().trim();
        } catch (error) {
            console.error('❌ Query rewrite error:', error.message);
            return query; // Fallback to original
        }
    }

    /**
     * Rerank search results using cross-encoder style approach
     * @param {string} query - User query
     * @param {Array} results - Search results with content
     * @returns {Promise<Array>} - Reranked results
     */
    async rerankResults(query, results) {
        if (results.length <= 1) return results;

        const prompt = `Rate the relevance of each document chunk to the query on a scale of 0-10.
Return ONLY a JSON array of numbers in the same order as the chunks.

Query: "${query}"

Chunks:
${results.map((r, i) => `[${i}] ${r.content.substring(0, 300)}...`).join('\n\n')}

JSON array of relevance scores:`;

        try {
            const result = await this.model.generateContent(prompt);
            const text = result.response.text().trim();

            // Parse scores from response
            const match = text.match(/\[[\d,.\s]+\]/);
            if (match) {
                const scores = JSON.parse(match[0]);

                // Add rerank scores and sort
                const reranked = results.map((r, i) => ({
                    ...r,
                    rerankScore: scores[i] || r.score,
                }));

                reranked.sort((a, b) => b.rerankScore - a.rerankScore);
                return reranked;
            }
        } catch (error) {
            console.error('❌ Rerank error:', error.message);
        }

        return results; // Fallback to original order
    }

    /**
     * Generate answer with citations
     * @param {string} query - User question
     * @param {Array} context - Retrieved context chunks
     * @param {Array} conversationHistory - Previous messages
     * @returns {Promise<Object>} - { answer, citations, confidence }
     */
    async generateAnswer(query, context, conversationHistory = []) {
        const contextText = context
            .map((c, i) => `[Source ${i + 1}: ${c.documentTitle}]\n${c.content}`)
            .join('\n\n---\n\n');

        const historyText = conversationHistory
            .slice(-6) // Last 6 messages for context
            .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
            .join('\n');

        const prompt = `You are an AI knowledge assistant helping employees find information from internal company documents.

CONTEXT FROM DOCUMENTS:
${contextText || 'No relevant documents found.'}

${historyText ? `CONVERSATION HISTORY:\n${historyText}\n` : ''}

USER QUESTION: ${query}

INSTRUCTIONS:
1. Answer the question based ONLY on the provided context
2. If the context doesn't contain enough information, say "I don't have enough information in the knowledge base to answer this question confidently."
3. Cite sources using [Source N] format when referencing information
4. Be concise but comprehensive
5. Use markdown formatting for better readability

Provide your response in this JSON format:
{
  "answer": "Your detailed answer with [Source N] citations",
  "citations_used": [1, 2], // Array of source numbers used
  "confidence": 0.85 // 0-1 confidence score
}`;

        try {
            const result = await this.model.generateContent(prompt);
            const text = result.response.text().trim();

            // Try to parse JSON response
            try {
                // Find JSON in response
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    return {
                        answer: parsed.answer || text,
                        citationsUsed: parsed.citations_used || [],
                        confidence: parsed.confidence || 0.5,
                        isLowConfidence: (parsed.confidence || 0.5) < config.rag.minConfidence,
                    };
                }
            } catch (parseError) {
                // If JSON parsing fails, return raw text
                return {
                    answer: text,
                    citationsUsed: [],
                    confidence: 0.7,
                    isLowConfidence: false,
                };
            }
        } catch (error) {
            console.error('❌ Gemini generate error:', error.message);
            throw error;
        }
    }

    /**
     * Generate a title for a conversation based on first message
     * @param {string} firstMessage - First user message
     * @returns {Promise<string>} - Generated title
     */
    async generateConversationTitle(firstMessage) {
        const prompt = `Generate a short, descriptive title (max 6 words) for a conversation that starts with:
"${firstMessage}"

Only output the title, nothing else.`;

        try {
            const result = await this.model.generateContent(prompt);
            return result.response.text().trim().slice(0, 50);
        } catch (error) {
            console.error('❌ Title generation error:', error.message);
            return 'New Conversation';
        }
    }

    /**
     * Generate tags for a document
     * @param {string} content - Document content (first few thousand chars)
     * @returns {Promise<Array<string>>} - Generated tags
     */
    async generateDocumentTags(content) {
        const prompt = `Analyze this document and generate 3-5 relevant tags/categories.
Return ONLY a JSON array of lowercase tag strings.

Document excerpt:
${content.substring(0, 3000)}

Tags:`;

        try {
            const result = await this.model.generateContent(prompt);
            const text = result.response.text().trim();
            const match = text.match(/\[[\s\S]*?\]/);
            if (match) {
                return JSON.parse(match[0]);
            }
        } catch (error) {
            console.error('❌ Tag generation error:', error.message);
        }

        return [];
    }
}

// Singleton instance
const geminiService = new GeminiService();

export default geminiService;
