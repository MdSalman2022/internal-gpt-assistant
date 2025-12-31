import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // Multi-tenant: Organization scope
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        index: true,
    },
    title: {
        type: String,
        default: 'New Conversation',
        trim: true,
    },
    // Auto-generate title from first message
    autoTitle: {
        type: Boolean,
        default: true,
    },
    messageCount: {
        type: Number,
        default: 0,
    },
    lastMessageAt: {
        type: Date,
        default: Date.now,
    },
    isArchived: {
        type: Boolean,
        default: false,
    },
    isPinned: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

// Indexes
conversationSchema.index({ userId: 1, lastMessageAt: -1 });
conversationSchema.index({ userId: 1, isPinned: -1, lastMessageAt: -1 });
conversationSchema.index({ organizationId: 1, userId: 1 }); // Multi-tenant queries

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
