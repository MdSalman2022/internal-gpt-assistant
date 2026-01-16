import { describe, it } from 'node:test';
import assert from 'node:assert';
import { chunkText, cleanText, extractKeywords, reciprocalRankFusion } from '../../src/utils/chunker.js';

describe('Text Chunking Utilities', () => {
    describe('chunkText', () => {
        it('should split text into chunks with proper indices', () => {
            const text = 'This is sentence one. This is sentence two. This is sentence three.';
            const chunks = chunkText(text, { chunkSize: 30, chunkOverlap: 10 });
            
            assert.ok(chunks.length > 0, 'Should create at least one chunk');
            assert.strictEqual(chunks[0].index, 0, 'First chunk should have index 0');
            assert.ok(chunks[0].content.length > 0, 'Chunks should have content');
        });

        it('should handle empty text', () => {
            const chunks = chunkText('', { chunkSize: 100 });
            assert.strictEqual(chunks.length, 0, 'Empty text should produce no chunks');
        });

        it('should create multiple chunks from long text', () => {
            const text = 'Sentence one. Sentence two. '.repeat(20);
            const chunks = chunkText(text, { chunkSize: 50, chunkOverlap: 10 });
            
            // Long text should be split into multiple chunks
            assert.ok(chunks.length > 1, 'Should create multiple chunks');
            assert.ok(chunks.every(c => c.content.trim().length > 0), 'All chunks should have content');
        });
    });

    describe('cleanText', () => {
        it('should remove excessive whitespace', () => {
            const messy = 'Too    many     spaces';
            const clean = cleanText(messy);
            assert.strictEqual(clean, 'Too many spaces');
        });

        it('should normalize quotes', () => {
            const text = '"Smart quotes" and \'single quotes\'';
            const clean = cleanText(text);
            assert.ok(clean.includes('"'), 'Should normalize double quotes');
            assert.ok(clean.includes("'"), 'Should normalize single quotes');
        });

        it('should trim whitespace', () => {
            const text = '  surrounded by spaces  ';
            const clean = cleanText(text);
            assert.strictEqual(clean, 'surrounded by spaces');
        });

        it('should handle empty string', () => {
            const clean = cleanText('');
            assert.strictEqual(clean, '');
        });
    });

    describe('extractKeywords', () => {
        it('should extract keywords from text', () => {
            const text = 'machine learning and artificial intelligence are important technologies';
            const keywords = extractKeywords(text, 5);
            
            assert.ok(Array.isArray(keywords), 'Should return an array');
            assert.ok(keywords.length <= 5, 'Should respect topN limit');
        });

        it('should filter out stop words', () => {
            const text = 'the quick brown fox jumps over the lazy dog';
            const keywords = extractKeywords(text, 10);
            
            // 'the' is a stop word and should be filtered
            assert.ok(!keywords.includes('the'), 'Should not include "the"');
            // 'quick' is not a stop word and should be included
            assert.ok(keywords.includes('quick'), 'Should include "quick"');
        });

        it('should handle empty text', () => {
            const keywords = extractKeywords('', 5);
            assert.strictEqual(keywords.length, 0, 'Empty text should return no keywords');
        });

        it('should ignore short words', () => {
            const text = 'AI ML is good';
            const keywords = extractKeywords(text, 10);
            // Words shorter than 3 chars should be filtered
            assert.ok(!keywords.includes('ai'), 'Should filter short words');
            assert.ok(!keywords.includes('is'), 'Should filter short words');
        });
    });

    describe('reciprocalRankFusion', () => {
        it('should fuse multiple result sets', () => {
            const results1 = [
                { id: 'a', content: 'doc A' },
                { id: 'b', content: 'doc B' }
            ];
            const results2 = [
                { id: 'b', content: 'doc B' },
                { id: 'c', content: 'doc C' }
            ];
            
            const fused = reciprocalRankFusion([results1, results2]);
            
            assert.ok(Array.isArray(fused), 'Should return an array');
            assert.ok(fused.every(item => item.fusionScore !== undefined), 'Each item should have fusionScore');
        });

        it('should rank items appearing in multiple sets higher', () => {
            const results1 = [{ id: 'shared', content: 'shared doc' }];
            const results2 = [{ id: 'shared', content: 'shared doc' }];
            const results3 = [{ id: 'unique', content: 'unique doc' }];
            
            const fused = reciprocalRankFusion([results1, results2, results3]);
            
            // Item appearing in 2 sets should rank higher than one in 1 set
            const sharedItem = fused.find(item => item.id === 'shared');
            const uniqueItem = fused.find(item => item.id === 'unique');
            
            assert.ok(sharedItem.fusionScore > uniqueItem.fusionScore, 'Shared items should rank higher');
        });

        it('should handle empty result sets', () => {
            const fused = reciprocalRankFusion([]);
            assert.strictEqual(fused.length, 0, 'Empty input should return empty array');
        });

        it('should preserve original item properties', () => {
            const results = [
                [{ id: 'a', content: 'doc A', metadata: 'test' }]
            ];
            
            const fused = reciprocalRankFusion(results);
            
            assert.strictEqual(fused[0].id, 'a');
            assert.strictEqual(fused[0].content, 'doc A');
            assert.strictEqual(fused[0].metadata, 'test');
        });
    });
});
