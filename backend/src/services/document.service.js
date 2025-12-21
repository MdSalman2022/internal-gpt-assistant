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
    async uploadAndCreateDocument(fileBuffer, fileName, mimeType, userId) {
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
            });

            await document.save();
            console.log(`💾 Document saved to MongoDB: ${document._id}`);

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
                metadata: document.metadata || {},
            }));

            // Store in Qdrant
            await qdrantService.upsertChunks(vectorChunks);

            // Generate tags automatically
            const tags = await geminiService.generateDocumentTags(cleanedText);

            // Update document
            document.status = 'completed';
            document.chunkCount = chunks.length;
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
                console.warn('Could not delete from Cloudinary:', error.message);
            }
        }

        // Delete vectors from Qdrant
        await qdrantService.deleteByDocument(documentId);

        // Delete from MongoDB
        await Document.findByIdAndDelete(documentId);

        console.log(`🗑️ Deleted document: ${document.title}`);
        return document;
    }

    // Get documents with pagination and filters
    async getDocuments(options = {}) {
        const {
            userId = null,
            status = null,
            page = 1,
            limit = 20,
            search = null,
        } = options;

        const query = {};

        if (userId) query.uploadedBy = userId;
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } },
            ];
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
        const allowedUpdates = ['title', 'description', 'tags', 'accessLevel'];
        const filteredUpdates = {};

        for (const key of allowedUpdates) {
            if (updates[key] !== undefined) {
                filteredUpdates[key] = updates[key];
            }
        }

        const document = await Document.findByIdAndUpdate(
            documentId,
            { $set: filteredUpdates },
            { new: true }
        );

        return document;
    }
}

const documentService = new DocumentService();

export default documentService;
