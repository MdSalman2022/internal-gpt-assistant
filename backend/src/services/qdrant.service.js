import { QdrantClient } from '@qdrant/js-client-rest';
import config from '../config/index.js';

class QdrantService {
    constructor() {
        this.client = new QdrantClient({
            url: config.qdrant.url,
            apiKey: config.qdrant.apiKey,
        });
        this.collectionName = config.qdrant.collection;
        this.vectorSize = 768; // Gemini embedding-001 dimension
    }

    /**
     * Initialize collection if it doesn't exist
     */
    async initCollection() {
        try {
            const collections = await this.client.getCollections();
            const exists = collections.collections.some(
                (c) => c.name === this.collectionName
            );

            if (!exists) {
                await this.client.createCollection(this.collectionName, {
                    vectors: {
                        size: this.vectorSize,
                        distance: 'Cosine',
                    },
                });
                console.log(`✅ Created Qdrant collection: ${this.collectionName}`);
            } else {
                console.log(`✅ Qdrant collection exists: ${this.collectionName}`);
            }

            // These calls are idempotent or will fail benignly if index exists
            const indexes = [
                'isGlobal', 'uploadedBy', 'conversationId', 'documentId', 'chunkIndex',
                // ACL fields for filtering
                'accessLevel', 'allowedUsers', 'allowedDepartments', 'allowedTeams'
            ];
            const schemas = {
                isGlobal: 'bool',
                uploadedBy: 'keyword',
                conversationId: 'keyword',
                documentId: 'keyword',
                chunkIndex: 'integer',
                // ACL field schemas
                accessLevel: 'keyword',
                allowedUsers: 'keyword',
                allowedDepartments: 'keyword',
                allowedTeams: 'keyword'
            };

            for (const field of indexes) {
                try {
                    await this.client.createPayloadIndex(this.collectionName, {
                        field_name: field,
                        field_schema: schemas[field],
                        wait: true,
                    });
                } catch (error) {
                    // Ignore error if index already exists
                    if (!error.message?.includes('already exists')) {
                        console.warn(`⚠️ Failed to create index for ${field}:`, error.message);
                    }
                }
            }
            console.log('✅ Qdrant payload indexes verified');

        } catch (error) {
            console.error('❌ Qdrant init error:', error.message);
            throw error;
        }
    }

    /**
     * Store document chunks with embeddings
     * @param {Array} chunks - Array of {id, vector, payload}
     */
    async upsertChunks(chunks) {
        try {
            const points = chunks.map((chunk) => ({
                id: chunk.id,
                vector: chunk.vector,
                payload: {
                    documentId: chunk.documentId,
                    documentTitle: chunk.documentTitle,
                    content: chunk.content,
                    chunkIndex: chunk.chunkIndex,
                    pageNumber: chunk.pageNumber || null,
                    // RBAC Fields
                    uploadedBy: chunk.uploadedBy,
                    conversationId: chunk.conversationId,
                    isGlobal: chunk.isGlobal,
                    accessLevel: chunk.accessLevel,
                    allowedUsers: chunk.allowedUsers,
                    allowedDepartments: chunk.allowedDepartments,
                    allowedTeams: chunk.allowedTeams,
                    metadata: chunk.metadata || {},
                },
            }));

            await this.client.upsert(this.collectionName, {
                wait: true,
                points,
            });

            return points.length;
        } catch (error) {
            console.error('❌ Qdrant upsert error:', error.message);
            throw error;
        }
    }

    /**
     * Semantic search for similar chunks
     * @param {Array} queryVector - Query embedding
     * @param {Object} options - Search options
     */
    async search(queryVector, options = {}) {
        const { limit = 5, scoreThreshold, filter = null } = options;
        const actualThreshold = scoreThreshold !== undefined ? scoreThreshold : 0.35;

        try {
            const results = await this.client.search(this.collectionName, {
                vector: queryVector,
                limit,
                score_threshold: actualThreshold,
                with_payload: true,
                filter: filter,
            });

            return results.map((result) => ({
                id: result.id,
                score: result.score,
                ...result.payload,
            }));
        } catch (error) {
            console.error('❌ Qdrant search error:', error.message);
            throw error;
        }
    }

    /**
     * Delete all chunks for a document
     * @param {string} documentId 
     */
    async deleteByDocument(documentId) {
        try {
            await this.client.delete(this.collectionName, {
                wait: true,
                filter: {
                    must: [
                        {
                            key: 'documentId',
                            match: { value: documentId },
                        },
                    ],
                },
            });
        } catch (error) {
            console.error('❌ Qdrant delete error:', error.message);
            throw error;
        }
    }

    /**
     * Count vectors for a specific document
     * @param {string} documentId
     */
    async countVectors(documentId) {
        try {
            const result = await this.client.count(this.collectionName, {
                filter: {
                    must: [
                        {
                            key: 'documentId',
                            match: { value: documentId },
                        },
                    ],
                },
                exact: true,
            });
            return result.count;
        } catch (error) {
            console.error('❌ Qdrant count error:', error.message);
            return 0;
        }
    }

