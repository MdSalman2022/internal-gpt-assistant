'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import AIModelsSettings from '@/components/settings/AIModelsSettings';

export default function AIModelsPage() {
    const { isAdmin } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAdmin) {
            router.replace('/settings/profile');
        }
    }, [isAdmin, router]);

    if (!isAdmin) return null;

    return <AIModelsSettings />;
}
