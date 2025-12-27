import { buildApp } from './app.js';
import { connectDatabase } from './db/mongoose.js';
import { qdrantService } from './services/index.js';
import config from './config/index.js';

let app;
let isInitialized = false;

// Initialize services (database, qdrant)
async function initialize() {
    if (isInitialized) return;

    await connectDatabase();
    await qdrantService.initCollection();
    isInitialized = true;
}

// Build the app (for both local and Vercel)
async function getApp() {
    await initialize();
    if (!app) {
        app = await buildApp();
    }
    return app;
}

// Vercel serverless handler
export default async function handler(req, res) {
    const fastifyApp = await getApp();
    await fastifyApp.ready();
    fastifyApp.server.emit('request', req, res);
}

// Local development - start the server
async function start() {
    try {
        const fastifyApp = await getApp();

        await fastifyApp.listen({
            port: config.port,
            host: '0.0.0.0',
        });

        const baseUrl = `http://localhost:${config.port}`;
        console.log(`🚀 Server running at ${baseUrl}`);
        console.log(`📡 API Base URL: ${baseUrl}/api`);
        console.log(`❤️  Health Check: ${baseUrl}/health`);
        console.log(`📚 Environment: ${config.nodeEnv}`);
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Only run local server if not in Vercel
if (!process.env.VERCEL) {
    start();
}
