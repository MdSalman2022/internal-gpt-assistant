import { Organization, User, Subscription, Plan } from '../models/index.js';
import { auditService } from '../services/index.js';
import { stripeService } from '../services/stripeService.js';
import crypto from 'crypto';

export default async function organizationsRoutes(fastify) {
    // All routes require authentication
    fastify.addHook('preHandler', async (request, reply) => {
        if (!request.session?.userId) {
            return reply.status(401).send({ error: 'Authentication required' });
        }
    });

    /**
     * POST / - Create a new organization
     */
    fastify.post('/', async (request, reply) => {
        const { name, slug } = request.body;
        const user = await User.findById(request.session.userId);

        // Check if user already belongs to an organization
        if (user.organizationId) {
            return reply.status(400).send({ error: 'You already belong to an organization' });
        }

        // Check slug availability
        const existingOrg = await Organization.findOne({ slug: slug.toLowerCase() });
        if (existingOrg) {
            return reply.status(400).send({ error: 'This organization URL is already taken' });
        }

        // Create organization
        const organization = new Organization({
            name,
            slug: slug.toLowerCase(),
            email: user.email,
            plan: 'trial',
            planStatus: 'trialing',
            createdBy: user._id,
        });

        await organization.save();

        // Update user as organization owner
        user.organizationId = organization._id;
        user.orgRole = 'owner';
        await user.save();

        // Update organization usage count
        organization.usage.currentUsers = 1;
        await organization.save();

        // Seed default plans if not exist
        await Plan.seedDefaultPlans();

        auditService.log(request, 'ORGANIZATION_CREATED', { type: 'organization', id: organization._id.toString() }, {
            name: organization.name,
        });

        return { success: true, organization };
    });

    /**
     * GET / - Get current user's organization
     */
    fastify.get('/', async (request, reply) => {
        const user = await User.findById(request.session.userId);

        if (!user?.organizationId) {
            return { organization: null };
        }

        const organization = await Organization.findById(user.organizationId);
        return { organization };
    });

    /**
     * PATCH /:id - Update organization
     */
    fastify.patch('/:id', async (request, reply) => {
        const { id } = request.params;
        const { name, logo, settings } = request.body;
        const user = await User.findById(request.session.userId);

        // Must be part of this organization as owner/admin
        if (user.organizationId?.toString() !== id) {
            return reply.status(403).send({ error: 'Access denied' });
        }
        if (!['owner', 'admin'].includes(user.orgRole)) {
            return reply.status(403).send({ error: 'Only owners and admins can update organization' });
        }

        const organization = await Organization.findById(id);
        if (!organization) {
            return reply.status(404).send({ error: 'Organization not found' });
        }

        if (name) organization.name = name;
        if (logo) organization.logo = logo;
        if (settings) {
            if (settings.allowedDomains) organization.settings.allowedDomains = settings.allowedDomains;
            if (typeof settings.requireApproval === 'boolean') {
                organization.settings.requireApproval = settings.requireApproval;
            }
        }

        await organization.save();

        auditService.log(request, 'ORGANIZATION_UPDATED', { type: 'organization', id: organization._id.toString() }, {
            updatedFields: Object.keys(request.body),
        });

        return { success: true, organization };
    });

    /**
     * GET /members - List organization members
     */
    fastify.get('/members', async (request, reply) => {
        const user = await User.findById(request.session.userId);

        if (!user?.organizationId) {
            return { members: [] };
        }

        const members = await User.find({ organizationId: user.organizationId })
            .select('name email avatar role orgRole lastLogin createdAt invitedBy invitedAt')
            .sort({ orgRole: 1, createdAt: 1 });

        return { members };
    });

    /**
     * POST /members/invite - Invite a team member
     */
    fastify.post('/members/invite', async (request, reply) => {
        const { email, orgRole = 'member' } = request.body;
        const user = await User.findById(request.session.userId);

        if (!['owner', 'admin'].includes(user.orgRole)) {
            return reply.status(403).send({ error: 'Only owners and admins can invite members' });
        }

        const organization = await Organization.findById(user.organizationId);
        if (!organization) {
            return reply.status(404).send({ error: 'Organization not found' });
        }

        // Check member limit
        if (!organization.canAddUser()) {
            return reply.status(403).send({
                error: `Your plan allows maximum ${organization.limits.maxUsers} users. Please upgrade.`
            });
        }

        // Check if email already exists as user
        let invitedUser = await User.findOne({ email: email.toLowerCase() });

        if (invitedUser) {
            if (invitedUser.organizationId) {
                return reply.status(400).send({ error: 'This user already belongs to an organization' });
            }
            // Existing user - add to organization
            invitedUser.organizationId = organization._id;
            invitedUser.orgRole = orgRole;
            invitedUser.invitedBy = user._id;
            invitedUser.invitedAt = new Date();
            await invitedUser.save();

            organization.usage.currentUsers += 1;
            await organization.save();

            return { success: true, message: 'User added to organization', user: invitedUser };
        }

        // Create invitation token for new user
        const invitationToken = crypto.randomBytes(32).toString('hex');
        const invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        // Create placeholder user with invitation
        invitedUser = new User({
            email: email.toLowerCase(),
            name: email.split('@')[0], // Placeholder name
            organizationId: organization._id,
            orgRole,
            invitedBy: user._id,
            invitedAt: new Date(),
            invitationToken,
            invitationExpires,
            isActive: false, // Inactive until they complete signup
        });
        await invitedUser.save();

        organization.usage.currentUsers += 1;
        await organization.save();

        // TODO: Send invitation email with token
        // For now, return the invitation link
        const invitationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite/${invitationToken}`;

        auditService.log(request, 'MEMBER_INVITED', { type: 'organization', id: organization._id.toString() }, {
            invitedEmail: email,
            role: orgRole,
        });

        return {
            success: true,
            message: 'Invitation created',
            invitationLink, // In production, this would be sent via email
        };
    });

    /**
     * DELETE /members/:id - Remove a team member
     */
    fastify.delete('/members/:id', async (request, reply) => {
        const { id } = request.params;
        const user = await User.findById(request.session.userId);

        if (!['owner', 'admin'].includes(user.orgRole)) {
            return reply.status(403).send({ error: 'Only owners and admins can remove members' });
        }

        if (id === request.session.userId) {
            return reply.status(400).send({ error: 'You cannot remove yourself' });
        }

        const memberToRemove = await User.findById(id);
        if (!memberToRemove || memberToRemove.organizationId?.toString() !== user.organizationId?.toString()) {
            return reply.status(404).send({ error: 'Member not found in your organization' });
        }

        if (memberToRemove.orgRole === 'owner') {
            return reply.status(400).send({ error: 'Cannot remove the organization owner' });
        }

        // Remove from organization
        memberToRemove.organizationId = null;
        memberToRemove.orgRole = 'member';
        await memberToRemove.save();

        // Update count
        const organization = await Organization.findById(user.organizationId);
        organization.usage.currentUsers = Math.max(0, organization.usage.currentUsers - 1);
        await organization.save();

        auditService.log(request, 'MEMBER_REMOVED', { type: 'organization', id: organization._id.toString() }, {
            removedUserId: id,
            removedUserEmail: memberToRemove.email,
        });

        return { success: true, message: 'Member removed' };
    });

    /**
     * PATCH /members/:id/role - Change member role
     */
    fastify.patch('/members/:id/role', async (request, reply) => {
        const { id } = request.params;
        const { orgRole } = request.body;
        const user = await User.findById(request.session.userId);

        // Only owner can change roles
        if (user.orgRole !== 'owner') {
            return reply.status(403).send({ error: 'Only the organization owner can change member roles' });
        }

        if (id === request.session.userId) {
            return reply.status(400).send({ error: 'You cannot change your own role' });
        }

        const member = await User.findById(id);
        if (!member || member.organizationId?.toString() !== user.organizationId?.toString()) {
            return reply.status(404).send({ error: 'Member not found' });
        }

        member.orgRole = orgRole;
        await member.save();

        auditService.log(request, 'MEMBER_ROLE_CHANGED', { type: 'organization', id: user.organizationId.toString() }, {
            memberId: id,
            newRole: orgRole,
        });

        return { success: true, member };
    });

    /**
     * GET /check-slug/:slug - Check if slug is available
     */
    fastify.get('/check-slug/:slug', async (request, reply) => {
        const { slug } = request.params;
        const existing = await Organization.findOne({ slug: slug.toLowerCase() });
        return { available: !existing };
    });
}
