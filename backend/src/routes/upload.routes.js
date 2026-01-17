import { cloudinaryService, auditService } from '../services/index.js';
import { requireActiveSubscription } from '../middleware/tenant.middleware.js';

export default async function uploadRoutes(fastify) {
    // Require authentication
    fastify.addHook('preHandler', async (request, reply) => {
        if (!request.session.userId) {
            return reply.status(401).send({ error: 'Not authenticated' });
        }
    });

    // POST / - Upload file
    fastify.post('/', async (request, reply) => {
        const data = await request.file();
        
        if (!data) {
            return reply.status(400).send({ error: 'No file uploaded' });
        }

        try {
            const buffer = await data.toBuffer();
            
            // Upload to Cloudinary
            const result = await cloudinaryService.uploadFile(buffer, {
                folder: 'knowledge-assistant/uploads',
                resource_type: 'auto',
                original_filename: data.filename
            });

            // AUDIT LOG: File Upload
            auditService.log(request, 'UPLOAD', { type: 'file', id: result.publicId }, {
                filename: data.filename,
                mimetype: data.mimetype,
                size: result.bytes,
                url: result.url
            });

            return {
                success: true,
                url: result.url,
                publicId: result.publicId,
                resourceType: result.resourceType,
                format: result.format
            };
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Upload failed' });
        }
    });
}
