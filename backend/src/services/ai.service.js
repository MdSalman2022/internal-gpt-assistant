/**
 * Unified AI Service
 * 
 * This service provides a single interface for all AI operations.
 * It manages multiple providers and allows switching between them.
 * 
 * Architecture (Updated for Multi-Tenancy):
 * - **Legacy Mode**: Static providers from .env (for backward compatibility)
 * - **Factory Mode**: Dynamic providers from APICredentials (per-organization)
 * - Each provider (Gemini, OpenAI, Anthropic, Groq) is isolated in its own file
 * - This service orchestrates them with a common interface
 * - Default provider is Gemini (for embeddings compatibility)
 * - Embeddings always use Gemini (stored in Qdrant with 768 dimensions)
 * 
 * Migration Path:
 * - Old code uses getProvider() → returns static provider from .env
 * - New code uses getProviderForOrg() → returns dynamic provider from DB
 */

import config from '../config/index.js';
import { GeminiProvider, OpenAIProvider, AnthropicProvider, GroqProvider } from './providers/index.js';
import aiProviderFactory from './ai-provider-factory.js';

class AIService {
    constructor() {
        // ==================== LEGACY: Static Providers from .env ====================
        // These are initialized at boot for backward compatibility
        // Will be deprecated once all code uses aiProviderFactory
        this.providers = {
            gemini: new GeminiProvider(config.gemini?.apiKey),
            openai: new OpenAIProvider(config.openai?.apiKey),
            anthropic: new AnthropicProvider(config.anthropic?.apiKey),
            groq: new GroqProvider(config.groq?.apiKey),
        };

        // Default provider for chat
        this.defaultProvider = 'gemini';

        // Embedding provider (always Gemini for consistency with Qdrant vector dimensions)
        this.embeddingProvider = 'gemini';

        console.log('🤖 AI Service initialized');
        console.log('   📦 Legacy Providers (.env):');
        console.log(`      ├─ Gemini: ${this.providers.gemini.isConfigured ? '✅' : '❌'}`);
        console.log(`      ├─ OpenAI: ${this.providers.openai.isConfigured ? '✅' : '❌'}`);
        console.log(`      ├─ Claude: ${this.providers.anthropic.isConfigured ? '✅' : '❌'}`);
        console.log(`      └─ Groq:   ${this.providers.groq.isConfigured ? '✅' : '❌'}`);
        console.log('   🏭 Factory Mode: Ready for per-organization providers');
    }

    // ==================== LEGACY METHODS (Backward Compatibility) ====================

    /**
     * @deprecated Use getProviderForOrg() for multi-tenant support
     * Get list of available (configured) providers from .env
     */
    getAvailableProviders() {
        return Object.entries(this.providers)
            .filter(([_, provider]) => provider.isConfigured)
            .map(([name, provider]) => ({
                id: name,
                name: provider.displayName,
                isDefault: name === this.defaultProvider,
            }));
    }

    /**
     * @deprecated Use getProviderForOrg() for multi-tenant support
     * Get a specific provider from static .env configuration
     */
    getProvider(providerName) {
        const provider = this.providers[providerName];
        if (!provider || !provider.isConfigured) {
            throw new Error(`Provider '${providerName}' is not available`);
        }
        return provider;
    }

    /**
     * @deprecated Use generateEmbeddingForOrg() for multi-tenant support
     * Generate embedding for text using static Gemini from .env
     * Always uses Gemini for consistency with Qdrant vector dimensions
     */
    async generateEmbedding(text) {
        const provider = this.providers[this.embeddingProvider];
        if (!provider?.isConfigured) {
            throw new Error('Embedding provider (Gemini) not configured');
        }
        return provider.generateEmbedding(text);
    }

