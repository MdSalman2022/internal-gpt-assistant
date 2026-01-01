"use client"
import { useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
    User, Bell, Shield, Palette, Database, Key, Building2,
    LogOut, FileText, Users, Activity, Zap, DollarSign, CreditCard, UserPlus, Loader2
} from 'lucide-react';

// Settings navigation items
const getSettingsNavItems = (isAdminOrVisitor) => [
    { href: '/settings/profile', label: 'Profile', icon: User },
    { href: '/settings/usage', label: 'Usage', icon: Zap },
    ...(isAdminOrVisitor ? [{ href: '/settings/billing', label: 'Billing', icon: CreditCard }] : []),
    ...(isAdminOrVisitor ? [{ href: '/settings/team', label: 'Team', icon: UserPlus }] : []),
    ...(isAdminOrVisitor ? [{ href: '/settings/ai-models', label: 'AI Models', icon: Database }] : []),
    ...(isAdminOrVisitor ? [{ href: '/settings/cost-controls', label: 'Cost Controls', icon: DollarSign }] : []),
    ...(isAdminOrVisitor ? [{ href: '/settings/analytics', label: 'Analytics', icon: Activity }] : []),
    { href: '/settings/documents', label: 'Documents', icon: FileText },
    ...(isAdminOrVisitor ? [{ href: '/settings/users', label: 'Users', icon: Users }] : []),
    ...(isAdminOrVisitor ? [{ href: '/settings/organization', label: 'Organization', icon: Building2 }] : []),
    ...(isAdminOrVisitor ? [{ href: '/settings/audit', label: 'Audit Logs', icon: Shield }] : []),
    { href: '/settings/notifications', label: 'Notifications', icon: Bell },
    { href: '/settings/security', label: 'Security', icon: Key },
    { href: '/settings/appearance', label: 'Appearance', icon: Palette },
    { href: '/settings/integrations', label: 'Integrations', icon: Database },
];

const RESTRICTED_ROUTES = [
    '/settings/billing',
    '/settings/team',
    '/settings/ai-models',
    '/settings/cost-controls',
    '/settings/analytics',
    '/settings/users',
    '/settings/organization',
    '/settings/audit'
];

export default function SettingsLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const { logout, isAdminOrVisitor, loading } = useAuth();

    const navItems = getSettingsNavItems(isAdminOrVisitor);

    useEffect(() => {
        if (!loading && !isAdminOrVisitor && RESTRICTED_ROUTES.includes(pathname)) {
            router.push('/settings/profile');
        }
    }, [pathname, loading, isAdminOrVisitor, router]);

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground text-sm">Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Mobile Header - simple title bar (hamburger menu is provided by DashboardLayout) */}
            <div className="md:hidden">
                <header className="flex items-center gap-3 px-3 py-4 border-b border-border pl-14">
                    <h1 className="text-lg font-semibold text-foreground">Settings</h1>
                </header>
            </div>

            {/* Desktop Header */}
            <header className="hidden md:flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                    <h1 className="text-xl font-semibold text-foreground">Settings</h1>
                    <p className="text-sm text-muted-foreground">Manage account and system preferences</p>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Desktop Tabs Sidebar - Hidden on mobile */}
                <nav className="hidden md:flex w-56 flex-col border-r border-border p-3 flex-shrink-0 overflow-y-auto bg-card">
                    {navItems.map(item => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors text-left
                                    ${isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'}`}
                            >
                                <item.icon className="w-4 h-4" />
                                <span className="text-sm font-medium">{item.label}</span>
                            </Link>
                        );
                    })}

                    <div className="mt-8 pt-4 border-t border-border">
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors text-left">
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm font-medium">Logout</span>
                        </button>
                    </div>
                </nav>

                {/* Content Area */}
                <div className="flex-1 bg-background overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}
