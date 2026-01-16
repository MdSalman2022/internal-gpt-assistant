'use client';

import { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { documentsApi } from '@/lib/api';
import MessageBubble from './MessageBubble';
import { MessageSquare, Sparkles } from 'lucide-react';

export default function ChatWindow({ messages, isTyping, onFeedback, onQuickPrompt }) {
    const bottomRef = useRef(null);
    const router = useRouter();
    const [newMessageId, setNewMessageId] = useState(null);
    const prevMessagesLengthRef = useRef(0);
    const initialLoadRef = useRef(true);

    // Track new assistant messages for typing animation
    useEffect(() => {
        // Skip animation on initial page load
        if (initialLoadRef.current) {
            initialLoadRef.current = false;
            prevMessagesLengthRef.current = messages.length;
            return;
        }

        // Only animate if one new message added
        if (messages.length === prevMessagesLengthRef.current + 1) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage?.role === 'assistant') {
                setNewMessageId(lastMessage._id);
                // Clear after animation completes
                const animationDuration = Math.min(lastMessage.content?.length * 10 || 2000, 5000);
                setTimeout(() => setNewMessageId(null), animationDuration);
            }
        }
        prevMessagesLengthRef.current = messages.length;
    }, [messages]);

    // Auto scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    // Handle document download from citation
    const handleViewDocument = (documentId) => {
        if (documentId) {
            window.location.href = documentsApi.getDownloadUrl(documentId);
        }
    };

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-6 shadow-glow">
                    <MessageSquare className="w-8 h-8 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                    How can I help you today?
                </h2>
                <p className="text-muted-foreground max-w-md mb-8">
                    // Answer from company documents with citations.
                </p>

                {/* Quick prompts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
                    {[
                        'What is our company vacation policy?',
                        'How do I submit an expense report?',
                        'What are the security guidelines?',
                        'Show me onboarding checklist',
                    ].map((prompt, i) => (
                        <button
                            key={i}
                            onClick={() => onQuickPrompt?.(prompt)}
                            className="p-3 text-left text-sm text-muted-foreground bg-secondary/50 
                         border border-border rounded-xl hover:bg-secondary 
                         hover:border-primary/50 transition-all"
                        >
                            {prompt}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="max-w-3xl mx-auto space-y-6">
                {messages.map((message) => (
                    <MessageBubble
                        key={message._id}
                        message={message}
                        onFeedback={onFeedback}
                        onViewDocument={handleViewDocument}
                        isNew={message._id === newMessageId}
                    />
                ))}

                {/* Typing indicator */}
                {isTyping && (
                    <div className="flex gap-4 animate-fade-in">
                        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                            <Sparkles className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-muted/80 border border-border/50">
                            <div className="flex gap-1.5 py-1">
                                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>
        </div>
    );
}
