'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { chatApi } from '@/lib/api';
import {
    MessageSquare, FileText, BarChart3, Settings, LogOut,
    Menu, X, ChevronLeft, Sparkles, Plus, MessageCircle
} from 'lucide-react';

const navItems = [
    { href: '/chat', icon: MessageSquare, label: 'Chat' },
    { href: '/documents', icon: FileText, label: 'Documents' },
    { href: '/analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/settings', icon: Settings, label: 'Settings' },
];

export default function DashboardLayout({ children }) {
    const { user, logout, loading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [recentChats, setRecentChats] = useState([]);

    // Load recent conversations
    useEffect(() => {
        if (user) {
            loadRecentChats();
        }
    }, [user]);

    const loadRecentChats = async () => {
        try {
            const data = await chatApi.getConversations();
            setRecentChats((data.conversations || []).slice(0, 5));
        } catch (error) {
            console.error('Failed to load recent chats:', error);
        }
    };

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    const handleNewChat = async () => {
        try {
            const data = await chatApi.createConversation();
            // Navigate to chat with new conversation
            router.push(`/chat?conversation=${data.conversation._id}`);
            // Refresh recent chats
            loadRecentChats();
        } catch (error) {
            console.error('Failed to create conversation:', error);
            // Still navigate to chat page
            router.push('/chat');
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-slate-950 overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className={`
                hidden md:flex flex-col bg-slate-900 border-r border-slate-800 
                transition-all duration-300 ease-in-out
                ${sidebarOpen ? 'w-64' : 'w-20'}
            `}>
                {/* Logo */}
                <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
                    <Link href="/chat" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        {sidebarOpen && (
                            <span className="font-bold text-white text-lg">KnowledgeAI</span>
                        )}
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <ChevronLeft className={`w-5 h-5 text-slate-400 transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {/* New Chat Button */}
                <div className="p-3">
                    <button
                        onClick={handleNewChat}
                        className={`
                            flex items-center gap-3 w-full px-4 py-3 rounded-xl
                            bg-primary-500 hover:bg-primary-600 text-white font-medium
                            transition-all shadow-lg shadow-primary-500/25
                            ${!sidebarOpen ? 'justify-center px-3' : ''}
                        `}
                    >
                        <Plus className="w-5 h-5" />
                        {sidebarOpen && <span>New Chat</span>}
                    </button>
                </div>

                {/* Recent Conversations (when sidebar is open) */}
                {sidebarOpen && recentChats.length > 0 && (
                    <div className="px-3 pb-3">
                        <p className="px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Recent
                        </p>
                        <div className="space-y-1">
                            {recentChats.map((chat) => (
                                <Link
                                    key={chat._id}
                                    href={`/chat?conversation=${chat._id}`}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 
                                             hover:text-white hover:bg-slate-800 rounded-lg transition-colors
                                             truncate"
                                >
                                    <MessageCircle className="w-4 h-4 flex-shrink-0" />
                                    <span className="truncate">{chat.title || 'New chat'}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Nav Items */}
                <nav className="flex-1 p-3 space-y-1 border-t border-slate-800">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                                    ${isActive
                                        ? 'bg-primary-500/10 text-primary-400'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }
                                    ${!sidebarOpen ? 'justify-center' : ''}
                                `}
                            >
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                {sidebarOpen && <span className="font-medium">{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile */}
                <div className="p-3 border-t border-slate-800">
                    <div className={`flex items-center gap-3 p-2 rounded-lg ${sidebarOpen ? '' : 'justify-center'}`}>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-sm font-medium">
                                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                        </div>
                        {sidebarOpen && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleLogout}
                        className={`
                            flex items-center gap-3 w-full px-3 py-2.5 mt-2 rounded-lg
                            text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all
                            ${!sidebarOpen ? 'justify-center' : ''}
                        `}
                    >
                        <LogOut className="w-5 h-5" />
                        {sidebarOpen && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4">
                <Link href="/chat" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-white">KnowledgeAI</span>
                </Link>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleNewChat}
                        className="p-2 bg-primary-500 hover:bg-primary-600 rounded-lg"
                    >
                        <Plus className="w-5 h-5 text-white" />
                    </button>
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 hover:bg-slate-800 rounded-lg"
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
                    <div
                        className="absolute top-16 left-0 right-0 bg-slate-900 border-b border-slate-800 p-4 max-h-[80vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Recent chats in mobile */}
                        {recentChats.length > 0 && (
                            <div className="mb-4 pb-4 border-b border-slate-800">
                                <p className="px-2 py-1 text-xs font-medium text-slate-500 uppercase">Recent Chats</p>
                                {recentChats.slice(0, 3).map((chat) => (
                                    <Link
                                        key={chat._id}
                                        href={`/chat?conversation=${chat._id}`}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-800 rounded-lg"
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        <span className="truncate">{chat.title || 'New chat'}</span>
                                    </Link>
                                ))}
                            </div>
                        )}

                        <nav className="space-y-1">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`
                                            flex items-center gap-3 px-4 py-3 rounded-lg
                                            ${isActive
                                                ? 'bg-primary-500/10 text-primary-400'
                                                : 'text-slate-300 hover:bg-slate-800'
                                            }
                                        `}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        <span className="font-medium">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-3 mt-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden md:pt-0 pt-16">
                {children}
            </main>
        </div>
    );
}
