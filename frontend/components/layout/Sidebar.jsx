'use client';

import Link from 'next/link';
import VerifiedBadge from '../ui/VerifiedBadge';
import { usePathname } from 'next/navigation';
import {
    Sparkles, ChevronLeft, Plus, MessageCircle, Pencil, Trash2, Check,
    X as XIcon, LogOut, MoreHorizontal
} from 'lucide-react';
import { useState } from 'react';

export default function Sidebar({
    sidebarOpen,
    setSidebarOpen,
    recentChats,
    currentConversationId,
    editingChatId,
    editTitle,
    setEditTitle,
    hoveredChatId,
    setHoveredChatId,
    handleNewChat,
    handleStartRename,
    handleSaveRename,
    handleCancelRename,
    handleDeleteChat,
    visibleNavItems,
    user,
    handleLogout
}) {
    const pathname = usePathname();

    return (
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
                        bg-primary text-primary-foreground font-medium
                        border border-primary/20 hover:opacity-90
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
                    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 border border-border overflow-hidden">
                        {user?.avatar ? (
                            <img 
                                src={user.avatar} 
                                alt={user.name} 
                                className="w-full h-full object-cover" 
                            />
                        ) : (
                            <span className="text-foreground text-sm font-medium">
                                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                        )}
                    </div>
                    {sidebarOpen && (
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                                <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
                                {user?.isVerified && (
                                    <VerifiedBadge className="w-3.5 h-3.5 text-blue-500" />
                                )}
                            </div>
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
    );
}
