import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false, // Can be null for failed logins or system actions
    },
    userEmail: {
        type: String,
        required: false,
    },
    role: {
        type: String, // Snapshot of role at time of action
    },
    action: {
        type: String,
        required: true,
        enum: [
            'LOGIN', 'LOGOUT',
            'QUERY',
            'VIEW_DOCUMENT', 'DOWNLOAD_DOCUMENT', 'UPLOAD_DOCUMENT', 'DELETE_DOCUMENT',
            'USER_UPDATE', 'USER_DELETE',
            'GUARDRAIL_BLOCK', 'GUARDRAIL_REDACT', // Security red flags
            'SYSTEM_ERROR'
        ]
    },
    resourceId: {
        type: String, // ID of Chat, Document, or User affected
    },
    resourceType: {
        type: String,
        enum: ['conversation', 'document', 'user', 'system'],
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    ipAddress: String,
    userAgent: String,
    status: {
        type: String,
        enum: ['SUCCESS', 'FAILURE', 'DENIED'],
        default: 'SUCCESS',
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true,
    }
}, {
    timestamps: true, // adds createdAt/updatedAt
});

// Indexes for fast filtering
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ "details.documentId": 1 }); // To find who accessed a specific doc

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
