import config from '../config/index.js';

/**
 * Split text into overlapping chunks
 */
export function chunkText(text, options = {}) {
    const {
        chunkSize = config.rag.chunkSize,
        chunkOverlap = config.rag.chunkOverlap,
    } = options;

    const chunks = [];
    const sentences = text.split(/(?<=[.!?])\s+/);

    let currentChunk = '';
    let chunkIndex = 0;

    for (const sentence of sentences) {
        // If adding this sentence exceeds chunk size
        if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
            chunks.push({
                content: currentChunk.trim(),
                index: chunkIndex++,
            });

            // Start new chunk with overlap
            const words = currentChunk.split(' ');
            const overlapWords = words.slice(-Math.floor(chunkOverlap / 5));
            currentChunk = overlapWords.join(' ') + ' ' + sentence;
        } else {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
        }
    }

    // Don't forget the last chunk
    if (currentChunk.trim()) {
        chunks.push({
            content: currentChunk.trim(),
            index: chunkIndex,
        });
    }

    return chunks;
}

/**
 * Clean and normalize text
 */
export function cleanText(text) {
    return text
        // Remove excessive whitespace
        .replace(/\s+/g, ' ')
        // Remove special characters that might cause issues
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        // Normalize quotes
        .replace(/[""]/g, '"')
        .replace(/['']/g, "'")
        .trim();
}

/**
 * Extract keywords from text using simple TF approach
 */
export function extractKeywords(text, topN = 10) {
    // Common stop words
    const stopWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
        'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
        'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these',
        'those', 'it', 'its', 'they', 'them', 'their', 'we', 'our', 'you',
        'your', 'he', 'she', 'him', 'her', 'his', 'i', 'me', 'my', 'not',
    ]);

    // Tokenize and count
    const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    const freq = {};

    for (const word of words) {
        if (!stopWords.has(word)) {
            freq[word] = (freq[word] || 0) + 1;
        }
    }

    // Sort by frequency and return top N
    return Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, topN)
        .map(([word]) => word);
}

/**
 * Reciprocal Rank Fusion for combining search results
 * Used for hybrid search (semantic + keyword)
 */
export function reciprocalRankFusion(resultSets, k = 60) {
    const scores = {};

    for (const results of resultSets) {
        for (let rank = 0; rank < results.length; rank++) {
            const id = results[rank].id;
            if (!scores[id]) {
                scores[id] = { item: results[rank], score: 0 };
            }
            // RRF formula: 1 / (k + rank)
            scores[id].score += 1 / (k + rank + 1);
        }
    }

    // Sort by combined score
    return Object.values(scores)
        .sort((a, b) => b.score - a.score)
        .map(({ item, score }) => ({ ...item, fusionScore: score }));
}
