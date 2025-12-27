'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { integrationsApi } from '@/lib/api';
import {
    Calendar, Check, X, ExternalLink, AlertCircle, Clock,
    RefreshCw, MapPin, Users, Loader2
} from 'lucide-react';

export default function IntegrationsPage() {
    const searchParams = useSearchParams();
    const [calendarStatus, setCalendarStatus] = useState({ connected: false, loading: true });
    const [events, setEvents] = useState([]);
    const [eventsLoading, setEventsLoading] = useState(false);
    const [toast, setToast] = useState(null);

    // Check for OAuth callback status
    useEffect(() => {
        const success = searchParams.get('success');
        const error = searchParams.get('error');

        if (success === 'google_calendar') {
            showToast('Google Calendar connected successfully!', 'success');
            // Clean URL
            window.history.replaceState({}, '', '/settings/integrations');
        } else if (error) {
            showToast(`Connection failed: ${error}`, 'error');
            window.history.replaceState({}, '', '/settings/integrations');
        }
    }, [searchParams]);

    // Check calendar connection status
    useEffect(() => {
        checkCalendarStatus();
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const checkCalendarStatus = async () => {
        try {
            setCalendarStatus(prev => ({ ...prev, loading: true }));
            const data = await integrationsApi.googleCalendar.getStatus();
            setCalendarStatus({ connected: data.connected, loading: false });

            if (data.connected) {
                loadEvents();
            }
        } catch (error) {
            console.error('Failed to check calendar status:', error);
            setCalendarStatus({ connected: false, loading: false });
        }
    };

    const loadEvents = async () => {
        try {
            setEventsLoading(true);
            const data = await integrationsApi.googleCalendar.getEvents(5);
            setEvents(data.events || []);
        } catch (error) {
            console.error('Failed to load events:', error);
        } finally {
            setEventsLoading(false);
        }
    };

    const handleConnect = () => {
        // Redirect to OAuth flow (backend handles the redirect to Google)
        window.location.href = integrationsApi.googleCalendar.getAuthUrl();
    };

    const handleDisconnect = async () => {
        if (!confirm('Are you sure you want to disconnect Google Calendar?')) return;

        try {
            await integrationsApi.googleCalendar.disconnect();
            setCalendarStatus({ connected: false, loading: false });
            setEvents([]);
            showToast('Google Calendar disconnected', 'success');
        } catch (error) {
            showToast('Failed to disconnect', 'error');
        }
    };

    const formatEventTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatEventDate = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
        return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    };

    return (
        <div className="p-8 max-w-3xl">
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                    <h2 className="text-xl font-bold text-foreground">Integrations</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        Connect third-party services to enhance your AI assistant.
                    </p>
                </div>

                {/* Google Calendar Integration Card */}
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-border">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Calendar className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">Google Calendar</h3>
                                <p className="text-sm text-muted-foreground">
                                    View your schedule and ask the AI about your meetings
                                </p>
                            </div>
                        </div>

                        {calendarStatus.loading ? (
                            <div className="px-4 py-2">
                                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : calendarStatus.connected ? (
                            <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-500 rounded-full text-xs font-medium border border-green-500/20">
                                    <Check className="w-3.5 h-3.5" />
                                    Connected
                                </span>
                                <button
                                    onClick={handleDisconnect}
                                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                    title="Disconnect"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <button onClick={handleConnect} className="btn-primary">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Connect
                            </button>
                        )}
                    </div>

                    {/* Events Preview (when connected) */}
                    {calendarStatus.connected && (
                        <div className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-primary" />
                                    Upcoming Events
                                </h4>
                                <button
                                    onClick={loadEvents}
                                    disabled={eventsLoading}
                                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                                >
                                    <RefreshCw className={`w-4 h-4 ${eventsLoading ? 'animate-spin' : ''}`} />
                                </button>
                            </div>

                            {eventsLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                </div>
                            ) : events.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    No upcoming events
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {events.map((event) => (
                                        <div
                                            key={event.id}
                                            className="flex items-start gap-3 p-3 bg-secondary/30 rounded-xl border border-border/50 hover:bg-secondary/50 transition-colors"
                                        >
                                            <div className="w-1 h-full bg-primary rounded-full self-stretch" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-foreground text-sm truncate">
                                                    {event.title}
                                                </p>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {formatEventDate(event.start)} · {formatEventTime(event.start)}
                                                    </span>
                                                    {event.location && (
                                                        <span className="flex items-center gap-1 truncate">
                                                            <MapPin className="w-3 h-3" />
                                                            {event.location}
                                                        </span>
                                                    )}
                                                    {event.attendees?.length > 0 && (
                                                        <span className="flex items-center gap-1">
                                                            <Users className="w-3 h-3" />
                                                            {event.attendees.length}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {event.link && (
                                                <a
                                                    href={event.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Setup Instructions (when not connected) */}
                    {!calendarStatus.connected && !calendarStatus.loading && (
                        <div className="p-5 bg-secondary/20">
                            <p className="text-sm text-muted-foreground">
                                <strong className="text-foreground">After connecting:</strong> You can ask the AI questions like
                                "What meetings do I have today?" or "When is my next meeting?"
                            </p>
                        </div>
                    )}
                </div>

                {/* More integrations coming soon */}
                <div className="text-center py-8 border border-dashed border-border rounded-xl">
                    <p className="text-muted-foreground text-sm">
                        More integrations coming soon (GitHub, Notion, Slack...)
                    </p>
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl animate-scale-in border
                    ${toast.type === 'error'
                        ? 'bg-card border-destructive/50 text-destructive'
                        : 'bg-card border-green-500/50 text-green-500'
                    }`}
                >
                    {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <Check className="w-5 h-5" />}
                    <span className="text-sm font-medium">{toast.message}</span>
                    <button onClick={() => setToast(null)} className="ml-2 hover:bg-foreground/10 rounded p-0.5">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
