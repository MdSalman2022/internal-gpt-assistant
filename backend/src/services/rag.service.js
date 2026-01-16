/**
 * RAG Service
 * 
 * Retrieval-Augmented Generation pipeline.
 * Uses the unified AI service for provider switching.
 */

import aiService from './ai.service.js';
import qdrantService from './qdrant.service.js';
import guardrailService from './guardrail.service.js';
import documentService from './document.service.js';
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
        const { userId, organizationId, conversationId, conversationHistory = [], provider, targetDocumentIds } = options;
        const startTime = Date.now();

        try {
            console.log('🔍 RAG Query:', { userQuery, options: { ...options, conversationHistory: 'truncated' } });

            // 0. GUARDRAIL CHECK - PII & Prompt Injection Detection
            const guardrailResult = guardrailService.analyze(userQuery, 'redact');

            if (guardrailResult.findings.length > 0) {
                console.log('🛡️ Guardrail Findings:', guardrailResult.findings);
            }

            // If blocked (e.g., prompt injection detected), return early
            if (guardrailResult.blocked) {
                console.warn('⛔ Guardrail BLOCKED request:', guardrailResult.findings);
                return {
                    answer: "I'm sorry, but I cannot process this request. It appears to contain content that violates our safety guidelines.",
                    citations: [],
                    confidence: 0,
                    blocked: true,
                    blockedReason: guardrailResult.hasInjection ? 'prompt_injection' : 'pii_detected',
                    guardrailFindings: guardrailResult.findings, // For audit logging
                    latency: Date.now() - startTime
                };
            }

            // Store findings for later audit (even if not blocked, PII was redacted)
            const guardrailFindings = guardrailResult.findings;

            // Use redacted text for the rest of the pipeline
            const safeQuery = guardrailResult.redactedText;

            // 1. Generate embedding for user query (using safe/redacted version)
            const queryEmbedding = await aiService.generateEmbedding(safeQuery);

            // 2. Build Search Filter (Simplified for MongoDB-centric ACL)
            let searchFilter = {};

            if (targetDocumentIds && targetDocumentIds.length > 0) {
                // If targets are provided, strictly limit to them
                searchFilter = {
                    must: [
                        { key: 'documentId', match: { any: targetDocumentIds.map(id => id.toString()) } }
                    ]
                };
            } else if (conversationId) {
                // If in a conversation, optionally prioritize/filter by context
                // But generally we search broadly and filter by permission later.
                // However, to keep it clean, we can scope to (Global OR CurrentConversation)
                // This prevents leaking chunks from *other* conversations if we don't trust "Global" flag enough.
                searchFilter = {
                    should: [
                        { is_null: { key: "conversationId" } }, // Global
                        { key: "conversationId", match: { value: conversationId.toString() } }
                    ]
                };
            } else {
                // Global chat - only global docs
                searchFilter = {
                    is_null: { key: "conversationId" }
                };
            }

            console.log('🎯 RAG Search Filter (Broad):', JSON.stringify(searchFilter, null, 2));

            // 3. Perform Searches (Semantic + Keyword)
            // Fetch MORE candidates (e.g. 50) to allow for ACL filtering drop-off
            const searchLimit = 50;

            const [semanticResults, keywordResults] = await Promise.all([
                qdrantService.search(queryEmbedding, {
                    limit: searchLimit,
                    scoreThreshold: targetDocumentIds && targetDocumentIds.length > 0 ? 0.01 : 0.35,
                    filter: searchFilter,
                }),
                this._keywordSearch(userQuery, searchLimit, userId, conversationId, targetDocumentIds),
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

            // --- PERMISSION FILTERING START ---
            // Extract unique Document IDs
            const candidateDocumentIds = [...new Set(allChunks.map(c => c.documentId || c.payload?.documentId))].filter(Boolean);

            if (candidateDocumentIds.length > 0) {
                // Check permissions against MongoDB
                // options.user contains { _id, role, departments, teams, email }
                const allowedDocumentIds = await documentService.filterAccessibleDocuments({
                    userId: options.user._id,
                    userRole: options.user.role,
                    userEmail: options.user.email,
                    departments: options.user.departments,
                    teams: options.user.teams,
                    documentIds: candidateDocumentIds,
                    organizationId: organizationId  // CRITICAL: Multi-tenant isolation
                });

                const allowedSet = new Set(allowedDocumentIds);
                console.log(`🔒 ACL Filtering: ${candidateDocumentIds.length} candidates -> ${allowedDocumentIds.length} allowed`);

                // Filter chunks
                allChunks = allChunks.filter(c => {
                    const docId = c.documentId || c.payload?.documentId;
                    return allowedSet.has(docId);
                });
            }
            // --- PERMISSION FILTERING END ---

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
                    model: generalResponse.model,
                    tokens: generalResponse.tokens, // For usage tracking
                    guardrailFindings, // Include for audit logging
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
                    guardrailFindings, // Include for audit logging
                    latency: Date.now() - startTime
                };
            }

            // 5. Generate Answer with VALID chunks (Multi-Tenant)
            console.log(`🤖 Sending to AI (${provider || 'default'}): ${validContextChunks.length} chunks`);
            
            // Use new multi-tenant method if organizationId is available
            const response = await (organizationId 
                ? aiService.generateAnswerForOrg(userQuery, validContextChunks, {
                    provider,
                    organizationId
                })
                : aiService.generateAnswer(userQuery, validContextChunks, {
                    provider,
                    history: conversationHistory
                }));

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
                model: response.model,
                tokens: response.tokens, // For usage tracking
                latency: Date.now() - startTime,
                sourcesSearched: uniqueResults.length,
                guardrailFindings, // For audit logging of redactions
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
     * 1. Global documents (Public)
     * 2. Department/Team/User-specific documents
     * 3. Documents scoped to this conversation
     */
    _buildAccessFilter(user, conversationId) {
        return qdrantService.buildAclFilter(user, conversationId);
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
