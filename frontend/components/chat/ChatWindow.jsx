'use client';

import { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MessageBubble from './MessageBubble';
import { MessageSquare } from 'lucide-react';

export default function ChatWindow({ messages, isTyping, onFeedback, onQuickPrompt }) {
    const bottomRef = useRef(null);
    const router = useRouter();

    // Auto scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    // Handle opening a document from citation
    const handleViewDocument = (documentId) => {
        if (documentId) {
            router.push(`/documents?highlight=${documentId}`);
        }
    };

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center mb-6 shadow-glow">
                    <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                    How can I help you today?
                </h2>
                <p className="text-slate-400 max-w-md mb-8">
                    Ask me anything about your company documents. I'll find the answers and show you exactly where they came from.
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
                            className="p-3 text-left text-sm text-slate-300 bg-slate-800/50 
                         border border-slate-700 rounded-xl hover:bg-slate-800 
                         hover:border-primary-500/50 transition-all"
                        >
                            {prompt}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {messages.map((message) => (
                <MessageBubble
                    key={message._id}
                    message={message}
                    onFeedback={onFeedback}
                    onViewDocument={handleViewDocument}
                />
            ))}

            {/* Typing indicator */}
            {isTyping && (
                <div className="flex gap-3 animate-fade-in">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">AI</span>
                    </div>
                    <div className="message-assistant">
                        <div className="flex gap-1.5 py-1">
                            <span className="typing-dot" />
                            <span className="typing-dot animate-delay-100" />
                            <span className="typing-dot animate-delay-200" />
                        </div>
                    </div>
                </div>
            )}

            <div ref={bottomRef} />
        </div>
    );
}
