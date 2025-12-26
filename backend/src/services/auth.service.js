import { User } from '../models/index.js';

class AuthService {
    // Find or create user from OAuth profile
    async findOrCreateFromOAuth(profile, provider) {
        const email = profile.emails?.[0]?.value;
        if (!email) throw new Error('No email found in OAuth profile');

        let user = await User.findOne({ email });

        if (!user) {
            // Check if this is the first user (make them admin)
            const userCount = await User.countDocuments();
            const role = userCount === 0 ? 'admin' : 'employee';

            user = new User({
                email,
                name: profile.displayName || email.split('@')[0],
                avatar: profile.photos?.[0]?.value || null,
                googleId: provider === 'google' ? profile.id : null,
                role,
            });
            await user.save();
            console.log(`👤 New user registered: ${email} (role: ${role})`);
        } else if (provider === 'google' && !user.googleId) {
            // Link Google account to existing user
            user.googleId = profile.id;
            if (!user.avatar && profile.photos?.[0]?.value) {
                user.avatar = profile.photos[0].value;
            }
            await user.save();
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        return user;
    }

    // Authenticate with email/password
    async authenticateLocal(email, password) {
        const user = await User.findOne({ email, isActive: true });
        if (!user) return null;

        const isValid = await user.comparePassword(password);
        if (!isValid) return null;

        user.lastLogin = new Date();
        await user.save();

        return user;
    }

    // Register new user
    async register(userData) {
        const { email, password, name } = userData;

        // Check if user exists
        const existing = await User.findOne({ email });
        if (existing) {
            throw new Error('Email already registered');
        }

        // Check if this is the first user (make them admin)
        const userCount = await User.countDocuments();
        const role = userCount === 0 ? 'admin' : 'employee';

        const user = new User({
            email,
            password,
            name,
            role,
        });

        await user.save();
        console.log(`👤 New user registered: ${email} (role: ${role})`);
        return user;
    }

    // Get user by ID
    async getUserById(userId) {
        return User.findById(userId).lean();
    }

    // Update user profile
    async updateProfile(userId, updates) {
        const allowed = ['name', 'avatar', 'department'];
        const filtered = {};

        for (const key of allowed) {
            if (updates[key] !== undefined) {
                filtered[key] = updates[key];
            }
        }

        return User.findByIdAndUpdate(userId, filtered, { new: true }).lean();
    }
}

const authService = new AuthService();

export default authService;
