// Unified AI Service for various providers

import config from '../config/index.js';
import { GeminiProvider } from './providers/index.js';
import aiProviderFactory from './ai-provider-factory.js';

class AIService {
    constructor() {
        // Default provider for chat
        this.defaultProvider = 'gemini';

        // Set default embedding provider
        this.embeddingProvider = 'gemini';

        // Initialize legacy provider for embeddings (Env Var Fallback)
        this.legacyEmbeddingProvider = new GeminiProvider(config.gemini?.apiKey);

        console.log('🤖 AI Service initialized');
        console.log(`   📦 Embedding Fallback (.env): ${this.legacyEmbeddingProvider.isConfigured ? '✅ (Enabled)' : '❌ (Disabled)'}`);
    }

    // List available providers (Platform level)
    async getAvailableProviders() {
        return aiProviderFactory.getAvailableProviders(null);
    }

    // Get specific provider instance (Platform level)
    async getProvider(providerName) {
        return aiProviderFactory.getProvider(providerName, null);
    }

    // Generate text embedding (Platform level)
    async generateEmbedding(text) {
        // 1. Try Env Var Fallback first
        if (this.legacyEmbeddingProvider.isConfigured) {
            return this.legacyEmbeddingProvider.generateEmbedding(text);
        }

        // 2. Try Database
        const provider = await this.getProvider(this.embeddingProvider);
        return provider.generateEmbedding(text);
    }

    // Generate chat response with specified provider
    async generateResponse(systemPrompt, userMessage, options = {}) {
        const providerName = options.provider || this.defaultProvider;
        const provider = await this.getProvider(providerName);

        console.log(`🤖 Generating response with: ${provider.displayName}`);

        const result = await provider.generateResponse(systemPrompt, userMessage, {
            temperature: options.temperature,
            maxTokens: options.maxTokens,
        });

        return {
            ...result,
            provider: providerName,
        };
    }

    // Generate tags for text content
    async generateTags(text, providerName = this.defaultProvider) {
        try {
            const provider = await this.getProvider(providerName);
            return provider.generateTags(text);
        } catch (error) {
            console.warn(`Generte tags failed with ${providerName}, trying fallback...`);
            // Fallback to any available provider
            const available = await this.getAvailableProviders();
            if (available.length === 0) return [];
            
            const fallbackProvider = await this.getProvider(available[0].provider);
            return fallbackProvider.generateTags(text);
        }
    }

    // Generate RAG answer from context
    async generateAnswer(query, contextChunks, options = {}) {
        const providerName = options.provider || this.defaultProvider;

        // Build context from chunks
        const contextText = contextChunks
            .map((chunk, i) => `[Source ${i + 1}] ${chunk.content}`)
            .join('\n\n');

        const systemPrompt = `You are a helpful AI assistant that answers questions based on the provided context from company documents.

INSTRUCTIONS:
- Primary Goal: Answer the user's question using the provided context.
- General Conversation: If the user asks a general question (e.g., "Hello", "How are you", "Tell me about yourself") or a question unrelated to the documents, answer naturally and politely using your general knowledge. Do not complain about missing context for greetings.
- Specific Questions: If the user asks a specific question that should be in the documents but the context is missing or irrelevant, state clearly that you couldn't find the information in the provided documents.
- Cite Sources: When you DO use the context to answer, cite your sources using [Source N] format.
- Formatting: Use markdown for readability.
- Be concise but thorough

CONTEXT:
${contextText}`;

        const result = await this.generateResponse(systemPrompt, query, {
            provider: providerName,
            temperature: 0.3,
            maxTokens: 2048,
        });

        // Parse confidence (simple heuristic)
        const hasLowConfidence =
            result.content.toLowerCase().includes("don't have enough") ||
            result.content.toLowerCase().includes("not mentioned") ||
            result.content.toLowerCase().includes("no information");

        // Estimate token counts
        const promptText = systemPrompt + query;
        const estimatedPromptTokens = result.tokens?.prompt || Math.ceil(promptText.length / 4);
        const estimatedCompletionTokens = result.tokens?.completion || Math.ceil(result.content.length / 4);

        return {
            answer: result.content,
            tokens: {
                prompt: estimatedPromptTokens,
                completion: estimatedCompletionTokens,
                total: estimatedPromptTokens + estimatedCompletionTokens
            },
            model: result.model || 'gemini-pro',
            provider: result.provider,
            confidence: hasLowConfidence ? 0.3 : 0.8,
            isLowConfidence: hasLowConfidence,
        };
    }

