import { User, Organization } from '../models/index.js';

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
        const { email, password, name, inviteToken } = userData;

        // Handle Invitation Flow
        if (inviteToken) {
            const user = await User.findOne({
                invitationToken: inviteToken,
                invitationExpires: { $gt: new Date() }
            });

            if (!user) {
                throw new Error('Invalid or expired invitation');
            }

        // Verify email matches invitation
            if (user.email.toLowerCase() !== email.toLowerCase()) {
                throw new Error('Email does not match invitation');
            }

            user.password = password; // Will be hashed by pre-save hook
            user.name = name;
            user.isActive = true;
            user.invitationToken = undefined;
            user.invitationExpires = undefined;

            await user.save();
            console.log(`👤 Invited user activated: ${email} (Org: ${user.organizationId})`);
            return user;
        }

        // Standard Registration Flow
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

    // Register new user with organization
    async registerWithOrganization(data) {
        const {
            email, password, name,
            organizationName, organizationSlug, industry,
            plan = 'trial', billingInterval = 'month'
        } = data;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new Error('Email already registered');
        }

        // Check if slug is taken
        const existingOrg = await Organization.findOne({ slug: organizationSlug });
        if (existingOrg) {
            throw new Error('Organization URL is already taken');
        }

        // Determine trial end date (14 days from now)
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 14);

        // Create organization
        const organization = new Organization({
            name: organizationName,
            slug: organizationSlug,
            email: email,
            industry: industry || null,
            plan: plan === 'trial' ? 'trial' : plan,
            planStatus: plan === 'trial' ? 'trialing' : 'pending',
            trialEndsAt: plan === 'trial' ? trialEndsAt : null,
            billingInterval: billingInterval,
            signupSource: 'direct',
            signupPlan: plan,
        });

        // Set plan limits based on the selected plan
        organization.updatePlanLimits();

        await organization.save();

        // Make first user a platform superadmin
        const userCount = await User.countDocuments();
        const platformRole = userCount === 0 ? 'superadmin' : 'user';

        // Create user as organization owner
        const user = new User({
            email,
            password,
            name,
            role: 'admin',
            organizationId: organization._id,
            orgRole: 'owner',
            platformRole: platformRole,
        });
        await user.save();

        console.log(`🏢 New organization registered: ${organizationName} (plan: ${plan})`);
        console.log(`👤 Owner: ${email} (platformRole: ${platformRole})`);

        return { user, organization };
    }

    // Generate slug from organization name
    generateSlug(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .substring(0, 50);
    }

    // Check slug availability
    async isSlugAvailable(slug) {
        const existing = await Organization.findOne({ slug });
        return !existing;
    }

    // Find or create OAuth user
    async findOrCreateOAuthUser(profile) {
        let user = await User.findOne({ email: profile.email });

        if (!user) {
            // Check if first user
            const userCount = await User.countDocuments();
            const role = userCount === 0 ? 'admin' : 'employee';

            user = new User({
                email: profile.email,
                name: profile.name,
                avatar: profile.avatar,
                googleId: profile.provider === 'google' ? profile.providerId : null,
                role,
            });
            await user.save();
            console.log(`👤 New OAuth user: ${profile.email}`);
        } else {
            // Update avatar if not set
            if (!user.avatar && profile.avatar) {
                user.avatar = profile.avatar;
                await user.save();
            }
        }

        user.lastLogin = new Date();
        await user.save();
        return user;
    }

    // Get user by ID
    async getUserById(userId) {
        return User.findById(userId).populate('organizationId').lean();
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
