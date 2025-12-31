import { DemoRequest } from '../models/index.js';

export default async function demoRoutes(fastify) {
    /**
     * POST /request - Submit a demo request (public endpoint)
     */
    fastify.post('/request', async (request, reply) => {
        const {
            companyName,
            companySize,
            industry,
            website,
            contactName,
            email,
            phone,
            jobTitle,
            interestedIn,
            useCase,
            message,
            preferredDate,
            preferredTime,
            timezone,
            source,
            utmSource,
            utmMedium,
            utmCampaign,
        } = request.body;

        // Basic validation
        if (!companyName || !companySize || !contactName || !email) {
            return reply.status(400).send({
                error: 'Company name, company size, contact name, and email are required'
            });
        }

        // Check for existing demo request with same email in pending status
        const existingRequest = await DemoRequest.findOne({
            email: email.toLowerCase(),
            status: { $in: ['pending', 'scheduled'] }
        });

        if (existingRequest) {
            return reply.status(400).send({
                error: 'You already have a pending demo request. We will contact you soon!'
            });
        }

        // Determine priority based on company size and plan interest
        let priority = 'medium';
        if (companySize === '500+' || interestedIn === 'enterprise') {
            priority = 'high';
        } else if (companySize === '1-10' && interestedIn === 'starter') {
            priority = 'low';
        }

        const demoRequest = new DemoRequest({
            companyName,
            companySize,
            industry,
            website,
            contactName,
            email: email.toLowerCase(),
            phone,
            jobTitle,
            interestedIn: interestedIn || 'not_sure',
            useCase,
            message,
            preferredDate,
            preferredTime,
            timezone,
            priority,
            source: source || 'website',
            utmSource,
            utmMedium,
            utmCampaign,
        });

        await demoRequest.save();

        // TODO: Send confirmation email to the requester
        // TODO: Send notification to sales team

        return {
            success: true,
            message: 'Thank you! We will contact you soon to schedule your demo.',
            requestId: demoRequest._id,
        };
    });

    /**
     * GET /plans - Get available plans for public display
     */
    fastify.get('/plans', async (request, reply) => {
        // Import Plan model
        const Plan = (await import('../models/Plan.js')).default;

        const plans = await Plan.find({ isActive: true })
            .select('name displayName description monthlyPrice yearlyPrice features featureList isPopular sortOrder')
            .sort({ sortOrder: 1 });

        return { plans };
    });
}
