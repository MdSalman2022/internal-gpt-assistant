// Service for tracking token usage and limits

import UsageLog from '../models/UsageLog.js';
import { User } from '../models/index.js';

// Cost per 1K tokens (in USD cents for precision)
const COST_PER_1K_TOKENS = {
    gemini: { prompt: 0.125, completion: 0.375 }, // Gemini Pro
    openai: { prompt: 1.5, completion: 2.0 }, // GPT-4o-mini
    'openai-4o': { prompt: 5.0, completion: 15.0 }, // GPT-4o
    anthropic: { prompt: 0.8, completion: 2.4 } // Claude 3.5 Haiku
};

class UsageService {
    // Log token usage data
    async logUsage({ userId, conversationId, promptTokens, completionTokens, model, provider, requestType = 'chat' }) {
        const totalTokens = promptTokens + completionTokens;

        // Calculate estimated cost
        const rates = COST_PER_1K_TOKENS[provider] || COST_PER_1K_TOKENS.gemini;
        const estimatedCost = Math.round(
            (promptTokens / 1000) * rates.prompt +
            (completionTokens / 1000) * rates.completion
        );

        // Create usage log entry
        const usageLog = await UsageLog.create({
            userId,
            conversationId,
            promptTokens,
            completionTokens,
            totalTokens,
            model,
            provider,
            estimatedCost,
            requestType
        });

        // Update user's current usage atomically
        await User.findByIdAndUpdate(userId, {
            $inc: {
                'usage.dailyTokens': totalTokens,
                'usage.monthlyTokens': totalTokens,
                'usage.totalTokens': totalTokens
            }
        });

        console.log(`📊 Usage logged: ${totalTokens} tokens (${provider}/${model}), est. cost: $${(estimatedCost / 100).toFixed(4)}`);

        return usageLog;
    }

    // Check user resource limits
    async checkLimits(userId) {
        const user = await User.findById(userId).select('usage limits').lean();

        if (!user) {
            return { allowed: false, reason: 'User not found' };
        }

        // Default limits if not set
        const limits = user.limits || {
            dailyTokens: 50000,    // 50K tokens/day default
            monthlyTokens: 500000  // 500K tokens/month default
        };

        const usage = user.usage || { dailyTokens: 0, monthlyTokens: 0 };

        // Check daily limit
        if (usage.dailyTokens >= limits.dailyTokens) {
            return {
                allowed: false,
                reason: 'daily_limit_exceeded',
                message: `You've reached your daily token limit (${limits.dailyTokens.toLocaleString()} tokens). Limit resets at midnight UTC.`,
                remaining: { daily: 0, monthly: limits.monthlyTokens - usage.monthlyTokens }
            };
        }

        // Check monthly limit
        if (usage.monthlyTokens >= limits.monthlyTokens) {
            return {
                allowed: false,
                reason: 'monthly_limit_exceeded',
                message: `You've reached your monthly token limit (${limits.monthlyTokens.toLocaleString()} tokens). Contact an admin to increase your limit.`,
                remaining: { daily: limits.dailyTokens - usage.dailyTokens, monthly: 0 }
            };
        }

        return {
            allowed: true,
            remaining: {
                daily: limits.dailyTokens - usage.dailyTokens,
                monthly: limits.monthlyTokens - usage.monthlyTokens
            }
        };
    }

    // Get user usage statistics
    async getUserStats(userId) {
        const user = await User.findById(userId).select('usage limits').lean();

        const usage = user?.usage || { dailyTokens: 0, monthlyTokens: 0, totalTokens: 0 };
        const limits = user?.limits || { dailyTokens: 50000, monthlyTokens: 500000 };

        // Get today's detailed usage
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayUsage = await UsageLog.getUserUsage(userId, today, new Date());

        // Get this month's usage
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthUsage = await UsageLog.getUserUsage(userId, monthStart, new Date());

        // Get daily breakdown for chart
        const dailyBreakdown = await UsageLog.getDailyUsage(userId, 30);

        return {
            current: {
                daily: usage.dailyTokens,
                monthly: usage.monthlyTokens,
                total: usage.totalTokens
            },
            limits,
            today: todayUsage,
            thisMonth: monthUsage,
            dailyBreakdown,
            percentUsed: {
                daily: Math.round((usage.dailyTokens / limits.dailyTokens) * 100),
                monthly: Math.round((usage.monthlyTokens / limits.monthlyTokens) * 100)
            }
        };
    }

    // Reset daily usage tokens
    async resetDailyUsage() {
        const result = await User.updateMany(
            {},
            { $set: { 'usage.dailyTokens': 0 } }
        );
        console.log(`🔄 Reset daily usage for ${result.modifiedCount} users`);
        return result;
    }

    // Reset monthly usage tokens
    async resetMonthlyUsage() {
        const result = await User.updateMany(
            {},
            { $set: { 'usage.monthlyTokens': 0 } }
        );
        console.log(`🔄 Reset monthly usage for ${result.modifiedCount} users`);
        return result;
    }

    // Update user usage limits
    async updateUserLimits(userId, { dailyTokens, monthlyTokens }) {
        return User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    'limits.dailyTokens': dailyTokens,
                    'limits.monthlyTokens': monthlyTokens
                }
            },
            { new: true }
        );
    }
}

const usageService = new UsageService();

export default usageService;
