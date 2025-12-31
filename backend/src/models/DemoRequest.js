import mongoose from 'mongoose';

const demoRequestSchema = new mongoose.Schema({
    // Company Info
    companyName: {
        type: String,
        required: true,
        trim: true,
    },
    companySize: {
        type: String,
        enum: ['1-10', '11-50', '51-200', '201-500', '500+'],
        required: true,
    },
    industry: {
        type: String,
        trim: true,
    },
    website: {
        type: String,
        trim: true,
    },

    // Contact Info
    contactName: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    phone: {
        type: String,
        trim: true,
    },
    jobTitle: {
        type: String,
        trim: true,
    },

    // Interest
    interestedIn: {
        type: String,
        enum: ['starter', 'pro', 'enterprise', 'not_sure'],
        default: 'not_sure',
    },
    useCase: {
        type: String, // Description of their use case
        trim: true,
    },
    message: {
        type: String,
        trim: true,
    },

    // Scheduling
    preferredDate: Date,
    preferredTime: String, // e.g., "morning", "afternoon", "evening"
    timezone: String,

    // Status
    status: {
        type: String,
        enum: ['pending', 'contacted', 'scheduled', 'completed', 'no_show', 'cancelled'],
        default: 'pending',
    },
    scheduledAt: Date,
    completedAt: Date,

    // Internal
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    notes: {
        type: String, // Internal notes from sales team
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
    },

    // Source tracking
    source: {
        type: String, // e.g., 'website', 'referral', 'linkedin'
        default: 'website',
    },
    utmSource: String,
    utmMedium: String,
    utmCampaign: String,

    // Follow-up
    followUpDate: Date,
    followUpCount: { type: Number, default: 0 },
    lastContactedAt: Date,

    // Outcome
    outcome: {
        type: String,
        enum: ['converted', 'not_interested', 'pending', 'competitor', 'budget', 'timing'],
    },
    convertedToOrganizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
    },
}, {
    timestamps: true,
});

// Index for searching
demoRequestSchema.index({ email: 1 });
demoRequestSchema.index({ status: 1 });
demoRequestSchema.index({ createdAt: -1 });
demoRequestSchema.index({ companyName: 'text', contactName: 'text', email: 'text' });

// Get pending demo requests count
demoRequestSchema.statics.getPendingCount = async function () {
    return this.countDocuments({ status: 'pending' });
};

// Get demo requests by status
demoRequestSchema.statics.getByStatus = async function (status) {
    return this.find({ status })
        .sort({ createdAt: -1 })
        .populate('assignedTo', 'name email');
};

// Mark as contacted
demoRequestSchema.methods.markContacted = async function (userId, notes) {
    this.status = 'contacted';
    this.lastContactedAt = new Date();
    this.followUpCount += 1;
    if (notes) this.notes = (this.notes ? this.notes + '\n' : '') + `[${new Date().toISOString()}] ${notes}`;
    if (userId) this.assignedTo = userId;
    return this.save();
};

// Schedule demo
demoRequestSchema.methods.schedule = async function (scheduledAt, assignedTo) {
    this.status = 'scheduled';
    this.scheduledAt = scheduledAt;
    if (assignedTo) this.assignedTo = assignedTo;
    return this.save();
};

// Complete demo
demoRequestSchema.methods.complete = async function (outcome, notes) {
    this.status = 'completed';
    this.completedAt = new Date();
    if (outcome) this.outcome = outcome;
    if (notes) this.notes = (this.notes ? this.notes + '\n' : '') + `[COMPLETED ${new Date().toISOString()}] ${notes}`;
    return this.save();
};

const DemoRequest = mongoose.model('DemoRequest', demoRequestSchema);

export default DemoRequest;
