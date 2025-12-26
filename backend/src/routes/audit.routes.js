import { auditService } from '../services/index.js';
import { requireRole } from '../middleware/rbac.middleware.js';

export default async function auditRoutes(fastify) {
    // Only admins can read audit logs
    // Users are strictly forbidden from seeing who is querying what
    fastify.addHook('preHandler', requireRole('admin'));

    // GET / - List logs
    fastify.get('/', async (request, reply) => {
        const { page, limit, userId, action, startDate, endDate } = request.query;

        const result = await auditService.getLogs({
            userId,
            action,
            startDate,
            endDate
        }, parseInt(page) || 1, parseInt(limit) || 50);

        return result;
    });
}
