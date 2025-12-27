'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import AuditLogViewer from '@/components/settings/AuditLogViewer';

export default function AuditPage() {
    const { isAdmin } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAdmin) {
            router.replace('/settings/profile');
        }
    }, [isAdmin, router]);

    if (!isAdmin) return null;

    return <AuditLogViewer />;
}
