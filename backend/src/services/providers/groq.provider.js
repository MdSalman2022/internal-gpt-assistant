/**
 * Groq AI Provider
 * 
 * Handles all Groq-specific API calls for text generation.
 * Known for extremely fast inference speeds.
 */

import Groq from 'groq-sdk';

class GroqProvider {
    constructor(apiKey) {
        if (!apiKey) {
            console.warn('⚠️ Groq API key not configured');
            this.client = null;
            return;
        }

        try {
            this.client = new Groq({ apiKey });
            this.model = process.env.GROQ_MODEL || 'llama3-70b-8192';
        } catch (error) {
            console.error('❌ Failed to initialize Groq client:', error.message);
            this.client = null;
        }
    }

    get isConfigured() {
        return this.client !== null;
    }

    get name() {
        return 'groq';
    }

    get displayName() {
        return 'Groq (Llama 3)';
    }

    /**
     * Generate chat response
     */
    async generateResponse(systemPrompt, userMessage, options = {}) {
        if (!this.client) throw new Error('Groq not configured');

        try {
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

            const completion = await this.client.chat.completions.create({
                messages,
                model: options.model || this.model,
                temperature: options.temperature || 0.3,
                max_tokens: options.maxTokens || 2048,
            });

            const content = completion.choices[0]?.message?.content || '';
            const usage = completion.usage || {};

            return {
                content,
                tokens: {
                    prompt: usage.prompt_tokens || 0,
                    completion: usage.completion_tokens || 0,
                    total: usage.total_tokens || 0,
                },
                model: options.model || this.model,
                provider: 'groq'
            };
        } catch (error) {
            console.error('❌ Groq generation error:', error);
            throw error;
        }
    }

    /**
     * Generate embedding (Not supported directly by Groq usually, returns null to fallback)
     */
    async generateEmbedding(text) {
        throw new Error('Groq does not support embeddings. Use Gemini or OpenAI.');
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

            const result = await this.generateResponse('You are a helpful tag generator.', prompt, {
                temperature: 0.1
            });

            const jsonStr = result.content.replace(/```json\n?|\n?```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (error) {
            console.error('Failed to generate tags with Groq:', error.message);
            return [];
        }
    }
}

export default GroqProvider;
