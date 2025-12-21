'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    Plus, MessageSquare, FileText, BarChart3, Settings,
    ChevronLeft, ChevronRight, Pin, Trash2, MoreHorizontal,
    Search, LogOut, User
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
      flex flex-col bg-slate-900 border-r border-slate-800 
      transition-all duration-300 ease-out
      ${collapsed ? 'w-16' : 'w-72'}
    `}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
                {!collapsed && (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">K</span>
                        </div>
                        <span className="font-semibold text-white">KnowledgeAI</span>
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
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search chats..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg
                         text-sm text-slate-100 placeholder-slate-500
                         focus:outline-none focus:ring-1 focus:ring-primary-500"
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
                            <div className="px-2 py-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider">
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
                    <div className="px-2 py-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider mt-4">
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
            <div className="border-t border-slate-800 p-2 space-y-1">
                <NavItem icon={FileText} label="Documents" collapsed={collapsed} href="/documents" />
                <NavItem icon={BarChart3} label="Analytics" collapsed={collapsed} href="/analytics" />
                <NavItem icon={Settings} label="Settings" collapsed={collapsed} href="/settings" />
            </div>

            {/* User Profile */}
            <div className="border-t border-slate-800 p-3">
                <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
                    <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                        {user?.avatar ? (
                            <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <User className="w-5 h-5 text-slate-400" />
                        )}
                    </div>
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
                            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
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
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }
      `}
            onClick={() => onSelect(conversation._id)}
        >
            <MessageSquare className="w-4 h-4 flex-shrink-0" />

            {!collapsed && (
                <>
                    <span className="flex-1 truncate text-sm">{conversation.title}</span>

                    {conversation.isPinned && (
                        <Pin className="w-3 h-3 text-primary-400 flex-shrink-0" />
                    )}

                    {/* Actions menu */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowMenu(!showMenu);
                            }}
                            className="p-1 hover:bg-slate-700 rounded"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {showMenu && (
                            <div className="absolute right-0 top-full mt-1 w-36 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 py-1">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onPin(conversation._id);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"
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
                                    className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
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
        text-slate-400 hover:text-white hover:bg-slate-800 transition-colors
        ${collapsed ? 'justify-center' : ''}
      `}
        >
            <Icon className="w-5 h-5" />
            {!collapsed && <span className="text-sm">{label}</span>}
        </Link>
    );
}
