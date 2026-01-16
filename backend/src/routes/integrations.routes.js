// Third-party service integrations
import calendarService from '../services/calendar.service.js';

export default async function integrationsRoutes(fastify, options) {

    // Helper: Check if user is authenticated
    const requireAuth = (request, reply) => {
        if (!request.session.userId) {
            reply.status(401).send({ error: 'Not authenticated' });
            return false;
        }
        return true;
    };

    // Google Calendar

    /**
     * GET /api/integrations/google-calendar/auth
     * Start OAuth flow - redirects user to Google consent screen
     */
    fastify.get('/google-calendar/auth', async (request, reply) => {
        if (!requireAuth(request, reply)) return;

        const authUrl = calendarService.getAuthUrl(request.session.userId);
        return reply.redirect(authUrl);
    });

    /**
     * GET /api/integrations/google-calendar/callback
     * Handle OAuth callback from Google
     */
    fastify.get('/google-calendar/callback', async (request, reply) => {
        const { code, state: userId, error } = request.query;

        if (error) {
            return reply.redirect(`${process.env.FRONTEND_URL}/settings/integrations?error=${error}`);
        }

        if (!code || !userId) {
            return reply.redirect(`${process.env.FRONTEND_URL}/settings/integrations?error=missing_params`);
        }

        try {
            const tokens = await calendarService.getTokensFromCode(code);
            await calendarService.saveCalendarTokens(userId, tokens);
            return reply.redirect(`${process.env.FRONTEND_URL}/settings/integrations?success=google_calendar`);
        } catch (err) {
            console.error('Calendar OAuth callback error:', err);
            return reply.redirect(`${process.env.FRONTEND_URL}/settings/integrations?error=oauth_failed`);
        }
    });

    /**
     * GET /api/integrations/google-calendar/status
     * Check if Google Calendar is connected
     */
    fastify.get('/google-calendar/status', async (request, reply) => {
        if (!requireAuth(request, reply)) return;

        try {
            const connected = await calendarService.isCalendarConnected(request.session.userId);
            return { connected };
        } catch (err) {
            return reply.status(500).send({ error: 'Failed to check status' });
        }
    });

    /**
     * POST /api/integrations/google-calendar/disconnect
     * Disconnect Google Calendar
     */
    fastify.post('/google-calendar/disconnect', async (request, reply) => {
        if (!requireAuth(request, reply)) return;

        try {
            await calendarService.disconnectCalendar(request.session.userId);
            return { success: true, message: 'Google Calendar disconnected' };
        } catch (err) {
            console.error('Disconnect error:', err);
            return reply.status(500).send({ error: 'Failed to disconnect' });
        }
    });

    /**
     * GET /api/integrations/google-calendar/events
     * Get upcoming calendar events
     */
    fastify.get('/google-calendar/events', async (request, reply) => {
        if (!requireAuth(request, reply)) return;

        try {
            const { limit = 10 } = request.query;
            const events = await calendarService.getUpcomingEvents(request.session.userId, parseInt(limit));
            return { events };
        } catch (err) {
            if (err.message === 'Google Calendar not connected') {
                return reply.status(400).send({ error: 'Google Calendar not connected' });
            }
            console.error('Get events error:', err);
            return reply.status(500).send({ error: 'Failed to fetch events' });
        }
    });

    /**
     * GET /api/integrations/google-calendar/today
     * Get today's events (useful for AI context)
     */
    fastify.get('/google-calendar/today', async (request, reply) => {
        if (!requireAuth(request, reply)) return;

        try {
            const events = await calendarService.getTodaysEvents(request.session.userId);
            return {
                events,
                formatted: calendarService.formatEventsForAI(events)
            };
        } catch (err) {
            if (err.message === 'Google Calendar not connected') {
                return reply.status(400).send({ error: 'Google Calendar not connected' });
            }
            console.error('Get today events error:', err);
            return reply.status(500).send({ error: 'Failed to fetch events' });
        }
    });
}
