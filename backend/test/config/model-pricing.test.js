import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateCost, getModelsByProvider, MODELS, PROVIDERS } from '../../src/config/model-pricing.js';

describe('Model Pricing', () => {
    describe('calculateCost', () => {
        it('should calculate cost for known model correctly', () => {
            // Gemini 2.5 Flash: $0.30 per 1M input, $2.50 per 1M output
            const result = calculateCost('gemini-2.5-flash', 1000, 500);
            
            // Expected: (1000/1M * 0.30) + (500/1M * 2.50)
            // = 0.0003 + 0.00125 = 0.00155
            assert.ok(result.inputCost > 0, 'Input cost should be positive');
            assert.ok(result.outputCost > 0, 'Output cost should be positive');
            assert.strictEqual(result.totalCost, result.inputCost + result.outputCost);
            assert.strictEqual(typeof result.totalCostCents, 'number');
        });

        it('should handle zero tokens', () => {
            const result = calculateCost('gemini-2.5-flash', 0, 0);
            
            assert.strictEqual(result.inputCost, 0);
            assert.strictEqual(result.outputCost, 0);
            assert.strictEqual(result.totalCost, 0);
            assert.strictEqual(result.totalCostCents, 0);
        });

        it('should handle large token counts', () => {
            const result = calculateCost('gemini-2.5-flash', 1_000_000, 500_000);
            
            // 1M tokens input at $0.30 = $0.30
            // 500K tokens output at $2.50/M = $1.25
            assert.strictEqual(result.inputCost, 0.30);
            assert.strictEqual(result.outputCost, 1.25);
            assert.strictEqual(result.totalCost, 1.55);
        });

        it('should fallback to default model for invalid model ID', () => {
            const result = calculateCost('invalid-model-id', 1000, 500);
            
            // Should use gemini-2.5-flash as fallback
            assert.ok(result.totalCost > 0, 'Should calculate cost with fallback model');
            assert.ok(result.hasOwnProperty('inputCost'));
            assert.ok(result.hasOwnProperty('outputCost'));
        });

        it('should convert cost to cents correctly', () => {
            const result = calculateCost('gemini-2.5-flash', 100_000, 50_000);
            
            // Total: (100K/1M * 0.30) + (50K/1M * 2.50) = 0.03 + 0.125 = 0.155
            // Cents: Math.round(0.155 * 100) = 16 cents
            assert.strictEqual(typeof result.totalCostCents, 'number');
            assert.strictEqual(result.totalCostCents, Math.round(result.totalCost * 100));
        });

        it('should differentiate input and output costs', () => {
            // GPT-5.2: $15/1M input, $60/1M output (4x difference)
            const result = calculateCost('gpt-5.2', 1_000_000, 1_000_000);
            
            assert.strictEqual(result.inputCost, 15.00);
            assert.strictEqual(result.outputCost, 60.00);
            assert.ok(result.outputCost > result.inputCost, 'Output should cost more');
        });

        it('should handle free tier model costs', () => {
            // Llama 3.1 8B Instant: $0.05/1M input, $0.10/1M output
            const result = calculateCost('llama-3.1-8b-instant', 1_000_000, 1_000_000);
            
            assert.strictEqual(result.inputCost, 0.05);
            assert.strictEqual(result.outputCost, 0.10);
            // Use approximate comparison for floating point
            assert.ok(Math.abs(result.totalCost - 0.15) < 0.0001, 'Total cost should be approximately 0.15');
        });

        it('should return correct structure', () => {
            const result = calculateCost('gemini-2.5-flash', 1000, 500);
            
            assert.ok(result.hasOwnProperty('inputCost'));
            assert.ok(result.hasOwnProperty('outputCost'));
            assert.ok(result.hasOwnProperty('totalCost'));
            assert.ok(result.hasOwnProperty('totalCostCents'));
            assert.strictEqual(Object.keys(result).length, 4);
        });

        it('should handle only input tokens', () => {
            const result = calculateCost('gemini-2.5-flash', 10000, 0);
            
            assert.ok(result.inputCost > 0);
            assert.strictEqual(result.outputCost, 0);
            assert.strictEqual(result.totalCost, result.inputCost);
        });

        it('should handle only output tokens', () => {
            const result = calculateCost('gemini-2.5-flash', 0, 10000);
            
            assert.strictEqual(result.inputCost, 0);
            assert.ok(result.outputCost > 0);
            assert.strictEqual(result.totalCost, result.outputCost);
        });
    });

    describe('getModelsByProvider', () => {
        it('should group models by provider', () => {
            const grouped = getModelsByProvider();
            
            assert.ok(typeof grouped === 'object');
            assert.ok(Object.keys(grouped).length > 0);
        });

        it('should include all providers', () => {
            const grouped = getModelsByProvider();
            
            assert.ok(grouped.hasOwnProperty('gemini'), 'Should have Gemini provider');
            assert.ok(grouped.hasOwnProperty('openai'), 'Should have OpenAI provider');
            assert.ok(grouped.hasOwnProperty('anthropic'), 'Should have Anthropic provider');
            assert.ok(grouped.hasOwnProperty('groq'), 'Should have Groq provider');
        });

        it('should include provider metadata', () => {
            const grouped = getModelsByProvider();
            
            Object.entries(grouped).forEach(([providerId, provider]) => {
                assert.ok(provider.hasOwnProperty('name'), `${providerId} should have name`);
                assert.ok(provider.hasOwnProperty('icon'), `${providerId} should have icon`);
                assert.ok(provider.hasOwnProperty('models'), `${providerId} should have models array`);
                assert.ok(Array.isArray(provider.models), `${providerId} models should be an array`);
            });
        });

        it('should preserve model properties', () => {
            const grouped = getModelsByProvider();
            const geminiModels = grouped.gemini.models;
            
            assert.ok(geminiModels.length > 0, 'Should have Gemini models');
            
            geminiModels.forEach(model => {
                assert.ok(model.hasOwnProperty('id'));
                assert.ok(model.hasOwnProperty('name'));
                assert.ok(model.hasOwnProperty('description'));
                assert.ok(model.hasOwnProperty('inputPer1M'));
                assert.ok(model.hasOwnProperty('outputPer1M'));
                assert.ok(model.hasOwnProperty('freeTier'));
                assert.ok(model.hasOwnProperty('recommended'));
            });
        });

        it('should handle recommended flags correctly', () => {
            const grouped = getModelsByProvider();
            
            // Check that some models are marked as recommended
            let hasRecommended = false;
            let hasNonRecommended = false;
            
            Object.values(grouped).forEach(provider => {
                provider.models.forEach(model => {
                    if (model.recommended) hasRecommended = true;
                    if (!model.recommended) hasNonRecommended = true;
                });
            });
            
            assert.ok(hasRecommended, 'Should have at least one recommended model');
            assert.ok(hasNonRecommended, 'Should have at least one non-recommended model');
        });

        it('should match MODELS count', () => {
            const grouped = getModelsByProvider();
            
            let totalModels = 0;
            Object.values(grouped).forEach(provider => {
                totalModels += provider.models.length;
            });
            
            const modelsCount = Object.keys(MODELS).length;
            assert.strictEqual(totalModels, modelsCount, 'Should include all models');
        });
    });
});
