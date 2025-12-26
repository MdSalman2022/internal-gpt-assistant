import { AuditLog } from '../models/index.js';

class AuditService {
    /**
     * Log an action to the database
     * @param {Object} req - Fastify request object (for extracting IP/User)
     * @param {String} action - Action enum (e.g. 'QUERY', 'LOGIN')
     * @param {Object} resource - { type: 'document', id: '123' }
     * @param {Object} details - Additional metadata
     * @param {String} status - 'SUCCESS', 'FAILURE', 'DENIED'
     */
    async log(req, action, resource = {}, details = {}, status = 'SUCCESS') {
        try {
            // Safe extraction of user data
            const userId = req.session?.userId || req.user?._id;
            const userEmail = req.user?.email || details.email; // Fallback for failed login
            const role = req.userRole || req.user?.role;

            const entry = new AuditLog({
                userId,
                userEmail,
                role,
                action,
                resourceId: resource.id,
                resourceType: resource.type,
                details,
                // Request info
                ipAddress: req.ip || req.headers['x-forwarded-for'],
                userAgent: req.headers['user-agent'],
                status
            });

            await entry.save();
        } catch (error) {
            // Failsafe: Don't crash the main request if logging fails, but log to console
            console.error('❌ Failed to write audit log:', error);
            console.error('   Log Data:', { action, resource, status });
        }
    }

    /**
     * Retrieve logs (Admin only)
     * @param {Object} filters - { userId, action, startDate, endDate }
     * @param {Number} page
     * @param {Number} limit
     */
    async getLogs(filters = {}, page = 1, limit = 50) {
        const query = {};

        if (filters.userId) query.userId = filters.userId;
        if (filters.action) query.action = filters.action;

        if (filters.startDate || filters.endDate) {
            query.timestamp = {};
            if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
            if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
        }

        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            AuditLog.find(query)
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit)
                .populate('userId', 'name email') // Hydrate user details if still exists
                .lean(),
            AuditLog.countDocuments(query)
        ]);

        return {
            logs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }
}

export default new AuditService();
