const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Helper for API calls
async function fetcher(endpoint, options = {}) {
    const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
}

// Chat API
export const chatApi = {
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
    sendMessage: (conversationId, content) =>
        fetcher(`/api/chat/conversations/${conversationId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ content }),
        }),

    // Delete conversation
    deleteConversation: (id) =>
        fetcher(`/api/chat/conversations/${id}`, { method: 'DELETE' }),

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
};

// Documents API
export const documentsApi = {
    // List documents
    getDocuments: (page = 1, status = null) => {
        let url = `/api/documents?page=${page}`;
        if (status) url += `&status=${status}`;
        return fetcher(url);
    },

    // Get single document
    getDocument: (id) =>
        fetcher(`/api/documents/${id}`),

    // Upload document
    uploadDocument: async (file, title, description) => {
        const formData = new FormData();
        formData.append('file', file);
        if (title) formData.append('title', title);
        if (description) formData.append('description', description);

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
