import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: function () {
            // Password not required for social login or invites
            return !this.googleId && !this.invitationToken;
        },
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    avatar: {
        type: String,
        default: null,
    },
    role: {
        type: String,
        enum: ['admin', 'visitor', 'employee'],
        default: 'employee',
    },
    // Approved departments and teams
    departments: [{
        type: String,
        trim: true,
    }],
    teams: [{
        type: String,  // Format: "DepartmentName:TeamName"
        trim: true,
    }],
    // Organization (multi-tenant)
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        index: true,
    },
    orgRole: {
        type: String,
        enum: ['owner', 'admin', 'member'],
        default: 'member',
    },
    // Platform-level role (for superadmin)
    platformRole: {
        type: String,
        enum: ['superadmin', 'user'],
        default: 'user',
    },
    // Invitation tracking
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    invitedAt: Date,
    invitationToken: String,
    invitationExpires: Date,
    // Pending access requests (awaiting admin approval)
    pendingDepartments: [{
        type: String,
        trim: true,
    }],
    pendingTeams: [{
        type: String,
        trim: true,
    }],
    googleId: {
        type: String,
        default: null,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    // Email Verification
    isVerified: {
        type: Boolean,
        default: false,
    },
    verificationToken: String,
    verificationTokenExpires: Date,
    lastLogin: {
        type: Date,
        default: null,
    },
    // Password reset fields
    resetPasswordToken: {
        type: String,
        default: null,
    },
    resetPasswordExpires: {
        type: Date,
        default: null,
    },
    // Token Usage Tracking
    usage: {
        dailyTokens: { type: Number, default: 0 },
        monthlyTokens: { type: Number, default: 0 },
        totalTokens: { type: Number, default: 0 },
        lastDailyReset: { type: Date, default: Date.now },
        lastMonthlyReset: { type: Date, default: Date.now }
    },
    // Usage Limits
    limits: {
        dailyTokens: { type: Number, default: 50000 },    // 50K tokens/day
        monthlyTokens: { type: Number, default: 500000 }  // 500K tokens/month
    },
    // Model Preferences
    modelPreferences: {
        defaultModel: { type: String, default: 'gemini-pro' },
        allowedModels: {
            type: [String],
            default: ['gemini-pro', 'gpt-4o-mini', 'gpt-4o', 'claude-3-haiku']
        }
    },
    // UI Preferences
    uiPreferences: {
        baseTheme: { type: String, default: 'emerald' },
        primaryColor: { type: String, default: '#10B981' }
    },
    // Third-party Integrations
    integrations: {
        googleCalendar: {
            connected: { type: Boolean, default: false },
            accessToken: { type: String, default: null },
            refreshToken: { type: String, default: null },
            expiryDate: { type: Number, default: null },
            connectedAt: { type: Date, default: null }
        }
    }
}, {
    timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

// Generate password reset token
userSchema.methods.generateResetToken = function () {
    const token = crypto.randomBytes(32).toString('hex');
    this.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    this.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    return token;
};

// Generate verification token
userSchema.methods.generateVerificationToken = function () {
    const token = crypto.randomBytes(32).toString('hex');
    this.verificationToken = crypto.createHash('sha256').update(token).digest('hex');
    this.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    return token;
};

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    delete user.resetPasswordToken;
    delete user.resetPasswordExpires;
    delete user.verificationToken;
    delete user.verificationTokenExpires;
    return user;
};

const User = mongoose.model('User', userSchema);

export default User;
