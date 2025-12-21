'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { chatApi } from '@/lib/api';
import ChatWindow from '@/components/chat/ChatWindow';
import ChatInput from '@/components/chat/ChatInput';

export default function ChatPage() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const conversationIdParam = searchParams.get('conversation');

    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);

    // Load conversation from URL param
    useEffect(() => {
        if (conversationIdParam && user) {
            loadConversation(conversationIdParam);
        }
    }, [conversationIdParam, user]);

    const loadConversation = async (id) => {
        try {
            const data = await chatApi.getConversation(id);
            setActiveConversation(data.conversation);
            setMessages(data.messages || []);
        } catch (error) {
            console.error('Failed to load conversation:', error);
        }
    };

    const handleSendMessage = async (content) => {
        if (!activeConversation) {
            // Create new conversation first
            try {
                const data = await chatApi.createConversation();
                setActiveConversation(data.conversation);
                await sendMessage(data.conversation._id, content);
            } catch (error) {
                console.error('Failed to create conversation:', error);
            }
        } else {
            await sendMessage(activeConversation._id, content);
        }
    };

    const sendMessage = async (conversationId, content) => {
        // Add user message optimistically
        const tempUserMsg = {
            _id: `temp-${Date.now()}`,
            role: 'user',
            content,
            createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, tempUserMsg]);
        setIsTyping(true);

        try {
            const data = await chatApi.sendMessage(conversationId, content);

            // Replace temp message and add assistant response
            setMessages(prev => [
                ...prev.filter(m => m._id !== tempUserMsg._id),
                data.userMessage,
                data.assistantMessage,
            ]);

            // Update conversation title if changed
            if (data.conversation?.title) {
                setActiveConversation(prev => ({ ...prev, title: data.conversation.title }));
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
                onSend={handleSendMessage}
                disabled={isTyping}
                isTyping={isTyping}
            />
        </div>
    );
}
