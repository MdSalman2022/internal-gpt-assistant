'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { chatApi } from '@/lib/api';
import ChatWindow from '@/components/chat/ChatWindow';
import ChatInput from '@/components/chat/ChatInput';
import { Sparkles, Zap, BookOpen, Code, Lightbulb } from 'lucide-react';

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
            setMessages(prev => prev.filter(m => m._id !== tempUserMsg._id));
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

    // New Chat Welcome Screen
    if (isNewChat && messages.length === 0) {
        return (
            <div className="flex flex-col h-full">
                {/* Centered welcome content */}
                <div className="flex-1 flex flex-col items-center justify-center px-4 pb-32">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center mb-6 shadow-lg shadow-primary-500/25">
                        <Sparkles className="w-8 h-8 text-white" />
                    </div>

                    <h1 className="text-3xl font-semibold text-white mb-2">
                        How can I help you today?
                    </h1>
                    <p className="text-slate-400 mb-8 text-center max-w-md">
                        Ask me anything about your documents or get help with any topic.
                    </p>

                    {/* Quick prompts grid */}
                    <div className="grid grid-cols-2 gap-3 w-full max-w-2xl mb-8">
                        {QUICK_PROMPTS.map((prompt, i) => (
                            <button
                                key={i}
                                onClick={() => handleQuickPrompt(prompt.text)}
                                className="group flex items-start gap-3 p-4 bg-slate-800/50 hover:bg-slate-800 
                                         border border-slate-700 hover:border-slate-600 rounded-xl 
                                         text-left transition-all"
                            >
                                <div className={`p-2 rounded-lg bg-gradient-to-br ${prompt.color} opacity-80 group-hover:opacity-100`}>
                                    <prompt.icon className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-sm text-slate-300 group-hover:text-white">
                                    {prompt.text}
                                </span>
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

        </div>
    );
}
