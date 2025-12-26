'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [permissionsConfig, setPermissionsConfig] = useState(null);

    // Load permissions and auth on mount
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            // Load both in parallel
            const [meRes, permRes] = await Promise.all([
                fetch(`${API_URL}/api/auth/me`, { credentials: 'include' }),
                fetch(`${API_URL}/api/auth/permissions`)
            ]);

            if (meRes.ok) {
                const data = await meRes.json();
                setUser(data.user);
            }

            if (permRes.ok) {
                const config = await permRes.json();
                setPermissionsConfig(config);
            }
        } catch (error) {
            console.error('Auth/Permissions initialization failed:', error);
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
        if (!res.ok) throw new Error(data.error || 'Login failed');

        setUser(data.user);
        return data.user;
    };

    const register = async (name, email, password) => {
        const res = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');

        setUser(data.user);
        return data.user;
    };

    const logout = async () => {
        await fetch(`${API_URL}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include',
        });
        setUser(null);
    };

    // Role-based helpers (uses permissions from backend config)
    const hasPermission = useCallback((permission) => {
        if (!user?.role || !permissionsConfig?.roles) return false;
        const roleConfig = permissionsConfig.roles[user.role];
        return roleConfig?.permissions?.includes(permission) || false;
    }, [user?.role, permissionsConfig]);

    const hasRole = useCallback((...roles) => {
        if (!user?.role) return false;
        return roles.includes(user.role);
    }, [user?.role]);

    const isAdmin = user?.role === 'admin';
    const isVisitor = user?.role === 'visitor';
    const isEmployee = user?.role === 'employee';

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            register,
            logout,
            checkAuth,
            // Role helpers
            hasPermission,
            hasRole,
            isAdmin,
            isVisitor,
            isEmployee,
            permissionsConfig,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
