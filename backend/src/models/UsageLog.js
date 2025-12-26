import mongoose from 'mongoose';

const usageLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation'
    },
    promptTokens: {
        type: Number,
        default: 0
    },
    completionTokens: {
        type: Number,
        default: 0
    },
    totalTokens: {
        type: Number,
        default: 0
    },
    model: {
        type: String,
        required: true
    },
    provider: {
        type: String,
        enum: ['gemini', 'openai', 'anthropic'],
        required: true
    },
    estimatedCost: {
        type: Number, // In USD cents for precision
        default: 0
    },
    requestType: {
        type: String,
        enum: ['chat', 'embedding', 'other'],
        default: 'chat'
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Indexes for fast aggregation queries
usageLogSchema.index({ userId: 1, timestamp: -1 });
usageLogSchema.index({ userId: 1, timestamp: 1 }); // For date range queries
usageLogSchema.index({ provider: 1, timestamp: -1 });

// Static method to get user's usage for a date range
usageLogSchema.statics.getUserUsage = async function (userId, startDate, endDate) {
    const result = await this.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                timestamp: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: null,
                totalPromptTokens: { $sum: '$promptTokens' },
                totalCompletionTokens: { $sum: '$completionTokens' },
                totalTokens: { $sum: '$totalTokens' },
                totalCost: { $sum: '$estimatedCost' },
                requestCount: { $sum: 1 }
            }
        }
    ]);

    return result[0] || {
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        totalTokens: 0,
        totalCost: 0,
        requestCount: 0
    };
};

// Static method to get daily usage breakdown
usageLogSchema.statics.getDailyUsage = async function (userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                timestamp: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
                tokens: { $sum: '$totalTokens' },
                cost: { $sum: '$estimatedCost' },
                requests: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);
};

const UsageLog = mongoose.model('UsageLog', usageLogSchema);

export default UsageLog;
