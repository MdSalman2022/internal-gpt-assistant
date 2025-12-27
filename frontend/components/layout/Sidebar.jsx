'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    Plus, MessageSquare, FileText, BarChart3, Settings,
    ChevronLeft, ChevronRight, Pin, Trash2, MoreHorizontal,
    Search, LogOut, User, Sparkles
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function Sidebar({
    conversations,
    activeId,
    onSelect,
    onNew,
    onDelete,
    onPin,
    collapsed,
    onToggle
}) {
    const { user, logout } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredConversations = conversations.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const pinnedConversations = filteredConversations.filter(c => c.isPinned);
    const regularConversations = filteredConversations.filter(c => !c.isPinned);

    return (
        <aside className={`
      flex flex-col bg-card border-r border-border 
      transition-all duration-300 ease-out
      ${collapsed ? 'w-16' : 'w-72'}
    `}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
                {!collapsed && (
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 ring-1 ring-primary/20">
                            <Sparkles className="w-5 h-5 text-primary-foreground fill-primary-foreground/10" />
                        </div>
                        <span className="font-bold text-foreground">KnowledgeAI</span>
                    </div>
                )}
                <button onClick={onToggle} className="btn-icon">
                    {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </button>
            </div>

            {/* New Chat Button */}
            <div className="p-3">
                <button
                    onClick={onNew}
                    className={`w-full btn-primary ${collapsed ? 'p-3' : ''}`}
                >
                    <Plus className="w-5 h-5" />
                    {!collapsed && <span>New Chat</span>}
                </button>
            </div>

            {/* Search */}
            {!collapsed && (
                <div className="px-3 pb-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search chats..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-secondary/50 border border-border rounded-lg
                         text-sm text-foreground placeholder-muted-foreground
                         focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>
                </div>
            )}

            {/* Conversations List */}
            <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
                {/* Pinned Section */}
                {pinnedConversations.length > 0 && (
                    <>
                        {!collapsed && (
                            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Pinned
                            </div>
                        )}
                        {pinnedConversations.map(conv => (
                            <ConversationItem
                                key={conv._id}
                                conversation={conv}
                                active={conv._id === activeId}
                                collapsed={collapsed}
                                onSelect={onSelect}
                                onDelete={onDelete}
                                onPin={onPin}
                            />
                        ))}
                    </>
                )}

                {/* Recent Section */}
                {!collapsed && regularConversations.length > 0 && (
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider mt-4">
                        Recent
                    </div>
                )}
                {regularConversations.map(conv => (
                    <ConversationItem
                        key={conv._id}
                        conversation={conv}
                        active={conv._id === activeId}
                        collapsed={collapsed}
                        onSelect={onSelect}
                        onDelete={onDelete}
                        onPin={onPin}
                    />
                ))}
            </nav>

            {/* Bottom Navigation */}
            <div className="border-t border-border p-2 space-y-1">
                <NavItem icon={FileText} label="Documents" collapsed={collapsed} href="/documents" />
                <NavItem icon={BarChart3} label="Analytics" collapsed={collapsed} href="/analytics" />
                <NavItem icon={Settings} label="Settings" collapsed={collapsed} href="/settings" />
            </div>

            {/* User Profile */}
            <div className="border-t border-border p-3">
                <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
                    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                        {user?.avatar ? (
                            <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <User className="w-5 h-5 text-muted-foreground" />
                        )}
                    </div>
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{user?.name || 'User'}</p>
                            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        </div>
                    )}
                    {!collapsed && (
                        <button onClick={logout} className="btn-icon p-1.5" title="Logout">
                            <LogOut className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
}

// Conversation list item
function ConversationItem({ conversation, active, collapsed, onSelect, onDelete, onPin }) {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div
            className={`
        group relative flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer
        transition-colors
        ${active
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                }
      `}
            onClick={() => onSelect(conversation._id)}
        >
            <MessageSquare className="w-4 h-4 flex-shrink-0" />

            {!collapsed && (
                <>
                    <span className="flex-1 truncate text-sm">{conversation.title}</span>

                    {conversation.isPinned && (
                        <Pin className="w-3 h-3 text-primary flex-shrink-0" />
                    )}

                    {/* Actions menu */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(!showMenu);
                        }}
                        className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground"
                    >
                        <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 top-full mt-1 w-36 bg-card border border-border rounded-lg shadow-xl z-20 py-1">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onPin(conversation._id);
                                    setShowMenu(false);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-secondary flex items-center gap-2"
                            >
                                <Pin className="w-4 h-4" />
                                {conversation.isPinned ? 'Unpin' : 'Pin'}
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(conversation._id);
                                    setShowMenu(false);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-destructive hover:bg-secondary flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// Navigation item
function NavItem({ icon: Icon, label, collapsed, href }) {
    return (
        <Link
            href={href}
            className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg
        text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors
        ${collapsed ? 'justify-center' : ''}
      `}
        >
            <Icon className="w-5 h-5" />
            {!collapsed && <span className="text-sm">{label}</span>}
        </Link>
    );
}
