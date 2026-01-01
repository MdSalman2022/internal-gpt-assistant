/**
 * Model Pricing Configuration
 * Pricing for Gemini, OpenAI, and Anthropic Claude
 */

export const PROVIDERS = {
    gemini: { name: 'Google Gemini', icon: '✨' },
    openai: { name: 'OpenAI', icon: '🤖' },
    anthropic: { name: 'Anthropic Claude', icon: '🧠' }
};

export const MODELS = {
    // ========== GEMINI ==========
    'gemini-3-flash-preview': {
        id: 'gemini-3-flash-preview',
        name: 'Gemini 3 Flash',
        description: 'Fastest with frontier intelligence',
        provider: 'gemini',
        inputPer1M: 0.50,
        outputPer1M: 3.00,
        freeTier: true,
        recommended: true
    },
    'gemini-3-pro-preview': {
        id: 'gemini-3-pro-preview',
        name: 'Gemini 3 Pro',
        description: 'Most powerful multimodal',
        provider: 'gemini',
        inputPer1M: 2.00,
        outputPer1M: 12.00,
        freeTier: false
    },
    'gemini-2.5-pro': {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        description: 'Multimodal model with advanced capabilities',
        provider: 'gemini',
        inputPer1M: 1.25,
        outputPer1M: 10.00,
        freeTier: false
    },
    'gemini-2.5-flash': {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        description: 'Hybrid reasoning, 1M context',
        provider: 'gemini',
        inputPer1M: 0.30,
        outputPer1M: 2.50,
        freeTier: true
    },
    // ========== OPENAI ==========
    'gpt-5.2': {
        id: 'gpt-5.2',
        name: 'GPT-5.2',
        description: 'Most advanced frontier model for professional work',
        provider: 'openai',
        inputPer1M: 15.00,
        outputPer1M: 60.00,
        freeTier: false,
        recommended: true
    },
    'gpt-5-pro': {
        id: 'gpt-5-pro',
        name: 'GPT-5 Pro',
        description: 'Enhanced version of GPT-5 for smarter responses',
        provider: 'openai',
        inputPer1M: 30.00,
        outputPer1M: 90.00,
        freeTier: false
    },
    // ========== ANTHROPIC ==========
    'claude-4.5-sonnet': {
        id: 'claude-4.5-sonnet',
        name: 'Claude 4.5 Sonnet',
        description: 'Best balance of speed & intelligence',
        provider: 'anthropic',
        inputPer1M: 3.00,
        outputPer1M: 15.00,
        freeTier: false,
        recommended: true
    },
    'claude-4.5-haiku': {
        id: 'claude-4.5-haiku',
        name: 'Claude 4.5 Haiku',
        description: 'Fastest Claude model',
        provider: 'anthropic',
        inputPer1M: 1.00,
        outputPer1M: 5.00,
        freeTier: false
    },
    'claude-4.5-opus': {
        id: 'claude-4.5-opus',
        name: 'Claude 4.5 Opus',
        description: 'Most powerful Claude',
        provider: 'anthropic',
        inputPer1M: 15.00,
        outputPer1M: 75.00,
        freeTier: false
    },
};

/**
 * Calculate cost in USD for a request
 */
export function calculateCost(modelId, promptTokens, completionTokens) {
    const model = MODELS[modelId] || MODELS['gemini-2.5-flash'];
    const inputCost = (promptTokens / 1_000_000) * model.inputPer1M;
    const outputCost = (completionTokens / 1_000_000) * model.outputPer1M;
    return {
        inputCost,
        outputCost,
        totalCost: inputCost + outputCost,
        totalCostCents: Math.round((inputCost + outputCost) * 100)
    };
}

/**
 * Get models grouped by provider
 */
export function getModelsByProvider() {
    const grouped = {};
    for (const [id, model] of Object.entries(MODELS)) {
        if (!grouped[model.provider]) {
            grouped[model.provider] = {
                ...PROVIDERS[model.provider],
                models: []
            };
        }
        grouped[model.provider].models.push({
            id: model.id,
            name: model.name,
            description: model.description,
            inputPer1M: model.inputPer1M,
            outputPer1M: model.outputPer1M,
            freeTier: model.freeTier,
            recommended: model.recommended || false
        });
    }
    return grouped;
}

export default { MODELS, PROVIDERS, calculateCost, getModelsByProvider };
