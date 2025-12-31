'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Demo page - Redirects to unified contact page
 * Keeping this for backwards compatibility with existing links
 */
export default function DemoPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/contact?type=demo');
    }, [router]);

    return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-black/20 border-t-black rounded-full animate-spin mx-auto mb-4" />
                <p className="text-zinc-600">Redirecting to contact page...</p>
            </div>
        </div>
    );
}
