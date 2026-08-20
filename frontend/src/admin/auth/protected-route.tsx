'use client';

import type { ReactNode } from 'react';

import { Navigate, useLocation } from '@/shared/router';

import { AdminSplash } from '@/admin/components/admin-splash';
import { useAdminAuth } from '@/admin/auth/auth-context';
import { paths } from '@/routes/paths';

/**
 * Gate for authenticated admin routes.
 *
 * While the session is still resolving it renders a splash rather than
 * redirecting — otherwise a hard refresh on a protected page would bounce the
 * user to the login screen before the session check had a chance to answer.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
    const { status } = useAdminAuth();
    const location = useLocation();

    if (status === 'loading') {
        return <AdminSplash label="Checking your session…" />;
    }

    if (status === 'unauthenticated') {
        return (
            <Navigate
                to={paths.admin.login}
                replace
                /* Remember where they were headed so login can return them. */
                state={{ from: location.pathname + location.search }}
            />
        );
    }

    return <>{children}</>;
}
