import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { v4 as uuidv4 } from 'uuid';
import { Document } from '../models/index.js';
import geminiService from './gemini.service.js';
import qdrantService from './qdrant.service.js';
import cloudinaryService from './cloudinary.service.js';
import { chunkText, cleanText } from '../utils/chunker.js';

class DocumentService {
    // Upload file to Cloudinary and create document record
    // options.conversationId - if provided, document is scoped to that conversation only
    async uploadAndCreateDocument(fileBuffer, fileName, mimeType, userId, options = {}) {
        try {
            console.log(`🚀 Starting upload for: ${fileName}, Type: ${mimeType}, Size: ${fileBuffer.length}`);

            // Upload to Cloudinary
            const cloudinaryResult = await cloudinaryService.uploadFile(fileBuffer, {
                public_id: `doc_${uuidv4()}`,
                resource_type: 'raw', // For non-image files like PDFs
            });

            console.log('✅ Cloudinary upload success:', cloudinaryResult.publicId);

            // Create document record in MongoDB
            const document = new Document({
                title: fileName.replace(/\.[^/.]+$/, ''), // Remove extension
                originalName: fileName,
                mimeType,
                size: cloudinaryResult.bytes,
                source: {
                    type: 'upload',
                    url: cloudinaryResult.url,
                    cloudinaryId: cloudinaryResult.publicId,
                },
                uploadedBy: userId,
                status: 'pending',
                // Conversation scope - if set, only visible in that conversation's context
                conversationId: options.conversationId || null,
                isGlobal: !options.conversationId, // Global = available to all users

                // ACL
                accessLevel: options.accessLevel || 'private',
                allowedDepartments: options.allowedDepartments || [],
                allowedTeams: options.allowedTeams || [],
                allowedUsers: options.allowedUsers || [],
            });

            await document.save();
            const scope = options.conversationId ? 'conversation-scoped' : 'global';
            console.log(`💾 Document saved to MongoDB: ${document._id} (${scope})`);

            return document;
        } catch (error) {
            console.error('❌ Error in uploadAndCreateDocument:', error);
            throw error;
        }
    }

    // Process document: download from Cloudinary, extract text, chunk, embed, store
    async processDocument(documentId) {
        const document = await Document.findById(documentId);
        if (!document) throw new Error('Document not found');

        try {
            // Update status to processing
            document.status = 'processing';
            await document.save();

            // Download file from Cloudinary URL
            const response = await fetch(document.source.url);
            if (!response.ok) throw new Error('Failed to download file from Cloudinary');
            const buffer = Buffer.from(await response.arrayBuffer());

            // Extract text based on file type
            const text = await this._extractText(buffer, document.mimeType);
            const cleanedText = cleanText(text);

            if (!cleanedText || cleanedText.length < 10) {
                throw new Error('Could not extract meaningful text from document');
            }

            // Generate chunks
            const chunks = chunkText(cleanedText);
            console.log(`📄 Created ${chunks.length} chunks for: ${document.title}`);

            // Generate embeddings for all chunks
            const embeddings = await geminiService.generateEmbeddings(
                chunks.map(c => c.content)
            );

            // Prepare chunks for Qdrant
            const vectorChunks = chunks.map((chunk, i) => ({
                id: uuidv4(),
                vector: embeddings[i],
                documentId: document._id.toString(),
                documentTitle: document.title,
                content: chunk.content,
                chunkIndex: chunk.index,
                // RBAC Fields for filtering
                uploadedBy: document.uploadedBy.toString(),
                conversationId: document.conversationId ? document.conversationId.toString() : null,
                isGlobal: !!document.isGlobal,
                accessLevel: document.accessLevel,
                allowedUsers: document.allowedUsers?.map(id => id.toString()) || [],
                allowedDepartments: document.allowedDepartments || [],
                allowedTeams: document.allowedTeams || [],
                metadata: document.metadata || {},
            }));

            // Store in Qdrant
            await qdrantService.upsertChunks(vectorChunks);

            // Generate tags automatically
            const tags = await geminiService.generateDocumentTags(cleanedText);

            // Update document with chunk and vector counts
            document.status = 'completed';
            document.chunkCount = chunks.length;
            document.vectorCount = chunks.length;  // Will match chunkCount after successful upsert
            document.lastVectorSync = new Date();
            document.tags = tags;
            document.metadata = {
                ...document.metadata,
                wordCount: cleanedText.split(/\s+/).length,
                charCount: cleanedText.length,
            };
            await document.save();

            console.log(`✅ Processed document: ${document.title}`);
            return document;
        } catch (error) {
            console.error(`❌ Document processing error: ${error.message}`);
            document.status = 'failed';
            document.processingError = error.message;
            await document.save();
            throw error;
        }
    }

    // Extract text from various file formats (using buffer directly)
    async _extractText(buffer, mimeType) {
        switch (mimeType) {
            case 'application/pdf':
                const pdfData = await pdfParse(buffer);
                return pdfData.text;

            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            case 'application/msword':
                const docResult = await mammoth.extractRawText({ buffer });
                return docResult.value;

            case 'text/plain':
            case 'text/markdown':
            case 'text/csv':
                return buffer.toString('utf-8');

            default:
                throw new Error(`Unsupported file type: ${mimeType}`);
        }
    }

