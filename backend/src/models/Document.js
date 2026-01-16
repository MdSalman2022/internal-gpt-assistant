import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        default: '',
    },
    originalName: {
        type: String,
        required: true,
    },
    mimeType: {
        type: String,
        required: true,
    },
    size: {
        type: Number,
        required: true,
    },
    // Source info - supports Cloudinary and other integrations
    source: {
        type: {
            type: String,
            enum: ['upload', 'notion', 'confluence', 'gdrive', 'slack', 'url'],
            default: 'upload',
        },
        url: String,
        cloudinaryId: String,
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending',
    },
    processingError: {
        type: String,
        default: null,
    },
    chunkCount: {
        type: Number,
        default: 0,
    },

    // Vector sync tracking
    vectorCount: {
        type: Number,  // Actual count in Qdrant (should match chunkCount)
        default: 0,
    },
    lastVectorSync: {
        type: Date,    // Last time vectors were synced to Qdrant
        default: null,
    },

    // Usage analytics
    queryCount: {
        type: Number,  // How many times this document was cited
        default: 0,
    },
    lastAccessedAt: {
        type: Date,    // Last time document was used in a response
        default: null,
    },

    // Access control
    uploadedBy: {
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
    department: {
        type: String,
        default: null,
    },
    accessLevel: {
        type: String,
        enum: ['private', 'department', 'public'],
        default: 'private',
    },
    // Document scoped to specific conversation
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        default: null,
    },
    // Global documents are available to all users in RAG queries
    isGlobal: {
        type: Boolean,
        default: true,
    },
    allowedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    allowedDepartments: [{
        type: String,
    }],
    allowedTeams: [{
        type: String, // e.g. 'Engineering:Frontend', 'Sales:North'
    }],
    // Specific user emails who can access (for fine-grained control)
    allowedUserEmails: [{
        type: String,
        lowercase: true,
        trim: true,
    }],
    // Metadata
    metadata: {
        author: String,
        createdDate: Date,
        lastModified: Date,
        pageCount: Number,
        wordCount: Number,
        charCount: Number,
        language: String,
    },
    tags: [{
        type: String,
        lowercase: true,
    }],
}, {
    timestamps: true,
});

// Indexes for efficient searching
documentSchema.index({ title: 'text', description: 'text', tags: 'text' });
documentSchema.index({ uploadedBy: 1, status: 1 });
documentSchema.index({ department: 1 });
documentSchema.index({ queryCount: -1 }); // For popular documents
documentSchema.index({ lastAccessedAt: -1 }); // For recently used
documentSchema.index({ organizationId: 1, status: 1 }); // Multi-tenant queries
documentSchema.index({ organizationId: 1, uploadedBy: 1 }); // User's docs within org

const Document = mongoose.model('Document', documentSchema);

export default Document;
