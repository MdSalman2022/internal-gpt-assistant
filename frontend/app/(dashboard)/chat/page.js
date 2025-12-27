'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { chatApi } from '@/lib/api';
import ChatInput from '@/components/chat/ChatInput';
import { Zap, BookOpen, Code, Lightbulb } from 'lucide-react';

// Quick prompts like ChatGPT
const QUICK_PROMPTS = [
    { icon: Lightbulb, text: "What can you help me with?", color: "from-yellow-500 to-orange-500" },
    { icon: BookOpen, text: "Summarize my documents", color: "from-blue-500 to-cyan-500" },
    { icon: Code, text: "Explain a technical concept", color: "from-purple-500 to-pink-500" },
    { icon: Zap, text: "Find information quickly", color: "from-green-500 to-emerald-500" },
];

export default function NewChatPage() {
    const { user } = useAuth();
    const router = useRouter();
    const inputRef = useRef(null);
    const [isCreating, setIsCreating] = useState(false);

    // Focus input on mount
    useEffect(() => {
        if (inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, []);

    const handleSendMessage = async (content, fileIds = []) => {
        if (!content.trim() && fileIds.length === 0) return;
        if (isCreating) return;

        setIsCreating(true);
        try {
            // Create new conversation
            const data = await chatApi.createConversation();
            const conversationId = data.conversation._id;

            // Send the first message
            await chatApi.sendMessage(conversationId, content, null, fileIds);

            // Navigate to the conversation route
            router.push(`/chat/${conversationId}`);
        } catch (error) {
            console.error('Failed to create conversation:', error);
            setIsCreating(false);
        }
    };

    const handleQuickPrompt = (text) => {
        handleSendMessage(text);
    };

    const handleFileUpload = async (file) => {
        // Create conversation first for file upload
        try {
            const data = await chatApi.createConversation();
            const conversationId = data.conversation._id;
            const uploadResult = await chatApi.uploadFileToChat(conversationId, file);
            // Navigate to the new conversation
            router.push(`/chat/${conversationId}`);
            return uploadResult;
        } catch (error) {
            console.error('Failed to create conversation for upload:', error);
            throw error;
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Centered welcome content */}
            <div className="flex-1 flex flex-col items-start md:items-center justify-center px-6 md:px-4 pb-32">
                {/* Greeting - Gemini style */}
                <p className="text-muted-foreground text-sm md:text-base mb-1">Hi {user?.name?.split(' ')[0] || 'there'}</p>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-medium text-foreground mb-8 md:mb-10">
                    <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                        How can I help you today?
                    </span>
                </h1>

                {/* Quick prompts - Pill style like Gemini */}
                <div className="flex flex-col md:flex-row flex-wrap gap-2 md:gap-3 w-full md:justify-center md:max-w-2xl">
                    {QUICK_PROMPTS.map((prompt, i) => (
                        <button
                            key={i}
                            onClick={() => handleQuickPrompt(prompt.text)}
                            disabled={isCreating}
                            className="flex items-center gap-2 px-4 py-2.5 bg-secondary/60 hover:bg-secondary 
                                     border border-border/50 hover:border-border rounded-full 
                                     text-sm text-muted-foreground hover:text-foreground transition-all
                                     disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <prompt.icon className="w-4 h-4 text-muted-foreground" />
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
                disabled={isCreating}
                isTyping={isCreating}
                placeholder="Message KnowledgeAI..."
                centered
            />
        </div>
    );
}
