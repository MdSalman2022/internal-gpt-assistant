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
    } catch {
        return null;
    }
}

const adminSettingsSchema = new mongoose.Schema({
    // Singleton pattern - always use _id: 'main'
    _id: { type: String, default: 'main' },

    // AI Model Settings
    selectedModel: {
        type: String,
        default: 'gemini-2.5-flash',
        enum: ['gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-3-pro-preview', 'gemini-1.5-flash', 'gemini-1.5-pro']
    },

    // API Keys (encrypted)
    geminiApiKey: { type: String, default: null }, // Encrypted
    openaiApiKey: { type: String, default: null }, // Encrypted
    anthropicApiKey: { type: String, default: null }, // Encrypted

    // Metadata
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now }
}, { _id: false });

// Encrypt API keys before save
adminSettingsSchema.pre('save', function (next) {
    if (this.isModified('geminiApiKey') && this.geminiApiKey && !this.geminiApiKey.includes(':')) {
        this.geminiApiKey = encrypt(this.geminiApiKey);
    }
    if (this.isModified('openaiApiKey') && this.openaiApiKey && !this.openaiApiKey.includes(':')) {
        this.openaiApiKey = encrypt(this.openaiApiKey);
    }
    if (this.isModified('anthropicApiKey') && this.anthropicApiKey && !this.anthropicApiKey.includes(':')) {
        this.anthropicApiKey = encrypt(this.anthropicApiKey);
    }
    next();
});

// Get decrypted API key
adminSettingsSchema.methods.getGeminiApiKey = function () {
    return decrypt(this.geminiApiKey);
};

adminSettingsSchema.methods.getOpenaiApiKey = function () {
    return decrypt(this.openaiApiKey);
};

adminSettingsSchema.methods.getAnthropicApiKey = function () {
    return decrypt(this.anthropicApiKey);
};

// Static method to get or create settings
adminSettingsSchema.statics.getSettings = async function () {
    let settings = await this.findById('main');
    if (!settings) {
        settings = await this.create({ _id: 'main' });
    }
    return settings;
};

// Return masked API key status (not the actual key)
adminSettingsSchema.methods.toSafeJSON = function () {
    return {
        selectedModel: this.selectedModel,
        geminiApiKey: this.geminiApiKey ? '••••••••' + (decrypt(this.geminiApiKey)?.slice(-4) || '') : null,
        openaiApiKey: this.openaiApiKey ? '••••••••' + (decrypt(this.openaiApiKey)?.slice(-4) || '') : null,
        anthropicApiKey: this.anthropicApiKey ? '••••••••' + (decrypt(this.anthropicApiKey)?.slice(-4) || '') : null,
        updatedAt: this.updatedAt
    };
};

const AdminSettings = mongoose.model('AdminSettings', adminSettingsSchema);

export default AdminSettings;
