import 'dotenv/config';

const config = {
    // Server
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',

    // MongoDB
    mongodbUri: process.env.MONGODB_URI,

    // Qdrant
    qdrant: {
        url: process.env.QDRANT_URL,
        apiKey: process.env.QDRANT_API_KEY,
        collection: process.env.QDRANT_COLLECTION || 'documents',
    },

    // Gemini
    gemini: {
        apiKey: process.env.GEMINI_API_KEY,
        model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    },

    // Session
    sessionSecret: process.env.SESSION_SECRET || 'change-this-secret',

    // OAuth
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackUrl: process.env.GOOGLE_CALLBACK_URL,
    },

    // Cloudinary (supports both CLOUDINARY_CLOUD_NAME and Cloudinary_CloudName formats)
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || process.env.Cloudinary_CloudName,
        apiKey: process.env.CLOUDINARY_API_KEY || process.env.Cloudinary_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET || process.env.Cloudinary_API_SECRET,
    },

    // Frontend
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

    // RAG Settings
    rag: {
        chunkSize: 500,          // Characters per chunk
        chunkOverlap: 100,       // Overlap between chunks
        topK: 5,                 // Top results to retrieve
        minConfidence: 0.7,      // Minimum confidence for answers
    },
};

export default config;
