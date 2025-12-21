'use client';

import { useState } from 'react';
import { Send, Paperclip, Mic, Square } from 'lucide-react';

export default function ChatInput({ onSend, disabled, isTyping }) {
    const [message, setMessage] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!message.trim() || disabled) return;
        onSend(message.trim());
        setMessage('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-end gap-2 p-4 bg-slate-900 border-t border-slate-800">
                {/* Attachment button */}
                <button
                    type="button"
                    className="btn-icon flex-shrink-0"
                    title="Attach file"
                >
                    <Paperclip className="w-5 h-5" />
                </button>

                {/* Input area */}
                <div className="flex-1 relative">
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask anything about your documents..."
                        disabled={disabled}
                        rows={1}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl
                       text-slate-100 placeholder-slate-500 resize-none
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                       disabled:opacity-50 disabled:cursor-not-allowed
                       max-h-32 overflow-y-auto"
                        style={{ minHeight: '48px' }}
                    />
                </div>

                {/* Send button */}
                {isTyping ? (
                    <button
                        type="button"
                        className="btn-icon flex-shrink-0 text-error"
                        title="Stop generating"
                    >
                        <Square className="w-5 h-5 fill-current" />
                    </button>
                ) : (
                    <button
                        type="submit"
                        disabled={!message.trim() || disabled}
                        className="flex-shrink-0 p-3 bg-primary-500 text-white rounded-xl
                       hover:bg-primary-600 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Typing indicator */}
            {isTyping && (
                <div className="absolute -top-8 left-4 flex items-center gap-2 text-sm text-slate-400">
                    <div className="flex gap-1">
                        <span className="typing-dot" />
                        <span className="typing-dot animate-delay-100" />
                        <span className="typing-dot animate-delay-200" />
                    </div>
                    <span>AI is thinking...</span>
                </div>
            )}
        </form>
    );
}