    /**
     * Generate chat response using specified provider
     * @param {string} systemPrompt - System instructions
     * @param {string} userMessage - User's message
     * @param {Object} options - Optional settings
     * @param {string} options.provider - Provider to use ('gemini', 'openai', 'anthropic')
     * @param {number} options.temperature - Temperature for generation
     * @param {number} options.maxTokens - Max tokens to generate
     */
    async generateResponse(systemPrompt, userMessage, options = {}) {
        const providerName = options.provider || this.defaultProvider;
        const provider = this.getProvider(providerName);

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

    /**
     * Generate document tags using specified provider
     */
    async generateTags(text, providerName = this.defaultProvider) {
        const provider = this.providers[providerName];
        if (!provider?.isConfigured) {
            // Fallback to any available provider
            const available = this.getAvailableProviders()[0];
            if (!available) return [];
            return this.providers[available.id].generateTags(text);
        }
        return provider.generateTags(text);
    }

    /**
     * Generate answer from context (RAG)
     * This is the main method used by the RAG service
     */
    async generateAnswer(query, contextChunks, options = {}) {
        const providerName = options.provider || this.defaultProvider;

        // Build context from chunks
        const contextText = contextChunks
            .map((chunk, i) => `[Source ${i + 1}] ${chunk.content}`)
            .join('\n\n');

        const systemPrompt = `You are a helpful AI assistant that answers questions based on the provided context from company documents.

INSTRUCTIONS:
INSTRUCTIONS:
- Primary Goal: Answer the user's question using the provided context.
- General Conversation: If the user asks a general question (e.g., "Hello", "How are you", "Tell me about yourself") or a question unrelated to the documents, answer naturally and politely using your general knowledge. Do not complain about missing context for greetings.
- Specific Questions: If the user asks a specific question that should be in the documents but the context is missing or irrelevant, state clearly that you couldn't find the information in the provided documents.
- Cite Sources: When you DO use the context to answer, cite your sources using [Source N] format.
- Formatting: Use markdown for readability.
- Cite your sources using [Source N] format when referencing specific information
- Be concise but thorough
- Use markdown formatting for better readability

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

        // Estimate tokens if not provided by provider (~4 chars per token)
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

    // ==================== NEW: Multi-Tenant Factory Methods ====================

    /**
     * Get provider instance for a specific organization (RECOMMENDED)
     * Uses APICredentials model with fallback to platform keys
     * 
     * @param {string} providerName - Provider name
     * @param {string|null} organizationId - Organization ID
     * @returns {Promise<Provider>} Provider instance
     */
    async getProviderForOrg(providerName, organizationId = null) {
        return aiProviderFactory.getProvider(providerName, organizationId);
    }

    /**
     * Generate embedding for organization (multi-tenant version)
     * Always uses Gemini for consistency with Qdrant vector dimensions
     * 
     * @param {string} text - Text to embed
     * @param {string|null} organizationId - Organization ID
     * @returns {Promise<number[]>} Embedding vector
     */
    async generateEmbeddingForOrg(text, organizationId = null) {
        const provider = await this.getProviderForOrg('gemini', organizationId);
        return provider.generateEmbedding(text);
    }

    /**
     * Generate response for organization (multi-tenant version)
     * 
     * @param {string} systemPrompt - System instructions
     * @param {string} userMessage - User message
     * @param {Object} options - Options
     * @param {string} options.provider - Provider name
     * @param {string|null} options.organizationId - Organization ID
     * @param {number} options.temperature - Temperature
     * @param {number} options.maxTokens - Max tokens
     * @returns {Promise<Object>} Response with content and tokens
     */
    async generateResponseForOrg(systemPrompt, userMessage, options = {}) {
        const {
            provider: providerName = this.defaultProvider,
            organizationId = null,
            temperature,
            maxTokens
        } = options;

        const provider = await this.getProviderForOrg(providerName, organizationId);

        console.log(`🤖 Generating response with: ${provider.displayName} (Org: ${organizationId || 'Platform'})`);

        const result = await provider.generateResponse(systemPrompt, userMessage, {
            temperature,
            maxTokens
        });

        // Track usage
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

    /**
     * Generate answer from context for organization (multi-tenant RAG)
     * 
     * @param {string} query - User query
     * @param {Array} contextChunks - Context chunks from retrieval
     * @param {Object} options - Options
     * @param {string} options.provider - Provider name
     * @param {string|null} options.organizationId - Organization ID
     * @returns {Promise<Object>} Answer with confidence and tokens
     */
    async generateAnswerForOrg(query, contextChunks, options = {}) {
        const { provider: providerName = this.defaultProvider, organizationId = null } = options;

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
            maxTokens: 2048
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

    /**
     * Get list of available providers for organization
     * 
     * @param {string|null} organizationId - Organization ID
     * @returns {Promise<Array>} Available providers with metadata
     */
    async getAvailableProvidersForOrg(organizationId = null) {
        return aiProviderFactory.getAvailableProviders(organizationId);
    }
}

// Singleton instance
const aiService = new AIService();

export default aiService;
