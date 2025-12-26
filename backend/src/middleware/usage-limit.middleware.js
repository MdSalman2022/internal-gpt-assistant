/**
 * Usage Limit Middleware
 * 
 * Checks user token limits before allowing AI requests.
 */

import { usageService } from '../services/index.js';

export const requireUsageLimit = async (request, reply) => {
    if (!request.session.userId) {
        return reply.status(401).send({ error: 'Not authenticated' });
    }

    const limitCheck = await usageService.checkLimits(request.session.userId);

    if (!limitCheck.allowed) {
        console.log(`⚠️ Usage limit exceeded for user ${request.session.userId}:`, limitCheck.reason);

        return reply.status(429).send({
            error: 'usage_limit_exceeded',
            reason: limitCheck.reason,
            message: limitCheck.message,
            remaining: limitCheck.remaining
        });
    }

    // Attach remaining limits to request for potential UI hints
    request.usageRemaining = limitCheck.remaining;
};

export default requireUsageLimit;
