import { User, Document } from '../models/index.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import { auditService } from '../services/index.js';

export default async function usersRoutes(fastify) {
    // Require 'users:manage' permission for all routes (Admin, Visitor, Employee have this)
    fastify.addHook('preHandler', requirePermission('users:manage'));

    // GET /structure - Get all unique departments and teams
    fastify.get('/structure', async (request, reply) => {
        const userId = request.session.userId;
        const user = await User.findById(userId);

        // Scope to Organization if not superadmin
        let filter = {};
        if (user.platformRole !== 'superadmin') {
            if (!user.organizationId) return { departments: [], teams: [] };
            filter.organizationId = user.organizationId;
        }

        const [userDepts, userTeams, docDepts, docTeams] = await Promise.all([
            User.distinct('department', filter),
            User.distinct('teams', filter),
            Document.distinct('allowedDepartments', filter),
            Document.distinct('allowedTeams', filter)
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
        const userId = request.session.userId;
        const user = await User.findById(userId);

        // Scope to Organization if not superadmin
        let query = {};
        if (user.platformRole !== 'superadmin') {
            if (!user.organizationId) {
                // If user has no org and is not superadmin, they shouldn't see anyone (or maybe just themselves?)
                // For safety returning empty list or error.
                return { users: [] };
            }
            query.organizationId = user.organizationId;
        } else {
            // Superadmin filtering capabilities
            const { role, platformRole } = request.query;
            if (role) query.platformRole = role; // Support query param 'role' mapping to 'platformRole'
            if (platformRole) query.platformRole = platformRole;
        }

        const users = await User.find(query)
            .select('-password -resetPasswordToken -resetPasswordExpires')
            .sort({ createdAt: -1 })
            .lean();

        return { users };
    });

    // PATCH /:id - Update user (Role, Name)
    fastify.patch('/:id', async (request, reply) => {
        const { id } = request.params;
        const { role, name } = request.body;
        const currentUser = await User.findById(request.session.userId);

        // SECURITY: Only actual Admins can modify users
        // Check Platform Admin (Superadmin) or Org Admin
        const isSuperAdmin = currentUser.role === 'superadmin';
        const isOrgAdmin = currentUser.organizationId && ['admin', 'owner'].includes(currentUser.orgRole);

        if (!isSuperAdmin && !isOrgAdmin) {
            return reply.status(403).send({
                error: 'You are not an admin. Only administrators can modify users.'
            });
        }

        const targetUser = await User.findById(id);
        if (!targetUser) {
            return reply.status(404).send({ error: 'User not found' });
        }

        // Scope Check: Org Admin can only modify users in their Org
        if (!isSuperAdmin) {
            if (targetUser.organizationId?.toString() !== currentUser.organizationId?.toString()) {
                return reply.status(403).send({ error: 'Cannot modify users from other organizations' });
            }
        }

        // Prevent modifying yourself to avoid locking yourself out (role change)
        if (targetUser._id.toString() === request.session.userId) {
            if (role && role !== targetUser.role) {
                return reply.status(400).send({ error: 'You cannot change your own role.' });
            }
        }

        if (role) targetUser.role = role;
        if (name) targetUser.name = name;

        await targetUser.save();

        // AUDIT LOG: User Update
        auditService.log(request, 'USER_UPDATE', { type: 'user', id: targetUser._id.toString() }, {
            updatedFields: { role, name },
            targetUserEmail: targetUser.email
        });

        return {
            success: true,
            user: { _id: targetUser._id, name: targetUser.name, email: targetUser.email, role: targetUser.role }
        };
    });

    // DELETE /:id - Delete user
    fastify.delete('/:id', async (request, reply) => {
        const { id } = request.params;
        const currentUser = await User.findById(request.session.userId);

        const isSuperAdmin = currentUser.role === 'superadmin';
        const isOrgAdmin = currentUser.organizationId && ['admin', 'owner'].includes(currentUser.orgRole);

        if (!isSuperAdmin && !isOrgAdmin) {
            return reply.status(403).send({
                error: 'You are not an admin. Only administrators can delete users.'
            });
        }

        if (id === request.session.userId) {
            return reply.status(400).send({ error: 'You cannot delete your own account.' });
        }

        const targetUser = await User.findById(id);
        if (!targetUser) {
            return reply.status(404).send({ error: 'User not found' });
        }

        // Scope Check
        if (!isSuperAdmin) {
            if (targetUser.organizationId?.toString() !== currentUser.organizationId?.toString()) {
                return reply.status(403).send({ error: 'Cannot delete users from other organizations' });
            }
        }

        await User.findByIdAndDelete(id);

        // AUDIT LOG: User Delete
        auditService.log(request, 'USER_DELETE', { type: 'user', id: id }, {
            targetUserEmail: targetUser.email,
            targetUserName: targetUser.name
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

        const currentUser = await User.findById(request.session.userId);
        if (currentUser.role !== 'superadmin') {
            if (user.organizationId?.toString() !== currentUser.organizationId?.toString()) {
                return reply.status(403).send({ error: 'Access denied' });
            }
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
