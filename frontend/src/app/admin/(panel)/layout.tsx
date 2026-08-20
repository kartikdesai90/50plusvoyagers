'use client';

import type { ReactNode } from 'react';

import { AdminLayout } from '@/admin/layout/admin-layout';
import { ProtectedRoute } from '@/admin/auth/protected-route';

/**
 * Everything behind a session.
 *
 * A route group, so `(panel)` never appears in an address: `/admin`,
 * `/admin/blog` and the rest are exactly the URLs they always were. The two
 * tiers are in the order the old route tree had them — guard outside, shell
 * inside — so an unauthenticated visitor is redirected before the panel chrome
 * mounts rather than after it has painted.
 */
export default function PanelLayout({ children }: { children: ReactNode }) {
    return (
        <ProtectedRoute>
            <AdminLayout>{children}</AdminLayout>
        </ProtectedRoute>
    );
}
