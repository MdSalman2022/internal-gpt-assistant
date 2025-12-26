/**
 * Unified AI Service
 * 
 * This service provides a single interface for all AI operations.
 * It manages multiple providers and allows switching between them.
 * 
 * Architecture:
 * - Each provider (Gemini, OpenAI, Anthropic) is isolated in its own file
 * - This service orchestrates them with a common interface
 * - Default provider is Gemini (for embeddings compatibility)
 * - Embeddings always use Gemini (stored in Qdrant with 768 dimensions)
 */

import config from '../config/index.js';
import { GeminiProvider, OpenAIProvider, AnthropicProvider } from './providers/index.js';

class AIService {
    constructor() {
        // Initialize all providers
        this.providers = {
            gemini: new GeminiProvider(config.gemini?.apiKey),
            openai: new OpenAIProvider(config.openai?.apiKey),
            anthropic: new AnthropicProvider(config.anthropic?.apiKey),
        };

        // Default provider for chat
        this.defaultProvider = 'gemini';

        // Embedding provider (always Gemini for consistency with Qdrant vector dimensions)
        this.embeddingProvider = 'gemini';

        console.log('🤖 AI Service initialized');
        console.log(`   ├─ Gemini: ${this.providers.gemini.isConfigured ? '✅' : '❌'}`);
        console.log(`   ├─ OpenAI: ${this.providers.openai.isConfigured ? '✅' : '❌'}`);
        console.log(`   └─ Claude: ${this.providers.anthropic.isConfigured ? '✅' : '❌'}`);
    }

    /**
     * Get list of available (configured) providers
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
     * Get a specific provider
     */
    getProvider(providerName) {
        const provider = this.providers[providerName];
        if (!provider || !provider.isConfigured) {
            throw new Error(`Provider '${providerName}' is not available`);
        }
        return provider;
    }

    /**
     * Generate embedding for text
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
}

// Singleton instance
const aiService = new AIService();

export default aiService;
