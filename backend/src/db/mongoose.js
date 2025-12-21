import mongoose from 'mongoose';
import config from '../config/index.js';

export async function connectDatabase() {
    try {
        await mongoose.connect(config.mongodbUri);
        console.log('✅ Connected to MongoDB');
        return mongoose.connection;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);
    }
}

// Handle connection events
mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB error:', err);
});

export default mongoose;
