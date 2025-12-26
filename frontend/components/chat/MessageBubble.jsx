'use client';

import { ThumbsUp, ThumbsDown, Copy, Check, FileText, Clock, Sparkles, X, ExternalLink } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

// Typing animation hook
function useTypingEffect(text, speed = 15, enabled = true) {
    const [displayedText, setDisplayedText] = useState('');
    const [isComplete, setIsComplete] = useState(!enabled);

    useEffect(() => {
        if (!enabled || !text) {
            setDisplayedText(text || '');
            setIsComplete(true);
            return;
        }

        setDisplayedText('');
        setIsComplete(false);
        let index = 0;

        const timer = setInterval(() => {
            if (index < text.length) {
                // Add multiple characters at once for faster typing
                const charsToAdd = Math.min(3, text.length - index);
                setDisplayedText(text.slice(0, index + charsToAdd));
                index += charsToAdd;
            } else {
                setIsComplete(true);
                clearInterval(timer);
            }
        }, speed);

        return () => clearInterval(timer);
    }, [text, speed, enabled]);

    return { displayedText, isComplete };
}

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ... (useTypingEffect remains same)

export default function MessageBubble({ message, onFeedback, onViewDocument, isNew = false }) {
    const [copied, setCopied] = useState(false);
    const [selectedCitation, setSelectedCitation] = useState(null);
    const isUser = message.role === 'user';

    // Only animate if it's a new assistant message
    const shouldAnimate = !isUser && isNew;
    const { displayedText, isComplete } = useTypingEffect(
        message.content,
        10, // Speed (ms per batch)
        shouldAnimate
    );

    const contentToShow = shouldAnimate ? displayedText : message.content;

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Pre-process content to handle citations as links for ReactMarkdown
    // Converts [Source 1, 2] to [1, 2](#citation-1-2) which is a valid URL
    const processedContent = contentToShow?.replace(/\[Source (\d+(?:,\s*\d+)*)\]/g, (match, nums) => {
        // Create a safe ID string: "1, 2" -> "1-2"
        const safeId = nums.replace(/[\s,]+/g, '-');
        return ` [${nums}](#citation-${safeId}) `;
    });

    return (
        <>
            <div className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
                {/* Avatar for assistant */}
                {!isUser && (
                    <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[75%] ${isUser ? 'order-first' : ''}`}>
                    {/* Message bubble */}
                    <div className={`
                        rounded-2xl px-5 py-4
                        ${isUser
                            ? 'bg-primary-600 text-white rounded-br-md'
                            : 'bg-slate-800/80 text-slate-200 rounded-bl-md border border-slate-700/50'
                        }
                    `}>
                        <div className="text-[15px] markdown-content">
                            {isUser ? (
                                <p className="whitespace-pre-wrap">{message.content}</p>
                            ) : (
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        // Custom link handler for citations
                                        a: ({ node, href, children, ...props }) => {
                                            if (href?.includes('citation-')) {
                                                // Extract IDs from format "citation-1-2"
                                                const nums = href.split('citation-')[1].split('-');
                                                return (
                                                    <span className="inline-flex gap-1 mx-1 align-baseline">
                                                        {nums.map(numStr => {
                                                            const num = parseInt(numStr);
                                                            const citation = message.citations?.[num - 1];
                                                            return (
                                                                <button
                                                                    key={num}
                                                                    onClick={() => setSelectedCitation({ ...citation, sourceNum: num })}
                                                                    className="inline-flex items-center justify-center w-5 h-5 
                                                                               bg-primary-500/20 hover:bg-primary-500/30 
                                                                               text-primary-400 text-[10px] font-bold rounded 
                                                                               transition-all hover:scale-110 border border-primary-500/30
                                                                               align-middle transform -translate-y-0.5"
                                                                    title="View Source"
                                                                >
                                                                    {num}
                                                                </button>
                                                            );
                                                        })}
                                                    </span>
                                                );
                                            }
                                            return <a href={href} className="text-primary-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
                                        },
                                        // Styling for other elements
                                        p: ({ node, children }) => <p className="mb-3 last:mb-0 leading-7">{children}</p>,
                                        ul: ({ node, children }) => <ul className="list-disc list-outside ml-4 mb-4 space-y-1">{children}</ul>,
                                        ol: ({ node, children }) => <ol className="list-decimal list-outside ml-4 mb-4 space-y-1">{children}</ol>,
                                        li: ({ node, children }) => <li className="pl-1 text-slate-300">{children}</li>,
                                        h1: ({ node, children }) => <h1 className="text-xl font-bold text-white mb-3 mt-4 first:mt-0">{children}</h1>,
                                        h2: ({ node, children }) => <h2 className="text-lg font-bold text-white mb-2 mt-4">{children}</h2>,
                                        h3: ({ node, children }) => <h3 className="text-base font-bold text-white mb-2 mt-3">{children}</h3>,
                                        blockquote: ({ node, children }) => <blockquote className="border-l-4 border-slate-600 pl-4 py-1 my-4 text-slate-400 italic bg-slate-900/30 rounded-r">{children}</blockquote>,
                                        code: ({ node, inline, className, children, ...props }) => {
                                            return inline ? (
                                                <code className="bg-slate-900 px-1.5 py-0.5 rounded text-sm font-mono text-primary-200 border border-slate-700/50" {...props}>
                                                    {children}
                                                </code>
                                            ) : (
                                                <div className="relative group my-4">
                                                    <pre className="bg-slate-950 p-4 rounded-lg overflow-x-auto border border-slate-800 text-sm font-mono text-slate-300 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                                                        <code {...props}>{children}</code>
                                                    </pre>
                                                </div>
                                            );
                                        },
                                        table: ({ node, children }) => (
                                            <div className="overflow-x-auto my-4 border border-slate-700/50 rounded-lg">
                                                <table className="w-full text-sm text-left text-slate-300 min-w-max">
                                                    {children}
                                                </table>
                                            </div>
                                        ),
                                        thead: ({ node, children }) => (
                                            <thead className="text-xs uppercase bg-slate-900/80 text-slate-400">
                                                {children}
                                            </thead>
                                        ),
                                        th: ({ node, children }) => (
                                            <th className="px-4 py-3 font-semibold border-b border-slate-700 whitespace-nowrap">
                                                {children}
                                            </th>
                                        ),
                                        td: ({ node, children }) => (
                                            <td className="px-4 py-3 border-b border-slate-800/50">
                                                {children}
                                            </td>
                                        ),
                                        tr: ({ node, children }) => (
                                            <tr className="hover:bg-slate-700/20 transition-colors">
                                                {children}
                                            </tr>
                                        ),
                                    }}
                                >
                                    {processedContent}
                                </ReactMarkdown>
                            )}

                            {/* Typing cursor */}
                            {!isUser && !isComplete && (
                                <span className="inline-block w-2 h-4 bg-primary-400 ml-1 animate-pulse align-middle" />
                            )}
                        </div>

                        {/* Attachments */}
                        {message.attachments?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-white/10">
                                {message.attachments.map((file, i) => (
                                    <button
                                        key={i}
                                        onClick={() => onViewDocument?.(file.documentId)}
                                        className={`
                                            flex items-center gap-2 p-2 rounded-lg text-sm text-left
                                            transition-colors border
                                            ${isUser
                                                ? 'bg-black/20 hover:bg-black/30 border-white/10'
                                                : 'bg-black/20 hover:bg-black/30 border-slate-600/50'
                                            }
                                        `}
                                    >
                                        <FileText className="w-4 h-4 opacity-70" />
                                        <div className="flex flex-col">
                                            <span className="font-medium truncate max-w-[150px]">{file.name}</span>
                                            <span className="text-xs opacity-60">{(file.size / 1024).toFixed(1)} KB</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>


                    {/* Sources for assistant messages - only show after typing complete */}
                    {!isUser && isComplete && message.citations?.length > 0 && (
                        <div className="mt-3">
                            <p className="text-xs text-slate-500 mb-2">📎 Sources ({message.citations.length})</p>
                            <div className="flex flex-wrap gap-2">
                                {/* Deduplicate citations by documentId for the buttons list */}
                                {(() => {
                                    const uniqueDocs = new Map();
                                    message.citations.forEach((citation, i) => {
                                        if (!uniqueDocs.has(citation.documentId)) {
                                            uniqueDocs.set(citation.documentId, { ...citation, originalIndex: i });
                                        }
                                    });

                                    return Array.from(uniqueDocs.values()).map((citation) => (
                                        <button
                                            key={citation.originalIndex}
                                            onClick={() => setSelectedCitation({ ...citation, sourceNum: citation.originalIndex + 1 })}
                                            className="group flex items-center gap-2 px-3 py-2 
                                                       bg-slate-800/60 hover:bg-slate-700 
                                                       rounded-lg text-xs transition-all
                                                       border border-slate-700/50 hover:border-primary-500/50
                                                       hover:shadow-lg hover:shadow-primary-500/10"
                                        >
                                            <span className="w-5 h-5 rounded bg-primary-500/20 text-primary-400 flex items-center justify-center text-[10px] font-bold group-hover:bg-primary-500 group-hover:text-white transition-colors">
                                                {citation.originalIndex + 1}
                                            </span>
                                            <span className="text-slate-300 truncate max-w-[140px] group-hover:text-white">
                                                {citation.documentTitle || 'Document'}
                                            </span>
                                        </button>
                                    ));
                                })()}
                            </div>
                        </div>
                    )}

                    {/* Actions for assistant messages - only show after typing complete */}
                    {!isUser && isComplete && (
                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-700/30">
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-1.5 px-2 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-700/50 rounded transition-colors"
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-3.5 h-3.5 text-primary-400" />
                                        <span className="text-primary-400">Copied</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>Copy</span>
                                    </>
                                )}
                            </button>

                            <div className="flex items-center gap-1 ml-auto">
                                <button
                                    onClick={() => onFeedback?.(message._id, 'positive')}
                                    className={`p-1.5 rounded hover:bg-slate-700/50 transition-colors ${message.feedback === 'positive' ? 'text-primary-400 bg-primary-400/10' : 'text-slate-500'
                                        }`}
                                    title="Good response"
                                >
                                    <ThumbsUp className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => onFeedback?.(message._id, 'negative')}
                                    className={`p-1.5 rounded hover:bg-slate-700/50 transition-colors ${message.feedback === 'negative' ? 'text-red-400 bg-red-400/10' : 'text-slate-500'
                                        }`}
                                    title="Bad response"
                                >
                                    <ThumbsDown className="w-4 h-4" />
                                </button>
                            </div>

                            {message.latency && (
                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                    <Clock className="w-3 h-3" />
                                    {(message.latency / 1000).toFixed(1)}s
                                </div>
                            )}
                        </div>
                    )}

                    {/* Low confidence warning */}
                    {!isUser && isComplete && message.isLowConfidence && (
                        <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                            Low confidence - verify with source documents
                        </div>
                    )}
                </div>

                {/* Avatar for user */}
                {isUser && (
                    <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center">
                        <span className="text-slate-300 text-sm font-semibold">U</span>
                    </div>
                )}
            </div>

            {/* Citation Preview Modal */}
            {selectedCitation && (
                <CitationModal
                    citation={selectedCitation}
                    onClose={() => setSelectedCitation(null)}
                    onViewDocument={onViewDocument}
                />
            )}
        </>
    );
}

// Citation Preview Modal Component
function CitationModal({ citation, onClose, onViewDocument }) {
    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl animate-scale-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-primary-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">Source {citation.sourceNum}</h3>
                            <p className="text-sm text-slate-400 truncate max-w-[300px]">
                                {citation.documentTitle || 'Document'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {/* Relevance Score */}
                    {citation.relevanceScore && (
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-xs text-slate-500">Relevance:</span>
                            <div className="flex-1 max-w-[200px] h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
                                    style={{ width: `${Math.min(citation.relevanceScore * 10, 100)}%` }}
                                />
                            </div>
                            <span className="text-xs text-primary-400 font-medium">
                                {(citation.relevanceScore * 10).toFixed(0)}%
                            </span>
                        </div>
                    )}

                    {/* Cited Text */}
                    <div className="relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 rounded-full" />
                        <blockquote className="pl-4 py-2">
                            <p className="text-slate-200 text-[15px] leading-relaxed whitespace-pre-wrap">
                                {citation.content || 'No content available for this citation.'}
                            </p>
                        </blockquote>
                    </div>

                    {/* Metadata */}
                    {citation.pageNumber && (
                        <p className="mt-4 text-sm text-slate-500">
                            📄 Page {citation.pageNumber}
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-800/50">
                    <p className="text-xs text-slate-500">
                        Click "Download Document" to save the full source
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                        >
                            Close
                        </button>
                        <button
                            onClick={() => {
                                onViewDocument?.(citation.documentId);
                                onClose();
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            <FileText className="w-4 h-4" />
                            Download Document
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
