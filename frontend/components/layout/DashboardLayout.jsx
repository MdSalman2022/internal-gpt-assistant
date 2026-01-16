'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { chatApi } from '@/lib/api';
import {
    MessageSquare, FileText, BarChart3, Settings, LogOut,
    Menu, X, ChevronLeft, Sparkles, Plus, MessageCircle,
    MoreHorizontal, Pencil, Trash2, Check, X as XIcon, Shield, Users, Search,
    User, Bell, Palette, Database, Key, Zap, DollarSign, Activity, ArrowLeft, Building2
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

// Nav items with required permissions
// Nav items with required permissions
const navItems = [
    { href: '/chat', icon: MessageSquare, label: 'Chat', permission: 'chat:read' },
    { href: '/settings', icon: Settings, label: 'Settings', permission: null }, // Everyone can access
];

// Settings tabs configuration for mobile sidebar - now using routes
const getSettingsTabs = (isAdminOrVisitor) => [
    { href: '/settings/profile', label: 'Profile', icon: User },
    { href: '/settings/usage', label: 'Usage', icon: Zap },
    ...(isAdminOrVisitor ? [{ href: '/settings/ai-models', label: 'AI Models', icon: Database }] : []),
    ...(isAdminOrVisitor ? [{ href: '/settings/cost-controls', label: 'Cost Controls', icon: DollarSign }] : []),
    ...(isAdminOrVisitor ? [{ href: '/settings/analytics', label: 'Analytics', icon: Activity }] : []),
    { href: '/settings/documents', label: 'Documents', icon: FileText },
    { href: '/settings/users', label: 'Users', icon: Users },
    ...(isAdminOrVisitor ? [{ href: '/settings/organization', label: 'Organization', icon: Building2 }] : []),
    ...(isAdminOrVisitor ? [{ href: '/settings/audit', label: 'Audit Logs', icon: Shield }] : []),
    { href: '/settings/notifications', label: 'Notifications', icon: Bell },
    { href: '/settings/security', label: 'Security', icon: Key },
    { href: '/settings/appearance', label: 'Appearance', icon: Palette },
    { href: '/settings/integrations', label: 'Integrations', icon: Database },
];

import { useChat } from '@/lib/chat-context';
// ... imports

function DashboardLayoutInner({ children }) {
    const { user, logout, loading, hasPermission, isAdmin, isVisitor, isEmployee, isAdminOrVisitor } = useAuth();
    const { recentChats, setRecentChats, refreshChats } = useChat(); // Use Context
    const pathname = usePathname();
    const router = useRouter();
    // Extract conversation ID from pathname for route-based URLs
    const currentConversationId = pathname.startsWith('/chat/') ? pathname.split('/chat/')[1] : null;

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    // const [recentChats, setRecentChats] = useState([]); // REMOVED local state
    const [editingChatId, setEditingChatId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [hoveredChatId, setHoveredChatId] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [chatToDelete, setChatToDelete] = useState(null);

    // Filter nav items based on user permissions
    const visibleNavItems = navItems.filter(item =>
        !item.permission || hasPermission(item.permission)
    );

    // REMOVED local loadRecentChats effect and function (handled in Context)

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
        setChatToDelete(chatId);
        setDeleteDialogOpen(true);
    };

    const confirmDeleteChat = async () => {
        if (!chatToDelete) return;

        try {
            await chatApi.deleteConversation(chatToDelete);
            setRecentChats(prev => prev.filter(c => c._id !== chatToDelete));

            // If deleting current conversation, go to new chat
            if (currentConversationId === chatToDelete) {
                router.push('/chat');
            }
        } catch (error) {
            console.error('Failed to delete conversation:', error);
        }
        setChatToDelete(null);
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
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className={`
                hidden md:flex flex-col bg-card border-r border-border 
                transition-all duration-300 ease-in-out
                ${sidebarOpen ? 'w-64' : 'w-20'}
            `}>
                {/* Logo */}
                <div className={`flex items-center h-16 px-4 border-b border-border ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
                    <Link href="/chat" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/40 ring-1 ring-primary/20">
                            <Sparkles className="w-6 h-6 text-primary-foreground fill-primary-foreground/10" />
                        </div>
                        {sidebarOpen && (
                            <span className="font-bold text-foreground text-lg">InsightAI</span>
                        )}
                    </Link>
                    {sidebarOpen && (
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 hover:bg-secondary rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                        </button>
                    )}
                </div>

                {/* Expand button when collapsed - positioned below logo */}
                {!sidebarOpen && (
                    <div className="flex justify-center p-2 border-b border-border">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 hover:bg-secondary rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-muted-foreground rotate-180" />
                        </button>
                    </div>
                )}

                {/* New Chat Button */}
                <div className="p-3">
                    <button
                        onClick={handleNewChat}
                        className={`
                            flex items-center gap-3 w-full px-4 py-3 rounded-xl
                            bg-primary hover:bg-primary/90 text-primary-foreground font-medium
                            border border-primary/20 hover:border-primary/40
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
                        <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
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
                                                    className="flex-1 px-2 py-1 bg-secondary border border-border 
                                                             rounded text-sm text-foreground focus:outline-none focus:border-primary"
                                                    autoFocus
                                                    onClick={(e) => e.preventDefault()}
                                                />
                                                <button
                                                    onClick={(e) => handleSaveRename(e, chat._id)}
                                                    className="p-1 text-success hover:bg-secondary rounded"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={handleCancelRename}
                                                    className="p-1 text-muted-foreground hover:bg-secondary rounded"
                                                >
                                                    <XIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <Link
                                                href={`/chat/${chat._id}`}
                                                className={`
                                                    flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors
                                                    ${isActive
                                                        ? 'bg-secondary text-foreground'
                                                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
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
                                                            className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary rounded"
                                                            title="Rename"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleDeleteChat(e, chat._id)}
                                                            className="p-1 text-muted-foreground hover:text-destructive hover:bg-secondary rounded"
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
                <nav className="p-3 space-y-1 border-t border-border">
                    {visibleNavItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                                    ${isActive
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
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
                <div className="p-3 border-t border-border">
                    <div className={`flex items-center gap-3 p-2 rounded-lg ${sidebarOpen ? '' : 'justify-center'}`}>
                        <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 border border-border">
                            <span className="text-foreground text-sm font-medium">
                                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                        </div>
                        {sidebarOpen && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                                    {user?.role && (
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase
                                            ${(user.role === 'admin' || user.role === 'visitor') ? 'bg-destructive/20 text-destructive' :
                                                user.role === 'employee' ? 'bg-info/20 text-info' :
                                                    'bg-secondary text-muted-foreground'}`}>
                                            {(user.role === 'admin' || user.role === 'visitor') ? 'ADMIN' : user.role}
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
                            text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all
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
                <SheetContent side="left" className="w-80 p-0 bg-card border-border flex flex-col">
                    {pathname.startsWith('/settings') ? (
                        /* Settings Page Sidebar */
                        <>
                            {/* Header with back to chat */}
                            <div className="flex items-center gap-3 h-14 px-4 border-b border-border">
                                <button
                                    onClick={() => { router.push('/chat'); setMobileMenuOpen(false); }}
                                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                    <span className="font-medium">Back to Chat</span>
                                </button>
                            </div>

                            {/* Settings Title */}
                            <div className="px-4 py-3 border-b border-border">
                                <h2 className="text-lg font-semibold text-foreground">Settings</h2>
                                <p className="text-xs text-muted-foreground">Manage your preferences</p>
                            </div>

                            {/* Settings Tabs */}
                            <div className="flex-1 overflow-y-auto p-3">
                                <div className="space-y-1">
                                    {getSettingsTabs(isAdminOrVisitor).map((tab) => {
                                        const isActive = pathname === tab.href;
                                        return (
                                            <button
                                                key={tab.href}
                                                onClick={() => {
                                                    router.push(tab.href);
                                                    setMobileMenuOpen(false);
                                                }}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left
                                                    ${isActive
                                                        ? 'bg-secondary text-foreground'
                                                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
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
                            <div className="p-3 border-t border-border">
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors text-left"
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
                            <div className="flex items-center gap-3 h-14 px-4 border-b border-border">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-primary-foreground" />
                                </div>
                                <span className="font-bold text-foreground">InsightAI</span>
                            </div>

                            {/* New Chat */}
                            <div className="p-3">
                                <button
                                    onClick={() => { handleNewChat(); setMobileMenuOpen(false); }}
                                    className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium border border-primary/20 transition-colors"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span>New chat</span>
                                </button>
                            </div>

                            {/* Search Chats */}
                            <div className="px-3 pb-2">
                                <div className="flex items-center gap-2 px-3 py-2 bg-secondary/50 rounded-lg border border-border">
                                    <Search className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Search chats</span>
                                </div>
                            </div>

                            {/* Your Chats */}
                            <div className="flex-1 overflow-y-auto px-3">
                                {recentChats.length > 0 && (
                                    <>
                                        <p className="px-2 py-2 text-xs font-medium text-muted-foreground">Your chats</p>
                                        <div className="space-y-0.5">
                                            {recentChats.map((chat) => (
                                                <div key={chat._id} className="group flex items-center">
                                                    <Link
                                                        href={`/chat/${chat._id}`}
                                                        onClick={() => setMobileMenuOpen(false)}
                                                        className={`flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${currentConversationId === chat._id
                                                            ? 'bg-secondary text-foreground'
                                                            : 'text-muted-foreground hover:bg-secondary/50'
                                                            }`}
                                                    >
                                                        <MessageCircle className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                                                        <span className="truncate text-sm">{chat.title || 'New chat'}</span>
                                                    </Link>
                                                    <button
                                                        onClick={(e) => handleDeleteChat(e, chat._id)}
                                                        className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-destructive transition-opacity"
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
                            <div className="mt-auto border-t border-border">
                                {/* Menu Items */}
                                <div className="p-2">
                                    {visibleNavItems.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${pathname === item.href
                                                ? 'bg-secondary text-foreground'
                                                : 'text-muted-foreground hover:bg-secondary/50'
                                                }`}
                                        >
                                            <item.icon className="w-5 h-5" />
                                            <span className="text-sm font-medium">{item.label}</span>
                                        </Link>
                                    ))}
                                </div>

                                {/* User Profile */}
                                <div className="p-2 border-t border-border">
                                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/50 cursor-pointer">
                                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center border border-border">
                                            <span className="text-xs font-bold text-foreground">{user?.name?.slice(0, 2).toUpperCase() || 'U'}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 w-full px-3 py-2.5 text-muted-foreground hover:bg-secondary/50 rounded-lg transition-colors"
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
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
                {children}
            </main>

            {/* Mobile Hamburger Menu Toggle - on chat and settings pages */}
            {(pathname.startsWith('/chat') || pathname.startsWith('/settings')) && (
                <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="md:hidden fixed top-2 left-2 z-30 p-2.5 bg-secondary/90 backdrop-blur-sm rounded-xl border border-border shadow-lg"
                >
                    <Menu className="w-5 h-5 text-foreground" />
                </button>
            )}

            {/* Delete Chat Confirmation Dialog */}
            <ConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Conversation"
                description="Are you sure you want to delete this conversation? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
                onConfirm={confirmDeleteChat}
            />
        </div>
    );
}

// Wrapper with Suspense for useSearchParams compatibility
export default function DashboardLayout({ children }) {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <DashboardLayoutInner>{children}</DashboardLayoutInner>
        </Suspense>
    );
}
