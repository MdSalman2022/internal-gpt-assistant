import { Document, Conversation } from '../models/index.js';
import User from '../models/User.js';
import { documentService, qdrantService } from '../services/index.js';
import { requireRole, requirePermission } from '../middleware/rbac.middleware.js';
import { auditService } from '../services/index.js';
import { requireTenant } from '../middleware/tenant.middleware.js';

// Document routes
export default async function documentRoutes(fastify) {
    // Require tenant context (auth + org + active subscription) for all document routes
    fastify.addHook('preHandler', async (request, reply) => {
        await requireTenant()(request, reply);

        // Also attach user role for RBAC
        request.userRole = request.user?.role || 'employee';
    });

    // Admin: Clear all vectors (use with caution!)
    fastify.delete('/admin/clear-vectors', {
        preHandler: [requireRole('admin')]
    }, async (request, reply) => {
        console.log('⚠️ Admin request to clear all vectors');
        const result = await qdrantService.clearAllVectors();
        return result;
    });

    // Upload document (admin and visitor only)
    fastify.post('/upload', {
        preHandler: [requirePermission('documents:upload')]
    }, async (request, reply) => {
        const parts = request.parts();
        let fileBuffer, filename, mimetype;
        const fields = {};

        for await (const part of parts) {
            if (part.file) {
                // Determine if this is the file we want
                // (First file encountered)
                if (!fileBuffer) {
                    filename = part.filename;
                    mimetype = part.mimetype;
                    fileBuffer = await part.toBuffer();
                } else {
                    // Ignore extra files
                    part.file.resume();
                }
            } else {
                // It's a field
                fields[part.fieldname] = part.value;
            }
        }

        if (!fileBuffer) {
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

        if (!allowedTypes.includes(mimetype)) {
            return reply.status(400).send({ error: 'File type not supported. Allowed: PDF, Word, TXT, Markdown, CSV' });
        }

        // Prepare ACL options
        // fields values are strings. If JSON arrays, need parsing.
        let allowedDepartments = [];
        let allowedTeams = [];
        let allowedUsers = [];
        let allowedUserEmails = [];

        try {
            if (fields.allowedDepartments) allowedDepartments = JSON.parse(fields.allowedDepartments);
            if (fields.allowedTeams) allowedTeams = JSON.parse(fields.allowedTeams);
            if (fields.allowedUsers) allowedUsers = JSON.parse(fields.allowedUsers);
            if (fields.allowedUserEmails) allowedUserEmails = JSON.parse(fields.allowedUserEmails);
        } catch (e) {
            console.warn('Failed to parse ACL JSON fields', e);
        }

        // Upload to Cloudinary and create document record
        const document = await documentService.uploadAndCreateDocument(
            fileBuffer,
            filename,
            mimetype,
            request.session.userId,
            {
                accessLevel: fields.accessLevel || 'private',
                allowedDepartments,
                allowedTeams,
                allowedUsers,
                allowedUserEmails,
                organizationId: request.organizationId // Multi-tenant scope
            }
        );

        // Process document in background (extract text, chunk, embed)
        documentService.processDocument(document._id).catch(err => {
            console.error('Background processing error:', err);
        });

        // AUDIT LOG: Upload
        auditService.log(request, 'UPLOAD_DOCUMENT', { type: 'document', id: document._id.toString() }, {
            filename: document.originalName,
            size: document.size,
            mimeType: document.mimeType,
            accessLevel: document.accessLevel
        });

        return {
            success: true,
            document: document.toObject(),
            message: 'Document uploaded to cloud, processing started',
        };
    });

    // List documents (admin and visitor only)
    fastify.get('/', {
        preHandler: [requirePermission('documents:read')]
    }, async (request, reply) => {
        const { page = 1, limit = 20, status, search } = request.query;

        // Fetch full user details to get departments/teams arrays and email
        const user = await User.findById(request.session.userId).select('role departments teams email');

        const result = await documentService.getDocuments({
            userId: request.session.userId,
            userRole: user.role,
            userEmail: user.email,
            departments: user.departments || [],
            teams: user.teams || [],
            status,
            search,
            page: parseInt(page),
            limit: parseInt(limit),
        });

        return result;
    });

    // Get single document (admin and visitor only)
    fastify.get('/:id', {
        preHandler: [requirePermission('documents:read')]
    }, async (request, reply) => {
        const document = await documentService.getDocument(request.params.id);

        if (!document) {
            return reply.status(404).send({ error: 'Document not found' });
        }

        // AUDIT LOG: View Metadata
        auditService.log(request, 'VIEW_DOCUMENT', { type: 'document', id: document.id }, {
            title: document.title
        });

        return { document };
    });

    // Download document (secure access check)
    fastify.get('/:id/download', async (request, reply) => {
        const document = await Document.findById(request.params.id);

        if (!document) {
            return reply.status(404).send({ error: 'Document not found' });
        }

        // Access Control Logic
        const userId = request.session.userId;
        const user = await User.findById(userId).select('role departments teams email');

        const isAdmin = user.role === 'admin';
        const isOwner = document.uploadedBy.toString() === userId;
        const isPublic = document.isGlobal && document.accessLevel === 'public';

        // Granular Checks - using departments array (any match)
        const isDepartmentMatch = document.accessLevel === 'department' &&
            document.allowedDepartments?.some(dept => user.departments?.includes(dept));

        const isTeamMatch = document.allowedTeams?.some(team => user.teams?.includes(team));
        const isUserAllowed = document.allowedUsers?.map(u => u.toString()).includes(userId);

        // Email-based access check
        const isEmailAllowed = user.email && document.allowedUserEmails?.includes(user.email.toLowerCase());

        // If it's a conversation-scoped doc, check if user is in that conversation
        let hasConvoAccess = false;
        if (document.conversationId) {
            const convo = await Conversation.findOne({
                _id: document.conversationId,
                userId
            });
            if (convo) hasConvoAccess = true;
        }

        // Broad access for Admin, Owner, Global docs, or Conversation members
        if (!isAdmin && !isOwner && !isPublic && !isDepartmentMatch && !isTeamMatch && !isUserAllowed && !isEmailAllowed && !hasConvoAccess) {
            return reply.status(403).send({
                error: 'Forbidden: You do not have permission to download this document'
            });
        }

        if (!document.source?.url) {
            return reply.status(404).send({ error: 'Document source URL not found' });
        }

        // Stream from Cloudinary to force download and set filename securely
        try {
            const cloudRes = await fetch(document.source.url);

            if (!cloudRes.ok) {
                console.error(`❌ Cloudinary download link broken for ${document._id}: ${cloudRes.statusText}`);
                return reply.redirect(document.source.url); // Fallback to redirect if fetch fails
            }

            const fileName = document.originalName || document.title;

            // AUDIT LOG: Download (Critical)
            auditService.log(request, 'DOWNLOAD_DOCUMENT', { type: 'document', id: document._id.toString() }, {
                filename: fileName,
                sourceUrl: document.source.url
            });

            // Set headers to force download with original filename
            return reply
                .header('Content-Type', document.mimeType || 'application/octet-stream')
                .header('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`)
                .send(cloudRes.body);
        } catch (error) {
            console.error('❌ Streaming download failed:', error.message);
            return reply.redirect(document.source.url);
        }
    });

    fastify.delete('/:id', {
        preHandler: [requirePermission('documents:delete')]
    }, async (request, reply) => {
        // Even if the visitor has the permission for UI reasons, we block the actual delete
        // Same for employee if they have the permission
        if (request.userRole === 'visitor' || request.userRole === 'employee') {
            return reply.status(403).send({ error: 'You are not an admin. Only administrators can delete documents.' });
        }

        const document = await Document.findById(request.params.id);

        if (!document) {
            return reply.status(404).send({ error: 'Document not found' });
        }

        await documentService.deleteDocument(request.params.id);

        // AUDIT LOG: Delete
        auditService.log(request, 'DELETE_DOCUMENT', { type: 'document', id: request.params.id }, {
            title: document.title
        });

        return { success: true, message: 'Document deleted from cloud and knowledge base' };
    });

    // Update document metadata (admin and visitor)
    fastify.patch('/:id', {
        preHandler: [requirePermission('documents:update')]
    }, async (request, reply) => {
        const document = await Document.findById(request.params.id);

        if (!document) {
            return reply.status(404).send({ error: 'Document not found' });
        }

        const updatedDoc = await documentService.updateDocument(
            request.params.id,
            request.body
        );

        return { success: true, document: updatedDoc };
    });

    // Reprocess a failed document (admin and visitor)
    fastify.post('/:id/reprocess', {
        preHandler: [requirePermission('documents:update')]
    }, async (request, reply) => {
        const document = await Document.findById(request.params.id);

        if (!document) {
            return reply.status(404).send({ error: 'Document not found' });
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
