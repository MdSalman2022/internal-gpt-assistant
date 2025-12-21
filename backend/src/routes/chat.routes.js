import { Conversation, Message } from '../models/index.js';
import { ragService, geminiService } from '../services/index.js';

// Chat routes
export default async function chatRoutes(fastify) {
    // Require auth for all chat routes
    fastify.addHook('preHandler', async (request, reply) => {
        if (!request.session.userId) {
            return reply.status(401).send({ error: 'Not authenticated' });
        }
    });

    // Create new conversation
    fastify.post('/conversations', async (request, reply) => {
        const conversation = new Conversation({
            userId: request.session.userId,
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
        const { content } = request.body;

        if (!content?.trim()) {
            return reply.status(400).send({ error: 'Message content required' });
        }

        const conversation = await Conversation.findOne({
            _id: request.params.id,
            userId: request.session.userId,
        });

        if (!conversation) {
            return reply.status(404).send({ error: 'Conversation not found' });
        }

        // Save user message
        const userMessage = new Message({
            conversationId: conversation._id,
            role: 'user',
            content: content.trim(),
        });
        await userMessage.save();

        // Get conversation history for context
        const history = await Message.find({ conversationId: conversation._id })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        // Call RAG pipeline
        const response = await ragService.query(content, {
            userId: request.session.userId,
            conversationHistory: history.reverse(),
        });

        // Save assistant message
        const assistantMessage = new Message({
            conversationId: conversation._id,
            role: 'assistant',
            content: response.answer,
            citations: response.citations,
            confidence: response.confidence,
            isLowConfidence: response.isLowConfidence,
            latency: response.latency,
        });
        await assistantMessage.save();

        // Update conversation
        conversation.messageCount += 2;
        conversation.lastMessageAt = new Date();

        // Auto-generate title from first message
        if (conversation.autoTitle && conversation.messageCount === 2) {
            conversation.title = await geminiService.generateConversationTitle(content);
            conversation.autoTitle = false;
        }

        await conversation.save();

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
