import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { v4 as uuidv4 } from 'uuid';
import { Document } from '../models/index.js';
import geminiService from './gemini.service.js';
import qdrantService from './qdrant.service.js';
import { chunkText, cleanText } from '../utils/chunker.js';

class DocumentService {
    // Process uploaded document: extract text, chunk, embed, store
    async processDocument(documentId, filePath) {
        const document = await Document.findById(documentId);
        if (!document) throw new Error('Document not found');

        try {
            // Update status to processing
            document.status = 'processing';
            await document.save();

            // Extract text based on file type
            const text = await this._extractText(filePath, document.mimeType);
            const cleanedText = cleanText(text);

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

    // Extract text from various file formats
    async _extractText(filePath, mimeType) {
        const buffer = await fs.readFile(filePath);

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
                return buffer.toString('utf-8');

            default:
                throw new Error(`Unsupported file type: ${mimeType}`);
        }
    }

    // Delete document and its vectors
    async deleteDocument(documentId) {
        const document = await Document.findById(documentId);
        if (!document) throw new Error('Document not found');

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
            query.$text = { $search: search };
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
}

const documentService = new DocumentService();

export default documentService;
