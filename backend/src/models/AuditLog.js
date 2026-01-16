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
            'MEMBER_INVITED', 'MEMBER_REMOVED', 'ROLE_UPDATED',
            'GUARDRAIL_BLOCK', 'GUARDRAIL_REDACT', // Security red flags
            'SYSTEM_ERROR',
            // Billing Actions
            'CHECKOUT_STARTED', 'SUBSCRIPTION_UPDATED', 'SUBSCRIPTION_CANCELLED', 'SUBSCRIPTION_REACTIVATED',
            'EMBEDDED_CHECKOUT_STARTED', 'PAYMENT_INTENT_CREATED'
        ]
    },
    resourceId: {
        type: String, // ID of Chat, Document, or User affected
    },
    resourceType: {
        type: String,
        enum: ['conversation', 'document', 'user', 'system', 'organization', 'subscription'],
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
    // Multi-tenant scope
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        index: true,
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
auditLogSchema.index({ organizationId: 1, timestamp: -1 }); // Organization-scoped logs

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
