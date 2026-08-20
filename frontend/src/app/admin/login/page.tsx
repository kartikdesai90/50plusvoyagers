'use client';

import AdminLoginPage from '@/admin/pages/login';
import { AdminAuthLayout } from '@/admin/layout/admin-auth-layout';

/**
 * Signing in, and nothing else.
 *
 * Outside the `(panel)` group on purpose: the login screen must not be behind
 * the guard that would redirect an unauthenticated visitor to it.
 */
export default function Page() {
    return (
        <AdminAuthLayout>
            <AdminLoginPage />
        </AdminAuthLayout>
    );
}
