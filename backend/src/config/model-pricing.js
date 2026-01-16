// Model pricing configuration (Gemini, OpenAI, Anthropic, Groq)

export const PROVIDERS = {
    gemini: { name: 'Google Gemini', icon: '✨' },
    openai: { name: 'OpenAI', icon: '🤖' },
    anthropic: { name: 'Anthropic Claude', icon: '🧠' },
    groq: { name: 'Groq (Llama 3)', icon: '⚡' }
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
    // ========== GROQ ==========
    'llama-3.3-70b-versatile': {
        id: 'llama-3.3-70b-versatile',
        name: 'Llama 3.3 70B',
        description: 'Smartest open model, highly versatile',
        provider: 'groq',
        inputPer1M: 0.59,
        outputPer1M: 0.79,
        freeTier: true,
        recommended: true
    },
    'llama-3.1-8b-instant': {
        id: 'llama-3.1-8b-instant',
        name: 'Llama 3.1 8B Instant',
        description: 'Extremely fast, high daily limits',
        provider: 'groq',
        inputPer1M: 0.05,
        outputPer1M: 0.10,
        freeTier: true
    },
    'meta-llama/llama-4-maverick-17b-128e-instruct': {
        id: 'meta-llama/llama-4-maverick-17b-128e-instruct',
        name: 'Llama 4 Maverick 17B',
        description: 'Preview: Next-gen intelligence & speed',
        provider: 'groq',
        inputPer1M: 0.20,
        outputPer1M: 0.20,
        freeTier: true
    },
    'meta-llama/llama-4-scout-17b-16e-instruct': {
        id: 'meta-llama/llama-4-scout-17b-16e-instruct',
        name: 'Llama 4 Scout 17B',
        description: 'Preview: Fast instruction following',
        provider: 'groq',
        inputPer1M: 0.20,
        outputPer1M: 0.20,
        freeTier: true
    },
    'qwen/qwen3-32b': {
        id: 'qwen/qwen3-32b',
        name: 'Qwen 3 32B',
        description: 'High intelligence, massive daily quota',
        provider: 'groq',
        inputPer1M: 0.30,
        outputPer1M: 0.30,
        freeTier: true
    },
    'moonshotai/kimi-k2-instruct': {
        id: 'moonshotai/kimi-k2-instruct',
        name: 'Moonshot Kimi K2',
        description: 'Strong instruction following',
        provider: 'groq',
        inputPer1M: 0.30,
        outputPer1M: 0.30,
        freeTier: true
    },
    'openai/gpt-oss-120b': {
        id: 'openai/gpt-oss-120b',
        name: 'GPT-OSS 120B',
        description: 'Large open-weights model',
        provider: 'groq',
        inputPer1M: 0.50,
        outputPer1M: 0.50,
        freeTier: true
    },
    'allam-2-7b': {
        id: 'allam-2-7b',
        name: 'Allam 2 7B',
        description: 'Efficient Arabic/English model',
        provider: 'groq',
        inputPer1M: 0.10,
        outputPer1M: 0.10,
        freeTier: true
    },
    'groq/compound': {
        id: 'groq/compound',
        name: 'Groq Compound',
        description: 'Advanced reasoning capabilities',
        provider: 'groq',
        inputPer1M: 0.30,
        outputPer1M: 0.30,
        freeTier: true
    },
    'groq/compound-mini': {
        id: 'groq/compound-mini',
        name: 'Groq Compound Mini',
        description: 'Compact reasoning model',
        provider: 'groq',
        inputPer1M: 0.20,
        outputPer1M: 0.20,
        freeTier: true
    },
    'moonshotai/kimi-k2-instruct-0905': {
        id: 'moonshotai/kimi-k2-instruct-0905',
        name: 'Moonshot Kimi K2 (Sept)',
        description: 'Latest Kimi K2 variant',
        provider: 'groq',
        inputPer1M: 0.30,
        outputPer1M: 0.30,
        freeTier: true
    },
    'openai/gpt-oss-20b': {
        id: 'openai/gpt-oss-20b',
        name: 'GPT-OSS 20B',
        description: 'Open-weights 20B model',
        provider: 'groq',
        inputPer1M: 0.40,
        outputPer1M: 0.40,
        freeTier: true
    },
    'openai/gpt-oss-safeguard-20b': {
        id: 'openai/gpt-oss-safeguard-20b',
        name: 'GPT-OSS Safeguard 20B',
        description: 'Safety-focused 20B model',
        provider: 'groq',
        inputPer1M: 0.40,
        outputPer1M: 0.40,
        freeTier: true
    },
    'whisper-large-v3': {
        id: 'whisper-large-v3',
        name: 'Whisper Large v3',
        description: 'State-of-the-art audio transcription',
        provider: 'groq',
        inputPer1M: 0.00,
        outputPer1M: 0.00,
        freeTier: true
    },
    'whisper-large-v3-turbo': {
        id: 'whisper-large-v3-turbo',
        name: 'Whisper Large v3 Turbo',
        description: 'Fastest audio transcription',
        provider: 'groq',
        inputPer1M: 0.00,
        outputPer1M: 0.00,
        freeTier: true
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
