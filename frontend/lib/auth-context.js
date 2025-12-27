'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [permissionsConfig, setPermissionsConfig] = useState(null);
    const [theme, setTheme] = useState('emerald');
    const [primaryColor, setPrimaryColor] = useState('#10B981');

    // Persisted values (to check for changes)
    const [persistedTheme, setPersistedTheme] = useState('emerald');
    const [persistedPrimaryColor, setPersistedPrimaryColor] = useState('#10B981');

    const isThemeDirty = theme !== persistedTheme || primaryColor !== persistedPrimaryColor;

    // Helper: Hex to HSL
    const hexToHsl = (hex) => {
        let r = 0, g = 0, b = 0;
        if (hex.length === 4) {
            r = "0x" + hex[1] + hex[1];
            g = "0x" + hex[2] + hex[2];
            b = "0x" + hex[3] + hex[3];
        } else if (hex.length === 7) {
            r = "0x" + hex[1] + hex[2];
            g = "0x" + hex[3] + hex[4];
            b = "0x" + hex[5] + hex[6];
        }
        r /= 255; g /= 255; b /= 255;
        let cmin = Math.min(r, g, b), cmax = Math.max(r, g, b), delta = cmax - cmin, h = 0, s = 0, l = 0;
        if (delta === 0) h = 0;
        else if (cmax === r) h = ((g - b) / delta) % 6;
        else if (cmax === g) h = (b - r) / delta + 2;
        else h = (r - g) / delta + 4;
        h = Math.round(h * 60);
        if (h < 0) h += 360;
        l = (cmax + cmin) / 2;
        s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
        s = +(s * 100).toFixed(1);
        l = +(l * 100).toFixed(1);
        return { h, s, l };
    };

    // Inject Primary Color CSS Variables
    const applyPrimaryColor = (hex, currentThemeId) => {
        const { h, s, l } = hexToHsl(hex);
        const root = document.documentElement;

        // Toggling 'dark' class based on theme
        // emerald, blue = light | tinted, night = dark
        const isDark = ['tinted', 'night'].includes(currentThemeId);
        if (isDark) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        // Comma-separated format for Tailwind/CSS HSL function
        root.style.setProperty('--primary-h', h);
        root.style.setProperty('--primary-s', `${s}%`);
        root.style.setProperty('--primary-l', `${l}%`);

        // Root format for direct use: hsl(var(--primary-h), var(--primary-s), var(--primary-l))
        root.style.setProperty('--current-primary', `${h}, ${s}%, ${l}%`);

        // Generate shades (using commas for Tailwind compatibility)
        const shades = {
            '50': 97, '100': 92, '200': 85, '300': 75, '400': 65,
            '500': l, '600': Math.max(0, l - 10), '700': Math.max(0, l - 20),
            '800': Math.max(0, l - 30), '900': Math.max(0, l - 40)
        };

        Object.entries(shades).forEach(([sh, light]) => {
            root.style.setProperty(`--primary-${sh}`, `${h}, ${s}%, ${light}%`);
        });

        // Surface tints: ADAPTIVE ATMOSPHERE (Low bleed for light themes, High for dark)
        const saturationMultiplier = isDark ? 1.0 : 0.25; // 75% reduction for light themes

        // 1. BG Tint
        const bgS = isDark
            ? Math.max(10, Math.min(s * 0.6, 28))
            : Math.max(2, Math.min(s * 0.1, 8)); // Very subtle for light
        root.style.setProperty('--primary-tint-bg-s', `${bgS}%`);

        // 2. Card Tint
        const cardS = isDark
            ? Math.max(15, Math.min(s * 0.8, 38))
            : Math.max(3, Math.min(s * 0.15, 12));
        root.style.setProperty('--primary-tint-card-s', `${cardS}%`);

        // 3. Secondary/Muted
        const secondaryS = isDark
            ? Math.max(20, Math.min(s * 1.0, 55))
            : Math.max(4, Math.min(s * 0.2, 15));
        root.style.setProperty('--primary-tint-secondary-s', `${secondaryS}%`);

        // 4. Accent
        const accentS = isDark
            ? Math.max(25, Math.min(s * 1.1, 75))
            : Math.max(30, Math.min(s * 1.1, 85)); // Keep vibrant accents for contrast
        root.style.setProperty('--primary-tint-accent-s', `${accentS}%`);
    };

    // Load theme and primary color on mount/user change
    useEffect(() => {
        const loadPreferences = () => {
            const savedTheme = user?.uiPreferences?.baseTheme || localStorage.getItem('app-theme') || 'emerald';
            const savedColor = user?.uiPreferences?.primaryColor || localStorage.getItem('app-primary-color') || '#10B981';

            setTheme(savedTheme);
            setPrimaryColor(savedColor);
            setPersistedTheme(savedTheme);
            setPersistedPrimaryColor(savedColor);

            document.documentElement.setAttribute('data-theme', savedTheme);
            applyPrimaryColor(savedColor, savedTheme);
        };

        loadPreferences();
    }, [user]);

    // Update active UI (preview)
    const updatePreview = (newTheme, newColor) => {
        if (newColor) {
            setPrimaryColor(newColor);
            applyPrimaryColor(newColor, theme);
        }
        if (newTheme) {
            setTheme(newTheme);
            document.documentElement.setAttribute('data-theme', newTheme);
            // Apply color with NEW theme context
            applyPrimaryColor(primaryColor, newTheme);
        }
    };

    const saveUIPreferences = async () => {
        setPersistedTheme(theme);
        setPersistedPrimaryColor(primaryColor);

        localStorage.setItem('app-theme', theme);
        localStorage.setItem('app-primary-color', primaryColor);

        if (user) {
            try {
                await fetch(`${API_URL}/api/auth/preferences`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ baseTheme: theme, primaryColor: primaryColor }),
                });
            } catch (error) {
                console.error('Failed to sync preferences to backend:', error);
            }
        }
    };

    const discardUIPreferences = () => {
        setTheme(persistedTheme);
        setPrimaryColor(persistedPrimaryColor);
        document.documentElement.setAttribute('data-theme', persistedTheme);
        applyPrimaryColor(persistedPrimaryColor, persistedTheme);
    };

    // Load permissions and auth on mount
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            // Load both in parallel
            const [meRes, permRes] = await Promise.all([
                fetch(`${API_URL}/api/auth/me`, { credentials: 'include' }),
                fetch(`${API_URL}/api/auth/permissions`, { credentials: 'include' })
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
    // Visitors have admin-like UI access for demo purposes
    const isAdminOrVisitor = isAdmin || isVisitor;

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
            isAdminOrVisitor,
            permissionsConfig,
            theme,
            primaryColor,
            isThemeDirty,
            setTheme: (t) => updatePreview(t, null),
            setPrimaryColor: (c) => updatePreview(null, c),
            saveTheme: saveUIPreferences,
            discardTheme: discardUIPreferences,
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
