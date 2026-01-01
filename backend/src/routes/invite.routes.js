
import { User } from '../models/index.js';
import { auditService } from '../services/index.js';

export default async function inviteRoutes(fastify) {
    // Public routes - No auth hook required

    /**
     * GET /verify/:token - Verify invitation token
     */
    fastify.get('/verify/:token', async (request, reply) => {
        const { token } = request.params;

        const user = await User.findOne({
            invitationToken: token,
            invitationExpires: { $gt: new Date() }
        }).populate('organizationId', 'name');

        if (!user) {
            return reply.status(404).send({ error: 'Invalid or expired invitation' });
        }

        const inviter = await User.findById(user.invitedBy).select('name');

        return {
            success: true,
            organizationName: user.organizationId.name,
            inviterName: inviter?.name || 'An admin',
            email: user.email
        };
    });

    /**
     * POST /accept/:token - Accept invitation
     */
    fastify.post('/accept/:token', async (request, reply) => {
        const { token } = request.params;
        const { password } = request.body;

        if (!password || password.length < 6) {
            return reply.status(400).send({ error: 'Password must be at least 6 characters' });
        }

        const user = await User.findOne({
            invitationToken: token,
            invitationExpires: { $gt: new Date() }
        });

        if (!user) {
            return reply.status(404).send({ error: 'Invalid or expired invitation' });
        }

        user.password = password; // Will be hashed by pre-save hook
        user.isActive = true;
        user.invitationToken = undefined;
        user.invitationExpires = undefined;

        await user.save();

        // Log audit
        auditService.log(request, 'MEMBER_JOINED', { type: 'organization', id: user.organizationId.toString() }, {
            email: user.email,
        });

        return { success: true, message: 'Invitation accepted' };
    });
}
