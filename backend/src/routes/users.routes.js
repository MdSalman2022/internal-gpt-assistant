import { User, Document } from '../models/index.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import { auditService } from '../services/index.js';

export default async function usersRoutes(fastify) {
    // Require 'users:manage' permission for all routes (Admin, Visitor, Employee have this)
    fastify.addHook('preHandler', requirePermission('users:manage'));

    // GET /structure - Get all unique departments and teams
    fastify.get('/structure', async (request, reply) => {
        const [userDepts, userTeams, docDepts, docTeams] = await Promise.all([
            User.distinct('department'),
            User.distinct('teams'),
            Document.distinct('allowedDepartments'),
            Document.distinct('allowedTeams')
        ]);

        // Merge and clean departments
        const allDepartments = new Set([
            ...userDepts.filter(Boolean),
            ...docDepts.filter(Boolean)
        ]);

        // Merge and clean teams
        const allTeams = new Set([
            ...userTeams.filter(Boolean),
            ...docTeams.filter(Boolean)
        ]);

        return {
            departments: Array.from(allDepartments).sort(),
            teams: Array.from(allTeams).sort()
        };
    });

    // GET / - List all users
    fastify.get('/', async (request, reply) => {
        const users = await User.find()
            .select('-password -resetPasswordToken -resetPasswordExpires')
            .sort({ createdAt: -1 })
            .lean();

        return { users };
    });

    // PATCH /:id - Update user (Role, Name)
    fastify.patch('/:id', async (request, reply) => {
        const { id } = request.params;
        const { role, name } = request.body;

        // SECURITY: Only actual Admins can modify users
        if (request.userRole !== 'admin') {
            return reply.status(403).send({
                error: 'You are not an admin. Only administrators can modify users.'
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return reply.status(404).send({ error: 'User not found' });
        }

        // Prevent modifying yourself to avoid locking yourself out
        if (user._id.toString() === request.session.userId) {
            // Allow name change, but maybe restrict role change?
            // For safety, let's block role change for self via this generic API
            if (role && role !== user.role) {
                return reply.status(400).send({ error: 'You cannot change your own role.' });
            }
        }

        if (role) user.role = role;
        if (name) user.name = name;

        await user.save();

        return {
            success: true,
            user: { _id: user._id, name: user.name, email: user.email, role: user.role }
        };

        // AUDIT LOG: User Update
        auditService.log(request, 'USER_UPDATE', { type: 'user', id: user._id.toString() }, {
            updatedFields: { role, name },
            targetUserEmail: user.email
        });
    });

    // DELETE /:id - Delete user
    fastify.delete('/:id', async (request, reply) => {
        const { id } = request.params;

        // SECURITY: Only actual Admins can delete users
        if (request.userRole !== 'admin') {
            return reply.status(403).send({
                error: 'You are not an admin. Only administrators can delete users.'
            });
        }

        if (id === request.session.userId) {
            return reply.status(400).send({ error: 'You cannot delete your own account.' });
        }

        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return reply.status(404).send({ error: 'User not found' });
        }

        // AUDIT LOG: User Delete
        auditService.log(request, 'USER_DELETE', { type: 'user', id: id }, {
            targetUserEmail: user.email,
            targetUserName: user.name
        });

        return { success: true, message: 'User deleted successfully' };
    });

    // GET /:id/profile - Get user profile with security stats
    fastify.get('/:id/profile', async (request, reply) => {
        const { id } = request.params;

        // Import AuditLog model
        const AuditLog = (await import('../models/AuditLog.js')).default;

        const user = await User.findById(id)
            .select('-password -resetPasswordToken -resetPasswordExpires')
            .lean();

        if (!user) {
            return reply.status(404).send({ error: 'User not found' });
        }

        // Aggregate security stats
        const [redFlagStats, recentRedFlags, documentAccess, queryCount] = await Promise.all([
            // Count of each red flag type
            AuditLog.aggregate([
                { $match: { userId: user._id, action: { $in: ['GUARDRAIL_BLOCK', 'GUARDRAIL_REDACT'] } } },
                { $group: { _id: '$action', count: { $sum: 1 } } }
            ]),
            // Recent red flags (last 10)
            AuditLog.find({ userId: user._id, action: { $in: ['GUARDRAIL_BLOCK', 'GUARDRAIL_REDACT'] } })
                .sort({ timestamp: -1 })
                .limit(10)
                .select('action details timestamp')
                .lean(),
            // Recent document access (last 10)
            AuditLog.find({ userId: user._id, action: { $in: ['VIEW_DOCUMENT', 'DOWNLOAD_DOCUMENT'] } })
                .sort({ timestamp: -1 })
                .limit(10)
                .select('action resourceId details timestamp')
                .lean(),
            // Total query count
            AuditLog.countDocuments({ userId: user._id, action: 'QUERY' })
        ]);

        // Format red flag counts
        const redFlags = {
            blocked: redFlagStats.find(r => r._id === 'GUARDRAIL_BLOCK')?.count || 0,
            redacted: redFlagStats.find(r => r._id === 'GUARDRAIL_REDACT')?.count || 0,
            total: redFlagStats.reduce((sum, r) => sum + r.count, 0)
        };

        return {
            user,
            stats: {
                redFlags,
                totalQueries: queryCount,
                documentsAccessed: documentAccess.length
            },
            recentRedFlags,
            recentDocumentAccess: documentAccess
        };
    });
}
