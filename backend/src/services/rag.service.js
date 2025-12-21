import geminiService from './gemini.service.js';
import qdrantService from './qdrant.service.js';
import { Document, Message } from '../models/index.js';
import { reciprocalRankFusion } from '../utils/chunker.js';
import config from '../config/index.js';

class RAGService {
    constructor() {
        // Simple in-memory cache for query embeddings
        this.embeddingCache = new Map();
        this.cacheMaxSize = 100;
    }

    /**
     * Optimized RAG Pipeline - Minimal API calls
     * 
     * API Calls per query:
     * 1. generateEmbedding (embedding model - cheap)
     * 2. generateAnswer (LLM model)
     * 
     * Removed to reduce costs:
     * - rewriteQuery (not needed, user query is usually fine)
     * - rerankResults (semantic search is usually good enough)
     */
    async query(userQuery, options = {}) {
        const {
            userId = null,
            conversationHistory = [],
            topK = config.rag.topK,
        } = options;

        const startTime = Date.now();
        const timings = {};

        try {
            // Step 1: Get embedding for search (1 API call - embedding model)
            const t1 = Date.now();
            const queryEmbedding = await this._getCachedEmbedding(userQuery);
            timings.embed = Date.now() - t1;

            // Step 2: Hybrid Search (no API calls - just Qdrant + MongoDB)
            const t2 = Date.now();
            const [semanticResults, keywordResults] = await Promise.all([
                qdrantService.search(queryEmbedding, {
                    limit: topK * 2,
                    scoreThreshold: 0.3,
                    filter: userId ? this._buildAccessFilter(userId) : null,
                }),
                this._keywordSearch(userQuery, topK * 2),
            ]);
            timings.search = Date.now() - t2;

            // Combine with Reciprocal Rank Fusion (no API call)
            const fusedResults = reciprocalRankFusion(
                [semanticResults, keywordResults],
                60
            );

            // Take top results directly (skip expensive reranking)
            const topResults = fusedResults.slice(0, topK);
            console.log(`🔍 Found ${fusedResults.length} results, using top ${topResults.length}`);

            // Step 3: Generate Answer (1 API call - LLM)
            const t3 = Date.now();
            const response = await geminiService.generateAnswer(
                userQuery,
                topResults,
                conversationHistory.slice(-4)
            );
            timings.generate = Date.now() - t3;

            // Build citations array
            const citations = response.citationsUsed.map((sourceNum) => {
                const result = topResults[sourceNum - 1];
                if (!result) return null;
                return {
                    documentId: result.documentId,
                    documentTitle: result.documentTitle,
                    chunkId: result.id,
                    content: result.content.substring(0, 200) + '...',
                    relevanceScore: result.score,
                    pageNumber: result.pageNumber,
                };
            }).filter(Boolean);

            const latency = Date.now() - startTime;

            console.log(`⏱️ RAG: ${latency}ms (embed: ${timings.embed}ms, search: ${timings.search}ms, generate: ${timings.generate}ms) - 2 API calls`);

            return {
                answer: response.answer,
                citations,
                confidence: response.confidence,
                isLowConfidence: response.isLowConfidence,
                latency,
                sourcesSearched: fusedResults.length,
            };
        } catch (error) {
            console.error('❌ RAG query error:', error.message);
            throw error;
        }
    }

    /**
     * Get cached embedding or generate new one
     */
    async _getCachedEmbedding(query) {
        const cacheKey = query.toLowerCase().trim();

        if (this.embeddingCache.has(cacheKey)) {
            console.log('💾 Using cached embedding');
            return this.embeddingCache.get(cacheKey);
        }

        const embedding = await geminiService.generateEmbedding(query);

        // Add to cache (with size limit)
        if (this.embeddingCache.size >= this.cacheMaxSize) {
            const firstKey = this.embeddingCache.keys().next().value;
            this.embeddingCache.delete(firstKey);
        }
        this.embeddingCache.set(cacheKey, embedding);

        return embedding;
    }

    /**
     * Keyword search using MongoDB text search
     */
    async _keywordSearch(query, limit) {
        try {
            const documents = await Document.find(
                { $text: { $search: query } },
                { score: { $meta: 'textScore' } }
            )
                .sort({ score: { $meta: 'textScore' } })
                .limit(limit)
                .lean();

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
     * Build access filter for Qdrant
     */
    _buildAccessFilter(userId) {
        return null; // TODO: Implement RBAC
    }

    /**
     * Get knowledge gaps
     */
    async getKnowledgeGaps(limit = 20) {
        try {
            const lowConfidenceMessages = await Message.find({
                role: 'assistant',
                isLowConfidence: true,
            })
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

const ragService = new RAGService();

export default ragService;
