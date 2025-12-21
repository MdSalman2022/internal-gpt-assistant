import geminiService from './gemini.service.js';
import qdrantService from './qdrant.service.js';
import { Document, Message } from '../models/index.js';
import { reciprocalRankFusion } from '../utils/chunker.js';
import config from '../config/index.js';

class RAGService {
    /**
     * Advanced RAG Pipeline
     * 1. Query Rewriting
     * 2. Hybrid Search (Semantic + Keyword)
     * 3. Reranking
     * 4. Answer Generation with Citations
     */
    async query(userQuery, options = {}) {
        const {
            userId = null,
            conversationHistory = [],
            topK = config.rag.topK,
        } = options;

        const startTime = Date.now();

        try {
            // Step 1: Query Rewriting
            const rewrittenQuery = await geminiService.rewriteQuery(userQuery);
            console.log(`📝 Rewritten: "${rewrittenQuery}"`);

            // Step 2: Generate query embedding
            const queryEmbedding = await geminiService.generateEmbedding(rewrittenQuery);

            // Step 3: Hybrid Search
            // 3a. Semantic search via Qdrant
            const semanticResults = await qdrantService.search(queryEmbedding, {
                limit: topK * 2, // Get more for reranking
                scoreThreshold: 0.3,
                filter: userId ? this._buildAccessFilter(userId) : null,
            });

            // 3b. Keyword search via MongoDB (BM25-style)
            const keywordResults = await this._keywordSearch(userQuery, topK * 2);

            // 3c. Combine with Reciprocal Rank Fusion
            const fusedResults = reciprocalRankFusion(
                [semanticResults, keywordResults],
                60
            );

            // Step 4: Reranking with Gemini
            const rerankedResults = await geminiService.rerankResults(
                userQuery,
                fusedResults.slice(0, topK * 2)
            );

            // Take top K after reranking
            const topResults = rerankedResults.slice(0, topK);

            // Step 5: Generate Answer with Citations
            const response = await geminiService.generateAnswer(
                userQuery,
                topResults,
                conversationHistory
            );

            // Build citations array
            const citations = response.citationsUsed.map((sourceNum) => {
                const result = topResults[sourceNum - 1];
                if (!result) return null;
                return {
                    documentId: result.documentId,
                    documentTitle: result.documentTitle,
                    chunkId: result.id,
                    content: result.content.substring(0, 200) + '...',
                    relevanceScore: result.rerankScore || result.score,
                    pageNumber: result.pageNumber,
                };
            }).filter(Boolean);

            const latency = Date.now() - startTime;

            return {
                answer: response.answer,
                citations,
                confidence: response.confidence,
                isLowConfidence: response.isLowConfidence,
                rewrittenQuery,
                latency,
                sourcesSearched: fusedResults.length,
            };
        } catch (error) {
            console.error('❌ RAG query error:', error.message);
            throw error;
        }
    }

    /**
     * Keyword search using MongoDB text search
     */
    async _keywordSearch(query, limit) {
        try {
            // Search documents by title and tags
            const documents = await Document.find(
                { $text: { $search: query } },
                { score: { $meta: 'textScore' } }
            )
                .sort({ score: { $meta: 'textScore' } })
                .limit(limit)
                .lean();

            // Convert to same format as Qdrant results
            return documents.map((doc) => ({
                id: doc._id.toString(),
                documentId: doc._id.toString(),
                documentTitle: doc.title,
                content: doc.description || '',
                score: doc.score || 0,
            }));
        } catch (error) {
            console.error('❌ Keyword search error:', error.message);
            return [];
        }
    }

    /**
     * Build access filter for Qdrant based on user permissions
     */
    _buildAccessFilter(userId) {
        // For now, return null (no filtering)
        // TODO: Implement proper RBAC filtering
        return null;
    }

    /**
     * Get related/similar questions
     */
    async getSimilarQuestions(query, limit = 5) {
        try {
            const embedding = await geminiService.generateEmbedding(query);

            // Search in message history
            const recentMessages = await Message.find({ role: 'user' })
                .sort({ createdAt: -1 })
                .limit(100)
                .lean();

            // Simple similarity would need embeddings stored
            // For now, return empty - can enhance later
            return [];
        } catch (error) {
            console.error('❌ Similar questions error:', error.message);
            return [];
        }
    }

    /**
     * Get analytics on knowledge gaps (unanswered/low-confidence queries)
     */
    async getKnowledgeGaps(limit = 20) {
        try {
            const lowConfidenceMessages = await Message.find({
                role: 'assistant',
                isLowConfidence: true,
            })
                .populate('conversationId')
                .sort({ createdAt: -1 })
                .limit(limit)
                .lean();

            return lowConfidenceMessages.map((msg) => ({
                id: msg._id,
                answer: msg.content.substring(0, 200),
                createdAt: msg.createdAt,
                confidence: msg.confidence,
            }));
        } catch (error) {
            console.error('❌ Knowledge gaps error:', error.message);
            return [];
        }
    }
}

// Singleton instance
const ragService = new RAGService();

export default ragService;
