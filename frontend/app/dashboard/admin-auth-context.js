'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAdminAuth();
    }, []);

    const checkAdminAuth = async () => {
        try {
            const res = await fetch(`${API_URL}/api/auth/me`, {
                credentials: 'include',
            });

            if (res.ok) {
                const data = await res.json();
                if (data.user?.platformRole === 'superadmin') {
                    setAdmin(data.user);
                } else {
                    // Not a superadmin
                    setAdmin(null);
                    if (!pathname.includes('/dashboard/login')) {
                        router.push('/dashboard/login');
                    }
                }
            } else {
                setAdmin(null);
                if (!pathname.includes('/dashboard/login')) {
                    router.push('/dashboard/login');
                }
            }
        } catch (error) {
            console.error('Admin auth check failed:', error);
            setAdmin(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const res = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Login failed');
        }

        if (data.user?.platformRole !== 'superadmin') {
            throw new Error('Access denied. Superadmin privileges required.');
        }

        setAdmin(data.user);
        return data.user;
    };

    const logout = async () => {
        try {
            await fetch(`${API_URL}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include',
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
        setAdmin(null);
        router.push('/dashboard/login');
    };

    return (
        <AdminAuthContext.Provider value={{ admin, loading, login, logout, checkAdminAuth }}>
            {children}
        </AdminAuthContext.Provider>
    );
}

export function useAdminAuth() {
    const context = useContext(AdminAuthContext);
    if (!context) {
        throw new Error('useAdminAuth must be used within AdminAuthProvider');
    }
    return context;
}
