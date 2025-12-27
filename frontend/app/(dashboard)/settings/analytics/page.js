'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import AnalyticsDashboard from '@/components/settings/AnalyticsDashboard';

export default function AnalyticsPage() {
    const { isAdminOrVisitor } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isAdminOrVisitor === false) {
            router.replace('/settings/profile');
        }
    }, [isAdminOrVisitor, router]);

    if (!isAdminOrVisitor) return null;

    return <AnalyticsDashboard />;
}
