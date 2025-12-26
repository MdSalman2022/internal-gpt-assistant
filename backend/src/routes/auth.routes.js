import { authService } from '../services/index.js';
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
        const { email, password, name } = request.body;

        if (!email || !password || !name) {
            return reply.status(400).send({ error: 'Email, password, and name are required' });
        }

        try {
            const user = await authService.register({ email, password, name });

            // Set session
            request.session.userId = user._id;
            request.session.user = user.toJSON();

            return { success: true, user: user.toJSON() };
        } catch (error) {
            if (error.message === 'Email already registered') {
                return reply.status(409).send({ error: error.message });
            }
            throw error;
        }
    });

    // Login
    fastify.post('/login', async (request, reply) => {
        const { email, password } = request.body;

        if (!email || !password) {
            return reply.status(400).send({ error: 'Email and password are required' });
        }

        const user = await authService.authenticateLocal(email, password);

        if (!user) {
            return reply.status(401).send({ error: 'Invalid credentials' });
        }

        // Set session
        request.session.userId = user._id;
        request.session.user = user.toJSON();

        return { success: true, user: user.toJSON() };
    });

    // Logout
    fastify.post('/logout', async (request, reply) => {
        await request.session.destroy();
        return { success: true };
    });

    // Get current user
    fastify.get('/me', async (request, reply) => {
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

    // ==================== FORGOT PASSWORD ====================

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

    // ==================== GOOGLE OAUTH ====================

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
