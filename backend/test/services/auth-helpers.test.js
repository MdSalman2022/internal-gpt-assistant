import { describe, it } from 'node:test';
import assert from 'node:assert';
import authService from '../../src/services/auth.service.js';

describe('Auth Service Helpers', () => {
    describe('generateSlug', () => {
        it('should convert organization name to lowercase slug', () => {
            const slug = authService.generateSlug('My Company Name');
            assert.strictEqual(slug, 'my-company-name');
        });

        it('should replace spaces with hyphens', () => {
            const slug = authService.generateSlug('Multiple Word Company');
            assert.strictEqual(slug, 'multiple-word-company');
        });

        it('should remove special characters', () => {
            const slug = authService.generateSlug('Company! @#$ %Name^');
            // Special chars are removed, spaces between words become single hyphen
            assert.strictEqual(slug, 'company-name');
        });

        it('should handle consecutive spaces', () => {
            const slug = authService.generateSlug('Too    Many    Spaces');
            assert.strictEqual(slug, 'too-many-spaces');
        });

        it('should handle trailing and leading spaces', () => {
            const slug = authService.generateSlug('  Company Name  ');
            // Leading/trailing spaces become hyphens, then collapse to single
            assert.strictEqual(slug, '-company-name-');
        });

        it('should collapse multiple hyphens', () => {
            const slug = authService.generateSlug('Company---Name');
            assert.strictEqual(slug, 'company-name');
        });

        it('should truncate to 50 characters', () => {
            const longName = 'A'.repeat(100);
            const slug = authService.generateSlug(longName);
            assert.ok(slug.length <= 50, 'Slug should not exceed 50 characters');
        });

        it('should handle empty string', () => {
            const slug = authService.generateSlug('');
            assert.strictEqual(slug, '');
        });

        it('should handle numbers in organization name', () => {
            const slug = authService.generateSlug('Company 123');
            assert.strictEqual(slug, 'company-123');
        });

        it('should handle mixed case with numbers', () => {
            const slug = authService.generateSlug('TechCorp2024');
            assert.strictEqual(slug, 'techcorp2024');
        });

        it('should handle only special characters', () => {
            const slug = authService.generateSlug('!@#$%^&*()');
            assert.strictEqual(slug, '');
        });

        it('should preserve hyphens in input', () => {
            const slug = authService.generateSlug('My-Company-Name');
            assert.strictEqual(slug, 'my-company-name');
        });
    });
});
