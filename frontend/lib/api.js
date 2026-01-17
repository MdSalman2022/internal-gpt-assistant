export const API_URL = process.env.NEXT_PUBLIC_API_URL

// Helper for API calls
async function fetcher(endpoint, options = {}) {
    const headers = { ...options.headers };

    // Only add Content-Type for requests with body
    if (options.body) {
        headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        credentials: 'include',
        headers,
    });

    const data = await res.json();
    if (!res.ok) {
        // Create error with full response data for proper handling
        const error = new Error(data.message || data.error || 'Request failed');
        error.status = res.status;
        error.code = data.error;
        error.retryAfter = data.retryAfter;
        error.isQuotaExhausted = data.isQuotaExhausted;
        throw error;
    }
    return data;
}


// Generic API client
export const api = {
    get: (url) => fetcher(url),
    post: (url, body = {}) => fetcher(url, { method: 'POST', body: JSON.stringify(body) }),
    put: (url, body = {}) => fetcher(url, { method: 'PUT', body: JSON.stringify(body) }),
    patch: (url, body = {}) => fetcher(url, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (url) => fetcher(url, { method: 'DELETE' }),
};

// Chat API
export const chatApi = {
    // Get available AI providers
    getProviders: () =>
        fetcher('/api/chat/providers'),

    // Get all conversations
    getConversations: (page = 1) =>
        fetcher(`/api/chat/conversations?page=${page}`),

    // Create new conversation
    createConversation: () =>
        fetcher('/api/chat/conversations', {
            method: 'POST',
            body: JSON.stringify({})
        }),

    // Get conversation with messages
    getConversation: (id) =>
        fetcher(`/api/chat/conversations/${id}`),

    // Send message and get AI response
    sendMessage: (conversationId, content, provider = null, fileIds = [], useWebSearch = false) =>
        fetcher(`/api/chat/conversations/${conversationId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ content, provider, fileIds, useWebSearch }),
        }),

    // Delete conversation
    deleteConversation: (id) =>
        fetcher(`/api/chat/conversations/${id}`, { method: 'DELETE' }),

    // Rename conversation
    renameConversation: (id, title) =>
        fetcher(`/api/chat/conversations/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ title })
        }),

    // Toggle pin
    togglePin: (id) =>
        fetcher(`/api/chat/conversations/${id}/pin`, {
            method: 'PATCH',
            body: JSON.stringify({})
        }),

    // Submit feedback
    submitFeedback: (messageId, feedback, comment) =>
        fetcher(`/api/chat/messages/${messageId}/feedback`, {
            method: 'POST',
            body: JSON.stringify({ feedback, comment }),
        }),

    // Upload file to a specific conversation
    uploadFileToChat: async (conversationId, file) => {
        const formData = new FormData();
        formData.append('file', file);

        const API_URL = process.env.NEXT_PUBLIC_API_URL
        const res = await fetch(`${API_URL}/api/chat/conversations/${conversationId}/upload`, {
            method: 'POST',
            credentials: 'include',
            body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        return data;
    },
};

// Documents API
export const documentsApi = {
    // List documents (admin/visitor)
    getDocuments: (page = 1, status = '', search = '') => {
        const params = new URLSearchParams({ page: page.toString() });
        if (status) params.append('status', status);
        if (search) params.append('search', search);
        return fetcher(`/api/documents?${params.toString()}`);
    },

    // Search documents for auto-complete (lighter version if needed, but reusing getDocuments for now)
    searchDocuments: (query) => {
        const params = new URLSearchParams({ search: query, limit: 5 }); // Limit to 5 for dropdown
        return fetcher(`/api/documents?${params.toString()}`);
    },

    // Get single document
    getDocument: (id) =>
        fetcher(`/api/documents/${id}`),

    // Upload document
    uploadDocument: async (file, options = {}) => {
        const formData = new FormData();
        formData.append('file', file);
        if (options.title) formData.append('title', options.title);
        if (options.description) formData.append('description', options.description);

        // ACL Fields
        if (options.accessLevel) formData.append('accessLevel', options.accessLevel);
        if (options.allowedDepartments?.length) formData.append('allowedDepartments', JSON.stringify(options.allowedDepartments));
        if (options.allowedTeams?.length) formData.append('allowedTeams', JSON.stringify(options.allowedTeams));
        if (options.allowedUsers?.length) formData.append('allowedUsers', JSON.stringify(options.allowedUsers));
        if (options.allowedUserEmails?.length) formData.append('allowedUserEmails', JSON.stringify(options.allowedUserEmails));

        const res = await fetch(`${API_URL}/api/documents/upload`, {
            method: 'POST',
            credentials: 'include',
            body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        return data;
    },

    // Update document
    updateDocument: (id, updates) =>
        fetcher(`/api/documents/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        }),

    // Delete document
    deleteDocument: (id) =>
        fetcher(`/api/documents/${id}`, { method: 'DELETE' }),

    // Get download URL
    getDownloadUrl: (id) => `${API_URL}/api/documents/${id}/download`,
};

// Analytics API
export const analyticsApi = {
    // Get dashboard stats
    getStats: () => fetcher('/api/analytics/stats'),

    // Get top queries
    getTopQueries: (limit = 10) => fetcher(`/api/analytics/top-queries?limit=${limit}`),

    // Get knowledge gaps
    getKnowledgeGaps: (limit = 10) => fetcher(`/api/analytics/knowledge-gaps?limit=${limit}`),

    // Get query volume over time
    getQueryVolume: (days = 14) => fetcher(`/api/analytics/query-volume?days=${days}`),

    // Get document stats by status
    getDocumentStats: () => fetcher('/api/analytics/document-stats'),

    // Get feedback summary
    getFeedback: () => fetcher('/api/analytics/feedback'),
};

// Users API
export const usersApi = {
    // List all users
    getUsers: () => fetcher('/api/users'),

    // Get organization structure (departments, teams)
    getStructure: () => fetcher('/api/users/structure'),

    // Get user profile with security stats
    getUserProfile: (id) => fetcher(`/api/users/${id}/profile`),

    // Update user
    updateUser: (id, updates) =>
        fetcher(`/api/users/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        }),

    // Delete user
    deleteUser: (id) =>
        fetcher(`/api/users/${id}`, { method: 'DELETE' }),
};

// Audit Logs API
export const auditApi = {
    // Get logs with filters
    getLogs: (filters = {}, page = 1) => {
        const params = new URLSearchParams({ page });
        if (filters.action) params.append('action', filters.action);
        if (filters.userId) params.append('userId', filters.userId);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        return fetcher(`/api/audit-logs?${params.toString()}`);
    }
};

// Usage & Cost Controls API
export const usageApi = {
    // Get current user's usage stats
    getMyUsage: () => fetcher('/api/usage/me'),

    // Get current user's limits
    getMyLimits: () => fetcher('/api/usage/limits'),

    // Get available models for current user
    getModels: () => fetcher('/api/usage/models'),

    // Admin: Get all users' usage
    getAllUsersUsage: () => fetcher('/api/usage/admin/users'),

    // Admin: Update user limits
    updateUserLimits: (userId, limits) =>
        fetcher(`/api/usage/admin/users/${userId}/limits`, {
            method: 'PATCH',
            body: JSON.stringify(limits)
        }),

    // Admin: Reset daily usage
    resetDailyUsage: () =>
        fetcher('/api/usage/admin/reset-daily', { method: 'POST' }),

    // Admin: Reset monthly usage
    resetMonthlyUsage: () =>
        fetcher('/api/usage/admin/reset-monthly', { method: 'POST' })
};

// Profile API
export const profileApi = {
    // Update current user's profile (name, department, etc.)
    updateProfile: (updates) =>
        fetcher('/api/auth/me', {
            method: 'PATCH',
            body: JSON.stringify(updates)
        }),

    // Update current user's UI preferences (theme, primary color)
    updateUIPreferences: (preferences) =>
        fetcher('/api/auth/preferences', {
            method: 'POST',
            body: JSON.stringify(preferences)
        }),
};

// Upload API
export const uploadApi = {
    // Upload file
    uploadFile: async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(`${API_URL}/api/upload`, {
            method: 'POST',
            credentials: 'include',
            body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        return data;
    },
};

// Departments API
export const departmentsApi = {
    // List all departments with teams
    getDepartments: () => fetcher('/api/departments'),

    // Create department (admin)
    createDepartment: (name, description) =>
        fetcher('/api/departments', {
            method: 'POST',
            body: JSON.stringify({ name, description })
        }),

    // Update department (admin)
    updateDepartment: (id, updates) =>
        fetcher(`/api/departments/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updates)
        }),

    // Delete department (admin)
    deleteDepartment: (id) =>
        fetcher(`/api/departments/${id}`, { method: 'DELETE' }),

    // Add team to department (admin)
    addTeam: (departmentId, name, description) =>
        fetcher(`/api/departments/${departmentId}/teams`, {
            method: 'POST',
            body: JSON.stringify({ name, description })
        }),

    // Remove team from department (admin)
    removeTeam: (departmentId, teamId) =>
        fetcher(`/api/departments/${departmentId}/teams/${teamId}`, { method: 'DELETE' }),

    // Get pending access requests (admin)
    getAccessRequests: () => fetcher('/api/departments/requests'),

    // Approve access request (admin)
    approveRequest: (userId, type, resource) =>
        fetcher('/api/departments/requests/approve', {
            method: 'POST',
            body: JSON.stringify({ userId, type, resource })
        }),

    // Reject access request (admin)
    rejectRequest: (userId, type, resource) =>
        fetcher('/api/departments/requests/reject', {
            method: 'POST',
            body: JSON.stringify({ userId, type, resource })
        }),

    // User requests access to department/team
    requestAccess: (departmentName, teamName) =>
        fetcher('/api/departments/request-access', {
            method: 'POST',
            body: JSON.stringify({ departmentName, teamName })
        }),
};

// Integrations API (Google Calendar, etc.)
export const integrationsApi = {
    // Google Calendar
    googleCalendar: {
        // Get auth URL (redirect user to this for OAuth)
        getAuthUrl: () => `${API_URL}/api/integrations/google-calendar/auth`,

        // Check connection status
        getStatus: () => fetcher('/api/integrations/google-calendar/status'),

        // Disconnect Google Calendar
        disconnect: () =>
            fetcher('/api/integrations/google-calendar/disconnect', { method: 'POST' }),

        // Get upcoming events
        getEvents: (limit = 10) =>
            fetcher(`/api/integrations/google-calendar/events?limit=${limit}`),

        // Get today's events
        getToday: () => fetcher('/api/integrations/google-calendar/today'),
    }
};

// Organizations API
export const organizationsApi = {
    // Get current organization
    getCurrent: () => fetcher('/api/organizations'),

    // Get organization Tavily settings
    getTavilySettings: (orgId) => fetcher(`/api/organizations/${orgId}/settings/tavily`),

    // Update organization Tavily settings
    updateTavilySettings: (orgId, settings) =>
        fetcher(`/api/organizations/${orgId}/settings/tavily`, {
            method: 'PUT',
            body: JSON.stringify(settings)
        }),
};

