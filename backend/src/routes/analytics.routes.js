import { Document, Conversation, Message, User } from '../models/index.js';
import { ragService } from '../services/index.js';

// Analytics routes
export default async function analyticsRoutes(fastify) {
    // Require auth for all analytics routes
    fastify.addHook('preHandler', async (request, reply) => {
        if (!request.session.userId) {
            return reply.status(401).send({ error: 'Not authenticated' });
        }
    });

    // Get dashboard overview stats
    fastify.get('/stats', async (request, reply) => {
        try {
            const userId = request.session.userId;
            const now = new Date();
            const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
            const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

            // Get counts in parallel
            const [
                totalDocuments,
                totalConversations,
                totalMessages,
                recentMessages,
                activeUsers,
                documentsThisMonth,
            ] = await Promise.all([
                Document.countDocuments({}),
                Conversation.countDocuments({ userId }),
                Message.countDocuments({ role: 'user' }),
                Message.find({ createdAt: { $gte: sevenDaysAgo } }).countDocuments(),
                User.countDocuments({ updatedAt: { $gte: thirtyDaysAgo } }),
                Document.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
            ]);

            // Calculate average response time from messages with latency
            const latencyStats = await Message.aggregate([
                { $match: { role: 'assistant', latency: { $exists: true, $gt: 0 } } },
                { $group: { _id: null, avgLatency: { $avg: '$latency' }, count: { $sum: 1 } } },
            ]);

            const avgResponseTime = latencyStats[0]?.avgLatency || 0;

            return {
                totalQueries: totalMessages,
                totalDocuments,
                activeUsers,
                avgResponseTime: Math.round(avgResponseTime),
                conversationsThisWeek: await Conversation.countDocuments({
                    createdAt: { $gte: sevenDaysAgo }
                }),
                documentsThisMonth,
                queriesThisWeek: recentMessages,
            };
        } catch (error) {
            console.error('Stats error:', error);
            return reply.status(500).send({ error: 'Failed to get stats' });
        }
    });

    // Get top queries (most common user questions)
    fastify.get('/top-queries', async (request, reply) => {
        try {
            const limit = parseInt(request.query.limit) || 10;

            // Get recent user messages and count similar ones
            const topQueries = await Message.aggregate([
                { $match: { role: 'user' } },
                { $sort: { createdAt: -1 } },
                { $limit: 500 }, // Sample recent messages
                {
                    $group: {
                        _id: { $toLower: { $substr: ['$content', 0, 100] } },
                        content: { $first: '$content' },
                        count: { $sum: 1 },
                        lastAsked: { $max: '$createdAt' },
                    },
                },
                { $sort: { count: -1 } },
                { $limit: limit },
            ]);

            return {
                queries: topQueries.map(q => ({
                    query: q.content.substring(0, 100) + (q.content.length > 100 ? '...' : ''),
                    count: q.count,
                    lastAsked: q.lastAsked,
                })),
            };
        } catch (error) {
            console.error('Top queries error:', error);
            return reply.status(500).send({ error: 'Failed to get top queries' });
        }
    });

    // Get knowledge gaps (low confidence/unanswered questions)
    fastify.get('/knowledge-gaps', async (request, reply) => {
        try {
            const limit = parseInt(request.query.limit) || 10;

            const gaps = await Message.aggregate([
                {
                    $match: {
                        role: 'assistant',
                        $or: [
                            { isLowConfidence: true },
                            { confidence: { $lt: 0.7 } },
                        ],
                    },
                },
                { $sort: { createdAt: -1 } },
                { $limit: limit },
                {
                    $lookup: {
                        from: 'messages',
                        let: { convId: '$conversationId', msgTime: '$createdAt' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$conversationId', '$$convId'] },
                                            { $eq: ['$role', 'user'] },
                                            { $lt: ['$createdAt', '$$msgTime'] },
                                        ],
                                    },
                                },
                            },
                            { $sort: { createdAt: -1 } },
                            { $limit: 1 },
                        ],
                        as: 'userMessage',
                    },
                },
            ]);

            return {
                gaps: gaps.map(g => ({
                    id: g._id,
                    question: g.userMessage?.[0]?.content?.substring(0, 100) || 'Unknown question',
                    confidence: g.confidence || 0,
                    answer: g.content.substring(0, 150) + '...',
                    createdAt: g.createdAt,
                })),
            };
        } catch (error) {
            console.error('Knowledge gaps error:', error);
            return reply.status(500).send({ error: 'Failed to get knowledge gaps' });
        }
    });

    // Get query volume over time (for chart)
    fastify.get('/query-volume', async (request, reply) => {
        try {
            const days = parseInt(request.query.days) || 14;
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const volume = await Message.aggregate([
                {
                    $match: {
                        role: 'user',
                        createdAt: { $gte: startDate },
                    },
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                        },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]);

            // Fill in missing days with 0
            const result = [];
            const current = new Date(startDate);
            const volumeMap = new Map(volume.map(v => [v._id, v.count]));

            while (current <= new Date()) {
                const dateStr = current.toISOString().split('T')[0];
                result.push({
                    date: dateStr,
                    count: volumeMap.get(dateStr) || 0,
                });
                current.setDate(current.getDate() + 1);
            }

            return { volume: result };
        } catch (error) {
            console.error('Query volume error:', error);
            return reply.status(500).send({ error: 'Failed to get query volume' });
        }
    });

    // Get document stats by status
    fastify.get('/document-stats', async (request, reply) => {
        try {
            const stats = await Document.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                        totalSize: { $sum: '$size' },
                        totalChunks: { $sum: '$chunkCount' },
                    },
                },
            ]);

            const statsByStatus = {};
            stats.forEach(s => {
                statsByStatus[s._id] = {
                    count: s.count,
                    totalSize: s.totalSize,
                    totalChunks: s.totalChunks,
                };
            });

            return { stats: statsByStatus };
        } catch (error) {
            console.error('Document stats error:', error);
            return reply.status(500).send({ error: 'Failed to get document stats' });
        }
    });

    // Get feedback summary
    fastify.get('/feedback', async (request, reply) => {
        try {
            const feedback = await Message.aggregate([
                {
                    $match: {
                        role: 'assistant',
                        feedback: { $exists: true, $ne: null },
                    },
                },
                {
                    $group: {
                        _id: '$feedback',
                        count: { $sum: 1 },
                    },
                },
            ]);

            const positive = feedback.find(f => f._id === 'positive')?.count || 0;
            const negative = feedback.find(f => f._id === 'negative')?.count || 0;
            const total = positive + negative;

            return {
                positive,
                negative,
                total,
                satisfactionRate: total > 0 ? Math.round((positive / total) * 100) : 0,
            };
        } catch (error) {
            console.error('Feedback error:', error);
            return reply.status(500).send({ error: 'Failed to get feedback' });
        }
    });
}
