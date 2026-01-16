/**
 * Anthropic Provider (Claude)
 * 
 * Handles all Anthropic-specific API calls for text generation.
 * Note: Anthropic doesn't have an embeddings API, so we fall back to Gemini for embeddings.
 * This file is isolated so Claude logic can be updated without affecting other providers.
 */

import Anthropic from '@anthropic-ai/sdk';

class AnthropicProvider {
    constructor(apiKey) {
        if (!apiKey) {
            console.warn('⚠️ Anthropic API key not configured');
            this.client = null;
            return;
        }

        this.client = new Anthropic({ apiKey });
        this.chatModel = 'claude-3-haiku-20240307'; // Fast, cost-effective model
        this.maxRetries = 3;
        this.retryDelay = 1000;
    }

    get isConfigured() {
        return this.client !== null;
    }

    get name() {
        return 'anthropic';
    }

    get displayName() {
        return 'Claude 3 Haiku';
    }

    /**
     * Retry helper with exponential backoff for rate limits
     */
    async _withRetry(fn, retries = this.maxRetries) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                const isRateLimit = error.status === 429;

                if (isRateLimit && attempt < retries) {
                    const delay = this.retryDelay * Math.pow(2, attempt - 1);
                    console.log(`⏳ Rate limited, retrying in ${delay}ms (attempt ${attempt}/${retries})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                throw error;
            }
        }
    }

    /**
     * Generate embedding for text
     * Note: Anthropic doesn't have embeddings, return null to signal fallback needed
     */
    async generateEmbedding(text) {
        // Anthropic doesn't support embeddings - caller should use fallback
        return null;
    }

    /**
     * Generate chat response
     */
    async generateResponse(systemPrompt, userMessage, options = {}) {
        if (!this.client) throw new Error('Anthropic not configured');

        return this._withRetry(async () => {
            // Build messages array with history and current message
            const messages = [];

            // Add conversation history
            if (options.history && options.history.length > 0) {
                for (const msg of options.history) {
                    messages.push({
                        role: msg.role === 'assistant' ? 'assistant' : 'user',
                        content: msg.content
                    });
                }
            }

            // Add current user message
            messages.push({ role: 'user', content: userMessage });

            const response = await this.client.messages.create({
                model: options.model || this.chatModel,
                max_tokens: options.maxTokens || 2048,
                system: systemPrompt,
                messages,
            });

            const content = response.content[0]?.text || '';
            const usage = response.usage || {};

            return {
                content,
                tokens: {
                    prompt: usage.input_tokens || 0,
                    completion: usage.output_tokens || 0,
                    total: (usage.input_tokens || 0) + (usage.output_tokens || 0),
                },
            };
        });
    }

    /**
     * Generate document tags
     */
    async generateTags(text) {
        if (!this.client) return [];

        try {
            const response = await this.client.messages.create({
                model: this.chatModel,
                max_tokens: 100,
                system: 'You are a document classifier. Return ONLY a JSON array of 3-5 relevant tags, nothing else.',
                messages: [
                    {
                        role: 'user',
                        content: `Generate tags for this document:\n\n${text.substring(0, 1500)}`,
                    },
                ],
            });

            const jsonStr = response.content[0]?.text
                .replace(/```json\n?|\n?```/g, '')
                .trim();
            return JSON.parse(jsonStr);
        } catch (error) {
            console.error('Failed to generate tags:', error.message);
            return [];
        }
    }
}

export default AnthropicProvider;
