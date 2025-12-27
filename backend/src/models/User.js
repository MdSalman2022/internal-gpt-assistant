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
            return !this.googleId;
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

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    delete user.resetPasswordToken;
    delete user.resetPasswordExpires;
    return user;
};

const User = mongoose.model('User', userSchema);

export default User;
