/**
 * Role-Based Access Control Middleware
 * 
 * Provides middleware functions for checking user roles and permissions.
 * Permissions are defined in /config/permissions.json for easy management.
 */

import { createRequire } from 'module';
import User from '../models/User.js';

// Load permissions from JSON config
const require = createRequire(import.meta.url);
// Initial load
let permissionsConfig = require('../config/permissions.json');
let ROLE_PERMISSIONS = {};

function loadPermissions() {
    delete require.cache[require.resolve('../config/permissions.json')];
    permissionsConfig = require('../config/permissions.json');
    ROLE_PERMISSIONS = {};
    for (const [role, config] of Object.entries(permissionsConfig.roles)) {
        ROLE_PERMISSIONS[role] = config.permissions;
    }
    return permissionsConfig;
}

// Initialize
loadPermissions();

/**
 * Middleware to require specific roles
 * Usage: requireRole('admin', 'visitor')
 */
export function requireRole(...allowedRoles) {
    return async (request, reply) => {
        const userId = request.session?.userId;

        if (!userId) {
            return reply.status(401).send({ error: 'Not authenticated' });
        }

        const user = await User.findById(userId).select('role');

        if (!user) {
            return reply.status(401).send({ error: 'User not found' });
        }

        if (!allowedRoles.includes(user.role)) {
            return reply.status(403).send({
                error: 'Access denied. Required role: ' + allowedRoles.join(' or ')
            });
        }

        // Attach role to request for downstream use
        request.userRole = user.role;
    };
}

/**
 * Middleware to require specific permission
 * Usage: requirePermission('documents:delete')
 */
export function requirePermission(permission) {
    return async (request, reply) => {
        // Reload permissions to ensure freshness
        loadPermissions();

        const userId = request.session?.userId;

        if (!userId) {
            return reply.status(401).send({ error: 'Not authenticated' });
        }

        const user = await User.findById(userId).select('role');

        if (!user) {
            return reply.status(401).send({ error: 'User not found' });
        }

        const userPermissions = ROLE_PERMISSIONS[user.role] || [];

        if (!userPermissions.includes(permission)) {
            return reply.status(403).send({
                error: `Access denied. Missing permission: ${permission}`
            });
        }

        request.userRole = user.role;
        request.userPermissions = userPermissions;
    };
}

/**
 * Check if a role has a specific permission (utility function)
 */
export function hasPermission(role, permission) {
    // Reload permissions to ensure freshness
    loadPermissions();
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission);
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role) {
    // Reload permissions to ensure freshness
    loadPermissions();
    return ROLE_PERMISSIONS[role] || [];
}

/**
 * Get the full permissions config (for API endpoint)
 */
export function getPermissionsConfig() {
    // Reload permissions to ensure freshness
    return loadPermissions();
}

export default {
    requireRole,
    requirePermission,
    hasPermission,
    getPermissions,
    getPermissionsConfig,
    ROLE_PERMISSIONS,
};
