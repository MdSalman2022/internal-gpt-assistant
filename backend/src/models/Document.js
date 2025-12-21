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
    filename: {
        type: String,
        required: true,
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
    source: {
        type: String,
        enum: ['upload', 'notion', 'confluence', 'gdrive', 'slack', 'url'],
        default: 'upload',
    },
    sourceUrl: {
        type: String,
        default: null,
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
    // Access control
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    department: {
        type: String,
        default: null,
    },
    isPublic: {
        type: Boolean,
        default: false,
    },
    allowedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    allowedDepartments: [{
        type: String,
    }],
    // Metadata
    metadata: {
        author: String,
        createdDate: Date,
        lastModified: Date,
        pageCount: Number,
        wordCount: Number,
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

const Document = mongoose.model('Document', documentSchema);

export default Document;
