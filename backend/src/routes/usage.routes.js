/**
 * Usage API Routes
 * 
 * Endpoints for usage statistics, limits, admin controls, and AI settings.
 */

import { usageService } from '../services/index.js';
import { User, UsageLog, AdminSettings, Organization } from '../models/index.js';
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
        const user = await User.findById(request.session.userId);
        let selectedModel = 'gemini-2.5-flash';

        // Check Org Settings first
        if (user.organizationId) {
            const org = await Organization.findById(user.organizationId);
            if (org && org.aiSettings?.selectedModel) {
                selectedModel = org.aiSettings.selectedModel;
            }
        } else {
            // Fallback to Global
            const settings = await AdminSettings.getSettings();
            selectedModel = settings.selectedModel;
        }

        return {
            providers: getModelsByProvider(),
            selectedModel,
            allModels: MODELS
        };
    });

    // ========== ADMIN ROUTES ==========

    // ... (Lines 54-150 remain unchanged, skipping them in replacement) ... 

    // ========== AI SETTINGS (Organization & Admin) ==========

    // GET /api/usage/admin/settings - Get AI settings
    fastify.get('/admin/settings', async (request, reply) => {
        const user = await User.findById(request.session.userId);

        // 1. Organization Admin/Owner
        if (user.organizationId && ['admin', 'owner'].includes(user.orgRole)) {
            const org = await Organization.findById(user.organizationId);
            return {
                selectedModel: org.aiSettings?.selectedModel || 'gemini-2.5-flash',
                geminiApiKey: org.aiSettings?.geminiApiKey || '',
                openaiApiKey: org.aiSettings?.openaiApiKey || '',
                anthropicApiKey: org.aiSettings?.anthropicApiKey || '',
                groqApiKey: org.aiSettings?.groqApiKey || '',
                scope: 'organization'
            };
        }

        // 2. Superadmin (Global)
        if (user.role === 'superadmin') {
            const settings = await AdminSettings.getSettings();
            const json = settings.toSafeJSON();
            json.scope = 'global';
            return json;
        }

        return reply.status(403).send({ error: 'Access denied' });
    });

    // PATCH /api/usage/admin/settings - Update AI settings
    fastify.patch('/admin/settings', async (request, reply) => {
        const { selectedModel, geminiApiKey, openaiApiKey, anthropicApiKey, groqApiKey } = request.body;
        const user = await User.findById(request.session.userId);

        // 1. Organization Admin/Owner
        if (user.organizationId && ['admin', 'owner'].includes(user.orgRole)) {
            const updates = {};
            if (selectedModel) updates['aiSettings.selectedModel'] = selectedModel;
            // Allow setting empty string to clear keys
            if (geminiApiKey !== undefined) updates['aiSettings.geminiApiKey'] = geminiApiKey;
            if (openaiApiKey !== undefined) updates['aiSettings.openaiApiKey'] = openaiApiKey;
            if (anthropicApiKey !== undefined) updates['aiSettings.anthropicApiKey'] = anthropicApiKey;
            if (groqApiKey !== undefined) updates['aiSettings.groqApiKey'] = groqApiKey;

            const org = await Organization.findByIdAndUpdate(
                user.organizationId,
                { $set: updates },
                { new: true }
            );

            return {
                success: true,
                settings: {
                    selectedModel: org.aiSettings.selectedModel,
                    geminiApiKey: org.aiSettings.geminiApiKey,
                    openaiApiKey: org.aiSettings.openaiApiKey,
                    anthropicApiKey: org.aiSettings.anthropicApiKey,
                    groqApiKey: org.aiSettings.groqApiKey,
                    scope: 'organization'
                }
            };
        }

        // 2. Superadmin (Global)
        if (user.role === 'superadmin') {
            const settings = await AdminSettings.getSettings();

            if (selectedModel) settings.selectedModel = selectedModel;
            if (geminiApiKey !== undefined) settings.geminiApiKey = geminiApiKey || null;
            if (openaiApiKey !== undefined) settings.openaiApiKey = openaiApiKey || null;
            if (anthropicApiKey !== undefined) settings.anthropicApiKey = anthropicApiKey || null;
            if (groqApiKey !== undefined) settings.groqApiKey = groqApiKey || null;

            settings.updatedBy = request.session.userId;
            settings.updatedAt = new Date();
            await settings.save();

            return { success: true, settings: settings.toSafeJSON() };
        }

        return reply.status(403).send({ error: 'Access denied' });
    });

    // GET /api/usage/admin/pricing - Get all model pricing info
    fastify.get('/admin/pricing', {
        preHandler: [requirePermission('users:manage')]
    }, async (request, reply) => {
        return {
            providers: getModelsByProvider(),
            calculateExample: calculateCost('gemini-2.5-flash', 10000, 5000)
        };
    });

    // GET /api/usage/admin/cost-summary - Get cost summary for billing
    fastify.get('/admin/cost-summary', async (request, reply) => {
        const user = await User.findById(request.session.userId);

        if (user.role !== 'superadmin' && !['admin', 'owner'].includes(user.orgRole)) {
            return reply.status(403).send({ error: 'Access denied' });
        }

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Build match stage
        const matchStage = { timestamp: { $gte: thirtyDaysAgo } };

        if (user.role !== 'superadmin') {
            // Find all users in org
            const orgUsers = await User.find({ organizationId: user.organizationId }).select('_id');
            const ids = orgUsers.map(u => u._id);
            matchStage.userId = { $in: ids };
        }

        const aggregation = await UsageLog.aggregate([
            { $match: matchStage },
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

