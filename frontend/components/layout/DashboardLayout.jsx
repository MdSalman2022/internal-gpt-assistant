'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { chatApi } from '@/lib/api';
import {
    MessageSquare, FileText, BarChart3, Settings, LogOut,
    Menu, X, ChevronLeft, Sparkles, Plus, MessageCircle,
    MoreHorizontal, Pencil, Trash2, Check, X as XIcon, Shield, Users, Search,
    User, Bell, Palette, Database, Key, Zap, DollarSign, Activity, ArrowLeft
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

// Nav items with required permissions
// Nav items with required permissions
const navItems = [
    { href: '/chat', icon: MessageSquare, label: 'Chat', permission: 'chat:read' },
    { href: '/settings', icon: Settings, label: 'Settings', permission: null }, // Everyone can access
];

// Settings tabs configuration for mobile sidebar
const getSettingsTabs = (isAdmin) => [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'usage', label: 'Usage', icon: Zap },
    ...(isAdmin ? [{ id: 'ai-models', label: 'AI Models', icon: Database }] : []),
    ...(isAdmin ? [{ id: 'cost-controls', label: 'Cost Controls', icon: DollarSign }] : []),
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'users', label: 'Users', icon: Users },
    ...(isAdmin ? [{ id: 'audit', label: 'Audit Logs', icon: Shield }] : []),
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Key },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'integrations', label: 'Integrations', icon: Database },
];

