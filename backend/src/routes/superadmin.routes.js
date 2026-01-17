import { Organization, User, Subscription, Plan, AuditLog } from '../models/index.js';

export default async function superadminRoutes(fastify) {
    // All routes require superadmin role
    fastify.addHook('preHandler', async (request, reply) => {
        if (!request.session?.userId) {
            return reply.status(401).send({ error: 'Authentication required' });
        }

        const user = await User.findById(request.session.userId);
        if (user?.platformRole !== 'superadmin') {
            return reply.status(403).send({ error: 'Superadmin access required' });
        }

        request.superadmin = user;
    });

    // Get superadmin dashboard stats
    fastify.get('/dashboard', async (request, reply) => {
        const [
            totalOrganizations,
            activeOrganizations,
            totalUsers,
            activeSubscriptions,
            trialOrganizations,
            totalMRR,
            recentOrganizations,
        ] = await Promise.all([
            Organization.countDocuments(),
            Organization.countDocuments({ planStatus: 'active' }),
            User.countDocuments({ platformRole: 'user' }),
            Subscription.countDocuments({ status: 'active' }),
            Organization.countDocuments({ planStatus: 'trialing' }),
            Subscription.getTotalMRR(),
            Organization.find().sort({ createdAt: -1 }).limit(5).lean(),
        ]);

        // Calculate growth (last 30 days vs previous 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

        const [newOrgsLast30, newOrgsPrevious30] = await Promise.all([
            Organization.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
            Organization.countDocuments({ createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } }),
        ]);

        const orgGrowth = newOrgsPrevious30 > 0
            ? ((newOrgsLast30 - newOrgsPrevious30) / newOrgsPrevious30 * 100).toFixed(1)
            : 0;

        return {
            stats: {
                totalOrganizations,
                activeOrganizations,
                totalUsers,
                activeSubscriptions,
                trialOrganizations,
                mrr: totalMRR,
                growth: {
                    organizations: parseFloat(orgGrowth),
                    newOrgsLast30,
                },
            },
            recentOrganizations,
        };
    });

    // List all organizations
    fastify.get('/organizations', async (request, reply) => {
        const { page = 1, limit = 20, search, plan, status } = request.query;

        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }
        if (plan) query.plan = plan;
        if (status) query.planStatus = status;

        const [organizations, total] = await Promise.all([
            Organization.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .populate('createdBy', 'name email')
                .lean(),
            Organization.countDocuments(query),
        ]);

        // Get user counts for each org
        const orgIds = organizations.map(o => o._id);
        const userCounts = await User.aggregate([
            { $match: { organizationId: { $in: orgIds } } },
            { $group: { _id: '$organizationId', count: { $sum: 1 } } },
        ]);
        const userCountMap = Object.fromEntries(userCounts.map(u => [u._id.toString(), u.count]));

        const orgsWithCounts = organizations.map(org => ({
            ...org,
            memberCount: userCountMap[org._id.toString()] || 0,
        }));

        return {
            organizations: orgsWithCounts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        };
    });

    // Get organization details
    fastify.get('/organizations/:id', async (request, reply) => {
        const { id } = request.params;

        const organization = await Organization.findById(id)
            .populate('createdBy', 'name email');

        if (!organization) {
            return reply.status(404).send({ error: 'Organization not found' });
        }

        const [members, subscription, recentActivity] = await Promise.all([
            User.find({ organizationId: id })
                .select('name email avatar role orgRole lastLogin createdAt')
                .lean(),
            Subscription.findOne({ organizationId: id, status: { $in: ['active', 'trialing'] } }),
            AuditLog.find({ 'resourceId.id': id.toString() })
                .sort({ timestamp: -1 })
                .limit(10)
                .lean(),
        ]);

        return {
            organization,
            members,
            subscription,
            recentActivity,
        };
    });

    // Update organization (superadmin)
    fastify.patch('/organizations/:id', async (request, reply) => {
        const { id } = request.params;
        const { plan, planStatus, limits, notes } = request.body;

        const organization = await Organization.findById(id);
        if (!organization) {
            return reply.status(404).send({ error: 'Organization not found' });
        }

        if (plan) {
            organization.plan = plan;
            organization.updatePlanLimits();
        }
        if (planStatus) organization.planStatus = planStatus;
        if (limits) {
            Object.assign(organization.limits, limits);
        }
        if (notes !== undefined) organization.notes = notes;

        await organization.save();

        return { success: true, organization };
    });

    // List all subscriptions
    fastify.get('/subscriptions', async (request, reply) => {
        const { page = 1, limit = 20, status } = request.query;

        const query = {};
        if (status) query.status = status;

        const [subscriptions, total] = await Promise.all([
            Subscription.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .populate('organizationId', 'name email')
                .lean(),
            Subscription.countDocuments(query),
        ]);

        return {
            subscriptions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        };
    });

    // Revenue analytics
    fastify.get('/analytics/revenue', async (request, reply) => {
        const { period = '30d' } = request.query;

        let startDate;
        switch (period) {
            case '7d':
                startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
                break;
            case 'all':
                startDate = new Date(0); // Beginning of time
                break;
            default:
                startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        }

        // Get all payments in the period
        const dateFilter = period === 'all' ? {} : { 'payments.paidAt': { $gte: startDate } };
        const subscriptions = await Subscription.find(dateFilter);

        const payments = subscriptions.flatMap(sub =>
            sub.payments.filter(p => period === 'all' || p.paidAt >= startDate && p.status === 'succeeded')
        );

        const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

        // Group by day
        const revenueByDay = {};
        payments.forEach(payment => {
            const day = payment.paidAt.toISOString().split('T')[0];
            revenueByDay[day] = (revenueByDay[day] || 0) + payment.amount;
        });

        // Plan distribution
        const planCounts = await Subscription.aggregate([
            { $match: { status: 'active' } },
            { $group: { _id: '$plan', count: { $sum: 1 } } },
        ]);

        return {
            totalRevenue,
            paymentCount: payments.length,
            revenueByDay: Object.entries(revenueByDay).map(([date, amount]) => ({ date, amount })),
            planDistribution: planCounts,
            currentMRR: await Subscription.getTotalMRR(),
        };
    });

    // List all users (platform-wide)
    fastify.get('/users', async (request, reply) => {
        const { page = 1, limit = 50, search, role } = request.query;

        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }
        if (role) query.platformRole = role;

        const [users, total] = await Promise.all([
            User.find(query)
                .select('-password -resetPasswordToken')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .populate('organizationId', 'name')
                .lean(),
            User.countDocuments(query),
        ]);

        return {
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        };
    });

    // Set user platform role
    fastify.patch('/users/:id/platform-role', async (request, reply) => {
        const { id } = request.params;
        const { platformRole } = request.body;

        if (!['superadmin', 'user'].includes(platformRole)) {
            return reply.status(400).send({ error: 'Invalid platform role' });
        }

        const user = await User.findByIdAndUpdate(
            id,
            { platformRole },
            { new: true }
        ).select('-password');

        if (!user) {
            return reply.status(404).send({ error: 'User not found' });
        }

        return { success: true, user };
    });
}
