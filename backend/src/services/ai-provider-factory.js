/**
 * AI Provider Factory Service
 * 
 * Production-grade factory for creating provider instances with organization-specific API keys.
 * 
 * Architecture:
 * - Dynamic provider initialization per request
 * - Hierarchical fallback: Org keys → Platform keys
 * - Automatic usage tracking
 * - Rate limit enforcement
 * - Provider instance caching (optional, for performance)
 * 
 * Design Patterns:
 * - Factory Pattern: Creates provider instances on-demand
 * - Strategy Pattern: Different providers implement common interface
 * - Singleton Pattern: One factory instance across the app
 */

import { GeminiProvider, OpenAIProvider, AnthropicProvider, GroqProvider } from './providers/index.js';
import { APICredentials } from '../models/index.js';

class AIProviderFactory {
    constructor() {
        // Optional: In-memory cache for provider instances (expires after 5 minutes)
        this.providerCache = new Map();
        this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes

        // Map of provider names to their classes
        this.providerClasses = {
            gemini: GeminiProvider,
            openai: OpenAIProvider,
            anthropic: AnthropicProvider,
            groq: GroqProvider
        };
    }

    /**
     * Get a provider instance for a specific organization and provider
     * 
     * @param {string} providerName - Name of the provider (gemini, openai, etc.)
     * @param {string|null} organizationId - Organization ID (null for platform key)
     * @param {Object} options - Additional options
     * @param {boolean} options.skipCache - Skip cache lookup
     * @returns {Promise<Provider>} Provider instance
     * @throws {Error} If no API key is configured
     */
    async getProvider(providerName, organizationId = null, options = {}) {
        const { skipCache = false } = options;

        // Validate provider name
        if (!this.providerClasses[providerName]) {
            throw new Error(`Unknown provider: ${providerName}. Available: ${Object.keys(this.providerClasses).join(', ')}`);
        }

        // Generate cache key
        const cacheKey = `${providerName}:${organizationId || 'platform'}`;

        // Check cache (optional optimization)
        if (!skipCache && this.providerCache.has(cacheKey)) {
            const cached = this.providerCache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.CACHE_TTL) {
                return cached.provider;
            }
            // Cache expired, remove it
            this.providerCache.delete(cacheKey);
        }

        // 1. Find active credential (with fallback to platform key)
        const credential = await APICredentials.findActiveCredential(providerName, organizationId);

        if (!credential) {
            throw new Error(
                `No API key configured for provider '${providerName}'` +
                (organizationId ? ` for organization ${organizationId}` : ' (platform key)')
            );
        }

        // 2. Check if key is expired
        if (credential.isExpired()) {
            throw new Error(`API key for provider '${providerName}' has expired. Please update your credentials.`);
        }

        // 3. Decrypt API key
        const apiKey = credential.getDecryptedKey();
        if (!apiKey) {
            throw new Error(`Failed to decrypt API key for provider '${providerName}'`);
        }

        // 4. Create provider instance
        const ProviderClass = this.providerClasses[providerName];
        const provider = new ProviderClass(apiKey);

        // Attach credential metadata to provider for tracking
        provider._credentialId = credential._id;
        provider._organizationId = credential.organizationId;

        // 5. Cache provider instance (optional)
        this.providerCache.set(cacheKey, {
            provider,
            timestamp: Date.now()
        });

        return provider;
    }

    /**
     * Track usage for a provider call
     * 
     * @param {string} providerName - Provider name
     * @param {string|null} organizationId - Organization ID
     * @param {Object} usage - Usage data
     * @param {number} usage.promptTokens - Input tokens
     * @param {number} usage.completionTokens - Output tokens
     * @param {number} usage.totalTokens - Total tokens
     * @param {number} usage.costCents - Cost in cents
     */
    async trackUsage(providerName, organizationId, usage) {
        const { totalTokens = 0, costCents = 0 } = usage;

        try {
            await APICredentials.trackUsage(
                providerName,
                organizationId,
                totalTokens,
                costCents
            );
        } catch (error) {
            // Non-blocking: log error but don't fail the request
            console.error('Failed to track usage:', error.message);
        }
    }

    /**
     * Check if a provider is available for an organization
     * 
     * @param {string} providerName - Provider name
     * @param {string|null} organizationId - Organization ID
     * @returns {Promise<boolean>}
     */
    async isProviderAvailable(providerName, organizationId = null) {
        try {
            const credential = await APICredentials.findActiveCredential(providerName, organizationId);
            return credential && !credential.isExpired();
        } catch (error) {
            return false;
        }
    }

    /**
     * Get list of available providers for an organization
     * 
     * @param {string|null} organizationId - Organization ID
     * @returns {Promise<Array<{provider: string, isOrgKey: boolean, label: string}>>}
     */
    async getAvailableProviders(organizationId = null) {
        const providers = [];

        for (const providerName of Object.keys(this.providerClasses)) {
            const credential = await APICredentials.findActiveCredential(providerName, organizationId);
            
            if (credential && !credential.isExpired()) {
                providers.push({
                    provider: providerName,
                    isOrgKey: credential.organizationId !== null,
                    label: credential.label,
                    usage: credential.usage
                });
            }
        }

        return providers;
    }

    /**
     * Check rate limit before making API call
     * 
     * @param {string} providerName - Provider name
     * @param {string|null} organizationId - Organization ID
     * @param {number} estimatedTokens - Estimated tokens to consume
     * @throws {Error} If rate limit would be exceeded
     */
    async checkRateLimit(providerName, organizationId, estimatedTokens = 0) {
        const credential = await APICredentials.findActiveCredential(providerName, organizationId);
        
        if (!credential) {
            throw new Error(`No credential found for ${providerName}`);
        }

        if (credential.isRateLimited(estimatedTokens)) {
            throw new Error(
                `Rate limit exceeded for ${providerName}. ` +
                `Daily limit: ${credential.rateLimit.tokensPerDay} tokens, ` +
                `Current usage: ${credential.usage.totalTokens} tokens`
            );
        }
    }

    /**
     * Clear provider cache (useful for testing or forcing refresh)
     */
    clearCache() {
        this.providerCache.clear();
    }

    /**
     * Register a new provider class (for extensibility)
     * 
     * @param {string} providerName - Provider name
     * @param {class} ProviderClass - Provider class
     */
    registerProvider(providerName, ProviderClass) {
        this.providerClasses[providerName] = ProviderClass;
        console.log(`✅ Registered new provider: ${providerName}`);
    }
}

// Export singleton instance
const aiProviderFactory = new AIProviderFactory();
export default aiProviderFactory;
