import mongoose from 'mongoose';

const citationSchema = new mongoose.Schema({
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        required: true,
    },
    documentTitle: {
        type: String,
        default: 'Untitled Document',
    },
    chunkId: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    relevanceScore: {
        type: Number,
        required: true,
    },
    pageNumber: {
        type: Number,
        default: null,
    },
}, { _id: false });

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
    },
    role: {
        type: String,
        enum: ['user', 'assistant', 'system'],
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    // Citations for assistant messages
    citations: [citationSchema],

    // Files attached to this message (user uplods)
    attachments: [{
        documentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Document',
            required: true,
        },
        name: { type: String, required: true },
        mimeType: { type: String, required: true },
        size: { type: Number, required: true },
        source: {
            type: String,
            enum: ['upload', 'reference'],
            default: 'upload'
        }
    }],

    // Token tracking for billing/analytics
    tokens: {
        prompt: { type: Number, default: 0 },
        completion: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
    },

    // Performance metrics
    latency: {
        type: Number, // Total response time in ms
        default: null,
    },
    timings: {
        embed: { type: Number, default: 0 },    // Embedding generation time
        search: { type: Number, default: 0 },   // Vector + keyword search time
        generate: { type: Number, default: 0 }, // LLM generation time
    },

    // RAG metadata
    sourcesSearched: {
        type: Number,  // How many chunks were searched
        default: 0,
    },

    // User feedback
    feedback: {
        type: String,
        enum: ['positive', 'negative', null],
        default: null,
    },
    feedbackComment: {
        type: String,
        default: null,
    },

    // Confidence tracking
    isLowConfidence: {
        type: Boolean,
        default: false,
    },
    confidence: {
        type: Number,
        default: null,
    },
}, {
    timestamps: true,
});

// Indexes
messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ 'citations.documentId': 1 });
messageSchema.index({ feedback: 1 }); // For analytics queries

const Message = mongoose.model('Message', messageSchema);

export default Message;
