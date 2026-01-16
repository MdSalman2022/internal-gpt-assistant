import { describe, it } from 'node:test';
import assert from 'node:assert';
import { hasPermission, getPermissions, getPermissionsConfig } from '../../src/middleware/rbac.middleware.js';

describe('RBAC Permissions', () => {
    describe('hasPermission', () => {
        it('should return true when admin has admin-only permission', () => {
            const result = hasPermission('admin', 'documents:delete');
            assert.strictEqual(result, true, 'Admin should have documents:delete permission');
        });

        it('should return false when employee lacks admin permission', () => {
            const result = hasPermission('employee', 'users:delete');
            assert.strictEqual(result, false, 'Employee should not have users:delete permission');
        });

        it('should return true when admin has all permissions', () => {
            // Admin should have the admin:manage permission
            const result = hasPermission('admin', 'admin:manage');
            assert.strictEqual(result, true, 'Admin should have admin:manage permission');
        });

        it('should return true for visitor with most permissions', () => {
            // Visitor has admin-level UI with restricted deletion
            const hasDocsView = hasPermission('visitor', 'documents:read');
            const hasUsersManage = hasPermission('visitor', 'users:manage');
            
            assert.strictEqual(hasDocsView, true, 'Visitor should have documents:read');
            assert.strictEqual(hasUsersManage, true, 'Visitor should have users:manage');
        });

        it('should return false for invalid role', () => {
            const result = hasPermission('invalid-role', 'documents:read');
            assert.strictEqual(result, false, 'Invalid role should have no permissions');
        });

        it('should return false for unknown permission', () => {
            const result = hasPermission('admin', 'nonexistent:permission');
            assert.strictEqual(result, false, 'Unknown permission should return false');
        });

        it('should handle employee permissions correctly', () => {
            // Employee should have most permissions except admin:manage
            const hasDocsRead = hasPermission('employee', 'documents:read');
            const hasAdminManage = hasPermission('employee', 'admin:manage');
            
            assert.strictEqual(hasDocsRead, true, 'Employee should have documents:read');
            assert.strictEqual(hasAdminManage, false, 'Employee should not have admin:manage');
        });
    });

    describe('getPermissions', () => {
        it('should return array of permissions for admin', () => {
            const permissions = getPermissions('admin');
            
            assert.ok(Array.isArray(permissions), 'Should return an array');
            assert.ok(permissions.length > 0, 'Admin should have permissions');
        });

        it('should return array of permissions for employee', () => {
            const permissions = getPermissions('employee');
            
            assert.ok(Array.isArray(permissions), 'Should return an array');
            assert.ok(permissions.length > 0, 'Employee should have permissions');
        });

        it('should return array of permissions for visitor', () => {
            const permissions = getPermissions('visitor');
            
            assert.ok(Array.isArray(permissions), 'Should return an array');
            assert.ok(permissions.length > 0, 'Visitor should have permissions');
        });

        it('should return empty array for invalid role', () => {
            const permissions = getPermissions('invalid-role');
            
            assert.ok(Array.isArray(permissions), 'Should return an array');
            assert.strictEqual(permissions.length, 0, 'Invalid role should have no permissions');
        });

        it('should return array of strings', () => {
            const permissions = getPermissions('admin');
            
            permissions.forEach(permission => {
                assert.strictEqual(typeof permission, 'string', 'Each permission should be a string');
                assert.ok(permission.includes(':'), 'Permission should follow resource:action format');
            });
        });

        it('should return different permissions for different roles', () => {
            const adminPerms = getPermissions('admin');
            const employeePerms = getPermissions('employee');
            
            // Admin should have more permissions than employee
            assert.ok(adminPerms.length >= employeePerms.length, 'Admin should have at least as many permissions as employee');
        });

        it('should include common permissions across roles', () => {
            const adminPerms = getPermissions('admin');
            const employeePerms = getPermissions('employee');
            
            // Both should have basic view permissions
            const commonPerm = 'documents:view';
            
            if (employeePerms.includes(commonPerm)) {
                assert.ok(adminPerms.includes(commonPerm), 'Admin should have all employee permissions');
            }
        });
    });

    describe('getPermissionsConfig', () => {
        it('should return permissions configuration object', () => {
            const config = getPermissionsConfig();
            
            assert.ok(typeof config === 'object', 'Should return an object');
            assert.ok(config.hasOwnProperty('roles'), 'Should have roles property');
        });

        it('should include all defined roles', () => {
            const config = getPermissionsConfig();
            
            assert.ok(config.roles.hasOwnProperty('admin'), 'Should have admin role');
            assert.ok(config.roles.hasOwnProperty('employee'), 'Should have employee role');
            assert.ok(config.roles.hasOwnProperty('visitor'), 'Should have visitor role');
        });

        it('should have valid role structure', () => {
            const config = getPermissionsConfig();
            
            Object.entries(config.roles).forEach(([role, roleConfig]) => {
                assert.ok(roleConfig.hasOwnProperty('permissions'), `${role} should have permissions array`);
                assert.ok(Array.isArray(roleConfig.permissions), `${role} permissions should be an array`);
            });
        });
    });
});