export default function DashboardLayout({ children }) {
    const { user, logout, loading, hasPermission, isAdmin, isVisitor, isEmployee } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentConversationId = searchParams.get('conversation');

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [recentChats, setRecentChats] = useState([]);
    const [editingChatId, setEditingChatId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [hoveredChatId, setHoveredChatId] = useState(null);

    // Filter nav items based on user permissions
    const visibleNavItems = navItems.filter(item =>
        !item.permission || hasPermission(item.permission)
    );

    // Load recent conversations
    useEffect(() => {
        if (user) {
            loadRecentChats();
        }
    }, [user]);

    const loadRecentChats = async () => {
        try {
            console.log('📂 Loading recent chats...');
            const data = await chatApi.getConversations();
            console.log('📂 Conversations loaded:', data);
            // Filter out empty conversations (no messages)
            const nonEmptyChats = (data.conversations || []).filter(c => c.messageCount > 0);
            setRecentChats(nonEmptyChats.slice(0, 10));
        } catch (error) {
            console.error('❌ Failed to load recent chats:', error);
        }
    };

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    const handleNewChat = () => {
        // If already on chat page with no conversation or empty conversation, just stay
        if (pathname === '/chat' && !currentConversationId) {
            // Already on new chat, do nothing
            return;
        }

        // Navigate to fresh chat
        router.push('/chat');
    };

    const handleDeleteChat = async (e, chatId) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm('Delete this conversation?')) return;

        try {
            await chatApi.deleteConversation(chatId);
            setRecentChats(prev => prev.filter(c => c._id !== chatId));

            // If deleting current conversation, go to new chat
            if (currentConversationId === chatId) {
                router.push('/chat');
            }
        } catch (error) {
            console.error('Failed to delete conversation:', error);
        }
    };

    const handleStartRename = (e, chat) => {
        e.preventDefault();
        e.stopPropagation();
        setEditingChatId(chat._id);
        setEditTitle(chat.title || 'New chat');
    };

    const handleSaveRename = async (e, chatId) => {
        e.preventDefault();
        e.stopPropagation();

        if (!editTitle.trim()) {
            setEditingChatId(null);
            return;
        }

        try {
            await chatApi.renameConversation(chatId, editTitle.trim());
            setRecentChats(prev =>
                prev.map(c => c._id === chatId ? { ...c, title: editTitle.trim() } : c)
            );
        } catch (error) {
            console.error('Failed to rename conversation:', error);
        }

        setEditingChatId(null);
    };

    const handleCancelRename = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setEditingChatId(null);
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
                <div className={`flex items-center h-16 px-4 border-b border-slate-800 ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
                    <Link href="/chat" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        {sidebarOpen && (
                            <span className="font-bold text-white text-lg">KnowledgeAI</span>
                        )}
                    </Link>
                    {sidebarOpen && (
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-slate-400" />
                        </button>
                    )}
                </div>

                {/* Expand button when collapsed - positioned below logo */}
                {!sidebarOpen && (
                    <div className="flex justify-center p-2 border-b border-slate-800">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-slate-400 rotate-180" />
                        </button>
                    </div>
                )}

                {/* New Chat Button */}
                <div className="p-3">
                    <button
                        onClick={handleNewChat}
                        className={`
                            flex items-center gap-3 w-full px-4 py-3 rounded-xl
                            bg-slate-800 hover:bg-slate-700 text-white font-medium
                            border border-slate-700 hover:border-slate-600
                            transition-all
                            ${!sidebarOpen ? 'justify-center px-3' : ''}
                        `}
                    >
                        <Plus className="w-5 h-5" />
                        {sidebarOpen && <span>New chat</span>}
                    </button>
                </div>

                {/* Recent Conversations (when sidebar is open) */}
                {sidebarOpen && recentChats.length > 0 && (
                    <div className="flex-1 overflow-y-auto px-3 pb-3">
                        <p className="px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Recent
                        </p>
                        <div className="space-y-1">
                            {recentChats.map((chat) => {
                                const isActive = currentConversationId === chat._id;
                                const isEditing = editingChatId === chat._id;
                                const isHovered = hoveredChatId === chat._id;

                                return (
                                    <div
                                        key={chat._id}
                                        className="relative group"
                                        onMouseEnter={() => setHoveredChatId(chat._id)}
                                        onMouseLeave={() => setHoveredChatId(null)}
                                    >
                                        {isEditing ? (
                                            <div className="flex items-center gap-1 px-2 py-1.5">
                                                <input
                                                    type="text"
                                                    value={editTitle}
                                                    onChange={(e) => setEditTitle(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleSaveRename(e, chat._id);
                                                        if (e.key === 'Escape') handleCancelRename(e);
                                                    }}
                                                    className="flex-1 px-2 py-1 bg-slate-700 border border-slate-600 
                                                             rounded text-sm text-white focus:outline-none focus:border-primary-500"
                                                    autoFocus
                                                    onClick={(e) => e.preventDefault()}
                                                />
                                                <button
                                                    onClick={(e) => handleSaveRename(e, chat._id)}
                                                    className="p-1 text-green-400 hover:bg-slate-700 rounded"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={handleCancelRename}
                                                    className="p-1 text-slate-400 hover:bg-slate-700 rounded"
                                                >
                                                    <XIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <Link
                                                href={`/chat?conversation=${chat._id}`}
                                                className={`
                                                    flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors
                                                    ${isActive
                                                        ? 'bg-slate-800 text-white'
                                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                                    }
                                                `}
                                            >
                                                <MessageCircle className="w-4 h-4 flex-shrink-0" />
                                                <span className="flex-1 truncate">{chat.title || 'New chat'}</span>

                                                {/* Action buttons on hover */}
                                                {(isHovered || isActive) && (
                                                    <div className="flex items-center gap-0.5">
                                                        <button
                                                            onClick={(e) => handleStartRename(e, chat)}
                                                            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                                                            title="Rename"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleDeleteChat(e, chat._id)}
                                                            className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </Link>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Nav Items */}
                <nav className="p-3 space-y-1 border-t border-slate-800">
                    {visibleNavItems.map((item) => {
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
                                <div className="flex items-center gap-2">
                                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                    {user?.role && (
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase
                                            ${(user.role === 'admin' || user.role === 'visitor' || user.role === 'employee') ? 'bg-red-500/20 text-red-400' :
                                                'bg-slate-600/50 text-slate-400'}`}>
                                            {(user.role === 'admin' || user.role === 'visitor' || user.role === 'employee') ? 'admin' : user.role}
                                        </span>
                                    )}
                                </div>
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

            {/* Mobile Slide-Out Drawer using shadcn Sheet */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetContent side="left" className="w-80 p-0 bg-slate-900 border-slate-800 flex flex-col">
                    {pathname.startsWith('/settings') ? (
                        /* Settings Page Sidebar */
                        <>
                            {/* Header with back to chat */}
                            <div className="flex items-center gap-3 h-14 px-4 border-b border-slate-800">
                                <button
                                    onClick={() => { router.push('/chat'); setMobileMenuOpen(false); }}
                                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                    <span className="font-medium">Back to Chat</span>
                                </button>
                            </div>

                            {/* Settings Title */}
                            <div className="px-4 py-3 border-b border-slate-800">
                                <h2 className="text-lg font-semibold text-white">Settings</h2>
                                <p className="text-xs text-slate-500">Manage your preferences</p>
                            </div>

                            {/* Settings Tabs */}
                            <div className="flex-1 overflow-y-auto p-3">
                                <div className="space-y-1">
                                    {getSettingsTabs(isAdmin).map((tab) => {
                                        const currentTab = searchParams.get('tab') || 'profile';
                                        const isActive = currentTab === tab.id;
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => {
                                                    router.push(`/settings?tab=${tab.id}`);
                                                    setMobileMenuOpen(false);
                                                }}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left
                                                    ${isActive
                                                        ? 'bg-slate-800 text-white'
                                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                                    }`}
                                            >
                                                <tab.icon className="w-4 h-4" />
                                                <span className="text-sm font-medium">{tab.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Logout at bottom */}
                            <div className="p-3 border-t border-slate-800">
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors text-left"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span className="text-sm font-medium">Logout</span>
                                </button>
                            </div>
                        </>
                    ) : (
                        /* Default Chat Sidebar */
                        <>
                            {/* Header */}
                            <div className="flex items-center gap-3 h-14 px-4 border-b border-slate-800">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-white" />
                                </div>
                                <span className="font-bold text-white">KnowledgeAI</span>
                            </div>

                            {/* New Chat */}
                            <div className="p-3">
                                <button
                                    onClick={() => { handleNewChat(); setMobileMenuOpen(false); }}
                                    className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium border border-slate-700 transition-colors"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span>New chat</span>
                                </button>
                            </div>

                            {/* Search Chats */}
                            <div className="px-3 pb-2">
                                <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                    <Search className="w-4 h-4 text-slate-500" />
                                    <span className="text-sm text-slate-500">Search chats</span>
                                </div>
                            </div>

                            {/* Your Chats */}
                            <div className="flex-1 overflow-y-auto px-3">
                                {recentChats.length > 0 && (
                                    <>
                                        <p className="px-2 py-2 text-xs font-medium text-slate-500">Your chats</p>
                                        <div className="space-y-0.5">
                                            {recentChats.map((chat) => (
                                                <div key={chat._id} className="group flex items-center">
                                                    <Link
                                                        href={`/chat?conversation=${chat._id}`}
                                                        onClick={() => setMobileMenuOpen(false)}
                                                        className={`flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${currentConversationId === chat._id
                                                            ? 'bg-slate-800 text-white'
                                                            : 'text-slate-300 hover:bg-slate-800/50'
                                                            }`}
                                                    >
                                                        <MessageCircle className="w-4 h-4 flex-shrink-0 text-slate-500" />
                                                        <span className="truncate text-sm">{chat.title || 'New chat'}</span>
                                                    </Link>
                                                    <button
                                                        onClick={(e) => handleDeleteChat(e, chat._id)}
                                                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 transition-opacity"
                                                    >
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Bottom Section */}
                            <div className="mt-auto border-t border-slate-800">
                                {/* Menu Items */}
                                <div className="p-2">
                                    {visibleNavItems.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${pathname === item.href
                                                ? 'bg-slate-800 text-white'
                                                : 'text-slate-300 hover:bg-slate-800/50'
                                                }`}
                                        >
                                            <item.icon className="w-5 h-5" />
                                            <span className="text-sm font-medium">{item.label}</span>
                                        </Link>
                                    ))}
                                </div>

                                {/* User Profile */}
                                <div className="p-2 border-t border-slate-800">
                                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800/50 cursor-pointer">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                            <span className="text-xs font-bold text-white">{user?.name?.slice(0, 2).toUpperCase() || 'U'}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                                            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 w-full px-3 py-2.5 text-slate-400 hover:bg-slate-800/50 rounded-lg transition-colors"
                                    >
                                        <LogOut className="w-5 h-5" />
                                        <span className="text-sm">Log out</span>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {children}
            </main>

            {/* Mobile Hamburger Menu Toggle - on chat and settings pages */}
            {(pathname.startsWith('/chat') || pathname.startsWith('/settings')) && (
                <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="md:hidden fixed top-2 left-2 z-30 p-2.5 bg-slate-800/90 backdrop-blur-sm rounded-xl border border-slate-700 shadow-lg"
                >
                    <Menu className="w-5 h-5 text-white" />
                </button>
            )}
        </div>
    );
}

