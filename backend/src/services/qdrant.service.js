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

    // Initialize Qdrant collection
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
                'accessLevel', 'allowedUsers', 'allowedDepartments', 'allowedTeams', 'allowedUserEmails'
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
                allowedTeams: 'keyword',
                allowedUserEmails: 'keyword'
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

    // Store chunks with embeddings
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
                    // Broad Scoping Fields
                    uploadedBy: chunk.uploadedBy,
                    conversationId: chunk.conversationId,
                    isGlobal: chunk.isGlobal,
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

    // Semantic search for similar chunks
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

    // Delete document chunks
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

    // Count chunks for a document
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

    // Get collection statistics
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

    // Clear all vectors (use with caution)
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

    // Update payload for document chunks
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
            // Fallback for payload updates
            throw error;
        }
    }

    // Build Access Control filter
    buildAclFilter(user, conversationId) {
        // Helper for "Global" docs (where conversationId is null)
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

        // Standard User Scope:
        // 1. Current Conversation
        // 2. Global Docs (which will be filtered by permission later)

        const scopeFilter = {
            should: [
                isGlobalDoc
            ]
        };

        if (conversationId) {
            scopeFilter.should.push({ key: "conversationId", match: { value: conversationId.toString() } });
        }

        return scopeFilter;
    }
}

// Singleton instance
const qdrantService = new QdrantService();

export default qdrantService;
