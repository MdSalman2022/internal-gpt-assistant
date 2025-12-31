'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    LayoutDashboard,
    Building2,
    CreditCard,
    Users,
    MessageSquareMore,
    TrendingUp,
    Settings,
    LogOut,
    Shield,
    Bell,
    ChevronRight
} from 'lucide-react';
import { AdminAuthProvider, useAdminAuth } from './admin-auth-context';

const navItems = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
    { href: '/dashboard/organizations', label: 'Organizations', icon: Building2 },
    { href: '/dashboard/subscriptions', label: 'Subscriptions', icon: CreditCard },
    { href: '/dashboard/users', label: 'Users', icon: Users },
    { href: '/dashboard/demos', label: 'Demo Requests', icon: MessageSquareMore },
    { href: '/dashboard/analytics', label: 'Analytics', icon: TrendingUp },
];

const bottomNavItems = [
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

function AdminLayoutContent({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const { admin, loading, logout } = useAdminAuth();

    // Don't show layout on login page
    if (pathname === '/dashboard/login') {
        return <>{children}</>;
    }

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                    <p className="text-gray-500">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    // Redirect if not authenticated
    if (!admin) {
        return null;
    }

    const isActive = (href, exact = false) => {
        if (exact) return pathname === href;
        return pathname.startsWith(href);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] flex">
            {/* Sidebar */}
            <aside className="w-64 bg-[#12121a] border-r border-gray-800 flex flex-col fixed inset-y-0 left-0 z-30">
                {/* Logo */}
                <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-800">
                    <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <span className="text-white font-bold">InsightAI</span>
                        <span className="text-gray-500 text-xs block">Admin Panel</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 overflow-y-auto">
                    <div className="space-y-1">
                        {navItems.map((item) => {
                            const active = isActive(item.href, item.exact);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${active
                                            ? 'bg-violet-500/10 text-violet-400'
                                            : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                                        }`}
                                >
                                    <item.icon className={`w-5 h-5 ${active ? 'text-violet-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
                                    <span className="text-sm font-medium">{item.label}</span>
                                    {active && (
                                        <ChevronRight className="w-4 h-4 ml-auto" />
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    <div className="mt-8 pt-4 border-t border-gray-800">
                        <p className="px-3 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
                            System
                        </p>
                        {bottomNavItems.map((item) => {
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${active
                                            ? 'bg-violet-500/10 text-violet-400'
                                            : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                                        }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="text-sm font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* User Profile */}
                <div className="p-3 border-t border-gray-800">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/30">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
                            {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{admin?.name}</p>
                            <p className="text-gray-500 text-xs truncate">{admin?.email}</p>
                        </div>
                        <button
                            onClick={logout}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64">
                {/* Top Bar */}
                <header className="h-16 bg-[#12121a]/80 backdrop-blur-sm border-b border-gray-800 flex items-center justify-between px-6 sticky top-0 z-20">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span>Admin</span>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-white">
                            {navItems.find(item => isActive(item.href, item.exact))?.label ||
                                bottomNavItems.find(item => isActive(item.href))?.label ||
                                'Dashboard'}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-violet-500 rounded-full" />
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}

export default function AdminDashboardLayout({ children }) {
    return (
        <AdminAuthProvider>
            <AdminLayoutContent>{children}</AdminLayoutContent>
        </AdminAuthProvider>
    );
}
