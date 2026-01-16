'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { chatApi } from './api';
import { useAuth } from './auth-context';

const ChatContext = createContext({});

export function ChatProvider({ children }) {
    const { user } = useAuth();
    const [recentChats, setRecentChats] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadRecentChats = useCallback(async () => {
        if (!user) return;
        
        try {
            // console.log('📂 Loading recent chats...');
            const data = await chatApi.getConversations();
            // Filter out empty conversations (no messages)
            const nonEmptyChats = (data.conversations || []).filter(c => c.messageCount > 0);
            setRecentChats(nonEmptyChats.slice(0, 20)); // Increased limit slightly
        } catch (error) {
            console.error('❌ Failed to load recent chats:', error);
        }
    }, [user]);

    // Initial load
    useEffect(() => {
        if (user) {
            loadRecentChats();
        }
    }, [user, loadRecentChats]);

    const refreshChats = useCallback(() => {
        loadRecentChats();
    }, [loadRecentChats]);

    return (
        <ChatContext.Provider value={{
            recentChats,
            setRecentChats, // Exposed for optimistic updates
            refreshChats,
            loading
        }}>
            {children}
        </ChatContext.Provider>
    );
}

export const useChat = () => useContext(ChatContext);
