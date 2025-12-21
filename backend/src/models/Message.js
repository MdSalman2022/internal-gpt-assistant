import mongoose from 'mongoose';

const citationSchema = new mongoose.Schema({
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        required: true,
    },
    documentTitle: {
        type: String,
        required: true,
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
    // Metadata
    tokens: {
        prompt: { type: Number, default: 0 },
        completion: { type: Number, default: 0 },
    },
    latency: {
        type: Number, // milliseconds
        default: null,
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
    // For "I don't know" responses
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

const Message = mongoose.model('Message', messageSchema);

export default Message;
