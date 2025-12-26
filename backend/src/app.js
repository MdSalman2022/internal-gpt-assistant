import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import session from '@fastify/session';
import multipart from '@fastify/multipart';
import MongoStore from 'connect-mongo';
import config from './config/index.js';
import { authRoutes, documentRoutes, chatRoutes, analyticsRoutes, usersRoutes } from './routes/index.js';

export async function buildApp() {
    const fastify = Fastify({
        logger: config.nodeEnv === 'development',
    });

    // CORS - allow frontend on different ports during development
    await fastify.register(cors, {
        origin: (origin, cb) => {
            // Allow requests from localhost on any port in development
            if (!origin || origin.startsWith('http://localhost')) {
                cb(null, true);
            } else if (origin === config.frontendUrl) {
                cb(null, true);
            } else {
                cb(new Error('Not allowed by CORS'), false);
            }
        },
        credentials: true,
    });

    // Cookie and Session with MongoDB store (persists through server restarts)
    await fastify.register(cookie);
    await fastify.register(session, {
        secret: config.sessionSecret,
        store: MongoStore.create({
            mongoUrl: config.mongodbUri,
            collectionName: 'sessions',
            ttl: 7 * 24 * 60 * 60, // 7 days in seconds
            autoRemove: 'native', // Use MongoDB TTL index for cleanup
        }),
        cookie: {
            secure: config.nodeEnv === 'production',
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
        },
        saveUninitialized: false,
        rolling: true, // Refresh session expiry on each request
    });

    // Multipart for file uploads
    await fastify.register(multipart, {
        limits: {
            fileSize: 50 * 1024 * 1024, // 50MB max
        },
    });

    // Health check
    fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

    // API routes
    fastify.register(authRoutes, { prefix: '/api/auth' });
    fastify.register(documentRoutes, { prefix: '/api/documents' });
    fastify.register(chatRoutes, { prefix: '/api/chat' });
    fastify.register(analyticsRoutes, { prefix: '/api/analytics' });
    fastify.register(usersRoutes, { prefix: '/api/users' });

    // Global error handler
    fastify.setErrorHandler((error, request, reply) => {
        console.error('Error:', error);

        reply.status(error.statusCode || 500).send({
            error: config.nodeEnv === 'production'
                ? 'Internal server error'
                : error.message,
        });
    });

    return fastify;
}
