// Multi-tenant access control middleware

import { User, Organization } from '../models/index.js';

// Require auth and attach user
export function requireAuth() {
    return async (request, reply) => {
        const userId = request.session?.userId;

        if (!userId) {
            return reply.status(401).send({ error: 'Not authenticated' });
        }

        const user = await User.findById(userId)
            .select('name email role orgRole platformRole organizationId isActive')
            .lean();

        if (!user) {
            await request.session.destroy();
            return reply.status(401).send({ error: 'User not found' });
        }

        if (!user.isActive) {
            await request.session.destroy();
            return reply.status(403).send({ error: 'Account is deactivated' });
        }

        // Attach user to request
        request.user = user;
        request.userId = user._id;
    };
}

// Require organization and attach context
export function requireOrganization() {
    return async (request, reply) => {
        // First ensure user is authenticated
        if (!request.user) {
            const userId = request.session?.userId;
            if (!userId) {
                return reply.status(401).send({ error: 'Not authenticated' });
            }

            const user = await User.findById(userId)
                .select('name email role orgRole platformRole organizationId isActive')
                .lean();

            if (!user || !user.isActive) {
                return reply.status(401).send({ error: 'User not found or inactive' });
            }

            request.user = user;
            request.userId = user._id;
        }

        // Check if user has an organization
        if (!request.user.organizationId) {
            return reply.status(403).send({
                error: 'No organization context',
                code: 'NO_ORGANIZATION',
                message: 'You must belong to an organization to access this resource'
            });
        }

        // Fetch and validate organization
        const organization = await Organization.findById(request.user.organizationId).lean();

        if (!organization) {
            return reply.status(403).send({
                error: 'Organization not found',
                code: 'ORGANIZATION_NOT_FOUND'
            });
        }

        // Attach organization context to request
        request.organization = organization;
        request.organizationId = organization._id;
        request.orgSlug = organization.slug;
    };
}

// Require active subscription
export function requireActiveSubscription() {
    return async (request, reply) => {
        // Ensure organization is loaded
        if (!request.organization) {
            return reply.status(500).send({ error: 'Organization context not loaded' });
        }

        const org = request.organization;

        // Check subscription status
        const isActive =
            org.planStatus === 'active' ||
            (org.planStatus === 'trialing' && new Date(org.trialEndsAt) > new Date());

        if (!isActive) {
            return reply.status(402).send({
                error: 'Subscription required',
                code: 'SUBSCRIPTION_REQUIRED',
                message: org.planStatus === 'trialing'
                    ? 'Your trial has expired. Please upgrade to continue.'
                    : 'Your subscription is not active. Please update your billing.',
                upgradeUrl: '/settings/billing',
                planStatus: org.planStatus,
                trialEndsAt: org.trialEndsAt
            });
        }

        // Attach subscription status for downstream use
        request.subscriptionActive = true;
        request.plan = org.plan;
        request.planStatus = org.planStatus;
    };
}

// Require specific organization role
export function requireOrgRole(...allowedRoles) {
    return async (request, reply) => {
        if (!request.user) {
            return reply.status(401).send({ error: 'Not authenticated' });
        }

        const userOrgRole = request.user.orgRole || 'member';

        // Owner has access to everything
        if (userOrgRole === 'owner') {
            request.isOrgOwner = true;
            return;
        }

        // Admin has access to admin and member roles
        if (userOrgRole === 'admin' && (allowedRoles.includes('admin') || allowedRoles.includes('member'))) {
            request.isOrgAdmin = true;
            return;
        }

        // Check if user has one of the allowed roles
        if (!allowedRoles.includes(userOrgRole)) {
            return reply.status(403).send({
                error: 'Insufficient permissions',
                code: 'INSUFFICIENT_ORG_ROLE',
                required: allowedRoles,
                current: userOrgRole
            });
        }
    };
}

// Require platform superadmin role
export function requireSuperadmin() {
    return async (request, reply) => {
        const userId = request.session?.userId;

        if (!userId) {
            return reply.status(401).send({ error: 'Not authenticated' });
        }

        const user = await User.findById(userId).select('platformRole isActive').lean();

        if (!user || !user.isActive) {
            return reply.status(401).send({ error: 'User not found or inactive' });
        }

        if (user.platformRole !== 'superadmin') {
            return reply.status(403).send({
                error: 'Superadmin access required',
                code: 'SUPERADMIN_REQUIRED'
            });
        }

        request.user = user;
        request.userId = user._id;
        request.isSuperadmin = true;
    };
}

// Check organization resource limits
export function checkOrgLimit(limitType) {
    return async (request, reply) => {
        if (!request.organization) {
            return reply.status(500).send({ error: 'Organization context not loaded' });
        }

        const org = request.organization;
        const limits = org.limits || {};
        const usage = org.usage || {};

        let limitReached = false;
        let message = '';

        switch (limitType) {
            case 'users':
                if (limits.maxUsers !== -1 && usage.currentUsers >= limits.maxUsers) {
                    limitReached = true;
                    message = `User limit reached (${usage.currentUsers}/${limits.maxUsers}). Upgrade to add more members.`;
                }
                break;

            case 'documents':
                if (limits.maxDocuments !== -1 && usage.currentDocuments >= limits.maxDocuments) {
                    limitReached = true;
                    message = `Document limit reached (${usage.currentDocuments}/${limits.maxDocuments}). Upgrade for more storage.`;
                }
                break;

            case 'tokens':
                if (limits.maxTokensPerMonth !== -1 && usage.monthlyTokens >= limits.maxTokensPerMonth) {
                    limitReached = true;
                    message = `Monthly token limit reached. Resets next billing cycle or upgrade for more.`;
                }
                break;
        }

        if (limitReached) {
            return reply.status(429).send({
                error: 'Limit reached',
                code: 'LIMIT_REACHED',
                limitType,
                message,
                limits,
                usage,
                upgradeUrl: '/settings/billing'
            });
        }
    };
}

// Composite middleware for protected routes
export function requireTenant() {
    return async (request, reply) => {
        // Step 1: Authenticate
        const userId = request.session?.userId;
        if (!userId) {
            return reply.status(401).send({ error: 'Not authenticated' });
        }

        // Step 2: Get user with organization
        const user = await User.findById(userId)
            .select('name email role orgRole platformRole organizationId isActive')
            .lean();

        if (!user || !user.isActive) {
            await request.session?.destroy();
            return reply.status(401).send({ error: 'User not found or inactive' });
        }

        request.user = user;
        request.userId = user._id;

        // Step 3: Check organization
        if (!user.organizationId) {
            return reply.status(403).send({
                error: 'No organization context',
                code: 'NO_ORGANIZATION'
            });
        }

        const organization = await Organization.findById(user.organizationId).lean();
        if (!organization) {
            return reply.status(403).send({
                error: 'Organization not found',
                code: 'ORGANIZATION_NOT_FOUND'
            });
        }

        request.organization = organization;
        request.organizationId = organization._id;

        // Step 4: Check subscription
        const isActive =
            organization.planStatus === 'active' ||
            (organization.planStatus === 'trialing' && new Date(organization.trialEndsAt) > new Date());

        if (!isActive) {
            return reply.status(402).send({
                error: 'Subscription required',
                code: 'SUBSCRIPTION_REQUIRED',
                upgradeUrl: '/settings/billing'
            });
        }

        request.subscriptionActive = true;
        request.plan = organization.plan;
    };
}

export default {
    requireAuth,
    requireOrganization,
    requireActiveSubscription,
    requireOrgRole,
    requireSuperadmin,
    checkOrgLimit,
    requireTenant
};
