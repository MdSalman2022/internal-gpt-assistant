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
        const { limit = 5, scoreThreshold = 0.5, filter = null } = options;

        try {
            const results = await this.client.search(this.collectionName, {
                vector: queryVector,
                limit,
                score_threshold: scoreThreshold,
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
}

// Singleton instance
const qdrantService = new QdrantService();

export default qdrantService;
