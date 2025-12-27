'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { Check } from 'lucide-react';

const themes = [
    {
        id: 'emerald',
        name: 'Classic',
        primary: '#10B981',
        bg: 'bg-white',
        border: 'border-emerald-200'
    },
    {
        id: 'blue',
        name: 'Day',
        primary: '#0EA5E9',
        bg: 'bg-sky-50',
        border: 'border-sky-200'
    },
    {
        id: 'tinted',
        name: 'Tinted',
        primary: '#3B82F6',
        bg: 'bg-slate-800',
        border: 'border-slate-700'
    },
    {
        id: 'night',
        name: 'Night',
        primary: '#10B981',
        bg: 'bg-slate-950',
        border: 'border-slate-800'
    }
];

const ThemeSelector = () => {
    const { theme, setTheme, primaryColor, setPrimaryColor } = useAuth();

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">Themes</h3>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {themes.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={`group relative flex flex-col gap-2 rounded-xl border-2 p-3 text-left transition-all hover:border-primary/50 ${theme === t.id ? 'border-primary bg-primary/5' : 'border-border bg-card'
                            }`}
                    >
                        {/* Mock UI Preview */}
                        <div className={`aspect-[4/3] w-full rounded-lg ${t.bg} border ${t.border} p-2 space-y-2 overflow-hidden`}>
                            <div className="flex gap-1.5 opacity-50">
                                <div className="h-1.5 w-6 rounded-full bg-muted-foreground/40" />
                                <div className="h-1.5 w-4 rounded-full bg-muted-foreground/40" />
                            </div>
                            <div className="space-y-1.5 ml-4">
                                <div className="h-2 w-full rounded bg-primary/20" />
                                <div className="h-2 w-3/4 rounded bg-primary/20" />
                            </div>
                            <div className="mt-auto flex justify-center pb-1">
                                <div className="h-4 w-4 rounded-full border-2 border-primary/40 flex items-center justify-center">
                                    {theme === t.id && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-foreground">{t.name}</span>
                            {theme === t.id && (
                                <Check className="h-3 w-3 text-primary" />
                            )}
                        </div>

                        {theme === t.id && (
                            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">
                                <Check className="h-2.5 w-2.5" />
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Color Swatches */}
            <div className="space-y-4 pt-4">
                <h3 className="text-sm font-medium text-foreground">Primary Color</h3>
                <div className="flex flex-wrap items-center gap-3">
                    {[
                        '#10B981', // Emerald
                        '#3B82F6', // Blue
                        '#0EA5E9', // Sky
                        '#A855F7', // Purple
                        '#D97706', // Amber
                        '#EF4444', // Red
                        '#F43F5E', // Rose
                        '#64748B', // Slate
                    ].map((color) => (
                        <button
                            key={color}
                            onClick={() => setPrimaryColor(color)}
                            className={`h-8 w-8 rounded-full border-2 transition-all hover:scale-110 flex items-center justify-center ${primaryColor === color ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'
                                }`}
                            style={{ backgroundColor: color }}
                        >
                            {primaryColor === color && <Check className="h-4 w-4 text-white drop-shadow-sm" />}
                        </button>
                    ))}

                    {/* Custom Color Picker */}
                    <div className="relative group">
                        <input
                            type="color"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="absolute inset-0 opacity-0 w-8 h-8 cursor-pointer z-10"
                        />
                        <div className={`h-8 w-8 rounded-full border-2 bg-gradient-to-tr from-red-400 via-green-400 to-blue-400 transition-all group-hover:scale-110 flex items-center justify-center ${!['#10B981', '#3B82F6', '#0EA5E9', '#A855F7', '#D97706', '#EF4444', '#F43F5E', '#64748B'].includes(primaryColor) ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'}`}>
                            {!['#10B981', '#3B82F6', '#0EA5E9', '#A855F7', '#D97706', '#EF4444', '#F43F5E', '#64748B'].includes(primaryColor) && (
                                <Check className="h-4 w-4 text-white drop-shadow-sm" />
                            )}
                        </div>
                    </div>
                </div>
                <p className="text-[11px] text-muted-foreground">Select a preset color or use the picker for a custom brand color.</p>
            </div>
        </div>
    );
};

export default ThemeSelector;
