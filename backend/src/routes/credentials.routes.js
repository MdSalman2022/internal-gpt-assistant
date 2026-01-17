// API keys management

import { APICredentials } from '../models/index.js';
import { User, Organization } from '../models/index.js';
import { aiService } from '../services/index.js';

export default async function credentialsRoutes(fastify) {
    // Require authentication for all routes
    fastify.addHook('preHandler', async (request, reply) => {
        if (!request.session.userId) {
            return reply.status(401).send({ error: 'Not authenticated' });
        }
    });

    // List credentials
    // List all credentials for the current user's scope
    fastify.get('/', async (request, reply) => {
        const user = await User.findById(request.session.userId);

        let filter = {};

        // 1. Organization Admin/Owner: See org credentials only
        if (user.organizationId && ['admin', 'owner'].includes(user.orgRole)) {
            filter = { organizationId: user.organizationId };
        }
        // 2. Superadmin: See all credentials (org + platform)
        else if (user.role === 'superadmin') {
            // No filter = see all (including inactive)
        }
        // 3. Regular users: Access denied
        else {
            return reply.status(403).send({ error: 'Access denied. Admin rights required.' });
        }

        const credentials = await APICredentials.find(filter)
            .sort({ provider: 1, createdAt: -1 })
            .select('-encryptedApiKey');  // Don't return encrypted key

        return {
            success: true,
            credentials: credentials.map(c => c.toSafeJSON())
        };
    });

    // Get single credential
    // Get single credential by ID
    fastify.get('/:id', async (request, reply) => {
        const { id } = request.params;
        const user = await User.findById(request.session.userId);

        const credential = await APICredentials.findById(id).select('-encryptedApiKey');

        if (!credential) {
            return reply.status(404).send({ error: 'Credential not found' });
        }

        // Permission check
        const isOrgAdmin = user.organizationId && 
                          credential.organizationId?.toString() === user.organizationId.toString() &&
                          ['admin', 'owner'].includes(user.orgRole);
        const isSuperadmin = user.role === 'superadmin';

        if (!isOrgAdmin && !isSuperadmin) {
            return reply.status(403).send({ error: 'Access denied' });
        }

        return {
            success: true,
            credential: credential.toSafeJSON()
        };
    });

    // Create/update credential
    // Create or update a credential
    fastify.post('/', async (request, reply) => {
        const { provider, apiKey, label, isPlatformKey } = request.body;
        const user = await User.findById(request.session.userId);

        // Validate required fields
        if (!provider || !apiKey) {
            return reply.status(400).send({ 
                error: 'Missing required fields: provider, apiKey' 
            });
        }

        // Validate provider
        const validProviders = ['gemini', 'openai', 'anthropic', 'groq', 'tavily'];
        if (!validProviders.includes(provider)) {
            return reply.status(400).send({ 
                error: `Invalid provider. Must be one of: ${validProviders.join(', ')}` 
            });
        }

        let organizationId = null;

        // Determine scope: Platform vs Organization
        if (isPlatformKey) {
            // Only superadmin can create platform keys
            if (user.role !== 'superadmin') {
                return reply.status(403).send({ 
                    error: 'Only superadmins can create platform keys' 
                });
            }
            organizationId = null;
        } else {
            // Organization key
            if (!user.organizationId) {
                return reply.status(400).send({ 
                    error: 'User must belong to an organization to create org keys' 
                });
            }

            if (!['admin', 'owner'].includes(user.orgRole) && user.role !== 'superadmin') {
                return reply.status(403).send({ 
                    error: 'Only organization admins/owners can create org keys' 
                });
            }

            organizationId = user.organizationId;
        }

        // Create or update credential (deactivates old ones)
        const credential = await APICredentials.upsertCredential({
            organizationId,
            provider,
            apiKey,
            label: label || 'Default Key',
            createdBy: user._id
        });

        return {
            success: true,
            message: 'Credential saved successfully',
            credential: credential.toSafeJSON()
        };
    });

    // Update metadata
    // Update existing credential (e.g., label, rate limits)
    fastify.put('/:id', async (request, reply) => {
        const { id } = request.params;
        const { label, rateLimit } = request.body;
        const user = await User.findById(request.session.userId);

        const credential = await APICredentials.findById(id);

        if (!credential) {
            return reply.status(404).send({ error: 'Credential not found' });
        }

        // Permission check
        const isOrgAdmin = user.organizationId && 
                          credential.organizationId?.toString() === user.organizationId.toString() &&
                          ['admin', 'owner'].includes(user.orgRole);
        const isSuperadmin = user.role === 'superadmin';

        if (!isOrgAdmin && !isSuperadmin) {
            return reply.status(403).send({ error: 'Access denied' });
        }

        // Update fields
        if (label) credential.label = label;
        if (rateLimit) credential.rateLimit = rateLimit;
        
        // Handle activation with mutual exclusivity
        if (typeof request.body.isActive === 'boolean') {
            if (request.body.isActive === true) {
                // Deactivate all other credentials in the same scope (Global Exclusivity)
                await APICredentials.updateMany(
                    {
                        organizationId: credential.organizationId,
                        _id: { $ne: credential._id }
                    },
                    { $set: { isActive: false } }
                );
            }
            credential.isActive = request.body.isActive;
        }
        
        credential.updatedBy = user._id;

        await credential.save();

        return {
            success: true,
            message: 'Credential updated successfully',
            credential: credential.toSafeJSON()
        };
    });

    // Delete credential
    // Deactivate a credential (soft delete)
    fastify.delete('/:id', async (request, reply) => {
        const { id } = request.params;
        const user = await User.findById(request.session.userId);

        const credential = await APICredentials.findById(id);

        if (!credential) {
            return reply.status(404).send({ error: 'Credential not found' });
        }

        // Permission check
        const isOrgAdmin = user.organizationId && 
                          credential.organizationId?.toString() === user.organizationId.toString() &&
                          ['admin', 'owner'].includes(user.orgRole);
        const isSuperadmin = user.role === 'superadmin';

        if (!isOrgAdmin && !isSuperadmin) {
            return reply.status(403).send({ error: 'Access denied' });
        }

        // Hard delete
        await APICredentials.findByIdAndDelete(id);

        return {
            success: true,
            message: 'Credential deleted permanently'
        };
    });

    // Rotate key
    // Rotate API key (security feature)
    fastify.post('/:id/rotate', async (request, reply) => {
        const { id } = request.params;
        const { newApiKey } = request.body;
        const user = await User.findById(request.session.userId);

        if (!newApiKey) {
            return reply.status(400).send({ error: 'Missing newApiKey' });
        }

        const credential = await APICredentials.findById(id).select('+encryptedApiKey');

        if (!credential) {
            return reply.status(404).send({ error: 'Credential not found' });
        }

        // Permission check
        const isOrgAdmin = user.organizationId && 
                          credential.organizationId?.toString() === user.organizationId.toString() &&
                          ['admin', 'owner'].includes(user.orgRole);
        const isSuperadmin = user.role === 'superadmin';

        if (!isOrgAdmin && !isSuperadmin) {
            return reply.status(403).send({ error: 'Access denied' });
        }

        // Rotate key
        await credential.rotateKey(newApiKey, user._id);

        return {
            success: true,
            message: 'API key rotated successfully',
            credential: credential.toSafeJSON()
        };
    });

    // Get available providers
    // Get available providers for current user's organization
    fastify.get('/available/providers', async (request, reply) => {
        const user = await User.findById(request.session.userId);
        const organizationId = user.organizationId || null;

        const providers = await aiService.getAvailableProvidersForOrg(organizationId);

        return {
            success: true,
            providers
        };
    });
}
