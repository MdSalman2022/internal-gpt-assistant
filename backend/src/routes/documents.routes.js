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

    // Upload document (to Cloudinary)
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
            'text/csv',
        ];

        if (!allowedTypes.includes(data.mimetype)) {
            return reply.status(400).send({ error: 'File type not supported. Allowed: PDF, Word, TXT, Markdown, CSV' });
        }

        // Get file buffer
        const fileBuffer = await data.toBuffer();

        // Upload to Cloudinary and create document record
        const document = await documentService.uploadAndCreateDocument(
            fileBuffer,
            data.filename,
            data.mimetype,
            request.session.userId
        );

        // Process document in background (extract text, chunk, embed)
        documentService.processDocument(document._id).catch(err => {
            console.error('Background processing error:', err);
        });

        return {
            success: true,
            document: document.toObject(),
            message: 'Document uploaded to cloud, processing started',
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
        const document = await documentService.getDocument(request.params.id);

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

        return { success: true, message: 'Document deleted from cloud and knowledge base' };
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

        const updatedDoc = await documentService.updateDocument(
            request.params.id,
            request.body
        );

        return { success: true, document: updatedDoc };
    });

    // Reprocess a failed document
    fastify.post('/:id/reprocess', async (request, reply) => {
        const document = await Document.findById(request.params.id);

        if (!document) {
            return reply.status(404).send({ error: 'Document not found' });
        }

        if (document.uploadedBy.toString() !== request.session.userId.toString()) {
            return reply.status(403).send({ error: 'Not authorized' });
        }

        if (document.status !== 'failed') {
            return reply.status(400).send({ error: 'Only failed documents can be reprocessed' });
        }

        // Reset status and reprocess
        document.status = 'pending';
        document.processingError = null;
        await document.save();

        documentService.processDocument(document._id).catch(err => {
            console.error('Reprocessing error:', err);
        });

        return { success: true, message: 'Reprocessing started' };
    });
}
