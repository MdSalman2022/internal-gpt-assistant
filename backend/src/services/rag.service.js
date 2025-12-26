/**
 * RAG Service
 * 
 * Retrieval-Augmented Generation pipeline.
 * Uses the unified AI service for provider switching.
 */

import aiService from './ai.service.js';
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
     * @param {string} userQuery - The user's question
     * @param {Object} options - Query options
     * @param {string} options.provider - AI provider to use ('gemini', 'openai', 'anthropic')
     * @param {string} options.userId - User ID for access filtering
     * @param {Array} options.conversationHistory - Previous messages for context
     * @param {number} options.topK - Number of results to retrieve
     */
    async query(userQuery, options = {}) {
        const { userId, conversationId, conversationHistory = [], provider, targetDocumentIds } = options;
        const startTime = Date.now();

        try {
            console.log('🔍 RAG Query:', { userQuery, options: { ...options, conversationHistory: 'truncated' } });

            // 1. Generate embedding for user query
            const queryEmbedding = await aiService.generateEmbedding(userQuery);

            // 2. Build Search Filter
            let searchFilter = {};

            if (targetDocumentIds && targetDocumentIds.length > 0) {
                // If targets are provided, we strictly limit to them.
                // We use 'any' match for better performance on multiple IDs.
                searchFilter = {
                    must: [
                        { key: 'documentId', match: { any: targetDocumentIds.map(id => id.toString()) } }
                    ]
                };
            } else {
                // Otherwise use standard RBAC access filter
                searchFilter = this._buildAccessFilter(userId, conversationId);
            }

            console.log('🎯 RAG Search Filter:', JSON.stringify(searchFilter, null, 2));

            // 3. Perform Searches (Semantic + Keyword)
            const [semanticResults, keywordResults] = await Promise.all([
                qdrantService.search(queryEmbedding, {
                    limit: 15,
                    scoreThreshold: targetDocumentIds && targetDocumentIds.length > 0 ? 0.01 : 0.35,
                    filter: searchFilter,
                }),
                this._keywordSearch(userQuery, 10, userId, conversationId, targetDocumentIds),
            ]);

            console.log(`📡 RAG Search Results: Semantic=${semanticResults.length}, Keyword=${keywordResults.length}`);

            // 4. Combine and Deduplicate Chunks
            let allChunks = [...semanticResults];

            // SPECIAL STEP: Force fetch headers (Page 1) of target documents
            if (targetDocumentIds && targetDocumentIds.length > 0) {
                try {
                    const headerSearch = await qdrantService.search(queryEmbedding, {
                        limit: targetDocumentIds.length,
                        scoreThreshold: 0.0,
                        filter: {
                            must: [
                                { key: 'documentId', match: { any: targetDocumentIds.map(id => id.toString()) } },
                                { key: 'chunkIndex', match: { value: 0 } }
                            ]
                        }
                    });
                    console.log(`📌 RAG Header Search: Found ${headerSearch.length} headers`);
                    allChunks = [...headerSearch, ...allChunks];
                } catch (e) {
                    console.warn('⚠️ Failed to fetch file headers (non-critical):', e.message);
                }
            }

            allChunks = [...allChunks, ...keywordResults];

            // Deduplicate
            const seen = new Set();
            const uniqueResults = [];
            for (const chunk of allChunks) {
                const id = chunk.id || chunk.payload?.id || chunk.content;
                if (!seen.has(id)) {
                    seen.add(id);
                    uniqueResults.push(chunk);
                }
            }

            const contextChunks = uniqueResults.slice(0, 15).map(match => ({
                id: match.id || match.payload?.id,
                content: match.payload?.content || match.content,
                documentId: match.payload?.documentId || match.documentId,
                score: match.score,
                metadata: match.payload?.metadata,
                pageNumber: match.payload?.pageNumber,
                documentTitle: match.payload?.documentTitle || match.documentTitle || 'Untitled Document'
            }));

            if (contextChunks.length === 0) {
                console.log('⚠️ No context chunks found. Attempting general conversation fallback.');

                // Fallback: Ask AI directly without context
                // This allows answering "Hello", "How are you", etc.
                const generalResponse = await aiService.generateAnswer(userQuery, [], {
                    provider,
                    history: conversationHistory,
                    systemPrompt: "You are a helpful AI assistant. If the user asks a general question or greeting that doesn't need document context, answer it naturally and politely. If the user asks a specific question about company documents that you don't have context for, apologize and state that you couldn't find the information in the documents."
                });

                return {
                    answer: generalResponse.answer,
                    citations: [],
                    confidence: generalResponse.confidence,
                    sourcesSearched: 0,
                    provider: generalResponse.provider,
                    latency: Date.now() - startTime
                };
            }

            // FILTER: Remove empty chunks to prevent "No content available" citations
            const validContextChunks = contextChunks.filter(chunk => chunk.content && chunk.content.trim().length > 0);

            if (validContextChunks.length === 0) {
                // Double check if we filtered everything out
                console.log('⚠️ All context chunks were empty. Fallback to general.');
                // ... (Same fallback logic potentially, or just return empty)
                return {
                    answer: "I found some documents but they appear to be empty. I cannot answer based on them.",
                    citations: [],
                    confidence: 0,
                    sourcesSearched: uniqueResults.length,
                    latency: Date.now() - startTime
                };
            }

            // 5. Generate Answer with VALID chunks
            console.log(`🤖 Sending to AI (${provider || 'default'}): ${validContextChunks.length} chunks`);
            const response = await aiService.generateAnswer(userQuery, validContextChunks, {
                provider,
                history: conversationHistory
            });

            // 6. Extract AND Re-index Citations
            // We want citations to be sequential [1], [2], [3] in the text
            const { answer: reindexedAnswer, citations } = this._processCitations(response.answer, validContextChunks);

            // Update stats
            const citedDocIds = [...new Set(citations.map(c => c.documentId))];
            if (citedDocIds.length > 0) {
                this._updateDocumentStats(citedDocIds);
            }

            return {
                answer: reindexedAnswer,
                citations,
                confidence: response.confidence,
                isLowConfidence: response.isLowConfidence,
                provider: response.provider,
                latency: Date.now() - startTime,
                sourcesSearched: uniqueResults.length,
                timings: {
                    total: Date.now() - startTime,
                    // Estimate timings for now as they aren't explicitly tracked per step yet
                    search: Math.floor((Date.now() - startTime) * 0.3),
                    generate: Math.floor((Date.now() - startTime) * 0.7)
                }
            };

        } catch (error) {
            console.error('❌ RAG Pipeline failed:', error);

            // Log response data if available (e.g. from Axios or Gemini SDK)
            if (error.response?.data) {
                console.error('❌ Error response data:', JSON.stringify(error.response.data, null, 2));
            }

            // Improve error message for frontend
            let finalMessage = error.message;
            if (error.message === 'Bad Request' && error.response?.data?.error?.message) {
                finalMessage = `Bad Request: ${error.response.data.error.message}`;
            } else if (error.status) {
                finalMessage = `Error ${error.status}: ${error.message}`;
            }

            const enhancedError = new Error(finalMessage);
            enhancedError.status = error.status || 500;
            enhancedError.response = error.response;
            throw enhancedError;
        }
    }

    /**
     * Re-index citations to be sequential (1, 2, 3...)
     * Returns updated answer text and matching citations array
     */
    _processCitations(answerText, sourceChunks) {
        const citations = [];
        const sourceMap = new Map(); // Old Source Num -> New Source Num
        let nextIndex = 1;

        // Regex to find [Source X] or [Source X, Y]
        // This handles "Source 1", "Source 1, 2", "Source 1,2"
        const sourcePattern = /\[Source\s+((?:\d+(?:\s*,\s*)?)+)\]/gi;

        const reindexedAnswer = answerText.replace(sourcePattern, (match, numsStr) => {
            // Split "1, 2" into [1, 2]
            const oldNums = numsStr.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));

            const newNums = oldNums.map(oldNum => {
                // If we haven't seen this source before, assign a new index
                if (!sourceMap.has(oldNum)) {
                    // Check if oldNum is valid index into sourceChunks (1-based from chunks)
                    const chunk = sourceChunks[oldNum - 1];
                    if (chunk) {
                        sourceMap.set(oldNum, nextIndex);

                        // Add to citations list
                        citations.push({
                            documentId: chunk.documentId,
                            documentTitle: chunk.documentTitle || 'Untitled Document',
                            chunkId: chunk.id,
                            content: chunk.content?.substring(0, 300) + '...', // Longer preview
                            relevanceScore: chunk.score,
                            pageNumber: chunk.pageNumber,
                            sourceNum: nextIndex
                        });

                        nextIndex++;
                    } else {
                        // Source mismatch (LLM hallucinated a number out of range)
                        return null;
                    }
                }
                return sourceMap.get(oldNum);
            }).filter(n => n !== null); // Remove invalid sources

            if (newNums.length === 0) return ''; // Remove empty citation reference

            return `[Source ${newNums.join(', ')}]`;
        });

        // Dedup citation array relative to the *text* appearance? 
        // No, the citations array should match the distinct sources used.
        // sourceMap tracks unique *chunks*. 
        // We return the citations in order of discovery (1, 2, 3...)

        return {
            answer: reindexedAnswer,
            citations: citations
        };
    }

    /**
     * Update document usage statistics
     */
    async _updateDocumentStats(documentIds) {
        try {
            await Document.updateMany(
                { _id: { $in: documentIds } },
                {
                    $inc: { queryCount: 1 },
                    $set: { lastAccessedAt: new Date() }
                }
            );
        } catch (error) {
            console.error('⚠️ Failed to update document stats:', error.message);
        }
    }

    /**
     * Get cached embedding or generate new one
     * Always uses Gemini for embeddings (consistent vector dimensions)
     */
    async _getCachedEmbedding(query) {
        const cacheKey = query.toLowerCase().trim();

        if (this.embeddingCache.has(cacheKey)) {
            console.log('💾 Using cached embedding');
            return this.embeddingCache.get(cacheKey);
        }

        const embedding = await aiService.generateEmbedding(query);

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
    async _keywordSearch(query, limit, userId, conversationId, targetDocumentIds = []) {
        try {
            const filter = { $text: { $search: query } };

            // If specific targets are provided, strictly limit to them
            if (targetDocumentIds && targetDocumentIds.length > 0) {
                filter._id = { $in: targetDocumentIds };
            } else {
                // STRICT RBAC Filter
                // 1. Global docs: isGlobal = true
                // 2. Conversation docs: conversationId = currentId
                // 3. Private user docs: uploadedBy = user AND conversationId is NULL (user's personal lib)

                const orConditions = [
                    { isGlobal: true }
                ];

                if (conversationId) {
                    orConditions.push({ conversationId: conversationId });
                }

                if (userId) {
                    orConditions.push({
                        uploadedBy: userId,
                        conversationId: null
                    });
                }

                if (orConditions.length > 0) {
                    filter.$or = orConditions;
                }
            }

            const documents = await Document.find(
                filter,
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
     * 
     * Users can access:
     * 1. Global documents (isGlobal: true)
     * 2. Documents they uploaded
     * 3. Documents scoped to this conversation
     */
    _buildAccessFilter(userId, conversationId) {
        // Strict Isolation Logic for Qdrant
        const should = [
            // 1. Global docs
            { key: 'isGlobal', match: { value: true } },
        ];

        if (conversationId) {
            // 2. Specific conversation docs
            should.push({ key: 'conversationId', match: { value: conversationId.toString() } });
        }

        // 3. My private docs (NOT part of any conversation)
        // Note: Qdrant filter for "is null" is tricky. 
        // We often check "uploadedBy" AND Must Not "conversationId" exists?
        // Simpler approach: If we want strict isolation, we rely on the fact that 
        // chat uploads have "conversationId" set.
        // If we want to allow "My Global Docs" vs "My Chat Docs".

        // Strategy:
        // Users can search:
        // A. Global Docs
        // B. Docs in THIS conversation
        // C. Docs uploaded by ME that are NOT assigned to a conversation (personal library)

        // However, complex boolean logic in Qdrant (A OR (B) OR (C AND NOT D)) needs nested filters.

        // Since Qdrant "should" is OR.

        // Filter: (isGlobal=true) OR (conversationId=current) OR (uploadedBy=Me AND conversationId=null)
        // But Qdrant payloads usually don't store null fields, they are missing.
        // We can check strict match for conversationId="null" string if we stored it that way?
        // Or we just allow uploadedBy=Me. But that leaks chat docs.

        // Workaround: We will strictly enforce that chat docs are ONLY reachable via conversationId.
        // If I want to search my non-conversation docs, I need a 'personal' scope.

        // For simplicity and user request "chat docs stay in chat":
        // We will add (uploadedBy=Me) BUT we need to exclude other convos.
        // Qdrant doesn't support "value is missing" easily in simple filters.

        // Let's rely on the fact that general docs have conversationId = null or "global".

        // If we assumed all chat docs have conversationId set to a string.
        // And personal docs have conversationId missing.

        // We can add a "must_not" clause for conversationId? 
        // No, because we want to allow the CURRENT conversationId.

        // Let's use nested filter group for the "User Personal" part.

        // OR [
        //   { isGlobal: true },
        //   { conversationId: currentId },
        //   { must: [ { uploadedBy: Me }, { must_not: { field: "conversationId" } } ] } -- "Field exists" check?
        // ]

        // Easier: Just index "isChat" boolean? No.

        // Let's proceed with:
        // Global OR Current Chat. 
        // User explicitly asked: "uploaded documents inside chat wont be inside documents for any user even for admin."
        // Meaning chat docs are Ephemeral/Context-only.

        // What about "My Documents" page uploads? 
        // They should be available everywhere? Or just in documents page?
        // "only the documents chat will be for everyone and every chat accessible" -> Only global docs.

        // So:
        // 1. Docs uploaded in Chat -> Only that Chat.
        // 2. Docs uploaded in /documents -> Available everywhere (Global).
        // 3. What about "Private" docs in /documents? 
        // If the user says "only the documents chat will be for everyone", they might mean Global.

        // If we simplify:
        // A doc is either Global (public) or Private (Chat-scoped).
        // Is there a "Private Global" (my personal docs available in all my chats)?
        // The user said: "in new chat it shouldnt be there".
        // This implies files I upload in Chat A should NOT satisfy "uploadedBy: Me" in Chat B.

        // SO: We REMOVE `uploadedBy` from the main OR block, unless we can ensure it's not a chat doc.
        // However, if we assume documents created via "Upload Document" button on dashboard are "Global" (isGlobal=true).
        // Then we are good.

        // Whatever I upload in Dashboard -> isGlobal=true (Accessible by everyone as per "documents chat will be for everyone").
        // Wait, "documents chat" might be a typo for "documents page"?
        // "onlythe documents chat will be for everyone... accessible" -> likely "only the documents [from] chat [page]..." NO.
        // "only the documents [uploaded in messages?]... for everyone"?

        // Let's re-read: "the uploaded documents inside chat wont be inside documents for any user even for admin." -> Chat docs are hidden/private.
        // "onlythe documents chat will be for everyone and every chat accessible." -> Typo. 
        // Context: "Documents [section/page] will be for everyone". 
        // Meaning: Docs in "Documents" page are Global. Docs in Chat are Local.

        // So:
        // Filter = (isGlobal=true) OR (conversationId=currentId).
        // We REMOVE the generic (uploadedBy=Me). 
        // This satisfies "in new chat it shouldnt be there".

        return { should };
    }

    /**
     * Verify vector count matches chunk count
     */
    async verifyVectorSync(documentId) {
        try {
            const doc = await Document.findById(documentId);
            if (!doc) return null;

            const vectorCount = await qdrantService.countVectors(documentId);

            doc.vectorCount = vectorCount;
            doc.lastVectorSync = new Date();
            await doc.save();

            return {
                documentId,
                chunkCount: doc.chunkCount,
                vectorCount,
                inSync: doc.chunkCount === vectorCount,
            };
        } catch (error) {
            console.error('❌ Vector sync check error:', error.message);
            return null;
        }
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

    /**
     * Get available AI providers
     */
    getAvailableProviders() {
        return aiService.getAvailableProviders();
    }
}

const ragService = new RAGService();

export default ragService;
