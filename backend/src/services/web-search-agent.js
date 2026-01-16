// WebSearchAgent: LangChain-powered agent for web search with Tavily
import { tavily } from '@tavily/core';
import config from '../config/index.js';

class WebSearchAgent {
    constructor(apiKey = null) {
        this.apiKey = apiKey || config.tavily?.apiKey;
        
        if (!this.apiKey) {
            console.warn('⚠️  Tavily API key not configured. Web search disabled.');
            this.enabled = false;
            return;
        }

        this.client = tavily({ apiKey: this.apiKey });
        this.enabled = true;
        
        // Credit-conscious cache (5 minute TTL)
        this.cache = new Map();
        this.CACHE_TTL = 5 * 60 * 1000;
        
        console.log('🌐 Web Search Agent initialized');
    }

    // Factory method to create instance for organization
    static createForOrganization(organization) {
        if (!organization) {
            return new WebSearchAgent();
        }

        // Check if organization has web search enabled
        if (!organization.aiSettings?.tavilyEnabled) {
            const agent = new WebSearchAgent(null);
            agent.enabled = false;
            return agent;
        }

        // Use organization's API key
        const apiKey = organization.aiSettings?.tavilyApiKey;
        return new WebSearchAgent(apiKey);
    }

    // Basic search (1 credit per query)
    async search(query, options = {}) {
        if (!this.enabled) {
            throw new Error('Web search is not enabled for this organization. Please configure Tavily API key in organization settings.');
        }

        const { 
            maxResults = 3,
            includeRawContent = false,
            useCache = true 
        } = options;

        // Check cache first
        if (useCache) {
            const cached = this.getFromCache(query);
            if (cached) {
                console.log('📦 Using cached web search result');
                return cached;
            }
        }

        try {
            console.log(`🔍 Searching web for: "${query}"`);
            
            const response = await this.client.search(query, {
                searchDepth: 'basic', // 1 credit (vs 2 for advanced)
                maxResults,
                includeRawContent
            });

            const results = this.formatResults(response);
            
            // Cache for 5 minutes
            if (useCache) {
                this.addToCache(query, results);
            }

            return results;
        } catch (error) {
            console.error('Tavily search error:', error.message);
            throw new Error(`Web search failed: ${error.message}`);
        }
    }

    // Format Tavily results
    formatResults(response) {
        if (!response?.results || response.results.length === 0) {
            return {
                found: false,
                results: [],
                summary: 'No web results found.'
            };
        }

        return {
            found: true,
            results: response.results.map(r => ({
                title: r.title,
                url: r.url,
                content: r.content,
                score: r.score
            })),
            summary: this.generateSummary(response.results)
        };
    }

    // Generate summary from top results
    generateSummary(results) {
        const topThree = results.slice(0, 3);
        return topThree
            .map((r, i) => `[${i + 1}] ${r.title}: ${r.content.substring(0, 200)}...`)
            .join('\n\n');
    }

    // Cache management
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        // Check TTL
        if (Date.now() - cached.timestamp > this.CACHE_TTL) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    addToCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });

        // Limit cache size (max 50 entries)
        if (this.cache.size > 50) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
    }

    clearCache() {
        this.cache.clear();
    }

    // Check if web search is available
    isAvailable() {
        return this.enabled;
    }
}

// Export class (not singleton)
export default WebSearchAgent;

