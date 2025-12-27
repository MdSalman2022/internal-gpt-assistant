import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import session from '@fastify/session';
import multipart from '@fastify/multipart';
import MongoStore from 'connect-mongo';
import config from './config/index.js';
import { authRoutes, documentRoutes, chatRoutes, analyticsRoutes, usersRoutes, auditRoutes, usageRoutes, departmentsRoutes, integrationsRoutes } from './routes/index.js';
import { getLandingPageHtml, getHealthPageHtml } from './utils/statusPages.js';

export async function buildApp() {
    const fastify = Fastify({
        logger: config.nodeEnv === 'development',
    });

    // CORS
    console.log('CORS Debug:', { nodeEnv: config.nodeEnv, frontendUrl: config.frontendUrl });
    await fastify.register(cors, {
        origin: (origin, cb) => {
            const allowedOrigins = [
                'https://corporate-gpt-client.vercel.app',
                'http://localhost:3000',
                'http://localhost:3001',
                'http://localhost:3002',
                config.frontendUrl
            ].filter(Boolean);

            // Allow requests with no origin (like mobile apps or curl)
            // Allow any localhost for development
            // Allow any vercel.app for production flexibility
            const isAllowed = !origin ||
                origin.startsWith('http://localhost') ||
                origin.endsWith('.vercel.app') ||
                allowedOrigins.includes(origin);

            if (isAllowed) {
                cb(null, true);
            } else {
                console.log('CORS blocked origin:', origin);
                cb(new Error('Not allowed by CORS'), false);
            }
        },
        credentials: true,
    });

    // Cookie and Session
    await fastify.register(cookie);
    await fastify.register(session, {
        secret: config.sessionSecret,
        store: MongoStore.create({
            mongoUrl: config.mongodbUri,
            collectionName: 'sessions',
            ttl: 7 * 24 * 60 * 60,
            autoRemove: 'native',
        }),
        cookie: {
            secure: config.nodeEnv === 'production',
            httpOnly: true,
            sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        },
        saveUninitialized: false,
        rolling: true,
    });

    // Multipart for file uploads
    await fastify.register(multipart, {
        limits: { fileSize: 50 * 1024 * 1024 },
    });

    // Landing page
    fastify.get('/', async (request, reply) => {
        return reply.type('text/html').send(getLandingPageHtml(config.nodeEnv));
    });

    // Health check
    fastify.get('/health', async (request, reply) => {
        const uptime = process.uptime();
        const uptimeStr = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`;
        const memUsed = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
        const memTotal = Math.round(process.memoryUsage().heapTotal / 1024 / 1024);

        if (request.headers.accept?.includes('application/json')) {
            return {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: uptimeStr,
                environment: config.nodeEnv,
                memory: { used: `${memUsed}MB`, total: `${memTotal}MB` }
            };
        }

        return reply.type('text/html').send(getHealthPageHtml(uptimeStr, config.nodeEnv, memUsed, memTotal, new Date().toISOString()));
    });

    // API routes
    fastify.register(authRoutes, { prefix: '/api/auth' });
    fastify.register(documentRoutes, { prefix: '/api/documents' });
    fastify.register(chatRoutes, { prefix: '/api/chat' });
    fastify.register(analyticsRoutes, { prefix: '/api/analytics' });
    fastify.register(usersRoutes, { prefix: '/api/users' });
    fastify.register(auditRoutes, { prefix: '/api/audit-logs' });
    fastify.register(usageRoutes, { prefix: '/api/usage' });
    fastify.register(departmentsRoutes, { prefix: '/api/departments' });
    fastify.register(integrationsRoutes, { prefix: '/api/integrations' });

    // Global error handler
    fastify.setErrorHandler((error, request, reply) => {
        console.error('Error:', error);
        reply.status(error.statusCode || 500).send({
            error: config.nodeEnv === 'production' ? 'Internal server error' : error.message,
        });
    });

    return fastify;
}
