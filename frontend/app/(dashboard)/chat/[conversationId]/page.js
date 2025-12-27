'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { chatApi } from '@/lib/api';
import ChatWindow from '@/components/chat/ChatWindow';
import ChatInput from '@/components/chat/ChatInput';
import { AlertTriangle, X } from 'lucide-react';

export default function ConversationPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const conversationId = params.conversationId;
    const inputRef = useRef(null);

    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    // Load conversation on mount
    useEffect(() => {
        if (conversationId && user) {
            loadConversation(conversationId);
        }
    }, [conversationId, user]);

    const loadConversation = async (id) => {
        try {
            setLoading(true);
            const data = await chatApi.getConversation(id);
            setActiveConversation(data.conversation);
            setMessages(data.messages || []);
        } catch (error) {
            console.error('Failed to load conversation:', error);
            router.push('/chat');
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (content, files = []) => {
        if (!content.trim() && files.length === 0) return;
        await sendMessage(conversationId, content, files);
    };

    const sendMessage = async (convId, content, files = []) => {
        // Extract IDs/Source for API (send full object if available, otherwise just ID string for legacy)
        const apiPayload = files.map(f => ({
            id: f.id,
            source: f.source || 'upload'
        }));

        // Format attachments for optimistic UI
        const optimisticAttachments = files.map(f => ({
            documentId: f.id,
            name: f.name,
            size: f.size,
            mimeType: 'application/pdf', // Default fallback
            source: f.source || 'upload'
        }));

        const tempUserMsg = {
            _id: `temp-${Date.now()}`,
            role: 'user',
            content: content || (files.length > 0 ? 'Sent attachments' : ''),
            createdAt: new Date().toISOString(),
            attachments: optimisticAttachments // Show attachments immediately
        };
        setMessages(prev => [...prev, tempUserMsg]);
        setIsTyping(true);

        try {
            const data = await chatApi.sendMessage(convId, content, null, apiPayload);

            setMessages(prev => {
                const filtered = prev.filter(m =>
                    !m._id.startsWith('temp-') &&
                    m._id !== data.userMessage._id
                );
                return [...filtered, data.userMessage, data.assistantMessage];
            });

            if (data.assistantMessage) {
                setActiveConversation(prev => ({
                    ...prev,
                    title: prev?.title === 'New Conversation' ? (content || 'Attachment').substring(0, 50) : prev?.title,
                    messageCount: (prev?.messageCount || 0) + 2
                }));
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            setMessages(prev => prev.filter(m => m._id !== tempUserMsg._id));

            if (error.code === 'rate_limit_exceeded' || error.status === 429) {
                if (error.isQuotaExhausted) {
                    setToast({
                        type: 'error',
                        title: '⚠️ AI Quota Exhausted',
                        message: 'Daily quota exceeded. Try again after midnight UTC or use a different API key.',
                        persistent: true
                    });
                } else {
                    const retryTime = error.retryAfter || 60;
                    setToast({
                        type: 'warning',
                        title: '⏳ Rate Limited',
                        message: `Too many requests. Please wait ${retryTime} seconds.`,
                        retryAfter: retryTime
                    });
                }
            } else {
                setToast({
                    type: 'error',
                    title: '❌ Something went wrong',
                    message: error.message || 'Please try again.'
                });
            }
        } finally {
            setIsTyping(false);
        }
    };

    const handleFeedback = async (messageId, feedback) => {
        try {
            await chatApi.submitFeedback(messageId, feedback);
            setMessages(prev =>
                prev.map(m => m._id === messageId ? { ...m, feedback } : m)
            );
        } catch (error) {
            console.error('Failed to submit feedback:', error);
        }
    };

    const handleFileUpload = async (file) => {
        return await chatApi.uploadFileToChat(conversationId, file);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Chat Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-border pl-14 md:pl-6">
                <div>
                    <h1 className="text-lg font-semibold text-foreground">
                        {activeConversation?.title || 'Conversation'}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {messages.length > 0 ? `${messages.length} messages` : 'Start a conversation'}
                    </p>
                </div>
            </header>

            {/* Chat Window */}
            <ChatWindow
                messages={messages}
                isTyping={isTyping}
                onFeedback={handleFeedback}
                onQuickPrompt={handleSendMessage}
            />

            {/* Chat Input */}
            <ChatInput
                ref={inputRef}
                onSend={handleSendMessage}
                onFileUpload={handleFileUpload}
                conversationId={conversationId}
                disabled={isTyping}
                isTyping={isTyping}
                centered
            />

            {/* Toast Notification */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 min-w-[320px] max-w-md animate-in slide-in-from-bottom-4 fade-in duration-300
                    bg-card/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-border overflow-hidden
                    ${toast.type === 'error' ? 'ring-1 ring-destructive/30' : 'ring-1 ring-amber-500/30'}`}>

                    <div className={`h-1 ${toast.type === 'error' ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-amber-500 to-orange-500'}`} />

                    <div className="flex items-start gap-3 p-4">
                        <div className={`p-2 rounded-xl ${toast.type === 'error' ? 'bg-destructive/20' : 'bg-amber-500/20'}`}>
                            <AlertTriangle className={`w-5 h-5 ${toast.type === 'error' ? 'text-destructive' : 'text-amber-400'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground">{toast.title}</p>
                            <p className="text-sm text-muted-foreground mt-1">{toast.message}</p>
                        </div>
                        <button
                            onClick={() => setToast(null)}
                            className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-secondary rounded-lg"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {!toast.persistent && (
                        <div className="h-0.5 bg-secondary">
                            <div
                                className={`h-full ${toast.type === 'error' ? 'bg-destructive' : 'bg-amber-500'}`}
                                style={{
                                    animation: `shrink ${toast.retryAfter || 5}s linear forwards`
                                }}
                            />
                        </div>
                    )}
                </div>
            )}

            <style jsx>{`
                @keyframes shrink {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>
        </div>
    );
}
