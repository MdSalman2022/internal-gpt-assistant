'use client';

import { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { Send, Paperclip, Square, ArrowUp, X, FileText, Loader2, File } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { documentsApi } from '@/lib/api';

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

    // Mention state
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionIndex, setMentionIndex] = useState(0);
    const searchTimeout = useRef(null);

    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);

    const canUpload = hasPermission('chat:upload');

    // Expose focus method to parent
    useImperativeHandle(ref, () => ({
        focus: () => textareaRef.current?.focus(),
    }));

    const selectSuggestion = (doc) => {
        // Add file if not already attached
        if (!attachedFiles.some(f => f.id === doc._id)) {
            setAttachedFiles(prev => [...prev, {
                id: doc._id,
                name: doc.title || doc.originalName,
                size: doc.size,
                status: 'ready',
                source: 'reference'
            }]);
        }

        // Remove the @mention text
        const newValue = message.replace(/(?:^|\s)@(\w*)$/, '');
        setMessage(newValue);
        setShowSuggestions(false);
        setSuggestions([]);

        // Refocus
        textareaRef.current?.focus();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if ((!message.trim() && attachedFiles.length === 0) || disabled) return;

        // Send message with full file objects (parent will handle ID extraction)
        await onSend(message.trim(), attachedFiles);

        setMessage('');
        setAttachedFiles([]);
        setShowSuggestions(false);
    };

    const handleKeyDown = (e) => {
        // Mention navigation
        if (showSuggestions && suggestions.length > 0) {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setMentionIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
                return;
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setMentionIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
                return;
            }
            if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                selectSuggestion(suggestions[mentionIndex]);
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                setShowSuggestions(false);
                return;
            }
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handleInput = (e) => {
        const value = e.target.value;
        setMessage(value);
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';

        // Detect @ mention
        const match = value.match(/(?:^|\s)@(\w*)$/);

        if (match) {
            const query = match[1];
            setMentionQuery(query);
            // Don't show immediately empty, wait for search results unless query is empty (show recent?)
            // We'll show loading or allow empty search
            setMentionIndex(0);

            // Debounce search
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
            searchTimeout.current = setTimeout(async () => {
                try {
                    const res = await documentsApi.searchDocuments(query);
                    const docs = res.documents || [];
                    setSuggestions(docs);
                    setShowSuggestions(docs.length > 0);
                } catch (err) {
                    console.error('Mention search failed', err);
                }
            }, 300);
        } else {
            setShowSuggestions(false);
        }
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
                source: 'upload'
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
                {/* Mention Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute bottom-full left-0 mb-2 w-full max-w-md bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50">
                        <div className="text-xs text-muted-foreground px-3 py-2 bg-secondary/50 border-b border-border">
                            Select a document to attach
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                            {suggestions.map((doc, index) => (
                                <button
                                    key={doc._id}
                                    type="button"
                                    onClick={() => selectSuggestion(doc)}
                                    className={`
                                        w-full text-left px-3 py-2 flex items-center gap-3
                                        hover:bg-secondary transition-colors
                                        ${index === mentionIndex ? 'bg-secondary' : ''}
                                    `}
                                >
                                    <div className="bg-secondary p-1.5 rounded text-primary">
                                        <File className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm text-foreground truncate">{doc.title || doc.originalName}</div>
                                        <div className="text-xs text-muted-foreground flex gap-2">
                                            <span>{doc.mimeType?.split('/')[1] || 'file'}</span>
                                            {doc.size && <span>• {(doc.size / 1024).toFixed(0)} KB</span>}
                                        </div>
                                    </div>
                                    {index === mentionIndex && (
                                        <div className="text-xs text-muted-foreground">Enter</div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Attached Files Preview */}
                {attachedFiles.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                        {attachedFiles.map((file, index) => (
                            <div
                                key={index}
                                className={`
                                    flex items-center gap-2 px-3 py-2 rounded-lg
                                    ${file.status === 'error' ? 'bg-destructive/10 border border-destructive/20' :
                                        file.status === 'uploading' ? 'bg-secondary/50 border border-border' :
                                            'bg-secondary border border-border'}
                                `}
                            >
                                {file.status === 'uploading' ? (
                                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                ) : (
                                    <FileText className={`w-4 h-4 ${file.status === 'error' ? 'text-destructive' : 'text-primary'}`} />
                                )}
                                <div className="flex flex-col">
                                    <span className="text-sm text-foreground truncate max-w-[150px]">{file.name}</span>
                                    <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeFile(file.name)}
                                    className="p-1 hover:bg-card/50 rounded"
                                >
                                    <X className="w-3 h-3 text-muted-foreground" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className={`
                    flex items-end gap-2 p-2 bg-card/80 backdrop-blur
                    border border-border rounded-2xl
                    focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20
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
                                        ? 'text-muted-foreground/30 cursor-not-allowed'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}
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
                        className="flex-1 px-2 py-2 bg-transparent text-foreground 
                                 placeholder-muted-foreground resize-none
                                 focus:outline-none
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ minHeight: '44px', maxHeight: '200px' }}
                    />

                    {/* Send button */}
                    {isTyping ? (
                        <button
                            type="button"
                            className="p-2 text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded-lg transition-colors"
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
                                    ? 'bg-primary text-primary-foreground hover:opacity-90'
                                    : 'bg-secondary text-muted-foreground cursor-not-allowed'
                                }
                            `}
                        >
                            <ArrowUp className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Typing indicator */}
                {isTyping && (
                    <div className="absolute -top-8 left-4 flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="flex gap-1">
                            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span>AI is thinking...</span>
                    </div>
                )}

                {/* Disclaimer */}
                <p className="text-xs text-muted-foreground text-center mt-2">
                    KnowledgeAI can make mistakes. Verify important information.
                </p>
            </form>
        </div>
    );
});

export default ChatInput;
