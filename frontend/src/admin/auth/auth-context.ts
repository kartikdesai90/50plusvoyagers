import { createContext, use } from 'react';

import type { AdminUser, AuthStatus, LoginCredentials } from '@/admin/auth/types';

export type AdminAuthContextValue = {
    user: AdminUser | null;
    status: AuthStatus;
    /** Resolves on success; throws so callers can surface field-level errors. */
    login: (credentials: LoginCredentials) => Promise<AdminUser>;
    logout: () => Promise<void>;
};

/**
 * Kept in its own module (no components) so Fast Refresh stays happy — the
 * provider component lives in `components/admin/auth-provider.tsx`.
 */
export const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function useAdminAuth(): AdminAuthContextValue {
    const context = use(AdminAuthContext);

    if (!context) {
        throw new Error('useAdminAuth must be used inside <AdminAuthProvider>.');
    }

    return context;
}
