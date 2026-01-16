/**
 * OpenAI Provider (ChatGPT)
 * 
 * Handles all OpenAI-specific API calls for embeddings and text generation.
 * This file is isolated so OpenAI logic can be updated without affecting other providers.
 */

import OpenAI from 'openai';

class OpenAIProvider {
    constructor(apiKey) {
        if (!apiKey) {
            console.warn('⚠️ OpenAI API key not configured');
            this.client = null;
            return;
        }

        this.client = new OpenAI({ apiKey });
        this.embeddingModel = 'text-embedding-3-small';
        this.chatModel = 'gpt-4o-mini'; // Cost-effective, fast model
        this.maxRetries = 3;
        this.retryDelay = 1000;
    }

    get isConfigured() {
        return this.client !== null;
    }

    get name() {
        return 'openai';
    }

    get displayName() {
        return 'OpenAI GPT-4o';
    }

    /**
     * Retry helper with exponential backoff for rate limits
     */
    async _withRetry(fn, retries = this.maxRetries) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                const isRateLimit = error.status === 429 || error.code === 'rate_limit_exceeded';

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
     * Note: OpenAI embeddings have different dimensions than Gemini
     */
    async generateEmbedding(text) {
        if (!this.client) throw new Error('OpenAI not configured');

        return this._withRetry(async () => {
            const response = await this.client.embeddings.create({
                model: this.embeddingModel,
                input: text,
            });
            return response.data[0].embedding;
        });
    }

    /**
     * Generate chat response
     */
    async generateResponse(systemPrompt, userMessage, options = {}) {
        if (!this.client) throw new Error('OpenAI not configured');

        return this._withRetry(async () => {
            // Build messages array with system prompt, history, and current message
            const messages = [
                { role: 'system', content: systemPrompt }
            ];

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

            const response = await this.client.chat.completions.create({
                model: options.model || this.chatModel,
                messages,
                temperature: options.temperature || 0.3,
                max_tokens: options.maxTokens || 2048,
            });

            const message = response.choices[0].message;
            const usage = response.usage || {};

            return {
                content: message.content,
                tokens: {
                    prompt: usage.prompt_tokens || 0,
                    completion: usage.completion_tokens || 0,
                    total: usage.total_tokens || 0,
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
            const response = await this.client.chat.completions.create({
                model: this.chatModel,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a document classifier. Return ONLY a JSON array of 3-5 relevant tags.',
                    },
                    {
                        role: 'user',
                        content: `Generate tags for this document:\n\n${text.substring(0, 1500)}`,
                    },
                ],
                temperature: 0.3,
                max_tokens: 100,
            });

            const jsonStr = response.choices[0].message.content
                .replace(/```json\n?|\n?```/g, '')
                .trim();
            return JSON.parse(jsonStr);
        } catch (error) {
            console.error('Failed to generate tags:', error.message);
            return [];
        }
    }
}

export default OpenAIProvider;
