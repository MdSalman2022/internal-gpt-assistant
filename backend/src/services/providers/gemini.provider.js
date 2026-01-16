/**
 * Gemini AI Provider
 * 
 * Handles all Gemini-specific API calls for embeddings and text generation.
 * This file is isolated so Gemini logic can be updated without affecting other providers.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiProvider {
    constructor(apiKey) {
        if (!apiKey) {
            console.warn('⚠️ Gemini API key not configured');
            this.client = null;
            return;
        }

        this.client = new GoogleGenerativeAI(apiKey);
        this.embeddingModel = this.client.getGenerativeModel({ model: 'text-embedding-004' });
        this.chatModel = this.client.getGenerativeModel({
            model:
                process.env.GEMINI_MODEL
        });
        this.maxRetries = 3;
        this.retryDelay = 1000;
    }

    get isConfigured() {
        return this.client !== null;
    }

    get name() {
        return 'gemini';
    }

    get displayName() {
        return 'Google Gemini';
    }

    /**
     * Retry helper with exponential backoff for rate limits
     */
    async _withRetry(fn, retries = this.maxRetries) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                const isRateLimit = error.status === 429 || error.message?.includes('429');

                // Log more detail for Gemini errors
                console.error(`❌ Gemini SDK Error (Attempt ${attempt}/${retries}):`, {
                    message: error.message,
                    status: error.status,
                    stack: error.stack?.split('\n')[0],
                    response: error.response ? {
                        status: error.response.status,
                        data: error.response.data
                    } : 'no-response'
                });

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
     */
    async generateEmbedding(text) {
        if (!this.client) throw new Error('Gemini not configured');

        return this._withRetry(async () => {
            const result = await this.embeddingModel.embedContent(text);
            return result.embedding.values;
        });
    }

    /**
     * Generate chat response
     */
    async generateResponse(systemPrompt, userMessage, options = {}) {
        if (!this.client) throw new Error('Gemini not configured');

        return this._withRetry(async () => {
            // Format conversation history for Gemini
            const formattedHistory = (options.history || []).map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            }));

            const chat = this.chatModel.startChat({
                history: formattedHistory,
                generationConfig: {
                    temperature: options.temperature || 0.3,
                    maxOutputTokens: options.maxTokens || 2048,
                },
            });

            // Combine system prompt with user message
            const fullPrompt = `${systemPrompt}\n\nUser Query: ${userMessage}`;
            const result = await chat.sendMessage(fullPrompt);
            const response = await result.response;
            const text = response.text();

            // Extract usage if available
            const usage = response.usageMetadata || {};

            return {
                content: text,
                tokens: {
                    prompt: usage.promptTokenCount || 0,
                    completion: usage.candidatesTokenCount || 0,
                    total: (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0),
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
            const prompt = `Analyze this document and generate 3-5 relevant tags/categories. Return ONLY a JSON array of strings, nothing else.

Document excerpt:
${text.substring(0, 1500)}

Example response: ["HR Policy", "Employee Benefits", "Vacation"]`;

            const result = await this.chatModel.generateContent(prompt);
            const response = await result.response;
            const jsonStr = response.text().replace(/```json\n?|\n?```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (error) {
            console.error('Failed to generate tags:', error.message);
            return [];
        }
    }
}

export default GeminiProvider;
