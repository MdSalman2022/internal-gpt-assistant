import { Department, User } from '../models/index.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import { auditService } from '../services/index.js';

export default async function departmentsRoutes(fastify) {
    // ==================== PUBLIC ROUTES ====================

    // GET / - List all departments with teams (available to all authenticated users)
    fastify.get('/', async (request, reply) => {
        if (!request.session.userId) {
            return reply.status(401).send({ error: 'Not authenticated' });
        }

        const departments = await Department.find({ isActive: true })
            .populate('createdBy', 'name email')
            .sort({ name: 1 })
            .lean();

        return { departments };
    });

    // ==================== ADMIN-ONLY ROUTES ====================

    // POST / - Create department (admin only)
    fastify.post('/', { preHandler: requirePermission('admin:manage') }, async (request, reply) => {
        const { name, description } = request.body;

        if (!name) {
            return reply.status(400).send({ error: 'Department name is required' });
        }

        // Check if department already exists
        const existing = await Department.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (existing) {
            return reply.status(409).send({ error: 'Department already exists' });
        }

        const department = new Department({
            name: name.trim(),
            description: description || '',
            createdBy: request.session.userId,
        });

        await department.save();

        // Audit log
        auditService.log(request, 'DEPARTMENT_CREATE', { type: 'department', id: department._id.toString() }, {
            name: department.name
        });

        return { success: true, department };
    });

    // PATCH /:id - Update department (admin only)
    fastify.patch('/:id', { preHandler: requirePermission('admin:manage') }, async (request, reply) => {
        const { id } = request.params;
        const { name, description, isActive } = request.body;

        const department = await Department.findById(id);
        if (!department) {
            return reply.status(404).send({ error: 'Department not found' });
        }

        if (name) department.name = name.trim();
        if (description !== undefined) department.description = description;
        if (isActive !== undefined) department.isActive = isActive;

        await department.save();

        return { success: true, department };
    });

    // DELETE /:id - Delete department (admin only)
    fastify.delete('/:id', { preHandler: requirePermission('admin:manage') }, async (request, reply) => {
        const { id } = request.params;

        const department = await Department.findByIdAndDelete(id);
        if (!department) {
            return reply.status(404).send({ error: 'Department not found' });
        }

        // Also remove department from all users
        await User.updateMany(
            { $or: [{ departments: department.name }, { pendingDepartments: department.name }] },
            { $pull: { departments: department.name, pendingDepartments: department.name } }
        );

        auditService.log(request, 'DEPARTMENT_DELETE', { type: 'department', id: id }, {
            name: department.name
        });

        return { success: true, message: 'Department deleted' };
    });

    // ==================== TEAM MANAGEMENT ====================

    // POST /:id/teams - Add team to department (admin only)
    fastify.post('/:id/teams', { preHandler: requirePermission('admin:manage') }, async (request, reply) => {
        const { id } = request.params;
        const { name, description } = request.body;

        if (!name) {
            return reply.status(400).send({ error: 'Team name is required' });
        }

        const department = await Department.findById(id);
        if (!department) {
            return reply.status(404).send({ error: 'Department not found' });
        }

        // Check if team already exists in this department
        const teamExists = department.teams.some(t => t.name.toLowerCase() === name.toLowerCase());
        if (teamExists) {
            return reply.status(409).send({ error: 'Team already exists in this department' });
        }

        department.teams.push({ name: name.trim(), description: description || '' });
        await department.save();

        return { success: true, department };
    });

    // DELETE /:id/teams/:teamId - Remove team from department (admin only)
    fastify.delete('/:id/teams/:teamId', { preHandler: requirePermission('admin:manage') }, async (request, reply) => {
        const { id, teamId } = request.params;

        const department = await Department.findById(id);
        if (!department) {
            return reply.status(404).send({ error: 'Department not found' });
        }

        const teamIndex = department.teams.findIndex(t => t._id.toString() === teamId);
        if (teamIndex === -1) {
            return reply.status(404).send({ error: 'Team not found' });
        }

        const teamName = department.teams[teamIndex].name;
        const fullTeamName = `${department.name}:${teamName}`;
        department.teams.splice(teamIndex, 1);
        await department.save();

        // Remove team from all users
        await User.updateMany(
            { $or: [{ teams: fullTeamName }, { pendingTeams: fullTeamName }] },
            { $pull: { teams: fullTeamName, pendingTeams: fullTeamName } }
        );

        return { success: true, department };
    });

    // ==================== ACCESS REQUEST MANAGEMENT ====================

    // GET /requests - Get all pending access requests (admin only)
    fastify.get('/requests', { preHandler: requirePermission('admin:manage') }, async (request, reply) => {
        const usersWithPending = await User.find({
            $or: [
                { pendingDepartments: { $exists: true, $ne: [] } },
                { pendingTeams: { $exists: true, $ne: [] } }
            ]
        })
            .select('name email pendingDepartments pendingTeams createdAt')
            .lean();

        // Format as individual requests
        const requests = [];
        usersWithPending.forEach(user => {
            user.pendingDepartments?.forEach(dept => {
                requests.push({
                    id: `${user._id}-dept-${dept}`,
                    type: 'department',
                    userId: user._id,
                    userName: user.name,
                    userEmail: user.email,
                    resource: dept,
                });
            });
            user.pendingTeams?.forEach(team => {
                requests.push({
                    id: `${user._id}-team-${team}`,
                    type: 'team',
                    userId: user._id,
                    userName: user.name,
                    userEmail: user.email,
                    resource: team,
                });
            });
        });

        return { requests };
    });

    // POST /requests/approve - Approve access request (admin only)
    fastify.post('/requests/approve', { preHandler: requirePermission('admin:manage') }, async (request, reply) => {
        const { userId, type, resource } = request.body;

        if (!userId || !type || !resource) {
            return reply.status(400).send({ error: 'userId, type, and resource are required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return reply.status(404).send({ error: 'User not found' });
        }

        if (type === 'department') {
            if (!user.pendingDepartments.includes(resource)) {
                return reply.status(400).send({ error: 'No pending request for this department' });
            }
            user.pendingDepartments = user.pendingDepartments.filter(d => d !== resource);
            if (!user.departments.includes(resource)) {
                user.departments.push(resource);
            }
        } else if (type === 'team') {
            if (!user.pendingTeams.includes(resource)) {
                return reply.status(400).send({ error: 'No pending request for this team' });
            }
            user.pendingTeams = user.pendingTeams.filter(t => t !== resource);
            if (!user.teams.includes(resource)) {
                user.teams.push(resource);
            }
        } else {
            return reply.status(400).send({ error: 'Invalid type. Must be "department" or "team"' });
        }

        await user.save();

        auditService.log(request, 'ACCESS_APPROVE', { type: 'user', id: user._id.toString() }, {
            accessType: type,
            resource,
            userName: user.name
        });

        return { success: true, message: `Access to ${resource} approved for ${user.name}` };
    });

    // POST /requests/reject - Reject access request (admin only)
    fastify.post('/requests/reject', { preHandler: requirePermission('admin:manage') }, async (request, reply) => {
        const { userId, type, resource } = request.body;

        if (!userId || !type || !resource) {
            return reply.status(400).send({ error: 'userId, type, and resource are required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return reply.status(404).send({ error: 'User not found' });
        }

        if (type === 'department') {
            user.pendingDepartments = user.pendingDepartments.filter(d => d !== resource);
        } else if (type === 'team') {
            user.pendingTeams = user.pendingTeams.filter(t => t !== resource);
        } else {
            return reply.status(400).send({ error: 'Invalid type. Must be "department" or "team"' });
        }

        await user.save();

        auditService.log(request, 'ACCESS_REJECT', { type: 'user', id: user._id.toString() }, {
            accessType: type,
            resource,
            userName: user.name
        });

        return { success: true, message: `Access request rejected` };
    });

    // ==================== USER ACCESS REQUEST ====================

    // POST /request-access - User requests access to department/team
    fastify.post('/request-access', async (request, reply) => {
        if (!request.session.userId) {
            return reply.status(401).send({ error: 'Not authenticated' });
        }

        const { departmentName, teamName } = request.body;

        if (!departmentName && !teamName) {
            return reply.status(400).send({ error: 'departmentName or teamName is required' });
        }

        const user = await User.findById(request.session.userId);
        if (!user) {
            return reply.status(404).send({ error: 'User not found' });
        }

        if (departmentName) {
            // Verify department exists
            const dept = await Department.findOne({ name: departmentName, isActive: true });
            if (!dept) {
                return reply.status(404).send({ error: 'Department not found' });
            }

            // Check if already a member or pending
            if (user.departments.includes(departmentName)) {
                return reply.status(400).send({ error: 'Already a member of this department' });
            }
            if (user.pendingDepartments.includes(departmentName)) {
                return reply.status(400).send({ error: 'Request already pending' });
            }

            user.pendingDepartments.push(departmentName);
        }

        if (teamName) {
            // teamName format: "DepartmentName:TeamName"
            const [deptName, tName] = teamName.split(':');
            const dept = await Department.findOne({ name: deptName, isActive: true });
            if (!dept || !dept.teams.some(t => t.name === tName)) {
                return reply.status(404).send({ error: 'Team not found' });
            }

            if (user.teams.includes(teamName)) {
                return reply.status(400).send({ error: 'Already a member of this team' });
            }
            if (user.pendingTeams.includes(teamName)) {
                return reply.status(400).send({ error: 'Request already pending' });
            }

            user.pendingTeams.push(teamName);
        }

        await user.save();

        return { success: true, message: 'Access request submitted. Awaiting admin approval.' };
    });
}
