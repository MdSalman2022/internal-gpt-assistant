'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { chatApi } from '@/lib/api';
import ChatWindow from '@/components/chat/ChatWindow';
import ChatInput from '@/components/chat/ChatInput';
import { Sparkles, Zap, BookOpen, Code, Lightbulb, AlertTriangle, X } from 'lucide-react';

// Quick prompts like ChatGPT
const QUICK_PROMPTS = [
    { icon: Lightbulb, text: "What can you help me with?", color: "from-yellow-500 to-orange-500" },
    { icon: BookOpen, text: "Summarize my documents", color: "from-blue-500 to-cyan-500" },
    { icon: Code, text: "Explain a technical concept", color: "from-purple-500 to-pink-500" },
    { icon: Zap, text: "Find information quickly", color: "from-green-500 to-emerald-500" },
];

export default function ChatPage() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const conversationIdParam = searchParams.get('conversation');
    const inputRef = useRef(null);

    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [isNewChat, setIsNewChat] = useState(true);
    const [toast, setToast] = useState(null); // { type, title, message, retryAfter }

    // Load conversation from URL param or start fresh
    useEffect(() => {
        if (conversationIdParam && user) {
            loadConversation(conversationIdParam);
            setIsNewChat(false);
        } else {
            setActiveConversation(null);
            setMessages([]);
            setIsNewChat(true);
        }
    }, [conversationIdParam, user]);

    // Focus input on mount for new chats
    useEffect(() => {
        if (isNewChat && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isNewChat]);

    const loadConversation = async (id) => {
        try {
            const data = await chatApi.getConversation(id);
            setActiveConversation(data.conversation);
            setMessages(data.messages || []);
            setIsNewChat(data.messages?.length === 0);
        } catch (error) {
            console.error('Failed to load conversation:', error);
            router.push('/chat');
        }
    };

    const handleSendMessage = async (content, fileIds = []) => {
        if (!content.trim() && fileIds.length === 0) return;

        if (!activeConversation) {
            try {
                const data = await chatApi.createConversation();
                setActiveConversation(data.conversation);
                setIsNewChat(false);
                window.history.replaceState(null, '', `/chat?conversation=${data.conversation._id}`);
                await sendMessage(data.conversation._id, content, fileIds);
            } catch (error) {
                console.error('Failed to create conversation:', error);
            }
        } else {
            setIsNewChat(false);
            await sendMessage(activeConversation._id, content, fileIds);
        }
    };

    const sendMessage = async (conversationId, content, fileIds = []) => {
        const tempUserMsg = {
            _id: `temp-${Date.now()}`,
            role: 'user',
            content: content || (fileIds.length > 0 ? 'Sent attachments' : ''),
            createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, tempUserMsg]);
        setIsTyping(true);

        try {
            const data = await chatApi.sendMessage(conversationId, content, null, fileIds);

            // Replace temp message with real messages, avoiding duplicates
            setMessages(prev => {
                // Remove temp message and any duplicates
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

            // Remove temp message on error
            setMessages(prev => prev.filter(m => m._id !== tempUserMsg._id));

            // Show toast notification for errors
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

    const handleQuickPrompt = (text) => {
        handleSendMessage(text);
    };

    const handleFileUpload = async (file) => {
        let conversationId = activeConversation?._id;

        if (!conversationId) {
            // Create new conversation first
            try {
                const data = await chatApi.createConversation();
                conversationId = data.conversation._id;
                setActiveConversation(data.conversation);
                setIsNewChat(false);
                window.history.replaceState(null, '', `/chat?conversation=${conversationId}`);
            } catch (error) {
                console.error('Failed to create conversation for upload:', error);
                throw error;
            }
        }

        return await chatApi.uploadFileToChat(conversationId, file);
    };

    // New Chat Welcome Screen - Gemini-like
    if (isNewChat && messages.length === 0) {
        return (
            <div className="flex flex-col h-full">
                {/* Centered welcome content */}
                <div className="flex-1 flex flex-col items-start md:items-center justify-center px-6 md:px-4 pb-32">
                    {/* Greeting - Gemini style */}
                    <p className="text-slate-400 text-sm md:text-base mb-1">Hi {user?.name?.split(' ')[0] || 'there'}</p>
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-medium text-white mb-8 md:mb-10">
                        <span className="bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
                            How can I help you today?
                        </span>
                    </h1>

                    {/* Quick prompts - Pill style like Gemini */}
                    <div className="flex flex-col md:flex-row flex-wrap gap-2 md:gap-3 w-full md:justify-center md:max-w-2xl">
                        {QUICK_PROMPTS.map((prompt, i) => (
                            <button
                                key={i}
                                onClick={() => handleQuickPrompt(prompt.text)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/60 hover:bg-slate-800 
                                         border border-slate-700/50 hover:border-slate-600 rounded-full 
                                         text-sm text-slate-300 hover:text-white transition-all"
                            >
                                <prompt.icon className="w-4 h-4 text-slate-400" />
                                {prompt.text}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Input at bottom */}
                <ChatInput
                    ref={inputRef}
                    onSend={handleSendMessage}
                    onFileUpload={handleFileUpload}
                    conversationId={activeConversation?._id}
                    disabled={isTyping}
                    isTyping={isTyping}
                    placeholder="Message KnowledgeAI..."
                    centered
                />
            </div>
        );
    }

    // Regular chat view with messages
    return (
        <div className="flex flex-col h-full">
            {/* Chat Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                <div>
                    <h1 className="text-lg font-semibold text-white">
                        {activeConversation?.title || 'New Conversation'}
                    </h1>
                    <p className="text-sm text-slate-500">
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
                conversationId={activeConversation?._id}
                disabled={isTyping}
                isTyping={isTyping}
                centered
            />

            {/* Toast Notification */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 min-w-[320px] max-w-md animate-in slide-in-from-bottom-4 fade-in duration-300
                    bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border overflow-hidden
                    ${toast.type === 'error' ? 'border-red-500/30' : 'border-amber-500/30'}`}>

                    {/* Colored accent bar */}
                    <div className={`h-1 ${toast.type === 'error' ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-amber-500 to-orange-500'}`} />

                    <div className="flex items-start gap-3 p-4">
                        <div className={`p-2 rounded-xl ${toast.type === 'error' ? 'bg-red-500/20' : 'bg-amber-500/20'}`}>
                            <AlertTriangle className={`w-5 h-5 ${toast.type === 'error' ? 'text-red-400' : 'text-amber-400'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white">{toast.title}</p>
                            <p className="text-sm text-slate-400 mt-1">{toast.message}</p>
                        </div>
                        <button
                            onClick={() => setToast(null)}
                            className="text-slate-500 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded-lg"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Countdown progress bar */}
                    {!toast.persistent && (
                        <div className="h-0.5 bg-slate-800">
                            <div
                                className={`h-full ${toast.type === 'error' ? 'bg-red-500' : 'bg-amber-500'}`}
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
