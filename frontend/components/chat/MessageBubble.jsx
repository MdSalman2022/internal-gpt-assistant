'use client';

import { ThumbsUp, ThumbsDown, Copy, Check, FileText, Clock, Sparkles, X, ExternalLink } from 'lucide-react';
import { useState } from 'react';

export default function MessageBubble({ message, onFeedback, onViewDocument }) {
    const [copied, setCopied] = useState(false);
    const [selectedCitation, setSelectedCitation] = useState(null);
    const isUser = message.role === 'user';

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Format markdown-like content
    const formatContent = (text) => {
        if (!text) return null;

        const paragraphs = text.split(/\n\n+/);

        return paragraphs.map((para, pIdx) => {
            // Handle bullet points
            if (para.match(/^[\*\-•]\s/m)) {
                const items = para.split(/\n/).filter(Boolean);
                return (
                    <ul key={pIdx} className="list-disc list-inside space-y-1 my-2 ml-2">
                        {items.map((item, i) => (
                            <li key={i} className="text-slate-200">
                                {formatInlineText(item.replace(/^[\*\-•]\s*/, ''))}
                            </li>
                        ))}
                    </ul>
                );
            }

            // Handle numbered lists
            if (para.match(/^\d+\.\s/m)) {
                const items = para.split(/\n/).filter(Boolean);
                return (
                    <ol key={pIdx} className="list-decimal list-inside space-y-1 my-2 ml-2">
                        {items.map((item, i) => (
                            <li key={i} className="text-slate-200">
                                {formatInlineText(item.replace(/^\d+\.\s*/, ''))}
                            </li>
                        ))}
                    </ol>
                );
            }

            // Regular paragraph
            return (
                <p key={pIdx} className="my-2 leading-relaxed">
                    {formatInlineText(para)}
                </p>
            );
        });
    };

    // Format inline text (bold, citations)
    const formatInlineText = (text) => {
        if (!text) return null;

        const parts = text.split(/(\*\*[^*]+\*\*|\[Source \d+(?:,\s*\d+)*\])/g);

        return parts.map((part, i) => {
            // Bold text
            if (part.match(/^\*\*[^*]+\*\*$/)) {
                return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
            }

            // Citations [Source 1] or [Source 1, 2, 3]
            const citationMatch = part.match(/\[Source ([\d,\s]+)\]/);
            if (citationMatch) {
                const nums = citationMatch[1].split(/,\s*/).map(n => parseInt(n.trim()));
                return (
                    <span key={i} className="inline-flex gap-1 mx-1">
                        {nums.map(num => {
                            const citation = message.citations?.[num - 1];
                            return (
                                <button
                                    key={num}
                                    onClick={() => setSelectedCitation({ ...citation, sourceNum: num })}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 
                                               bg-primary-500/20 hover:bg-primary-500/30 
                                               text-primary-400 text-xs font-medium rounded 
                                               transition-all hover:scale-105 border border-primary-500/30"
                                    title="Click to view source"
                                >
                                    {num}
                                </button>
                            );
                        })}
                    </span>
                );
            }

            return <span key={i}>{part}</span>;
        });
    };

    return (
        <>
            <div className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
                {/* Avatar for assistant */}
                {!isUser && (
                    <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                )}

                <div className={`max-w-[80%] ${isUser ? 'order-first' : ''}`}>
                    {/* Message bubble */}
                    <div className={`
                        rounded-2xl px-4 py-3
                        ${isUser
                            ? 'bg-primary-600 text-white rounded-br-md'
                            : 'bg-slate-800/80 text-slate-200 rounded-bl-md border border-slate-700/50'
                        }
                    `}>
                        <div className="text-[15px]">
                            {isUser ? message.content : formatContent(message.content)}
                        </div>
                    </div>

                    {/* Sources for assistant messages */}
                    {!isUser && message.citations?.length > 0 && (
                        <div className="mt-3">
                            <p className="text-xs text-slate-500 mb-2">📎 Sources ({message.citations.length})</p>
                            <div className="flex flex-wrap gap-2">
                                {message.citations.map((citation, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedCitation({ ...citation, sourceNum: i + 1 })}
                                        className="group flex items-center gap-2 px-3 py-2 
                                                   bg-slate-800/60 hover:bg-slate-700 
                                                   rounded-lg text-xs transition-all
                                                   border border-slate-700/50 hover:border-primary-500/50
                                                   hover:shadow-lg hover:shadow-primary-500/10"
                                    >
                                        <span className="w-5 h-5 rounded bg-primary-500/20 text-primary-400 flex items-center justify-center text-[10px] font-bold group-hover:bg-primary-500 group-hover:text-white transition-colors">
                                            {i + 1}
                                        </span>
                                        <span className="text-slate-300 truncate max-w-[140px] group-hover:text-white">
                                            {citation.documentTitle || 'Document'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions for assistant messages */}
                    {!isUser && (
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
                    {!isUser && message.isLowConfidence && (
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
                        Click "Open Document" to view the full source
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
                            <ExternalLink className="w-4 h-4" />
                            Open Document
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