    // Delete document and its vectors from Cloudinary and Qdrant
    async deleteDocument(documentId) {
        const document = await Document.findById(documentId);
        if (!document) throw new Error('Document not found');

        // Delete from Cloudinary if it has a cloudinaryId
        if (document.source?.cloudinaryId) {
            try {
                await cloudinaryService.deleteFile(document.source.cloudinaryId);
            } catch (error) {
                console.warn('⚠️ Could not delete from Cloudinary:', error.message);
            }
        }

        // Delete vectors from Qdrant (don't fail if Qdrant is unavailable)
        try {
            await qdrantService.deleteByDocument(documentId);
        } catch (error) {
            console.warn('⚠️ Could not delete from Qdrant:', error.message);
        }

        // Delete from MongoDB
        await Document.findByIdAndDelete(documentId);

        console.log(`🗑️ Deleted document: ${document.title}`);
        return document;
    }

    // Get documents with pagination and filters
    async getDocuments({ userId, userRole, department, teams, status, search, page = 1, limit = 20 }) {
        const query = {};

        // Strictly exclude conversation-scoped documents from general library
        query.conversationId = null;

        // --- ACL LOGIC ---
        // Admin sees everything.
        // Others see:
        // 1. Documents they own (uploadedBy)
        // 2. Documents that are 'public' (isGlobal: true, accessLevel: 'public')
        // 3. Documents shared with their Department
        // 4. Documents shared with their Team
        // 5. Documents explicitly shared with them (allowedUsers)

        if (userRole !== 'admin') {
            const aclConditions = [
                { uploadedBy: userId }, // Owner
                { isGlobal: true, accessLevel: 'public' }, // Fully public
                { allowedUsers: userId }, // Explicitly shared
            ];

            if (department) {
                aclConditions.push({
                    accessLevel: { $in: ['department'] },
                    allowedDepartments: department
                });
            }

            if (teams && teams.length > 0) {
                aclConditions.push({
                    allowedTeams: { $in: teams }
                });
            }

            query.$or = aclConditions;
        }

        // Additional Filters (AND logic)
        if (status) query.status = status;

        // Search Logic (AND with ACL)
        if (search) {
            const searchCondition = {
                $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { tags: { $in: [new RegExp(search, 'i')] } },
                ]
            };

            if (query.$or) {
                // If we already have an $or from ACL, we need to wrap it with $and to combine with search
                // Current query: { $or: [ACL], ...other }
                // New query: { $and: [ { $or: [ACL] }, { $or: [Search] } ], ...other }
                query.$and = [
                    { $or: query.$or },
                    searchCondition
                ];
                delete query.$or;
            } else {
                query.$or = searchCondition.$or;
            }
        }

        const skip = (page - 1) * limit;

        const [documents, total] = await Promise.all([
            Document.find(query)
                .populate('uploadedBy', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Document.countDocuments(query),
        ]);

        return {
            documents,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }

    // Get single document by ID
    async getDocument(documentId) {
        const document = await Document.findById(documentId)
            .populate('uploadedBy', 'name email')
            .lean();
        return document;
    }

    // Update document metadata
    async updateDocument(documentId, updates) {
        const allowedUpdates = ['title', 'description', 'tags', 'accessLevel', 'allowedDepartments', 'allowedTeams', 'allowedUsers'];
        const filteredUpdates = {};
        let aclUpdated = false;

        for (const key of allowedUpdates) {
            if (updates[key] !== undefined) {
                filteredUpdates[key] = updates[key];
                if (['accessLevel', 'allowedDepartments', 'allowedTeams', 'allowedUsers'].includes(key)) {
                    aclUpdated = true;
                }
            }
        }

        const document = await Document.findByIdAndUpdate(
            documentId,
            { $set: filteredUpdates },
            { new: true }
        );

        // If ACL changed, sync to Qdrant
        if (aclUpdated && document) {
            try {
                // We send the FULL updated ACL state to ensure consistency
                // (Partial updates might be tricky if we don't know previous state easily)
                const payloadUpdates = {};
                if (filteredUpdates.accessLevel !== undefined) payloadUpdates.accessLevel = filteredUpdates.accessLevel;

                // For arrays, we must send the NEW full array, which we have in filteredUpdates
                if (filteredUpdates.allowedDepartments) payloadUpdates.allowedDepartments = filteredUpdates.allowedDepartments;
                if (filteredUpdates.allowedTeams) payloadUpdates.allowedTeams = filteredUpdates.allowedTeams;
                if (filteredUpdates.allowedUsers) payloadUpdates.allowedUsers = filteredUpdates.allowedUsers; // These might be ObjectIds, need to stringify?

                // Qdrant expects strings/numbers usually. 
                // Let's ensure User IDs are strings if they were passed
                if (payloadUpdates.allowedUsers) {
                    payloadUpdates.allowedUsers = payloadUpdates.allowedUsers.map(u => u.toString());
                }

                await qdrantService.updateDocumentPayload(documentId, payloadUpdates);
            } catch (err) {
                console.error(`⚠️ Failed to sync ACL updates to Qdrant for doc ${documentId}:`, err.message);
                // We don't rollback Mongo update, but we log the inconsistency.
                // In production, might want a job to fix inconsistencies.
            }
        }

        return document;
    }
}

const documentService = new DocumentService();

export default documentService;
