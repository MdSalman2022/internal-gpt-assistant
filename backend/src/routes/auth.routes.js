import { authService, auditService, emailService } from '../services/index.js';
import config from '../config/index.js';
import { User } from '../models/index.js';
import crypto from 'crypto';
import { getPermissionsConfig, getPermissions } from '../middleware/rbac.middleware.js';

// Auth routes
export default async function authRoutes(fastify) {
    // Get permissions config (public endpoint)
    fastify.get('/permissions', async (request, reply) => {
        return getPermissionsConfig();
    });
    // Register new user
    fastify.post('/register', async (request, reply) => {
        const { email, password, name, inviteToken } = request.body;

        if (!email || !password || !name) {
            return reply.status(400).send({ error: 'Email, password, and name are required' });
        }

        try {
            const user = await authService.register({ email, password, name, inviteToken });

            // Set session
            request.session.userId = user._id;
            request.session.user = user.toJSON();

            // AUDIT LOG: Register
            auditService.log(request, 'LOGIN', { type: 'user', id: user._id.toString() }, {
                method: 'register',
                email: user.email
            });

            return { success: true, user: user.toJSON() };
        } catch (error) {
            if (error.message === 'Email already registered') {
                return reply.status(409).send({ error: error.message });
            }
            throw error;
        }
    });

    // Register new user with organization
    fastify.post('/register-organization', async (request, reply) => {
        const {
            name, email, password,
            organizationName, organizationSlug, industry,
            plan, billingInterval
        } = request.body;

        // Validate required fields
        if (!email || !password || !name) {
            return reply.status(400).send({ error: 'Name, email, and password are required' });
        }
        if (!organizationName || !organizationSlug) {
            return reply.status(400).send({ error: 'Organization name and URL are required' });
        }

        // Validate slug format
        if (!/^[a-z0-9-]+$/.test(organizationSlug)) {
            return reply.status(400).send({ error: 'Organization URL can only contain lowercase letters, numbers, and hyphens' });
        }

        try {
            const { user, organization } = await authService.registerWithOrganization({
                email, password, name,
                organizationName, organizationSlug, industry,
                plan: plan || 'trial',
                billingInterval: billingInterval || 'month'
            });

            // Set session
            request.session.userId = user._id;
            request.session.user = user.toJSON();
            await request.session.save();

            // AUDIT LOG: Register with Organization
            auditService.log(request, 'CREATE', { type: 'organization', id: organization._id.toString() }, {
                method: 'register-organization',
                email: user.email,
                plan: organization.plan
            });

            // For trial plan, just return success
            if (plan === 'trial' || !plan) {
                return {
                    success: true,
                    user: user.toJSON(),
                    organization: {
                        _id: organization._id,
                        name: organization.name,
                        slug: organization.slug,
                        plan: organization.plan,
                        planStatus: organization.planStatus,
                        trialEndsAt: organization.trialEndsAt
                    },
                    redirectUrl: '/chat'
                };
            }

            // For paid plans, return checkout URL (will be implemented with Stripe)
            // For now, start as trial and redirect to billing
            return {
                success: true,
                user: user.toJSON(),
                organization: {
                    _id: organization._id,
                    name: organization.name,
                    slug: organization.slug,
                    plan: organization.plan,
                    planStatus: organization.planStatus
                },
                redirectUrl: '/settings/billing'
            };
        } catch (error) {
            if (error.message === 'Email already registered' || error.message === 'Organization URL is already taken') {
                return reply.status(409).send({ error: error.message });
            }
            console.error('Registration error:', error);
            return reply.status(500).send({ error: 'Registration failed. Please try again.' });
        }
    });

    // Check slug availability
    fastify.get('/check-slug/:slug', async (request, reply) => {
        const { slug } = request.params;

        if (!slug || slug.length < 3) {
            return { available: false, error: 'Slug must be at least 3 characters' };
        }

        const isAvailable = await authService.isSlugAvailable(slug);
        return { available: isAvailable };
    });

    // Generate slug from name
    fastify.get('/generate-slug', async (request, reply) => {
        const { name } = request.query;

        if (!name) {
            return reply.status(400).send({ error: 'Name is required' });
        }

        const slug = authService.generateSlug(name);
        const isAvailable = await authService.isSlugAvailable(slug);

        return { slug, available: isAvailable };
    });

    // Login
    fastify.post('/login', async (request, reply) => {
        const { email, password } = request.body;

        if (!email || !password) {
            return reply.status(400).send({ error: 'Email and password are required' });
        }

        const user = await authService.authenticateLocal(email, password);

        if (!user) {
            // AUDIT LOG: Failed Login
            auditService.log(request, 'LOGIN', { type: 'user' }, { email, reason: 'Invalid credentials' }, 'FAILURE');
            return reply.status(401).send({ error: 'Invalid credentials' });
        }

        // Set session
        request.session.userId = user._id;
        request.session.user = user.toJSON();

        // Explicitly save session to ensure cookie is sent
        await request.session.save();

        // Debug logging for production
        console.log('Login successful:', {
            userId: user._id,
            email: user.email,
            sessionId: request.session.sessionId,
            nodeEnv: config.nodeEnv
        });

        // AUDIT LOG: Login
        auditService.log(request, 'LOGIN', { type: 'user', id: user._id.toString() }, { method: 'password' });

        return { success: true, user: user.toJSON() };
    });

    // Logout
    fastify.post('/logout', async (request, reply) => {
        // AUDIT LOG: Logout (must be before destroy)
        auditService.log(request, 'LOGOUT', { type: 'user', id: request.session.userId }, {});

        await request.session.destroy();
        return { success: true };
    });

    // Get current user
    fastify.get('/me', async (request, reply) => {
        // Debug logging for production
        console.log('/me check:', {
            hasSession: !!request.session,
            userId: request.session?.userId || 'NONE',
            sessionId: request.session?.sessionId || 'NONE',
            cookies: request.headers.cookie || 'NO COOKIES'
        });

        if (!request.session.userId) {
            return reply.status(401).send({ error: 'Not authenticated' });
        }

        const user = await authService.getUserById(request.session.userId);
        if (!user) {
            await request.session.destroy();
            return reply.status(401).send({ error: 'User not found' });
        }

        return { user };
    });

    // Update profile
    fastify.patch('/me', async (request, reply) => {
        if (!request.session.userId) {
            return reply.status(401).send({ error: 'Not authenticated' });
        }

        const user = await authService.updateProfile(request.session.userId, request.body);

        // Update session
        request.session.user = user;

        return { success: true, user };
    });

    // Update UI preferences
    fastify.post('/preferences', async (request, reply) => {
        if (!request.session.userId) {
            return reply.status(401).send({ error: 'Not authenticated' });
        }

        const { baseTheme, primaryColor } = request.body;

        const user = await User.findById(request.session.userId);
        if (!user) {
            return reply.status(404).send({ error: 'User not found' });
        }

        user.uiPreferences = {
            baseTheme: baseTheme || user.uiPreferences.baseTheme,
            primaryColor: primaryColor || user.uiPreferences.primaryColor
        };

        await user.save();

        // Update session
        request.session.user = user.toJSON();

        return { success: true, user: user.toJSON() };
    });

    // Password reset flow

    // Request password reset
    fastify.post('/forgot-password', async (request, reply) => {
        const { email } = request.body;

        if (!email) {
            return reply.status(400).send({ error: 'Email is required' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        // DEV MODE: Show if email was found
        if (!user) {
            console.log(`⚠️ Password reset requested for non-existent email: ${email}`);

            if (config.nodeEnv === 'development') {
                return {
                    success: false,
                    message: `DEV: No account found for ${email}. Try: test@example.com`,
                    emailNotFound: true
                };
            }

            // Production: Don't reveal if email exists
            return { success: true, message: 'If an account exists, a reset link has been sent.' };
        }

        // Generate reset token
        const resetToken = user.generateResetToken();
        await user.save();

        // In production, send email here. For now, log the reset link.
        const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;
        console.log(`🔑 Password reset link for ${email}: ${resetUrl}`);

        // TODO: Send email via SendGrid, Nodemailer, etc.
        // await emailService.sendPasswordReset(user.email, resetUrl);

        return {
            success: true,
            message: 'If an account exists, a reset link has been sent.',
            // DEV ONLY: Include reset URL in response for testing
            ...(config.nodeEnv === 'development' && { resetUrl })
        };
    });

    // Verify reset token (check if valid)
    fastify.get('/reset-password/:token', async (request, reply) => {
        const { token } = request.params;

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return reply.status(400).send({ error: 'Invalid or expired reset token' });
        }

        return { success: true, valid: true };
    });

    // Reset password with token
    fastify.post('/reset-password', async (request, reply) => {
        const { token, password } = request.body;

        if (!token || !password) {
            return reply.status(400).send({ error: 'Token and password are required' });
        }

        if (password.length < 6) {
            return reply.status(400).send({ error: 'Password must be at least 6 characters' });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return reply.status(400).send({ error: 'Invalid or expired reset token' });
        }

        // Update password and clear reset fields
        user.password = password;
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        console.log(`✅ Password reset successful for: ${user.email}`);

        return { success: true, message: 'Password has been reset successfully' };
    });

    // Email Verification Flow

    // Request verification email
    fastify.post('/verify-email/request', async (request, reply) => {
        if (!request.session.userId) {
            return reply.status(401).send({ error: 'Not authenticated' });
        }

        const user = await User.findById(request.session.userId);
        if (!user) {
            return reply.status(404).send({ error: 'User not found' });
        }

        if (user.isVerified) {
            return reply.status(400).send({ error: 'Email is already verified' });
        }

        // Generate token
        const token = user.generateVerificationToken();
        await user.save();

        const verifyUrl = `${config.frontendUrl}/verify-email?token=${token}`;
        console.log(`📧 Verification link for ${user.email}: ${verifyUrl}`);

        try {
            await emailService.sendVerificationEmail(user.email, verifyUrl);
            return { success: true, message: 'Verification email sent' };
        } catch (error) {
            console.error('Failed to send verification email:', error);
            // Return success anyway to prevent enumeration/panic, but log error
            // In dev mode we printed the link which is enough
            return { success: true, message: 'Verification email sent (check console in dev)' };
        }
    });

    // Confirm verification
    fastify.post('/verify-email/confirm', async (request, reply) => {
        const { token } = request.body;

        if (!token) {
            return reply.status(400).send({ error: 'Token is required' });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            verificationToken: hashedToken,
            verificationTokenExpires: { $gt: Date.now() },
        });

        if (!user) {
            return reply.status(400).send({ error: 'Invalid or expired verification token' });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();

        // Update session if logged in as this user
        if (request.session.userId === user._id.toString()) {
            request.session.user = user.toJSON();
        }

        return { success: true, message: 'Email verified successfully' };
    });

    // Google OAuth flow

    // Google OAuth - Initiate
    fastify.get('/google', async (request, reply) => {
        const clientId = config.google.clientId;
        const redirectUri = config.google.callbackUrl;
        const scope = encodeURIComponent('email profile');

        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

        return reply.redirect(authUrl);
    });

    // Google OAuth - Callback
    fastify.get('/google/callback', async (request, reply) => {
        const { code, error } = request.query;

        if (error) {
            return reply.redirect(`${config.frontendUrl}/login?error=${error}`);
        }

        if (!code) {
            return reply.redirect(`${config.frontendUrl}/login?error=no_code`);
        }

        try {
            // Exchange code for tokens
            const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    code,
                    client_id: config.google.clientId,
                    client_secret: config.google.clientSecret,
                    redirect_uri: config.google.callbackUrl,
                    grant_type: 'authorization_code',
                }),
            });

            const tokens = await tokenResponse.json();

            if (!tokens.access_token) {
                return reply.redirect(`${config.frontendUrl}/login?error=token_error`);
            }

            // Get user info
            const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${tokens.access_token}` },
            });

            const googleUser = await userInfoResponse.json();

            // Find or create user
            const user = await authService.findOrCreateOAuthUser({
                provider: 'google',
                providerId: googleUser.id,
                email: googleUser.email,
                name: googleUser.name,
                avatar: googleUser.picture,
            });

            // Set session
            request.session.userId = user._id;
            request.session.user = user.toJSON ? user.toJSON() : user;

            // Redirect to frontend
            return reply.redirect(`${config.frontendUrl}/chat`);
        } catch (err) {
            console.error('Google OAuth error:', err);
            return reply.redirect(`${config.frontendUrl}/login?error=oauth_failed`);
        }
    });
}
