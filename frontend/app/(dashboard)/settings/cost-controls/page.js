'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import CostControlsAdmin from '@/components/settings/CostControlsAdmin';

export default function CostControlsPage() {
    const { isAdmin } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAdmin) {
            router.replace('/settings/profile');
        }
    }, [isAdmin, router]);

    if (!isAdmin) return null;

    return (
        <div className="p-6">
            <CostControlsAdmin />
        </div>
    );
}
