import { auditService } from '../services/index.js';
import { requireTenant, requireOrgRole } from '../middleware/tenant.middleware.js';

export default async function auditRoutes(fastify) {
    // Require tenant context (auth + org + subscription)
    fastify.addHook('preHandler', async (request, reply) => {
        // Allow superadmins to bypass (if we implemented superadmin bypass middleware logic, but sticking to tenant logic for now)
        // For now, we enforce tenant context so admins see THEIR org logs.
        await requireTenant()(request, reply);
    });

    // Only org admins/owners can read audit logs
    fastify.addHook('preHandler', requireOrgRole('admin', 'owner'));

    // GET / - List logs
    fastify.get('/', async (request, reply) => {
        const { page, limit, userId, action, startDate, endDate } = request.query;

        // Force filter by organizationId
        const result = await auditService.getLogs({
            userId,
            action,
            startDate,
            endDate,
            organizationId: request.organizationId
        }, parseInt(page) || 1, parseInt(limit) || 50);

        return result;
    });
}