    /**
     * Get collection stats
     */
    async getStats() {
        try {
            const info = await this.client.getCollection(this.collectionName);
            return {
                vectorsCount: info.vectors_count,
                pointsCount: info.points_count,
                status: info.status,
            };
        } catch (error) {
            console.error('❌ Qdrant stats error:', error.message);
            throw error;
        }
    }

    /**
     * Clear ALL vectors from the collection (use with caution!)
     * This is useful for cleaning up orphaned vectors
     */
    async clearAllVectors() {
        try {
            // Delete and recreate the collection
            await this.client.deleteCollection(this.collectionName);
            console.log(`🗑️ Deleted Qdrant collection: ${this.collectionName}`);

            // Recreate it
            await this.client.createCollection(this.collectionName, {
                vectors: {
                    size: this.vectorSize,
                    distance: 'Cosine',
                },
            });
            console.log(`✅ Recreated Qdrant collection: ${this.collectionName}`);

            return { success: true, message: 'All vectors cleared' };
        } catch (error) {
            console.error('❌ Qdrant clear error:', error.message);
            throw error;
        }
    }

    /**
     * Update payload for all chunks of a document (e.g. for ACL updates)
     * @param {string} documentId 
     * @param {Object} payloadUpdates 
     */
    async updateDocumentPayload(documentId, payloadUpdates) {
        try {
            // Qdrant allows updating payload by filter.
            // setPayload(collection_name, { payload: {}, filter: {} })

            await this.client.setPayload(this.collectionName, {
                payload: payloadUpdates,
                filter: {
                    must: [
                        { key: "documentId", match: { value: documentId } }
                    ]
                }
            });

            console.log(`✅ Updated payload for document: ${documentId}`, payloadUpdates);
            return true;
        } catch (error) {
            console.error('❌ Qdrant payload update error:', error.message);
            // Fallback: If filter based update is not supported by this client version,
            // we might need to fetch IDs and update. But qdrant-js-client usually supports it.
            throw error;
        }
    }

    /**
     * Build Qdrant filter for Access Control
     */
    buildAclFilter(user, conversationId) {
        // Helper for "Global" docs (where conversationId is null)
        // Correct Qdrant syntax: { is_null: { key: "fieldName" } }
        const isGlobalDoc = { is_null: { key: "conversationId" } };

        // Admin sees everything Global + Current Conversation
        if (user.role === 'admin') {
            const adminFilter = {
                should: [
                    isGlobalDoc
                ]
            };
            if (conversationId) {
                adminFilter.should.push({ key: "conversationId", match: { value: conversationId.toString() } });
            }
            return adminFilter;
        }

        // Logic:
        // 1. Matches this conversation (if applicable)
        // OR
        // 2. Is Global AND (Public OR (Dept Match) OR (Team Match) OR (User Match))
        // OR
        // 3. User is Owner (Global only) - If I own a doc in another chat, I shouldn't see it here? 
        //    Actually, "My Uploads" Usually implies everything I uploaded. 
        //    But for RAG, we want context relevance. 
        //    Let's restrict "Owner" to Global docs too, to prevent leaking chat-to-chat context unless explicitly desired.

        const aclConditions = [
            // 3. Owner (Global)
            {
                must: [
                    { key: "uploadedBy", match: { value: user._id.toString() } },
                    isGlobalDoc
                ]
            },
            // 2. Global Public
            {
                must: [
                    { key: "isGlobal", match: { value: true } },
                    { key: "accessLevel", match: { value: "public" } },
                    isGlobalDoc
                ]
            },
            // Explicit User Match (Global)
            {
                must: [
                    { key: "allowedUsers", match: { value: user._id.toString() } },
                    isGlobalDoc
                ]
            }
        ];

        // Dept Match (Global)
        if (user.department) {
            aclConditions.push({
                must: [
                    { key: "accessLevel", match: { value: "department" } },
                    { key: "allowedDepartments", match: { value: user.department } },
                    isGlobalDoc
                ]
            });
        }

        // Team Match (Global)
        if (user.teams && user.teams.length > 0) {
            aclConditions.push({
                must: [
                    { key: "allowedTeams", match: { any: user.teams } },
                    isGlobalDoc
                ]
            });
        }

        const globalAclFilter = {
            should: aclConditions
        };

        // If conversation context exists, we allow scoped docs OR the above Global ACL rules
        if (conversationId) {
            return {
                should: [
                    { key: "conversationId", match: { value: conversationId.toString() } },
                    globalAclFilter
                ]
            };
        }

        return globalAclFilter;
    }
}

// Singleton instance
const qdrantService = new QdrantService();

export default qdrantService;
