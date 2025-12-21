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
        url: String,           // Cloudinary URL or external URL
        cloudinaryId: String,  // Cloudinary public ID for deletion
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
    accessLevel: {
        type: String,
        enum: ['private', 'department', 'public'],
        default: 'private',
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

const Document = mongoose.model('Document', documentSchema);

export default Document;
