import { Conversation, Message, Document, User, Organization } from '../models/index.js';
import { ragService, aiService, geminiService, documentService, auditService, guardrailService, usageService } from '../services/index.js';
import WebSearchAgent from '../services/web-search-agent.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import { requireUsageLimit } from '../middleware/usage-limit.middleware.js';
import { requireTenant, requireOrganization, requireActiveSubscription } from '../middleware/tenant.middleware.js';

// Chat routes
export default async function chatRoutes(fastify) {
    // Require tenant context (auth + org + active subscription) for all chat routes
    fastify.addHook('preHandler', async (request, reply) => {
        // Run tenant middleware
        await requireTenant()(request, reply);
    });

    // Get available AI providers
    fastify.get('/providers', async (request, reply) => {
        const providers = await aiService.getAvailableProviders();
        return { providers };
    });

    // Upload file to a specific conversation (per-chat upload)
    fastify.post('/conversations/:id/upload', {
        preHandler: [requirePermission('chat:upload')]
    }, async (request, reply) => {
        const conversationId = request.params.id;

        // Verify conversation exists and belongs to user
        const conversation = await Conversation.findOne({
            _id: conversationId,
            userId: request.session.userId,
        });

        if (!conversation) {
            return reply.status(404).send({ error: 'Conversation not found' });
        }

        const data = await request.file();

        if (!data) {
            return reply.status(400).send({ error: 'No file uploaded' });
        }

        // Validate file type
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'text/plain',
            'text/markdown',
            'text/csv',
        ];

        if (!allowedTypes.includes(data.mimetype)) {
            return reply.status(400).send({ error: 'File type not supported' });
        }

        const fileBuffer = await data.toBuffer();

        // Upload with conversation scope (not global)
        const document = await documentService.uploadAndCreateDocument(
            fileBuffer,
            data.filename,
            data.mimetype,
            request.session.userId,
            {
                accessLevel: 'private', // Force private "My Document" (no conversation scope)
                organizationId: request.organizationId // Multi-tenant scope
            }
        );

        // Process document in background
        documentService.processDocument(document._id).catch(err => {
            console.error('Background processing error:', err);
        });

        return {
            success: true,
            documentId: document._id,
            document: document.toObject(),
            message: 'File uploaded for this conversation',
        };
    });

    // Create new conversation
    fastify.post('/conversations', async (request, reply) => {
        const conversation = new Conversation({
            userId: request.session.userId,
            organizationId: request.organizationId, // Multi-tenant scope
            title: 'New Conversation',
        });
        await conversation.save();

        return { success: true, conversation: conversation.toObject() };
    });

    // List conversations
    fastify.get('/conversations', async (request, reply) => {
        const { page = 1, limit = 20 } = request.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [conversations, total] = await Promise.all([
            Conversation.find({
                userId: request.session.userId,
                isArchived: false,
            })
                .sort({ isPinned: -1, lastMessageAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Conversation.countDocuments({
                userId: request.session.userId,
                isArchived: false,
            }),
        ]);

        return { conversations, total };
    });

    // Get conversation with messages
    fastify.get('/conversations/:id', async (request, reply) => {
        const conversation = await Conversation.findOne({
            _id: request.params.id,
            userId: request.session.userId,
        }).lean();

        if (!conversation) {
            return reply.status(404).send({ error: 'Conversation not found' });
        }

        const messages = await Message.find({ conversationId: conversation._id })
            .sort({ createdAt: 1 })
            .lean();

        return { conversation, messages };
    });

    // Send message and get AI response
    fastify.post('/conversations/:id/messages', async (request, reply) => {
        const { content, provider, fileIds = [] } = request.body;

        if (!content?.trim() && fileIds.length === 0) {
            return reply.status(400).send({ error: 'Message content or file required' });
        }

        const conversation = await Conversation.findOne({
            _id: request.params.id,
            userId: request.session.userId,
        });

        if (!conversation) {
            return reply.status(404).send({ error: 'Conversation not found' });
        }

        // Fetch attachments metadata if fileIds provided
        // Fetch user context primarily for ACL (moved up from below)
        const user = await User.findById(request.session.userId).select('role department departments teams name email');

        // Fetch attachments metadata if fileIds provided
        // Fetch attachments metadata if fileIds provided
        // Normalize fileIds (handle legacy array of strings vs new array of objects)
        const fileInputs = fileIds.map(f => {
            return typeof f === 'string' ? { id: f, source: 'upload' } : { id: f.id, source: f.source || 'upload' };
        });
        const inputIds = fileInputs.map(f => f.id);

        // Fetch attachments metadata if fileIds provided
        const attachments = [];
        if (fileIds.length > 0) {
            // Check which of the requested files the user actually has access to
            const accessibleDocIds = await documentService.filterAccessibleDocuments({
                userId: request.session.userId,
                userRole: user.role,
                userEmail: user.email,
                departments: user.departments,
                teams: user.teams,
                documentIds: inputIds
            });

            if (accessibleDocIds.length > 0) {
                const docs = await Document.find({
                    _id: { $in: accessibleDocIds } // Only fetch accessible docs
                });

                // Create lookup for sources
                const sourceMap = fileInputs.reduce((acc, item) => {
                    acc[item.id] = item.source;
                    return acc;
                }, {});

                for (const doc of docs) {
                    attachments.push({
                        documentId: doc._id,
                        name: doc.originalName || doc.title, // Fallback to title if originalName missing
                        mimeType: doc.mimeType,
                        size: doc.size,
                        source: sourceMap[doc._id.toString()] || 'upload'
                    });
                }
            }
        }

        // POLLING: Wait for documents to be processed if any are new uploads
        if (inputIds.length > 0) {
            const startStr = Date.now();
            const POLL_TIMEOUT = 30000; // 30s timeout
            const POLL_INTERVAL = 2000;

            let allReady = false;
            while (Date.now() - startStr < POLL_TIMEOUT) {
                const pendingDocs = await Document.find({
                    _id: { $in: inputIds },
                    status: { $in: ['pending', 'processing'] }
                }).select('_id status');

                if (pendingDocs.length === 0) {
                    allReady = true;
                    break;
                }

                // Wait before next check
                await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
            }

            if (!allReady) {
                console.warn('⚠️ Some documents still processing after timeout, proceeding anyway.');
            }
        }

        // Save user message
        const userMessage = new Message({
            conversationId: conversation._id,
            role: 'user',
            content: content.trim() || 'Sent attachments',
            attachments,
        });
        await userMessage.save();

        // Get conversation history for context
        const history = await Message.find({ conversationId: conversation._id })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        // Call RAG pipeline with selected provider
        let response;
        let webSearchUsed = false;
        try {
            response = await ragService.query(content || 'Context from attachments', {
                userId: request.session.userId,
                organizationId: request.organizationId,
                user,
                conversationId: conversation._id,
                conversationHistory: history.reverse(),
                provider: provider || undefined,
                targetDocumentIds: inputIds.length > 0 ? inputIds : undefined
            });

            // Web search integration (opt-in via useWebSearch param)
            const { useWebSearch = false } = request.body;
            
            // Check if the IMMEDIATELY previous message was an assistant web search response
            // If so, this is likely a follow-up question - skip new web search
            // history is [oldest -> newest] after reverse, so history[length-1] is the current user msg we just saved
            // and history[length-2] is the previous message (should be assistant if it exists)
            const previousMessage = history.length >= 2 ? history[history.length - 2] : null;
            const previousWasWebSearch = previousMessage?.role === 'assistant' && 
                (previousMessage?.content?.includes('Web Search Results:') || 
                 previousMessage?.content?.includes('Additional Web Sources:'));
            
            if (useWebSearch && !previousWasWebSearch) {
                try {
                    // Load organization data for web search configuration
                    const organization = await Organization.findById(request.organizationId);
                    const orgWebSearchAgent = await WebSearchAgent.createForOrganization(organization);
                    
                    if (orgWebSearchAgent.isAvailable()) {
                        console.log(`🌐 Web search enabled for organization, fetching live results...`);
                        const webResults = await orgWebSearchAgent.search(content, { maxResults: 3 });
                    
                        if (webResults && webResults.results && webResults.results.length > 0) {
                            console.log(`✅ Found ${webResults.results.length} web results`);
                            
                            // Check if RAG has good internal results
                            const topRelevance = response.citations?.[0]?.relevanceScore || 0;
                            
                            if (topRelevance > 0.5) {
                                // COMBINE: Good internal docs + web results
                                response.answer = `${response.answer}\n\n---\n\n**🌐 Additional Web Sources:**\n\n${webResults.summary}\n\n**Sources:**\n${webResults.results.map((r, i) => `${i + 1}. [${r.title}](${r.url})`).join('\n')}`;
                                response.webSearch = { used: true, resultsCount: webResults.results.length, mode: 'combined' };
                            } else {
                                // REPLACE: Poor internal docs, use web only
                                response.answer = `**🌐 Web Search Results:**\n\n${webResults.summary}\n\n**Sources:**\n${webResults.results.map((r, i) => `${i + 1}. [${r.title}](${r.url})`).join('\n')}`;
                                response.confidence = 0.85;
                                response.citations = [];
                                response.webSearch = { used: true, resultsCount: webResults.results.length, mode: 'primary' };
                            }
                        } else {
                            console.warn('⚠️ Web search returned no results');
                        }
                    } else {
                        console.warn('⚠️ Web search is not enabled for this organization');
                    }
                } catch (webError) {
                    console.error('❌ Web search failed:', webError.message);
                }
            } else if (useWebSearch && previousWasWebSearch) {
                console.log('🔄 Skipping new web search - previous message was a web search response (follow-up question detected)');
            }
        } catch (error) {
            console.error('❌ RAG Service Error:', error);
            // Handle rate limiting specifically
            if (error.status === 429 || (error.message && error.message.includes('429'))) {
                // Extract retry time from error message
                let retrySeconds = 60; // Default fallback
                const retryMatch = error.message?.match(/retry in (\d+(?:\.\d+)?)/i);
                if (retryMatch) {
                    retrySeconds = Math.ceil(parseFloat(retryMatch[1]));
                }

                // Check for quota type
                const isQuotaExhausted = error.message?.includes('limit: 0') || error.message?.includes('exceeded your current quota');

                return reply.status(429).send({
                    error: 'rate_limit_exceeded',
                    message: isQuotaExhausted
                        ? 'You have exceeded your AI provider\'s daily quota. Please try again tomorrow or use a different API key.'
                        : `AI provider is rate limited. Please wait ${retrySeconds} seconds before trying again.`,
                    retryAfter: retrySeconds,
                    isQuotaExhausted
                });
            }
            return reply.status(500).send({ error: `RAG processing failed: ${error.message}` });
        }

        // Handle guardrail blocked requests
        if (response.blocked) {
            // Audit log for security tracking
            auditService.log(request, 'GUARDRAIL_BLOCK', { type: 'conversation', id: conversation._id.toString() }, {
                reason: response.blockedReason,
                query: content?.substring(0, 100) + '...' // Truncated for privacy
            });

            // Save a system message indicating block (optional, for UI)
            const blockedMessage = new Message({
                conversationId: conversation._id,
                role: 'assistant',
                content: response.answer, // The rejection message from guardrails
                metadata: { blocked: true, blockedReason: response.blockedReason }
            });
            await blockedMessage.save();

            return {
                userMessage: userMessage.toObject(),
                assistantMessage: blockedMessage.toObject(),
                metadata: { blocked: true, blockedReason: response.blockedReason }
            };
        }

        // Save assistant message with all tracking data
        const assistantMessage = new Message({
            conversationId: conversation._id,
            role: 'assistant',
            content: response.answer,
            citations: response.citations,
            confidence: response.confidence,
            isLowConfidence: response.isLowConfidence,
            latency: response.latency,
            timings: response.timings || { embed: 0, search: 0, generate: 0 },
            sourcesSearched: response.sourcesSearched || 0,
            tokens: response.tokens || { prompt: 0, completion: 0, total: 0 },
        });
        await assistantMessage.save();

        // Update conversation
        conversation.messageCount += 2;
        conversation.lastMessageAt = new Date();

        // Auto-generate title from first message
        if (conversation.autoTitle && conversation.messageCount === 2) {
            conversation.title = await geminiService.generateConversationTitle(content || 'New Conversation');
            conversation.autoTitle = false;
        }

        await conversation.save();

        // LOG USAGE: Track token consumption
        if (response.tokens && response.tokens.total > 0) {
            await usageService.logUsage({
                userId: request.session.userId,
                conversationId: conversation._id,
                promptTokens: response.tokens.prompt || 0,
                completionTokens: response.tokens.completion || 0,
                model: response.model || 'gemini-pro',
                provider: response.provider || 'gemini',
                requestType: 'chat'
            });
        }

        // AUDIT LOG: Query
        auditService.log(request, 'QUERY', { type: 'conversation', id: conversation._id.toString() }, {
            query: content || 'Used Attachment',
            model: response.provider || 'gemini',
            responseLength: response.answer?.length,
            citedDocumentIds: response.citations?.map(c => c.documentId) || []
        });

        // AUDIT LOG: Guardrail Redaction (if PII was redacted)
        console.log('🔐 Guardrail Findings Check:', response.guardrailFindings);
        if (response.guardrailFindings && response.guardrailFindings.length > 0) {
            const piiFindings = response.guardrailFindings.filter(f => f.type === 'pii');
            console.log('🔐 PII Findings:', piiFindings);
            if (piiFindings.length > 0) {
                console.log('📝 Logging GUARDRAIL_REDACT audit entry...');
                await auditService.log(request, 'GUARDRAIL_REDACT', { type: 'conversation', id: conversation._id.toString() }, {
                    redactedCount: piiFindings.length,
                    types: [...new Set(piiFindings.map(f => f.category))],
                    query: content?.substring(0, 50) + '...' // Truncated for privacy
                });
                console.log('✅ GUARDRAIL_REDACT audit logged');
            }
        }

        return {
            userMessage: userMessage.toObject(),
            assistantMessage: assistantMessage.toObject(),
            metadata: {
                rewrittenQuery: response.rewrittenQuery,
                sourcesSearched: response.sourcesSearched,
                latency: response.latency,
            },
        };
    });

    // Delete conversation
    fastify.delete('/conversations/:id', async (request, reply) => {
        const conversation = await Conversation.findOneAndDelete({
            _id: request.params.id,
            userId: request.session.userId,
        });

        if (!conversation) {
            return reply.status(404).send({ error: 'Conversation not found' });
        }

        // Delete messages
        await Message.deleteMany({ conversationId: conversation._id });

        return { success: true };
    });

    // Rename conversation
    fastify.patch('/conversations/:id', async (request, reply) => {
        const { title } = request.body;

        if (!title || !title.trim()) {
            return reply.status(400).send({ error: 'Title is required' });
        }

        const conversation = await Conversation.findOneAndUpdate(
            {
                _id: request.params.id,
                userId: request.session.userId,
            },
            {
                title: title.trim(),
                autoTitle: false
            },
            { new: true }
        );

        if (!conversation) {
            return reply.status(404).send({ error: 'Conversation not found' });
        }

        return { success: true, conversation: conversation.toObject() };
    });

    // Toggle pin conversation
    fastify.patch('/conversations/:id/pin', async (request, reply) => {
        const conversation = await Conversation.findOne({
            _id: request.params.id,
            userId: request.session.userId,
        });

        if (!conversation) {
            return reply.status(404).send({ error: 'Conversation not found' });
        }

        conversation.isPinned = !conversation.isPinned;
        await conversation.save();

        return { success: true, isPinned: conversation.isPinned };
    });

    // Message feedback
    fastify.post('/messages/:id/feedback', async (request, reply) => {
        const { feedback, comment } = request.body;

        if (!['positive', 'negative'].includes(feedback)) {
            return reply.status(400).send({ error: 'Invalid feedback type' });
        }

        const message = await Message.findById(request.params.id);
        if (!message) {
            return reply.status(404).send({ error: 'Message not found' });
        }

        message.feedback = feedback;
        if (comment) message.feedbackComment = comment;
        await message.save();

        return { success: true };
    });
}
