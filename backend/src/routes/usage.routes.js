/**
 * Usage API Routes
 * 
 * Endpoints for usage statistics, limits, admin controls, and AI settings.
 */

import { usageService } from '../services/index.js';
import { User, UsageLog, AdminSettings } from '../models/index.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import { getModelsByProvider, MODELS, calculateCost } from '../config/model-pricing.js';

export default async function usageRoutes(fastify) {
    // Require auth for all usage routes
    fastify.addHook('preHandler', async (request, reply) => {
        if (!request.session.userId) {
            return reply.status(401).send({ error: 'Not authenticated' });
        }
    });

    // GET /api/usage/me - Get current user's usage stats
    fastify.get('/me', async (request, reply) => {
        const stats = await usageService.getUserStats(request.session.userId);
        return stats;
    });

    // GET /api/usage/limits - Get current user's limits
    fastify.get('/limits', async (request, reply) => {
        const user = await User.findById(request.session.userId)
            .select('usage limits modelPreferences')
            .lean();

        return {
            usage: user?.usage || { dailyTokens: 0, monthlyTokens: 0 },
            limits: user?.limits || { dailyTokens: 50000, monthlyTokens: 500000 },
            modelPreferences: user?.modelPreferences || {
                defaultModel: 'gemini-2.5-flash',
                allowedModels: ['gemini-2.5-flash', 'gpt-4o-mini']
            }
        };
    });

    // GET /api/usage/models - Get available models grouped by provider
    fastify.get('/models', async (request, reply) => {
        const settings = await AdminSettings.getSettings();
        return {
            providers: getModelsByProvider(),
            selectedModel: settings.selectedModel,
            allModels: MODELS
        };
    });

    // ========== ADMIN ROUTES ==========

    // GET /api/usage/admin/users - Get all users' usage (admin only)
    fastify.get('/admin/users', {
        preHandler: [requirePermission('users:manage')]
    }, async (request, reply) => {
        const users = await User.find()
            .select('name email role usage limits modelPreferences')
            .sort({ 'usage.monthlyTokens': -1 })
            .lean();

        return { users };
    });

    // PATCH /api/usage/admin/users/:id/limits - Update user limits (admin only)
    fastify.patch('/admin/users/:id/limits', {
        preHandler: [requirePermission('users:manage')]
    }, async (request, reply) => {
        const { id } = request.params;
        const { dailyTokens, monthlyTokens, allowedModels, defaultModel } = request.body;

        const updates = {};
        if (dailyTokens !== undefined) updates['limits.dailyTokens'] = dailyTokens;
        if (monthlyTokens !== undefined) updates['limits.monthlyTokens'] = monthlyTokens;
        if (allowedModels !== undefined) updates['modelPreferences.allowedModels'] = allowedModels;
        if (defaultModel !== undefined) updates['modelPreferences.defaultModel'] = defaultModel;

        const user = await User.findByIdAndUpdate(id, { $set: updates }, { new: true })
            .select('name email usage limits modelPreferences');

        if (!user) {
            return reply.status(404).send({ error: 'User not found' });
        }

        return { success: true, user };
    });

    // POST /api/usage/admin/reset-daily - Reset daily usage for all users (admin only)
    fastify.post('/admin/reset-daily', {
        preHandler: [requirePermission('users:manage')]
    }, async (request, reply) => {
        const result = await usageService.resetDailyUsage();
        return { success: true, usersReset: result.modifiedCount };
    });

    // POST /api/usage/admin/reset-monthly - Reset monthly usage for all users (admin only)
    fastify.post('/admin/reset-monthly', {
        preHandler: [requirePermission('users:manage')]
    }, async (request, reply) => {
        const result = await usageService.resetMonthlyUsage();
        return { success: true, usersReset: result.modifiedCount };
    });

    // ========== AI SETTINGS (Admin) ==========

    // GET /api/usage/admin/settings - Get AI settings
    fastify.get('/admin/settings', {
        preHandler: [requirePermission('users:manage')]
    }, async (request, reply) => {
        const settings = await AdminSettings.getSettings();
        return settings.toSafeJSON();
    });

    // PATCH /api/usage/admin/settings - Update AI settings
    fastify.patch('/admin/settings', {
        preHandler: [requirePermission('users:manage')]
    }, async (request, reply) => {
        const { selectedModel, geminiApiKey, openaiApiKey, anthropicApiKey } = request.body;

        const settings = await AdminSettings.getSettings();

        if (selectedModel) settings.selectedModel = selectedModel;
        if (geminiApiKey !== undefined) settings.geminiApiKey = geminiApiKey || null;
        if (openaiApiKey !== undefined) settings.openaiApiKey = openaiApiKey || null;
        if (anthropicApiKey !== undefined) settings.anthropicApiKey = anthropicApiKey || null;

        settings.updatedBy = request.session.userId;
        settings.updatedAt = new Date();

        await settings.save();

        return { success: true, settings: settings.toSafeJSON() };
    });

    // GET /api/usage/admin/pricing - Get all model pricing info
    fastify.get('/admin/pricing', {
        preHandler: [requirePermission('users:manage')]
    }, async (request, reply) => {
        return {
            providers: getModelsByProvider(),
            calculateExample: calculateCost('gemini-2.5-flash', 10000, 5000) // Example calculation
        };
    });

    // GET /api/usage/admin/cost-summary - Get cost summary for billing
    fastify.get('/admin/cost-summary', {
        preHandler: [requirePermission('users:manage')]
    }, async (request, reply) => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const aggregation = await UsageLog.aggregate([
            { $match: { timestamp: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: '$model',
                    totalRequests: { $sum: 1 },
                    totalPromptTokens: { $sum: '$promptTokens' },
                    totalCompletionTokens: { $sum: '$completionTokens' },
                    totalCost: { $sum: '$estimatedCost' }
                }
            }
        ]);

        const byModel = {};
        let totalCost = 0;
        let totalTokens = 0;

        for (const item of aggregation) {
            const modelInfo = MODELS[item._id] || { name: item._id };
            byModel[item._id] = {
                name: modelInfo.name || item._id,
                requests: item.totalRequests,
                promptTokens: item.totalPromptTokens,
                completionTokens: item.totalCompletionTokens,
                totalTokens: item.totalPromptTokens + item.totalCompletionTokens,
                costCents: item.totalCost
            };
            totalCost += item.totalCost;
            totalTokens += item.totalPromptTokens + item.totalCompletionTokens;
        }

        return {
            period: '30 days',
            totalCostCents: totalCost,
            totalCostUSD: (totalCost / 100).toFixed(2),
            totalTokens,
            byModel
        };
    });
}

