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
import Sidebar from './Sidebar';
 
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

function DashboardLayoutInner({ children }) {
    const { user, logout, loading, hasPermission, isAdmin, isVisitor, isEmployee, isAdminOrVisitor } = useAuth();
    const chatContext = useChat(); 
    const recentChats = chatContext?.recentChats || [];
    const setRecentChats = chatContext?.setRecentChats || (() => {});
    const refreshChats = chatContext?.refreshChats || (() => {});
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

    // Debug logging
    console.log('📊 DashboardLayout Render:', { 
        loading, 
        hasUser: !!user, 
        userEmail: user?.email,
        pathname 
    });

    if (loading) {
        console.log('📊 DashboardLayout: Showing spinner (loading=true)');
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full" />
                    <p className="text-zinc-400 text-sm animate-pulse">Initializing session...</p>
                </div>
            </div>
        );
    }

    if (!user) {
         console.log('📊 DashboardLayout: Showing spinner (no user, waiting for redirect)');
         // return (
         //    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
         //         <div className="flex flex-col items-center gap-4">
         //            <div className="animate-spin w-8 h-8 border-2 border-red-500/20 border-t-red-500 rounded-full" />
         //            <p className="text-zinc-400 text-sm">Redirecting to login...</p>
         //        </div>
         //    </div>
         // );
    }

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            {/* Desktop Sidebar */}
            <Sidebar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                recentChats={recentChats}
                currentConversationId={currentConversationId}
                editingChatId={editingChatId}
                editTitle={editTitle}
                setEditTitle={setEditTitle}
                hoveredChatId={hoveredChatId}
                setHoveredChatId={setHoveredChatId}
                handleNewChat={handleNewChat}
                handleStartRename={handleStartRename}
                handleSaveRename={handleSaveRename}
                handleCancelRename={handleCancelRename}
                handleDeleteChat={handleDeleteChat}
                visibleNavItems={visibleNavItems}
                user={user}
                handleLogout={handleLogout}
            />

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
                                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center border border-border overflow-hidden">
                                            {user?.avatar ? (
                                                <img 
                                                    src={user.avatar} 
                                                    alt={user.name} 
                                                    className="w-full h-full object-cover" 
                                                />
                                            ) : (
                                                <span className="text-xs font-bold text-foreground">{user?.name?.slice(0, 2).toUpperCase() || 'U'}</span>
                                            )}
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
        <DashboardLayoutInner>
             <Suspense fallback={
                <div className="h-full flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
                </div>
            }>
                {children}
            </Suspense>
        </DashboardLayoutInner>
    );
}

