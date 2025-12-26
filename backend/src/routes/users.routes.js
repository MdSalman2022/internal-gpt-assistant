import { User } from '../models/index.js';
import { requirePermission } from '../middleware/rbac.middleware.js';

export default async function usersRoutes(fastify) {
    // Require 'users:manage' permission for all routes (Admin, Visitor, Employee have this)
    fastify.addHook('preHandler', requirePermission('users:manage'));

    // GET / - List all users
    fastify.get('/', async (request, reply) => {
        const users = await User.find()
            .select('-password -resetPasswordToken -resetPasswordExpires')
            .sort({ createdAt: -1 })
            .lean();

        return { users };
    });

    // PATCH /:id - Update user (Role, Name)
    fastify.patch('/:id', async (request, reply) => {
        const { id } = request.params;
        const { role, name } = request.body;

        // SECURITY: Only actual Admins can modify users
        if (request.userRole !== 'admin') {
            return reply.status(403).send({
                error: 'You are not an admin. Only administrators can modify users.'
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return reply.status(404).send({ error: 'User not found' });
        }

        // Prevent modifying yourself to avoid locking yourself out
        if (user._id.toString() === request.session.userId) {
            // Allow name change, but maybe restrict role change?
            // For safety, let's block role change for self via this generic API
            if (role && role !== user.role) {
                return reply.status(400).send({ error: 'You cannot change your own role.' });
            }
        }

        if (role) user.role = role;
        if (name) user.name = name;

        await user.save();

        return {
            success: true,
            user: { _id: user._id, name: user.name, email: user.email, role: user.role }
        };
    });

    // DELETE /:id - Delete user
    fastify.delete('/:id', async (request, reply) => {
        const { id } = request.params;

        // SECURITY: Only actual Admins can delete users
        if (request.userRole !== 'admin') {
            return reply.status(403).send({
                error: 'You are not an admin. Only administrators can delete users.'
            });
        }

        if (id === request.session.userId) {
            return reply.status(400).send({ error: 'You cannot delete your own account.' });
        }

        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return reply.status(404).send({ error: 'User not found' });
        }

        return { success: true, message: 'User deleted successfully' };
    });
}
