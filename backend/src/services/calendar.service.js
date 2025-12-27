/**
 * Google Calendar Service
 * Handles OAuth token management and Calendar API calls
 */
import { google } from 'googleapis';
import User from '../models/User.js';

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

/**
 * Create OAuth2 client with credentials
 */
function createOAuth2Client() {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_CALENDAR_REDIRECT_URI || 'http://localhost:5000/api/integrations/google-calendar/callback'
    );
}

/**
 * Generate the OAuth consent URL
 */
export function getAuthUrl(userId) {
    const oauth2Client = createOAuth2Client();
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        state: userId, // Pass user ID to callback
        prompt: 'consent' // Force consent to get refresh token
    });
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(code) {
    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
}

/**
 * Save calendar tokens to user document
 */
export async function saveCalendarTokens(userId, tokens) {
    await User.findByIdAndUpdate(userId, {
        'integrations.googleCalendar': {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiryDate: tokens.expiry_date,
            connected: true,
            connectedAt: new Date()
        }
    });
}

/**
 * Get authenticated OAuth2 client for a user
 */
async function getAuthenticatedClient(userId) {
    const user = await User.findById(userId);
    if (!user?.integrations?.googleCalendar?.connected) {
        throw new Error('Google Calendar not connected');
    }

    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({
        access_token: user.integrations.googleCalendar.accessToken,
        refresh_token: user.integrations.googleCalendar.refreshToken,
        expiry_date: user.integrations.googleCalendar.expiryDate
    });

    // Handle token refresh
    oauth2Client.on('tokens', async (tokens) => {
        await User.findByIdAndUpdate(userId, {
            'integrations.googleCalendar.accessToken': tokens.access_token,
            'integrations.googleCalendar.expiryDate': tokens.expiry_date
        });
    });

    return oauth2Client;
}

/**
 * Check if user has calendar connected
 */
export async function isCalendarConnected(userId) {
    const user = await User.findById(userId);
    return user?.integrations?.googleCalendar?.connected || false;
}

/**
 * Disconnect Google Calendar
 */
export async function disconnectCalendar(userId) {
    const user = await User.findById(userId);
    if (user?.integrations?.googleCalendar?.accessToken) {
        try {
            const oauth2Client = createOAuth2Client();
            oauth2Client.setCredentials({
                access_token: user.integrations.googleCalendar.accessToken
            });
            await oauth2Client.revokeCredentials();
        } catch (error) {
            console.log('Token revocation failed (may already be invalid):', error.message);
        }
    }

    await User.findByIdAndUpdate(userId, {
        'integrations.googleCalendar': {
            connected: false,
            accessToken: null,
            refreshToken: null,
            expiryDate: null
        }
    });
}

/**
 * Get upcoming calendar events
 */
export async function getUpcomingEvents(userId, maxResults = 10) {
    const oauth2Client = await getAuthenticatedClient(userId);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const now = new Date();
    const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: now.toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: 'startTime'
    });

    return response.data.items.map(event => ({
        id: event.id,
        title: event.summary,
        description: event.description,
        start: event.start.dateTime || event.start.date,
        end: event.end.dateTime || event.end.date,
        location: event.location,
        link: event.htmlLink,
        attendees: event.attendees?.map(a => a.email) || []
    }));
}

/**
 * Get today's events (for AI context)
 */
export async function getTodaysEvents(userId) {
    const oauth2Client = await getAuthenticatedClient(userId);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
    });

    return response.data.items.map(event => ({
        id: event.id,
        title: event.summary,
        start: event.start.dateTime || event.start.date,
        end: event.end.dateTime || event.end.date,
        location: event.location
    }));
}

/**
 * Format events for AI context injection
 */
export function formatEventsForAI(events) {
    if (!events || events.length === 0) {
        return "No upcoming events found.";
    }

    return events.map(e => {
        const start = new Date(e.start).toLocaleString();
        const end = new Date(e.end).toLocaleString();
        return `- ${e.title} (${start} to ${end})${e.location ? ` at ${e.location}` : ''}`;
    }).join('\n');
}

export default {
    getAuthUrl,
    getTokensFromCode,
    saveCalendarTokens,
    isCalendarConnected,
    disconnectCalendar,
    getUpcomingEvents,
    getTodaysEvents,
    formatEventsForAI
};
