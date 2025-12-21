import { buildApp } from './app.js';
import { connectDatabase } from './db/mongoose.js';
import { qdrantService } from './services/index.js';
import config from './config/index.js';

async function start() {
    try {
        // Connect to MongoDB
        await connectDatabase();

        // Initialize Qdrant collection
        await qdrantService.initCollection();

        // Build and start Fastify
        const app = await buildApp();

        await app.listen({
            port: config.port,
            host: '0.0.0.0',
        });

        console.log(`🚀 Server running at http://localhost:${config.port}`);
        console.log(`📚 Environment: ${config.nodeEnv}`);
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

start();
