import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';
import session from '@fastify/session';
import multipart from '@fastify/multipart';
import MongoStore from 'connect-mongo';
import config from './config/index.js';
import { authRoutes, documentRoutes, chatRoutes, analyticsRoutes, usersRoutes, auditRoutes, usageRoutes, departmentsRoutes, integrationsRoutes, subscriptionsRoutes, organizationsRoutes, superadminRoutes, demoRoutes, contactRoutes } from './routes/index.js';
import { getLandingPageHtml, getHealthPageHtml } from './utils/statusPages.js';

export async function buildApp() {
    const fastify = Fastify({
        logger: config.nodeEnv === 'development',
    });

    // ============================================
    // SECURITY: Allowed Origins Configuration
    // Add your production frontend URL here
    // ============================================
    const ALLOWED_ORIGINS = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'https://corporate-gpt-client.vercel.app',
        // TODO: Add your production frontend URL here
        // 'https://your-app.com',
        config.frontendUrl
    ].filter(Boolean);

    // CORS
    console.log('CORS Debug:', { nodeEnv: config.nodeEnv, frontendUrl: config.frontendUrl });
    await fastify.register(cors, {
        origin: (origin, cb) => {
            // Allow requests with no origin (like mobile apps or curl)
            // Allow any localhost for development
            // Allow any vercel.app for production flexibility
            const isAllowed = !origin ||
                origin.startsWith('http://localhost') ||
                origin.endsWith('.vercel.app') ||
                ALLOWED_ORIGINS.includes(origin);

            if (isAllowed) {
                cb(null, true);
            } else {
                console.log('CORS blocked origin:', origin);
                cb(new Error('Not allowed by CORS'), false);
            }
        },
        credentials: true,
    });

    // ============================================
    // SECURITY: HTTP Security Headers (Helmet)
    // ============================================
    await fastify.register(helmet, {
        // Content Security Policy - controls what resources can be loaded
        contentSecurityPolicy: config.nodeEnv === 'production' ? {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for some frameworks
                styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
                fontSrc: ["'self'", 'https://fonts.gstatic.com'],
                imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
                connectSrc: [
                    "'self'",
                    ...ALLOWED_ORIGINS,
                    'https://*.stripe.com', // For Stripe payments
                    // TODO: Add any external APIs you call
                ],
                frameSrc: ["'self'", 'https://*.stripe.com'], // For Stripe checkout
                objectSrc: ["'none'"],
                upgradeInsecureRequests: [],
            },
        } : false, // Disable CSP in development to avoid issues

        // Cross-Origin policies
        crossOriginEmbedderPolicy: false, // Disable - can break loading external resources
        crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin resource sharing

        // HSTS - Force HTTPS (only in production)
        hsts: config.nodeEnv === 'production' ? {
            maxAge: 31536000, // 1 year
            includeSubDomains: true,
            preload: true,
        } : false,

        // Other security headers
        xContentTypeOptions: true, // Prevent MIME type sniffing
        xDnsPrefetchControl: { allow: false }, // Disable DNS prefetching
        xDownloadOptions: true, // Prevent IE from executing downloads
        xFrameOptions: { action: 'sameorigin' }, // Prevent clickjacking
        xPermittedCrossDomainPolicies: { permittedPolicies: 'none' },
        xXssProtection: true, // XSS filter (legacy but still useful)
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
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

    // Multi-tenant SaaS routes
    fastify.register(subscriptionsRoutes, { prefix: '/api/subscriptions' });
    fastify.register(organizationsRoutes, { prefix: '/api/organizations' });
    fastify.register(superadminRoutes, { prefix: '/api/superadmin' });
    fastify.register(demoRoutes, { prefix: '/api/demo' });
    fastify.register(contactRoutes, { prefix: '/api/contact' });

    // Global error handler
    fastify.setErrorHandler((error, request, reply) => {
        console.error('Error:', error);
        reply.status(error.statusCode || 500).send({
            error: config.nodeEnv === 'production' ? 'Internal server error' : error.message,
        });
    });

    return fastify;
}
