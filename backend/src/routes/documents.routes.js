import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { Document } from '../models/index.js';
import { documentService } from '../services/index.js';

// Document routes
export default async function documentRoutes(fastify) {
    // Require auth for all document routes
    fastify.addHook('preHandler', async (request, reply) => {
        if (!request.session.userId) {
            return reply.status(401).send({ error: 'Not authenticated' });
        }
    });

    // Upload document
    fastify.post('/upload', async (request, reply) => {
        const data = await request.file();

        if (!data) {
            return reply.status(400).send({ error: 'No file uploaded' });
        }

        // Validate file type
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'text/plain',
            'text/markdown',
        ];

        if (!allowedTypes.includes(data.mimetype)) {
            return reply.status(400).send({ error: 'File type not supported' });
        }

        // Create uploads directory if needed
        const uploadsDir = path.join(process.cwd(), 'uploads');
        await fs.mkdir(uploadsDir, { recursive: true });

        // Save file
        const filename = `${uuidv4()}${path.extname(data.filename)}`;
        const filePath = path.join(uploadsDir, filename);
        await fs.writeFile(filePath, await data.toBuffer());

        // Create document record
        const document = new Document({
            title: request.body?.title || data.filename.replace(/\.[^.]+$/, ''),
            description: request.body?.description || '',
            filename,
            originalName: data.filename,
            mimeType: data.mimetype,
            size: (await fs.stat(filePath)).size,
            uploadedBy: request.session.userId,
            status: 'pending',
        });

        await document.save();

        // Process document in background
        documentService.processDocument(document._id, filePath).catch(err => {
            console.error('Background processing error:', err);
        });

        return {
            success: true,
            document: document.toObject(),
            message: 'Document uploaded, processing started',
        };
    });

    // List documents
    fastify.get('/', async (request, reply) => {
        const { page = 1, limit = 20, status, search } = request.query;

        const result = await documentService.getDocuments({
            userId: request.session.userId,
            status,
            search,
            page: parseInt(page),
            limit: parseInt(limit),
        });

        return result;
    });

    // Get single document
    fastify.get('/:id', async (request, reply) => {
        const document = await Document.findById(request.params.id)
            .populate('uploadedBy', 'name email')
            .lean();

        if (!document) {
            return reply.status(404).send({ error: 'Document not found' });
        }

        return { document };
    });

    // Delete document
    fastify.delete('/:id', async (request, reply) => {
        const document = await Document.findById(request.params.id);

        if (!document) {
            return reply.status(404).send({ error: 'Document not found' });
        }

        // Check ownership
        if (document.uploadedBy.toString() !== request.session.userId.toString()) {
            return reply.status(403).send({ error: 'Not authorized' });
        }

        await documentService.deleteDocument(request.params.id);

        return { success: true, message: 'Document deleted' };
    });

    // Update document metadata
    fastify.patch('/:id', async (request, reply) => {
        const document = await Document.findById(request.params.id);

        if (!document) {
            return reply.status(404).send({ error: 'Document not found' });
        }

        if (document.uploadedBy.toString() !== request.session.userId.toString()) {
            return reply.status(403).send({ error: 'Not authorized' });
        }

        const { title, description, tags, isPublic } = request.body;

        if (title) document.title = title;
        if (description !== undefined) document.description = description;
        if (tags) document.tags = tags;
        if (isPublic !== undefined) document.isPublic = isPublic;

        await document.save();

        return { success: true, document: document.toObject() };
    });
}
