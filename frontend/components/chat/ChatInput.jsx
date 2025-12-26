'use client';

import { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { Send, Paperclip, Square, ArrowUp, X, FileText, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const ChatInput = forwardRef(function ChatInput({
    onSend,
    onFileUpload,
    disabled,
    isTyping,
    placeholder = "Message KnowledgeAI...",
    centered = false,
    conversationId = null
}, ref) {
    const { hasPermission } = useAuth();
    const [message, setMessage] = useState('');
    const [attachedFiles, setAttachedFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);

    const canUpload = hasPermission('chat:upload');

    // Expose focus method to parent
    useImperativeHandle(ref, () => ({
        focus: () => textareaRef.current?.focus(),
    }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if ((!message.trim() && attachedFiles.length === 0) || disabled) return;

        // Send message with attached file IDs
        const fileIds = attachedFiles.map(f => f.id).filter(Boolean);
        await onSend(message.trim(), fileIds);
        setMessage('');
        setAttachedFiles([]);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handleInput = (e) => {
        setMessage(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
    };

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Validate file types
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'text/plain',
            'text/markdown',
            'text/csv',
        ];

        for (const file of files) {
            if (!allowedTypes.includes(file.type)) {
                alert(`File type not supported: ${file.name}\nAllowed: PDF, Word, TXT, Markdown, CSV`);
                continue;
            }

            // Add file to attached list with pending status
            const tempFile = {
                id: null,
                name: file.name,
                size: file.size,
                status: 'uploading',
            };
            setAttachedFiles(prev => [...prev, tempFile]);
            setUploading(true);

            try {
                // Upload file
                if (onFileUpload) {
                    const result = await onFileUpload(file, conversationId);
                    // Update file status
                    setAttachedFiles(prev =>
                        prev.map(f => f.name === file.name && f.status === 'uploading'
                            ? { ...f, id: result.documentId, status: 'ready' }
                            : f
                        )
                    );
                }
            } catch (error) {
                console.error('File upload failed:', error);
                setAttachedFiles(prev =>
                    prev.map(f => f.name === file.name && f.status === 'uploading'
                        ? { ...f, status: 'error' }
                        : f
                    )
                );
            } finally {
                setUploading(false);
            }
        }

        // Reset file input
        e.target.value = '';
    };

    const removeFile = (fileName) => {
        setAttachedFiles(prev => prev.filter(f => f.name !== fileName));
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className={`px-4 pb-4 ${centered ? 'pt-0' : 'pt-2'}`}>
            <form
                onSubmit={handleSubmit}
                className={`relative ${centered ? 'max-w-3xl mx-auto' : ''}`}
            >
                {/* Attached Files Preview */}
                {attachedFiles.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                        {attachedFiles.map((file, index) => (
                            <div
                                key={index}
                                className={`
                                    flex items-center gap-2 px-3 py-2 rounded-lg
                                    ${file.status === 'error' ? 'bg-red-500/20 border border-red-500/30' :
                                        file.status === 'uploading' ? 'bg-slate-700/50 border border-slate-600' :
                                            'bg-slate-700 border border-slate-600'}
                                `}
                            >
                                {file.status === 'uploading' ? (
                                    <Loader2 className="w-4 h-4 text-primary-400 animate-spin" />
                                ) : (
                                    <FileText className={`w-4 h-4 ${file.status === 'error' ? 'text-red-400' : 'text-primary-400'}`} />
                                )}
                                <div className="flex flex-col">
                                    <span className="text-sm text-white truncate max-w-[150px]">{file.name}</span>
                                    <span className="text-xs text-slate-400">{formatFileSize(file.size)}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeFile(file.name)}
                                    className="p-1 hover:bg-slate-600 rounded"
                                >
                                    <X className="w-3 h-3 text-slate-400" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className={`
                    flex items-end gap-2 p-2 bg-slate-800/80 backdrop-blur
                    border border-slate-700 rounded-2xl
                    focus-within:border-slate-600 focus-within:ring-1 focus-within:ring-slate-600
                    transition-all
                `}>
                    {/* Attachment button - only show if user has permission */}
                    {canUpload && (
                        <>
                            <input
                                ref={fileInputRef}
                                type="file"
                                onChange={handleFileSelect}
                                accept=".pdf,.doc,.docx,.txt,.md,.csv"
                                multiple
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className={`
                                    p-2 rounded-lg transition-colors
                                    ${uploading
                                        ? 'text-slate-600 cursor-not-allowed'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-700'}
                                `}
                                title="Attach file (PDF, Word, TXT)"
                            >
                                {uploading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Paperclip className="w-5 h-5" />
                                )}
                            </button>
                        </>
                    )}

                    {/* Input area */}
                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={disabled}
                        rows={1}
                        className="flex-1 px-2 py-2 bg-transparent text-white 
                                 placeholder-slate-500 resize-none
                                 focus:outline-none
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ minHeight: '44px', maxHeight: '200px' }}
                    />

                    {/* Send button */}
                    {isTyping ? (
                        <button
                            type="button"
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Stop generating"
                        >
                            <Square className="w-5 h-5 fill-current" />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={(!message.trim() && attachedFiles.length === 0) || disabled || uploading}
                            className={`
                                p-2 rounded-lg transition-all
                                ${(message.trim() || attachedFiles.length > 0) && !uploading
                                    ? 'bg-white text-slate-900 hover:bg-slate-200'
                                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                }
                            `}
                        >
                            <ArrowUp className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Typing indicator */}
                {isTyping && (
                    <div className="absolute -top-8 left-4 flex items-center gap-2 text-sm text-slate-400">
                        <div className="flex gap-1">
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span>AI is thinking...</span>
                    </div>
                )}

                {/* Disclaimer */}
                <p className="text-xs text-slate-500 text-center mt-2">
                    KnowledgeAI can make mistakes. Verify important information.
                </p>
            </form>
        </div>
    );
});

export default ChatInput;
