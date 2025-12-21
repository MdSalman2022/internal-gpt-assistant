import { authService } from '../services/index.js';

// Auth routes
export default async function authRoutes(fastify) {
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
}
