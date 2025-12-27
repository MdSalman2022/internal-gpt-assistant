import 'dotenv/config';

const config = {
    // Server
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',

    // MongoDB
    mongodbUri: process.env.MONGODB_URI,

    // Qdrant
    qdrant: {
        url: process.env.QDRANT_URL,
        apiKey: process.env.QDRANT_API_KEY,
        collection: process.env.QDRANT_COLLECTION || 'documents',
    },

    // ==================== AI PROVIDERS ====================
    // Gemini (Google) - Default provider, also used for embeddings
    gemini: {
        apiKey: process.env.GEMINI_API_KEY,
        model: process.env.GEMINI_MODEL,
    },

    // OpenAI (ChatGPT)
    openai: {
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    },

    // Anthropic (Claude)
    anthropic: {
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
    },

    // Default AI provider ('gemini', 'openai', or 'anthropic')
    defaultAIProvider: process.env.DEFAULT_AI_PROVIDER || 'gemini',
    // ======================================================

    // Session
    sessionSecret: process.env.SESSION_SECRET || 'change-this-secret',

    // OAuth
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackUrl: process.env.GOOGLE_CALLBACK_URL,
    },

    // Cloudinary
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET
    },

    // Frontend
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

    // RAG Settings
    rag: {
        chunkSize: 500,
        chunkOverlap: 100,
        topK: 5,
        minConfidence: 0.7,
    },
};

export default config;
