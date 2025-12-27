import { buildApp } from './app.js';
import config from './config/index.js';
import { connectDatabase } from './db/mongoose.js';

const start = async () => {
    try {
        // Connect to Database
        await connectDatabase();

        // Start Server
        const app = await buildApp();
        await app.listen({ port: config.port, host: '0.0.0.0' });
        console.log(`Server listening on ${app.server.address().port}`);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

start();
