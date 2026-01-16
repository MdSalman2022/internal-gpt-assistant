// APICredentials Model: Multi-tenant API key management
import mongoose from 'mongoose';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex').slice(0, 32);
const IV_LENGTH = 16;

// Encryption helpers

function encrypt(text) {
    if (!text) return null;
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
    if (!text) return null;
    try {
        const parts = text.split(':');
        const iv = Buffer.from(parts.shift(), 'hex');
        const encrypted = parts.join(':');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error.message);
        return null;
    }
}

// Schema

const apiCredentialSchema = new mongoose.Schema({
    // Ownership
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        default: null,  // null = Platform/Global key (fallback for all orgs)
        index: true
    },

    // Provider Configuration
    provider: {
        type: String,
        enum: ['gemini', 'openai', 'anthropic', 'groq'],
        required: true,
        index: true
    },

    // Encrypted API key
    encryptedApiKey: {
        type: String,
        required: true,
        select: false  // Never return in queries by default (security)
    },

    // Metadata
    label: {
        type: String,
        default: 'Default Key',
        trim: true
    },

    isActive: {
        type: Boolean,
        default: true,
        index: true
    },

    // Usage tracking
    usage: {
        totalRequests: { type: Number, default: 0 },
        totalTokens: { type: Number, default: 0 },
        totalCostCents: { type: Number, default: 0 },
        lastUsedAt: { type: Date, default: null }
    },

    // Rate limiting
    rateLimit: {
        requestsPerMinute: { type: Number, default: null },
        tokensPerDay: { type: Number, default: null }
    },

    // Audit trail
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    lastRotatedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null }  // For expiration policies
}, {
    timestamps: true  // Adds createdAt and updatedAt
});

// Indexes

// Compound index: Ensure only ONE active key per provider per org
apiCredentialSchema.index(
    { organizationId: 1, provider: 1, isActive: 1 },
    {
        unique: true,
        partialFilterExpression: { isActive: true },
        name: 'unique_active_credential_per_org_provider'
    }
);

// Performance index for lookups
apiCredentialSchema.index({ provider: 1, isActive: 1 });

// Middleware

// Encrypt API key before saving
apiCredentialSchema.pre('save', function (next) {
    if (this.isModified('encryptedApiKey') && this.encryptedApiKey && !this.encryptedApiKey.includes(':')) {
        this.encryptedApiKey = encrypt(this.encryptedApiKey);
    }
    next();
});

// Instance methods

// Decrypt API key
apiCredentialSchema.methods.getDecryptedKey = function () {
    return decrypt(this.encryptedApiKey);
};

// Check if expired
apiCredentialSchema.methods.isExpired = function () {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
};

// Check limits
apiCredentialSchema.methods.isRateLimited = function (tokensToConsume = 0) {
    if (!this.rateLimit.tokensPerDay) return false;
    const dailyUsage = this.usage.totalTokens || 0;
    return (dailyUsage + tokensToConsume) > this.rateLimit.tokensPerDay;
};

// Rotate key
apiCredentialSchema.methods.rotateKey = async function (newApiKey, updatedById) {
    this.encryptedApiKey = newApiKey;
    this.lastRotatedAt = new Date();
    this.updatedBy = updatedById;
    await this.save();
};

// Safe JSON
apiCredentialSchema.methods.toSafeJSON = function () {
    const decryptedKey = this.getDecryptedKey();
    return {
        _id: this._id,
        organizationId: this.organizationId,
        provider: this.provider,
        label: this.label,
        isActive: this.isActive,
        keyPreview: decryptedKey ? `***${decryptedKey.slice(-4)}` : null,
        usage: this.usage,
        rateLimit: this.rateLimit,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        lastRotatedAt: this.lastRotatedAt,
        expiresAt: this.expiresAt,
        isExpired: this.isExpired()
    };
};

// Static methods

// Find active credential (Org -> Platform fallback)
apiCredentialSchema.statics.findActiveCredential = async function (provider, organizationId = null) {
    // 1. Try organization-specific key
    if (organizationId) {
        const orgCredential = await this.findOne({
            organizationId,
            provider,
            isActive: true
        }).select('+encryptedApiKey');

        if (orgCredential && !orgCredential.isExpired()) {
            return orgCredential;
        }
    }

    // 2. Fallback to platform/global key
    const platformCredential = await this.findOne({
        organizationId: null,
        provider,
        isActive: true
    }).select('+encryptedApiKey');

    if (platformCredential && !platformCredential.isExpired()) {
        return platformCredential;
    }

    return null;
};

// Track usage
apiCredentialSchema.statics.trackUsage = async function (provider, organizationId, tokens, costCents) {
    await this.findOneAndUpdate(
        { organizationId, provider, isActive: true },
        {
            $inc: {
                'usage.totalRequests': 1,
                'usage.totalTokens': tokens,
                'usage.totalCostCents': costCents
            },
            $set: {
                'usage.lastUsedAt': new Date()
            }
        }
    );
};

// Upsert credential
apiCredentialSchema.statics.upsertCredential = async function (data) {
    const { organizationId, provider, apiKey, label, createdBy } = data;

    // Deactivate any existing active credential
    await this.updateMany(
        { organizationId, provider, isActive: true },
        { $set: { isActive: false } }
    );

    // Create new credential
    return this.create({
        organizationId,
        provider,
        encryptedApiKey: apiKey,
        label: label || 'Default Key',
        isActive: true,
        createdBy
    });
};

const APICredentials = mongoose.model('APICredentials', apiCredentialSchema);

export default APICredentials;