    // Multi-tenant factory methods

    // Get provider instance for organization
    async getProviderForOrg(providerName, organizationId = null) {
        return aiProviderFactory.getProvider(providerName, organizationId);
    }

    // Generate organization-specific embedding
    async generateEmbeddingForOrg(text, organizationId = null) {
        const provider = await this.getProviderForOrg('gemini', organizationId);
        return provider.generateEmbedding(text);
    }

    // Generate organization-specific response
    async generateResponseForOrg(systemPrompt, userMessage, options = {}) {
        const {
            provider: providerName = this.defaultProvider,
            organizationId = null,
            temperature,
            maxTokens,
            history = []
        } = options;

        const provider = await this.getProviderForOrg(providerName, organizationId);

        console.log(`🤖 Generating response with: ${provider.displayName} (Org: ${organizationId || 'Platform'})`);

        const result = await provider.generateResponse(systemPrompt, userMessage, {
            temperature,
            maxTokens,
            history
        });

        // Record token usage stats
        if (result.tokens) {
            await aiProviderFactory.trackUsage(providerName, organizationId, {
                promptTokens: result.tokens.prompt || 0,
                completionTokens: result.tokens.completion || 0,
                totalTokens: result.tokens.total || 0,
                costCents: 0  // TODO: Calculate cost from model-pricing.js
            });
        }

        return {
            ...result,
            provider: providerName
        };
    }

    // Generate organization-specific RAG answer
    async generateAnswerForOrg(query, contextChunks, options = {}) {
        const { provider: providerName = this.defaultProvider, organizationId = null, history = [] } = options;

        // Build context from chunks
        const contextText = contextChunks
            .map((chunk, i) => `[Source ${i + 1}] ${chunk.content}`)
            .join('\n\n');

        const systemPrompt = `You are a helpful AI assistant that answers questions based on the provided context from company documents.

INSTRUCTIONS:
- Primary Goal: Answer the user's question using the provided context.
- General Conversation: If the user asks a general question (e.g., "Hello", "How are you", "Tell me about yourself") or a question unrelated to the documents, answer naturally and politely using your general knowledge. Do not complain about missing context for greetings.
- Specific Questions: If the user asks a specific question that should be in the documents but the context is missing or irrelevant, state clearly that you couldn't find the information in the provided documents.
- Cite Sources: When you DO use the context to answer, cite your sources using [Source N] format.
- Formatting: Use markdown for readability.
- Be concise but thorough

CONTEXT:
${contextText}`;

        const result = await this.generateResponseForOrg(systemPrompt, query, {
            provider: providerName,
            organizationId,
            temperature: 0.3,
            maxTokens: 2048,
            history
        });

        // Parse confidence (simple heuristic)
        const hasLowConfidence =
            result.content.toLowerCase().includes("don't have enough") ||
            result.content.toLowerCase().includes("not mentioned") ||
            result.content.toLowerCase().includes("no information");

        return {
            answer: result.content,
            tokens: result.tokens,
            confidence: hasLowConfidence ? 0.5 : 0.8
        };
    }

    // List available providers for organization
    async getAvailableProvidersForOrg(organizationId = null) {
        return aiProviderFactory.getAvailableProviders(organizationId);
    }
}

// Singleton instance
const aiService = new AIService();

export default aiService;
